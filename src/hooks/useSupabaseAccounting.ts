import { useState, useEffect } from 'react'
import { supabase, dbHelpers, AccountingTransaction, Branch } from '@/lib/supabase'

export interface UseSupabaseAccountingReturn {
  // Data
  transactions: AccountingTransaction[]
  branches: Branch[]
  
  // Loading states
  loading: boolean
  transactionsLoading: boolean
  branchesLoading: boolean
  
  // Error states
  error: string | null
  
  // Actions
  createTransaction: (transaction: Omit<AccountingTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<AccountingTransaction>
  updateTransaction: (id: string, updates: Partial<AccountingTransaction>) => Promise<AccountingTransaction>
  deleteTransaction: (id: string) => Promise<boolean>
  refreshTransactions: () => Promise<void>
  refreshBranches: () => Promise<void>
  
  // Filters
  selectedBranch: string | null
  setSelectedBranch: (branchId: string | null) => void
  dateRange: { start: string; end: string }
  setDateRange: (range: { start: string; end: string }) => void
}

export function useSupabaseAccounting(): UseSupabaseAccountingReturn {
  // State
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [branchesLoading, setBranchesLoading] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Reload transactions when filters change
  useEffect(() => {
    if (!loading) {
      refreshTransactions()
    }
  }, [selectedBranch, dateRange])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        refreshBranches(),
        refreshTransactions()
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const refreshBranches = async () => {
    try {
      setBranchesLoading(true)
      const branchData = await dbHelpers.getBranches()
      setBranches(branchData)
    } catch (err) {
      console.error('Error loading branches:', err)
      setError('ไม่สามารถโหลดข้อมูลสาขาได้')
    } finally {
      setBranchesLoading(false)
    }
  }

  const refreshTransactions = async () => {
    try {
      setTransactionsLoading(true)
      
      // Build query with filters
      let query = supabase
        .from('accounting_transactions')
        .select(`
          *,
          branch:branches(name)
        `)
        .gte('transaction_date', dateRange.start)
        .lte('transaction_date', dateRange.end)
      
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch)
      }
      
      const { data, error: queryError } = await query
        .order('transaction_date', { ascending: false })
        .limit(1000)
      
      if (queryError) throw queryError
      
      setTransactions(data || [])
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError('ไม่สามารถโหลดข้อมูลธุรกรรมได้')
    } finally {
      setTransactionsLoading(false)
    }
  }

  const createTransaction = async (transactionData: Omit<AccountingTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<AccountingTransaction> => {
    try {
      setError(null)
      
      // Generate transaction number if not provided
      const transactionNumber = transactionData.transaction_number || 
        `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      const newTransaction = await dbHelpers.createAccountingTransaction({
        ...transactionData,
        transaction_number: transactionNumber
      })
      
      // Refresh transactions to show the new one
      await refreshTransactions()
      
      return newTransaction
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างธุรกรรมได้'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateTransaction = async (id: string, updates: Partial<AccountingTransaction>): Promise<AccountingTransaction> => {
    try {
      setError(null)
      
      const updatedTransaction = await dbHelpers.updateAccountingTransaction(id, updates)
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updatedTransaction } : t)
      )
      
      return updatedTransaction
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถอัปเดตธุรกรรมได้'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      setError(null)
      
      await dbHelpers.deleteAccountingTransaction(id)
      
      // Remove from local state
      setTransactions(prev => prev.filter(t => t.id !== id))
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถลบธุรกรรมได้'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    // Data
    transactions,
    branches,
    
    // Loading states
    loading,
    transactionsLoading,
    branchesLoading,
    
    // Error state
    error,
    
    // Actions
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
    refreshBranches,
    
    // Filters
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange
  }
}