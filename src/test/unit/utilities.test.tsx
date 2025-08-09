// Comprehensive unit tests for utilities and hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import utilities
import { generateSerialNumber, validateSerialNumber, parseSerialNumber } from '@/utils/serialNumberGenerator';
import { calculateStockLevels, calculateStockValue, getStockStatus } from '@/utils/stockCalculations';
import { validateReceiveData, validateTransferData, validateWithdrawData } from '@/utils/validation';
import { handleError, createErrorMessage, isNetworkError } from '@/utils/errorHandling';

// Import hooks
import { useStock } from '@/hooks/useStock';
import { useWarehouse } from '@/hooks/useWarehouse';
import { useWarehouses } from '@/hooks/useWarehousesEnhanced';
import { useTransfer } from '@/hooks/useTransfer';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';
import { usePrint } from '@/hooks/usePrint';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { usePOSIntegration } from '@/hooks/usePOSIntegration';
import { useInstallmentIntegration } from '@/hooks/useInstallmentIntegration';

import { createMockWarehouse, createMockProduct, createMockSerialNumber, createMockSupplier } from '../utils/testHelpers';

// Mock services
vi.mock('@/lib/serialNumberService');
vi.mock('@/lib/warehouseService');
vi.mock('@/lib/transferService');
vi.mock('@/services/realTimeStockService');
vi.mock('@/services/printService');
vi.mock('@/services/posIntegrationService');
vi.mock('@/services/installmentIntegrationService');

describe('Utilities and Hooks Tests', () => {
  describe('Serial Number Generator Utilities', () => {
    it('should generate serial number with correct format', () => {
      const sn = generateSerialNumber('TP001', 2024, 1);
      expect(sn).toMatch(/^TP001-2024-\d{3}$/);
    });

    it('should generate unique serial numbers', () => {
      const sn1 = generateSerialNumber('TP001', 2024, 1);
      const sn2 = generateSerialNumber('TP001', 2024, 2);
      expect(sn1).not.toBe(sn2);
    });

    it('should validate serial number format', () => {
      expect(validateSerialNumber('TP001-2024-001')).toBe(true);
      expect(validateSerialNumber('INVALID-FORMAT')).toBe(false);
      expect(validateSerialNumber('')).toBe(false);
      expect(validateSerialNumber('TP001-2024-1')).toBe(false); // Wrong padding
    });

    it('should parse serial number components', () => {
      const parsed = parseSerialNumber('TP001-2024-001');
      expect(parsed).toEqual({
        productCode: 'TP001',
        year: 2024,
        sequence: 1,
        isValid: true
      });
    });

    it('should handle invalid serial number parsing', () => {
      const parsed = parseSerialNumber('INVALID');
      expect(parsed.isValid).toBe(false);
    });

    it('should generate serial numbers with custom patterns', () => {
      const sn = generateSerialNumber('CUSTOM', 2024, 1, { prefix: 'PRE', suffix: 'SUF' });
      expect(sn).toMatch(/^PRE-CUSTOM-2024-\d{3}-SUF$/);
    });
  });

  describe('Stock Calculation Utilities', () => {
    const mockSerialNumbers = [
      createMockSerialNumber({ status: 'available' }),
      createMockSerialNumber({ status: 'available' }),
      createMockSerialNumber({ status: 'sold' }),
      createMockSerialNumber({ status: 'reserved' }),
      createMockSerialNumber({ status: 'damaged' })
    ];

    it('should calculate stock levels correctly', () => {
      const levels = calculateStockLevels(mockSerialNumbers);
      
      expect(levels.total).toBe(5);
      expect(levels.available).toBe(2);
      expect(levels.sold).toBe(1);
      expect(levels.reserved).toBe(1);
      expect(levels.damaged).toBe(1);
    });

    it('should calculate stock value', () => {
      const serialNumbers = [
        createMockSerialNumber({ unit_cost: 1000, status: 'available' }),
        createMockSerialNumber({ unit_cost: 1500, status: 'available' }),
        createMockSerialNumber({ unit_cost: 2000, status: 'sold' })
      ];

      const value = calculateStockValue(serialNumbers, 'available');
      expect(value).toBe(2500); // 1000 + 1500
    });

    it('should calculate total stock value', () => {
      const serialNumbers = [
        createMockSerialNumber({ unit_cost: 1000 }),
        createMockSerialNumber({ unit_cost: 1500 }),
        createMockSerialNumber({ unit_cost: 2000 })
      ];

      const value = calculateStockValue(serialNumbers);
      expect(value).toBe(4500); // 1000 + 1500 + 2000
    });

    it('should determine stock status', () => {
      expect(getStockStatus(0)).toBe('out_of_stock');
      expect(getStockStatus(3)).toBe('low_stock'); // Below default threshold of 5
      expect(getStockStatus(10)).toBe('normal');
      expect(getStockStatus(100)).toBe('high');
    });

    it('should use custom thresholds for stock status', () => {
      const thresholds = { low: 10, high: 50 };
      
      expect(getStockStatus(5, thresholds)).toBe('low_stock');
      expect(getStockStatus(25, thresholds)).toBe('normal');
      expect(getStockStatus(75, thresholds)).toBe('high');
    });

    it('should handle empty serial numbers array', () => {
      const levels = calculateStockLevels([]);
      expect(levels.total).toBe(0);
      expect(levels.available).toBe(0);
    });
  });

  describe('Validation Utilities', () => {
    const mockWarehouse = createMockWarehouse();
    const mockProduct = createMockProduct();
    const mockSupplier = createMockSupplier();

    describe('Receive Data Validation', () => {
      it('should validate correct receive data', () => {
        const receiveData = {
          warehouseId: mockWarehouse.id,
          supplierId: mockSupplier.id,
          invoiceNumber: 'INV-001',
          items: [{
            productId: mockProduct.id,
            quantity: 5,
            unitCost: 1000
          }],
          receivedBy: 'user-1'
        };

        const result = validateReceiveData(receiveData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing required fields', () => {
        const receiveData = {
          warehouseId: '',
          supplierId: '',
          invoiceNumber: '',
          items: [],
          receivedBy: ''
        };

        const result = validateReceiveData(receiveData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Warehouse is required');
        expect(result.errors).toContain('Supplier is required');
        expect(result.errors).toContain('At least one item is required');
      });

      it('should validate item data', () => {
        const receiveData = {
          warehouseId: mockWarehouse.id,
          supplierId: mockSupplier.id,
          invoiceNumber: 'INV-001',
          items: [{
            productId: '',
            quantity: 0,
            unitCost: -100
          }],
          receivedBy: 'user-1'
        };

        const result = validateReceiveData(receiveData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Product is required');
        expect(result.errors).toContain('Quantity must be greater than 0');
        expect(result.errors).toContain('Unit cost must be greater than 0');
      });
    });

    describe('Transfer Data Validation', () => {
      it('should validate correct transfer data', () => {
        const transferData = {
          sourceWarehouseId: mockWarehouse.id,
          targetWarehouseId: 'warehouse-2',
          items: [{
            serialNumberId: 'sn-1',
            productId: mockProduct.id,
            quantity: 1,
            unitCost: 1000
          }],
          initiatedBy: 'user-1'
        };

        const result = validateTransferData(transferData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should prevent transfer to same warehouse', () => {
        const transferData = {
          sourceWarehouseId: mockWarehouse.id,
          targetWarehouseId: mockWarehouse.id,
          items: [{
            serialNumberId: 'sn-1',
            productId: mockProduct.id,
            quantity: 1,
            unitCost: 1000
          }],
          initiatedBy: 'user-1'
        };

        const result = validateTransferData(transferData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Source and target warehouses cannot be the same');
      });

      it('should require items for transfer', () => {
        const transferData = {
          sourceWarehouseId: mockWarehouse.id,
          targetWarehouseId: 'warehouse-2',
          items: [],
          initiatedBy: 'user-1'
        };

        const result = validateTransferData(transferData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('At least one item is required');
      });
    });

    describe('Withdraw Data Validation', () => {
      it('should validate correct withdraw data', () => {
        const withdrawData = {
          warehouseId: mockWarehouse.id,
          items: [{
            serialNumberId: 'sn-1',
            productId: mockProduct.id,
            quantity: 1
          }],
          performedBy: 'user-1'
        };

        const result = validateWithdrawData(withdrawData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should require warehouse and items', () => {
        const withdrawData = {
          warehouseId: '',
          items: [],
          performedBy: ''
        };

        const result = validateWithdrawData(withdrawData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Warehouse is required');
        expect(result.errors).toContain('At least one item is required');
        expect(result.errors).toContain('Performed by is required');
      });

      it('should validate dispatch with customer info', () => {
        const dispatchData = {
          warehouseId: mockWarehouse.id,
          items: [{
            serialNumberId: 'sn-1',
            productId: mockProduct.id,
            quantity: 1
          }],
          customerName: 'Test Customer',
          customerPhone: '123-456-7890',
          performedBy: 'user-1'
        };

        const result = validateWithdrawData(dispatchData, 'dispatch');
        expect(result.isValid).toBe(true);
      });

      it('should require customer info for dispatch', () => {
        const dispatchData = {
          warehouseId: mockWarehouse.id,
          items: [{
            serialNumberId: 'sn-1',
            productId: mockProduct.id,
            quantity: 1
          }],
          customerName: '',
          performedBy: 'user-1'
        };

        const result = validateWithdrawData(dispatchData, 'dispatch');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Customer name is required for dispatch');
      });
    });
  });

  describe('Error Handling Utilities', () => {
    it('should handle generic errors', () => {
      const error = new Error('Test error');
      const result = handleError(error);
      
      expect(result.message).toBe('Test error');
      expect(result.type).toBe('generic');
      expect(result.shouldRetry).toBe(false);
    });

    it('should detect network errors', () => {
      const networkError = new Error('Network timeout');
      expect(isNetworkError(networkError)).toBe(true);

      const fetchError = new Error('Failed to fetch');
      expect(isNetworkError(fetchError)).toBe(true);

      const genericError = new Error('Something else');
      expect(isNetworkError(genericError)).toBe(false);
    });

    it('should create user-friendly error messages', () => {
      const dbError = new Error('duplicate key value violates unique constraint');
      const message = createErrorMessage(dbError);
      expect(message).toBe('This item already exists in the system');

      const networkError = new Error('Network timeout');
      const networkMessage = createErrorMessage(networkError);
      expect(networkMessage).toBe('Network connection failed. Please check your connection and try again.');
    });

    it('should handle validation errors', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      const result = handleError(validationError);
      expect(result.type).toBe('validation');
      expect(result.shouldRetry).toBe(false);
    });

    it('should handle database constraint errors', () => {
      const constraintError = new Error('foreign key constraint');
      const result = handleError(constraintError);
      
      expect(result.type).toBe('constraint');
      expect(result.shouldRetry).toBe(false);
    });

    it('should suggest retry for network errors', () => {
      const networkError = new Error('Connection timeout');
      const result = handleError(networkError);
      
      expect(result.type).toBe('network');
      expect(result.shouldRetry).toBe(true);
    });
  });

  describe('Hooks Tests', () => {
    let queryClient: QueryClient;
    
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false }
        }
      });
      vi.clearAllMocks();
    });

    describe('useStock Hook', () => {
      it('should fetch stock data', async () => {
        const { serialNumberService } = require('@/lib/serialNumberService');
        const mockSerialNumbers = [createMockSerialNumber()];
        
        vi.mocked(serialNumberService.searchSerialNumbers).mockResolvedValue({
          data: mockSerialNumbers,
          count: 1,
          error: null
        });

        const { result } = renderHook(() => useStock({
          warehouseId: mockWarehouse.id,
          productId: mockProduct.id
        }), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.data).toEqual(mockSerialNumbers);
        expect(result.current.isLoading).toBe(false);
      });

      it('should handle search filters', async () => {
        const { serialNumberService } = require('@/lib/serialNumberService');
        
        const { result } = renderHook(() => useStock({
          warehouseId: mockWarehouse.id,
          status: 'available',
          searchTerm: 'test'
        }), { wrapper });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(serialNumberService.searchSerialNumbers).toHaveBeenCalledWith({
          warehouseId: mockWarehouse.id,
          status: 'available',
          searchTerm: 'test'
        });
      });

      it('should calculate stock levels', async () => {
        const { serialNumberService } = require('@/lib/serialNumberService');
        const mockSerialNumbers = [
          createMockSerialNumber({ status: 'available' }),
          createMockSerialNumber({ status: 'available' }),
          createMockSerialNumber({ status: 'sold' })
        ];
        
        vi.mocked(serialNumberService.searchSerialNumbers).mockResolvedValue({
          data: mockSerialNumbers,
          count: 3,
          error: null
        });

        const { result } = renderHook(() => useStock({
          warehouseId: mockWarehouse.id
        }), { wrapper });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.stockLevels.total).toBe(3);
        expect(result.current.stockLevels.available).toBe(2);
        expect(result.current.stockLevels.sold).toBe(1);
      });
    });

    describe('useWarehouse Hook', () => {
      it('should fetch warehouse data', async () => {
        const { WarehouseService } = require('@/lib/warehouseService');
        
        vi.mocked(WarehouseService.getWarehouse).mockResolvedValue(mockWarehouse);

        const { result } = renderHook(() => useWarehouse(mockWarehouse.id), { wrapper });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.data).toEqual(mockWarehouse);
        expect(result.current.isLoading).toBe(false);
      });

      it('should handle warehouse not found', async () => {
        const { WarehouseService } = require('@/lib/warehouseService');
        
        vi.mocked(WarehouseService.getWarehouse).mockResolvedValue(null);

        const { result } = renderHook(() => useWarehouse('non-existent'), { wrapper });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });

    describe('useWarehouses Hook', () => {
      it('should fetch warehouses with stock levels', async () => {
        const { WarehouseService } = require('@/lib/warehouseService');
        const mockWarehouses = [mockWarehouse];
        const mockStockLevels = [{
          product_id: mockProduct.id,
          warehouse_id: mockWarehouse.id,
          total_quantity: 10,
          available_quantity: 8
        }];
        
        vi.mocked(WarehouseService.getWarehouses).mockResolvedValue(mockWarehouses);
        vi.mocked(WarehouseService.getStockLevels).mockResolvedValue(mockStockLevels);

        const { result } = renderHook(() => useWarehouses(), { wrapper });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.warehouses).toEqual(mockWarehouses);
        expect(result.current.stockLevels).toEqual(mockStockLevels);
      });

      it('should filter warehouses by branch', async () => {
        const { WarehouseService } = require('@/lib/warehouseService');
        const mockWarehouses = [
          createMockWarehouse({ branch_id: 'branch-1' }),
          createMockWarehouse({ branch_id: 'branch-2' })
        ];
        
        vi.mocked(WarehouseService.getWarehouses).mockResolvedValue(mockWarehouses);

        const { result } = renderHook(() => useWarehouses({
          branchId: 'branch-1'
        }), { wrapper });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.warehouses).toHaveLength(1);
        expect(result.current.warehouses[0].branch_id).toBe('branch-1');
      });
    });

    describe('useTransfer Hook', () => {
      it('should create transfer', async () => {
        const { transferService } = require('@/lib/transferService');
        const mockTransfer = {
          id: 'transfer-1',
          status: 'pending'
        };
        
        vi.mocked(transferService.createTransfer).mockResolvedValue(mockTransfer);

        const { result } = renderHook(() => useTransfer(), { wrapper });

        await act(async () => {
          await result.current.createTransfer({
            sourceWarehouseId: mockWarehouse.id,
            targetWarehouseId: 'warehouse-2',
            items: [],
            initiatedBy: 'user-1'
          });
        });

        expect(transferService.createTransfer).toHaveBeenCalled();
        expect(result.current.isCreating).toBe(false);
      });

      it('should confirm transfer', async () => {
        const { transferService } = require('@/lib/transferService');
        
        vi.mocked(transferService.confirmTransfer).mockResolvedValue(undefined);

        const { result } = renderHook(() => useTransfer(), { wrapper });

        await act(async () => {
          await result.current.confirmTransfer('transfer-1', 'user-2');
        });

        expect(transferService.confirmTransfer).toHaveBeenCalledWith('transfer-1', 'user-2');
      });

      it('should fetch pending transfers', async () => {
        const { transferService } = require('@/lib/transferService');
        const mockTransfers = [{
          id: 'transfer-1',
          status: 'pending'
        }];
        
        vi.mocked(transferService.getPendingTransfers).mockResolvedValue(mockTransfers);

        const { result } = renderHook(() => useTransfer({
          warehouseId: mockWarehouse.id
        }), { wrapper });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.pendingTransfers).toEqual(mockTransfers);
      });
    });

    describe('useRealTimeStock Hook', () => {
      it('should subscribe to real-time updates', () => {
        const { realTimeStockService } = require('@/services/realTimeStockService');
        const mockUnsubscribe = vi.fn();
        
        vi.mocked(realTimeStockService.subscribe).mockReturnValue(mockUnsubscribe);

        const { result, unmount } = renderHook(() => useRealTimeStock({
          warehouseId: mockWarehouse.id
        }), { wrapper });

        expect(realTimeStockService.subscribe).toHaveBeenCalledWith(
          expect.any(String),
          { warehouseId: mockWarehouse.id },
          expect.any(Function)
        );

        unmount();
        expect(mockUnsubscribe).toHaveBeenCalled();
      });

      it('should handle real-time stock updates', () => {
        const { realTimeStockService } = require('@/services/realTimeStockService');
        let callback: any;
        
        vi.mocked(realTimeStockService.subscribe).mockImplementation((id, options, cb) => {
          callback = cb;
          return vi.fn();
        });

        const { result } = renderHook(() => useRealTimeStock({
          warehouseId: mockWarehouse.id
        }), { wrapper });

        // Simulate real-time update
        act(() => {
          callback({
            type: 'stock_level_changed',
            data: {
              productId: mockProduct.id,
              currentStock: 5,
              change: -2
            }
          });
        });

        expect(result.current.lastUpdate).toBeDefined();
        expect(result.current.lastUpdate?.type).toBe('stock_level_changed');
      });

      it('should handle stock alerts', () => {
        const { realTimeStockService } = require('@/services/realTimeStockService');
        let callback: any;
        
        vi.mocked(realTimeStockService.subscribe).mockImplementation((id, options, cb) => {
          callback = cb;
          return vi.fn();
        });

        const { result } = renderHook(() => useRealTimeStock({
          warehouseId: mockWarehouse.id
        }), { wrapper });

        // Simulate alert
        act(() => {
          callback({
            type: 'alert_triggered',
            data: {
              type: 'low_stock',
              severity: 'warning',
              productId: mockProduct.id,
              currentStock: 2
            }
          });
        });

        expect(result.current.alerts).toHaveLength(1);
        expect(result.current.alerts[0].type).toBe('low_stock');
      });
    });

    describe('usePrint Hook', () => {
      it('should print document', async () => {
        const { printService } = require('@/services/printService');
        
        vi.mocked(printService.printReceiveDocument).mockResolvedValue({
          success: true,
          documentUrl: 'test-url',
          printJobId: 'job-1'
        });

        const { result } = renderHook(() => usePrint(), { wrapper });

        await act(async () => {
          await result.current.printDocument('receive', { id: 'receive-1' });
        });

        expect(printService.printReceiveDocument).toHaveBeenCalled();
        expect(result.current.isPrinting).toBe(false);
        expect(result.current.lastPrintResult?.success).toBe(true);
      });

      it('should handle print errors', async () => {
        const { printService } = require('@/services/printService');
        
        vi.mocked(printService.printReceiveDocument).mockResolvedValue({
          success: false,
          error: 'Printer not available'
        });

        const { result } = renderHook(() => usePrint(), { wrapper });

        await act(async () => {
          await result.current.printDocument('receive', { id: 'receive-1' });
        });

        expect(result.current.lastPrintResult?.success).toBe(false);
        expect(result.current.lastPrintResult?.error).toBe('Printer not available');
      });
    });

    describe('useBarcodeScanner Hook', () => {
      it('should handle barcode scan', () => {
        const mockOnScan = vi.fn();
        
        const { result } = renderHook(() => useBarcodeScanner({
          onScan: mockOnScan,
          isActive: true
        }));

        act(() => {
          result.current.handleScan('TP001-2024-001');
        });

        expect(mockOnScan).toHaveBeenCalledWith('TP001-2024-001');
        expect(result.current.lastScanned).toBe('TP001-2024-001');
      });

      it('should validate scanned barcodes', () => {
        const mockOnScan = vi.fn();
        
        const { result } = renderHook(() => useBarcodeScanner({
          onScan: mockOnScan,
          isActive: true,
          validateBarcode: (code) => code.startsWith('TP')
        }));

        // Valid barcode
        act(() => {
          result.current.handleScan('TP001-2024-001');
        });
        expect(mockOnScan).toHaveBeenCalledWith('TP001-2024-001');

        // Invalid barcode
        act(() => {
          result.current.handleScan('INVALID-CODE');
        });
        expect(mockOnScan).toHaveBeenCalledTimes(1); // Should not be called again
      });

      it('should handle scanner activation', () => {
        const { result, rerender } = renderHook(
          ({ isActive }) => useBarcodeScanner({
            onScan: vi.fn(),
            isActive
          }),
          { initialProps: { isActive: false } }
        );

        expect(result.current.isActive).toBe(false);

        rerender({ isActive: true });
        expect(result.current.isActive).toBe(true);
      });
    });

    describe('Integration Hooks', () => {
      describe('usePOSIntegration Hook', () => {
        it('should get POS connection status', () => {
          const { posIntegrationService } = require('@/services/posIntegrationService');
          
          vi.mocked(posIntegrationService.getConnectionStatus).mockReturnValue({
            connected: true,
            lastSync: new Date().toISOString()
          });

          const { result } = renderHook(() => usePOSIntegration(), { wrapper });

          expect(result.current.connectionStatus.connected).toBe(true);
        });

        it('should handle POS sale completion', async () => {
          const { posIntegrationService } = require('@/services/posIntegrationService');
          
          vi.mocked(posIntegrationService.onSaleComplete).mockResolvedValue(undefined);

          const { result } = renderHook(() => usePOSIntegration(), { wrapper });

          await act(async () => {
            await result.current.handleSaleComplete({
              id: 'sale-1',
              items: [],
              totalAmount: 1000
            });
          });

          expect(posIntegrationService.onSaleComplete).toHaveBeenCalled();
        });
      });

      describe('useInstallmentIntegration Hook', () => {
        it('should get reserved stock', async () => {
          const { installmentIntegrationService } = require('@/services/installmentIntegrationService');
          
          vi.mocked(installmentIntegrationService.getReservedStock).mockResolvedValue({
            totalReserved: 5,
            items: []
          });

          const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
          });

          expect(result.current.reservedStock?.totalReserved).toBe(5);
        });

        it('should handle contract completion', async () => {
          const { installmentIntegrationService } = require('@/services/installmentIntegrationService');
          
          vi.mocked(installmentIntegrationService.onContractComplete).mockResolvedValue(undefined);

          const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

          await act(async () => {
            await result.current.handleContractComplete({
              id: 'contract-1',
              items: [],
              totalAmount: 2000
            });
          });

          expect(installmentIntegrationService.onContractComplete).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => 
        createMockSerialNumber({ id: `sn-${i}` })
      );

      const start = performance.now();
      const levels = calculateStockLevels(largeDataset);
      const end = performance.now();

      expect(levels.total).toBe(10000);
      expect(end - start).toBeLessThan(100); // Should complete within 100ms
    });

    it('should validate large forms efficiently', () => {
      const largeReceiveData = {
        warehouseId: mockWarehouse.id,
        supplierId: mockSupplier.id,
        invoiceNumber: 'INV-001',
        items: Array.from({ length: 1000 }, (_, i) => ({
          productId: `product-${i}`,
          quantity: 1,
          unitCost: 1000
        })),
        receivedBy: 'user-1'
      };

      const start = performance.now();
      const result = validateReceiveData(largeReceiveData);
      const end = performance.now();

      expect(result.isValid).toBe(true);
      expect(end - start).toBeLessThan(50); // Should complete within 50ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      expect(calculateStockLevels(null as any)).toEqual({
        total: 0,
        available: 0,
        sold: 0,
        reserved: 0,
        damaged: 0
      });

      expect(validateSerialNumber(null as any)).toBe(false);
      expect(validateSerialNumber(undefined as any)).toBe(false);
    });

    it('should handle empty strings and arrays', () => {
      expect(parseSerialNumber('').isValid).toBe(false);
      expect(calculateStockValue([])).toBe(0);
      
      const emptyReceiveData = {
        warehouseId: '',
        supplierId: '',
        invoiceNumber: '',
        items: [],
        receivedBy: ''
      };
      
      const result = validateReceiveData(emptyReceiveData);
      expect(result.isValid).toBe(false);
    });

    it('should handle malformed data gracefully', () => {
      const malformedSerialNumbers = [
        { status: 'available' }, // Missing other properties
        null,
        undefined,
        { unit_cost: 'invalid' } // Wrong type
      ] as any;

      expect(() => calculateStockLevels(malformedSerialNumbers)).not.toThrow();
    });
  });
});