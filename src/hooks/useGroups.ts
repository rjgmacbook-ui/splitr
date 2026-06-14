import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Profile } from '@/types/database'

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: memberships, error: mErr } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
      if (mErr) throw mErr

      const groupIds = memberships.map((m) => m.group_id)
      if (groupIds.length === 0) return []

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id!)
        .is('deleted_at', null)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export type MemberWithProfile = {
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profile: Profile
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, user_id, role, joined_at')
        .eq('group_id', groupId!)
      if (error) throw error

      const userIds = data.map((m) => m.user_id)
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      if (pErr) throw pErr

      const profileMap = new Map(profiles.map((p) => [p.id, p]))
      return data.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? {
          id: m.user_id,
          display_name: 'Unknown',
          color: 0,
          upi_id: null,
          default_currency: 'INR',
          created_at: '',
        },
      })) as MemberWithProfile[]
    },
    enabled: !!groupId,
  })
}

export function useGroupBalances(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.balances(groupId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_balances')
        .select('*')
        .eq('group_id', groupId!)
      if (error) throw error
      return data
    },
    enabled: !!groupId,
  })
}

export function useAllBalances() {
  return useQuery({
    queryKey: queryKeys.dashboard.balances,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: memberships, error: mErr } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
      if (mErr) throw mErr

      const groupIds = memberships.map((m) => m.group_id)
      if (groupIds.length === 0) return []

      const { data, error } = await supabase
        .from('group_balances')
        .select('*')
        .in('group_id', groupIds)
      if (error) throw error
      return data
    },
  })
}

export function useAllMembers() {
  return useQuery({
    queryKey: ['all-members'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: memberships, error: mErr } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
      if (mErr) throw mErr

      const groupIds = memberships.map((m) => m.group_id)
      if (groupIds.length === 0) return []

      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, user_id, role, joined_at')
        .in('group_id', groupIds)
      if (error) throw error

      const userIds = [...new Set(data.map((m) => m.user_id))]
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      if (pErr) throw pErr

      const profileMap = new Map(profiles.map((p) => [p.id, p]))
      return data.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? {
          id: m.user_id,
          display_name: 'Unknown',
          color: 0,
          upi_id: null,
          default_currency: 'INR',
          created_at: '',
        },
      })) as MemberWithProfile[]
    },
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; type: string; icon?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const groupId = crypto.randomUUID()

      const { error } = await supabase
        .from('groups')
        .insert({
          id: groupId,
          name: input.name,
          type: input.type as 'trip' | 'home' | 'couple' | 'other',
          icon: input.icon || null,
          created_by: user.id,
        })
      if (error) throw error

      const { error: memberErr } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id, role: 'admin' })
      if (memberErr) throw memberErr

      return { id: groupId, name: input.name, type: input.type, icon: input.icon || null }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      name?: string
      simplify_debts?: boolean
      icon?: string | null
    }) => {
      const { id, ...fields } = input
      const { error } = await (supabase.from('groups') as any)
        .update(fields)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await (supabase.from('groups') as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', groupId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useLeaveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useCreateInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const token = crypto.randomUUID()
      const { error } = await supabase
        .from('group_invites')
        .insert({ token, group_id: groupId, created_by: user.id })
      if (error) throw error
      return { token, group_id: groupId }
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.invites(groupId) })
    },
  })
}

export function useGroupInvite(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.invites(groupId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_invites')
        .select('*')
        .eq('group_id', groupId!)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!groupId,
  })
}

export function useJoinGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('join_group', { invite_token: token })
      if (error) throw error
      return data as unknown as { group_id: string; already_member: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useInviteInfo(token: string | undefined) {
  return useQuery({
    queryKey: ['invite-info', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_invite_info', { invite_token: token! })
      if (error) throw error
      return data as unknown as {
        valid: boolean
        reason?: string
        group_name?: string
        group_type?: string
        group_icon?: string | null
        invited_by?: string
      }
    },
    enabled: !!token,
  })
}
