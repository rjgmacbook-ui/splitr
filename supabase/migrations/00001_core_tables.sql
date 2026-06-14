-- Core tables for Splitr

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  color int not null default 0 check (color >= 0 and color <= 7),
  upi_id text,
  default_currency char(3) not null default 'INR',
  created_at timestamptz not null default now()
);

-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'other' check (type in ('trip', 'home', 'couple', 'other')),
  icon text,
  simplify_debts boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Group members
create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Group invites
create table public.group_invites (
  token uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses int,
  use_count int not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  description text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'INR',
  category text not null default 'general' check (
    category in ('food', 'groceries', 'transport', 'rent', 'utilities',
                 'entertainment', 'shopping', 'travel', 'medical', 'general')
  ),
  expense_date date not null default current_date,
  notes text,
  is_payment boolean not null default false,
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Expense payers
create table public.expense_payers (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  paid_minor bigint not null check (paid_minor > 0),
  primary key (expense_id, user_id)
);

-- Expense shares
create table public.expense_shares (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  owed_minor bigint not null check (owed_minor >= 0),
  primary key (expense_id, user_id)
);

-- Indexes for common queries
create index idx_group_members_user on public.group_members(user_id);
create index idx_expenses_group on public.expenses(group_id) where deleted_at is null;
create index idx_expenses_date on public.expenses(group_id, expense_date desc) where deleted_at is null;
create index idx_expense_payers_user on public.expense_payers(user_id);
create index idx_expense_shares_user on public.expense_shares(user_id);
create index idx_group_invites_group on public.group_invites(group_id);
