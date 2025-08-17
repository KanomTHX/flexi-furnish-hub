import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  QrCode, 
  X, 
  Check, 
  Search,
  Camera,
  Keyboard,
  Package,
  History,
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { WarehouseService } from '@/services/warehouseService';
import { useScanSessions, type ScanResult, type ScanSession } from '@/hooks/useScanSessions';
import { useWarehouse } from '@/hooks/useWarehouse';
import type { SerialNumber, StockLevel, Warehouse } from '@/types/warehouse';

interface BarcodeScannerProps {
  warehouses?: Warehouse[];
}

// ScanResult and ScanSession interfaces are now imported from useScanSessions hook

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  warehouses: propWarehouses
}) => {
  // Use warehouse hook to fetch warehouses if not provided
  const { warehouses: fetchedWarehouses, loading: warehousesLoading } = useWarehouse();
  const warehouses = propWarehouses || fetchedWarehouses;
  // Use scan sessions hook
  const {
    sessions: scanHistory,
    currentSession,
    loading: sessionLoading,
    error: sessionError,
    startSession,
    endSession,
    loadSessions,
    loadSessionResults,
    setCurrentSession
  } = useScanSessions();

  // State management
  const [activeTab, setActiveTab] = useState('scanner');
  const [loading, setLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [isScanning, setIsScanning] = useState(false);
  
  // Scanner state
  const [inputValue, setInputValue] = useState('');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Focus input when scanner is active
  useEffect(() => {
    if (activeTab === 'scanner' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeTab]);

  // Update isScanning based on currentSession
  useEffect(() => {
    setIsScanning(!!currentSession);
  }, [currentSession]);

  // Start new scan session
  const startScanSession = async () => {
    if (!selectedWarehouse) {
      toast.error('กรุณาเลือกคลังสินค้าก่อน');
      return;
    }

    const session = await startSession(selectedWarehouse);
    if (session) {
      setScanResults([]);
    }
  };

  // End scan session
  const endScanSession = async () => {
    if (currentSession) {
      await endSession(currentSession.id, scanResults);
      setScanResults([]);
    }
  };

  // Handle barcode scan
  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) return;
    if (!selectedWarehouse) {
      toast.error('กรุณาเลือกคลังสินค้าก่อน');
      return;
    }

    setLoading(true);
    
    try {
      // Search for serial number by barcode
      const response = await WarehouseService.getSerialNumbers({
        warehouseId: selectedWarehouse,
        search: barcode.trim(),
        limit: 1
      });

      const scanResult: ScanResult = {
        id: `scan-${Date.now()}`,
        barcode: barcode.trim(),
        scannedAt: new Date(),
        status: 'not_found'
      };

      if (response.data.length > 0) {
        const serialNumber = response.data[0];
        scanResult.serialNumberId = serialNumber.id;
        scanResult.productName = serialNumber.product?.name;
        scanResult.warehouseName = serialNumber.warehouse?.name;
        scanResult.status = 'found';
        
        toast.success(`พบสินค้า: ${serialNumber.product?.name} (${serialNumber.serialNumber})`);
      } else {
        toast.warning(`ไม่พบสินค้าที่มีบาร์โค้ด: ${barcode}`);
      }

      setScanResults(prev => [scanResult, ...prev]);
      setInputValue('');

    } catch (error) {
      console.error('Error scanning barcode:', error);
      
      const errorResult: ScanResult = {
        id: `scan-${Date.now()}`,
        barcode: barcode.trim(),
        scannedAt: new Date(),
        status: 'error'
      };
      
      setScanResults(prev => [errorResult, ...prev]);
      toast.error('เกิดข้อผิดพลาดในการสแกน');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleScan(inputValue);
    }
  };

  // Start camera scanning
  const startCameraScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanMode('camera');
        toast.success('เปิดกล้องสำเร็จ');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('ไม่สามารถเปิดกล้องได้');
    }
  };

  // Stop camera scanning
  const stopCameraScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanMode('manual');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'found':
        return <Badge className="bg-green-100 text-green-800">พบแล้ว</Badge>;
      case 'not_found':
        return <Badge className="bg-yellow-100 text-yellow-800">ไม่พบ</Badge>;
      case 'error':
        return <Badge variant="destructive">ข้อผิดพลาด</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            สแกนบาร์โค้ด
          </h2>
          <p className="text-muted-foreground">สแกนบาร์โค้ดและ QR Code เพื่อค้นหาสินค้า</p>
        </div>
        <div className="flex gap-2">
          {currentSession ? (
            <Button variant="destructive" onClick={endScanSession}>
              <X className="h-4 w-4 mr-2" />
              จบเซสชัน
            </Button>
          ) : (
            <Button onClick={startScanSession} disabled={!selectedWarehouse}>
              <Plus className="h-4 w-4 mr-2" />
              เริ่มเซสชันใหม่
            </Button>
          )}
        </div>
      </div>

      {/* Warehouse Selection */}
      <Card>
        <CardHeader>
          <CardTitle>เลือกคลังสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          {warehousesLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-muted-foreground">กำลังโหลดข้อมูลคลังสินค้า...</div>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-muted-foreground">ไม่พบข้อมูลคลังสินค้า</div>
            </div>
          ) : (
            <Select 
              value={selectedWarehouse} 
              onValueChange={setSelectedWarehouse}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกคลังสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Current Session Info */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              เซสชันปัจจุบัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">เริ่มเวลา</p>
                <p className="font-medium">{currentSession.startTime.toLocaleTimeString('th-TH')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ระยะเวลา</p>
                <p className="font-medium">
                  {Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)} นาที
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">จำนวนสแกน</p>
                <p className="font-medium">{scanResults.length} รายการ</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สำเร็จ</p>
                <p className="font-medium text-green-600">
                  {scanResults.filter(r => r.status === 'found').length} รายการ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">สแกนเนอร์</TabsTrigger>
          <TabsTrigger value="results">ผลการสแกน ({scanResults.length})</TabsTrigger>
          <TabsTrigger value="history">ประวัติ</TabsTrigger>
        </TabsList>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="space-y-6">
          {/* Scan Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>เลือกวิธีการสแกน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={scanMode === 'manual' ? 'default' : 'outline'}
                  onClick={() => {
                    stopCameraScanning();
                    setScanMode('manual');
                  }}
                  className="h-20 flex-col gap-2"
                >
                  <Keyboard className="h-6 w-6" />
                  <span>พิมพ์ด้วยมือ</span>
                </Button>
                <Button
                  variant={scanMode === 'camera' ? 'default' : 'outline'}
                  onClick={startCameraScanning}
                  className="h-20 flex-col gap-2"
                >
                  <Camera className="h-6 w-6" />
                  <span>ใช้กล้อง</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Input */}
          {scanMode === 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle>สแกนหรือพิมพ์บาร์โค้ด</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="สแกนหรือพิมพ์บาร์โค้ด / Serial Number"
                    className="flex-1"
                    disabled={loading || sessionLoading || !selectedWarehouse}
                    autoFocus
                  />
                  <Button
                    onClick={() => handleScan(inputValue)}
                    disabled={!inputValue.trim() || loading || sessionLoading || !selectedWarehouse}
                  >
                    {(loading || sessionLoading) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  💡 วางเคอร์เซอร์ในช่องและสแกนบาร์โค้ด หรือพิมพ์ Serial Number แล้วกด Enter
                </div>
              </CardContent>
            </Card>
          )}

          {/* Camera Scanner */}
          {scanMode === 'camera' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>สแกนด้วยกล้อง</span>
                  <Button variant="outline" onClick={stopCameraScanning}>
                    <X className="h-4 w-4 mr-2" />
                    ปิดกล้อง
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full max-w-md mx-auto rounded-lg"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-48 h-32 border-2 border-blue-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4 text-sm text-muted-foreground">
                  วางบาร์โค้ดในกรอบสี่เหลี่ยม
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          {scanResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>สถิติการสแกน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{scanResults.length}</p>
                    <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {scanResults.filter(r => r.status === 'found').length}
                    </p>
                    <p className="text-sm text-muted-foreground">พบแล้ว</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {scanResults.filter(r => r.status === 'not_found').length}
                    </p>
                    <p className="text-sm text-muted-foreground">ไม่พบ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ผลการสแกน</CardTitle>
            </CardHeader>
            <CardContent>
              {scanResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีผลการสแกน</p>
                  <p className="text-sm">เริ่มสแกนบาร์โค้ดเพื่อดูผลลัพธ์</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เวลา</TableHead>
                      <TableHead>บาร์โค้ด</TableHead>
                      <TableHead>สินค้า</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="text-sm">
                          {result.scannedAt.toLocaleTimeString('th-TH')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {result.barcode}
                        </TableCell>
                        <TableCell>
                          {result.productName ? (
                            <div>
                              <p className="font-medium">{result.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                {result.barcode}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(result.status)}</TableCell>
                        <TableCell>
                          {result.serialNumberId && (
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการสแกน</CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีประวัติการสแกน</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>คลัง</TableHead>
                      <TableHead>ระยะเวลา</TableHead>
                      <TableHead>จำนวนสแกน</TableHead>
                      <TableHead>อัตราสำเร็จ</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanHistory.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {session.startTime.toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell>
                          {warehouses.find(w => w.id === session.warehouseId)?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {session.endTime ? (
                            `${Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 60000)} นาที`
                          ) : (
                            'กำลังดำเนินการ'
                          )}
                        </TableCell>
                        <TableCell>{session.totalScans}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{session.successfulScans}/{session.totalScans}</span>
                            <Badge variant={session.successfulScans === session.totalScans ? 'default' : 'secondary'}>
                              {Math.round((session.successfulScans / session.totalScans) * 100)}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BarcodeScanner;