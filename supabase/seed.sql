-- Seed data for local development
-- Run after migrations. Assumes 4 demo users have been created in Supabase Auth
-- with these specific UUIDs (create them manually or via the dashboard).

-- Demo user UUIDs (replace if your auth setup generates different ones)
-- User 1: Priya   - 00000000-0000-0000-0000-000000000001
-- User 2: Ravi    - 00000000-0000-0000-0000-000000000002
-- User 3: Anika   - 00000000-0000-0000-0000-000000000003
-- User 4: Karthik - 00000000-0000-0000-0000-000000000004

-- Profiles (normally created by trigger, but seed manually for demo)
insert into public.profiles (id, display_name, color, default_currency) values
  ('00000000-0000-0000-0000-000000000001', 'Priya', 0, 'INR'),
  ('00000000-0000-0000-0000-000000000002', 'Ravi', 1, 'INR'),
  ('00000000-0000-0000-0000-000000000003', 'Anika', 2, 'INR'),
  ('00000000-0000-0000-0000-000000000004', 'Karthik', 3, 'INR')
on conflict (id) do nothing;

-- Groups
insert into public.groups (id, name, type, icon, simplify_debts, created_by) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Goa Trip 🏖️', 'trip', '🏖️', true,
   '00000000-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Flat 12B', 'home', '🏠', true,
   '00000000-0000-0000-0000-000000000002');

-- Group members
-- Goa Trip: Priya (admin), Ravi, Anika, Karthik
insert into public.group_members (group_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'member');

-- Flat 12B: Ravi (admin), Priya, Anika
insert into public.group_members (group_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'member');

-- ── Goa Trip Expenses ──

-- 1. Scooter rentals (equal split, Priya paid)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Scooter rentals', 180000, 'INR', 'transport', '2025-12-15',
        '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 180000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 45000),
  ('eeeeeeee-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 45000),
  ('eeeeeeee-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 45000),
  ('eeeeeeee-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 45000);

-- 2. Dinner at Fisherman's Wharf (Ravi paid, equal 4-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Dinner at Fisherman''s Wharf', 320000, 'INR', 'food', '2025-12-15',
        '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 320000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 80000),
  ('eeeeeeee-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 80000),
  ('eeeeeeee-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 80000),
  ('eeeeeeee-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 80000);

-- 3. Cab from airport (Karthik paid, equal 4-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Cab from airport', 250000, 'INR', 'transport', '2025-12-14',
        '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 250000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 62500),
  ('eeeeeeee-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 62500),
  ('eeeeeeee-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 62500),
  ('eeeeeeee-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 62500);

-- 4. Groceries (Anika paid, equal 4-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Groceries for villa', 145000, 'INR', 'groceries', '2025-12-15',
        '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 145000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 36250),
  ('eeeeeeee-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 36250),
  ('eeeeeeee-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 36250),
  ('eeeeeeee-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 36250);

-- 5. Beach shack lunch (Priya paid, unequal — Ravi had drinks +₹200)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, notes, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Beach shack lunch', 200000, 'INR', 'food', '2025-12-16',
        'Ravi had extra drinks', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 200000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 45000),
  ('eeeeeeee-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 65000),
  ('eeeeeeee-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 45000),
  ('eeeeeeee-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 45000);

-- 6. Parasailing (Ravi paid, only Ravi + Karthik)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Parasailing', 300000, 'INR', 'entertainment', '2025-12-16',
        '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 300000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 150000),
  ('eeeeeeee-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', 150000);

-- 7. Souvenirs (Anika paid, 3-way: Priya, Anika, Karthik)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Souvenirs', 90000, 'INR', 'shopping', '2025-12-17',
        '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 90000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 30000),
  ('eeeeeeee-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 30000),
  ('eeeeeeee-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', 30000);

-- 8. Villa booking (multi-payer: Priya ₹5000 + Ravi ₹5000, equal 4-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Villa booking (2 nights)', 1000000, 'INR', 'travel', '2025-12-14',
        '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
insert into public.expense_payers values
  ('eeeeeeee-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 500000),
  ('eeeeeeee-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', 500000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 250000),
  ('eeeeeeee-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', 250000),
  ('eeeeeeee-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 250000),
  ('eeeeeeee-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', 250000);

-- 9. Settlement: Karthik paid Priya ₹600
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, is_payment, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000009', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Payment', 60000, 'INR', 'general', '2025-12-18', true,
        '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 60000);
insert into public.expense_shares values ('eeeeeeee-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 60000);

-- ── Flat 12B Expenses ──

-- 10. June rent (Ravi paid, equal 3-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000002',
        'June rent', 4500000, 'INR', 'rent', '2025-06-01',
        '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 4500000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 1500000),
  ('eeeeeeee-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 1500000),
  ('eeeeeeee-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', 1500000);

-- 11. Electricity bill (Priya paid, equal 3-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-000000000002',
        'Electricity bill - June', 285000, 'INR', 'utilities', '2025-06-10',
        '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 285000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 95000),
  ('eeeeeeee-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 95000),
  ('eeeeeeee-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003', 95000);

-- 12. WiFi (Anika paid, equal 3-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000012', 'aaaaaaaa-0000-0000-0000-000000000002',
        'WiFi recharge', 99900, 'INR', 'utilities', '2025-06-05',
        '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', 99900);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 33300),
  ('eeeeeeee-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 33300),
  ('eeeeeeee-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', 33300);

-- 13. House supplies (Priya paid, equal 3-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000013', 'aaaaaaaa-0000-0000-0000-000000000002',
        'House supplies (cleaning, soap)', 175000, 'INR', 'groceries', '2025-06-08',
        '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 175000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 58334),
  ('eeeeeeee-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', 58333),
  ('eeeeeeee-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000003', 58333);

-- 14. Cook salary (Ravi paid, equal 3-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000014', 'aaaaaaaa-0000-0000-0000-000000000002',
        'Cook salary - June', 600000, 'INR', 'general', '2025-06-01',
        '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', 600000);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 200000),
  ('eeeeeeee-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', 200000),
  ('eeeeeeee-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000003', 200000);

-- 15. Gas cylinder (Anika paid, equal 3-way)
insert into public.expenses (id, group_id, description, amount_minor, currency, category, expense_date, created_by, updated_by)
values ('eeeeeeee-0000-0000-0000-000000000015', 'aaaaaaaa-0000-0000-0000-000000000002',
        'Gas cylinder refill', 89500, 'INR', 'utilities', '2025-06-12',
        '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003');
insert into public.expense_payers values ('eeeeeeee-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000003', 89500);
insert into public.expense_shares values
  ('eeeeeeee-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 29834),
  ('eeeeeeee-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000002', 29833),
  ('eeeeeeee-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000003', 29833);
