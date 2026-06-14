-- Group balances view: net_minor = total paid - total owed per user per group
-- Positive = is owed money, negative = owes money
create or replace view public.group_balances as
with paid as (
  select e.group_id, ep.user_id, sum(ep.paid_minor) as total_paid
  from public.expense_payers ep
  join public.expenses e on e.id = ep.expense_id
  where e.deleted_at is null
  group by e.group_id, ep.user_id
),
owed as (
  select e.group_id, es.user_id, sum(es.owed_minor) as total_owed
  from public.expense_shares es
  join public.expenses e on e.id = es.expense_id
  where e.deleted_at is null
  group by e.group_id, es.user_id
)
select
  gm.group_id,
  gm.user_id,
  coalesce(p.total_paid, 0) - coalesce(o.total_owed, 0) as net_minor
from public.group_members gm
left join paid p on p.group_id = gm.group_id and p.user_id = gm.user_id
left join owed o on o.group_id = gm.group_id and o.user_id = gm.user_id;
