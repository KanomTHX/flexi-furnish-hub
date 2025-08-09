import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import StockAdjustment, { StockAdjustmentData } from '../StockAdjustment';

// Mock BarcodeScanner component
vi.mock('../BarcodeScanner', () => ({
  default: ({ onScan, isOpen }: any) => 
    isOpen ? (
      <div data-testid="barcode-scanner">
        <button onClick={() => onScan('TEST-123')}>Scan Test</button>
      </div>
    ) : null
}));

describe('StockAdjustment', () => {
  const mockOnAdjustmentComplete = vi.fn();
  const mockOnCancel = vi.fn();
  const warehouseId = 'warehouse-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders adjustment form', () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    expect(screen.getByText('Stock Adjustment')).toBeInTheDocument();
    expect(screen.getByText('Adjustment Type')).toBeInTheDocument();
    expect(screen.getByText('Reason *')).toBeInTheDocument();
    expect(screen.getByText('Adjustment Items')).toBeInTheDocument();
  });

  it('shows adjustment type options', () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    const adjustmentTypeSelect = screen.getByDisplayValue('Data Correction');
    fireEvent.click(adjustmentTypeSelect);
    
    expect(screen.getByText('Stock Count Adjustment')).toBeInTheDocument();
    expect(screen.getByText('Damage Report')).toBeInTheDocument();
    expect(screen.getByText('Loss/Theft Report')).toBeInTheDocument();
    expect(screen.getByText('Found Items')).toBeInTheDocument();
    expect(screen.getByText('Data Correction')).toBeInTheDocument();
  });

  it('opens barcode scanner when Add Item is clicked', () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    const addItemButton = screen.getByText('Add Item');
    fireEvent.click(addItemButton);
    
    expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument();
  });

  it('adds item from barcode scanner', async () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    // Open scanner
    const addItemButton = screen.getByText('Add Item');
    fireEvent.click(addItemButton);
    
    // Scan barcode
    const scanTestButton = screen.getByText('Scan Test');
    fireEvent.click(scanTestButton);
    
    // Should show item details form
    await waitFor(() => {
      expect(screen.getByDisplayValue('TEST-123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sample Product')).toBeInTheDocument();
    });
  });

  it('validates required fields for item', async () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    // Open scanner and scan item
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Scan Test'));
    
    // Try to add item without reason
    await waitFor(() => {
      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);
    });
    
    // Should show alert (mocked)
    // In a real test, you might want to check for error messages in the UI
  });

  it('adds item with all required fields', async () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    // Open scanner and scan item
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Scan Test'));
    
    await waitFor(() => {
      // Fill in reason
      const reasonTextarea = screen.getByPlaceholderText('Specific reason for this item adjustment');
      fireEvent.change(reasonTextarea, { target: { value: 'Item was damaged' } });
      
      // Add item
      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);
    });
    
    // Should show item in table
    await waitFor(() => {
      expect(screen.getByText('Items to Adjust (1)')).toBeInTheDocument();
      expect(screen.getByText('TEST-123')).toBeInTheDocument();
      expect(screen.getByText('Item was damaged')).toBeInTheDocument();
    });
  });

  it('removes item from adjustment list', async () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    // Add an item first
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Scan Test'));
    
    await waitFor(() => {
      const reasonTextarea = screen.getByPlaceholderText('Specific reason for this item adjustment');
      fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });
      fireEvent.click(screen.getByText('Add Item'));
    });
    
    // Remove the item
    await waitFor(() => {
      const removeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(removeButton);
    });
    
    // Item should be removed
    expect(screen.queryByText('Items to Adjust (1)')).not.toBeInTheDocument();
  });

  it('shows status change field for status_change adjustment type', async () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    // Add item and select status change
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Scan Test'));
    
    await waitFor(() => {
      const adjustmentTypeSelect = screen.getAllByDisplayValue('Data Correction')[1]; // Second one is for item
      fireEvent.click(adjustmentTypeSelect);
      fireEvent.click(screen.getByText('Change Status'));
    });
    
    expect(screen.getByText('New Status')).toBeInTheDocument();
  });

  it('submits adjustment with valid data', async () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    // Fill in main reason
    const mainReasonTextarea = screen.getByPlaceholderText('Explain the reason for this adjustment');
    fireEvent.change(mainReasonTextarea, { target: { value: 'Monthly stock count adjustment' } });
    
    // Add an item
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Scan Test'));
    
    await waitFor(() => {
      const itemReasonTextarea = screen.getByPlaceholderText('Specific reason for this item adjustment');
      fireEvent.change(itemReasonTextarea, { target: { value: 'Found extra item' } });
      fireEvent.click(screen.getByText('Add Item'));
    });
    
    // Submit adjustment
    await waitFor(() => {
      const submitButton = screen.getByText('Submit Adjustment (1 items)');
      fireEvent.click(submitButton);
    });
    
    expect(mockOnAdjustmentComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        warehouseId: warehouseId,
        adjustmentType: 'correction',
        reason: 'Monthly stock count adjustment',
        totalItems: 1,
        items: expect.arrayContaining([
          expect.objectContaining({
            serialNumber: 'TEST-123',
            reason: 'Found extra item'
          })
        ])
      })
    );
  });

  it('disables submit button when no reason provided', () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    const submitButton = screen.getByText('Submit Adjustment (0 items)');
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when no items added', () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    // Add reason but no items
    const reasonTextarea = screen.getByPlaceholderText('Explain the reason for this adjustment');
    fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });
    
    const submitButton = screen.getByText('Submit Adjustment (0 items)');
    expect(submitButton).toBeDisabled();
  });

  it('shows processing state', () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );
    
    // Simulate processing state by checking if button text changes
    // This would require modifying the component to accept isProcessing prop
    // or testing the actual processing flow
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentComplete}
        onCancel={mockOnCancel}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('generates unique adjustment number', async () => {
    const adjustmentData: StockAdjustmentData[] = [];
    
    const mockOnAdjustmentCompleteCapture = (data: StockAdjustmentData) => {
      adjustmentData.push(data);
    };
    
    render(
      <StockAdjustment
        warehouseId={warehouseId}
        onAdjustmentComplete={mockOnAdjustmentCompleteCapture}
      />
    );
    
    // Fill and submit form
    const reasonTextarea = screen.getByPlaceholderText('Explain the reason for this adjustment');
    fireEvent.change(reasonTextarea, { target: { value: 'Test' } });
    
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Scan Test'));
    
    await waitFor(() => {
      const itemReasonTextarea = screen.getByPlaceholderText('Specific reason for this item adjustment');
      fireEvent.change(itemReasonTextarea, { target: { value: 'Test item' } });
      fireEvent.click(screen.getByText('Add Item'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Submit Adjustment (1 items)'));
    });
    
    expect(adjustmentData[0].adjustmentNumber).toMatch(/^ADJ-\d+-[a-z0-9]+$/);
  });
});