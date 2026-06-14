import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Profile } from '@/types/database'

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data as Profile
    },
    enabled: !!userId,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: {
      id: string
      display_name?: string
      color?: number
      upi_id?: string | null
      default_currency?: string
    }) => {
      const { id, ...fields } = update
      const { error } = await supabase
        .from('profiles')
        .update(fields)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile })
    },
  })
}
