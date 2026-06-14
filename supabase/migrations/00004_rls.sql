-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_payers enable row level security;
alter table public.expense_shares enable row level security;

-- Helper: is user a member of this group?
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- Helper: is user an admin of this group?
create or replace function public.is_group_admin(gid uuid)
returns boolean
language sql
security definer stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── Profiles ──
-- Read: co-members can see basic profile info
create policy "profiles_select" on public.profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
  )
);

-- Write: own profile only
create policy "profiles_update" on public.profiles for update using (id = auth.uid());

-- ── Groups ──
create policy "groups_select" on public.groups for select using (
  public.is_group_member(id)
);

create policy "groups_insert" on public.groups for insert with check (
  created_by = auth.uid()
);

create policy "groups_update" on public.groups for update using (
  public.is_group_admin(id)
);

-- ── Group members ──
create policy "group_members_select" on public.group_members for select using (
  public.is_group_member(group_id)
);

-- Insert handled by join_group RPC and group creation; no direct insert
create policy "group_members_insert" on public.group_members for insert with check (
  user_id = auth.uid()
);

-- Delete: member can leave (own row), or admin can remove
create policy "group_members_delete" on public.group_members for delete using (
  user_id = auth.uid() or public.is_group_admin(group_id)
);

-- ── Group invites ──
create policy "group_invites_select" on public.group_invites for select using (
  public.is_group_member(group_id)
);

create policy "group_invites_insert" on public.group_invites for insert with check (
  public.is_group_admin(group_id)
);

create policy "group_invites_update" on public.group_invites for update using (
  public.is_group_admin(group_id)
);

-- ── Expenses ──
create policy "expenses_select" on public.expenses for select using (
  public.is_group_member(group_id)
);

create policy "expenses_insert" on public.expenses for insert with check (
  public.is_group_member(group_id)
);

create policy "expenses_update" on public.expenses for update using (
  public.is_group_member(group_id)
);

-- ── Expense payers ──
create policy "expense_payers_select" on public.expense_payers for select using (
  exists (
    select 1 from public.expenses e
    where e.id = expense_payers.expense_id
    and public.is_group_member(e.group_id)
  )
);

create policy "expense_payers_insert" on public.expense_payers for insert with check (
  exists (
    select 1 from public.expenses e
    where e.id = expense_payers.expense_id
    and public.is_group_member(e.group_id)
  )
);

create policy "expense_payers_delete" on public.expense_payers for delete using (
  exists (
    select 1 from public.expenses e
    where e.id = expense_payers.expense_id
    and public.is_group_member(e.group_id)
  )
);

-- ── Expense shares ──
create policy "expense_shares_select" on public.expense_shares for select using (
  exists (
    select 1 from public.expenses e
    where e.id = expense_shares.expense_id
    and public.is_group_member(e.group_id)
  )
);

create policy "expense_shares_insert" on public.expense_shares for insert with check (
  exists (
    select 1 from public.expenses e
    where e.id = expense_shares.expense_id
    and public.is_group_member(e.group_id)
  )
);

create policy "expense_shares_delete" on public.expense_shares for delete using (
  exists (
    select 1 from public.expenses e
    where e.id = expense_shares.expense_id
    and public.is_group_member(e.group_id)
  )
);
