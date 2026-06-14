export interface Transfer {
  from: string
  to: string
  amount: number
}

/**
 * Simplify debts using a greedy two-pointer algorithm.
 * Given net balances per person, produces the minimum set of transfers
 * to settle all debts. Deterministic: sorts by user_id within each group.
 */
export function simplifyDebts(
  balances: { user_id: string; net_minor: number }[],
): Transfer[] {
  const debtors = balances
    .filter((b) => b.net_minor < 0)
    .map((b) => ({ user_id: b.user_id, remaining: -b.net_minor }))
    .sort((a, b) => b.remaining - a.remaining || a.user_id.localeCompare(b.user_id))

  const creditors = balances
    .filter((b) => b.net_minor > 0)
    .map((b) => ({ user_id: b.user_id, remaining: b.net_minor }))
    .sort((a, b) => b.remaining - a.remaining || a.user_id.localeCompare(b.user_id))

  const transfers: Transfer[] = []
  let di = 0
  let ci = 0

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di]!
    const creditor = creditors[ci]!
    const amount = Math.min(debtor.remaining, creditor.remaining)

    if (amount > 0) {
      transfers.push({ from: debtor.user_id, to: creditor.user_id, amount })
    }

    debtor.remaining -= amount
    creditor.remaining -= amount

    if (debtor.remaining === 0) di++
    if (creditor.remaining === 0) ci++
  }

  return transfers
}

/**
 * Get pairwise debts between members (without simplification).
 * Returns every directed debt: who owes whom, derived from expenses.
 */
export function getPairwiseDebts(
  expenses: {
    payers: { user_id: string; paid_minor: number }[]
    shares: { user_id: string; owed_minor: number }[]
    is_payment: boolean
    deleted_at: string | null
  }[],
): Transfer[] {
  const debtMap = new Map<string, number>()

  for (const exp of expenses) {
    if (exp.deleted_at) continue

    if (exp.is_payment) {
      const payer = exp.payers[0]
      const receiver = exp.shares[0]
      if (payer && receiver) {
        const key = `${receiver.user_id}->${payer.user_id}`
        debtMap.set(key, (debtMap.get(key) ?? 0) + payer.paid_minor)
      }
      continue
    }

    const totalPaid = exp.payers.reduce((s, p) => s + p.paid_minor, 0)
    if (totalPaid === 0) continue

    for (const share of exp.shares) {
      for (const payer of exp.payers) {
        if (share.user_id === payer.user_id) continue
        const payerFraction = payer.paid_minor / totalPaid
        const oweAmount = Math.round(share.owed_minor * payerFraction)
        if (oweAmount <= 0) continue

        const key = `${share.user_id}->${payer.user_id}`
        debtMap.set(key, (debtMap.get(key) ?? 0) + oweAmount)
      }
    }
  }

  // Net out bidirectional debts
  const netted = new Map<string, { from: string; to: string; amount: number }>()
  for (const [key, amount] of debtMap) {
    const [from, to] = key.split('->')
    if (!from || !to) continue

    const reverseKey = `${to}->${from}`
    const reverse = debtMap.get(reverseKey) ?? 0

    const canonKey = from < to ? `${from}->${to}` : `${to}->${from}`
    if (netted.has(canonKey)) continue

    const net = amount - reverse
    if (net > 0) {
      netted.set(canonKey, { from, to, amount: net })
    } else if (net < 0) {
      netted.set(canonKey, { from: to, to: from, amount: -net })
    }
  }

  return [...netted.values()].sort((a, b) => b.amount - a.amount)
}
