// ===================================================================
// INSTALLMENT INTEGRATION HOOK
// Hook สำหรับใช้งานบริการเชื่อมโยงระบบเช่าซื้อ
// ===================================================================

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  installmentIntegrationService,
  type InstallmentStockReservation,
  type InstallmentStockItem,
  type ContractStockData
} from '@/services/installmentIntegrationService';
import { InstallmentContract } from '@/types/installments';
import { SerialNumber } from '@/types/warehouse';

export interface UseInstallmentIntegrationReturn {
  // State
  isLoading: boolean;
  error: string | null;
  reservations: InstallmentStockReservation[];
  
  // Actions
  reserveStock: (contractData: ContractStockData) => Promise<InstallmentStockReservation[]>;
  confirmSale: (contractId: string, saleData: {
    soldTo: string;
    saleDate: Date;
    receiptNumber?: string;
  }) => Promise<void>;
  releaseStock: (contractId: string, reason?: string) => Promise<void>;
  
  // Queries
  trackSNs: (contractId: string) => Promise<SerialNumber[]>;
  getSNHistory: (serialNumber: string) => Promise<any[]>;
  
  // Integration hooks
  handleContractCreated: (contract: InstallmentContract, items: InstallmentStockItem[]) => Promise<InstallmentStockReservation[]>;
  handleContractCancelled: (contractId: string, reason?: string) => Promise<void>;
  handleSaleConfirmed: (contractId: string, saleData: {
    soldTo: string;
    saleDate: Date;
    receiptNumber?: string;
  }) => Promise<void>;
}

export function useInstallmentIntegration(): UseInstallmentIntegrationReturn {
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<InstallmentStockReservation[]>([]);
  const queryClient = useQueryClient();

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Stock reservation mutation
  const reserveStockMutation = useMutation({
    mutationFn: installmentIntegrationService.reserveStockForContract,
    onSuccess: (data) => {
      setReservations(data);
      toast.success('จองสต็อกสำหรับสัญญาเช่าซื้อเรียบร้อย');
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      clearError();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'ไม่สามารถจองสต็อกได้';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Sale confirmation mutation
  const confirmSaleMutation = useMutation({
    mutationFn: ({ contractId, saleData }: {
      contractId: string;
      saleData: {
        soldTo: string;
        saleDate: Date;
        receiptNumber?: string;
      };
    }) => installmentIntegrationService.confirmStockSale(contractId, saleData),
    onSuccess: () => {
      toast.success('ยืนยันการขายเรียบร้อย');
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['installment-sns'] });
      clearError();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'ไม่สามารถยืนยันการขายได้';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Stock release mutation
  const releaseStockMutation = useMutation({
    mutationFn: ({ contractId, reason }: {
      contractId: string;
      reason?: string;
    }) => installmentIntegrationService.releaseReservedStock(contractId, reason),
    onSuccess: () => {
      toast.success('ปลดปล่อยสต็อกเรียบร้อย');
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      clearError();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'ไม่สามารถปลดปล่อยสต็อกได้';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Contract creation mutation
  const contractCreatedMutation = useMutation({
    mutationFn: ({ contract, items }: {
      contract: InstallmentContract;
      items: InstallmentStockItem[];
    }) => installmentIntegrationService.onInstallmentContractCreated(contract, items),
    onSuccess: (data) => {
      setReservations(data);
      toast.success(`จองสต็อกสำหรับสัญญา ${data[0]?.contractNumber} เรียบร้อย`);
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      clearError();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'ไม่สามารถจองสต็อกสำหรับสัญญาได้';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Contract cancellation mutation
  const contractCancelledMutation = useMutation({
    mutationFn: ({ contractId, reason }: {
      contractId: string;
      reason?: string;
    }) => installmentIntegrationService.onInstallmentContractCancelled(contractId, reason),
    onSuccess: () => {
      toast.success('ปลดปล่อยสต็อกจากการยกเลิกสัญญาเรียบร้อย');
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      clearError();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'ไม่สามารถปลดปล่อยสต็อกได้';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Sale confirmation mutation
  const saleConfirmedMutation = useMutation({
    mutationFn: ({ contractId, saleData }: {
      contractId: string;
      saleData: {
        soldTo: string;
        saleDate: Date;
        receiptNumber?: string;
      };
    }) => installmentIntegrationService.onInstallmentSaleConfirmed(contractId, saleData),
    onSuccess: () => {
      toast.success('ยืนยันการขายผ่านสัญญาเช่าซื้อเรียบร้อย');
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['installment-sns'] });
      clearError();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'ไม่สามารถยืนยันการขายได้';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Action functions
  const reserveStock = useCallback(async (contractData: ContractStockData) => {
    return reserveStockMutation.mutateAsync(contractData);
  }, [reserveStockMutation]);

  const confirmSale = useCallback(async (contractId: string, saleData: {
    soldTo: string;
    saleDate: Date;
    receiptNumber?: string;
  }) => {
    return confirmSaleMutation.mutateAsync({ contractId, saleData });
  }, [confirmSaleMutation]);

  const releaseStock = useCallback(async (contractId: string, reason?: string) => {
    return releaseStockMutation.mutateAsync({ contractId, reason });
  }, [releaseStockMutation]);

  const trackSNs = useCallback(async (contractId: string) => {
    try {
      clearError();
      return await installmentIntegrationService.trackInstallmentSNs(contractId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถติดตาม SN ได้';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  }, [clearError]);

  const getSNHistory = useCallback(async (serialNumber: string) => {
    try {
      clearError();
      return await installmentIntegrationService.getInstallmentSNHistory(serialNumber);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถดึงประวัติ SN ได้';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  }, [clearError]);

  const handleContractCreated = useCallback(async (
    contract: InstallmentContract,
    items: InstallmentStockItem[]
  ) => {
    return contractCreatedMutation.mutateAsync({ contract, items });
  }, [contractCreatedMutation]);

  const handleContractCancelled = useCallback(async (
    contractId: string,
    reason?: string
  ) => {
    return contractCancelledMutation.mutateAsync({ contractId, reason });
  }, [contractCancelledMutation]);

  const handleSaleConfirmed = useCallback(async (
    contractId: string,
    saleData: {
      soldTo: string;
      saleDate: Date;
      receiptNumber?: string;
    }
  ) => {
    return saleConfirmedMutation.mutateAsync({ contractId, saleData });
  }, [saleConfirmedMutation]);

  // Calculate loading state
  const isLoading = 
    reserveStockMutation.isPending ||
    confirmSaleMutation.isPending ||
    releaseStockMutation.isPending ||
    contractCreatedMutation.isPending ||
    contractCancelledMutation.isPending ||
    saleConfirmedMutation.isPending;

  return {
    // State
    isLoading,
    error,
    reservations,
    
    // Actions
    reserveStock,
    confirmSale,
    releaseStock,
    
    // Queries
    trackSNs,
    getSNHistory,
    
    // Integration hooks
    handleContractCreated,
    handleContractCancelled,
    handleSaleConfirmed
  };
}

// Query hooks for data fetching
export function useInstallmentSNs(contractId: string) {
  return useQuery({
    queryKey: ['installment-sns', contractId],
    queryFn: () => installmentIntegrationService.trackInstallmentSNs(contractId),
    enabled: !!contractId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });
}

export function useInstallmentSNHistory(serialNumber: string) {
  return useQuery({
    queryKey: ['installment-sn-history', serialNumber],
    queryFn: () => installmentIntegrationService.getInstallmentSNHistory(serialNumber),
    enabled: !!serialNumber,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });
}

export default useInstallmentIntegration;