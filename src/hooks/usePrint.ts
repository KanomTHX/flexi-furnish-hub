import { useState, useCallback } from 'react';
import { 
  PrintJob, 
  PrintDocumentType, 
  PrintStatus,
  ReceiveDocumentPrintData,
  TransferDocumentPrintData,
  SNStickerPrintData,
  ClaimDocumentPrintData,
  StockReportPrintData,
  PrintConfig
} from '../types/printing';
import { printService } from '../services/printService';
import { useToast } from './use-toast';

interface UsePrintReturn {
  // State
  isLoading: boolean;
  currentJob: PrintJob | null;
  printHistory: PrintJob[];
  config: PrintConfig;
  
  // Actions
  printReceiveDocument: (data: ReceiveDocumentPrintData, copies?: number) => Promise<PrintJob>;
  printTransferDocument: (data: TransferDocumentPrintData, copies?: number) => Promise<PrintJob>;
  printSNStickers: (stickers: SNStickerPrintData[]) => Promise<PrintJob>;
  printClaimDocument: (data: ClaimDocumentPrintData, copies?: number) => Promise<PrintJob>;
  generatePreview: (type: PrintDocumentType, data: any) => Promise<any>;
  cancelJob: (jobId: string) => boolean;
  updateConfig: (config: Partial<PrintConfig>) => void;
  
  // Utilities
  getJobStatus: (jobId: string) => PrintStatus | null;
  clearHistory: () => void;
}

export const usePrint = (): UsePrintReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<PrintJob | null>(null);
  const [printHistory, setPrintHistory] = useState<PrintJob[]>([]);
  const [config, setConfig] = useState<PrintConfig>(printService.getConfig());
  const { toast } = useToast();

  // Get current user info (TODO: Replace with actual auth context)
  const getCurrentUser = () => ({
    id: 'current-user',
    name: 'Current User'
  });

  // Print receive document
  const printReceiveDocument = useCallback(async (
    data: ReceiveDocumentPrintData, 
    copies: number = 1
  ): Promise<PrintJob> => {
    setIsLoading(true);
    try {
      const user = getCurrentUser();
      const job = await printService.printReceiveDocument(data, copies, user.id, user.name);
      
      setCurrentJob(job);
      setPrintHistory(prev => [job, ...prev]);
      
      toast({
        title: "พิมพ์ใบรับสินค้าสำเร็จ",
        description: `พิมพ์ ${copies} ชุด เรียบร้อยแล้ว`,
        variant: "default"
      });
      
      return job;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถพิมพ์ได้';
      toast({
        title: "ข้อผิดพลาดในการพิมพ์",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Print transfer document
  const printTransferDocument = useCallback(async (
    data: TransferDocumentPrintData, 
    copies: number = 1
  ): Promise<PrintJob> => {
    setIsLoading(true);
    try {
      const user = getCurrentUser();
      const job = await printService.printTransferDocument(data, copies, user.id, user.name);
      
      setCurrentJob(job);
      setPrintHistory(prev => [job, ...prev]);
      
      toast({
        title: "พิมพ์ใบโอนสินค้าสำเร็จ",
        description: `พิมพ์ ${copies} ชุด เรียบร้อยแล้ว`,
        variant: "default"
      });
      
      return job;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถพิมพ์ได้';
      toast({
        title: "ข้อผิดพลาดในการพิมพ์",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Print SN stickers
  const printSNStickers = useCallback(async (
    stickers: SNStickerPrintData[]
  ): Promise<PrintJob> => {
    setIsLoading(true);
    try {
      const user = getCurrentUser();
      const job = await printService.printSNStickers(stickers, user.id, user.name);
      
      setCurrentJob(job);
      setPrintHistory(prev => [job, ...prev]);
      
      toast({
        title: "พิมพ์สติกเกอร์ SN สำเร็จ",
        description: `พิมพ์ ${stickers.length} สติกเกอร์ เรียบร้อยแล้ว`,
        variant: "default"
      });
      
      return job;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถพิมพ์ได้';
      toast({
        title: "ข้อผิดพลาดในการพิมพ์",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Print claim document
  const printClaimDocument = useCallback(async (
    data: ClaimDocumentPrintData, 
    copies: number = 1
  ): Promise<PrintJob> => {
    setIsLoading(true);
    try {
      const user = getCurrentUser();
      const job = await printService.printClaimDocument(data, copies, user.id, user.name);
      
      setCurrentJob(job);
      setPrintHistory(prev => [job, ...prev]);
      
      toast({
        title: "พิมพ์ใบเคลมสำเร็จ",
        description: `พิมพ์ ${copies} ชุด เรียบร้อยแล้ว`,
        variant: "default"
      });
      
      return job;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถพิมพ์ได้';
      toast({
        title: "ข้อผิดพลาดในการพิมพ์",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Generate preview
  const generatePreview = useCallback(async (
    type: PrintDocumentType, 
    data: any
  ) => {
    setIsLoading(true);
    try {
      const preview = await printService.generatePreview(type, data);
      return preview;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถสร้างตัวอย่างได้';
      toast({
        title: "ข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Cancel print job
  const cancelJob = useCallback((jobId: string): boolean => {
    const success = printService.cancelPrintJob(jobId);
    
    if (success) {
      // Update current job if it's the one being cancelled
      if (currentJob?.id === jobId) {
        setCurrentJob(prev => prev ? { ...prev, status: PrintStatus.CANCELLED } : null);
      }
      
      // Update history
      setPrintHistory(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: PrintStatus.CANCELLED }
            : job
        )
      );
      
      toast({
        title: "ยกเลิกการพิมพ์",
        description: "ยกเลิกงานพิมพ์เรียบร้อยแล้ว",
        variant: "default"
      });
    } else {
      toast({
        title: "ไม่สามารถยกเลิกได้",
        description: "งานพิมพ์นี้ไม่สามารถยกเลิกได้",
        variant: "destructive"
      });
    }
    
    return success;
  }, [currentJob, toast]);

  // Update print configuration
  const updateConfig = useCallback((newConfig: Partial<PrintConfig>) => {
    printService.updateConfig(newConfig);
    setConfig(printService.getConfig());
    
    toast({
      title: "อัปเดตการตั้งค่า",
      description: "อัปเดตการตั้งค่าการพิมพ์เรียบร้อยแล้ว",
      variant: "default"
    });
  }, [toast]);

  // Get job status
  const getJobStatus = useCallback((jobId: string): PrintStatus | null => {
    const job = printService.getPrintJob(jobId);
    return job?.status || null;
  }, []);

  // Clear print history
  const clearHistory = useCallback(() => {
    setPrintHistory([]);
    setCurrentJob(null);
    
    toast({
      title: "ล้างประวัติ",
      description: "ล้างประวัติการพิมพ์เรียบร้อยแล้ว",
      variant: "default"
    });
  }, [toast]);

  return {
    // State
    isLoading,
    currentJob,
    printHistory,
    config,
    
    // Actions
    printReceiveDocument,
    printTransferDocument,
    printSNStickers,
    printClaimDocument,
    generatePreview,
    cancelJob,
    updateConfig,
    
    // Utilities
    getJobStatus,
    clearHistory
  };
};