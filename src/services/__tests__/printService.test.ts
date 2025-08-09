import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { printService } from '../printService';
import { 
  PrintDocumentType, 
  PrintStatus,
  ReceiveDocumentPrintData,
  TransferDocumentPrintData,
  SNStickerPrintData,
  ClaimDocumentPrintData,
  StickerSize
} from '../../types/printing';

// Mock window.open and print functionality
const mockPrintWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn()
  },
  print: vi.fn(),
  close: vi.fn(),
  onload: null as any,
  onerror: null as any
};

Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(() => mockPrintWindow)
});

describe('PrintService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset print service state
    printService['jobs'].clear();
  });

  describe('Configuration', () => {
    it('should have default configuration', () => {
      const config = printService.getConfig();
      
      expect(config.stickerSize).toBe(StickerSize.SMALL);
      expect(config.includeQRCode).toBe(true);
      expect(config.includeBarcode).toBe(true);
      expect(config.documentMargins).toEqual({ top: 20, right: 20, bottom: 20, left: 20 });
    });

    it('should update configuration', () => {
      const newConfig = {
        stickerSize: StickerSize.MEDIUM,
        includeQRCode: false
      };

      printService.updateConfig(newConfig);
      const config = printService.getConfig();

      expect(config.stickerSize).toBe(StickerSize.MEDIUM);
      expect(config.includeQRCode).toBe(false);
      expect(config.includeBarcode).toBe(true); // Should remain unchanged
    });
  });

  describe('Print Job Management', () => {
    it('should create print job with correct properties', async () => {
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

      // Mock successful print - simulate immediate completion
      (window.open as Mock).mockImplementation(() => {
        const mockWindow = {
          ...mockPrintWindow,
          onload: null as any
        };
        
        // Simulate immediate load and print completion
        setTimeout(() => {
          if (mockWindow.onload) {
            mockWindow.onload();
          }
        }, 10);
        
        return mockWindow;
      });

      const job = await printService.printReceiveDocument(receiveData, 1, 'user1', 'Test User');

      expect(job.type).toBe(PrintDocumentType.RECEIVE_DOCUMENT);
      expect(job.status).toBe(PrintStatus.COMPLETED);
      expect(job.copies).toBe(1);
      expect(job.userId).toBe('user1');
      expect(job.userName).toBe('Test User');
      expect(job.documentData).toEqual(receiveData);
    });

    it('should handle print job cancellation', async () => {
      const receiveData: ReceiveDocumentPrintData = {
        receiveNumber: 'RCV-002',
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

      // Create a job but don't complete it
      const job = printService['createPrintJob'](
        PrintDocumentType.RECEIVE_DOCUMENT,
        receiveData,
        1,
        'user1',
        'Test User'
      );

      expect(job.status).toBe(PrintStatus.PENDING);

      const cancelled = printService.cancelPrintJob(job.id);
      expect(cancelled).toBe(true);

      const updatedJob = printService.getPrintJob(job.id);
      expect(updatedJob?.status).toBe(PrintStatus.CANCELLED);
    });

    it('should not cancel non-pending jobs', async () => {
      const receiveData: ReceiveDocumentPrintData = {
        receiveNumber: 'RCV-003',
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

      const job = printService['createPrintJob'](
        PrintDocumentType.RECEIVE_DOCUMENT,
        receiveData,
        1,
        'user1',
        'Test User'
      );

      // Mark as completed
      job.status = PrintStatus.COMPLETED;
      printService['jobs'].set(job.id, job);

      const cancelled = printService.cancelPrintJob(job.id);
      expect(cancelled).toBe(false);
    });
  });

  describe('Document Generation', () => {
    it('should generate receive document HTML', async () => {
      const receiveData: ReceiveDocumentPrintData = {
        receiveNumber: 'RCV-001',
        receiveDate: new Date('2024-01-15'),
        warehouse: { name: 'คลังหลัก', code: 'WH001', address: '123 ถนนคลัง' },
        supplier: { name: 'บริษัท ซัพพลาย', code: 'SUP001', phone: '02-111-2222' },
        invoiceNumber: 'INV-001',
        items: [{
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          brand: 'HomePro',
          model: 'Classic',
          quantity: 2,
          unitCost: 15000,
          totalCost: 30000,
          serialNumbers: ['SF001-2024-001', 'SF001-2024-002']
        }],
        totalItems: 2,
        totalCost: 30000,
        receivedBy: 'John Doe',
        notes: 'สินค้าในสภาพดี',
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com',
          logo: 'https://example.com/logo.png'
        }
      };

      const html = printService['generateReceiveDocumentHTML'](receiveData);

      expect(html).toContain('ใบรับสินค้า');
      expect(html).toContain('RCV-001');
      expect(html).toContain('คลังหลัก');
      expect(html).toContain('บริษัท ซัพพลาย');
      expect(html).toContain('INV-001');
      expect(html).toContain('โซฟา 3 ที่นั่ง');
      expect(html).toContain('SF001');
      expect(html).toContain('HomePro Classic');
      expect(html).toContain('SF001-2024-001, SF001-2024-002');
      expect(html).toContain('30,000.00');
      expect(html).toContain('John Doe');
      expect(html).toContain('สินค้าในสภาพดี');
      expect(html).toContain('บริษัท ทดสอบ จำกัด');
      expect(html).toContain('https://example.com/logo.png');
    });

    it('should generate transfer document HTML', async () => {
      const transferData: TransferDocumentPrintData = {
        transferNumber: 'TRF-001',
        transferDate: new Date('2024-01-15'),
        sourceWarehouse: { name: 'คลังหลัก', code: 'WH001' },
        targetWarehouse: { name: 'สาขา 1', code: 'WH002' },
        items: [{
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          brand: 'HomePro',
          model: 'Classic',
          serialNumber: 'SF001-2024-001',
          unitCost: 15000
        }],
        totalItems: 1,
        totalValue: 15000,
        initiatedBy: 'Manager A',
        confirmedBy: 'Manager B',
        status: 'completed',
        notes: 'โอนเพื่อเติมสต็อก',
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com'
        }
      };

      const html = printService['generateTransferDocumentHTML'](transferData);

      expect(html).toContain('ใบโอนสินค้า');
      expect(html).toContain('TRF-001');
      expect(html).toContain('คลังหลัก');
      expect(html).toContain('สาขา 1');
      expect(html).toContain('SF001-2024-001');
      expect(html).toContain('Manager A');
      expect(html).toContain('Manager B');
      expect(html).toContain('completed');
      expect(html).toContain('โอนเพื่อเติมสต็อก');
    });

    it('should generate SN sticker HTML', async () => {
      const stickerData: SNStickerPrintData = {
        serialNumber: 'SF001-2024-001',
        productName: 'โซฟา 3 ที่นั่ง รุ่น Classic Premium',
        productCode: 'SF001',
        brand: 'HomePro',
        model: 'Classic',
        unitCost: 15000,
        receiveDate: new Date('2024-01-15'),
        warehouseName: 'คลังหลัก สาขาใหญ่',
        qrCode: 'data:image/png;base64,qrcode',
        barcode: 'data:image/png;base64,barcode'
      };

      const html = printService['generateSNStickerHTML'](stickerData);

      expect(html).toContain('SF001-2024-001');
      expect(html).toContain('โซฟา 3 ที่นั่ง รุ...'); // Truncated
      expect(html).toContain('SF001');
      expect(html).toContain('HomePro');
      expect(html).toContain('15,000.00');
      expect(html).toContain('คลังหลั...'); // Truncated
      expect(html).toContain('data:image/png;base64,qrcode');
      expect(html).toContain('data:image/png;base64,barcode');
      expect(html).toContain('width: 3.2cm');
      expect(html).toContain('height: 2.5cm');
    });

    it('should generate claim document HTML', async () => {
      const claimData: ClaimDocumentPrintData = {
        claimNumber: 'CLM-001',
        claimDate: new Date('2024-01-15'),
        claimType: 'warranty',
        serialNumber: 'SF001-2024-001',
        productName: 'โซฟา 3 ที่นั่ง',
        productCode: 'SF001',
        brand: 'HomePro',
        model: 'Classic',
        reason: 'ผ้าหุ้มฉีกขาด',
        customerName: 'คุณสมชาย ใจดี',
        originalSaleReference: 'SALE-001',
        resolution: 'เปลี่ยนใหม่',
        processedBy: 'Staff A',
        warehouse: { name: 'คลังหลัก', code: 'WH001' },
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com'
        }
      };

      const html = printService['generateClaimDocumentHTML'](claimData);

      expect(html).toContain('ใบเคลมสินค้า');
      expect(html).toContain('CLM-001');
      expect(html).toContain('warranty');
      expect(html).toContain('SF001-2024-001');
      expect(html).toContain('ผ้าหุ้มฉีกขาด');
      expect(html).toContain('คุณสมชาย ใจดี');
      expect(html).toContain('SALE-001');
      expect(html).toContain('เปลี่ยนใหม่');
      expect(html).toContain('Staff A');
    });
  });

  describe('Print Preview', () => {
    it('should generate preview for receive document', async () => {
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

      const preview = await printService.generatePreview(
        PrintDocumentType.RECEIVE_DOCUMENT,
        receiveData
      );

      expect(preview.type).toBe(PrintDocumentType.RECEIVE_DOCUMENT);
      expect(preview.html).toContain('ใบรับสินค้า');
      expect(preview.css).toContain('font-family');
      expect(preview.copies).toBe(1);
      expect(preview.estimatedPages).toBe(1);
    });

    it('should generate preview for SN sticker', async () => {
      const stickerData: SNStickerPrintData = {
        serialNumber: 'SF001-2024-001',
        productName: 'โซฟา 3 ที่นั่ง',
        productCode: 'SF001',
        unitCost: 15000,
        receiveDate: new Date(),
        warehouseName: 'คลังหลัก'
      };

      const preview = await printService.generatePreview(
        PrintDocumentType.SN_STICKER,
        stickerData
      );

      expect(preview.type).toBe(PrintDocumentType.SN_STICKER);
      expect(preview.html).toContain('SF001-2024-001');
      expect(preview.css).toContain('3.2cm');
      expect(preview.css).toContain('2.5cm');
    });
  });

  describe('Utility Functions', () => {
    it('should format Thai dates correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = printService['formatDate'](date);
      
      expect(formatted).toMatch(/15 มกราคม 2567/);
    });

    it('should format currency correctly', () => {
      expect(printService['formatCurrency'](15000)).toBe('15,000.00');
      expect(printService['formatCurrency'](1234.56)).toBe('1,234.56');
      expect(printService['formatCurrency'](0)).toBe('0.00');
    });

    it('should truncate text correctly', () => {
      expect(printService['truncateText']('Short text', 20)).toBe('Short text');
      expect(printService['truncateText']('This is a very long text that should be truncated', 20))
        .toBe('This is a very lo...');
    });

    it('should format short dates correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = printService['formatShortDate'](date);
      
      expect(formatted).toMatch(/15\/01\/67/);
    });
  });

  describe('Error Handling', () => {
    it('should handle print window creation failure', async () => {
      // Mock window.open to return null
      (window.open as Mock).mockReturnValueOnce(null);

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

      await expect(
        printService.printReceiveDocument(receiveData, 1, 'user1', 'Test User')
      ).rejects.toThrow('Unable to open print window');
    });

    it('should handle unsupported document types in preview', async () => {
      await expect(
        printService.generatePreview('unsupported' as PrintDocumentType, {})
      ).rejects.toThrow('Unsupported document type: unsupported');
    });
  });

  describe('Print Job History', () => {
    it('should track all print jobs', async () => {
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

      // Mock successful print - simulate immediate completion
      (window.open as Mock).mockImplementation(() => {
        const mockWindow = {
          ...mockPrintWindow,
          onload: null as any
        };
        
        setTimeout(() => {
          if (mockWindow.onload) {
            mockWindow.onload();
          }
        }, 10);
        
        return mockWindow;
      });

      const job1 = await printService.printReceiveDocument(receiveData, 1, 'user1', 'User 1');
      const job2 = await printService.printReceiveDocument(receiveData, 2, 'user2', 'User 2');

      const allJobs = printService.getAllPrintJobs();
      expect(allJobs).toHaveLength(2);
      expect(allJobs.find(j => j.id === job1.id)).toBeDefined();
      expect(allJobs.find(j => j.id === job2.id)).toBeDefined();
    });
  });
});