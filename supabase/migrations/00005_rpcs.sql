-- Join group via invite token
-- Validates expiry, revocation, max uses; inserts membership
create or replace function public.join_group(invite_token uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  inv record;
  grp record;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from public.group_invites
  where token = invite_token;

  if inv is null then
    raise exception 'Invalid invite link';
  end if;

  if inv.revoked_at is not null then
    raise exception 'This invite has been revoked';
  end if;

  if inv.expires_at < now() then
    raise exception 'This invite has expired';
  end if;

  if inv.max_uses is not null and inv.use_count >= inv.max_uses then
    raise exception 'This invite has reached its maximum uses';
  end if;

  select * into grp from public.groups
  where id = inv.group_id and deleted_at is null;

  if grp is null then
    raise exception 'Group not found';
  end if;

  -- Check if already a member
  if exists (select 1 from public.group_members where group_id = inv.group_id and user_id = uid) then
    return jsonb_build_object('group_id', inv.group_id, 'already_member', true);
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (inv.group_id, uid, 'member');

  update public.group_invites
  set use_count = use_count + 1
  where token = invite_token;

  return jsonb_build_object('group_id', inv.group_id, 'already_member', false);
end;
$$;

-- Create expense atomically with payers and shares
create or replace function public.create_expense(payload jsonb)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  gid uuid := (payload->>'group_id')::uuid;
  exp_id uuid;
  amount bigint := (payload->>'amount_minor')::bigint;
  payer_sum bigint := 0;
  share_sum bigint := 0;
  p jsonb;
  s jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from public.group_members where group_id = gid and user_id = uid) then
    raise exception 'Not a member of this group';
  end if;

  -- Validate payer sum
  for p in select * from jsonb_array_elements(payload->'payers') loop
    payer_sum := payer_sum + (p->>'paid_minor')::bigint;
  end loop;

  if payer_sum <> amount then
    raise exception 'Payer sum (%) does not match expense amount (%)', payer_sum, amount;
  end if;

  -- Validate share sum
  for s in select * from jsonb_array_elements(payload->'shares') loop
    share_sum := share_sum + (s->>'owed_minor')::bigint;
  end loop;

  if share_sum <> amount then
    raise exception 'Share sum (%) does not match expense amount (%)', share_sum, amount;
  end if;

  -- Insert expense
  insert into public.expenses (
    group_id, description, amount_minor, currency, category,
    expense_date, notes, is_payment, created_by, updated_by
  ) values (
    gid,
    payload->>'description',
    amount,
    coalesce(payload->>'currency', 'INR'),
    coalesce(payload->>'category', 'general'),
    coalesce((payload->>'expense_date')::date, current_date),
    payload->>'notes',
    coalesce((payload->>'is_payment')::boolean, false),
    uid,
    uid
  ) returning id into exp_id;

  -- Insert payers
  insert into public.expense_payers (expense_id, user_id, paid_minor)
  select exp_id, (p->>'user_id')::uuid, (p->>'paid_minor')::bigint
  from jsonb_array_elements(payload->'payers') p;

  -- Insert shares
  insert into public.expense_shares (expense_id, user_id, owed_minor)
  select exp_id, (s->>'user_id')::uuid, (s->>'owed_minor')::bigint
  from jsonb_array_elements(payload->'shares') s;

  return exp_id;
end;
$$;

-- Update expense atomically
create or replace function public.update_expense(payload jsonb)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  eid uuid := (payload->>'id')::uuid;
  exp record;
  amount bigint := (payload->>'amount_minor')::bigint;
  payer_sum bigint := 0;
  share_sum bigint := 0;
  p jsonb;
  s jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into exp from public.expenses where id = eid and deleted_at is null;
  if exp is null then
    raise exception 'Expense not found';
  end if;

  if not exists (select 1 from public.group_members where group_id = exp.group_id and user_id = uid) then
    raise exception 'Not a member of this group';
  end if;

  -- Validate sums
  for p in select * from jsonb_array_elements(payload->'payers') loop
    payer_sum := payer_sum + (p->>'paid_minor')::bigint;
  end loop;

  if payer_sum <> amount then
    raise exception 'Payer sum (%) does not match expense amount (%)', payer_sum, amount;
  end if;

  for s in select * from jsonb_array_elements(payload->'shares') loop
    share_sum := share_sum + (s->>'owed_minor')::bigint;
  end loop;

  if share_sum <> amount then
    raise exception 'Share sum (%) does not match expense amount (%)', share_sum, amount;
  end if;

  -- Update expense
  update public.expenses set
    description = coalesce(payload->>'description', description),
    amount_minor = amount,
    currency = coalesce(payload->>'currency', currency),
    category = coalesce(payload->>'category', category),
    expense_date = coalesce((payload->>'expense_date')::date, expense_date),
    notes = payload->>'notes',
    is_payment = coalesce((payload->>'is_payment')::boolean, is_payment),
    updated_by = uid,
    updated_at = now()
  where id = eid;

  -- Replace payers
  delete from public.expense_payers where expense_id = eid;
  insert into public.expense_payers (expense_id, user_id, paid_minor)
  select eid, (p->>'user_id')::uuid, (p->>'paid_minor')::bigint
  from jsonb_array_elements(payload->'payers') p;

  -- Replace shares
  delete from public.expense_shares where expense_id = eid;
  insert into public.expense_shares (expense_id, user_id, owed_minor)
  select eid, (s->>'user_id')::uuid, (s->>'owed_minor')::bigint
  from jsonb_array_elements(payload->'shares') s;
end;
$$;

-- Get invite info (public, for the join page preview)
create or replace function public.get_invite_info(invite_token uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  inv record;
  grp record;
  inviter record;
begin
  select * into inv from public.group_invites where token = invite_token;

  if inv is null or inv.revoked_at is not null then
    return jsonb_build_object('valid', false, 'reason', 'Invalid or revoked invite');
  end if;

  if inv.expires_at < now() then
    return jsonb_build_object('valid', false, 'reason', 'Invite has expired');
  end if;

  if inv.max_uses is not null and inv.use_count >= inv.max_uses then
    return jsonb_build_object('valid', false, 'reason', 'Invite has reached its maximum uses');
  end if;

  select * into grp from public.groups where id = inv.group_id and deleted_at is null;
  if grp is null then
    return jsonb_build_object('valid', false, 'reason', 'Group not found');
  end if;

  select display_name into inviter from public.profiles where id = inv.created_by;

  return jsonb_build_object(
    'valid', true,
    'group_name', grp.name,
    'group_type', grp.type,
    'group_icon', grp.icon,
    'invited_by', inviter.display_name
  );
end;
$$;
