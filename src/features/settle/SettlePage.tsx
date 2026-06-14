import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useGroup, useGroupBalances, useGroupMembers } from '@/hooks/useGroups'
import { useGroupExpenses, useRecordPayment } from '@/hooks/useExpenses'
import { formatMoneyAbs } from '@/lib/money'
import { simplifyDebts, getPairwiseDebts } from '@/lib/simplify'

export function SettlePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: group, isLoading } = useGroup(id)
  const { data: balances = [] } = useGroupBalances(id)
  const { data: members = [] } = useGroupMembers(id)
  const { data: groupExpenses = [] } = useGroupExpenses(id)
  const recordPayment = useRecordPayment()

  const profileMap = useMemo(() => {
    const map = new Map<string, { display_name: string; color: number; upi_id: string | null }>()
    for (const m of members) map.set(m.user_id, m.profile)
    return map
  }, [members])

  const simplified = useMemo(() => simplifyDebts(balances), [balances])
  const pairwise = useMemo(() => getPairwiseDebts(groupExpenses), [groupExpenses])

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [view, setView] = useState<'simplified' | 'pairwise'>('simplified')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="px-4 pt-6">
        <p className="text-ink-secondary">Group not found.</p>
      </div>
    )
  }

  const transfers = view === 'simplified' ? simplified : pairwise
  const userTransfers = transfers.filter((t) => t.from === userId || t.to === userId)
  const otherTransfers = transfers.filter((t) => t.from !== userId && t.to !== userId)

  async function handleRecord() {
    if (selectedIdx === null || !id) return
    const t = transfers[selectedIdx]!
    await recordPayment.mutateAsync({
      group_id: id,
      from_user_id: t.from,
      to_user_id: t.to,
      amount_minor: t.amount,
    })
    navigate(`/groups/${id}`)
  }

  return (
    <div className="pb-8">
      <header className="px-4 pt-5 pb-3 flex items-center gap-2">
        <Link
          to={`/groups/${id}`}
          className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full
                     text-ink-secondary hover:text-ink hover:bg-ink/5 transition-colors"
          aria-label="Back to group"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 15L7.5 10l5-5" />
          </svg>
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink">Settle up</h1>
      </header>

      <div className="px-4">
        {/* View toggle */}
        {group.simplify_debts && pairwise.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setView('simplified'); setSelectedIdx(null) }}
              className={`px-3 py-1.5 rounded-pill text-sm font-medium transition-all
                         ${view === 'simplified'
                           ? 'bg-primary text-on-primary shadow-sm'
                           : 'bg-ink/5 text-ink-secondary hover:bg-ink/10'}`}
            >
              Simplified
            </button>
            <button
              onClick={() => { setView('pairwise'); setSelectedIdx(null) }}
              className={`px-3 py-1.5 rounded-pill text-sm font-medium transition-all
                         ${view === 'pairwise'
                           ? 'bg-primary text-on-primary shadow-sm'
                           : 'bg-ink/5 text-ink-secondary hover:bg-ink/10'}`}
            >
              All debts
            </button>
          </div>
        )}

        {transfers.length === 0 ? (
          <div className="bg-surface border border-border rounded-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-positive/10 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-positive)"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <p className="font-display text-xl font-semibold text-positive">All settled up</p>
            <p className="text-ink-secondary text-sm mt-1">No payments needed.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {view === 'simplified' && simplified.length < pairwise.length && (
              <p className="text-xs text-ink-secondary px-1 -mb-1">
                {simplified.length} transfer{simplified.length !== 1 ? 's' : ''} instead of {pairwise.length}
              </p>
            )}

            {userTransfers.length > 0 && (
              <p className="text-ink-secondary text-xs font-semibold uppercase tracking-wider px-1">
                Your payments
              </p>
            )}

            {userTransfers.map((t, i) => {
              const globalIdx = transfers.indexOf(t)
              const fromP = profileMap.get(t.from)
              const toP = profileMap.get(t.to)
              const isSelected = selectedIdx === globalIdx
              const youPay = t.from === userId

              return (
                <button
                  key={`user-${i}`}
                  onClick={() => setSelectedIdx(isSelected ? null : globalIdx)}
                  className={`bg-surface border rounded-card p-4 text-left transition-all
                    ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={fromP?.display_name ?? ''}
                      colorIndex={fromP?.color ?? 0}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink">
                        <span className="font-medium">{youPay ? 'You' : fromP?.display_name}</span>
                        {' pay '}
                        <span className="font-medium">{!youPay ? 'you' : toP?.display_name}</span>
                      </p>
                    </div>
                    <span className={`font-semibold text-sm money shrink-0 ${youPay ? 'text-negative' : 'text-positive'}`}>
                      {formatMoneyAbs(t.amount)}
                    </span>
                  </div>

                  {isSelected && youPay && toP?.upi_id && (
                    <a
                      href={`upi://pay?pa=${toP.upi_id}&pn=${encodeURIComponent(toP.display_name)}&am=${(t.amount / 100).toFixed(2)}&cu=INR`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 h-10 rounded-pill bg-positive text-white
                                 flex items-center justify-center gap-2 text-sm font-semibold
                                 hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 8h14M8 1v14" />
                      </svg>
                      Pay via UPI
                    </a>
                  )}
                </button>
              )
            })}

            {otherTransfers.length > 0 && (
              <p className="text-ink-secondary text-xs font-semibold uppercase tracking-wider px-1 mt-2">
                Other transfers
              </p>
            )}

            {otherTransfers.map((t, i) => {
              const fromP = profileMap.get(t.from)
              const toP = profileMap.get(t.to)
              return (
                <div
                  key={`other-${i}`}
                  className="bg-surface border border-border rounded-card p-4 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={fromP?.display_name ?? ''}
                      colorIndex={fromP?.color ?? 0}
                      size="sm"
                    />
                    <p className="text-sm text-ink flex-1 min-w-0">
                      <span className="font-medium">{fromP?.display_name}</span>
                      {' pays '}
                      <span className="font-medium">{toP?.display_name}</span>
                    </p>
                    <span className="font-medium text-sm money text-ink-secondary shrink-0">
                      {formatMoneyAbs(t.amount)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedIdx !== null && (
          <button
            onClick={handleRecord}
            disabled={recordPayment.isPending}
            className="w-full h-12 mt-5 bg-primary text-on-primary rounded-pill text-[15px] font-semibold
                       hover:bg-primary-hover active:scale-[0.97] transition-all
                       disabled:opacity-50
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {recordPayment.isPending ? 'Recording…' : 'Record payment'}
          </button>
        )}
      </div>
    </div>
  )
}
