import { useState, useCallback, useMemo } from 'react';
import { InstallmentContract, InstallmentSummary } from '@/types/pos';
import { 
  calculateContractStatus, 
  updatePaymentStatus 
} from '@/utils/installmentHelpers';

export function useInstallments() {
  const [contracts, setContracts] = useState<InstallmentContract[]>([]);

  // อัพเดทสถานะสัญญาทั้งหมด
  const updatedContracts = useMemo(() => updatePaymentStatus(contracts), [contracts]);

  // คำนวณสรุปข้อมูล
  const summary: InstallmentSummary = useMemo(() => {
    const activeContracts = updatedContracts.filter(c => c.status === 'active');
    const overdueContracts = updatedContracts.filter(c => {
      const status = calculateContractStatus(c);
      return status.overduePayments.length > 0;
    });

    return {
      totalContracts: updatedContracts.length,
      activeContracts: activeContracts.length,
      totalFinanced: updatedContracts.reduce((sum, c) => sum + c.financedAmount, 0),
      totalCollected: updatedContracts.reduce((sum, c) => sum + c.totalPaid, 0),
      overdueAmount: overdueContracts.reduce((sum, c) => {
        const status = calculateContractStatus(c);
        return sum + status.overduePayments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0),
      overdueContracts: overdueContracts.length,
      monthlyCollection: activeContracts.reduce((sum, c) => sum + c.monthlyPayment, 0)
    };
  }, [updatedContracts]);

  // เพิ่มสัญญาใหม่
  const addContract = useCallback((contract: InstallmentContract) => {
    setContracts(prev => [...prev, contract]);
  }, []);

  // อัพเดทสัญญา
  const updateContract = useCallback((updatedContract: InstallmentContract) => {
    setContracts(prev => prev.map(contract => 
      contract.id === updatedContract.id ? updatedContract : contract
    ));
  }, []);

  // ลบสัญญา
  const removeContract = useCallback((contractId: string) => {
    setContracts(prev => prev.filter(contract => contract.id !== contractId));
  }, []);

  // บันทึกการชำระเงิน
  const recordPayment = useCallback((contractId: string, paymentId: string, amount: number) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id !== contractId) return contract;

      const updatedPayments = contract.payments.map(payment => {
        if (payment.id !== paymentId) return payment;

        return {
          ...payment,
          status: 'paid' as const,
          paidDate: new Date().toISOString().split('T')[0],
          paidAmount: amount,
          paymentMethod: 'cash', // TODO: เลือกวิธีชำระ
          receiptNumber: `R${Date.now().toString().slice(-6)}`
        };
      });

      // คำนวณสถานะใหม่
      const paidPayments = updatedPayments.filter(p => p.status === 'paid');
      const totalPaid = contract.downPayment + paidPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      const remainingBalance = contract.totalPayable - totalPaid;
      const paidInstallments = paidPayments.length;
      const remainingInstallments = contract.plan.months - paidInstallments;

      // อัพเดทสถานะสัญญา
      let contractStatus = contract.status;
      if (remainingInstallments === 0) {
        contractStatus = 'completed';
      } else if (contractStatus === 'draft') {
        contractStatus = 'active';
      }

      return {
        ...contract,
        payments: updatedPayments,
        totalPaid,
        remainingBalance,
        paidInstallments,
        remainingInstallments,
        status: contractStatus,
        updatedAt: new Date().toISOString()
      };
    }));
  }, []);

  // ยกเลิกสัญญา
  const cancelContract = useCallback((contractId: string, reason?: string) => {
    setContracts(prev => prev.map(contract => 
      contract.id === contractId 
        ? { 
            ...contract, 
            status: 'cancelled' as const,
            notes: reason ? `${contract.notes || ''}\nยกเลิก: ${reason}` : contract.notes,
            updatedAt: new Date().toISOString()
          }
        : contract
    ));
  }, []);

  // อนุมัติสัญญา
  const approveContract = useCallback((contractId: string, approvedBy: string) => {
    setContracts(prev => prev.map(contract => 
      contract.id === contractId 
        ? { 
            ...contract, 
            status: 'active' as const,
            approvedBy,
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : contract
    ));
  }, []);

  // ค้นหาสัญญา
  const searchContracts = useCallback((query: string) => {
    if (!query.trim()) return updatedContracts;
    
    const searchTerm = query.toLowerCase();
    return updatedContracts.filter(contract => 
      contract.contractNumber.toLowerCase().includes(searchTerm) ||
      contract.customer.name.toLowerCase().includes(searchTerm) ||
      contract.customer.phone?.toLowerCase().includes(searchTerm) ||
      contract.customer.idCard?.toLowerCase().includes(searchTerm)
    );
  }, [updatedContracts]);

  // กรองสัญญาตามสถานะ
  const filterContractsByStatus = useCallback((status: InstallmentContract['status']) => {
    return updatedContracts.filter(contract => contract.status === status);
  }, [updatedContracts]);

  // หาสัญญาที่เกินกำหนดชำระ
  const getOverdueContracts = useCallback(() => {
    return updatedContracts.filter(contract => {
      const status = calculateContractStatus(contract);
      return status.overduePayments.length > 0;
    });
  }, [updatedContracts]);

  // หาสัญญาที่ครบกำหนดชำระในวันนี้
  const getTodayDueContracts = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return updatedContracts.filter(contract => {
      return contract.payments.some(payment => 
        payment.status === 'pending' && payment.dueDate === today
      );
    });
  }, [updatedContracts]);

  // โหลดข้อมูลจาก localStorage (ถ้าต้องการ)
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('installment-contracts');
      if (stored) {
        const parsedContracts = JSON.parse(stored);
        setContracts(parsedContracts);
      }
    } catch (error) {
      console.error('Error loading contracts from storage:', error);
    }
  }, []);

  // บันทึกข้อมูลลง localStorage
  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem('installment-contracts', JSON.stringify(contracts));
    } catch (error) {
      console.error('Error saving contracts to storage:', error);
    }
  }, [contracts]);

  return {
    contracts: updatedContracts,
    summary,
    actions: {
      addContract,
      updateContract,
      removeContract,
      recordPayment,
      cancelContract,
      approveContract,
      searchContracts,
      filterContractsByStatus,
      getOverdueContracts,
      getTodayDueContracts,
      loadFromStorage,
      saveToStorage
    }
  };
}