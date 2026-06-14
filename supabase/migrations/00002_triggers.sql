-- Auto-create profile on auth.users insert with round-robin color
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  next_color int;
begin
  select coalesce(max(color) + 1, 0) % 8 into next_color from public.profiles;

  insert into public.profiles (id, display_name, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    next_color
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Enforce sum invariant: sum(payers.paid_minor) = expense.amount_minor = sum(shares.owed_minor)
-- This runs after expense_payers or expense_shares are modified
create or replace function public.check_expense_balance()
returns trigger
language plpgsql
as $$
declare
  exp_amount bigint;
  payer_sum bigint;
  share_sum bigint;
begin
  select amount_minor into exp_amount
  from public.expenses
  where id = coalesce(new.expense_id, old.expense_id);

  if exp_amount is null then
    return coalesce(new, old);
  end if;

  select coalesce(sum(paid_minor), 0) into payer_sum
  from public.expense_payers
  where expense_id = coalesce(new.expense_id, old.expense_id);

  select coalesce(sum(owed_minor), 0) into share_sum
  from public.expense_shares
  where expense_id = coalesce(new.expense_id, old.expense_id);

  -- Only enforce when both sides have rows (allows atomic inserts via RPC)
  if payer_sum > 0 and share_sum > 0 then
    if payer_sum <> exp_amount then
      raise exception 'Payer sum (%) does not match expense amount (%)', payer_sum, exp_amount;
    end if;
    if share_sum <> exp_amount then
      raise exception 'Share sum (%) does not match expense amount (%)', share_sum, exp_amount;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create constraint trigger check_payers_balance
  after insert or update on public.expense_payers
  deferrable initially deferred
  for each row
  execute function public.check_expense_balance();

create constraint trigger check_shares_balance
  after insert or update on public.expense_shares
  deferrable initially deferred
  for each row
  execute function public.check_expense_balance();
