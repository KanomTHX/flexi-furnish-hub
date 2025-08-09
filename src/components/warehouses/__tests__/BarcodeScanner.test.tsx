import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import BarcodeScanner from '../BarcodeScanner';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('BarcodeScanner', () => {
  const mockOnScan = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<BarcodeScanner onScan={mockOnScan} />);
    
    expect(screen.getByText('Barcode Scanner')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Scan or enter barcode/SN')).toBeInTheDocument();
    expect(screen.getByText('Start Scanning')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        onClose={mockOnClose}
        title="Custom Scanner"
        placeholder="Enter custom barcode"
      />
    );
    
    expect(screen.getByText('Custom Scanner')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter custom barcode')).toBeInTheDocument();
    // Find close button by its icon
    const closeButton = screen.getByRole('button', { name: '' });
    expect(closeButton).toBeInTheDocument();
  });

  it('handles manual barcode input', async () => {
    render(<BarcodeScanner onScan={mockOnScan} />);
    
    const input = screen.getByPlaceholderText('Scan or enter barcode/SN');
    const submitButton = screen.getByRole('button', { name: '' }); // Check button
    
    fireEvent.change(input, { target: { value: 'TEST-123' } });
    fireEvent.click(submitButton);
    
    expect(mockOnScan).toHaveBeenCalledWith('TEST-123');
    expect(input).toHaveValue('');
  });

  it('handles Enter key press', async () => {
    render(<BarcodeScanner onScan={mockOnScan} />);
    
    const input = screen.getByPlaceholderText('Scan or enter barcode/SN');
    
    fireEvent.change(input, { target: { value: 'TEST-456' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnScan).toHaveBeenCalledWith('TEST-456');
  });

  it('trims whitespace from input', () => {
    render(<BarcodeScanner onScan={mockOnScan} />);
    
    const input = screen.getByPlaceholderText('Scan or enter barcode/SN');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: '  TEST-789  ' } });
    fireEvent.click(submitButton);
    
    expect(mockOnScan).toHaveBeenCalledWith('TEST-789');
  });

  it('disables submit button when input is empty', () => {
    render(<BarcodeScanner onScan={mockOnScan} />);
    
    const submitButton = screen.getByRole('button', { name: '' });
    expect(submitButton).toBeDisabled();
    
    const input = screen.getByPlaceholderText('Scan or enter barcode/SN');
    fireEvent.change(input, { target: { value: 'TEST' } });
    expect(submitButton).not.toBeDisabled();
    
    fireEvent.change(input, { target: { value: '' } });
    expect(submitButton).toBeDisabled();
  });

  it('handles close button click', () => {
    render(<BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />);
    
    // Find the close button (first button with empty name)
    const buttons = screen.getAllByRole('button', { name: '' });
    const closeButton = buttons[0]; // First button should be the close button
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('toggles scanning state', () => {
    render(<BarcodeScanner onScan={mockOnScan} />);
    
    const scanButton = screen.getByText('Start Scanning');
    fireEvent.click(scanButton);
    
    expect(screen.getByText('Scanning...')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<BarcodeScanner onScan={mockOnScan} isOpen={false} />);
    
    expect(screen.queryByText('Barcode Scanner')).not.toBeInTheDocument();
  });

  it('focuses input on mount when open', () => {
    render(<BarcodeScanner onScan={mockOnScan} />);
    
    const input = screen.getByPlaceholderText('Scan or enter barcode/SN');
    expect(input).toHaveFocus();
  });

  it('does not call onScan with empty input', () => {
    render(<BarcodeScanner onScan={mockOnScan} />);
    
    const input = screen.getByPlaceholderText('Scan or enter barcode/SN');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnScan).not.toHaveBeenCalled();
  });
});