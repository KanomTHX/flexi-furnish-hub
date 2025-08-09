import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import BatchOperations, { BatchOperationType } from '../BatchOperations';

// Mock BarcodeScanner component
vi.mock('../BarcodeScanner', () => ({
  default: ({ onScan, onClose, isOpen }: any) => 
    isOpen ? (
      <div data-testid="barcode-scanner">
        <button onClick={() => onScan('TEST-123')}>Scan Test</button>
        <button onClick={onClose}>Close Scanner</button>
      </div>
    ) : null
}));

describe('BatchOperations', () => {
  const mockOnBatchProcess = vi.fn();
  const availableOperations: BatchOperationType[] = ['transfer', 'withdraw', 'adjust'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with available operations', () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    expect(screen.getByText('Batch Operations')).toBeInTheDocument();
    expect(screen.getByText('Serial Numbers')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select operation')).toBeInTheDocument();
  });

  it('shows additional fields based on operation type', async () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    // Select transfer operation
    const operationSelect = screen.getByDisplayValue('');
    fireEvent.click(operationSelect);
    
    const transferOption = screen.getByText('TRANSFER');
    fireEvent.click(transferOption);
    
    await waitFor(() => {
      expect(screen.getByText('Target Warehouse')).toBeInTheDocument();
    });
  });

  it('validates serial numbers', () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Enter serial numbers, one per line');
    
    fireEvent.change(textarea, { 
      target: { 
        value: 'VALID-123\nINVALID@#$\nANOTHER-VALID-456\nX' 
      } 
    });
    
    expect(screen.getByText('Valid Serial Numbers (2)')).toBeInTheDocument();
    expect(screen.getByText('Invalid Serial Numbers (2)')).toBeInTheDocument();
    
    // Check valid serial numbers are displayed
    expect(screen.getByText('VALID-123')).toBeInTheDocument();
    expect(screen.getByText('ANOTHER-VALID-456')).toBeInTheDocument();
    
    // Check invalid serial numbers are displayed
    expect(screen.getByText('INVALID@#$')).toBeInTheDocument();
    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('adds serial numbers via barcode scanner', async () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    // Open scanner
    const scanButton = screen.getByText('Scan');
    fireEvent.click(scanButton);
    
    expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument();
    
    // Scan a barcode
    const scanTestButton = screen.getByText('Scan Test');
    fireEvent.click(scanTestButton);
    
    // Check if serial number was added
    const textarea = screen.getByPlaceholderText('Enter serial numbers, one per line');
    expect(textarea).toHaveValue('TEST-123');
  });

  it('removes serial numbers', () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Enter serial numbers, one per line');
    fireEvent.change(textarea, { 
      target: { value: 'TEST-123\nTEST-456' } 
    });
    
    // Find and click remove button for first serial number
    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[0]);
    
    // Check if serial number was removed
    expect(textarea).toHaveValue('TEST-456');
  });

  it('clears all serial numbers', () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Enter serial numbers, one per line');
    fireEvent.change(textarea, { 
      target: { value: 'TEST-123\nTEST-456' } 
    });
    
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    expect(textarea).toHaveValue('');
  });

  it('processes batch operation', async () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    // Select operation
    const operationSelect = screen.getByDisplayValue('');
    fireEvent.click(operationSelect);
    fireEvent.click(screen.getByText('WITHDRAW'));
    
    // Add serial numbers
    const textarea = screen.getByPlaceholderText('Enter serial numbers, one per line');
    fireEvent.change(textarea, { 
      target: { value: 'TEST-123\nTEST-456' } 
    });
    
    // Add notes
    const notesTextarea = screen.getByPlaceholderText('Additional notes');
    fireEvent.change(notesTextarea, { 
      target: { value: 'Test batch operation' } 
    });
    
    // Process batch
    const processButton = screen.getByText('Process 2 Serial Numbers');
    fireEvent.click(processButton);
    
    expect(mockOnBatchProcess).toHaveBeenCalledWith(
      {
        type: 'withdraw',
        notes: 'Test batch operation'
      },
      ['TEST-123', 'TEST-456']
    );
  });

  it('disables process button when no valid serial numbers', () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    const processButton = screen.getByText('Process 0 Serial Numbers');
    expect(processButton).toBeDisabled();
  });

  it('disables process button when no operation selected', () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    // Add serial numbers but no operation
    const textarea = screen.getByPlaceholderText('Enter serial numbers, one per line');
    fireEvent.change(textarea, { 
      target: { value: 'TEST-123' } 
    });
    
    const processButton = screen.getByText('Process 1 Serial Numbers');
    expect(processButton).toBeDisabled();
  });

  it('shows processing state', () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
        isProcessing={true}
      />
    );
    
    // Add valid data
    const operationSelect = screen.getByDisplayValue('');
    fireEvent.click(operationSelect);
    fireEvent.click(screen.getByText('WITHDRAW'));
    
    const textarea = screen.getByPlaceholderText('Enter serial numbers, one per line');
    fireEvent.change(textarea, { 
      target: { value: 'TEST-123' } 
    });
    
    expect(screen.getByText('Processing 1 items...')).toBeInTheDocument();
  });

  it('prevents duplicate serial numbers from scanner', async () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={availableOperations}
      />
    );
    
    // Add serial number manually first
    const textarea = screen.getByPlaceholderText('Enter serial numbers, one per line');
    fireEvent.change(textarea, { 
      target: { value: 'TEST-123' } 
    });
    
    // Try to add same serial number via scanner
    const scanButton = screen.getByText('Scan');
    fireEvent.click(scanButton);
    
    const scanTestButton = screen.getByText('Scan Test');
    fireEvent.click(scanTestButton);
    
    // Should still only have one instance
    expect(textarea).toHaveValue('TEST-123');
  });

  it('shows adjustment reason field for adjust operation', async () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={['adjust']}
      />
    );
    
    const operationSelect = screen.getByDisplayValue('');
    fireEvent.click(operationSelect);
    fireEvent.click(screen.getByText('ADJUST'));
    
    await waitFor(() => {
      expect(screen.getByText('Adjustment Reason')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter reason for adjustment')).toBeInTheDocument();
    });
  });

  it('shows status field for status_update operation', async () => {
    render(
      <BatchOperations
        onBatchProcess={mockOnBatchProcess}
        availableOperations={['status_update']}
      />
    );
    
    const operationSelect = screen.getByDisplayValue('');
    fireEvent.click(operationSelect);
    fireEvent.click(screen.getByText('STATUS_UPDATE'));
    
    await waitFor(() => {
      expect(screen.getByText('New Status')).toBeInTheDocument();
    });
  });
});