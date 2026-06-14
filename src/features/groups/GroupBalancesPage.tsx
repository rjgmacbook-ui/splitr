import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useGroup, useGroupMembers, useGroupBalances } from '@/hooks/useGroups'
import { useGroupExpenses } from '@/hooks/useExpenses'
import { formatMoneyAbs } from '@/lib/money'
import { getPairwiseDebts } from '@/lib/simplify'

export function GroupBalancesPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: group, isLoading } = useGroup(id)
  const { data: members = [] } = useGroupMembers(id)
  const { data: balances = [] } = useGroupBalances(id)
  const { data: groupExpenses = [] } = useGroupExpenses(id)

  const profileMap = useMemo(() => {
    const map = new Map<string, { display_name: string; color: number }>()
    for (const m of members) map.set(m.user_id, m.profile)
    return map
  }, [members])

  const pairwise = useMemo(() => getPairwiseDebts(groupExpenses), [groupExpenses])

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

  const maxAbs = Math.max(...balances.map((b) => Math.abs(b.net_minor)), 1)

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
        <h1 className="font-display text-xl font-semibold text-ink">Balances</h1>
      </header>

      {/* Net balances per member */}
      <div className="px-4 flex flex-col gap-2">
        {members.map((m, i) => {
          const bal = balances.find((b) => b.user_id === m.user_id)
          const net = bal?.net_minor ?? 0
          const barWidth = (Math.abs(net) / maxAbs) * 100
          const isYou = m.user_id === userId

          return (
            <div
              key={m.user_id}
              className="bg-surface border border-border rounded-card p-4"
              style={{ animation: `fadeSlideUp 300ms ease-out ${i * 50}ms both` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={m.profile.display_name} colorIndex={m.profile.color} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {m.profile.display_name}
                    {isYou && <span className="text-ink-secondary font-normal"> (you)</span>}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold money ${
                    net > 0 ? 'text-positive' : net < 0 ? 'text-negative' : 'text-ink-secondary'
                  }`}
                >
                  {net > 0
                    ? `+${formatMoneyAbs(net)}`
                    : net < 0
                      ? `-${formatMoneyAbs(net)}`
                      : '₹0.00'}
                </span>
              </div>

              <div className="h-2 bg-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    net >= 0 ? 'bg-positive' : 'bg-negative'
                  }`}
                  style={{ width: `${Math.max(barWidth, net === 0 ? 0 : 3)}%` }}
                />
              </div>

              <p className="text-xs text-ink-secondary mt-2">
                {net > 0
                  ? `${isYou ? 'You are' : m.profile.display_name + ' is'} owed ${formatMoneyAbs(net)}`
                  : net < 0
                    ? `${isYou ? 'You owe' : m.profile.display_name + ' owes'} ${formatMoneyAbs(net)}`
                    : 'All settled up'}
              </p>
            </div>
          )
        })}
      </div>

      {/* Pairwise debts */}
      {pairwise.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="font-display text-base font-medium text-ink mb-3 px-1">Who owes whom</h2>
          <div className="flex flex-col gap-2">
            {pairwise.map((debt, i) => {
              const fromP = profileMap.get(debt.from)
              const toP = profileMap.get(debt.to)
              return (
                <div
                  key={`${debt.from}-${debt.to}`}
                  className="bg-surface border border-border rounded-card px-4 py-3
                             flex items-center gap-3"
                  style={{
                    animation: `fadeSlideUp 300ms ease-out ${members.length * 50 + i * 40}ms both`,
                  }}
                >
                  <Avatar
                    name={fromP?.display_name ?? '?'}
                    colorIndex={fromP?.color ?? 0}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">
                      <span className="font-medium">
                        {debt.from === userId ? 'You' : fromP?.display_name}
                      </span>
                      {' owes '}
                      <span className="font-medium">
                        {debt.to === userId ? 'you' : toP?.display_name}
                      </span>
                    </p>
                  </div>
                  <span className="text-sm font-semibold money text-ink-secondary shrink-0">
                    {formatMoneyAbs(debt.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
