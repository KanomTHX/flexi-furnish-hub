import { useState, useCallback } from 'react';
import { posAccountingIntegration, type POSAccountingIntegrationOptions } from '@/services/posAccountingIntegration';
import type { Sale } from '@/types/pos';
import type { SupabaseSalesTransaction } from '@/hooks/useSupabasePOS';
import { useToast } from '@/hooks/use-toast';

export interface UsePOSAccountingIntegrationReturn {
  loading: boolean;
  error: string | null;
  createAccountingEntries: (
    sale: Sale | SupabaseSalesTransaction,
    options?: Partial<POSAccountingIntegrationOptions>
  ) => Promise<{ success: boolean; transactionIds: string[]; error?: string }>;
  getAccountingEntries: (
    saleId: string
  ) => Promise<{ success: boolean; entries: any[]; error?: string }>;
  deleteAccountingEntries: (
    saleId: string
  ) => Promise<{ success: boolean; error?: string }>;
  handlePOSSaleCompletion: (
    sale: Sale | SupabaseSalesTransaction
  ) => Promise<boolean>;
}

export function usePOSAccountingIntegration(): UsePOSAccountingIntegrationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createAccountingEntries = useCallback(async (
    sale: Sale | SupabaseSalesTransaction,
    options?: Partial<POSAccountingIntegrationOptions>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await posAccountingIntegration.createAccountingEntriesFromPOSSale(sale, options);
      
      if (result.success) {
        toast({
          title: "บันทึกรายการบัญชีสำเร็จ",
          description: `สร้างรายการบัญชี ${result.transactionIds.length} รายการ`,
        });
      } else {
        setError(result.error || 'Failed to create accounting entries');
        toast({
          title: "ข้อผิดพลาด",
          description: result.error || "ไม่สามารถสร้างรายการบัญชีได้",
          variant: "destructive"
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการสร้างรายการบัญชี",
        variant: "destructive"
      });
      return {
        success: false,
        transactionIds: [],
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getAccountingEntries = useCallback(async (saleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await posAccountingIntegration.getAccountingEntriesForPOSSale(saleId);
      
      if (!result.success) {
        setError(result.error || 'Failed to get accounting entries');
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
      setLoading(false);
    }
  }, []);

  const deleteAccountingEntries = useCallback(async (saleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await posAccountingIntegration.deleteAccountingEntriesForPOSSale(saleId);
      
      if (result.success) {
        toast({
          title: "ลบรายการบัญชีสำเร็จ",
          description: "รายการบัญชีที่เกี่ยวข้องถูกลบแล้ว",
        });
      } else {
        setError(result.error || 'Failed to delete accounting entries');
        toast({
          title: "ข้อผิดพลาด",
          description: result.error || "ไม่สามารถลบรายการบัญชีได้",
          variant: "destructive"
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการลบรายการบัญชี",
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handlePOSSaleCompletion = useCallback(async (
    sale: Sale | SupabaseSalesTransaction
  ): Promise<boolean> => {
    try {
      const result = await createAccountingEntries(sale, {
        autoCreateAccountingEntry: true
      });

      return result.success;
    } catch (err) {
      console.error('Error handling POS sale completion:', err);
      return false;
    }
  }, [createAccountingEntries]);

  return {
    loading,
    error,
    createAccountingEntries,
    getAccountingEntries,
    deleteAccountingEntries,
    handlePOSSaleCompletion
  };
}