// Comprehensive unit tests for all UI components
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockWarehouse, createMockProduct, createMockSerialNumber, createMockSupplier, mockToast } from '../utils/testHelpers';

// Import all components
import { ReceiveGoods } from '@/components/warehouses/ReceiveGoods';
import { StockInquiry } from '@/components/warehouses/StockInquiry';
import { WithdrawDispatch } from '@/components/warehouses/WithdrawDispatch';
import { Transfer } from '@/components/warehouses/Transfer';
import { StockCard } from '@/components/warehouses/StockCard';
import { SNList } from '@/components/warehouses/SNList';
import { MovementLog } from '@/components/warehouses/MovementLog';
import { PrintDialog } from '@/components/warehouses/PrintDialog';
import { PrintButton } from '@/components/warehouses/PrintButton';
import { PrintPreview } from '@/components/warehouses/PrintPreview';
import { BarcodeScanner } from '@/components/warehouses/BarcodeScanner';
import { BatchOperations } from '@/components/warehouses/BatchOperations';
import { StockAdjustment } from '@/components/warehouses/StockAdjustment';
import { RealTimeStockMonitor } from '@/components/warehouses/RealTimeStockMonitor';
import { StockAlertNotifications } from '@/components/warehouses/StockAlertNotifications';
import { POSIntegration } from '@/components/warehouses/POSIntegration';
import { InstallmentIntegration } from '@/components/warehouses/InstallmentIntegration';
import { AuditTrail } from '@/components/warehouses/AuditTrail';

// Mock all services
vi.mock('@/lib/serialNumberService');
vi.mock('@/lib/warehouseService');
vi.mock('@/lib/transferService');
vi.mock('@/lib/withdrawDispatchService');
vi.mock('@/lib/receiveGoodsService');
vi.mock('@/services/realTimeStockService');
vi.mock('@/services/printService');
vi.mock('@/services/posIntegrationService');
vi.mock('@/services/installmentIntegrationService');
vi.mock('@/services/batchOperationsService');
vi.mock('@/services/auditTrailService');
vi.mock('@/services/stockAdjustmentService');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => mockToast
}));

describe('Component Unit Tests', () => {
  const mockWarehouse = createMockWarehouse();
  const mockProduct = createMockProduct();
  const mockSupplier = createMockSupplier();
  const mockSerialNumbers = Array.from({ length: 3 }, (_, i) => 
    createMockSerialNumber({ 
      id: `sn-${i}`,
      serial_number: `TP001-2024-${String(i + 1).padStart(3, '0')}` 
    })
  );

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup common mocks
    const { WarehouseService } = require('@/lib/warehouseService');
    const { serialNumberService } = require('@/lib/serialNumberService');
    
    vi.mocked(WarehouseService.getWarehouses).mockResolvedValue([mockWarehouse]);
    vi.mocked(serialNumberService.searchSerialNumbers).mockResolvedValue({
      data: mockSerialNumbers,
      count: mockSerialNumbers.length,
      error: null
    });
  });

  describe('ReceiveGoods Component', () => {
    it('should render receive goods form', () => {
      renderWithProviders(
        <ReceiveGoods onReceiveComplete={vi.fn()} />
      );

      expect(screen.getByText(/receive goods/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/warehouse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/supplier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/invoice number/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      const mockOnReceiveComplete = vi.fn();
      
      renderWithProviders(
        <ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />
      );

      const submitButton = screen.getByText(/receive goods/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/warehouse is required/i)).toBeInTheDocument();
      });

      expect(mockOnReceiveComplete).not.toHaveBeenCalled();
    });

    it('should add and remove product items', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ReceiveGoods onReceiveComplete={vi.fn()} />
      );

      // Add product
      const addButton = screen.getByText(/add product/i);
      await user.click(addButton);

      expect(screen.getByLabelText(/product/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/unit cost/i)).toBeInTheDocument();

      // Remove product
      const removeButton = screen.getByText(/remove/i);
      await user.click(removeButton);

      expect(screen.queryByLabelText(/product/i)).not.toBeInTheDocument();
    });

    it('should calculate total cost correctly', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ReceiveGoods onReceiveComplete={vi.fn()} />
      );

      // Add product
      await user.click(screen.getByText(/add product/i));

      // Enter quantity and unit cost
      const quantityInput = screen.getByLabelText(/quantity/i);
      const unitCostInput = screen.getByLabelText(/unit cost/i);

      await user.clear(quantityInput);
      await user.type(quantityInput, '5');
      await user.clear(unitCostInput);
      await user.type(unitCostInput, '1000');

      // Should show total cost
      await waitFor(() => {
        expect(screen.getByText(/total: ฿5,000/i)).toBeInTheDocument();
      });
    });

    it('should handle form submission', async () => {
      const user = userEvent.setup();
      const { receiveGoodsService } = require('@/lib/receiveGoodsService');
      const mockOnReceiveComplete = vi.fn();
      
      vi.mocked(receiveGoodsService.receiveGoods).mockResolvedValue({
        id: 'receive-1',
        total_items: 2,
        total_cost: 2000
      });

      renderWithProviders(
        <ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />
      );

      // Fill form
      await user.click(screen.getByLabelText(/warehouse/i));
      await user.click(screen.getByText(mockWarehouse.name));

      await user.click(screen.getByLabelText(/supplier/i));
      await user.click(screen.getByText(mockSupplier.name));

      await user.type(screen.getByLabelText(/invoice number/i), 'INV-001');

      await user.click(screen.getByText(/add product/i));
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '2');
      await user.clear(screen.getByLabelText(/unit cost/i));
      await user.type(screen.getByLabelText(/unit cost/i), '1000');

      // Submit
      await user.click(screen.getByText(/receive goods/i));

      await waitFor(() => {
        expect(mockOnReceiveComplete).toHaveBeenCalled();
      });
    });
  });

  describe('StockInquiry Component', () => {
    it('should render search form', () => {
      renderWithProviders(
        <StockInquiry 
          searchFilters={{}} 
          onFilterChange={vi.fn()} 
        />
      );

      expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/warehouse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/search/i)).toBeInTheDocument();
    });

    it('should handle search input', async () => {
      const user = userEvent.setup();
      const mockOnFilterChange = vi.fn();
      
      renderWithProviders(
        <StockInquiry 
          searchFilters={{}} 
          onFilterChange={mockOnFilterChange} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search products/i);
      await user.type(searchInput, 'test product');

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: 'test product'
        })
      );
    });

    it('should display search results', async () => {
      renderWithProviders(
        <StockInquiry 
          searchFilters={{ searchTerm: 'test' }} 
          onFilterChange={vi.fn()} 
        />
      );

      await waitFor(() => {
        mockSerialNumbers.forEach(sn => {
          expect(screen.getByText(sn.serial_number)).toBeInTheDocument();
        });
      });
    });

    it('should handle filter changes', async () => {
      const user = userEvent.setup();
      const mockOnFilterChange = vi.fn();
      
      renderWithProviders(
        <StockInquiry 
          searchFilters={{}} 
          onFilterChange={mockOnFilterChange} 
        />
      );

      // Change warehouse filter
      await user.click(screen.getByLabelText(/warehouse/i));
      await user.click(screen.getByText(mockWarehouse.name));

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          warehouseId: mockWarehouse.id
        })
      );
    });

    it('should show stock summary', async () => {
      renderWithProviders(
        <StockInquiry 
          searchFilters={{ searchTerm: 'test' }} 
          onFilterChange={vi.fn()} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/total: 3/i)).toBeInTheDocument();
        expect(screen.getByText(/available: 3/i)).toBeInTheDocument();
      });
    });
  });

  describe('WithdrawDispatch Component', () => {
    it('should render withdraw mode correctly', () => {
      renderWithProviders(
        <WithdrawDispatch 
          mode="withdraw" 
          onTransactionComplete={vi.fn()} 
        />
      );

      expect(screen.getByText(/withdraw items/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reference number/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/customer name/i)).not.toBeInTheDocument();
    });

    it('should render dispatch mode correctly', () => {
      renderWithProviders(
        <WithdrawDispatch 
          mode="dispatch" 
          onTransactionComplete={vi.fn()} 
        />
      );

      expect(screen.getByText(/dispatch items/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/customer phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/delivery address/i)).toBeInTheDocument();
    });

    it('should render claim mode correctly', () => {
      renderWithProviders(
        <WithdrawDispatch 
          mode="claim" 
          onTransactionComplete={vi.fn()} 
        />
      );

      expect(screen.getByText(/process claim/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/claim reason/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
    });

    it('should handle item selection', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <WithdrawDispatch 
          mode="withdraw" 
          onTransactionComplete={vi.fn()} 
        />
      );

      // Wait for items to load
      await waitFor(() => {
        expect(screen.getAllByRole('checkbox')).toHaveLength(mockSerialNumbers.length);
      });

      // Select first item
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });

    it('should validate item selection', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <WithdrawDispatch 
          mode="withdraw" 
          onTransactionComplete={vi.fn()} 
        />
      );

      // Try to submit without selecting items
      const submitButton = screen.getByText(/withdraw items/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please select items/i)).toBeInTheDocument();
      });
    });
  });

  describe('Transfer Component', () => {
    it('should render transfer form', () => {
      renderWithProviders(
        <Transfer 
          sourceWarehouse={mockWarehouse}
          onTransferInitiate={vi.fn()}
          onTransferConfirm={vi.fn()}
        />
      );

      expect(screen.getByText(/transfer items/i)).toBeInTheDocument();
      expect(screen.getByText(mockWarehouse.name)).toBeInTheDocument();
      expect(screen.getByLabelText(/target warehouse/i)).toBeInTheDocument();
    });

    it('should handle target warehouse selection', async () => {
      const user = userEvent.setup();
      const targetWarehouse = createMockWarehouse({ 
        id: 'warehouse-2', 
        name: 'Target Warehouse' 
      });
      
      const { WarehouseService } = require('@/lib/warehouseService');
      vi.mocked(WarehouseService.getWarehouses).mockResolvedValue([mockWarehouse, targetWarehouse]);
      
      renderWithProviders(
        <Transfer 
          sourceWarehouse={mockWarehouse}
          onTransferInitiate={vi.fn()}
          onTransferConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByLabelText(/target warehouse/i));
      await user.click(screen.getByText(targetWarehouse.name));

      expect(screen.getByDisplayValue(targetWarehouse.name)).toBeInTheDocument();
    });

    it('should show pending transfers', async () => {
      const { transferService } = require('@/lib/transferService');
      const pendingTransfer = {
        id: 'transfer-1',
        transfer_number: 'TRF-001',
        source_warehouse_id: 'warehouse-2',
        target_warehouse_id: mockWarehouse.id,
        status: 'pending',
        total_items: 1,
        initiated_by: 'user-1'
      };

      vi.mocked(transferService.getPendingTransfers).mockResolvedValue([pendingTransfer]);
      
      renderWithProviders(
        <Transfer 
          sourceWarehouse={mockWarehouse}
          onTransferInitiate={vi.fn()}
          onTransferConfirm={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/pending transfers/i)).toBeInTheDocument();
        expect(screen.getByText(pendingTransfer.transfer_number)).toBeInTheDocument();
      });
    });
  });

  describe('StockCard Component', () => {
    const mockStockData = {
      productId: mockProduct.id,
      productName: mockProduct.name,
      productCode: mockProduct.code,
      warehouseId: mockWarehouse.id,
      warehouseName: mockWarehouse.name,
      totalQuantity: 10,
      availableQuantity: 8,
      reservedQuantity: 2,
      soldQuantity: 0
    };

    it('should display stock information', () => {
      renderWithProviders(
        <StockCard stockData={mockStockData} />
      );

      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.code)).toBeInTheDocument();
      expect(screen.getByText(/total: 10/i)).toBeInTheDocument();
      expect(screen.getByText(/available: 8/i)).toBeInTheDocument();
      expect(screen.getByText(/reserved: 2/i)).toBeInTheDocument();
    });

    it('should show low stock warning', () => {
      const lowStockData = { ...mockStockData, availableQuantity: 2 };
      
      renderWithProviders(
        <StockCard stockData={lowStockData} />
      );

      expect(screen.getByText(/low stock/i)).toBeInTheDocument();
    });

    it('should show out of stock warning', () => {
      const outOfStockData = { ...mockStockData, availableQuantity: 0 };
      
      renderWithProviders(
        <StockCard stockData={outOfStockData} />
      );

      expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    });
  });

  describe('SNList Component', () => {
    it('should display serial numbers', () => {
      renderWithProviders(
        <SNList 
          serialNumbers={mockSerialNumbers}
          onSelectionChange={vi.fn()}
        />
      );

      mockSerialNumbers.forEach(sn => {
        expect(screen.getByText(sn.serial_number)).toBeInTheDocument();
      });
    });

    it('should handle selection changes', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = vi.fn();
      
      renderWithProviders(
        <SNList 
          serialNumbers={mockSerialNumbers}
          onSelectionChange={mockOnSelectionChange}
          selectable
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([mockSerialNumbers[0].id]);
    });

    it('should show serial number details', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <SNList 
          serialNumbers={mockSerialNumbers}
          onSelectionChange={vi.fn()}
          showDetails
        />
      );

      // Click on first serial number
      await user.click(screen.getByText(mockSerialNumbers[0].serial_number));

      expect(screen.getByText(/unit cost/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });
  });

  describe('MovementLog Component', () => {
    const mockMovements = [
      {
        id: 'movement-1',
        movement_type: 'receive',
        quantity: 1,
        unit_cost: 1000,
        reference_number: 'RCV-001',
        performed_by: 'user-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'movement-2',
        movement_type: 'withdraw',
        quantity: 1,
        reference_number: 'WD-001',
        performed_by: 'user-2',
        created_at: new Date().toISOString()
      }
    ];

    it('should display movement history', () => {
      renderWithProviders(
        <MovementLog movements={mockMovements} />
      );

      expect(screen.getByText(/movement history/i)).toBeInTheDocument();
      expect(screen.getByText(/receive/i)).toBeInTheDocument();
      expect(screen.getByText(/withdraw/i)).toBeInTheDocument();
      expect(screen.getByText(/RCV-001/i)).toBeInTheDocument();
      expect(screen.getByText(/WD-001/i)).toBeInTheDocument();
    });

    it('should show empty state when no movements', () => {
      renderWithProviders(
        <MovementLog movements={[]} />
      );

      expect(screen.getByText(/no movements found/i)).toBeInTheDocument();
    });

    it('should filter movements by type', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <MovementLog movements={mockMovements} />
      );

      // Filter by receive
      const filterSelect = screen.getByLabelText(/filter by type/i);
      await user.click(filterSelect);
      await user.click(screen.getByText(/receive/i));

      expect(screen.getByText(/RCV-001/i)).toBeInTheDocument();
      expect(screen.queryByText(/WD-001/i)).not.toBeInTheDocument();
    });
  });

  describe('Print Components', () => {
    describe('PrintButton Component', () => {
      it('should render print button', () => {
        renderWithProviders(
          <PrintButton 
            documentType="receive"
            documentData={{}}
            onPrintComplete={vi.fn()}
          />
        );

        expect(screen.getByText(/print/i)).toBeInTheDocument();
      });

      it('should handle print action', async () => {
        const user = userEvent.setup();
        const { printService } = require('@/services/printService');
        const mockOnPrintComplete = vi.fn();
        
        vi.mocked(printService.printReceiveDocument).mockResolvedValue({
          success: true,
          documentUrl: 'test-url',
          printJobId: 'job-1'
        });

        renderWithProviders(
          <PrintButton 
            documentType="receive"
            documentData={{ id: 'receive-1' }}
            onPrintComplete={mockOnPrintComplete}
          />
        );

        await user.click(screen.getByText(/print/i));

        await waitFor(() => {
          expect(mockOnPrintComplete).toHaveBeenCalledWith({
            success: true,
            documentUrl: 'test-url',
            printJobId: 'job-1'
          });
        });
      });
    });

    describe('PrintDialog Component', () => {
      it('should render print dialog', () => {
        renderWithProviders(
          <PrintDialog 
            open={true}
            onOpenChange={vi.fn()}
            documentType="receive"
            documentData={{}}
          />
        );

        expect(screen.getByText(/print document/i)).toBeInTheDocument();
        expect(screen.getByText(/preview/i)).toBeInTheDocument();
        expect(screen.getByText(/print/i)).toBeInTheDocument();
      });

      it('should handle dialog close', async () => {
        const user = userEvent.setup();
        const mockOnOpenChange = vi.fn();
        
        renderWithProviders(
          <PrintDialog 
            open={true}
            onOpenChange={mockOnOpenChange}
            documentType="receive"
            documentData={{}}
          />
        );

        await user.click(screen.getByText(/cancel/i));

        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    describe('PrintPreview Component', () => {
      it('should render document preview', () => {
        const documentData = {
          receive_number: 'RCV-001',
          supplier_name: 'Test Supplier',
          total_items: 2,
          total_cost: 2000
        };

        renderWithProviders(
          <PrintPreview 
            documentType="receive"
            documentData={documentData}
          />
        );

        expect(screen.getByText(/RCV-001/i)).toBeInTheDocument();
        expect(screen.getByText(/Test Supplier/i)).toBeInTheDocument();
        expect(screen.getByText(/2,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('BarcodeScanner Component', () => {
    it('should render scanner interface', () => {
      renderWithProviders(
        <BarcodeScanner 
          onScan={vi.fn()}
          isActive={true}
        />
      );

      expect(screen.getByText(/barcode scanner/i)).toBeInTheDocument();
      expect(screen.getByText(/scan barcode/i)).toBeInTheDocument();
    });

    it('should handle manual input', async () => {
      const user = userEvent.setup();
      const mockOnScan = vi.fn();
      
      renderWithProviders(
        <BarcodeScanner 
          onScan={mockOnScan}
          isActive={true}
        />
      );

      const input = screen.getByPlaceholderText(/enter barcode/i);
      await user.type(input, 'TP001-2024-001');
      await user.press('Enter');

      expect(mockOnScan).toHaveBeenCalledWith('TP001-2024-001');
    });

    it('should show scanner status', () => {
      renderWithProviders(
        <BarcodeScanner 
          onScan={vi.fn()}
          isActive={false}
        />
      );

      expect(screen.getByText(/scanner inactive/i)).toBeInTheDocument();
    });
  });

  describe('Advanced Components', () => {
    describe('BatchOperations Component', () => {
      it('should render batch operations interface', () => {
        renderWithProviders(
          <BatchOperations 
            selectedItems={mockSerialNumbers}
            onOperationComplete={vi.fn()}
          />
        );

        expect(screen.getByText(/batch operations/i)).toBeInTheDocument();
        expect(screen.getByText(/selected items: 3/i)).toBeInTheDocument();
      });

      it('should handle batch status update', async () => {
        const user = userEvent.setup();
        const { batchOperationsService } = require('@/services/batchOperationsService');
        const mockOnOperationComplete = vi.fn();
        
        vi.mocked(batchOperationsService.batchUpdateSerialNumbers).mockResolvedValue({
          success: true,
          updatedCount: 3
        });

        renderWithProviders(
          <BatchOperations 
            selectedItems={mockSerialNumbers}
            onOperationComplete={mockOnOperationComplete}
          />
        );

        await user.click(screen.getByText(/update status/i));
        await user.click(screen.getByText(/sold/i));
        await user.click(screen.getByText(/apply/i));

        await waitFor(() => {
          expect(mockOnOperationComplete).toHaveBeenCalled();
        });
      });
    });

    describe('StockAdjustment Component', () => {
      it('should render adjustment form', () => {
        renderWithProviders(
          <StockAdjustment 
            warehouseId={mockWarehouse.id}
            onAdjustmentComplete={vi.fn()}
          />
        );

        expect(screen.getByText(/stock adjustment/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/adjustment type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
      });

      it('should handle adjustment creation', async () => {
        const user = userEvent.setup();
        const { stockAdjustmentService } = require('@/services/stockAdjustmentService');
        const mockOnAdjustmentComplete = vi.fn();
        
        vi.mocked(stockAdjustmentService.createAdjustment).mockResolvedValue({
          id: 'adjustment-1',
          status: 'pending'
        });

        renderWithProviders(
          <StockAdjustment 
            warehouseId={mockWarehouse.id}
            onAdjustmentComplete={mockOnAdjustmentComplete}
          />
        );

        await user.click(screen.getByLabelText(/adjustment type/i));
        await user.click(screen.getByText(/count/i));
        await user.type(screen.getByLabelText(/reason/i), 'Monthly count');
        await user.click(screen.getByText(/create adjustment/i));

        await waitFor(() => {
          expect(mockOnAdjustmentComplete).toHaveBeenCalled();
        });
      });
    });

    describe('RealTimeStockMonitor Component', () => {
      it('should render stock monitor', () => {
        renderWithProviders(
          <RealTimeStockMonitor 
            warehouseId={mockWarehouse.id}
          />
        );

        expect(screen.getByText(/real-time stock monitor/i)).toBeInTheDocument();
        expect(screen.getByText(/connection status/i)).toBeInTheDocument();
      });

      it('should show connection status', () => {
        const { realTimeStockService } = require('@/services/realTimeStockService');
        
        vi.mocked(realTimeStockService.getConnectionStatus).mockReturnValue({
          'warehouse-monitor': 'connected'
        });

        renderWithProviders(
          <RealTimeStockMonitor 
            warehouseId={mockWarehouse.id}
          />
        );

        expect(screen.getByText(/connected/i)).toBeInTheDocument();
      });
    });

    describe('StockAlertNotifications Component', () => {
      it('should render alert notifications', () => {
        const mockAlerts = [
          {
            id: 'alert-1',
            type: 'low_stock',
            severity: 'warning',
            productName: mockProduct.name,
            currentStock: 2,
            threshold: 5,
            message: 'Low stock alert'
          }
        ];

        renderWithProviders(
          <StockAlertNotifications alerts={mockAlerts} />
        );

        expect(screen.getByText(/stock alerts/i)).toBeInTheDocument();
        expect(screen.getByText(/low stock alert/i)).toBeInTheDocument();
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      });

      it('should handle alert dismissal', async () => {
        const user = userEvent.setup();
        const mockOnDismiss = vi.fn();
        const mockAlerts = [
          {
            id: 'alert-1',
            type: 'low_stock',
            severity: 'warning',
            productName: mockProduct.name,
            currentStock: 2,
            threshold: 5,
            message: 'Low stock alert'
          }
        ];

        renderWithProviders(
          <StockAlertNotifications 
            alerts={mockAlerts}
            onDismiss={mockOnDismiss}
          />
        );

        await user.click(screen.getByText(/dismiss/i));

        expect(mockOnDismiss).toHaveBeenCalledWith('alert-1');
      });
    });
  });

  describe('Integration Components', () => {
    describe('POSIntegration Component', () => {
      it('should render POS integration status', () => {
        renderWithProviders(
          <POSIntegration />
        );

        expect(screen.getByText(/pos integration/i)).toBeInTheDocument();
        expect(screen.getByText(/connection status/i)).toBeInTheDocument();
      });

      it('should show sync status', () => {
        const { posIntegrationService } = require('@/services/posIntegrationService');
        
        vi.mocked(posIntegrationService.getConnectionStatus).mockReturnValue({
          connected: true,
          lastSync: new Date().toISOString()
        });

        renderWithProviders(
          <POSIntegration />
        );

        expect(screen.getByText(/connected/i)).toBeInTheDocument();
        expect(screen.getByText(/last sync/i)).toBeInTheDocument();
      });
    });

    describe('InstallmentIntegration Component', () => {
      it('should render installment integration status', () => {
        renderWithProviders(
          <InstallmentIntegration />
        );

        expect(screen.getByText(/installment integration/i)).toBeInTheDocument();
        expect(screen.getByText(/reserved stock/i)).toBeInTheDocument();
      });

      it('should show reserved items count', () => {
        const { installmentIntegrationService } = require('@/services/installmentIntegrationService');
        
        vi.mocked(installmentIntegrationService.getReservedStock).mockResolvedValue({
          totalReserved: 5,
          items: []
        });

        renderWithProviders(
          <InstallmentIntegration />
        );

        expect(screen.getByText(/5 items reserved/i)).toBeInTheDocument();
      });
    });

    describe('AuditTrail Component', () => {
      it('should render audit trail', () => {
        const mockAuditLogs = [
          {
            id: 'audit-1',
            type: 'receive',
            entity_type: 'serial_number',
            entity_id: 'sn-1',
            changes: { status: 'available' },
            performed_by: 'user-1',
            created_at: new Date().toISOString()
          }
        ];

        renderWithProviders(
          <AuditTrail 
            entityType="serial_number"
            entityId="sn-1"
            auditLogs={mockAuditLogs}
          />
        );

        expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
        expect(screen.getByText(/receive/i)).toBeInTheDocument();
        expect(screen.getByText(/user-1/i)).toBeInTheDocument();
      });

      it('should filter audit logs by type', async () => {
        const user = userEvent.setup();
        const mockAuditLogs = [
          {
            id: 'audit-1',
            type: 'receive',
            entity_type: 'serial_number',
            entity_id: 'sn-1',
            changes: { status: 'available' },
            performed_by: 'user-1',
            created_at: new Date().toISOString()
          },
          {
            id: 'audit-2',
            type: 'withdraw',
            entity_type: 'serial_number',
            entity_id: 'sn-1',
            changes: { status: 'sold' },
            performed_by: 'user-2',
            created_at: new Date().toISOString()
          }
        ];

        renderWithProviders(
          <AuditTrail 
            entityType="serial_number"
            entityId="sn-1"
            auditLogs={mockAuditLogs}
          />
        );

        // Filter by receive
        const filterSelect = screen.getByLabelText(/filter by type/i);
        await user.click(filterSelect);
        await user.click(screen.getByText(/receive/i));

        expect(screen.getByText(/user-1/i)).toBeInTheDocument();
        expect(screen.queryByText(/user-2/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error messages', async () => {
      const { receiveGoodsService } = require('@/lib/receiveGoodsService');
      
      vi.mocked(receiveGoodsService.receiveGoods).mockRejectedValue(
        new Error('Network error')
      );

      const user = userEvent.setup();
      
      renderWithProviders(
        <ReceiveGoods onReceiveComplete={vi.fn()} />
      );

      // Fill minimal form and submit
      await user.click(screen.getByLabelText(/warehouse/i));
      await user.click(screen.getByText(mockWarehouse.name));
      await user.click(screen.getByText(/receive goods/i));

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('error'),
            variant: 'destructive'
          })
        );
      });
    });

    it('should handle loading states', () => {
      const { WarehouseService } = require('@/lib/warehouseService');
      
      // Mock loading state
      vi.mocked(WarehouseService.getWarehouses).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(
        <ReceiveGoods onReceiveComplete={vi.fn()} />
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(
        <ReceiveGoods onReceiveComplete={vi.fn()} />
      );

      expect(screen.getByLabelText(/warehouse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/supplier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/invoice number/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <StockInquiry 
          searchFilters={{}} 
          onFilterChange={vi.fn()} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search products/i);
      
      // Should be focusable
      await user.tab();
      expect(searchInput).toHaveFocus();
    });

    it('should have proper heading structure', () => {
      renderWithProviders(
        <ReceiveGoods onReceiveComplete={vi.fn()} />
      );

      const heading = screen.getByRole('heading', { name: /receive goods/i });
      expect(heading).toBeInTheDocument();
    });
  });
});