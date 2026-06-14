import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/useAuth'
import {
  useGroup,
  useGroupMembers,
  useGroupBalances,
  useUpdateGroup,
  useDeleteGroup,
  useLeaveGroup,
  useGroupInvite,
  useCreateInvite,
} from '@/hooks/useGroups'
import { GROUP_TYPE_ICONS } from '@/lib/categories'

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 15L7.5 10l5-5" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink-secondary text-xs font-semibold uppercase tracking-wider px-1 mb-2">
      {children}
    </p>
  )
}

export function GroupSettingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: group, isLoading } = useGroup(id)
  const { data: members = [] } = useGroupMembers(id)
  const { data: balances = [] } = useGroupBalances(id)
  const { data: existingInvite } = useGroupInvite(id)

  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()
  const leaveGroup = useLeaveGroup()
  const createInvite = useCreateInvite()

  const userMember = members.find((m) => m.user_id === userId)
  const isAdmin = userMember?.role === 'admin'
  const userBalance = balances.find((b) => b.group_id === id && b.user_id === userId)
  const canLeave = (userBalance?.net_minor ?? 0) === 0

  const [groupName, setGroupName] = useState('')
  const [simplifyDebts, setSimplifyDebts] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (group) {
      setGroupName(group.name)
      setSimplifyDebts(group.simplify_debts)
    }
  }, [group])

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

  const inviteUrl = existingInvite
    ? `${window.location.origin}/join/${existingInvite.token}`
    : ''

  function handleCopy() {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCreateInvite() {
    if (!id) return
    await createInvite.mutateAsync(id)
  }

  function handleNameBlur() {
    const trimmed = groupName.trim()
    if (id && group && trimmed && trimmed !== group.name) {
      updateGroup.mutate({ id, name: trimmed })
    }
  }

  function handleSimplifyToggle() {
    const next = !simplifyDebts
    setSimplifyDebts(next)
    if (id) updateGroup.mutate({ id, simplify_debts: next })
  }

  async function handleLeave() {
    if (!id || !canLeave) return
    await leaveGroup.mutateAsync(id)
    navigate('/')
  }

  async function handleDelete() {
    if (!id) return
    await deleteGroup.mutateAsync(id)
    navigate('/')
  }

  return (
    <div className="pb-8">
      <header className="px-4 pt-5 pb-3 flex items-center gap-2">
        <Link
          to={`/groups/${id}`}
          className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full
                     text-ink-secondary hover:text-ink hover:bg-ink/[0.05] transition-colors"
          aria-label="Back to group"
        >
          <BackIcon />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink">Settings</h1>
      </header>

      <div className="px-4 flex flex-col gap-5">
        {/* Group info */}
        <div>
          <SectionLabel>Group info</SectionLabel>
          <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-bg flex items-center justify-center text-2xl">
                {group.icon ?? GROUP_TYPE_ICONS[group.type] ?? '👥'}
              </div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onBlur={handleNameBlur}
                disabled={!isAdmin}
                className="flex-1 h-11 px-3 rounded-md border border-border bg-bg text-ink font-medium
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                           disabled:opacity-60 transition-shadow"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink">Simplify debts</span>
              <button
                onClick={handleSimplifyToggle}
                className={`w-11 h-6 rounded-full transition-colors relative
                  ${simplifyDebts ? 'bg-primary' : 'bg-border'}`}
                role="switch"
                aria-checked={simplifyDebts}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform
                    ${simplifyDebts ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Members */}
        <div>
          <SectionLabel>Members ({members.length})</SectionLabel>
          <div className="bg-surface border border-border rounded-card divide-y divide-border">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 p-3.5">
                <Avatar name={m.profile.display_name} colorIndex={m.profile.color} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {m.profile.display_name}
                    {m.user_id === userId && <span className="text-ink-secondary font-normal"> (you)</span>}
                  </p>
                  <p className="text-xs text-ink-secondary">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite link */}
        {isAdmin && (
          <div>
            <SectionLabel>Invite link</SectionLabel>
            <div className="bg-surface border border-border rounded-card p-4">
              {inviteUrl ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="flex-1 h-11 px-3 rounded-md border border-border bg-bg text-ink text-sm truncate
                                 focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="h-11 px-4 rounded-md border border-border bg-bg
                                 flex items-center gap-1.5 text-sm font-medium text-ink
                                 hover:border-primary/30 active:scale-[0.97] transition-all shrink-0"
                    >
                      <CopyIcon />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-ink-secondary text-xs mt-2 px-1">
                    Anyone with this link can join. Expires in 7 days.
                  </p>
                </>
              ) : (
                <button
                  onClick={handleCreateInvite}
                  disabled={createInvite.isPending}
                  className="w-full h-11 rounded-pill border border-border bg-bg
                             flex items-center justify-center text-sm font-medium text-ink
                             hover:border-primary/30 active:scale-[0.97] transition-all
                             disabled:opacity-50"
                >
                  {createInvite.isPending ? 'Creating…' : 'Generate invite link'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Danger zone */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleLeave}
            disabled={!canLeave || leaveGroup.isPending}
            className="w-full h-12 rounded-card border border-border bg-surface
                       flex items-center justify-center text-sm font-medium
                       text-ink hover:border-negative hover:text-negative
                       active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:pointer-events-none"
          >
            {canLeave ? 'Leave group' : 'Settle up before leaving'}
          </button>

          {isAdmin && (
            <>
              {showDeleteConfirm ? (
                <div className="bg-negative/10 border border-negative/30 rounded-card p-4 flex flex-col gap-2">
                  <p className="text-sm text-negative font-medium">Delete this group? This can't be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 h-10 rounded-pill border border-border text-sm font-medium text-ink
                                 hover:bg-ink/[0.04] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteGroup.isPending}
                      className="flex-1 h-10 rounded-pill bg-negative text-white text-sm font-semibold
                                 hover:opacity-90 active:scale-[0.97] transition-all
                                 disabled:opacity-50"
                    >
                      {deleteGroup.isPending ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-12 rounded-card border border-border bg-surface
                             flex items-center justify-center text-sm font-medium
                             text-negative hover:border-negative
                             active:scale-[0.98] transition-all"
                >
                  Delete group
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
