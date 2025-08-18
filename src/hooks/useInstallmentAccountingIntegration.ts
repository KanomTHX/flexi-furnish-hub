import { useState, useCallback } from 'react';
import { installmentAccountingIntegration, type InstallmentAccountingIntegrationOptions } from '@/services/installmentAccountingIntegration';
import type { InstallmentContract, InstallmentPayment } from '@/types/unified';

export interface UseInstallmentAccountingIntegrationReturn {
  // State
  isProcessing: boolean;
  error: string | null;
  lastTransactionIds: string[];
  
  // Actions
  createAccountingEntriesFromContract: (
    contract: InstallmentContract,
    options?: Partial<InstallmentAccountingIntegrationOptions>
  ) => Promise<{ success: boolean; transactionIds: string[]; error?: string }>;
  
  createAccountingEntriesFromPayment: (
    payment: InstallmentPayment,
    contract: InstallmentContract,
    options?: Partial<InstallmentAccountingIntegrationOptions>
  ) => Promise<{ success: boolean; transactionIds: string[]; error?: string }>;
  
  getAccountingEntriesForContract: (
    contractId: string
  ) => Promise<{ success: boolean; entries: any[]; error?: string }>;
  
  getAccountingEntriesForPayment: (
    paymentId: string
  ) => Promise<{ success: boolean; entries: any[]; error?: string }>;
  
  deleteAccountingEntriesForContract: (
    contractId: string
  ) => Promise<{ success: boolean; error?: string }>;
  
  clearError: () => void;
  resetState: () => void;
}

/**
 * Custom hook สำหรับจัดการการเชื่อมต่อระบบเช่าซื้อกับระบบบัญชี
 * 
 * ฟีเจอร์หลัก:
 * - สร้างรายการบัญชีจากสัญญาเช่าซื้อ
 * - สร้างรายการบัญชีจากการชำระงวด
 * - ดึงรายการบัญชีที่เกี่ยวข้อง
 * - ลบรายการบัญชี
 * - จัดการ state และ error handling
 */
export function useInstallmentAccountingIntegration(): UseInstallmentAccountingIntegrationReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTransactionIds, setLastTransactionIds] = useState<string[]>([]);

  /**
   * สร้างรายการบัญชีจากสัญญาเช่าซื้อ
   */
  const createAccountingEntriesFromContract = useCallback(async (
    contract: InstallmentContract,
    options?: Partial<InstallmentAccountingIntegrationOptions>
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await installmentAccountingIntegration.createAccountingEntriesFromInstallmentContract(
        contract,
        options
      );
      
      if (result.success) {
        setLastTransactionIds(result.transactionIds);
      } else {
        setError(result.error || 'Failed to create accounting entries from contract');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        transactionIds: [],
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * สร้างรายการบัญชีจากการชำระงวด
   */
  const createAccountingEntriesFromPayment = useCallback(async (
    payment: InstallmentPayment,
    contract: InstallmentContract,
    options?: Partial<InstallmentAccountingIntegrationOptions>
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await installmentAccountingIntegration.createAccountingEntriesFromInstallmentPayment(
        payment,
        contract,
        options
      );
      
      if (result.success) {
        setLastTransactionIds(result.transactionIds);
      } else {
        setError(result.error || 'Failed to create accounting entries from payment');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        transactionIds: [],
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * ดึงรายการบัญชีที่เกี่ยวข้องกับสัญญาเช่าซื้อ
   */
  const getAccountingEntriesForContract = useCallback(async (
    contractId: string
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await installmentAccountingIntegration.getAccountingEntriesForInstallmentContract(contractId);
      
      if (!result.success) {
        setError(result.error || 'Failed to get accounting entries for contract');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        entries: [],
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * ดึงรายการบัญชีที่เกี่ยวข้องกับการชำระงวด
   */
  const getAccountingEntriesForPayment = useCallback(async (
    paymentId: string
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await installmentAccountingIntegration.getAccountingEntriesForInstallmentPayment(paymentId);
      
      if (!result.success) {
        setError(result.error || 'Failed to get accounting entries for payment');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        entries: [],
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * ลบรายการบัญชีที่เกี่ยวข้องกับสัญญาเช่าซื้อ
   */
  const deleteAccountingEntriesForContract = useCallback(async (
    contractId: string
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await installmentAccountingIntegration.deleteAccountingEntriesForInstallmentContract(contractId);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete accounting entries for contract');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * ล้าง error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * รีเซ็ต state ทั้งหมด
   */
  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setLastTransactionIds([]);
  }, []);

  return {
    // State
    isProcessing,
    error,
    lastTransactionIds,
    
    // Actions
    createAccountingEntriesFromContract,
    createAccountingEntriesFromPayment,
    getAccountingEntriesForContract,
    getAccountingEntriesForPayment,
    deleteAccountingEntriesForContract,
    clearError,
    resetState
  };
}

export default useInstallmentAccountingIntegration;