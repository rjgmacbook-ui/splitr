import { describe, it, expect } from 'vitest'
import { simplifyDebts, getPairwiseDebts } from '../simplify'

describe('simplifyDebts', () => {
  it('returns empty for all-zero balances', () => {
    const result = simplifyDebts([
      { user_id: 'a', net_minor: 0 },
      { user_id: 'b', net_minor: 0 },
    ])
    expect(result).toEqual([])
  })

  it('handles simple two-person debt', () => {
    const result = simplifyDebts([
      { user_id: 'a', net_minor: 5000 },
      { user_id: 'b', net_minor: -5000 },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ from: 'b', to: 'a', amount: 5000 })
  })

  it('simplifies three-person chain into two transfers', () => {
    // A is owed 100, B is owed 50, C owes 150
    const result = simplifyDebts([
      { user_id: 'a', net_minor: 10000 },
      { user_id: 'b', net_minor: 5000 },
      { user_id: 'c', net_minor: -15000 },
    ])
    expect(result).toHaveLength(2)
    const totalTransferred = result.reduce((s, t) => s + t.amount, 0)
    expect(totalTransferred).toBe(15000)
  })

  it('produces minimum transfers for 4-person group', () => {
    // Goa Trip mock balances
    const result = simplifyDebts([
      { user_id: 'u1', net_minor: 218750 },
      { user_id: 'u2', net_minor: 146250 },
      { user_id: 'u3', net_minor: -138750 },
      { user_id: 'u4', net_minor: -226250 },
    ])
    // With 2 creditors and 2 debtors, max 3 transfers needed
    expect(result.length).toBeLessThanOrEqual(3)
    // All transfers flow from debtors to creditors
    for (const t of result) {
      expect(t.amount).toBeGreaterThan(0)
    }
    // Total paid by debtors equals total received by creditors
    const totalFrom = result.reduce((s, t) => s + t.amount, 0)
    expect(totalFrom).toBe(218750 + 146250)
  })

  it('preserves net balance — every debtor pays exactly what they owe', () => {
    const balances = [
      { user_id: 'a', net_minor: 300 },
      { user_id: 'b', net_minor: -100 },
      { user_id: 'c', net_minor: -200 },
    ]
    const result = simplifyDebts(balances)

    const paid: Record<string, number> = {}
    const received: Record<string, number> = {}
    for (const t of result) {
      paid[t.from] = (paid[t.from] ?? 0) + t.amount
      received[t.to] = (received[t.to] ?? 0) + t.amount
    }

    expect(received['a']).toBe(300)
    expect(paid['b']).toBe(100)
    expect(paid['c']).toBe(200)
  })

  it('handles single paisa amounts', () => {
    const result = simplifyDebts([
      { user_id: 'a', net_minor: 1 },
      { user_id: 'b', net_minor: -1 },
    ])
    expect(result).toEqual([{ from: 'b', to: 'a', amount: 1 }])
  })

  it('skips zero-balance members', () => {
    const result = simplifyDebts([
      { user_id: 'a', net_minor: 5000 },
      { user_id: 'b', net_minor: 0 },
      { user_id: 'c', net_minor: -5000 },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]!.from).toBe('c')
    expect(result[0]!.to).toBe('a')
  })

  it('is deterministic', () => {
    const balances = [
      { user_id: 'c', net_minor: -5000 },
      { user_id: 'a', net_minor: 3000 },
      { user_id: 'b', net_minor: 2000 },
    ]
    const r1 = simplifyDebts(balances)
    const r2 = simplifyDebts([...balances].reverse())
    expect(r1).toEqual(r2)
  })
})

describe('getPairwiseDebts', () => {
  it('returns empty for no expenses', () => {
    expect(getPairwiseDebts([])).toEqual([])
  })

  it('computes single-payer debt', () => {
    const result = getPairwiseDebts([
      {
        payers: [{ user_id: 'a', paid_minor: 10000 }],
        shares: [
          { user_id: 'a', owed_minor: 5000 },
          { user_id: 'b', owed_minor: 5000 },
        ],
        is_payment: false,
        deleted_at: null,
      },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]!.from).toBe('b')
    expect(result[0]!.to).toBe('a')
    expect(result[0]!.amount).toBe(5000)
  })

  it('nets out bidirectional debts', () => {
    const result = getPairwiseDebts([
      {
        payers: [{ user_id: 'a', paid_minor: 10000 }],
        shares: [
          { user_id: 'a', owed_minor: 5000 },
          { user_id: 'b', owed_minor: 5000 },
        ],
        is_payment: false,
        deleted_at: null,
      },
      {
        payers: [{ user_id: 'b', paid_minor: 6000 }],
        shares: [
          { user_id: 'a', owed_minor: 3000 },
          { user_id: 'b', owed_minor: 3000 },
        ],
        is_payment: false,
        deleted_at: null,
      },
    ])
    // b owes a 5000, a owes b 3000 → net: b owes a 2000
    expect(result).toHaveLength(1)
    expect(result[0]!.from).toBe('b')
    expect(result[0]!.to).toBe('a')
    expect(result[0]!.amount).toBe(2000)
  })

  it('handles payments (is_payment=true)', () => {
    const result = getPairwiseDebts([
      {
        payers: [{ user_id: 'a', paid_minor: 10000 }],
        shares: [
          { user_id: 'a', owed_minor: 5000 },
          { user_id: 'b', owed_minor: 5000 },
        ],
        is_payment: false,
        deleted_at: null,
      },
      {
        payers: [{ user_id: 'b', paid_minor: 5000 }],
        shares: [{ user_id: 'a', owed_minor: 5000 }],
        is_payment: true,
        deleted_at: null,
      },
    ])
    // b owed a 5000, then b paid a 5000 → net 0
    expect(result).toHaveLength(0)
  })

  it('skips deleted expenses', () => {
    const result = getPairwiseDebts([
      {
        payers: [{ user_id: 'a', paid_minor: 10000 }],
        shares: [
          { user_id: 'a', owed_minor: 5000 },
          { user_id: 'b', owed_minor: 5000 },
        ],
        is_payment: false,
        deleted_at: '2025-12-20T00:00:00Z',
      },
    ])
    expect(result).toHaveLength(0)
  })

  it('sorts results by amount descending', () => {
    const result = getPairwiseDebts([
      {
        payers: [{ user_id: 'a', paid_minor: 20000 }],
        shares: [
          { user_id: 'a', owed_minor: 5000 },
          { user_id: 'b', owed_minor: 5000 },
          { user_id: 'c', owed_minor: 10000 },
        ],
        is_payment: false,
        deleted_at: null,
      },
    ])
    expect(result.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.amount).toBeLessThanOrEqual(result[i - 1]!.amount)
    }
  })
})
