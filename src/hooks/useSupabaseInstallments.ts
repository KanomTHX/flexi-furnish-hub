import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InstallmentContract, InstallmentSummary, Customer, SerialNumber } from '@/types/pos';
import { useSerialNumbers } from './useSerialNumbers';

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
  serial_numbers?: string[]; // Array of serial number IDs
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
  const { updateMultipleSerialNumbers } = useSerialNumbers();

  // แปลงข้อมูลจาก Supabase เป็น InstallmentContract
  const convertToInstallmentContract = useCallback((
    plan: SupabaseInstallmentPlan,
    payments: SupabaseInstallmentPayment[],
    customer: SupabaseCustomer,
    serialNumbers?: SerialNumber[]
  ): InstallmentContract => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    const totalPaid = plan.down_payment + paidPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
    const remainingBalance = plan.total_amount - totalPaid;
    const paidInstallments = paidPayments.length;
    const remainingInstallments = plan.number_of_installments - paidInstallments;

    return {
      id: plan.id,
      saleId: plan.sales_transaction_id || '',
      planId: plan.id,
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
      // Serial Numbers
      serialNumbers: plan.serial_numbers || [],
      serialNumberDetails: serialNumbers || [],
      totalAmount: plan.total_amount,
      downPayment: plan.down_payment,
      financedAmount: plan.total_amount - plan.down_payment,
      totalPayable: plan.total_amount,
      monthlyPayment: plan.installment_amount,
      totalInterest: plan.total_amount * (plan.interest_rate / 100),
      processingFee: 500,
      plan: {
        id: `plan-${plan.number_of_installments}m`,
        name: `แผนผ่อน ${plan.number_of_installments} เดือน`,
        months: plan.number_of_installments,
        interestRate: plan.interest_rate,
        downPaymentPercent: 20,
        processingFee: 500,
        isActive: true
      },
      payments: payments.map(payment => ({
        id: payment.id,
        contractId: plan.id,
        installmentNumber: payment.payment_number,
        dueDate: payment.due_date,
        amount: payment.amount || 0,
        principalAmount: (payment.amount || 0) * 0.8,
        interestAmount: (payment.amount || 0) * 0.2,
        status: payment.status as 'pending' | 'paid' | 'overdue',
        paidDate: payment.paid_date || '',
        paidAmount: payment.paid_amount || 0,
        paymentMethod: payment.payment_method || '',
        receiptNumber: `RCP-${payment.payment_number}`,
        notes: payment.notes || ''
      })),
      totalPaid,
      remainingBalance,
      paidInstallments,
      remainingInstallments,
      status: plan.status as 'draft' | 'active' | 'completed' | 'cancelled' | 'defaulted',
      contractDate: plan.start_date,
      firstPaymentDate: plan.start_date,
      lastPaymentDate: new Date(new Date(plan.start_date).getTime() + plan.number_of_installments * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdBy: 'system',
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

      // โหลด Serial Numbers สำหรับสัญญาที่มี serial_numbers
      const allSerialNumberIds = plans
        .filter(p => p.serial_numbers && p.serial_numbers.length > 0)
        .flatMap(p => p.serial_numbers || []);
      
      let serialNumbers: SerialNumber[] = [];
      if (allSerialNumberIds.length > 0) {
        const { data: serialNumbersData, error: serialNumbersError } = await supabase
          .from('serial_numbers')
          .select(`
            *,
            product:products(*)
          `)
          .in('id', allSerialNumberIds);

        if (serialNumbersError) {
          console.warn('Error loading serial numbers:', serialNumbersError);
        } else {
          serialNumbers = serialNumbersData || [];
        }
      }

      // แปลงข้อมูล
      const contractsData = plans.map(plan => {
        const planPayments = payments?.filter(p => p.installment_plan_id === plan.id) || [];
        const customer = customers?.find(c => c.id === plan.customer_id);
        const planSerialNumbers = serialNumbers.filter(sn => 
          plan.serial_numbers?.includes(sn.id)
        );
        
        if (!customer) {
          console.warn(`Customer not found for plan ${plan.id}`);
          return null;
        }

        return convertToInstallmentContract(plan, planPayments, customer, planSerialNumbers);
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
          status: contract.status,
          serial_numbers: contract.serialNumbers || []
        })
        .select()
        .single();

      if (planError) throw planError;

      // อัปเดตสถานะ Serial Numbers เป็น 'installment'
      if (contract.serialNumbers && contract.serialNumbers.length > 0) {
        await updateMultipleSerialNumbers(
          contract.serialNumbers,
          'installment',
          planData.id
        );
      }

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
  }, [loadContracts, updateMultipleSerialNumbers]);

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
      (contract.contractNumber || '').toLowerCase().includes(searchTerm) ||
      (contract.customer.name || '').toLowerCase().includes(searchTerm) ||
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