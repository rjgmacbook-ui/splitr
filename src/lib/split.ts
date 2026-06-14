export interface SplitResult {
  user_id: string
  owed_minor: number
}

/**
 * Distribute remainder paise using largest-remainder method.
 * Deterministic ordering by user_id ensures same input always yields same split.
 */
function distributeRemainder(
  memberIds: string[],
  totalMinor: number,
  rawShares: Map<string, number>,
): SplitResult[] {
  const sorted = [...memberIds].sort()
  const rawSum = sorted.reduce((s, id) => s + (rawShares.get(id) ?? 0), 0)

  if (rawSum === 0) {
    throw new Error('Cannot distribute: all shares are zero')
  }

  const results: { user_id: string; floored: number; remainder: number }[] = sorted.map((id) => {
    const raw = rawShares.get(id) ?? 0
    const exact = (raw / rawSum) * totalMinor
    const floored = Math.floor(exact)
    return { user_id: id, floored, remainder: exact - floored }
  })

  const flooredSum = results.reduce((s, r) => s + r.floored, 0)
  let remaining = totalMinor - flooredSum

  const byRemainder = [...results].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder
    return a.user_id.localeCompare(b.user_id)
  })

  for (const r of byRemainder) {
    if (remaining <= 0) break
    r.floored += 1
    remaining -= 1
  }

  return results.map((r) => ({ user_id: r.user_id, owed_minor: r.floored }))
}

/**
 * Equal split among selected members.
 */
export function splitEqually(
  totalMinor: number,
  memberIds: string[],
): SplitResult[] {
  if (memberIds.length === 0) throw new Error('No members to split among')
  if (totalMinor <= 0) throw new Error('Amount must be positive')

  const shares = new Map<string, number>()
  for (const id of memberIds) {
    shares.set(id, 1)
  }
  return distributeRemainder(memberIds, totalMinor, shares)
}

/**
 * Exact amount split — each person's share is specified directly.
 * Sum must equal totalMinor.
 */
export function splitExact(
  totalMinor: number,
  amounts: { user_id: string; owed_minor: number }[],
): SplitResult[] {
  if (amounts.length === 0) throw new Error('No shares specified')
  if (totalMinor <= 0) throw new Error('Amount must be positive')

  const sum = amounts.reduce((s, a) => s + a.owed_minor, 0)
  if (sum !== totalMinor) {
    throw new Error(`Share sum (${sum}) does not match total (${totalMinor})`)
  }

  for (const a of amounts) {
    if (a.owed_minor < 0) throw new Error('Share amounts cannot be negative')
  }

  return amounts
    .map((a) => ({ user_id: a.user_id, owed_minor: a.owed_minor }))
    .sort((a, b) => a.user_id.localeCompare(b.user_id))
}

/**
 * Percentage split — percentages must sum to 100.
 * Uses largest-remainder method for paise distribution.
 */
export function splitByPercentage(
  totalMinor: number,
  percentages: { user_id: string; percent: number }[],
): SplitResult[] {
  if (percentages.length === 0) throw new Error('No percentages specified')
  if (totalMinor <= 0) throw new Error('Amount must be positive')

  const sum = percentages.reduce((s, p) => s + p.percent, 0)
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(`Percentages sum to ${sum}, must be 100`)
  }

  for (const p of percentages) {
    if (p.percent < 0) throw new Error('Percentages cannot be negative')
  }

  const shares = new Map<string, number>()
  for (const p of percentages) {
    shares.set(p.user_id, p.percent)
  }

  return distributeRemainder(
    percentages.map((p) => p.user_id),
    totalMinor,
    shares,
  )
}

/**
 * Share/weight split — integer weights (e.g., family A = 2, family B = 3).
 * Uses largest-remainder method for paise distribution.
 */
export function splitByShares(
  totalMinor: number,
  shares: { user_id: string; weight: number }[],
): SplitResult[] {
  if (shares.length === 0) throw new Error('No shares specified')
  if (totalMinor <= 0) throw new Error('Amount must be positive')

  for (const s of shares) {
    if (s.weight < 0) throw new Error('Weights cannot be negative')
    if (!Number.isInteger(s.weight)) throw new Error('Weights must be integers')
  }

  const totalWeight = shares.reduce((sum, s) => sum + s.weight, 0)
  if (totalWeight === 0) throw new Error('Total weight must be greater than 0')

  const weightMap = new Map<string, number>()
  for (const s of shares) {
    weightMap.set(s.user_id, s.weight)
  }

  return distributeRemainder(
    shares.map((s) => s.user_id),
    totalMinor,
    weightMap,
  )
}

/**
 * Adjustment split — split equally, then apply per-person adjustments.
 * Adjustments are added to or subtracted from the equal share.
 * The sum of adjustments must not exceed the total.
 */
export function splitByAdjustment(
  totalMinor: number,
  memberIds: string[],
  adjustments: { user_id: string; adjustment_minor: number }[],
): SplitResult[] {
  if (memberIds.length === 0) throw new Error('No members to split among')
  if (totalMinor <= 0) throw new Error('Amount must be positive')

  const adjMap = new Map<string, number>()
  for (const a of adjustments) {
    adjMap.set(a.user_id, a.adjustment_minor)
  }

  const totalAdj = adjustments.reduce((s, a) => s + a.adjustment_minor, 0)
  const remainingAfterAdj = totalMinor - totalAdj

  if (remainingAfterAdj < 0) {
    throw new Error('Adjustments exceed the total amount')
  }

  // Split the remaining equally
  const equalParts = splitEqually(remainingAfterAdj, memberIds)

  // Add adjustments
  const results: SplitResult[] = equalParts.map((r) => ({
    user_id: r.user_id,
    owed_minor: r.owed_minor + (adjMap.get(r.user_id) ?? 0),
  }))

  for (const r of results) {
    if (r.owed_minor < 0) {
      throw new Error(`Adjustment results in negative share for ${r.user_id}`)
    }
  }

  const checkSum = results.reduce((s, r) => s + r.owed_minor, 0)
  if (checkSum !== totalMinor) {
    throw new Error(`Split sum (${checkSum}) does not match total (${totalMinor})`)
  }

  return results
}
