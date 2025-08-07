import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InstallmentContract, InstallmentSummary, Customer } from '@/types/pos';

interface SupabaseInstallmentPlan {
  id: string;
  branch_id: string;
  customer_id: string;
  sales_transaction_id?: string;
  plan_number: string;
  total_amount: number;
  down_payment: number;
  installment_amount: number;
  number_of_installments: number;
  interest_rate: number;
  start_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseInstallmentPayment {
  id: string;
  installment_plan_id: string;
  payment_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_date?: string;
  paid_amount?: number;
  payment_method?: string;
  receipt_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseCustomer {
  id: string;
  branch_id: string;
  customer_code: string;
  type: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  id_card?: string;
  tax_id?: string;
  occupation?: string;
  monthly_income?: number;
  credit_limit?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useSupabaseInstallments() {
  const [contracts, setContracts] = useState<InstallmentContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // แปลงข้อมูลจาก Supabase เป็น InstallmentContract
  const convertToInstallmentContract = useCallback((
    plan: SupabaseInstallmentPlan,
    payments: SupabaseInstallmentPayment[],
    customer: SupabaseCustomer
  ): InstallmentContract => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    const totalPaid = plan.down_payment + paidPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
    const remainingBalance = plan.total_amount - totalPaid;
    const paidInstallments = paidPayments.length;
    const remainingInstallments = plan.number_of_installments - paidInstallments;

    return {
      id: plan.id,
      contractNumber: plan.plan_number,
      customerId: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        idCard: customer.id_card || '',
        occupation: customer.occupation || '',
        monthlyIncome: customer.monthly_income || 0
      },
      totalAmount: plan.total_amount,
      downPayment: plan.down_payment,
      financedAmount: plan.total_amount - plan.down_payment,
      totalPayable: plan.total_amount,
      monthlyPayment: plan.installment_amount,
      plan: {
        months: plan.number_of_installments,
        interestRate: plan.interest_rate,
        installmentAmount: plan.installment_amount
      },
      payments: payments.map(payment => ({
        id: payment.id,
        installmentNumber: payment.payment_number,
        dueDate: payment.due_date,
        amount: payment.amount,
        status: payment.status as 'pending' | 'paid' | 'overdue',
        paidDate: payment.paid_date,
        paidAmount: payment.paid_amount,
        paymentMethod: payment.payment_method,
        receiptNumber: payment.receipt_number,
        notes: payment.notes
      })),
      totalPaid,
      remainingBalance,
      paidInstallments,
      remainingInstallments,
      status: plan.status as 'draft' | 'active' | 'completed' | 'cancelled' | 'defaulted',
      startDate: plan.start_date,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      notes: ''
    };
  }, []);

  // โหลดข้อมูลสัญญาทั้งหมด
  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // โหลดแผนผ่อนชำระ
      const { data: plans, error: plansError } = await supabase
        .from('installment_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      if (!plans || plans.length === 0) {
        setContracts([]);
        return;
      }

      // โหลดการชำระเงิน
      const planIds = plans.map(p => p.id);
      const { data: payments, error: paymentsError } = await supabase
        .from('installment_payments')
        .select('*')
        .in('installment_plan_id', planIds)
        .order('payment_number', { ascending: true });

      if (paymentsError) throw paymentsError;

      // โหลดข้อมูลลูกค้า
      const customerIds = [...new Set(plans.map(p => p.customer_id))];
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds);

      if (customersError) throw customersError;

      // แปลงข้อมูล
      const contractsData = plans.map(plan => {
        const planPayments = payments?.filter(p => p.installment_plan_id === plan.id) || [];
        const customer = customers?.find(c => c.id === plan.customer_id);
        
        if (!customer) {
          console.warn(`Customer not found for plan ${plan.id}`);
          return null;
        }

        return convertToInstallmentContract(plan, planPayments, customer);
      }).filter(Boolean) as InstallmentContract[];

      setContracts(contractsData);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('ไม่สามารถโหลดข้อมูลสัญญาได้');
    } finally {
      setLoading(false);
    }
  }, [convertToInstallmentContract]);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // คำนวณสรุปข้อมูล
  const summary: InstallmentSummary = useMemo(() => {
    const activeContracts = contracts.filter(c => c.status === 'active');
    const overdueContracts = contracts.filter(c => {
      const today = new Date().toISOString().split('T')[0];
      return c.payments.some(p => p.status === 'pending' && p.dueDate < today);
    });

    return {
      totalContracts: contracts.length,
      activeContracts: activeContracts.length,
      totalFinanced: contracts.reduce((sum, c) => sum + c.financedAmount, 0),
      totalCollected: contracts.reduce((sum, c) => sum + c.totalPaid, 0),
      overdueAmount: overdueContracts.reduce((sum, c) => {
        const today = new Date().toISOString().split('T')[0];
        const overduePayments = c.payments.filter(p => p.status === 'pending' && p.dueDate < today);
        return sum + overduePayments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0),
      overdueContracts: overdueContracts.length,
      monthlyCollection: activeContracts.reduce((sum, c) => sum + c.monthlyPayment, 0)
    };
  }, [contracts]);

  // สร้างสัญญาใหม่
  const addContract = useCallback(async (contract: InstallmentContract) => {
    setLoading(true);
    setError(null);

    try {
      // สร้างแผนผ่อนชำระ
      const { data: planData, error: planError } = await supabase
        .from('installment_plans')
        .insert({
          branch_id: '00000000-0000-0000-0000-000000000001', // Default branch
          customer_id: contract.customerId,
          plan_number: contract.contractNumber,
          total_amount: contract.totalAmount,
          down_payment: contract.downPayment,
          installment_amount: contract.monthlyPayment,
          number_of_installments: contract.plan.months,
          interest_rate: contract.plan.interestRate,
          start_date: contract.createdAt.split('T')[0],
          status: contract.status
        })
        .select()
        .single();

      if (planError) throw planError;

      // สร้างรายการชำระเงิน
      const paymentsData = contract.payments.map(payment => ({
        installment_plan_id: planData.id,
        payment_number: payment.installmentNumber,
        due_date: payment.dueDate,
        amount: payment.amount,
        status: payment.status
      }));

      const { error: paymentsError } = await supabase
        .from('installment_payments')
        .insert(paymentsData);

      if (paymentsError) throw paymentsError;

      // รีโหลดข้อมูล
      await loadContracts();
    } catch (err) {
      console.error('Error adding contract:', err);
      setError('ไม่สามารถสร้างสัญญาได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadContracts]);

  // อัปเดตสัญญา
  const updateContract = useCallback(async (updatedContract: InstallmentContract) => {
    setLoading(true);
    setError(null);

    try {
      const { error: planError } = await supabase
        .from('installment_plans')
        .update({
          total_amount: updatedContract.totalAmount,
          down_payment: updatedContract.downPayment,
          installment_amount: updatedContract.monthlyPayment,
          number_of_installments: updatedContract.plan.months,
          interest_rate: updatedContract.plan.interestRate,
          status: updatedContract.status
        })
        .eq('id', updatedContract.id);

      if (planError) throw planError;

      // รีโหลดข้อมูล
      await loadContracts();
    } catch (err) {
      console.error('Error updating contract:', err);
      setError('ไม่สามารถอัปเดตสัญญาได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadContracts]);

  // บันทึกการชำระเงิน
  const recordPayment = useCallback(async (contractId: string, paymentId: string, amount: number) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('installment_payments')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          paid_amount: amount,
          payment_method: 'cash',
          receipt_number: `R${Date.now().toString().slice(-6)}`
        })
        .eq('id', paymentId);

      if (error) throw error;

      // รีโหลดข้อมูล
      await loadContracts();
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('ไม่สามารถบันทึกการชำระเงินได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadContracts]);

  // ลบสัญญา
  const removeContract = useCallback(async (contractId: string) => {
    setLoading(true);
    setError(null);

    try {
      // ลบการชำระเงินก่อน
      const { error: paymentsError } = await supabase
        .from('installment_payments')
        .delete()
        .eq('installment_plan_id', contractId);

      if (paymentsError) throw paymentsError;

      // ลบแผนผ่อนชำระ
      const { error: planError } = await supabase
        .from('installment_plans')
        .delete()
        .eq('id', contractId);

      if (planError) throw planError;

      // รีโหลดข้อมูล
      await loadContracts();
    } catch (err) {
      console.error('Error removing contract:', err);
      setError('ไม่สามารถลบสัญญาได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadContracts]);

  // ค้นหาสัญญา
  const searchContracts = useCallback((query: string) => {
    if (!query.trim()) return contracts;
    
    const searchTerm = query.toLowerCase();
    return contracts.filter(contract => 
      contract.contractNumber.toLowerCase().includes(searchTerm) ||
      contract.customer.name.toLowerCase().includes(searchTerm) ||
      contract.customer.phone?.toLowerCase().includes(searchTerm) ||
      contract.customer.idCard?.toLowerCase().includes(searchTerm)
    );
  }, [contracts]);

  // กรองสัญญาตามสถานะ
  const filterContractsByStatus = useCallback((status: InstallmentContract['status']) => {
    return contracts.filter(contract => contract.status === status);
  }, [contracts]);

  // หาสัญญาที่เกินกำหนดชำระ
  const getOverdueContracts = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return contracts.filter(contract => {
      return contract.payments.some(p => p.status === 'pending' && p.dueDate < today);
    });
  }, [contracts]);

  // หาสัญญาที่ครบกำหนดชำระในวันนี้
  const getTodayDueContracts = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return contracts.filter(contract => {
      return contract.payments.some(payment => 
        payment.status === 'pending' && payment.dueDate === today
      );
    });
  }, [contracts]);

  return {
    contracts,
    summary,
    loading,
    error,
    actions: {
      addContract,
      updateContract,
      removeContract,
      recordPayment,
      searchContracts,
      filterContractsByStatus,
      getOverdueContracts,
      getTodayDueContracts,
      loadContracts
    }
  };
}