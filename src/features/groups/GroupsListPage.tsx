import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { useGroups, useAllMembers } from '@/hooks/useGroups'

export function GroupsListPage() {
  const navigate = useNavigate()
  const { data: groups = [], isLoading } = useGroups()
  const { data: allMembers = [] } = useAllMembers()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold text-ink">Groups</h1>
        <Link
          to="/groups/new"
          className="h-9 px-4 rounded-pill bg-primary text-on-primary text-sm font-semibold
                     flex items-center hover:bg-primary-hover active:scale-[0.97] transition-all"
        >
          + New
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          message="No groups yet — create one to start splitting expenses."
          action={{ label: 'Create group', onClick: () => navigate('/groups/new') }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((group) => {
            const members = allMembers.filter((m) => m.group_id === group.id)
            return (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="bg-surface border border-border rounded-card p-4
                           hover:border-primary/30 active:scale-[0.985] transition-all flex items-center gap-3"
              >
                <span className="text-xl leading-none shrink-0">{group.icon ?? '👥'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base font-medium text-ink truncate">{group.name}</p>
                  <p className="text-xs text-ink-secondary mt-0.5">{members.length} members</p>
                </div>
                <div className="flex -space-x-1.5">
                  {members.slice(0, 3).map((m) => (
                    <Avatar key={m.user_id} name={m.profile.display_name} colorIndex={m.profile.color} size="sm" />
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
