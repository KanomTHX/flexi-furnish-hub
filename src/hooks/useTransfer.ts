import { useState, useEffect } from 'react';
import { transferService, TransferRequest, TransferConfirmation } from '@/lib/transferService';
import { StockTransfer, SerialNumber, TransferStatus } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';

export interface UseTransferOptions {
  warehouseId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTransferReturn {
  // State
  transfers: StockTransfer[];
  availableSerialNumbers: SerialNumber[];
  isLoading: boolean;
  isCreating: boolean;
  isConfirming: boolean;
  error: string | null;
  
  // Actions
  loadTransfers: (filters?: {
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
    status?: TransferStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) => Promise<void>;
  loadAvailableSerialNumbers: (warehouseId: string, searchTerm?: string) => Promise<void>;
  createTransfer: (request: TransferRequest, initiatedBy: string) => Promise<StockTransfer | null>;
  confirmTransfer: (confirmation: TransferConfirmation) => Promise<StockTransfer | null>;
  cancelTransfer: (transferId: string, reason: string, cancelledBy: string) => Promise<void>;
  getTransferById: (transferId: string) => Promise<StockTransfer | null>;
  
  // Utilities
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useTransfer(options: UseTransferOptions = {}): UseTransferReturn {
  const { warehouseId, autoRefresh = false, refreshInterval = 30000 } = options;
  const { toast } = useToast();

  // State
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [availableSerialNumbers, setAvailableSerialNumbers] = useState<SerialNumber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load transfers
  const loadTransfers = async (filters?: {
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
    status?: TransferStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await transferService.getTransfers(filters);
      setTransfers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถโหลดรายการโอนได้';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load available serial numbers
  const loadAvailableSerialNumbers = async (warehouseId: string, searchTerm?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await transferService.getAvailableSerialNumbers(warehouseId, searchTerm);
      setAvailableSerialNumbers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถโหลดรายการ Serial Number ได้';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create transfer
  const createTransfer = async (request: TransferRequest, initiatedBy: string): Promise<StockTransfer | null> => {
    setIsCreating(true);
    setError(null);
    
    try {
      const transfer = await transferService.initiateTransfer(request, initiatedBy);
      
      toast({
        title: "สร้างการโอนสำเร็จ",
        description: `สร้างการโอน ${transfer.transferNumber} เรียบร้อยแล้ว`,
      });

      // Refresh transfers list
      await loadTransfers();
      
      return transfer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างการโอนได้';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Confirm transfer
  const confirmTransfer = async (confirmation: TransferConfirmation): Promise<StockTransfer | null> => {
    setIsConfirming(true);
    setError(null);
    
    try {
      const transfer = await transferService.confirmTransfer(confirmation);
      
      toast({
        title: "ยืนยันการรับสินค้าสำเร็จ",
        description: `ยืนยันการรับสินค้า ${transfer.transferNumber} เรียบร้อยแล้ว`,
      });

      // Refresh transfers list
      await loadTransfers();
      
      return transfer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถยืนยันการรับสินค้าได้';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsConfirming(false);
    }
  };

  // Cancel transfer
  const cancelTransfer = async (transferId: string, reason: string, cancelledBy: string): Promise<void> => {
    setIsConfirming(true);
    setError(null);
    
    try {
      await transferService.cancelTransfer(transferId, reason, cancelledBy);
      
      toast({
        title: "ยกเลิกการโอนสำเร็จ",
        description: "ยกเลิกการโอนเรียบร้อยแล้ว",
      });

      // Refresh transfers list
      await loadTransfers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถยกเลิกการโอนได้';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Get transfer by ID
  const getTransferById = async (transferId: string): Promise<StockTransfer | null> => {
    setError(null);
    
    try {
      return await transferService.getTransferById(transferId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถโหลดรายละเอียดการโอนได้';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  // Refresh data
  const refresh = async () => {
    if (warehouseId) {
      await loadTransfers({ targetWarehouseId: warehouseId });
    } else {
      await loadTransfers();
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, warehouseId]);

  // Initial load effect
  useEffect(() => {
    if (warehouseId) {
      loadTransfers({ targetWarehouseId: warehouseId });
    }
  }, [warehouseId]);

  return {
    // State
    transfers,
    availableSerialNumbers,
    isLoading,
    isCreating,
    isConfirming,
    error,
    
    // Actions
    loadTransfers,
    loadAvailableSerialNumbers,
    createTransfer,
    confirmTransfer,
    cancelTransfer,
    getTransferById,
    
    // Utilities
    refresh,
    clearError,
  };
}