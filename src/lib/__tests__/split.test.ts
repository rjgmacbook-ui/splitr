import { describe, it, expect } from 'vitest'
import {
  splitEqually,
  splitExact,
  splitByPercentage,
  splitByShares,
  splitByAdjustment,
} from '../split'
import type { SplitResult } from '../split'

function sumOwed(results: SplitResult[]): number {
  return results.reduce((s, r) => s + r.owed_minor, 0)
}

function getOwed(results: SplitResult[], userId: string): number {
  const r = results.find((r) => r.user_id === userId)
  if (!r) throw new Error(`User ${userId} not found in results`)
  return r.owed_minor
}

describe('splitEqually', () => {
  it('splits ₹100 among 3 people with largest-remainder', () => {
    const results = splitEqually(10000, ['a', 'b', 'c'])
    expect(sumOwed(results)).toBe(10000)
    // 10000 / 3 = 3333.33... → two people get 3334, one gets 3332
    // Actually floor(3333.33) = 3333, remainder 1 for all three = 0.33 each
    // 10000 - 9999 = 1 remaining paisa → goes to first by user_id sort
    const amounts = results.map((r) => r.owed_minor).sort()
    expect(amounts).toEqual([3333, 3333, 3334])
  })

  it('splits ₹0.01 among 3 — single paisa goes to one person', () => {
    const results = splitEqually(1, ['a', 'b', 'c'])
    expect(sumOwed(results)).toBe(1)
    const nonZero = results.filter((r) => r.owed_minor > 0)
    expect(nonZero.length).toBe(1)
    expect(nonZero[0]!.owed_minor).toBe(1)
  })

  it('splits evenly when divisible', () => {
    const results = splitEqually(10000, ['a', 'b'])
    expect(getOwed(results, 'a')).toBe(5000)
    expect(getOwed(results, 'b')).toBe(5000)
  })

  it('is deterministic — sorted by user_id', () => {
    const r1 = splitEqually(10000, ['c', 'a', 'b'])
    const r2 = splitEqually(10000, ['b', 'c', 'a'])
    expect(r1).toEqual(r2)
  })

  it('throws on empty members', () => {
    expect(() => splitEqually(10000, [])).toThrow('No members')
  })

  it('throws on zero amount', () => {
    expect(() => splitEqually(0, ['a'])).toThrow('Amount must be positive')
  })

  it('throws on negative amount', () => {
    expect(() => splitEqually(-100, ['a'])).toThrow('Amount must be positive')
  })
})

describe('splitExact', () => {
  it('accepts valid exact amounts', () => {
    const results = splitExact(10000, [
      { user_id: 'a', owed_minor: 7000 },
      { user_id: 'b', owed_minor: 3000 },
    ])
    expect(getOwed(results, 'a')).toBe(7000)
    expect(getOwed(results, 'b')).toBe(3000)
  })

  it('throws when sum does not match total', () => {
    expect(() =>
      splitExact(10000, [
        { user_id: 'a', owed_minor: 6000 },
        { user_id: 'b', owed_minor: 3000 },
      ])
    ).toThrow('does not match total')
  })

  it('throws on negative amounts', () => {
    expect(() =>
      splitExact(10000, [
        { user_id: 'a', owed_minor: 11000 },
        { user_id: 'b', owed_minor: -1000 },
      ])
    ).toThrow('cannot be negative')
  })

  it('sorts results by user_id', () => {
    const results = splitExact(10000, [
      { user_id: 'z', owed_minor: 2000 },
      { user_id: 'a', owed_minor: 8000 },
    ])
    expect(results[0]!.user_id).toBe('a')
    expect(results[1]!.user_id).toBe('z')
  })
})

describe('splitByPercentage', () => {
  it('splits 50/50', () => {
    const results = splitByPercentage(10000, [
      { user_id: 'a', percent: 50 },
      { user_id: 'b', percent: 50 },
    ])
    expect(getOwed(results, 'a')).toBe(5000)
    expect(getOwed(results, 'b')).toBe(5000)
  })

  it('handles rounding with 33.33/33.33/33.34', () => {
    const results = splitByPercentage(10000, [
      { user_id: 'a', percent: 33.33 },
      { user_id: 'b', percent: 33.33 },
      { user_id: 'c', percent: 33.34 },
    ])
    expect(sumOwed(results)).toBe(10000)
  })

  it('throws if percentages do not sum to 100', () => {
    expect(() =>
      splitByPercentage(10000, [
        { user_id: 'a', percent: 40 },
        { user_id: 'b', percent: 40 },
      ])
    ).toThrow('must be 100')
  })

  it('throws on negative percentage', () => {
    expect(() =>
      splitByPercentage(10000, [
        { user_id: 'a', percent: 110 },
        { user_id: 'b', percent: -10 },
      ])
    ).toThrow('cannot be negative')
  })

  it('handles small total with large percentage skew', () => {
    const results = splitByPercentage(3, [
      { user_id: 'a', percent: 99 },
      { user_id: 'b', percent: 1 },
    ])
    expect(sumOwed(results)).toBe(3)
    expect(getOwed(results, 'a')).toBeGreaterThanOrEqual(2)
  })
})

describe('splitByShares', () => {
  it('splits by equal weights', () => {
    const results = splitByShares(10000, [
      { user_id: 'a', weight: 1 },
      { user_id: 'b', weight: 1 },
    ])
    expect(getOwed(results, 'a')).toBe(5000)
    expect(getOwed(results, 'b')).toBe(5000)
  })

  it('splits by large weight ratios', () => {
    const results = splitByShares(10000, [
      { user_id: 'a', weight: 100 },
      { user_id: 'b', weight: 1 },
    ])
    expect(sumOwed(results)).toBe(10000)
    expect(getOwed(results, 'a')).toBeGreaterThan(9800)
  })

  it('splits 2:3 with remainder distribution', () => {
    const results = splitByShares(10001, [
      { user_id: 'a', weight: 2 },
      { user_id: 'b', weight: 3 },
    ])
    expect(sumOwed(results)).toBe(10001)
  })

  it('throws on zero total weight', () => {
    expect(() =>
      splitByShares(10000, [
        { user_id: 'a', weight: 0 },
        { user_id: 'b', weight: 0 },
      ])
    ).toThrow('greater than 0')
  })

  it('throws on negative weights', () => {
    expect(() =>
      splitByShares(10000, [{ user_id: 'a', weight: -1 }])
    ).toThrow('cannot be negative')
  })

  it('throws on non-integer weights', () => {
    expect(() =>
      splitByShares(10000, [{ user_id: 'a', weight: 1.5 }])
    ).toThrow('must be integers')
  })
})

describe('splitByAdjustment', () => {
  it('splits equally when no adjustments', () => {
    const results = splitByAdjustment(10000, ['a', 'b'], [])
    expect(getOwed(results, 'a')).toBe(5000)
    expect(getOwed(results, 'b')).toBe(5000)
  })

  it('applies positive adjustment to one member', () => {
    const results = splitByAdjustment(10000, ['a', 'b'], [
      { user_id: 'a', adjustment_minor: 2000 },
    ])
    expect(sumOwed(results)).toBe(10000)
    // a gets adj(2000) + equal share of remaining 8000 (4000) = 6000
    expect(getOwed(results, 'a')).toBe(6000)
    expect(getOwed(results, 'b')).toBe(4000)
  })

  it('throws when adjustments exceed total', () => {
    expect(() =>
      splitByAdjustment(10000, ['a', 'b'], [
        { user_id: 'a', adjustment_minor: 11000 },
      ])
    ).toThrow('exceed the total')
  })

  it('throws when adjustment results in negative share', () => {
    // totalAdj = 5000 + (-6000) = -1000, remaining = 11000, split = 5500 each
    // b: 5500 + (-6000) = -500 → negative
    expect(() =>
      splitByAdjustment(10000, ['a', 'b'], [
        { user_id: 'a', adjustment_minor: 5000 },
        { user_id: 'b', adjustment_minor: -6000 },
      ])
    ).toThrow('negative share')
  })

  it('handles multiple adjustments', () => {
    const results = splitByAdjustment(10000, ['a', 'b', 'c'], [
      { user_id: 'a', adjustment_minor: 1000 },
      { user_id: 'b', adjustment_minor: 500 },
    ])
    expect(sumOwed(results)).toBe(10000)
    // remaining = 10000 - 1500 = 8500, equally among 3 → ~2833 each
    // a: 2833 + 1000 = 3833, b: 2833 + 500 = 3333, c: 2834
    const aOwed = getOwed(results, 'a')
    const bOwed = getOwed(results, 'b')
    const cOwed = getOwed(results, 'c')
    expect(aOwed + bOwed + cOwed).toBe(10000)
    expect(aOwed).toBeGreaterThan(bOwed)
    expect(bOwed).toBeGreaterThan(cOwed)
  })
})

describe('invariants across all split methods', () => {
  it('sum always equals total for every method', () => {
    const total = 9999
    const members = ['alice', 'bob', 'charlie', 'dave']

    expect(sumOwed(splitEqually(total, members))).toBe(total)

    expect(
      sumOwed(
        splitExact(total, [
          { user_id: 'alice', owed_minor: 2500 },
          { user_id: 'bob', owed_minor: 2500 },
          { user_id: 'charlie', owed_minor: 2500 },
          { user_id: 'dave', owed_minor: 2499 },
        ])
      )
    ).toBe(total)

    expect(
      sumOwed(
        splitByPercentage(total, [
          { user_id: 'alice', percent: 25 },
          { user_id: 'bob', percent: 25 },
          { user_id: 'charlie', percent: 25 },
          { user_id: 'dave', percent: 25 },
        ])
      )
    ).toBe(total)

    expect(
      sumOwed(
        splitByShares(total, [
          { user_id: 'alice', weight: 3 },
          { user_id: 'bob', weight: 2 },
          { user_id: 'charlie', weight: 1 },
          { user_id: 'dave', weight: 1 },
        ])
      )
    ).toBe(total)

    expect(
      sumOwed(splitByAdjustment(total, members, [{ user_id: 'alice', adjustment_minor: 100 }]))
    ).toBe(total)
  })

  it('no result has negative owed_minor', () => {
    const results = splitEqually(3, ['a', 'b', 'c', 'd', 'e'])
    for (const r of results) {
      expect(r.owed_minor).toBeGreaterThanOrEqual(0)
    }
  })
})
