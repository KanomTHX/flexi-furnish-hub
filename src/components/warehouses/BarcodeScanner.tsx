import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, X, Check } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
  placeholder?: string;
  title?: string;
  isOpen?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  placeholder = "Scan or enter barcode/SN",
  title = "Barcode Scanner",
  isOpen = true
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleScan();
    }
  };

  const handleScan = () => {
    if (inputValue.trim()) {
      onScan(inputValue.trim());
      setInputValue('');
      setIsScanning(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
            autoFocus
          />
          <Button
            onClick={handleScan}
            disabled={!inputValue.trim()}
            size="sm"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-center">
          <Button
            onClick={startScanning}
            variant={isScanning ? "secondary" : "outline"}
            className="w-full"
          >
            <Scan className="h-4 w-4 mr-2" />
            {isScanning ? "Scanning..." : "Start Scanning"}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground text-center">
          Position barcode in front of scanner or type manually
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;