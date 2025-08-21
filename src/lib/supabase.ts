import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const useServiceRole = import.meta.env.VITE_USE_SERVICE_ROLE === 'true'

// ตรวจสอบว่ามี environment variables หรือไม่
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ VITE_SUPABASE_URL is not set in .env.local')
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not set in .env.local')
}

// เลือกใช้ Key ตามการตั้งค่า
const selectedKey = useServiceRole ? supabaseServiceRoleKey : supabaseAnonKey

// สร้าง fallback URL และ Key เพื่อป้องกัน error
const safeUrl = supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co'

const safeKey = selectedKey && !selectedKey.includes('YOUR_') 
  ? selectedKey 
  : 'placeholder-key'

// Create Supabase client
export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// สร้าง client แยกสำหรับ admin operations (เฉพาะเมื่อจำเป็น)
const safeServiceRoleKey = supabaseServiceRoleKey && !supabaseServiceRoleKey.includes('YOUR_') 
  ? supabaseServiceRoleKey 
  : 'placeholder-service-key'

// สร้าง admin client เฉพาะเมื่อไม่ใช่ client ปกติ
export const supabaseAdmin = useServiceRole 
  ? supabase // ใช้ client เดียวกันถ้าใช้ service role แล้ว
  : createClient(safeUrl, safeServiceRoleKey, {
      auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types (based on our SQL schema)
export interface Branch {
  id: string
  code: string
  name: string
  address?: string
  phone?: string
  email?: string
  manager_name?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  branch_id: string
  employee_code: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  position?: string
  department?: string
  hire_date?: string
  salary?: number
  status: 'active' | 'inactive' | 'terminated'
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  branch_id: string
  customer_code?: string
  type: 'individual' | 'business'
  name: string
  phone?: string
  email?: string
  address?: string
  tax_id?: string
  credit_limit?: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  code: string
  name: string
  description?: string
  parent_id?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  category_id: string
  code: string
  name: string
  description?: string
  unit: string
  barcode?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface SalesTransaction {
  id: string
  branch_id: string
  customer_id?: string
  employee_id: string
  transaction_number: string
  transaction_date: string
  total_amount: number
  discount_amount?: number
  tax_amount?: number
  net_amount: number
  payment_method: 'cash' | 'card' | 'transfer' | 'credit'
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface AccountingTransaction {
  id: string
  branch_id: string
  transaction_number: string
  transaction_date: string
  reference_type: 'sales' | 'purchase' | 'payment' | 'receipt' | 'adjustment' | 'other'
  reference_id?: string
  description: string
  total_amount: number
  status: 'draft' | 'posted' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

// Database helper functions
export const dbHelpers = {
  // Branches
  async getBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('status', 'active')
      .order('name')
    
    if (error) throw error
    return data as Branch[]
  },

  async getBranchById(id: string) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Branch
  },

  // Employees
  async getEmployees(branchId?: string) {
    let query = supabase
      .from('employees')
      .select('*')
      .eq('status', 'active')
    
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    
    const { data, error } = await query.order('first_name')
    
    if (error) throw error
    return data as Employee[]
  },

  // Customers
  async getCustomers(branchId?: string) {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('status', 'active')
    
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    
    const { data, error } = await query.order('name')
    
    if (error) throw error
    return data as Customer[]
  },

  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(*)
      `)
      .eq('status', 'active')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Sales Transactions
  async getSalesTransactions(branchId?: string, limit = 100) {
    let query = supabase
      .from('sales_transactions')
      .select(`
        *,
        customer:customers(name),
        employee:employees(first_name, last_name),
        branch:branches(name)
      `)
    
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    
    const { data, error } = await query
      .order('transaction_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Accounting Transactions
  async getAccountingTransactions(branchId?: string, limit = 100) {
    let query = supabase
      .from('accounting_transactions')
      .select(`
        *,
        branch:branches(name)
      `)
    
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    
    const { data, error } = await query
      .order('transaction_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Chart of Accounts
  async getChartOfAccounts() {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('status', 'active')
      .order('account_code')
    
    if (error) throw error
    return data
  },

  // Create new accounting transaction
  async createAccountingTransaction(transaction: Omit<AccountingTransaction, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('accounting_transactions')
      .insert(transaction)
      .select()
      .single()
    
    if (error) throw error
    return data as AccountingTransaction
  },

  // Update accounting transaction
  async updateAccountingTransaction(id: string, updates: Partial<AccountingTransaction>) {
    const { data, error } = await supabase
      .from('accounting_transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as AccountingTransaction
  },

  // Delete accounting transaction
  async deleteAccountingTransaction(id: string) {
    const { error } = await supabase
      .from('accounting_transactions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }
}

export default supabase