import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useGroups, useAllBalances, useAllMembers } from '@/hooks/useGroups'
import { formatMoneyAbs } from '@/lib/money'

function BalanceLine({ net }: { net: number }) {
  if (net > 0) {
    return (
      <span className="text-positive text-sm font-semibold money">
        you are owed {formatMoneyAbs(net)}
      </span>
    )
  }
  if (net < 0) {
    return (
      <span className="text-negative text-sm font-semibold money">
        you owe {formatMoneyAbs(net)}
      </span>
    )
  }
  return (
    <span className="text-ink-secondary text-sm font-medium">settled up</span>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: groups = [], isLoading: loadingGroups } = useGroups()
  const { data: allBalances = [] } = useAllBalances()
  const { data: allMembers = [] } = useAllMembers()

  const userBalances = allBalances.filter((b) => b.user_id === userId)
  const overallNet = userBalances.reduce((sum, b) => sum + b.net_minor, 0)
  const totalOwed = userBalances.filter((b) => b.net_minor > 0).reduce((s, b) => s + b.net_minor, 0)
  const totalOwing = userBalances.filter((b) => b.net_minor < 0).reduce((s, b) => s + Math.abs(b.net_minor), 0)

  if (loadingGroups) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <header className="px-4 pt-6 pb-4">
          <h1 className="font-display text-2xl font-semibold text-ink">Splitr</h1>
        </header>
        <div className="flex-1 px-4">
          <EmptyState
            message="No groups yet — create one to start splitting expenses."
            action={{ label: 'Create group', onClick: () => navigate('/groups/new') }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-5">Splitr</h1>

      {/* Overall balance */}
      <div
        className="bg-surface border border-border rounded-card p-5 mb-6 text-center"
        style={{ animation: 'fadeSlideUp 350ms ease-out both' }}
      >
        <p className="text-ink-secondary text-sm mb-1">
          {overallNet > 0 ? 'Overall, you are owed' : overallNet < 0 ? 'Overall, you owe' : 'You\'re all settled up'}
        </p>
        {overallNet !== 0 ? (
          <p className={`font-display text-[28px] font-semibold money leading-tight ${overallNet > 0 ? 'text-positive' : 'text-negative'}`}>
            {formatMoneyAbs(overallNet)}
          </p>
        ) : (
          <p className="font-display text-[28px] font-semibold text-positive leading-tight">
            ₹0.00
          </p>
        )}

        {(totalOwed > 0 || totalOwing > 0) && (
          <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-ink-secondary mb-0.5">You are owed</p>
              <p className="text-sm font-semibold text-positive money">{formatMoneyAbs(totalOwed)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-ink-secondary mb-0.5">You owe</p>
              <p className="text-sm font-semibold text-negative money">{formatMoneyAbs(totalOwing)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Group list */}
      <p className="text-ink-secondary text-xs font-semibold uppercase tracking-wider px-1 mb-3">
        Your groups
      </p>

      <div className="flex flex-col gap-3">
        {groups.map((group, i) => {
          const members = allMembers.filter((m) => m.group_id === group.id)
          const balance = allBalances.find(
            (b) => b.group_id === group.id && b.user_id === userId
          )
          const net = balance?.net_minor ?? 0
          const visibleMembers = members.slice(0, 4)
          const extraCount = members.length - 4

          return (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="bg-surface border border-border rounded-card p-4
                         hover:border-primary/30 active:scale-[0.985]
                         transition-all block"
              style={{
                animation: `fadeSlideUp 350ms ease-out ${80 + i * 60}ms both`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl leading-none shrink-0" aria-hidden="true">
                    {group.icon ?? '👥'}
                  </span>
                  <h2 className="font-display text-base font-medium text-ink truncate">
                    {group.name}
                  </h2>
                </div>
                <div className="text-right shrink-0">
                  <BalanceLine net={net} />
                </div>
              </div>

              <div className="flex items-center mt-3 pl-[34px]">
                <div className="flex -space-x-1.5">
                  {visibleMembers.map((m) => (
                    <Avatar
                      key={m.user_id}
                      name={m.profile.display_name}
                      colorIndex={m.profile.color}
                      size="sm"
                    />
                  ))}
                  {extraCount > 0 && (
                    <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-[10px] font-semibold text-ink-secondary">
                      +{extraCount}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}
