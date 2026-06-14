import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Expense, ExpensePayer, ExpenseShare, Profile, CreateExpensePayload } from '@/types/database'

export type ExpenseWithDetails = Expense & {
  payers: ExpensePayer[]
  shares: ExpenseShare[]
}

export function useGroupExpenses(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.byGroup(groupId ?? ''),
    queryFn: async () => {
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error

      if (expenses.length === 0) return []

      const expenseIds = expenses.map((e) => e.id)

      const [payersRes, sharesRes] = await Promise.all([
        supabase.from('expense_payers').select('*').in('expense_id', expenseIds),
        supabase.from('expense_shares').select('*').in('expense_id', expenseIds),
      ])
      if (payersRes.error) throw payersRes.error
      if (sharesRes.error) throw sharesRes.error

      const payerMap = new Map<string, ExpensePayer[]>()
      for (const p of payersRes.data) {
        const arr = payerMap.get(p.expense_id) ?? []
        arr.push(p)
        payerMap.set(p.expense_id, arr)
      }

      const shareMap = new Map<string, ExpenseShare[]>()
      for (const s of sharesRes.data) {
        const arr = shareMap.get(s.expense_id) ?? []
        arr.push(s)
        shareMap.set(s.expense_id, arr)
      }

      return expenses.map((e) => ({
        ...e,
        payers: payerMap.get(e.id) ?? [],
        shares: shareMap.get(e.id) ?? [],
      })) as ExpenseWithDetails[]
    },
    enabled: !!groupId,
  })
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id ?? ''),
    queryFn: async () => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id!)
        .is('deleted_at', null)
        .single()
      if (error) throw error

      const [payersRes, sharesRes] = await Promise.all([
        supabase.from('expense_payers').select('*').eq('expense_id', id!),
        supabase.from('expense_shares').select('*').eq('expense_id', id!),
      ])
      if (payersRes.error) throw payersRes.error
      if (sharesRes.error) throw sharesRes.error

      return {
        ...expense,
        payers: payersRes.data,
        shares: sharesRes.data,
      } as ExpenseWithDetails
    },
    enabled: !!id,
  })
}

export function useProfiles(userIds: string[]) {
  const sorted = [...new Set(userIds)].sort()
  return useQuery({
    queryKey: queryKeys.profiles.byIds(sorted),
    queryFn: async () => {
      if (sorted.length === 0) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', sorted)
      if (error) throw error
      return data as Profile[]
    },
    enabled: sorted.length > 0,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const { data, error } = await supabase.rpc('create_expense', {
        payload: payload as any,
      })
      if (error) throw error
      return data as unknown as string
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byGroup(variables.group_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(variables.group_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.balances })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expense: { id: string; group_id: string }) => {
      const { error } = await (supabase.from('expenses') as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', expense.id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byGroup(variables.group_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(variables.group_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.balances })
    },
  })
}

export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      group_id: string
      from_user_id: string
      to_user_id: string
      amount_minor: number
    }) => {
      const payload: CreateExpensePayload = {
        group_id: input.group_id,
        description: 'Payment',
        amount_minor: input.amount_minor,
        currency: 'INR',
        category: 'general',
        is_payment: true,
        payers: [{ user_id: input.from_user_id, paid_minor: input.amount_minor }],
        shares: [{ user_id: input.to_user_id, owed_minor: input.amount_minor }],
      }
      const { data, error } = await supabase.rpc('create_expense', {
        payload: payload as any,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byGroup(variables.group_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(variables.group_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.balances })
    },
  })
}
