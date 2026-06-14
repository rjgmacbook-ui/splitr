-- Change expense_date from date to timestamptz so we can store time as well
alter table public.expenses
  alter column expense_date type timestamptz using expense_date::timestamptz,
  alter column expense_date set default now();

-- Recreate create_expense with timestamptz cast
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

  insert into public.expenses (
    group_id, description, amount_minor, currency, category,
    expense_date, notes, is_payment, created_by, updated_by
  ) values (
    gid,
    payload->>'description',
    amount,
    coalesce(payload->>'currency', 'INR'),
    coalesce(payload->>'category', 'general'),
    coalesce((payload->>'expense_date')::timestamptz, now()),
    payload->>'notes',
    coalesce((payload->>'is_payment')::boolean, false),
    uid,
    uid
  ) returning id into exp_id;

  insert into public.expense_payers (expense_id, user_id, paid_minor)
  select exp_id, (pe->>'user_id')::uuid, (pe->>'paid_minor')::bigint
  from jsonb_array_elements(payload->'payers') pe;

  insert into public.expense_shares (expense_id, user_id, owed_minor)
  select exp_id, (sh->>'user_id')::uuid, (sh->>'owed_minor')::bigint
  from jsonb_array_elements(payload->'shares') sh;

  return exp_id;
end;
$$;

-- Recreate update_expense with timestamptz cast
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

  update public.expenses set
    description = coalesce(payload->>'description', description),
    amount_minor = amount,
    currency = coalesce(payload->>'currency', currency),
    category = coalesce(payload->>'category', category),
    expense_date = coalesce((payload->>'expense_date')::timestamptz, expense_date),
    notes = payload->>'notes',
    is_payment = coalesce((payload->>'is_payment')::boolean, is_payment),
    updated_by = uid,
    updated_at = now()
  where id = eid;

  delete from public.expense_payers where expense_id = eid;
  insert into public.expense_payers (expense_id, user_id, paid_minor)
  select eid, (pe->>'user_id')::uuid, (pe->>'paid_minor')::bigint
  from jsonb_array_elements(payload->'payers') pe;

  delete from public.expense_shares where expense_id = eid;
  insert into public.expense_shares (expense_id, user_id, owed_minor)
  select eid, (sh->>'user_id')::uuid, (sh->>'owed_minor')::bigint
  from jsonb_array_elements(payload->'shares') sh;
end;
$$;
