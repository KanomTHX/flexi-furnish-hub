import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { StockCard } from '../StockCard';
import type { StockLevel } from '@/types/warehouseStock';

const mockStockLevel: StockLevel = {
  productId: 'product-1',
  productName: 'โซฟา 3 ที่นั่ง',
  productCode: 'SF001',
  warehouseId: 'warehouse-1',
  warehouseName: 'คลังหลัก',
  warehouseCode: 'WH001',
  totalQuantity: 10,
  availableQuantity: 8,
  soldQuantity: 2,
  transferredQuantity: 0,
  claimedQuantity: 0,
  damagedQuantity: 0,
  reservedQuantity: 0,
  averageCost: 15000,
  availableValue: 120000
};

const mockLowStockLevel: StockLevel = {
  ...mockStockLevel,
  availableQuantity: 3,
  soldQuantity: 7,
  availableValue: 45000
};

const mockOutOfStockLevel: StockLevel = {
  ...mockStockLevel,
  availableQuantity: 0,
  soldQuantity: 10,
  availableValue: 0
};

describe('StockCard Component', () => {
  it('renders basic stock information', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockStockLevel} onClick={mockOnClick} />);
    
    expect(screen.getByText('โซฟา 3 ที่นั่ง')).toBeInTheDocument();
    expect(screen.getByText('รหัส: SF001')).toBeInTheDocument();
    expect(screen.getByText('คลังหลัก')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // Available quantity
    expect(screen.getByText('10')).toBeInTheDocument(); // Total quantity
  });

  it('shows correct status badge for in-stock items', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockStockLevel} onClick={mockOnClick} />);
    
    expect(screen.getByText('พร้อมจำหน่าย')).toBeInTheDocument();
  });

  it('shows correct status badge for low-stock items', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockLowStockLevel} onClick={mockOnClick} />);
    
    expect(screen.getByText('เหลือน้อย')).toBeInTheDocument();
  });

  it('shows correct status badge for out-of-stock items', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockOutOfStockLevel} onClick={mockOnClick} />);
    
    expect(screen.getByText('หมด')).toBeInTheDocument();
  });

  it('displays progress bar with correct percentage', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockStockLevel} onClick={mockOnClick} />);
    
    // Available percentage should be 80% (8/10)
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('shows detailed information when showDetails is true', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockStockLevel} onClick={mockOnClick} showDetails={true} />);
    
    expect(screen.getByText('ราคาต้นทุนเฉลี่ย:')).toBeInTheDocument();
    expect(screen.getByText('฿15,000')).toBeInTheDocument();
    expect(screen.getByText('มูลค่าคงเหลือ:')).toBeInTheDocument();
    expect(screen.getByText('฿120,000')).toBeInTheDocument();
    expect(screen.getByText('รายละเอียดสต็อก')).toBeInTheDocument();
  });

  it('shows stock breakdown when showDetails is true', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockStockLevel} onClick={mockOnClick} showDetails={true} />);
    
    expect(screen.getByText('ขายแล้ว:')).toBeInTheDocument();
    expect(screen.getByText('โอนแล้ว:')).toBeInTheDocument();
    expect(screen.getByText('เคลม:')).toBeInTheDocument();
    expect(screen.getByText('เสียหาย:')).toBeInTheDocument();
  });

  it('shows reserved quantity when greater than 0', () => {
    const stockWithReserved = { ...mockStockLevel, reservedQuantity: 2 };
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={stockWithReserved} onClick={mockOnClick} showDetails={true} />);
    
    expect(screen.getByText('จอง:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hides detailed information when showDetails is false', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockStockLevel} onClick={mockOnClick} showDetails={false} />);
    
    expect(screen.queryByText('ราคาต้นทุนเฉลี่ย:')).not.toBeInTheDocument();
    expect(screen.queryByText('รายละเอียดสต็อก')).not.toBeInTheDocument();
    expect(screen.getByText('คลิกเพื่อดูรายละเอียด')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockStockLevel} onClick={mockOnClick} />);
    
    const card = screen.getByText('โซฟา 3 ที่นั่ง').closest('.cursor-pointer');
    if (card) {
      fireEvent.click(card);
    }
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const mockOnClick = vi.fn();
    const { container } = render(
      <StockCard stockLevel={mockStockLevel} onClick={mockOnClick} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles zero average cost gracefully', () => {
    const stockWithZeroCost = { ...mockStockLevel, averageCost: 0 };
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={stockWithZeroCost} onClick={mockOnClick} showDetails={true} />);
    
    // Should not show cost information when average cost is 0
    expect(screen.queryByText('ราคาต้นทุนเฉลี่ย:')).not.toBeInTheDocument();
  });

  it('displays stock distribution chart when showDetails is true', () => {
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={mockStockLevel} onClick={mockOnClick} showDetails={true} />);
    
    expect(screen.getByText('การกระจายสต็อก')).toBeInTheDocument();
    expect(screen.getByText('พร้อมจำหน่าย')).toBeInTheDocument();
    expect(screen.getByText('ขาย/โอน/เคลม/เสียหาย')).toBeInTheDocument();
  });

  it('handles edge case with zero total quantity', () => {
    const stockWithZeroTotal = { ...mockStockLevel, totalQuantity: 0, availableQuantity: 0 };
    const mockOnClick = vi.fn();
    render(<StockCard stockLevel={stockWithZeroTotal} onClick={mockOnClick} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Available quantity
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Percentage should be 0
  });
});