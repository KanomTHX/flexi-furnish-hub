import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Types สำหรับ Supabase
export interface SupabaseProduct {
  id: string
  product_code: string
  name: string
  description?: string
  category_id: string
  unit: string
  cost_price: number
  selling_price: number
  min_stock_level: number
  max_stock_level: number
  status: 'active' | 'inactive' | 'discontinued'
  created_at: string
  updated_at: string
  // Relations
  category?: {
    id: string
    name: string
    code: string
  }
  inventory?: {
    branch_id: string
    quantity: number
    available_quantity: number
    status: string
  }[]
}

export interface SupabaseSalesTransaction {
  id: string
  branch_id: string
  customer_id?: string
  employee_id: string
  transaction_number: string
  transaction_date: string
  total_amount: number
  discount_amount: number
  tax_amount: number
  net_amount: number
  payment_method: 'cash' | 'card' | 'transfer' | 'credit'
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  notes?: string
  created_at: string
  updated_at: string
}

export interface SupabaseSalesTransactionItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_amount: number
  total_amount: number
  created_at: string
}

export function useSupabasePOS() {
  const [products, setProducts] = useState<SupabaseProduct[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // ดึงข้อมูลหมวดหมู่สินค้า
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setCategories(data || [])
      return data || []
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      return []
    }
  }, [])

  // ดึงข้อมูลสินค้า
  const fetchProducts = useCallback(async (branchId?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name, code),
          inventory:product_inventory(
            branch_id,
            quantity,
            available_quantity,
            status
          )
        `)
        .eq('status', 'active')
        .order('name')

      const { data, error } = await query

      if (error) throw error

      // กรองสินค้าตาม branch ถ้าระบุ
      let filteredData = data || []
      if (branchId) {
        filteredData = filteredData.filter(product => 
          product.inventory?.some((inv: any) => inv.branch_id === branchId)
        )
      }

      setProducts(filteredData)
      return filteredData
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลสินค้าได้",
        variant: "destructive"
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [toast])

  // สร้างธุรกรรมการขาย
  const createSalesTransaction = useCallback(async (transactionData: {
    branch_id: string
    customer_id?: string
    employee_id: string
    items: {
      product_id: string
      quantity: number
      unit_price: number
      discount_amount?: number
    }[]
    total_amount: number
    discount_amount?: number
    tax_amount: number
    payment_method: 'cash' | 'card' | 'transfer' | 'credit'
    notes?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      // สร้างหมายเลขธุรกรรม
      const transactionNumber = `POS${Date.now().toString().slice(-8)}`
      const net_amount = transactionData.total_amount - (transactionData.discount_amount || 0) + transactionData.tax_amount

      // สร้างธุรกรรมหลัก
      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert({
          branch_id: transactionData.branch_id,
          customer_id: transactionData.customer_id,
          employee_id: transactionData.employee_id,
          transaction_number: transactionNumber,
          transaction_date: new Date().toISOString(),
          total_amount: transactionData.total_amount,
          discount_amount: transactionData.discount_amount || 0,
          tax_amount: transactionData.tax_amount,
          net_amount: net_amount,
          payment_method: transactionData.payment_method,
          status: 'completed',
          notes: transactionData.notes
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // สร้างรายการสินค้า
      const transactionItems = transactionData.items.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        total_amount: (item.quantity * item.unit_price) - (item.discount_amount || 0)
      }))

      const { error: itemsError } = await supabase
        .from('sales_transaction_items')
        .insert(transactionItems)

      if (itemsError) throw itemsError

      // อัปเดตสต็อกสินค้า
      for (const item of transactionData.items) {
        await updateProductStock(item.product_id, transactionData.branch_id, -item.quantity)
      }

      toast({
        title: "บันทึกการขายสำเร็จ",
        description: `ธุรกรรม ${transactionNumber} ถูกบันทึกแล้ว`,
      })

      return transaction
    } catch (err) {
      console.error('Error creating sales transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to create sales transaction')
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการขายได้",
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  // อัปเดตสต็อกสินค้า
  const updateProductStock = useCallback(async (
    productId: string, 
    branchId: string, 
    quantityChange: number
  ) => {
    try {
      // ดึงข้อมูลสต็อกปัจจุบัน
      const { data: currentStock, error: fetchError } = await supabase
        .from('product_inventory')
        .select('quantity, reserved_quantity')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .single()

      if (fetchError) {
        // ถ้าไม่มีข้อมูลสต็อก ให้สร้างใหม่
        if (fetchError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('product_inventory')
            .insert({
              product_id: productId,
              branch_id: branchId,
              quantity: Math.max(0, quantityChange),
              reserved_quantity: 0
            })
          
          if (insertError) throw insertError
          return
        }
        throw fetchError
      }

      // คำนวณสต็อกใหม่
      const newQuantity = Math.max(0, currentStock.quantity + quantityChange)
      
      // อัปเดตสต็อก
      const { error: updateError } = await supabase
        .from('product_inventory')
        .update({ 
          quantity: newQuantity,
          last_updated: new Date().toISOString(),
          status: newQuantity === 0 ? 'out_of_stock' : 
                  newQuantity <= 5 ? 'low_stock' : 'available'
        })
        .eq('product_id', productId)
        .eq('branch_id', branchId)

      if (updateError) throw updateError

      // บันทึกการเคลื่อนไหวสต็อก
      await supabase
        .from('stock_movements')
        .insert({
          branch_id: branchId,
          product_id: productId,
          movement_type: quantityChange > 0 ? 'in' : 'out',
          quantity: Math.abs(quantityChange),
          reference_type: 'sale',
          notes: quantityChange > 0 ? 'เพิ่มสต็อก' : 'ขายสินค้า',
          created_by: 'system' // TODO: ใช้ user ID จริง
        })

    } catch (err) {
      console.error('Error updating product stock:', err)
      throw err
    }
  }, [])

  // ดึงข้อมูลการขาย
  const fetchSalesTransactions = useCallback(async (branchId?: string, limit = 50) => {
    try {
      let query = supabase
        .from('sales_transactions')
        .select(`
          *,
          customer:customers(name, phone),
          employee:employees(first_name, last_name),
          items:sales_transaction_items(
            *,
            product:products(name, product_code)
          )
        `)
        .order('transaction_date', { ascending: false })
        .limit(limit)

      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching sales transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch sales transactions')
      return []
    }
  }, [])

  // ดึงข้อมูลสต็อกสินค้า
  const getProductStock = useCallback(async (productId: string, branchId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_inventory')
        .select('quantity, available_quantity, status')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { quantity: 0, available_quantity: 0, status: 'out_of_stock' }
        }
        throw error
      }

      return data
    } catch (err) {
      console.error('Error getting product stock:', err)
      return { quantity: 0, available_quantity: 0, status: 'out_of_stock' }
    }
  }, [])

  // เริ่มต้นดึงข้อมูล
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    // Data
    products,
    categories,
    loading,
    error,

    // Functions
    fetchProducts,
    fetchCategories,
    createSalesTransaction,
    updateProductStock,
    fetchSalesTransactions,
    getProductStock,

    // Utils
    setError,
    setLoading
  }
}