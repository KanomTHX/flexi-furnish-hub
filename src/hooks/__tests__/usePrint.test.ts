import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrint } from '../usePrint';
import { printService } from '../../services/printService';
import { 
  PrintDocumentType, 
  PrintStatus,
  ReceiveDocumentPrintData,
  TransferDocumentPrintData,
  SNStickerPrintData,
  ClaimDocumentPrintData,
  StickerSize
} from '../../types/printing';

// Mock the print service
vi.mock('../../services/printService', () => ({
  printService: {
    printReceiveDocument: vi.fn(),
    printTransferDocument: vi.fn(),
    printSNStickers: vi.fn(),
    printClaimDocument: vi.fn(),
    generatePreview: vi.fn(),
    cancelPrintJob: vi.fn(),
    updateConfig: vi.fn(),
    getConfig: vi.fn(),
    getPrintJob: vi.fn()
  }
}));

// Mock the toast hook
vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('usePrint', () => {
  const mockPrintService = printService as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock returns
    mockPrintService.getConfig.mockReturnValue({
      stickerSize: StickerSize.SMALL,
      includeQRCode: true,
      includeBarcode: true,
      documentMargins: { top: 20, right: 20, bottom: 20, left: 20 },
      stickerMargins: { top: 2, right: 2, bottom: 2, left: 2 },
      fontSize: { small: 8, normal: 10, large: 12 }
    });
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => usePrint());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentJob).toBeNull();
      expect(result.current.printHistory).toEqual([]);
      expect(result.current.config).toBeDefined();
    });
  });

  describe('Print Receive Document', () => {
    it('should print receive document successfully', async () => {
      const mockJob = {
        id: 'job-1',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        status: PrintStatus.COMPLETED,
        copies: 1,
        userId: 'current-user',
        userName: 'Current User',
        createdAt: new Date(),
        printedAt: new Date(),
        documentData: {},
        templateName: 'receive-document'
      };

      mockPrintService.printReceiveDocument.mockResolvedValue(mockJob);

      const { result } = renderHook(() => usePrint());

      const receiveData: ReceiveDocumentPrintData = {
        receiveNumber: 'RCV-001',
        receiveDate: new Date(),
        warehouse: { name: 'คลังหลัก', code: 'WH001' },
        items: [{
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          quantity: 1,
          unitCost: 15000,
          totalCost: 15000,
          serialNumbers: ['SF001-2024-001']
        }],
        totalItems: 1,
        totalCost: 15000,
        receivedBy: 'John Doe',
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com'
        }
      };

      let printedJob;
      await act(async () => {
        printedJob = await result.current.printReceiveDocument(receiveData, 2);
      });

      expect(mockPrintService.printReceiveDocument).toHaveBeenCalledWith(
        receiveData,
        2,
        'current-user',
        'Current User'
      );
      expect(printedJob).toEqual(mockJob);
      expect(result.current.currentJob).toEqual(mockJob);
      expect(result.current.printHistory).toContain(mockJob);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle print receive document error', async () => {
      const error = new Error('Print failed');
      mockPrintService.printReceiveDocument.mockRejectedValue(error);

      const { result } = renderHook(() => usePrint());

      const receiveData: ReceiveDocumentPrintData = {
        receiveNumber: 'RCV-001',
        receiveDate: new Date(),
        warehouse: { name: 'คลังหลัก', code: 'WH001' },
        items: [],
        totalItems: 0,
        totalCost: 0,
        receivedBy: 'John Doe',
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com'
        }
      };

      await act(async () => {
        await expect(result.current.printReceiveDocument(receiveData))
          .rejects.toThrow('Print failed');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Print Transfer Document', () => {
    it('should print transfer document successfully', async () => {
      const mockJob = {
        id: 'job-2',
        type: PrintDocumentType.TRANSFER_DOCUMENT,
        status: PrintStatus.COMPLETED,
        copies: 1,
        userId: 'current-user',
        userName: 'Current User',
        createdAt: new Date(),
        printedAt: new Date(),
        documentData: {},
        templateName: 'transfer-document'
      };

      mockPrintService.printTransferDocument.mockResolvedValue(mockJob);

      const { result } = renderHook(() => usePrint());

      const transferData: TransferDocumentPrintData = {
        transferNumber: 'TRF-001',
        transferDate: new Date(),
        sourceWarehouse: { name: 'คลังหลัก', code: 'WH001' },
        targetWarehouse: { name: 'สาขา 1', code: 'WH002' },
        items: [{
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          serialNumber: 'SF001-2024-001',
          unitCost: 15000
        }],
        totalItems: 1,
        totalValue: 15000,
        initiatedBy: 'Manager A',
        status: 'completed',
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com'
        }
      };

      let printedJob;
      await act(async () => {
        printedJob = await result.current.printTransferDocument(transferData, 1);
      });

      expect(mockPrintService.printTransferDocument).toHaveBeenCalledWith(
        transferData,
        1,
        'current-user',
        'Current User'
      );
      expect(printedJob).toEqual(mockJob);
      expect(result.current.currentJob).toEqual(mockJob);
      expect(result.current.printHistory).toContain(mockJob);
    });
  });

  describe('Print SN Stickers', () => {
    it('should print SN stickers successfully', async () => {
      const mockJob = {
        id: 'job-3',
        type: PrintDocumentType.SN_STICKER,
        status: PrintStatus.COMPLETED,
        copies: 2,
        userId: 'current-user',
        userName: 'Current User',
        createdAt: new Date(),
        printedAt: new Date(),
        documentData: [],
        templateName: 'sn-sticker'
      };

      mockPrintService.printSNStickers.mockResolvedValue(mockJob);

      const { result } = renderHook(() => usePrint());

      const stickers: SNStickerPrintData[] = [
        {
          serialNumber: 'SF001-2024-001',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          unitCost: 15000,
          receiveDate: new Date(),
          warehouseName: 'คลังหลัก'
        },
        {
          serialNumber: 'SF001-2024-002',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          unitCost: 15000,
          receiveDate: new Date(),
          warehouseName: 'คลังหลัก'
        }
      ];

      let printedJob;
      await act(async () => {
        printedJob = await result.current.printSNStickers(stickers);
      });

      expect(mockPrintService.printSNStickers).toHaveBeenCalledWith(
        stickers,
        'current-user',
        'Current User'
      );
      expect(printedJob).toEqual(mockJob);
      expect(result.current.currentJob).toEqual(mockJob);
      expect(result.current.printHistory).toContain(mockJob);
    });
  });

  describe('Print Claim Document', () => {
    it('should print claim document successfully', async () => {
      const mockJob = {
        id: 'job-4',
        type: PrintDocumentType.CLAIM_DOCUMENT,
        status: PrintStatus.COMPLETED,
        copies: 1,
        userId: 'current-user',
        userName: 'Current User',
        createdAt: new Date(),
        printedAt: new Date(),
        documentData: {},
        templateName: 'claim-document'
      };

      mockPrintService.printClaimDocument.mockResolvedValue(mockJob);

      const { result } = renderHook(() => usePrint());

      const claimData: ClaimDocumentPrintData = {
        claimNumber: 'CLM-001',
        claimDate: new Date(),
        claimType: 'warranty',
        serialNumber: 'SF001-2024-001',
        productName: 'โซฟา 3 ที่นั่ง',
        productCode: 'SF001',
        reason: 'ผ้าหุ้มฉีกขาด',
        processedBy: 'Staff A',
        warehouse: { name: 'คลังหลัก', code: 'WH001' },
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com'
        }
      };

      let printedJob;
      await act(async () => {
        printedJob = await result.current.printClaimDocument(claimData, 1);
      });

      expect(mockPrintService.printClaimDocument).toHaveBeenCalledWith(
        claimData,
        1,
        'current-user',
        'Current User'
      );
      expect(printedJob).toEqual(mockJob);
      expect(result.current.currentJob).toEqual(mockJob);
      expect(result.current.printHistory).toContain(mockJob);
    });
  });

  describe('Generate Preview', () => {
    it('should generate preview successfully', async () => {
      const mockPreview = {
        html: '<html>Preview</html>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        copies: 1,
        estimatedPages: 1
      };

      mockPrintService.generatePreview.mockResolvedValue(mockPreview);

      const { result } = renderHook(() => usePrint());

      const data = { receiveNumber: 'RCV-001' };

      let preview;
      await act(async () => {
        preview = await result.current.generatePreview(PrintDocumentType.RECEIVE_DOCUMENT, data);
      });

      expect(mockPrintService.generatePreview).toHaveBeenCalledWith(
        PrintDocumentType.RECEIVE_DOCUMENT,
        data
      );
      expect(preview).toEqual(mockPreview);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle preview generation error', async () => {
      const error = new Error('Preview failed');
      mockPrintService.generatePreview.mockRejectedValue(error);

      const { result } = renderHook(() => usePrint());

      await act(async () => {
        await expect(result.current.generatePreview(PrintDocumentType.RECEIVE_DOCUMENT, {}))
          .rejects.toThrow('Preview failed');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Cancel Job', () => {
    it('should cancel job successfully', async () => {
      mockPrintService.cancelPrintJob.mockReturnValue(true);

      const { result } = renderHook(() => usePrint());

      // Set up a current job
      const mockJob = {
        id: 'job-1',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        status: PrintStatus.PENDING,
        copies: 1,
        userId: 'current-user',
        createdAt: new Date(),
        documentData: {},
        templateName: 'receive-document'
      };

      act(() => {
        result.current.printHistory.push(mockJob);
        (result.current as any).currentJob = mockJob;
      });

      let cancelled;
      act(() => {
        cancelled = result.current.cancelJob('job-1');
      });

      expect(mockPrintService.cancelPrintJob).toHaveBeenCalledWith('job-1');
      expect(cancelled).toBe(true);
    });

    it('should handle cancel job failure', async () => {
      mockPrintService.cancelPrintJob.mockReturnValue(false);

      const { result } = renderHook(() => usePrint());

      let cancelled;
      act(() => {
        cancelled = result.current.cancelJob('job-1');
      });

      expect(mockPrintService.cancelPrintJob).toHaveBeenCalledWith('job-1');
      expect(cancelled).toBe(false);
    });
  });

  describe('Update Configuration', () => {
    it('should update configuration successfully', async () => {
      const newConfig = {
        stickerSize: StickerSize.MEDIUM,
        includeQRCode: false
      };

      const updatedConfig = {
        ...mockPrintService.getConfig(),
        ...newConfig
      };

      mockPrintService.getConfig.mockReturnValue(updatedConfig);

      const { result } = renderHook(() => usePrint());

      act(() => {
        result.current.updateConfig(newConfig);
      });

      expect(mockPrintService.updateConfig).toHaveBeenCalledWith(newConfig);
      expect(result.current.config).toEqual(updatedConfig);
    });
  });

  describe('Get Job Status', () => {
    it('should get job status successfully', () => {
      const mockJob = {
        id: 'job-1',
        status: PrintStatus.COMPLETED
      };

      mockPrintService.getPrintJob.mockReturnValue(mockJob);

      const { result } = renderHook(() => usePrint());

      const status = result.current.getJobStatus('job-1');

      expect(mockPrintService.getPrintJob).toHaveBeenCalledWith('job-1');
      expect(status).toBe(PrintStatus.COMPLETED);
    });

    it('should return null for non-existent job', () => {
      mockPrintService.getPrintJob.mockReturnValue(undefined);

      const { result } = renderHook(() => usePrint());

      const status = result.current.getJobStatus('non-existent');

      expect(status).toBeNull();
    });
  });

  describe('Clear History', () => {
    it('should clear print history', () => {
      const { result } = renderHook(() => usePrint());

      // Add some history
      act(() => {
        (result.current as any).printHistory = [
          { id: 'job-1', status: PrintStatus.COMPLETED },
          { id: 'job-2', status: PrintStatus.COMPLETED }
        ];
        (result.current as any).currentJob = { id: 'job-1' };
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.printHistory).toEqual([]);
      expect(result.current.currentJob).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should manage loading state during print operations', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockPrintService.printReceiveDocument.mockReturnValue(promise);

      const { result } = renderHook(() => usePrint());

      const receiveData: ReceiveDocumentPrintData = {
        receiveNumber: 'RCV-001',
        receiveDate: new Date(),
        warehouse: { name: 'คลังหลัก', code: 'WH001' },
        items: [],
        totalItems: 0,
        totalCost: 0,
        receivedBy: 'John Doe',
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com'
        }
      };

      // Start the print operation
      act(() => {
        result.current.printReceiveDocument(receiveData);
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          id: 'job-1',
          type: PrintDocumentType.RECEIVE_DOCUMENT,
          status: PrintStatus.COMPLETED
        });
      });

      // Should not be loading anymore
      expect(result.current.isLoading).toBe(false);
    });
  });
});