const INR_FORMAT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatters = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string): Intl.NumberFormat {
  if (currency === 'INR') return INR_FORMAT
  let fmt = formatters.get(currency)
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    formatters.set(currency, fmt)
  }
  return fmt
}

export function formatMoney(minorUnits: number, currency = 'INR'): string {
  return getFormatter(currency).format(minorUnits / 100)
}

export function formatMoneyAbs(minorUnits: number, currency = 'INR'): string {
  return getFormatter(currency).format(Math.abs(minorUnits) / 100)
}

export function formatMinorToDecimal(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2)
}

export function parseRupeesToMinor(rupees: string): number | null {
  const cleaned = rupees.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return null
  return Math.round(num * 100)
}

export function validatePayerSum(payers: { paid_minor: number }[], totalMinor: number): boolean {
  const sum = payers.reduce((s, p) => s + p.paid_minor, 0)
  return sum === totalMinor
}

export function validateShareSum(shares: { owed_minor: number }[], totalMinor: number): boolean {
  const sum = shares.reduce((s, sh) => s + sh.owed_minor, 0)
  return sum === totalMinor
}
