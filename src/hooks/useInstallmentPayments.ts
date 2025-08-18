import { useState, useCallback, useMemo } from 'react';
import { InstallmentPayment, InstallmentContract } from '@/types/unified';
import { supabase } from '@/lib/supabase';
import { useInstallmentAccountingIntegration } from './useInstallmentAccountingIntegration';

export interface PaymentTrackingData {
  contractId: string;
  paymentId: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'check' | 'card';
  receiptNumber?: string;
  notes?: string;
  processedBy?: string;
}

export interface PaymentStatusUpdate {
  contractId: string;
  totalPaid: number;
  remainingBalance: number;
  paidInstallments: number;
  remainingInstallments: number;
  status: 'active' | 'completed' | 'overdue' | 'defaulted';
  lastPaymentDate?: string;
}

export function useInstallmentPayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    createAccountingEntriesFromPayment,
    isProcessing: isAccountingProcessing,
    error: accountingError
  } = useInstallmentAccountingIntegration();

  // บันทึกการชำระเงิน
  const recordPayment = useCallback(async (paymentData: PaymentTrackingData): Promise<PaymentStatusUpdate | null> => {
    setLoading(true);
    setError(null);

    try {
      // อัปเดตการชำระเงินในฐานข้อมูล
      const { data: payment, error: paymentError } = await supabase
        .from('installment_payments')
        .update({
          payment_date: new Date().toISOString().split('T')[0],
          amount_paid: paymentData.amount,
          payment_method: paymentData.paymentMethod,
          receipt_number: paymentData.receiptNumber || `R${Date.now().toString().slice(-6)}`,
          notes: paymentData.notes,
          processed_by: paymentData.processedBy,
          status: 'paid'
        })
        .eq('id', paymentData.paymentId)
        .eq('contract_id', paymentData.contractId)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // ดึงข้อมูลสัญญาและการชำระเงินทั้งหมด
      const { data: contract, error: contractError } = await supabase
        .from('installment_contracts')
        .select(`
          *,
          installment_payments(*)
        `)
        .eq('id', paymentData.contractId)
        .single();

      if (contractError) throw contractError;

      // คำนวณสถานะใหม่
      const paidPayments = contract.installment_payments.filter((p: any) => p.status === 'paid');
      const totalPaid = contract.down_payment + paidPayments.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);
      const remainingBalance = contract.total_amount - totalPaid;
      const paidInstallments = paidPayments.length;
      const remainingInstallments = contract.number_of_installments - paidInstallments;

      // กำหนดสถานะสัญญา
      let contractStatus: 'active' | 'completed' | 'overdue' | 'defaulted' = 'active';
      if (remainingInstallments === 0) {
        contractStatus = 'completed';
      } else {
        // ตรวจสอบการเกินกำหนด
        const overduePayments = contract.installment_payments.filter((p: any) => {
          if (p.status === 'paid') return false;
          const dueDate = new Date(p.due_date);
          const today = new Date();
          return dueDate < today;
        });

        if (overduePayments.length > 0) {
          const daysPastDue = Math.max(...overduePayments.map((p: any) => {
            const dueDate = new Date(p.due_date);
            const today = new Date();
            return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          }));

          if (daysPastDue > 90) {
            contractStatus = 'defaulted';
          } else if (daysPastDue > 0) {
            contractStatus = 'overdue';
          }
        }
      }

      // อัปเดตสถานะสัญญา
      const { error: updateError } = await supabase
        .from('installment_contracts')
        .update({
          status: contractStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.contractId);

      if (updateError) throw updateError;

      // สร้างรายการบัญชีสำหรับการชำระเงิน
      try {
        const unifiedPayment: InstallmentPayment = {
          ...payment,
          id: payment.id,
          contractId: payment.contract_id,
          contract_id: payment.contract_id,
          installmentNumber: payment.payment_number,
          payment_number: payment.payment_number,
          dueDate: payment.due_date,
          due_date: payment.due_date,
          amount: payment.amount_due,
          amount_due: payment.amount_due,
          principal_amount: payment.principal_amount || payment.amount_due * 0.8,
          principalAmount: payment.principal_amount || payment.amount_due * 0.8,
          interest_amount: payment.interest_amount || payment.amount_due * 0.2,
          interestAmount: payment.interest_amount || payment.amount_due * 0.2,
          status: payment.status,
          paidDate: payment.payment_date,
          payment_date: payment.payment_date,
          amount_paid: payment.amount_paid,
          payment_method: payment.payment_method,
          receipt_number: payment.receipt_number,
          late_fee: payment.late_fee || 0,
          discount: payment.discount || 0,
          notes: payment.notes,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
          processed_by: payment.processed_by,
          branchId: payment.branch_id
        };
        
        const unifiedContract: InstallmentContract = {
          ...contract,
          id: contract.id,
          transaction_id: contract.transaction_id,
          contractNumber: contract.contract_number,
          customerId: contract.customer_id,
          customer: contract.customers,
          planId: contract.plan_id,
          plan: contract.installment_plans,
          guarantorId: contract.guarantor_id,
          guarantor: contract.guarantors,
          totalAmount: contract.total_amount,
          total_months: contract.number_of_installments,
          downPayment: contract.down_payment,
          down_payment: contract.down_payment,
          monthly_payment: contract.monthly_payment,
          remaining_amount: remainingBalance,
          financedAmount: contract.total_amount - contract.down_payment,
          totalInterest: contract.total_interest || 0,
          processingFee: contract.processing_fee || 0,
          totalPayable: contract.total_amount,
          monthlyPayment: contract.monthly_payment,
          contractDate: contract.contract_date,
          start_date: contract.start_date,
          end_date: contract.end_date,
          interest_rate: contract.interest_rate,
          firstPaymentDate: contract.first_payment_date,
          lastPaymentDate: contract.last_payment_date,
          status: contractStatus,
          payments: [],
          paidInstallments,
          remainingInstallments,
          totalPaid,
          remainingBalance,
          collateral: contract.collateral,
          terms: contract.terms,
          notes: contract.notes,
          created_at: contract.created_at,
          updated_at: contract.updated_at,
          createdAt: contract.created_at,
          updatedAt: contract.updated_at,
          createdBy: contract.created_by,
          approvedBy: contract.approved_by,
          approvedAt: contract.approved_at,
          branchId: contract.branch_id,
          saleId: contract.sale_id
        };
        
        await createAccountingEntriesFromPayment(unifiedPayment, unifiedContract);
      } catch (accountingErr) {
        console.error('Error creating accounting entries for payment:', accountingErr);
        // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกการชำระเงิน
      }

      const statusUpdate: PaymentStatusUpdate = {
        contractId: paymentData.contractId,
        totalPaid,
        remainingBalance,
        paidInstallments,
        remainingInstallments,
        status: contractStatus,
        lastPaymentDate: new Date().toISOString().split('T')[0]
      };

      return statusUpdate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน';
      setError(errorMessage);
      console.error('Error recording payment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ดึงข้อมูลการชำระเงินที่เกินกำหนด
  const getOverduePayments = useCallback(async (): Promise<InstallmentPayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: payments, error } = await supabase
        .from('installment_payments')
        .select(`
          *,
          installment_contracts(
            contract_number,
            customers(name, phone)
          )
        `)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return payments || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงินที่เกินกำหนด';
      setError(errorMessage);
      console.error('Error fetching overdue payments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ดึงข้อมูลการชำระเงินที่ครบกำหนดวันนี้
  const getTodayDuePayments = useCallback(async (): Promise<InstallmentPayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: payments, error } = await supabase
        .from('installment_payments')
        .select(`
          *,
          installment_contracts(
            contract_number,
            customers(name, phone)
          )
        `)
        .eq('status', 'pending')
        .eq('due_date', today)
        .order('payment_number', { ascending: true });

      if (error) throw error;

      return payments || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงินที่ครบกำหนดวันนี้';
      setError(errorMessage);
      console.error('Error fetching today due payments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // คำนวณค่าปรับล่าช้า
  const calculateLateFee = useCallback((payment: InstallmentPayment, customRate?: number): number => {
    if (payment.status === 'paid' || !payment.dueDate) return 0;

    const dueDate = new Date(payment.dueDate);
    const today = new Date();
    const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPastDue <= 0) return 0;

    // ค่าปรับ 1% ต่อวันของยอดงวด (หรือตามที่กำหนด)
    const lateFeeRate = customRate || 0.01;
    const lateFee = payment.amount * lateFeeRate * daysPastDue;
    
    // จำกัดค่าปรับไม่เกิน 50% ของยอดงวด
    return Math.min(lateFee, payment.amount * 0.5);
  }, []);

  // ดึงสถิติการชำระเงิน
  const getPaymentStatistics = useCallback(async (contractId?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('installment_payments')
        .select(`
          *,
          installment_contracts(
            contract_number,
            total_amount,
            down_payment
          )
        `);

      if (contractId) {
        query = query.eq('contract_id', contractId);
      }

      const { data: payments, error } = await query;

      if (error) throw error;

      const stats = {
        totalPayments: payments?.length || 0,
        paidPayments: payments?.filter(p => p.status === 'paid').length || 0,
        pendingPayments: payments?.filter(p => p.status === 'pending').length || 0,
        overduePayments: payments?.filter(p => {
          if (p.status === 'paid') return false;
          const dueDate = new Date(p.due_date);
          const today = new Date();
          return dueDate < today;
        }).length || 0,
        totalCollected: payments?.filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0,
        totalPending: payments?.filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount_due, 0) || 0
      };

      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงสถิติการชำระเงิน';
      setError(errorMessage);
      console.error('Error fetching payment statistics:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    isAccountingProcessing,
    accountingError,
    recordPayment,
    getOverduePayments,
    getTodayDuePayments,
    calculateLateFee,
    getPaymentStatistics
  };
}