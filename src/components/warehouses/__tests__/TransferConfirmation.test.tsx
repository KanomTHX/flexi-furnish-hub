import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferConfirmation } from '../TransferConfirmation';
import { transferService } from '@/lib/transferService';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/lib/transferService');
vi.mock('@/hooks/use-toast');

const mockTransferService = transferService as any;
const mockUseToast = useToast as any;

describe('TransferConfirmation Component', () => {
  const mockPendingTransfers = [
    {
      id: 'transfer1',
      transferNumber: 'TF202501010001',
      sourceWarehouseId: 'wh1',
      targetWarehouseId: 'wh2',
      status: 'pending' as const,
      totalItems: 2,
      initiatedBy: 'user1',
      initiatedByName: 'John Doe',
      createdAt: '2024-01-01T10:00:00Z',
      sourceWarehouse: {
        id: 'wh1',
        name: 'คลังหลัก',
        code: 'WH001'
      },
      targetWarehouse: {
        id: 'wh2',
        name: 'คลังสาขา 1',
        code: 'WH002'
      },
      items: []
    },
    {
      id: 'transfer2',
      transferNumber: 'TF202501010002',
      sourceWarehouseId: 'wh3',
      targetWarehouseId: 'wh2',
      status: 'pending' as const,
      totalItems: 1,
      initiatedBy: 'user2',
      initiatedByName: 'Jane Smith',
      createdAt: '2024-01-01T11:00:00Z',
      sourceWarehouse: {
        id: 'wh3',
        name: 'คลังสาขา 2',
        code: 'WH003'
      },
      targetWarehouse: {
        id: 'wh2',
        name: 'คลังสาขา 1',
        code: 'WH002'
      },
      items: []
    }
  ];

  const mockTransferDetails = {
    id: 'transfer1',
    transferNumber: 'TF202501010001',
    sourceWarehouseId: 'wh1',
    targetWarehouseId: 'wh2',
    status: 'pending' as const,
    totalItems: 2,
    notes: 'Test transfer',
    initiatedBy: 'user1',
    initiatedByName: 'John Doe',
    createdAt: '2024-01-01T10:00:00Z',
    sourceWarehouse: {
      id: 'wh1',
      name: 'คลังหลัก',
      code: 'WH001'
    },
    targetWarehouse: {
      id: 'wh2',
      name: 'คลังสาขา 1',
      code: 'WH002'
    },
    items: [
      {
        id: 'item1',
        serialNumberId: 'sn1',
        productId: 'prod1',
        quantity: 1,
        unitCost: 1000,
        status: 'pending' as const,
        serialNumber: {
          id: 'sn1',
          serialNumber: 'SN001',
          product: {
            id: 'prod1',
            name: 'โซฟา 3 ที่นั่ง',
            code: 'SF001'
          }
        }
      },
      {
        id: 'item2',
        serialNumberId: 'sn2',
        productId: 'prod2',
        quantity: 1,
        unitCost: 2000,
        status: 'pending' as const,
        serialNumber: {
          id: 'sn2',
          serialNumber: 'SN002',
          product: {
            id: 'prod2',
            name: 'โต๊ะทำงาน',
            code: 'TB001'
          }
        }
      }
    ]
  };

  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockTransferService.getTransfers.mockResolvedValue(mockPendingTransfers);
    mockTransferService.getTransferById.mockResolvedValue(mockTransferDetails);
  });

  it('should render pending transfers correctly', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      expect(screen.getByText('การโอนที่รอยืนยัน')).toBeInTheDocument();
      expect(screen.getByText('TF202501010001')).toBeInTheDocument();
      expect(screen.getByText('TF202501010002')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Badge count
    });
  });

  it('should load pending transfers on mount', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      expect(mockTransferService.getTransfers).toHaveBeenCalledWith({
        targetWarehouseId: 'wh2',
        status: 'pending'
      });
    });
  });

  it('should show empty state when no pending transfers', async () => {
    mockTransferService.getTransfers.mockResolvedValue([]);

    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      expect(screen.getByText('ไม่มีการโอนที่รอยืนยัน')).toBeInTheDocument();
    });
  });

  it('should open transfer details dialog', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const viewButton = screen.getAllByRole('button', { name: '' })[0]; // Eye icon button
      fireEvent.click(viewButton);
    });

    await waitFor(() => {
      expect(screen.getByText('รายละเอียดการโอน TF202501010001')).toBeInTheDocument();
      expect(mockTransferService.getTransferById).toHaveBeenCalledWith('transfer1');
    });
  });

  it('should display transfer details in dialog', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const viewButton = screen.getAllByRole('button', { name: '' })[0];
      fireEvent.click(viewButton);
    });

    await waitFor(() => {
      expect(screen.getByText('TF202501010001')).toBeInTheDocument();
      expect(screen.getByText('2 รายการ')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test transfer')).toBeInTheDocument();
    });
  });

  it('should display transfer items in details dialog', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const viewButton = screen.getAllByRole('button', { name: '' })[0];
      fireEvent.click(viewButton);
    });

    await waitFor(() => {
      // Switch to items tab
      const itemsTab = screen.getByText('รายการสินค้า');
      fireEvent.click(itemsTab);
    });

    await waitFor(() => {
      expect(screen.getByText('SN001')).toBeInTheDocument();
      expect(screen.getByText('SN002')).toBeInTheDocument();
      expect(screen.getByText('โซฟา 3 ที่นั่ง')).toBeInTheDocument();
      expect(screen.getByText('โต๊ะทำงาน')).toBeInTheDocument();
    });
  });

  it('should open confirmation dialog', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const confirmButton = screen.getAllByText('รับสินค้า')[0];
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('ยืนยันการรับสินค้า')).toBeInTheDocument();
      expect(screen.getByText('คุณต้องการยืนยันการรับสินค้าโอน TF202501010001 จำนวน 2 รายการ ใช่หรือไม่?')).toBeInTheDocument();
    });
  });

  it('should confirm transfer successfully', async () => {
    const mockConfirmedTransfer = {
      ...mockTransferDetails,
      status: 'completed' as const,
      confirmedBy: 'current-user',
      confirmedAt: new Date().toISOString()
    };

    mockTransferService.confirmTransfer.mockResolvedValue(mockConfirmedTransfer);
    const onTransferConfirmed = vi.fn();

    render(
      <TransferConfirmation 
        warehouseId="wh2" 
        onTransferConfirmed={onTransferConfirmed}
      />
    );

    await waitFor(() => {
      const confirmButton = screen.getAllByText('รับสินค้า')[0];
      fireEvent.click(confirmButton);
    });

    // Add confirmation notes
    await waitFor(() => {
      const notesTextarea = screen.getByPlaceholderText('ระบุหมายเหตุเพิ่มเติม...');
      fireEvent.change(notesTextarea, { target: { value: 'Confirmed receipt' } });
    });

    // Confirm the transfer
    const confirmReceiptButton = screen.getByText('ยืนยันการรับสินค้า');
    fireEvent.click(confirmReceiptButton);

    await waitFor(() => {
      expect(mockTransferService.confirmTransfer).toHaveBeenCalledWith({
        transferId: 'transfer1',
        confirmedBy: 'current-user',
        notes: 'Confirmed receipt'
      });
      expect(onTransferConfirmed).toHaveBeenCalledWith(mockConfirmedTransfer);
      expect(mockToast).toHaveBeenCalledWith({
        title: "ยืนยันการรับสินค้าสำเร็จ",
        description: "ยืนยันการรับสินค้า TF202501010001 เรียบร้อยแล้ว"
      });
    });
  });

  it('should show error when confirmation fails', async () => {
    mockTransferService.confirmTransfer.mockRejectedValue(new Error('Confirmation failed'));

    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const confirmButton = screen.getAllByText('รับสินค้า')[0];
      fireEvent.click(confirmButton);
    });

    const confirmReceiptButton = screen.getByText('ยืนยันการรับสินค้า');
    fireEvent.click(confirmReceiptButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "เกิดข้อผิดพลาด",
        description: "Confirmation failed",
        variant: "destructive"
      });
    });
  });

  it('should open cancel dialog', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const cancelButton = screen.getAllByText('ยกเลิก')[0];
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.getByText('ยกเลิกการโอน')).toBeInTheDocument();
      expect(screen.getByText('คุณต้องการยกเลิกการโอน TF202501010001 ใช่หรือไม่?')).toBeInTheDocument();
    });
  });

  it('should cancel transfer successfully', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const cancelButton = screen.getAllByText('ยกเลิก')[0];
      fireEvent.click(cancelButton);
    });

    // Add cancellation reason
    await waitFor(() => {
      const reasonTextarea = screen.getByPlaceholderText('ระบุเหตุผลในการยกเลิก...');
      fireEvent.change(reasonTextarea, { target: { value: 'Items damaged during transport' } });
    });

    // Confirm cancellation
    const confirmCancelButton = screen.getByText('ยืนยันการยกเลิก');
    fireEvent.click(confirmCancelButton);

    await waitFor(() => {
      expect(mockTransferService.cancelTransfer).toHaveBeenCalledWith(
        'transfer1',
        'Items damaged during transport',
        'current-user'
      );
      expect(mockToast).toHaveBeenCalledWith({
        title: "ยกเลิกการโอนสำเร็จ",
        description: "ยกเลิกการโอน TF202501010001 เรียบร้อยแล้ว"
      });
    });
  });

  it('should require cancellation reason', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const cancelButton = screen.getAllByText('ยกเลิก')[0];
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      const confirmCancelButton = screen.getByText('ยืนยันการยกเลิก');
      expect(confirmCancelButton).toBeDisabled();
    });

    // Add reason
    const reasonTextarea = screen.getByPlaceholderText('ระบุเหตุผลในการยกเลิก...');
    fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });

    await waitFor(() => {
      expect(confirmCancelButton).not.toBeDisabled();
    });
  });

  it('should show error when cancellation fails', async () => {
    mockTransferService.cancelTransfer.mockRejectedValue(new Error('Cancellation failed'));

    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const cancelButton = screen.getAllByText('ยกเลิก')[0];
      fireEvent.click(cancelButton);
    });

    const reasonTextarea = screen.getByPlaceholderText('ระบุเหตุผลในการยกเลิก...');
    fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });

    const confirmCancelButton = screen.getByText('ยืนยันการยกเลิก');
    fireEvent.click(confirmCancelButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "เกิดข้อผิดพลาด",
        description: "Cancellation failed",
        variant: "destructive"
      });
    });
  });

  it('should show loading state', async () => {
    // Mock delayed response
    mockTransferService.getTransfers.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<TransferConfirmation warehouseId="wh2" />);

    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ไม่มีการโอนที่รอยืนยัน')).toBeInTheDocument();
    });
  });

  it('should display status badges correctly', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const statusBadges = screen.getAllByText('รอยืนยัน');
      expect(statusBadges).toHaveLength(2);
    });
  });

  it('should format dates correctly', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      // Check if Thai date format is displayed
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    });
  });

  it('should handle error when loading transfers fails', async () => {
    mockTransferService.getTransfers.mockRejectedValue(new Error('Load failed'));

    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการโอนได้",
        variant: "destructive"
      });
    });
  });

  it('should handle error when loading transfer details fails', async () => {
    mockTransferService.getTransferById.mockRejectedValue(new Error('Details load failed'));

    render(<TransferConfirmation warehouseId="wh2" />);

    await waitFor(() => {
      const viewButton = screen.getAllByRole('button', { name: '' })[0];
      fireEvent.click(viewButton);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายละเอียดการโอนได้",
        variant: "destructive"
      });
    });
  });
});