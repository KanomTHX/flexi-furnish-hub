import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan, X, Search } from 'lucide-react';
import { Product } from '@/types/pos';
// Products will be loaded from Supabase in the parent component
import { validateBarcode } from '@/utils/posHelpers';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (product: Product) => void;
  products?: Product[]; // Products from parent component
}

export function BarcodeScanner({ open, onOpenChange, onProductFound, products = [] }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBarcodeSubmit = () => {
    setError('');
    
    if (!barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }

    if (!validateBarcode(barcode)) {
      setError('Invalid barcode format (must be 13 digits)');
      return;
    }

    // Search for product by barcode
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      onProductFound(product);
      setBarcode('');
      onOpenChange(false);
    } else {
      setError('Product not found with this barcode');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeSubmit();
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    // In a real app, this would start camera scanning
    // For demo purposes, we'll just focus the input
    setTimeout(() => {
      inputRef.current?.focus();
      setIsScanning(false);
    }, 1000);
  };

  const handleClose = () => {
    setBarcode('');
    setError('');
    setIsScanning(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview Placeholder */}
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
            {isScanning ? (
              <div className="text-center">
                <Scan className="w-12 h-12 mx-auto mb-2 animate-pulse text-primary" />
                <p className="text-sm text-muted-foreground">Scanning for barcode...</p>
              </div>
            ) : (
              <div className="text-center">
                <Scan className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Camera preview</p>
                <p className="text-xs text-muted-foreground">Click scan to start</p>
              </div>
            )}
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="barcode">Or enter barcode manually:</Label>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter 13-digit barcode"
                maxLength={13}
              />
              <Button onClick={handleBarcodeSubmit} size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={startScanning}
              disabled={isScanning}
              className="flex-1"
            >
              <Scan className="w-4 h-4 mr-2" />
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Point camera at barcode to scan automatically</p>
            <p>• Or type the 13-digit barcode manually</p>
            <p>• Make sure barcode is clear and well-lit</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}