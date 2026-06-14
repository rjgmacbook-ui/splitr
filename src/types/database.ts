// Generated types for Supabase schema
// In production, regenerate with: supabase gen types typescript --local > src/types/database.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          color: number
          upi_id: string | null
          default_currency: string
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string
          color?: number
          upi_id?: string | null
          default_currency?: string
          created_at?: string
        }
        Update: {
          display_name?: string
          color?: number
          upi_id?: string | null
          default_currency?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          type: 'trip' | 'home' | 'couple' | 'other'
          icon: string | null
          simplify_debts: boolean
          created_by: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type?: 'trip' | 'home' | 'couple' | 'other'
          icon?: string | null
          simplify_debts?: boolean
          created_by: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          name?: string
          type?: 'trip' | 'home' | 'couple' | 'other'
          icon?: string | null
          simplify_debts?: boolean
          deleted_at?: string | null
        }
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          role?: 'admin' | 'member'
        }
      }
      group_invites: {
        Row: {
          token: string
          group_id: string
          created_by: string
          expires_at: string
          max_uses: number | null
          use_count: number
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          token?: string
          group_id: string
          created_by: string
          expires_at?: string
          max_uses?: number | null
          use_count?: number
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          max_uses?: number | null
          use_count?: number
          revoked_at?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          description: string
          amount_minor: number
          currency: string
          category: string
          expense_date: string
          notes: string | null
          is_payment: boolean
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          description: string
          amount_minor: number
          currency?: string
          category?: string
          expense_date?: string
          notes?: string | null
          is_payment?: boolean
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          description?: string
          amount_minor?: number
          currency?: string
          category?: string
          expense_date?: string
          notes?: string | null
          is_payment?: boolean
          updated_by?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
      }
      expense_payers: {
        Row: {
          expense_id: string
          user_id: string
          paid_minor: number
        }
        Insert: {
          expense_id: string
          user_id: string
          paid_minor: number
        }
        Update: {
          paid_minor?: number
        }
      }
      expense_shares: {
        Row: {
          expense_id: string
          user_id: string
          owed_minor: number
        }
        Insert: {
          expense_id: string
          user_id: string
          owed_minor: number
        }
        Update: {
          owed_minor?: number
        }
      }
    }
    Views: {
      group_balances: {
        Row: {
          group_id: string
          user_id: string
          net_minor: number
        }
      }
    }
    Functions: {
      join_group: {
        Args: { invite_token: string }
        Returns: { group_id: string; already_member: boolean }
      }
      create_expense: {
        Args: { payload: CreateExpensePayload }
        Returns: string
      }
      update_expense: {
        Args: { payload: UpdateExpensePayload }
        Returns: void
      }
      get_invite_info: {
        Args: { invite_token: string }
        Returns: InviteInfo
      }
      is_group_member: {
        Args: { gid: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { gid: string }
        Returns: boolean
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type GroupInvite = Database['public']['Tables']['group_invites']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpensePayer = Database['public']['Tables']['expense_payers']['Row']
export type ExpenseShare = Database['public']['Tables']['expense_shares']['Row']
export type GroupBalance = Database['public']['Views']['group_balances']['Row']

export interface CreateExpensePayload {
  group_id: string
  description: string
  amount_minor: number
  currency?: string
  category?: string
  expense_date?: string
  notes?: string | null
  is_payment?: boolean
  payers: { user_id: string; paid_minor: number }[]
  shares: { user_id: string; owed_minor: number }[]
}

export interface UpdateExpensePayload extends CreateExpensePayload {
  id: string
}

export interface InviteInfo {
  valid: boolean
  reason?: string
  group_name?: string
  group_type?: string
  group_icon?: string | null
  invited_by?: string
}
