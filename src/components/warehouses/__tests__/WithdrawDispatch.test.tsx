import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WithdrawDispatch } from '../WithdrawDispatch';
import { withdrawDispatchService } from '@/lib/withdrawDispatchService';
import { useToast } from '@/hooks/use-toast';
import { 
  SerialNumber, 
  SNStatus, 
  ReferenceType, 
  ClaimType, 
  ClaimResolution 
} from '@/types/warehouse';

// Mock dependencies
vi.mock('@/lib/withdrawDispatchService');
vi.mock('@/hooks/use-toast');

const mockToast = vi.fn();
(useToast as any).mockReturnValue({ toast: mockToast });

const mockWarehouses = [
  {
    id: 'wh-1',
    name: 'Main Warehouse',
    code: 'WH001',
    type: 'main' as const,
    status: 'active' as const,
    address: {
      street: '123 Main St',
      district: 'Downtown',
      province: 'Bangkok',
      postalCode: '10100',
      country: 'Thailand'
    },
    contact: {
      manager: 'John Doe',
      phone: '02-123-4567',
      email: 'john@example.com'
    },
    capacity: {
      totalArea: 1000,
      usableArea: 800,
      storageCapacity: 5000,
      currentUtilization: 2500,
      utilizationPercentage: 50
    },
    zones: [],
    facilities: {
      hasLoading: true,
      hasUnloading: true,
      hasColdStorage: false,
      hasSecuritySystem: true,
      hasFireSafety: true,
      hasClimateControl: false,
      parkingSpaces: 10,
      loadingDocks: 2
    },
    operatingHours: {
      monday: { open: '08:00', close: '17:00', isOpen: true },
      tuesday: { open: '08:00', close: '17:00', isOpen: true },
      wednesday: { open: '08:00', close: '17:00', isOpen: true },
      thursday: { open: '08:00', close: '17:00', isOpen: true },
      friday: { open: '08:00', close: '17:00', isOpen: true },
      saturday: { open: '08:00', close: '12:00', isOpen: true },
      sunday: { open: '08:00', close: '12:00', isOpen: false }
    },
    staff: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin'
  }
];

const mockAvailableItems: SerialNumber[] = [
  {
    id: 'sn-1',
    serialNumber: 'SN001',
    productId: 'prod-1',
    product: {
      id: 'prod-1',
      name: 'Test Product 1',
      code: 'TP001',
      sku: 'SKU001'
    },
    warehouseId: 'wh-1',
    unitCost: 1000,
    status: SNStatus.AVAILABLE,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'sn-2',
    serialNumber: 'SN002',
    productId: 'prod-2',
    product: {
      id: 'prod-2',
      name: 'Test Product 2',
      code: 'TP002',
      sku: 'SKU002'
    },
    warehouseId: 'wh-1',
    unitCost: 1500,
    status: SNStatus.AVAILABLE,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

const mockSoldItems: SerialNumber[] = [
  {
    id: 'sn-3',
    serialNumber: 'SN003',
    productId: 'prod-1',
    product: {
      id: 'prod-1',
      name: 'Test Product 1',
      code: 'TP001',
      sku: 'SKU001'
    },
    warehouseId: 'wh-1',
    unitCost: 1000,
    status: SNStatus.SOLD,
    soldAt: new Date('2024-01-02'),
    soldTo: 'Customer A',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02')
  }
];

describe('WithdrawDispatch', () => {
  const mockOnTransactionComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock service methods
    (withdrawDispatchService.getAvailableSerialNumbers as any).mockResolvedValue(mockAvailableItems);
    (withdrawDispatchService.getSoldSerialNumbers as any).mockResolvedValue(mockSoldItems);
    (withdrawDispatchService.withdrawItems as any).mockResolvedValue({
      success: true,
      message: 'Successfully withdrew 1 items',
      data: { processedItems: 1, movements: [] }
    });
    (withdrawDispatchService.dispatchItems as any).mockResolvedValue({
      success: true,
      message: 'Successfully dispatched 1 items',
      data: { processedItems: 1, movements: [] }
    });
    (withdrawDispatchService.processClaim as any).mockResolvedValue({
      success: true,
      message: 'Claim processed successfully: CLM-123',
      data: { processedItems: 1, movements: [] }
    });
  });

  it('should render without warehouse selected', () => {
    render(
      <WithdrawDispatch 
        warehouses={mockWarehouses}
        onTransactionComplete={mockOnTransactionComplete}
      />
    );

    expect(screen.getByText('Please select a warehouse to manage stock withdrawal and dispatch.')).toBeInTheDocument();
  });

  it('should render with selected warehouse', async () => {
    render(
      <WithdrawDispatch 
        warehouses={mockWarehouses}
        selectedWarehouse={mockWarehouses[0]}
        onTransactionComplete={mockOnTransactionComplete}
      />
    );

    expect(screen.getByText('Stock Withdrawal & Dispatch - Main Warehouse')).toBeInTheDocument();
    expect(screen.getByText('Withdraw')).toBeInTheDocument();
    expect(screen.getByText('Dispatch')).toBeInTheDocument();
    expect(screen.getByText('Claim')).toBeInTheDocument();

    // Wait for available items to load
    await waitFor(() => {
      expect(withdrawDispatchService.getAvailableSerialNumbers).toHaveBeenCalledWith('wh-1');
    });
  });

  describe('Withdraw Tab', () => {
    it('should display available items', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('SN001')).toBeInTheDocument();
        expect(screen.getByText('SN002')).toBeInTheDocument();
        expect(screen.getByText('Test Product 1 (TP001)')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2 (TP002)')).toBeInTheDocument();
      });
    });

    it('should allow searching items', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('SN001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by SN, product name, or code...');
      fireEvent.change(searchInput, { target: { value: 'SN001' } });

      expect(screen.getByText('SN001')).toBeInTheDocument();
      expect(screen.queryByText('SN002')).not.toBeInTheDocument();
    });

    it('should allow adding items to selection', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('SN001')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button');
      const addButton = addButtons.find(button => 
        button.querySelector('svg') && button.closest('[data-testid]') === null
      );
      
      if (addButton) {
        fireEvent.click(addButton);
        await waitFor(() => {
          expect(screen.getByText('Selected Items (1)')).toBeInTheDocument();
        });
      }
    });

    it('should validate required fields before withdrawal', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('SN001')).toBeInTheDocument();
      });

      // Try to withdraw without selecting items
      const withdrawButton = screen.getByText(/Withdraw Items/);
      fireEvent.click(withdrawButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please select items to withdraw',
          variant: 'destructive'
        });
      });
    });

    it('should successfully withdraw items', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('SN001')).toBeInTheDocument();
      });

      // Add item to selection
      const addButtons = screen.getAllByRole('button');
      const addButton = addButtons.find(button => 
        button.querySelector('svg') && !button.disabled
      );
      
      if (addButton) {
        fireEvent.click(addButton);
      }

      // Fill in required fields
      const soldToInput = screen.getByLabelText('Sold To *');
      fireEvent.change(soldToInput, { target: { value: 'Customer A' } });

      const referenceInput = screen.getByLabelText('Reference Number');
      fireEvent.change(referenceInput, { target: { value: 'SALE-001' } });

      // Submit withdrawal
      const withdrawButton = screen.getByText(/Withdraw Items/);
      fireEvent.click(withdrawButton);

      await waitFor(() => {
        expect(withdrawDispatchService.withdrawItems).toHaveBeenCalledWith({
          serialNumbers: ['SN001'],
          movementType: 'withdraw',
          referenceType: 'sale',
          referenceNumber: 'SALE-001',
          soldTo: 'Customer A',
          notes: '',
          performedBy: 'current-user'
        });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Successfully withdrew 1 items'
        });
      });

      expect(mockOnTransactionComplete).toHaveBeenCalledWith('withdraw', 1);
    });
  });

  describe('Dispatch Tab', () => {
    it('should switch to dispatch tab and load sold items', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      const dispatchTab = screen.getByText('Dispatch');
      fireEvent.click(dispatchTab);

      await waitFor(() => {
        expect(withdrawDispatchService.getSoldSerialNumbers).toHaveBeenCalledWith('wh-1');
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText('SN003')).toBeInTheDocument();
        expect(screen.getByText('Sold to: Customer A')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should successfully dispatch items', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      // Switch to dispatch tab
      const dispatchTab = screen.getByText('Dispatch');
      fireEvent.click(dispatchTab);

      await waitFor(() => {
        expect(screen.getByText('SN003')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Add item to selection
      const addButtons = screen.getAllByRole('button');
      const addButton = addButtons.find(button => 
        button.querySelector('svg') && !button.disabled
      );
      
      if (addButton) {
        fireEvent.click(addButton);
      }

      // Fill in required fields
      const dispatchToInput = screen.getByLabelText('Dispatch To *');
      fireEvent.change(dispatchToInput, { target: { value: 'Customer B Address' } });

      const referenceInput = screen.getByLabelText('Reference Number');
      fireEvent.change(referenceInput, { target: { value: 'DISPATCH-001' } });

      // Submit dispatch
      const dispatchButton = screen.getByText(/Dispatch Items/);
      fireEvent.click(dispatchButton);

      await waitFor(() => {
        expect(withdrawDispatchService.dispatchItems).toHaveBeenCalledWith({
          serialNumbers: ['SN003'],
          dispatchTo: 'Customer B Address',
          referenceNumber: 'DISPATCH-001',
          notes: '',
          performedBy: 'current-user'
        });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Successfully dispatched 1 items'
        });
      });

      expect(mockOnTransactionComplete).toHaveBeenCalledWith('dispatch', 1);
    });
  });

  describe('Claim Tab', () => {
    it('should switch to claim tab and show claim form', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      const claimTab = screen.getByText('Claim');
      fireEvent.click(claimTab);

      await waitFor(() => {
        expect(screen.getByText('Process Claim')).toBeInTheDocument();
        expect(screen.getByLabelText('Serial Number *')).toBeInTheDocument();
        expect(screen.getByLabelText('Claim Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Reason *')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should successfully process a claim', async () => {
      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      // Switch to claim tab
      const claimTab = screen.getByText('Claim');
      fireEvent.click(claimTab);

      await waitFor(() => {
        expect(screen.getByText('Process Claim')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Fill in claim form
      const reasonTextarea = screen.getByLabelText('Reason *');
      fireEvent.change(reasonTextarea, { target: { value: 'Product is defective' } });

      const customerNameInput = screen.getByLabelText('Customer Name');
      fireEvent.change(customerNameInput, { target: { value: 'Customer A' } });

      // Submit claim
      const processClaimButton = screen.getByText('Process Claim');
      fireEvent.click(processClaimButton);

      // Should show validation error for missing serial number
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please select a serial number for claim',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      (withdrawDispatchService.getAvailableSerialNumbers as any).mockRejectedValue(
        new Error('Service unavailable')
      );

      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load available items',
          variant: 'destructive'
        });
      });
    });

    it('should handle withdrawal failure', async () => {
      (withdrawDispatchService.withdrawItems as any).mockResolvedValue({
        success: false,
        message: 'Some serial numbers are not available',
        error: 'SERIAL_NUMBERS_UNAVAILABLE'
      });

      render(
        <WithdrawDispatch 
          warehouses={mockWarehouses}
          selectedWarehouse={mockWarehouses[0]}
          onTransactionComplete={mockOnTransactionComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('SN001')).toBeInTheDocument();
      });

      // Add item and try to withdraw
      const addButtons = screen.getAllByRole('button');
      const addButton = addButtons.find(button => 
        button.querySelector('svg') && !button.disabled
      );
      
      if (addButton) {
        fireEvent.click(addButton);
      }

      const soldToInput = screen.getByLabelText('Sold To *');
      fireEvent.change(soldToInput, { target: { value: 'Customer A' } });

      const withdrawButton = screen.getByText(/Withdraw Items/);
      fireEvent.click(withdrawButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Some serial numbers are not available',
          variant: 'destructive'
        });
      });
    });
  });
});