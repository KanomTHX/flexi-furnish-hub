import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferConfirmation } from '../TransferConfirmation';

// Mock dependencies
vi.mock('@/lib/transferService', () => ({
  transferService: {
    getTransfers: vi.fn().mockResolvedValue([]),
    getTransferById: vi.fn(),
    confirmTransfer: vi.fn(),
    cancelTransfer: vi.fn(),
    getAvailableSerialNumbers: vi.fn(),
    initiateTransfer: vi.fn(),
    getTransferStats: vi.fn()
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('TransferConfirmation Component - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render transfer confirmation component', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    expect(screen.getByText('การโอนที่รอยืนยัน')).toBeInTheDocument();
  });

  it('should show empty state when no pending transfers', async () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    // Wait for loading to complete and empty state to show
    await screen.findByText('ไม่มีการโอนที่รอยืนยัน');
    expect(screen.getByText('ไม่มีการโอนที่รอยืนยัน')).toBeInTheDocument();
  });

  it('should accept warehouseId prop', () => {
    const { rerender } = render(<TransferConfirmation warehouseId="wh1" />);
    
    expect(screen.getByText('การโอนที่รอยืนยัน')).toBeInTheDocument();

    // Test with different warehouse ID
    rerender(<TransferConfirmation warehouseId="wh2" />);
    
    expect(screen.getByText('การโอนที่รอยืนยัน')).toBeInTheDocument();
  });

  it('should handle onTransferConfirmed callback prop', () => {
    const mockCallback = vi.fn();
    
    render(
      <TransferConfirmation 
        warehouseId="wh2" 
        onTransferConfirmed={mockCallback}
      />
    );

    expect(screen.getByText('การโอนที่รอยืนยัน')).toBeInTheDocument();
    // Callback should be available but not called on render
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should show loading state initially', () => {
    render(<TransferConfirmation warehouseId="wh2" />);

    // Should show loading initially
    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
  });
});