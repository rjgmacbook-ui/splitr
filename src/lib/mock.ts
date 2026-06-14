import type { Profile, Group, GroupMember, GroupBalance, Expense, ExpensePayer, ExpenseShare } from '@/types/database'

export const MOCK_PROFILES: Profile[] = [
  { id: 'u1', display_name: 'Priya', color: 0, upi_id: null, default_currency: 'INR', created_at: '2025-12-01T00:00:00Z' },
  { id: 'u2', display_name: 'Ravi', color: 1, upi_id: 'ravi@upi', default_currency: 'INR', created_at: '2025-12-01T00:00:00Z' },
  { id: 'u3', display_name: 'Anika', color: 2, upi_id: null, default_currency: 'INR', created_at: '2025-12-01T00:00:00Z' },
  { id: 'u4', display_name: 'Karthik', color: 3, upi_id: null, default_currency: 'INR', created_at: '2025-12-01T00:00:00Z' },
]

export const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: 'Goa Trip', type: 'trip', icon: '🏖️', simplify_debts: true, created_by: 'u1', created_at: '2025-12-14T00:00:00Z', deleted_at: null },
  { id: 'g2', name: 'Flat 12B', type: 'home', icon: '🏠', simplify_debts: true, created_by: 'u2', created_at: '2025-06-01T00:00:00Z', deleted_at: null },
]

export const MOCK_MEMBERS: (GroupMember & { profile: Profile })[] = [
  { group_id: 'g1', user_id: 'u1', role: 'admin', joined_at: '2025-12-14T00:00:00Z', profile: MOCK_PROFILES[0]! },
  { group_id: 'g1', user_id: 'u2', role: 'member', joined_at: '2025-12-14T00:00:00Z', profile: MOCK_PROFILES[1]! },
  { group_id: 'g1', user_id: 'u3', role: 'member', joined_at: '2025-12-14T00:00:00Z', profile: MOCK_PROFILES[2]! },
  { group_id: 'g1', user_id: 'u4', role: 'member', joined_at: '2025-12-14T00:00:00Z', profile: MOCK_PROFILES[3]! },
  { group_id: 'g2', user_id: 'u2', role: 'admin', joined_at: '2025-06-01T00:00:00Z', profile: MOCK_PROFILES[1]! },
  { group_id: 'g2', user_id: 'u1', role: 'member', joined_at: '2025-06-01T00:00:00Z', profile: MOCK_PROFILES[0]! },
  { group_id: 'g2', user_id: 'u3', role: 'member', joined_at: '2025-06-01T00:00:00Z', profile: MOCK_PROFILES[2]! },
]

export const MOCK_BALANCES: GroupBalance[] = [
  { group_id: 'g1', user_id: 'u1', net_minor: 218750 },
  { group_id: 'g1', user_id: 'u2', net_minor: 146250 },
  { group_id: 'g1', user_id: 'u3', net_minor: -138750 },
  { group_id: 'g1', user_id: 'u4', net_minor: -226250 },
  { group_id: 'g2', user_id: 'u1', net_minor: 73166 },
  { group_id: 'g2', user_id: 'u2', net_minor: -3228167 },
  { group_id: 'g2', user_id: 'u3', net_minor: -44967 },
]

export const MOCK_EXPENSES: (Expense & { payers: ExpensePayer[]; shares: ExpenseShare[] })[] = [
  {
    id: 'e1', group_id: 'g1', description: 'Scooter rentals', amount_minor: 180000, currency: 'INR',
    category: 'transport', expense_date: '2025-12-15', notes: null, is_payment: false,
    created_by: 'u1', updated_by: 'u1', created_at: '2025-12-15T10:00:00Z', updated_at: '2025-12-15T10:00:00Z', deleted_at: null,
    payers: [{ expense_id: 'e1', user_id: 'u1', paid_minor: 180000 }],
    shares: [
      { expense_id: 'e1', user_id: 'u1', owed_minor: 45000 },
      { expense_id: 'e1', user_id: 'u2', owed_minor: 45000 },
      { expense_id: 'e1', user_id: 'u3', owed_minor: 45000 },
      { expense_id: 'e1', user_id: 'u4', owed_minor: 45000 },
    ],
  },
  {
    id: 'e2', group_id: 'g1', description: "Dinner at Fisherman's Wharf", amount_minor: 320000, currency: 'INR',
    category: 'food', expense_date: '2025-12-15', notes: null, is_payment: false,
    created_by: 'u2', updated_by: 'u2', created_at: '2025-12-15T20:00:00Z', updated_at: '2025-12-15T20:00:00Z', deleted_at: null,
    payers: [{ expense_id: 'e2', user_id: 'u2', paid_minor: 320000 }],
    shares: [
      { expense_id: 'e2', user_id: 'u1', owed_minor: 80000 },
      { expense_id: 'e2', user_id: 'u2', owed_minor: 80000 },
      { expense_id: 'e2', user_id: 'u3', owed_minor: 80000 },
      { expense_id: 'e2', user_id: 'u4', owed_minor: 80000 },
    ],
  },
  {
    id: 'e3', group_id: 'g1', description: 'Cab from airport', amount_minor: 250000, currency: 'INR',
    category: 'transport', expense_date: '2025-12-14', notes: null, is_payment: false,
    created_by: 'u4', updated_by: 'u4', created_at: '2025-12-14T14:00:00Z', updated_at: '2025-12-14T14:00:00Z', deleted_at: null,
    payers: [{ expense_id: 'e3', user_id: 'u4', paid_minor: 250000 }],
    shares: [
      { expense_id: 'e3', user_id: 'u1', owed_minor: 62500 },
      { expense_id: 'e3', user_id: 'u2', owed_minor: 62500 },
      { expense_id: 'e3', user_id: 'u3', owed_minor: 62500 },
      { expense_id: 'e3', user_id: 'u4', owed_minor: 62500 },
    ],
  },
  {
    id: 'e4', group_id: 'g1', description: 'Beach shack lunch', amount_minor: 200000, currency: 'INR',
    category: 'food', expense_date: '2025-12-16', notes: 'Ravi had extra drinks', is_payment: false,
    created_by: 'u1', updated_by: 'u1', created_at: '2025-12-16T13:00:00Z', updated_at: '2025-12-16T13:00:00Z', deleted_at: null,
    payers: [{ expense_id: 'e4', user_id: 'u1', paid_minor: 200000 }],
    shares: [
      { expense_id: 'e4', user_id: 'u1', owed_minor: 45000 },
      { expense_id: 'e4', user_id: 'u2', owed_minor: 65000 },
      { expense_id: 'e4', user_id: 'u3', owed_minor: 45000 },
      { expense_id: 'e4', user_id: 'u4', owed_minor: 45000 },
    ],
  },
  {
    id: 'e5', group_id: 'g1', description: 'Villa booking (2 nights)', amount_minor: 1000000, currency: 'INR',
    category: 'travel', expense_date: '2025-12-14', notes: null, is_payment: false,
    created_by: 'u1', updated_by: 'u1', created_at: '2025-12-14T10:00:00Z', updated_at: '2025-12-14T10:00:00Z', deleted_at: null,
    payers: [
      { expense_id: 'e5', user_id: 'u1', paid_minor: 500000 },
      { expense_id: 'e5', user_id: 'u2', paid_minor: 500000 },
    ],
    shares: [
      { expense_id: 'e5', user_id: 'u1', owed_minor: 250000 },
      { expense_id: 'e5', user_id: 'u2', owed_minor: 250000 },
      { expense_id: 'e5', user_id: 'u3', owed_minor: 250000 },
      { expense_id: 'e5', user_id: 'u4', owed_minor: 250000 },
    ],
  },
  {
    id: 'e6', group_id: 'g1', description: 'Payment', amount_minor: 60000, currency: 'INR',
    category: 'general', expense_date: '2025-12-18', notes: null, is_payment: true,
    created_by: 'u4', updated_by: 'u4', created_at: '2025-12-18T09:00:00Z', updated_at: '2025-12-18T09:00:00Z', deleted_at: null,
    payers: [{ expense_id: 'e6', user_id: 'u4', paid_minor: 60000 }],
    shares: [{ expense_id: 'e6', user_id: 'u1', owed_minor: 60000 }],
  },
  {
    id: 'e10', group_id: 'g2', description: 'June rent', amount_minor: 4500000, currency: 'INR',
    category: 'rent', expense_date: '2025-06-01', notes: null, is_payment: false,
    created_by: 'u2', updated_by: 'u2', created_at: '2025-06-01T10:00:00Z', updated_at: '2025-06-01T10:00:00Z', deleted_at: null,
    payers: [{ expense_id: 'e10', user_id: 'u2', paid_minor: 4500000 }],
    shares: [
      { expense_id: 'e10', user_id: 'u1', owed_minor: 1500000 },
      { expense_id: 'e10', user_id: 'u2', owed_minor: 1500000 },
      { expense_id: 'e10', user_id: 'u3', owed_minor: 1500000 },
    ],
  },
  {
    id: 'e11', group_id: 'g2', description: 'Electricity bill - June', amount_minor: 285000, currency: 'INR',
    category: 'utilities', expense_date: '2025-06-10', notes: null, is_payment: false,
    created_by: 'u1', updated_by: 'u1', created_at: '2025-06-10T10:00:00Z', updated_at: '2025-06-10T10:00:00Z', deleted_at: null,
    payers: [{ expense_id: 'e11', user_id: 'u1', paid_minor: 285000 }],
    shares: [
      { expense_id: 'e11', user_id: 'u1', owed_minor: 95000 },
      { expense_id: 'e11', user_id: 'u2', owed_minor: 95000 },
      { expense_id: 'e11', user_id: 'u3', owed_minor: 95000 },
    ],
  },
]

export const MOCK_USER_ID = 'u1'
