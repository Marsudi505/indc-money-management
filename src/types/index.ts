// ============================================================
// INDC Money Management — TypeScript Types
// ============================================================

export type UserRole = 'admin' | 'team'
export type TransactionType = 'income' | 'expense'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  user_id: string
  title: string
  description: string | null
  event_date: string
  is_locked: boolean
  created_at: string
  updated_at: string
}

export interface EventSummary extends Event {
  owner_name: string | null
  total_income: number
  total_expense: number
  net_profit: number
  transaction_count: number
}

export interface Transaction {
  id: string
  event_id: string
  type: TransactionType
  amount: number
  description: string
  transaction_date: string
  proof_url: string | null
  created_at: string
  updated_at: string
}

export interface GlobalBalance {
  id: number
  total_balance: number
  updated_at: string
}

export interface BalanceAudit {
  id: string
  old_balance: number
  new_balance: number
  reason: string
  updated_by: string
  created_at: string
  profiles?: { full_name: string | null }
}

// Form Types
export interface CreateEventForm {
  title: string
  description: string
  event_date: string
}

export interface CreateTransactionForm {
  type: TransactionType
  amount: string
  description: string
  transaction_date: string
  proof_file: File | null
}

export interface UpdateBalanceForm {
  new_balance: string
  reason: string
}

// API Response
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
