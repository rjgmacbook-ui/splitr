import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useInviteInfo, useJoinGroup } from '@/hooks/useGroups'

export function JoinGroupPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const { data: inviteInfo, isLoading } = useInviteInfo(token)
  const joinGroup = useJoinGroup()
  const autoJoinAttempted = useRef(false)

  useEffect(() => {
    if (autoJoinAttempted.current) return
    if (authLoading || isLoading) return
    if (!user || !token || !inviteInfo?.valid) return

    autoJoinAttempted.current = true
    joinGroup.mutateAsync(token).then((result) => {
      navigate(`/groups/${result.group_id}`, { replace: true })
    }).catch(() => {})
  }, [user, authLoading, isLoading, token, inviteInfo])

  function handleSignIn() {
    if (!token) return
    navigate(`/login?redirect=/join/${token}`)
  }

  if (isLoading || authLoading || joinGroup.isPending) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!inviteInfo?.valid) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="font-display text-xl font-semibold text-ink mb-2">
            Invalid invite
          </h1>
          <p className="text-ink-secondary text-sm mb-6">
            {inviteInfo?.reason ?? 'This link may have expired or been revoked.'}
          </p>
          <button
            onClick={() => navigate(user ? '/' : '/login')}
            className="px-6 py-3 bg-primary text-on-primary rounded-pill text-sm font-semibold
                       hover:bg-primary-hover active:scale-[0.97] transition-all"
          >
            Go to Splitr
          </button>
        </div>
      </div>
    )
  }

  if (joinGroup.isError) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="font-display text-xl font-semibold text-ink mb-2">
            Failed to join
          </h1>
          <p className="text-negative text-sm mb-6">
            {joinGroup.error instanceof Error ? joinGroup.error.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-on-primary rounded-pill text-sm font-semibold
                       hover:bg-primary-hover active:scale-[0.97] transition-all"
          >
            Go to Splitr
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-card bg-surface border border-border
                          flex items-center justify-center text-4xl mx-auto mb-5">
            {inviteInfo.group_icon ?? '👥'}
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink mb-1">
            {inviteInfo.group_name}
          </h1>
          <p className="text-ink-secondary text-sm mb-8">
            {inviteInfo.invited_by} invited you to join this group
          </p>

          <button
            onClick={handleSignIn}
            className="w-full h-12 bg-primary text-on-primary rounded-pill text-[15px] font-semibold
                       hover:bg-primary-hover active:scale-[0.97] transition-all"
          >
            Sign in to join
          </button>

          <p className="text-ink-secondary text-xs mt-4">
            Invite token: {token?.slice(0, 8)}…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
