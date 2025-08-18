import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import type {
  AccountingExpense,
  ExpenseCategory,
  ExpenseFilter,
  ExpenseStatus,
  PaymentMethod
} from '../types/accountingExtended';

// Define missing types for create operations
interface CreateExpenseData {
  categoryId: string;
  branchId: string;
  description: string;
  amount: number;
  vatAmount?: number;
  vatRate?: number;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  vendor?: string;
  receiptNumber?: string;
  employeeId?: string;
  attachments?: string[];
}

interface CreateExpenseCategoryData {
  name: string;
  code: string;
  description?: string;
  accountId: string;
  isActive?: boolean;
}

export function useExpenseManagement() {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<AccountingExpense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const { toast } = useToast();

  // ========================================
  // EXPENSE CATEGORY MANAGEMENT
  // ========================================

  const fetchExpenseCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      
      const transformedData = data?.map(category => ({
        id: category.id,
        name: category.name,
        code: category.code,
        description: category.description,
        accountId: category.account_id,
        isActive: category.is_active
      })) || [];

      setExpenseCategories(transformedData);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลหมวดหมู่ค่าใช้จ่ายได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpenseCategory = async (data: CreateExpenseCategoryData) => {
    try {
      setLoading(true);
      
      const { data: category, error } = await supabase
        .from('expense_categories')
        .insert({
          name: data.name,
          code: data.code,
          description: data.description,
          account_id: data.accountId,
          is_active: data.isActive ?? true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'สร้างหมวดหมู่ค่าใช้จ่ายเรียบร้อยแล้ว'
      });

      await fetchExpenseCategories();
      return category;
    } catch (error) {
      console.error('Error creating expense category:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างหมวดหมู่ค่าใช้จ่ายได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateExpenseCategory = async (id: string, data: Partial<CreateExpenseCategoryData>) => {
    try {
      setLoading(true);
      
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.code) updateData.code = data.code;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.accountId) updateData.account_id = data.accountId;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { error } = await supabase
        .from('expense_categories')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตหมวดหมู่ค่าใช้จ่ายเรียบร้อยแล้ว'
      });

      await fetchExpenseCategories();
    } catch (error) {
      console.error('Error updating expense category:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตหมวดหมู่ค่าใช้จ่ายได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteExpenseCategory = async (id: string) => {
    try {
      setLoading(true);
      
      // ตรวจสอบว่ามีค่าใช้จ่ายที่ใช้หมวดหมู่นี้หรือไม่
      const { data: expenseCount } = await supabase
        .from('accounting_expenses')
        .select('id', { count: 'exact' })
        .eq('category_id', id);

      if (expenseCount && expenseCount.length > 0) {
        toast({
          title: 'ไม่สามารถลบได้',
          description: 'มีค่าใช้จ่ายที่ใช้หมวดหมู่นี้อยู่',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'ลบหมวดหมู่ค่าใช้จ่ายเรียบร้อยแล้ว'
      });

      await fetchExpenseCategories();
    } catch (error) {
      console.error('Error deleting expense category:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถลบหมวดหมู่ค่าใช้จ่ายได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // EXPENSE MANAGEMENT
  // ========================================

  const fetchExpenses = async (filters?: ExpenseFilter) => {
    try {
      setLoading(true);
      let query = supabase
        .from('accounting_expenses')
        .select(`
          *,
          expense_categories(*)
        `);

      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.dateFrom) {
        query = query.gte('expense_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('expense_date', filters.dateTo);
      }
      if (filters?.amountFrom) {
        query = query.gte('amount', filters.amountFrom);
      }
      if (filters?.amountTo) {
        query = query.lte('amount', filters.amountTo);
      }
      // Payment method filter removed as it's not in ExpenseFilter interface
      if (filters?.search) {
        query = query.or(`description.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('expense_date', { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface
      const transformedData = data?.map(expense => ({
        id: expense.id,
        expenseNumber: expense.expense_number,
        categoryId: expense.category_id,
        category: {
          id: expense.expense_categories.id,
          name: expense.expense_categories.name,
          code: expense.expense_categories.code,
          accountId: expense.expense_categories.account_id,
          isActive: expense.expense_categories.is_active,
          description: expense.expense_categories.description
        },
        branchId: expense.branch_id,
        branch: {
          id: expense.branch_id,
          name: expense.branch_name || '',
          code: expense.branch_code || ''
        },
        description: expense.description,
        amount: expense.amount,
        vatAmount: expense.vat_amount || 0,
        vatRate: expense.vat_rate || 0,
        withholdingTaxAmount: expense.withholding_tax_amount || 0,
        withholdingTaxRate: expense.withholding_tax_rate || 0,
        totalAmount: expense.total_amount,
        expenseDate: expense.expense_date,
        paymentMethod: expense.payment_method as PaymentMethod,
        referenceNumber: expense.reference_number,
        employeeId: expense.employee_id,
        employee: expense.employee_id ? {
          id: expense.employee_id,
          name: expense.employee_name || '',
          position: expense.employee_position || ''
        } : undefined,
        vendor: expense.vendor,
        receiptNumber: expense.receipt_number,
        approvedBy: expense.approved_by,
        approvedAt: expense.approved_at,
        status: expense.status as ExpenseStatus,
        attachments: expense.attachments || [],
        notes: expense.notes,
        journalEntryId: expense.journal_entry_id,
        createdBy: expense.created_by,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at
      })) || [];

      setExpenses(transformedData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลค่าใช้จ่ายได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (data: CreateExpenseData) => {
    try {
      setLoading(true);
      
      // สร้างเลขที่ค่าใช้จ่ายอัตโนมัติ
      const expenseNumber = `EXP${Date.now()}`;
      
      // คำนวณยอดรวม
      const totalAmount = data.amount + (data.vatAmount || 0);
      
      const { data: expense, error } = await supabase
        .from('accounting_expenses')
        .insert({
          expense_number: expenseNumber,
          category_id: data.categoryId,
          branch_id: data.branchId,
          description: data.description,
          amount: data.amount,
          vat_amount: data.vatAmount || 0,
          vat_rate: data.vatRate || 0,
          total_amount: totalAmount,
          expense_date: data.expenseDate,
          payment_method: data.paymentMethod,
          vendor: data.vendor,
          receipt_number: data.receiptNumber,
          employee_id: data.employeeId,
          attachments: data.attachments || [],
          status: 'pending',
          created_by: 'current_user' // TODO: ใช้ user ID จริง
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'สร้างรายการค่าใช้จ่ายเรียบร้อยแล้ว'
      });

      await fetchExpenses();
      return expense;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายการค่าใช้จ่ายได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: string, data: Partial<CreateExpenseData>) => {
    try {
      setLoading(true);
      
      const updateData: any = {};
      if (data.categoryId) updateData.category_id = data.categoryId;
      if (data.branchId) updateData.branch_id = data.branchId;
      if (data.description) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.vatAmount !== undefined) updateData.vat_amount = data.vatAmount;
      if (data.vatRate !== undefined) updateData.vat_rate = data.vatRate;
      if (data.expenseDate) updateData.expense_date = data.expenseDate;
      if (data.paymentMethod) updateData.payment_method = data.paymentMethod;
      if (data.vendor !== undefined) updateData.vendor = data.vendor;
      if (data.receiptNumber !== undefined) updateData.receipt_number = data.receiptNumber;
      if (data.employeeId !== undefined) updateData.employee_id = data.employeeId;
      if (data.attachments !== undefined) updateData.attachments = data.attachments;

      // คำนวณยอดรวมใหม่ถ้ามีการเปลี่ยนแปลงจำนวนเงิน
      if (data.amount !== undefined || data.vatAmount !== undefined) {
        const { data: currentExpense } = await supabase
          .from('accounting_expenses')
          .select('amount, vat_amount')
          .eq('id', id)
          .single();

        if (currentExpense) {
          const amount = data.amount ?? currentExpense.amount;
          const vatAmount = data.vatAmount ?? currentExpense.vat_amount ?? 0;
          updateData.total_amount = amount + vatAmount;
        }
      }

      const { error } = await supabase
        .from('accounting_expenses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตรายการค่าใช้จ่ายเรียบร้อยแล้ว'
      });

      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตรายการค่าใช้จ่ายได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpenseStatus = async (id: string, status: ExpenseStatus) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('accounting_expenses')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตสถานะค่าใช้จ่ายเรียบร้อยแล้ว'
      });

      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตสถานะได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('accounting_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'ลบรายการค่าใช้จ่ายเรียบร้อยแล้ว'
      });

      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถลบรายการค่าใช้จ่ายได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const getExpenseById = (id: string) => {
    return expenses.find(expense => expense.id === id);
  };

  const getExpensesByCategory = (categoryId: string) => {
    return expenses.filter(expense => expense.categoryId === categoryId);
  };

  const getExpensesByBranch = (branchId: string) => {
    return expenses.filter(expense => expense.branchId === branchId);
  };

  const getTotalExpenseAmount = (filters?: ExpenseFilter) => {
    let filteredExpenses = expenses;
    
    if (filters?.branchId) {
      filteredExpenses = filteredExpenses.filter(e => e.branchId === filters.branchId);
    }
    if (filters?.categoryId) {
      filteredExpenses = filteredExpenses.filter(e => e.categoryId === filters.categoryId);
    }
    if (filters?.dateFrom) {
      filteredExpenses = filteredExpenses.filter(e => e.expenseDate >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filteredExpenses = filteredExpenses.filter(e => e.expenseDate <= filters.dateTo!);
    }
    
    return filteredExpenses.reduce((total, expense) => total + expense.totalAmount, 0);
  };

  const getExpensesByDateRange = (startDate: string, endDate: string) => {
    return expenses.filter(expense => 
      expense.expenseDate >= startDate && expense.expenseDate <= endDate
    );
  };

  const getExpenseSummaryByCategory = () => {
    const summary = expenses.reduce((acc, expense) => {
      const categoryId = expense.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          categoryId,
          categoryName: expense.category.name,
          totalAmount: 0,
          count: 0
        };
      }
      acc[categoryId].totalAmount += expense.totalAmount;
      acc[categoryId].count += 1;
      return acc;
    }, {} as Record<string, {
      categoryId: string;
      categoryName: string;
      totalAmount: number;
      count: number;
    }>);

    return Object.values(summary);
  };

  const getExpenseSummaryByBranch = () => {
    const summary = expenses.reduce((acc, expense) => {
      const branchId = expense.branchId;
      if (!acc[branchId]) {
        acc[branchId] = {
          branchId,
          branchName: expense.branch.name,
          totalAmount: 0,
          count: 0
        };
      }
      acc[branchId].totalAmount += expense.totalAmount;
      acc[branchId].count += 1;
      return acc;
    }, {} as Record<string, {
      branchId: string;
      branchName: string;
      totalAmount: number;
      count: number;
    }>);

    return Object.values(summary);
  };

  const getPendingExpenses = () => {
    return expenses.filter(expense => expense.status === 'pending');
  };

  const getApprovedExpenses = () => {
    return expenses.filter(expense => expense.status === 'approved');
  };

  const getRejectedExpenses = () => {
    return expenses.filter(expense => expense.status === 'rejected');
  };

  // Load data on mount
  useEffect(() => {
    fetchExpenseCategories();
    fetchExpenses();
  }, []);

  return {
    // State
    loading,
    expenses,
    expenseCategories,

    // Expense Category functions
    fetchExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,

    // Expense functions
    fetchExpenses,
    createExpense,
    updateExpense,
    updateExpenseStatus,
    deleteExpense,

    // Utility functions
    getExpenseById,
    getExpensesByCategory,
    getExpensesByBranch,
    getTotalExpenseAmount,
    getExpensesByDateRange,
    getExpenseSummaryByCategory,
    getExpenseSummaryByBranch,
    getPendingExpenses,
    getApprovedExpenses,
    getRejectedExpenses
  };
}