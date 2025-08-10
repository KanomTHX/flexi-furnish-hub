import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, Zap, ZapOff } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "สแกน Barcode/QR Code",
  description = "วางบาร์โค้ดหรือ QR Code ให้อยู่ในกรอบ"
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // ตรวจสอบสิทธิ์การใช้กล้อง
  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setHasPermission(false);
      setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์');
    }
  };

  // เริ่มการสแกน
  const startScanning = () => {
    if (!hasPermission) {
      checkCameraPermission();
      return;
    }

    setIsScanning(true);
    setError(null);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [
        Html5QrcodeScanType.SCAN_TYPE_CAMERA
      ]
    };

    scannerRef.current = new Html5QrcodeScanner(
      "barcode-scanner-container",
      config,
      false
    );

    scannerRef.current.render(
      (decodedText: string) => {
        // สำเร็จ
        onScan(decodedText);
        stopScanning();
        onClose();
      },
      (errorMessage: string) => {
        // ข้อผิดพลาด (ไม่ต้องแสดงเพราะเป็นเรื่องปกติ)
        console.debug('Scan error:', errorMessage);
      }
    );
  };

  // หยุดการสแกน
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // ตรวจสอบสิทธิ์เมื่อเปิด dialog
  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    }
  }, [isOpen]);

  // ทำความสะอาดเมื่อปิด dialog
  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setError(null);
    }
  }, [isOpen]);

  // ทำความสะอาดเมื่อ component unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {description}
          </p>

          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasPermission === null && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">กำลังตรวจสอบกล้อง...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                ไม่สามารถเข้าถึงกล้องได้
              </p>
              <Button onClick={checkCameraPermission} variant="outline">
                ลองอีกครั้ง
              </Button>
            </div>
          )}

          {hasPermission === true && !isScanning && (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground mb-4">
                พร้อมสำหรับการสแกน
              </p>
              <Button onClick={startScanning} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                เริ่มสแกน
              </Button>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div 
                id="barcode-scanner-container" 
                className="w-full"
                style={{ minHeight: '300px' }}
              />
              <Button 
                onClick={stopScanning} 
                variant="outline" 
                className="w-full"
              >
                <ZapOff className="h-4 w-4 mr-2" />
                หยุดสแกน
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}