import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrintPreview from '../PrintPreview';
import { PrintDocumentType, PrintStatus } from '../../../types/printing';
import { printService } from '../../../services/printService';

// Mock the print service
vi.mock('../../../services/printService', () => ({
  printService: {
    generatePreview: vi.fn(),
    printReceiveDocument: vi.fn(),
    printTransferDocument: vi.fn(),
    printSNStickers: vi.fn(),
    printClaimDocument: vi.fn()
  }
}));

// Mock the toast hook
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock UI components
vi.mock('../../ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>
}));

vi.mock('../../ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}));

vi.mock('../../ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  )
}));

vi.mock('../../ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>
}));

vi.mock('../../ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />
}));

vi.mock('../../ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>
}));

describe('PrintPreview', () => {
  const mockPrintService = printService as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    documentType: PrintDocumentType.RECEIVE_DOCUMENT,
    documentData: {
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
    }
  };

  describe('Rendering', () => {
    it('should render when open', () => {
      mockPrintService.generatePreview.mockResolvedValue({
        html: '<div>Preview HTML</div>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        copies: 1,
        estimatedPages: 1
      });

      render(<PrintPreview {...defaultProps} />);

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('ตัวอย่างการพิมพ์ - ใบรับสินค้า')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<PrintPreview {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      mockPrintService.generatePreview.mockImplementation(() => new Promise(() => {}));

      render(<PrintPreview {...defaultProps} />);

      expect(screen.getByText('กำลังสร้างตัวอย่าง...')).toBeInTheDocument();
    });
  });

  describe('Preview Generation', () => {
    it('should generate preview on open', async () => {
      const mockPreview = {
        html: '<div>Preview HTML</div>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        copies: 1,
        estimatedPages: 1
      };

      mockPrintService.generatePreview.mockResolvedValue(mockPreview);

      render(<PrintPreview {...defaultProps} />);

      await waitFor(() => {
        expect(mockPrintService.generatePreview).toHaveBeenCalledWith(
          PrintDocumentType.RECEIVE_DOCUMENT,
          defaultProps.documentData
        );
      });
    });

    it('should handle preview generation error', async () => {
      mockPrintService.generatePreview.mockRejectedValue(new Error('Preview failed'));

      render(<PrintPreview {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('ไม่สามารถสร้างตัวอย่างได้')).toBeInTheDocument();
      });
    });
  });

  describe('Print Functionality', () => {
    it('should print receive document', async () => {
      const mockPreview = {
        html: '<div>Preview HTML</div>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        copies: 1,
        estimatedPages: 1
      };

      const mockJob = {
        id: 'job-1',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        status: PrintStatus.COMPLETED,
        copies: 1,
        userId: 'current-user',
        createdAt: new Date(),
        documentData: defaultProps.documentData,
        templateName: 'receive-document'
      };

      mockPrintService.generatePreview.mockResolvedValue(mockPreview);
      mockPrintService.printReceiveDocument.mockResolvedValue(mockJob);

      const onPrintComplete = vi.fn();

      render(<PrintPreview {...defaultProps} onPrintComplete={onPrintComplete} />);

      await waitFor(() => {
        expect(screen.getByText('พิมพ์ (1 ชุด)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('พิมพ์ (1 ชุด)'));

      await waitFor(() => {
        expect(mockPrintService.printReceiveDocument).toHaveBeenCalledWith(
          defaultProps.documentData,
          1,
          'current-user',
          'Current User'
        );
        expect(onPrintComplete).toHaveBeenCalledWith(mockJob);
      });
    });

    it('should print transfer document', async () => {
      const transferData = {
        transferNumber: 'TRF-001',
        transferDate: new Date(),
        sourceWarehouse: { name: 'คลังหลัก', code: 'WH001' },
        targetWarehouse: { name: 'สาขา 1', code: 'WH002' },
        items: [],
        totalItems: 0,
        totalValue: 0,
        initiatedBy: 'Manager A',
        status: 'completed',
        companyInfo: {
          name: 'บริษัท ทดสอบ จำกัด',
          address: '123 ถนนทดสอบ',
          phone: '02-123-4567',
          email: 'test@company.com'
        }
      };

      const mockPreview = {
        html: '<div>Transfer Preview</div>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.TRANSFER_DOCUMENT,
        copies: 1,
        estimatedPages: 1
      };

      const mockJob = {
        id: 'job-2',
        type: PrintDocumentType.TRANSFER_DOCUMENT,
        status: PrintStatus.COMPLETED,
        copies: 1,
        userId: 'current-user',
        createdAt: new Date(),
        documentData: transferData,
        templateName: 'transfer-document'
      };

      mockPrintService.generatePreview.mockResolvedValue(mockPreview);
      mockPrintService.printTransferDocument.mockResolvedValue(mockJob);

      render(
        <PrintPreview
          isOpen={true}
          onClose={vi.fn()}
          documentType={PrintDocumentType.TRANSFER_DOCUMENT}
          documentData={transferData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('พิมพ์ (1 ชุด)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('พิมพ์ (1 ชุด)'));

      await waitFor(() => {
        expect(mockPrintService.printTransferDocument).toHaveBeenCalledWith(
          transferData,
          1,
          'current-user',
          'Current User'
        );
      });
    });

    it('should print SN stickers', async () => {
      const stickerData = [{
        serialNumber: 'SF001-2024-001',
        productName: 'โซฟา 3 ที่นั่ง',
        productCode: 'SF001',
        unitCost: 15000,
        receiveDate: new Date(),
        warehouseName: 'คลังหลัก'
      }];

      const mockPreview = {
        html: '<div>Sticker Preview</div>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.SN_STICKER,
        copies: 1,
        estimatedPages: 1
      };

      const mockJob = {
        id: 'job-3',
        type: PrintDocumentType.SN_STICKER,
        status: PrintStatus.COMPLETED,
        copies: 1,
        userId: 'current-user',
        createdAt: new Date(),
        documentData: stickerData,
        templateName: 'sn-sticker'
      };

      mockPrintService.generatePreview.mockResolvedValue(mockPreview);
      mockPrintService.printSNStickers.mockResolvedValue(mockJob);

      render(
        <PrintPreview
          isOpen={true}
          onClose={vi.fn()}
          documentType={PrintDocumentType.SN_STICKER}
          documentData={stickerData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('พิมพ์ (1 ชุด)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('พิมพ์ (1 ชุด)'));

      await waitFor(() => {
        expect(mockPrintService.printSNStickers).toHaveBeenCalledWith(
          stickerData,
          'current-user',
          'Current User'
        );
      });
    });

    it('should handle print errors', async () => {
      const mockPreview = {
        html: '<div>Preview HTML</div>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        copies: 1,
        estimatedPages: 1
      };

      mockPrintService.generatePreview.mockResolvedValue(mockPreview);
      mockPrintService.printReceiveDocument.mockRejectedValue(new Error('Print failed'));

      render(<PrintPreview {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('พิมพ์ (1 ชุด)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('พิมพ์ (1 ชุด)'));

      await waitFor(() => {
        expect(mockPrintService.printReceiveDocument).toHaveBeenCalled();
      });
    });
  });

  describe('Copies Management', () => {
    it('should update copies count', async () => {
      const mockPreview = {
        html: '<div>Preview HTML</div>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        copies: 1,
        estimatedPages: 1
      };

      mockPrintService.generatePreview.mockResolvedValue(mockPreview);

      render(<PrintPreview {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      });

      const copiesInput = screen.getByDisplayValue('1');
      fireEvent.change(copiesInput, { target: { value: '3' } });

      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getByText('พิมพ์ (3 ชุด)')).toBeInTheDocument();
    });
  });

  describe('Dialog Controls', () => {
    it('should close dialog when cancel is clicked', async () => {
      const onClose = vi.fn();
      mockPrintService.generatePreview.mockResolvedValue({
        html: '<div>Preview HTML</div>',
        css: 'body { font-family: Arial; }',
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        copies: 1,
        estimatedPages: 1
      });

      render(<PrintPreview {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByText('ยกเลิก')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('ยกเลิก'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Document Type Labels', () => {
    const testCases = [
      {
        type: PrintDocumentType.RECEIVE_DOCUMENT,
        expectedLabel: 'ตัวอย่างการพิมพ์ - ใบรับสินค้า'
      },
      {
        type: PrintDocumentType.TRANSFER_DOCUMENT,
        expectedLabel: 'ตัวอย่างการพิมพ์ - ใบโอนสินค้า'
      },
      {
        type: PrintDocumentType.SN_STICKER,
        expectedLabel: 'ตัวอย่างการพิมพ์ - สติกเกอร์ SN'
      },
      {
        type: PrintDocumentType.CLAIM_DOCUMENT,
        expectedLabel: 'ตัวอย่างการพิมพ์ - ใบเคลมสินค้า'
      },
      {
        type: PrintDocumentType.STOCK_REPORT,
        expectedLabel: 'ตัวอย่างการพิมพ์ - รายงานสต็อก'
      }
    ];

    testCases.forEach(({ type, expectedLabel }) => {
      it(`should show correct title for ${type}`, () => {
        mockPrintService.generatePreview.mockResolvedValue({
          html: '<div>Preview</div>',
          css: 'body {}',
          type,
          copies: 1,
          estimatedPages: 1
        });

        render(
          <PrintPreview
            {...defaultProps}
            documentType={type}
          />
        );

        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      });
    });
  });
});