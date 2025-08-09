import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import useBarcodeScanner from '../useBarcodeScanner';

describe('useBarcodeScanner', () => {
  const mockOnScan = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document event listeners
    vi.spyOn(document, 'addEventListener');
    vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useBarcodeScanner());
    
    expect(result.current.isScanning).toBe(false);
    expect(result.current.lastScanned).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('starts and stops scanning', () => {
    const { result } = renderHook(() => useBarcodeScanner());
    
    act(() => {
      result.current.startScanning();
    });
    
    expect(result.current.isScanning).toBe(true);
    expect(document.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
    
    act(() => {
      result.current.stopScanning();
    });
    
    expect(result.current.isScanning).toBe(false);
  });

  it('validates barcode format', () => {
    const { result } = renderHook(() => 
      useBarcodeScanner({ 
        onScan: mockOnScan, 
        onError: mockOnError,
        minLength: 5,
        maxLength: 20
      })
    );
    
    // Valid barcode
    act(() => {
      result.current.scanBarcode('TEST-123');
    });
    
    expect(mockOnScan).toHaveBeenCalledWith('TEST-123');
    expect(result.current.lastScanned).toBe('TEST-123');
    expect(result.current.error).toBe(null);
    
    // Invalid barcode (too short)
    act(() => {
      result.current.scanBarcode('AB');
    });
    
    expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('Invalid barcode format'));
    expect(result.current.error).toContain('Invalid barcode format');
  });

  it('validates barcode with custom length constraints', () => {
    const { result } = renderHook(() => 
      useBarcodeScanner({ 
        onScan: mockOnScan, 
        onError: mockOnError,
        minLength: 10,
        maxLength: 15
      })
    );
    
    // Too short
    act(() => {
      result.current.scanBarcode('SHORT');
    });
    
    expect(mockOnError).toHaveBeenCalled();
    expect(result.current.error).toContain('Invalid barcode format');
    
    // Too long
    act(() => {
      result.current.scanBarcode('VERY-LONG-BARCODE-123456');
    });
    
    expect(mockOnError).toHaveBeenCalled();
  });

  it('validates barcode pattern', () => {
    const { result } = renderHook(() => 
      useBarcodeScanner({ 
        onScan: mockOnScan, 
        onError: mockOnError
      })
    );
    
    // Valid pattern
    act(() => {
      result.current.scanBarcode('ABC-123_DEF');
    });
    
    expect(mockOnScan).toHaveBeenCalledWith('ABC-123_DEF');
    
    // Invalid pattern (contains special characters)
    act(() => {
      result.current.scanBarcode('ABC@123#DEF');
    });
    
    expect(mockOnError).toHaveBeenCalled();
    expect(result.current.error).toContain('Invalid barcode format');
  });

  it('clears error state', () => {
    const { result } = renderHook(() => 
      useBarcodeScanner({ onError: mockOnError })
    );
    
    // Create an error
    act(() => {
      result.current.scanBarcode('AB'); // Too short
    });
    
    expect(result.current.error).toBeTruthy();
    
    // Clear error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBe(null);
  });

  it('stops scanning after successful scan', () => {
    const { result } = renderHook(() => 
      useBarcodeScanner({ onScan: mockOnScan })
    );
    
    act(() => {
      result.current.startScanning();
    });
    
    expect(result.current.isScanning).toBe(true);
    
    act(() => {
      result.current.scanBarcode('VALID-123');
    });
    
    expect(result.current.isScanning).toBe(false);
    expect(mockOnScan).toHaveBeenCalledWith('VALID-123');
  });

  it('handles keyboard events when scanning', () => {
    const { result } = renderHook(() => 
      useBarcodeScanner({ onScan: mockOnScan })
    );
    
    act(() => {
      result.current.startScanning();
    });
    
    // Simulate keyboard events
    const keyPressHandler = (document.addEventListener as any).mock.calls
      .find(call => call[0] === 'keypress')[1];
    
    // Simulate typing characters
    act(() => {
      keyPressHandler({ key: 'T' });
      keyPressHandler({ key: 'E' });
      keyPressHandler({ key: 'S' });
      keyPressHandler({ key: 'T' });
      keyPressHandler({ key: '-' });
      keyPressHandler({ key: '1' });
      keyPressHandler({ key: '2' });
      keyPressHandler({ key: '3' });
      keyPressHandler({ key: 'Enter' });
    });
    
    expect(mockOnScan).toHaveBeenCalledWith('TEST-123');
  });

  it('removes event listeners on unmount', () => {
    const { result, unmount } = renderHook(() => 
      useBarcodeScanner({ onScan: mockOnScan })
    );
    
    act(() => {
      result.current.startScanning();
    });
    
    unmount();
    
    expect(document.removeEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
  });

  it('handles timeout for barcode input', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => 
      useBarcodeScanner({ 
        onScan: mockOnScan,
        timeout: 100
      })
    );
    
    act(() => {
      result.current.startScanning();
    });
    
    const keyPressHandler = (document.addEventListener as any).mock.calls
      .find(call => call[0] === 'keypress')[1];
    
    // Simulate typing without Enter
    act(() => {
      keyPressHandler({ key: 'T' });
      keyPressHandler({ key: 'E' });
      keyPressHandler({ key: 'S' });
      keyPressHandler({ key: 'T' });
    });
    
    // Fast-forward time to trigger timeout
    act(() => {
      vi.advanceTimersByTime(150);
    });
    
    expect(mockOnScan).toHaveBeenCalledWith('TEST');
    
    vi.useRealTimers();
  });
});