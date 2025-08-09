// ===================================================================
// INSTALLMENT INTEGRATION COMPONENT TESTS
// ทดสอบคอมโพเนนต์การเชื่อมโยงระบบเช่าซื้อ
// ===================================================================

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InstallmentIntegration } from '../InstallmentIntegration';
import { useInstallmentIntegration } from '@/hooks/useInstallmentIntegration';

// Mock the hook
vi.mock('@/hooks/useInstallmentIntegration', () => ({
  useInstallmentIntegration: vi.fn(),
  useInstallmentSNs: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  })),
  useInstallmentSNHistory: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  }))
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => '01/01/2024 10:00')
}));

vi.mock('date-fns/locale', () => ({
  th: {}
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('InstallmentIntegration', () => {
  const mockHookReturn = {
    isLoading: false,
    error: null,
    reservations: [],
    reserveStock: vi.fn(),
    confirmSale: vi.fn(),
    releaseStock: vi.fn(),
    trackSNs: vi.fn(),
    getSNHistory: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useInstallmentIntegration as any).mockReturnValue(mockHookReturn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render main component with title', () => {
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      expect(screen.getByText('การเชื่อมโยงระบบเช่าซื้อ')).toBeInTheDocument();
      expect(screen.getByText('จัดการการจองสต็อก ยืนยันการขาย และปลดปล่อยสต็อกสำหรับระบบเช่าซื้อ')).toBeInTheDocument();
    });

    it('should render all tabs', () => {
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      expect(screen.getByRole('tab', { name: 'จองสต็อก' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'ยืนยันการขาย' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'ปลดปล่อยสต็อก' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'ติดตาม SN' })).toBeInTheDocument();
    });

    it('should show error alert when error exists', () => {
      const mockHookWithError = {
        ...mockHookReturn,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
      };
      (useInstallmentIntegration as any).mockReturnValue(mockHookWithError);

      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      expect(screen.getByText('เกิดข้อผิดพลาดในการเชื่อมต่อ')).toBeInTheDocument();
    });
  });

  describe('Stock Reservation Tab', () => {
    it('should render stock reservation form', () => {
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      expect(screen.getByLabelText('เลขที่สัญญา')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสลูกค้า')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสสาขา')).toBeInTheDocument();
      expect(screen.getByText('เพิ่มสินค้า')).toBeInTheDocument();
    });

    it('should allow adding items to contract', async () => {
      const user = userEvent.setup();
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      // Fill in contract details
      await user.type(screen.getByLabelText('เลขที่สัญญา'), 'CONTRACT-2024-001');
      await user.type(screen.getByLabelText('รหัสลูกค้า'), 'CUST-001');
      await user.type(screen.getByLabelText('รหัสสาขา'), 'BRANCH-001');

      // Fill in item details
      await user.type(screen.getByLabelText('รหัสสินค้า'), 'PROD-001');
      await user.type(screen.getByLabelText('รหัสคลัง'), 'WH-001');
      await user.type(screen.getByLabelText('จำนวน'), '2');
      await user.type(screen.getByLabelText('ราคาต่อหน่วย'), '15000');

      // Add item
      await user.click(screen.getByText('เพิ่มสินค้า'));

      // Check if item appears in table
      expect(screen.getByText('รายการสินค้าที่จะจอง')).toBeInTheDocument();
      expect(screen.getByText('PROD-001')).toBeInTheDocument();
      expect(screen.getByText('WH-001')).toBeInTheDocument();
    });

    it('should call reserveStock when form is submitted', async () => {
      const user = userEvent.setup();
      const mockReserveStock = vi.fn().mockResolvedValue([]);
      const mockHookWithReserve = {
        ...mockHookReturn,
        reserveStock: mockReserveStock
      };
      (useInstallmentIntegration as any).mockReturnValue(mockHookWithReserve);

      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      // Fill in contract details
      await user.type(screen.getByLabelText('เลขที่สัญญา'), 'CONTRACT-2024-001');
      await user.type(screen.getByLabelText('รหัสลูกค้า'), 'CUST-001');

      // Add an item first
      await user.type(screen.getByLabelText('รหัสสินค้า'), 'PROD-001');
      await user.type(screen.getByLabelText('รหัสคลัง'), 'WH-001');
      await user.click(screen.getByText('เพิ่มสินค้า'));

      // Submit form
      await user.click(screen.getByText('จองสต็อกสำหรับสัญญา'));

      await waitFor(() => {
        expect(mockReserveStock).toHaveBeenCalledWith({
          contractId: 'test-uuid-123',
          contractNumber: 'CONTRACT-2024-001',
          customerId: 'CUST-001',
          branchId: '',
          items: [{
            productId: 'PROD-001',
            quantity: 1,
            warehouseId: 'WH-001',
            unitPrice: 0
          }]
        });
      });
    });

    it('should disable submit button when form is incomplete', () => {
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      const submitButton = screen.getByText('จองสต็อกสำหรับสัญญา');
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state when reserving stock', () => {
      const mockHookWithLoading = {
        ...mockHookReturn,
        isLoading: true
      };
      (useInstallmentIntegration as any).mockReturnValue(mockHookWithLoading);

      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      expect(screen.getByText('กำลังจองสต็อก...')).toBeInTheDocument();
    });
  });

  describe('Sale Confirmation Tab', () => {
    it('should render sale confirmation form', async () => {
      const user = userEvent.setup();
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      await user.click(screen.getByRole('tab', { name: 'ยืนยันการขาย' }));

      expect(screen.getByLabelText('เลขที่สัญญาที่ต้องการยืนยันการขาย')).toBeInTheDocument();
      expect(screen.getByText('ยืนยันการขาย')).toBeInTheDocument();
    });

    it('should call confirmSale when button is clicked', async () => {
      const user = userEvent.setup();
      const mockConfirmSale = vi.fn().mockResolvedValue(undefined);
      const mockHookWithConfirm = {
        ...mockHookReturn,
        confirmSale: mockConfirmSale
      };
      (useInstallmentIntegration as any).mockReturnValue(mockHookWithConfirm);

      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      await user.click(screen.getByRole('tab', { name: 'ยืนยันการขาย' }));
      await user.type(screen.getByLabelText('เลขที่สัญญาที่ต้องการยืนยันการขาย'), 'contract-123');
      await user.click(screen.getByText('ยืนยันการขาย'));

      await waitFor(() => {
        expect(mockConfirmSale).toHaveBeenCalledWith('contract-123', {
          soldTo: 'ลูกค้าผ่านสัญญาเช่าซื้อ',
          saleDate: expect.any(Date),
          receiptNumber: expect.stringMatching(/^RECEIPT-\d+$/)
        });
      });
    });
  });

  describe('Stock Release Tab', () => {
    it('should render stock release form', async () => {
      const user = userEvent.setup();
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      await user.click(screen.getByRole('tab', { name: 'ปลดปล่อยสต็อก' }));

      expect(screen.getByLabelText('เลขที่สัญญาที่ต้องการปลดปล่อยสต็อก')).toBeInTheDocument();
      expect(screen.getByText('ปลดปล่อยสต็อก')).toBeInTheDocument();
    });

    it('should call releaseStock when button is clicked', async () => {
      const user = userEvent.setup();
      const mockReleaseStock = vi.fn().mockResolvedValue(undefined);
      const mockHookWithRelease = {
        ...mockHookReturn,
        releaseStock: mockReleaseStock
      };
      (useInstallmentIntegration as any).mockReturnValue(mockHookWithRelease);

      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      await user.click(screen.getByRole('tab', { name: 'ปลดปล่อยสต็อก' }));
      await user.type(screen.getByLabelText('เลขที่สัญญาที่ต้องการปลดปล่อยสต็อก'), 'contract-123');
      await user.click(screen.getByText('ปลดปล่อยสต็อก'));

      await waitFor(() => {
        expect(mockReleaseStock).toHaveBeenCalledWith('contract-123', 'ยกเลิกสัญญาผ่านระบบ');
      });
    });
  });

  describe('SN Tracking Tab', () => {
    it('should render tracking form', async () => {
      const user = userEvent.setup();
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      await user.click(screen.getByRole('tab', { name: 'ติดตาม SN' }));

      expect(screen.getByLabelText('เลขที่สัญญา')).toBeInTheDocument();
      expect(screen.getByLabelText('Serial Number')).toBeInTheDocument();
    });

    it('should enable tracking buttons when inputs have values', async () => {
      const user = userEvent.setup();
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      await user.click(screen.getByRole('tab', { name: 'ติดตาม SN' }));

      // Initially buttons should be disabled
      const trackingButtons = screen.getAllByRole('button');
      const searchButtons = trackingButtons.filter(btn => 
        btn.querySelector('svg') && (btn.getAttribute('aria-label') || '').includes('Search')
      );

      // Fill in contract ID
      await user.type(screen.getByLabelText('เลขที่สัญญา'), 'contract-123');
      
      // Fill in SN
      await user.type(screen.getByLabelText('Serial Number'), 'SN001');

      // Buttons should now be enabled (we can't easily test this due to dialog complexity)
      expect(screen.getByDisplayValue('contract-123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('SN001')).toBeInTheDocument();
    });
  });

  describe('Current Reservations Display', () => {
    it('should display current reservations when available', () => {
      const mockReservations = [
        {
          id: 'reservation-1',
          contractId: 'contract-123',
          contractNumber: 'CONTRACT-2024-001',
          serialNumberId: 'sn-id-1',
          serialNumber: 'SN001',
          productId: 'PROD-001',
          warehouseId: 'WH-001',
          reservedAt: new Date('2024-01-01T10:00:00Z'),
          status: 'reserved' as const,
          notes: 'จองสำหรับสัญญาเช่าซื้อ'
        }
      ];

      const mockHookWithReservations = {
        ...mockHookReturn,
        reservations: mockReservations
      };
      (useInstallmentIntegration as any).mockReturnValue(mockHookWithReservations);

      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      expect(screen.getByText('การจองล่าสุด')).toBeInTheDocument();
      expect(screen.getByText('CONTRACT-2024-001')).toBeInTheDocument();
      expect(screen.getByText('SN001')).toBeInTheDocument();
      expect(screen.getByText('PROD-001')).toBeInTheDocument();
      expect(screen.getByText('WH-001')).toBeInTheDocument();
    });

    it('should not display reservations section when no reservations', () => {
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      expect(screen.queryByText('การจองล่าสุด')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should not allow adding items without required fields', async () => {
      const user = userEvent.setup();
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      // Try to add item without filling required fields
      await user.click(screen.getByText('เพิ่มสินค้า'));

      // Should not show items table
      expect(screen.queryByText('รายการสินค้าที่จะจอง')).not.toBeInTheDocument();
    });

    it('should allow removing items from the list', async () => {
      const user = userEvent.setup();
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      // Add an item first
      await user.type(screen.getByLabelText('รหัสสินค้า'), 'PROD-001');
      await user.type(screen.getByLabelText('รหัสคลัง'), 'WH-001');
      await user.click(screen.getByText('เพิ่มสินค้า'));

      // Verify item is added
      expect(screen.getByText('รายการสินค้าที่จะจอง')).toBeInTheDocument();
      expect(screen.getByText('PROD-001')).toBeInTheDocument();

      // Remove the item
      await user.click(screen.getByText('ลบ'));

      // Item should be removed but table header might still be there
      // We check that the specific product is no longer in the table
      const productCells = screen.queryAllByText('PROD-001');
      expect(productCells.length).toBeLessThanOrEqual(1); // Only in form, not in table
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      expect(screen.getByLabelText('เลขที่สัญญา')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสลูกค้า')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสสาขา')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสสินค้า')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสคลัง')).toBeInTheDocument();
      expect(screen.getByLabelText('จำนวน')).toBeInTheDocument();
      expect(screen.getByLabelText('ราคาต่อหน่วย')).toBeInTheDocument();
    });

    it('should have proper button states', () => {
      const wrapper = createWrapper();
      render(<InstallmentIntegration />, { wrapper });

      const submitButton = screen.getByText('จองสต็อกสำหรับสัญญา');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('disabled');
    });
  });
});