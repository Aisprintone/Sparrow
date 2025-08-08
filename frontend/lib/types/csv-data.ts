export interface Customer {
  customer_id: number
  location: string
  age: number
}

export interface Account {
  account_id: number
  customer_id: number
  institution_name: string
  account_number: string
  account_type: 'checking' | 'savings' | 'credit_card' | 'mortgage' | 'investment' | 'student_loan' | 'auto_loan'
  balance: number
  created_at: string
  credit_limit?: number
}

export interface Transaction {
  transaction_id: number
  account_id: number
  timestamp: string
  amount: number
  description: string
  category_id: number
  is_debit: boolean
  is_bill: boolean
  is_subscription: boolean
  due_date?: string
  account_type: string
}

export interface Category {
  category_id: number
  name: string
}

export interface Goal {
  goal_id: number
  customer_id: number
  name: string
  description: string
  target_amount: number
  target_date: string
}

export interface ProfileData {
  customer: Customer
  accounts: Account[]
  transactions: Transaction[]
  goals: Goal[]
  categories: Category[]
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  monthlySpending: {
    total: number
    categories: Record<string, number>
  }
  creditScore: number
  lastMonthScore: number
}

export interface DataStore {
  customers: Customer[]
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  goals: Goal[]
  profiles: Map<number, ProfileData>
}