import { describe, it, expect } from 'vitest'
import {
  formatMoney,
  formatMoneyAbs,
  formatMinorToDecimal,
  parseRupeesToMinor,
  validatePayerSum,
  validateShareSum,
} from '../money'

describe('formatMoney', () => {
  it('formats positive paise as INR', () => {
    expect(formatMoney(10000)).toBe('₹100.00')
  })

  it('formats negative paise', () => {
    expect(formatMoney(-5050)).toBe('-₹50.50')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('₹0.00')
  })

  it('formats single paisa', () => {
    expect(formatMoney(1)).toBe('₹0.01')
  })

  it('formats lakhs with Indian grouping', () => {
    expect(formatMoney(1000000)).toBe('₹10,000.00')
  })
})

describe('formatMoneyAbs', () => {
  it('strips sign from negative', () => {
    expect(formatMoneyAbs(-5000)).toBe('₹50.00')
  })

  it('keeps positive unchanged', () => {
    expect(formatMoneyAbs(5000)).toBe('₹50.00')
  })
})

describe('formatMinorToDecimal', () => {
  it('converts paise to decimal string', () => {
    expect(formatMinorToDecimal(10033)).toBe('100.33')
  })

  it('pads to 2 decimals', () => {
    expect(formatMinorToDecimal(100)).toBe('1.00')
  })

  it('handles zero', () => {
    expect(formatMinorToDecimal(0)).toBe('0.00')
  })
})

describe('parseRupeesToMinor', () => {
  it('parses integer rupees', () => {
    expect(parseRupeesToMinor('100')).toBe(10000)
  })

  it('parses decimal rupees', () => {
    expect(parseRupeesToMinor('99.50')).toBe(9950)
  })

  it('parses string with commas', () => {
    expect(parseRupeesToMinor('1,234.56')).toBe(123456)
  })

  it('parses string with currency symbol', () => {
    expect(parseRupeesToMinor('₹500')).toBe(50000)
  })

  it('rounds fractional paise', () => {
    expect(parseRupeesToMinor('33.335')).toBe(3334)
  })

  it('returns null for empty string', () => {
    expect(parseRupeesToMinor('')).toBeNull()
  })

  it('returns null for non-numeric', () => {
    expect(parseRupeesToMinor('abc')).toBeNull()
  })
})

describe('validatePayerSum', () => {
  it('returns true when payer sum matches total', () => {
    expect(validatePayerSum([{ paid_minor: 6000 }, { paid_minor: 4000 }], 10000)).toBe(true)
  })

  it('returns false when payer sum does not match', () => {
    expect(validatePayerSum([{ paid_minor: 5000 }, { paid_minor: 4000 }], 10000)).toBe(false)
  })

  it('validates single payer', () => {
    expect(validatePayerSum([{ paid_minor: 10000 }], 10000)).toBe(true)
  })
})

describe('validateShareSum', () => {
  it('returns true when share sum matches total', () => {
    expect(validateShareSum([{ owed_minor: 3334 }, { owed_minor: 3333 }, { owed_minor: 3333 }], 10000)).toBe(true)
  })

  it('returns false when share sum does not match', () => {
    expect(validateShareSum([{ owed_minor: 5000 }, { owed_minor: 5001 }], 10000)).toBe(false)
  })
})
