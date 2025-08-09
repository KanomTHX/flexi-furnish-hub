import { useState, useCallback, useRef, useEffect } from 'react';

interface BarcodeScannerOptions {
  onScan?: (barcode: string) => void;
  onError?: (error: string) => void;
  minLength?: number;
  maxLength?: number;
  timeout?: number;
}

interface BarcodeScannerState {
  isScanning: boolean;
  lastScanned: string | null;
  error: string | null;
}

export const useBarcodeScanner = (options: BarcodeScannerOptions = {}) => {
  const {
    onScan,
    onError,
    minLength = 3,
    maxLength = 50,
    timeout = 100
  } = options;

  const [state, setState] = useState<BarcodeScannerState>({
    isScanning: false,
    lastScanned: null,
    error: null
  });

  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateBarcode = useCallback((barcode: string): boolean => {
    if (barcode.length < minLength || barcode.length > maxLength) {
      return false;
    }
    
    // Basic barcode format validation
    const barcodePattern = /^[A-Za-z0-9\-_]+$/;
    return barcodePattern.test(barcode);
  }, [minLength, maxLength]);

  const processBarcode = useCallback((barcode: string) => {
    if (!validateBarcode(barcode)) {
      const error = `Invalid barcode format: ${barcode}`;
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    setState(prev => ({ 
      ...prev, 
      lastScanned: barcode, 
      error: null,
      isScanning: false 
    }));
    onScan?.(barcode);
  }, [validateBarcode, onScan, onError]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!state.isScanning) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (event.key === 'Enter') {
      // Process the accumulated buffer
      if (bufferRef.current.trim()) {
        processBarcode(bufferRef.current.trim());
        bufferRef.current = '';
      }
      return;
    }

    // Accumulate characters
    if (event.key.length === 1) {
      bufferRef.current += event.key;
      
      // Set timeout to process buffer if no more input
      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.trim()) {
          processBarcode(bufferRef.current.trim());
          bufferRef.current = '';
        }
      }, timeout);
    }
  }, [state.isScanning, processBarcode, timeout]);

  useEffect(() => {
    if (state.isScanning) {
      document.addEventListener('keypress', handleKeyPress);
      return () => {
        document.removeEventListener('keypress', handleKeyPress);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [state.isScanning, handleKeyPress]);

  const startScanning = useCallback(() => {
    setState(prev => ({ ...prev, isScanning: true, error: null }));
    bufferRef.current = '';
  }, []);

  const stopScanning = useCallback(() => {
    setState(prev => ({ ...prev, isScanning: false }));
    bufferRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const scanBarcode = useCallback((barcode: string) => {
    processBarcode(barcode);
  }, [processBarcode]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startScanning,
    stopScanning,
    scanBarcode,
    clearError
  };
};

export default useBarcodeScanner;