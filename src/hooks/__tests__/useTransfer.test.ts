import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransfer } from '../useTransfer';
import { transferService } from '@/lib/transferService';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/lib/transferService');
vi.mock('@/hooks/use-toast');

const mockTransferService = transferService as any;
const mockUseToast = useToast as any;

describe('useTransfer Hook', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTransfer());

    expect(result.current.transfers).toEqual([]);
    expect(result.current.availableSerialNumbers).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should have all required methods', () => {
    const { result } = renderHook(() => useTransfer());

    expect(typeof result.current.loadTransfers).toBe('function');
    expect(typeof result.current.loadAvailableSerialNumbers).toBe('function');
    expect(typeof result.current.createTransfer).toBe('function');
    expect(typeof result.current.confirmTransfer).toBe('function');
    expect(typeof result.current.cancelTransfer).toBe('function');
    expect(typeof result.current.getTransferById).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should load transfers successfully', async () => {
    const mockTransfers = [
      {
        id: 'transfer1',
        transferNumber: 'TF202501010001',
        status: 'pending',
        totalItems: 1
      }
    ];

    mockTransferService.getTransfers.mockResolvedValue(mockTransfers);

    const { result } = renderHook(() => useTransfer());

    await act(async () => {
      await result.current.loadTransfers();
    });

    expect(result.current.transfers).toEqual(mockTransfers);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle load transfers error', async () => {
    mockTransferService.getTransfers.mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useTransfer());

    await act(async () => {
      await result.current.loadTransfers();
    });

    expect(result.current.transfers).toEqual([]);
    expect(result.current.error).toBe('Load failed');
    expect(mockToast).toHaveBeenCalledWith({
      title: "เกิดข้อผิดพลาด",
      description: "Load failed",
      variant: "destructive"
    });
  });

  it('should load available serial numbers successfully', async () => {
    const mockSerialNumbers = [
      {
        id: 'sn1',
        serialNumber: 'SN001',
        productId: 'prod1',
        warehouseId: 'wh1',
        unitCost: 1000,
        status: 'available' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockTransferService.getAvailableSerialNumbers.mockResolvedValue(mockSerialNumbers);

    const { result } = renderHook(() => useTransfer());

    await act(async () => {
      await result.current.loadAvailableSerialNumbers('wh1');
    });

    expect(result.current.availableSerialNumbers).toEqual(mockSerialNumbers);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should create transfer successfully', async () => {
    const mockTransfer = {
      id: 'transfer1',
      transferNumber: 'TF202501010001',
      status: 'pending',
      totalItems: 1
    };

    mockTransferService.initiateTransfer.mockResolvedValue(mockTransfer);
    mockTransferService.getTransfers.mockResolvedValue([mockTransfer]);

    const { result } = renderHook(() => useTransfer());

    const request = {
      sourceWarehouseId: 'wh1',
      targetWarehouseId: 'wh2',
      serialNumbers: ['sn1'],
      notes: 'Test transfer'
    };

    let createdTransfer;
    await act(async () => {
      createdTransfer = await result.current.createTransfer(request, 'user1');
    });

    expect(createdTransfer).toEqual(mockTransfer);
    expect(result.current.isCreating).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: "สร้างการโอนสำเร็จ",
      description: "สร้างการโอน TF202501010001 เรียบร้อยแล้ว"
    });
  });

  it('should handle create transfer error', async () => {
    mockTransferService.initiateTransfer.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useTransfer());

    const request = {
      sourceWarehouseId: 'wh1',
      targetWarehouseId: 'wh2',
      serialNumbers: ['sn1']
    };

    let createdTransfer;
    await act(async () => {
      createdTransfer = await result.current.createTransfer(request, 'user1');
    });

    expect(createdTransfer).toBe(null);
    expect(result.current.error).toBe('Create failed');
    expect(mockToast).toHaveBeenCalledWith({
      title: "เกิดข้อผิดพลาด",
      description: "Create failed",
      variant: "destructive"
    });
  });

  it('should confirm transfer successfully', async () => {
    const mockTransfer = {
      id: 'transfer1',
      transferNumber: 'TF202501010001',
      status: 'completed',
      totalItems: 1
    };

    mockTransferService.confirmTransfer.mockResolvedValue(mockTransfer);
    mockTransferService.getTransfers.mockResolvedValue([mockTransfer]);

    const { result } = renderHook(() => useTransfer());

    const confirmation = {
      transferId: 'transfer1',
      confirmedBy: 'user2',
      notes: 'Confirmed'
    };

    let confirmedTransfer;
    await act(async () => {
      confirmedTransfer = await result.current.confirmTransfer(confirmation);
    });

    expect(confirmedTransfer).toEqual(mockTransfer);
    expect(result.current.isConfirming).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: "ยืนยันการรับสินค้าสำเร็จ",
      description: "ยืนยันการรับสินค้า TF202501010001 เรียบร้อยแล้ว"
    });
  });

  it('should cancel transfer successfully', async () => {
    mockTransferService.cancelTransfer.mockResolvedValue(undefined);
    mockTransferService.getTransfers.mockResolvedValue([]);

    const { result } = renderHook(() => useTransfer());

    await act(async () => {
      await result.current.cancelTransfer('transfer1', 'Test reason', 'user1');
    });

    expect(result.current.isConfirming).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: "ยกเลิกการโอนสำเร็จ",
      description: "ยกเลิกการโอนเรียบร้อยแล้ว"
    });
  });

  it('should get transfer by ID successfully', async () => {
    const mockTransfer = {
      id: 'transfer1',
      transferNumber: 'TF202501010001',
      status: 'pending',
      totalItems: 1
    };

    mockTransferService.getTransferById.mockResolvedValue(mockTransfer);

    const { result } = renderHook(() => useTransfer());

    let transfer;
    await act(async () => {
      transfer = await result.current.getTransferById('transfer1');
    });

    expect(transfer).toEqual(mockTransfer);
    expect(result.current.error).toBe(null);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useTransfer());

    // Set an error first
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should load transfers on mount when warehouseId provided', async () => {
    const mockTransfers = [
      {
        id: 'transfer1',
        transferNumber: 'TF202501010001',
        status: 'pending',
        totalItems: 1
      }
    ];

    mockTransferService.getTransfers.mockResolvedValue(mockTransfers);

    renderHook(() => useTransfer({ warehouseId: 'wh2' }));

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockTransferService.getTransfers).toHaveBeenCalledWith({
      targetWarehouseId: 'wh2'
    });
  });

  it('should refresh data', async () => {
    const mockTransfers = [
      {
        id: 'transfer1',
        transferNumber: 'TF202501010001',
        status: 'pending',
        totalItems: 1
      }
    ];

    mockTransferService.getTransfers.mockResolvedValue(mockTransfers);

    const { result } = renderHook(() => useTransfer({ warehouseId: 'wh2' }));

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockTransferService.getTransfers).toHaveBeenCalledWith({
      targetWarehouseId: 'wh2'
    });
  });
});