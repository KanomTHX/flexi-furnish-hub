import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Scan, 
  QrCode, 
  Camera, 
  Smartphone, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings, 
  History, 
  Clock, 
  User, 
  MapPin, 
  Tag, 
  FileText, 
  Zap, 
  Target, 
  Volume2, 
  VolumeX, 
  Flashlight, 
  FlashlightOff, 
  RotateCcw, 
  Save, 
  X, 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal
} from 'lucide-react';

// Types for Scanner
interface ScanResult {
  id: string;
  serialNumber: string;
  scanType: 'qr' | 'barcode' | 'manual';
  timestamp: Date;
  location: {
    warehouseId: string;
    warehouseName: string;
    zoneId?: string;
    zoneName?: string;
    position?: string;
  };
  employee: {
    id: string;
    name: string;
    role: string;
  };
  device: {
    id: string;
    name: string;
    type: 'mobile' | 'handheld' | 'fixed';
  };
  product?: {
    sku: string;
    name: string;
    category: string;
  };
  action: 'receive' | 'move' | 'pick' | 'pack' | 'ship' | 'count' | 'inspect';
  status: 'success' | 'warning' | 'error';
  confidence: number; // 0-100
  notes?: string;
  images?: string[];
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
}

interface ScanSession {
  id: string;
  sessionName: string;
  startTime: Date;
  endTime?: Date;
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  employee: {
    id: string;
    name: string;
    role: string;
  };
  task: {
    id: string;
    type: 'receiving' | 'picking' | 'counting' | 'moving' | 'shipping';
    description: string;
  };
  location: {
    warehouseId: string;
    warehouseName: string;
  };
  results: ScanResult[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

interface ScannerSettings {
  autoFocus: boolean;
  flashlight: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  continuousMode: boolean;
  scanDelay: number; // milliseconds
  confidenceThreshold: number; // 0-100
  duplicateDetection: boolean;
  offlineMode: boolean;
  autoUpload: boolean;
  compressionQuality: number; // 0-100
}

interface ScannerDevice {
  id: string;
  name: string;
  type: 'mobile' | 'handheld' | 'fixed';
  status: 'online' | 'offline' | 'error';
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen: Date;
  location?: {
    warehouseId: string;
    warehouseName: string;
  };
  employee?: {
    id: string;
    name: string;
  };
  capabilities: {
    qrCode: boolean;
    barcode: boolean;
    camera: boolean;
    gps: boolean;
    wifi: boolean;
    bluetooth: boolean;
  };
}

interface SerialNumberScannerProps {
  warehouseId?: string;
  taskId?: string;
  onScanComplete?: (result: ScanResult) => void;
  onSessionComplete?: (session: ScanSession) => void;
}

export function SerialNumberScanner({ warehouseId, taskId, onScanComplete, onSessionComplete }: SerialNumberScannerProps) {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null);
  const [devices, setDevices] = useState<ScannerDevice[]>([]);
  const [settings, setSettings] = useState<ScannerSettings>({
    autoFocus: true,
    flashlight: false,
    soundEnabled: true,
    vibrationEnabled: true,
    continuousMode: false,
    scanDelay: 1000,
    confidenceThreshold: 80,
    duplicateDetection: true,
    offlineMode: false,
    autoUpload: true,
    compressionQuality: 80
  });
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [selectedAction, setSelectedAction] = useState<ScanResult['action']>('receive');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock data for scan results
  const mockScanResults: ScanResult[] = [
    {
      id: 'scan-001',
      serialNumber: 'SN2024001001',
      scanType: 'qr',
      timestamp: new Date('2024-01-25T10:30:00'),
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-a',
        zoneName: 'โซน A',
        position: 'ชั้น A1-01'
      },
      employee: {
        id: 'emp-001',
        name: 'สมชาย ใจดี',
        role: 'พนักงานรับสินค้า'
      },
      device: {
        id: 'device-001',
        name: 'Scanner Mobile 01',
        type: 'mobile'
      },
      product: {
        sku: 'SOFA-CP-3S-BRN',
        name: 'โซฟา 3 ที่นั่ง รุ่น Comfort Plus',
        category: 'เฟอร์นิเจอร์'
      },
      action: 'receive',
      status: 'success',
      confidence: 95,
      notes: 'สแกนสำเร็จ สินค้าอยู่ในสภาพดี'
    },
    {
      id: 'scan-002',
      serialNumber: 'SN2024001002',
      scanType: 'barcode',
      timestamp: new Date('2024-01-25T11:15:00'),
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-b',
        zoneName: 'โซน B',
        position: 'ชั้น B2-05'
      },
      employee: {
        id: 'emp-002',
        name: 'สมหญิง รักงาน',
        role: 'พนักงานจัดเก็บ'
      },
      device: {
        id: 'device-002',
        name: 'Handheld Scanner 02',
        type: 'handheld'
      },
      product: {
        sku: 'WARD-CL-4D-WHT',
        name: 'ตู้เสื้อผ้า 4 บาน รุ่น Classic',
        category: 'เฟอร์นิเจอร์'
      },
      action: 'move',
      status: 'success',
      confidence: 88,
      notes: 'ย้ายจากโซน A ไปโซน B'
    },
    {
      id: 'scan-003',
      serialNumber: 'SN2024001XXX',
      scanType: 'qr',
      timestamp: new Date('2024-01-25T12:00:00'),
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-c',
        zoneName: 'โซน C'
      },
      employee: {
        id: 'emp-003',
        name: 'สมปอง ขยัน',
        role: 'พนักงานขาย'
      },
      device: {
        id: 'device-001',
        name: 'Scanner Mobile 01',
        type: 'mobile'
      },
      action: 'inspect',
      status: 'error',
      confidence: 45,
      notes: 'QR Code เสียหาย อ่านไม่ได้ชัดเจน'
    }
  ];

  // Mock devices
  const mockDevices: ScannerDevice[] = [
    {
      id: 'device-001',
      name: 'Scanner Mobile 01',
      type: 'mobile',
      status: 'online',
      batteryLevel: 85,
      signalStrength: 90,
      lastSeen: new Date(),
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก'
      },
      employee: {
        id: 'emp-001',
        name: 'สมชาย ใจดี'
      },
      capabilities: {
        qrCode: true,
        barcode: true,
        camera: true,
        gps: true,
        wifi: true,
        bluetooth: true
      }
    },
    {
      id: 'device-002',
      name: 'Handheld Scanner 02',
      type: 'handheld',
      status: 'online',
      batteryLevel: 60,
      signalStrength: 75,
      lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก'
      },
      employee: {
        id: 'emp-002',
        name: 'สมหญิง รักงาน'
      },
      capabilities: {
        qrCode: true,
        barcode: true,
        camera: false,
        gps: false,
        wifi: true,
        bluetooth: true
      }
    },
    {
      id: 'device-003',
      name: 'Fixed Scanner 03',
      type: 'fixed',
      status: 'offline',
      lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก'
      },
      capabilities: {
        qrCode: true,
        barcode: true,
        camera: true,
        gps: false,
        wifi: true,
        bluetooth: false
      }
    }
  ];

  useEffect(() => {
    setScanResults(mockScanResults);
    setDevices(mockDevices);
  }, []);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาต');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Simulate scan
  const simulateScan = (serialNumber: string, scanType: 'qr' | 'barcode' | 'manual') => {
    const newScan: ScanResult = {
      id: `scan-${Date.now()}`,
      serialNumber,
      scanType,
      timestamp: new Date(),
      location: {
        warehouseId: warehouseId || 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-a',
        zoneName: 'โซน A'
      },
      employee: {
        id: 'emp-001',
        name: 'ผู้ใช้ปัจจุบัน',
        role: 'พนักงาน'
      },
      device: {
        id: 'device-current',
        name: 'อุปกรณ์ปัจจุบัน',
        type: 'mobile'
      },
      action: selectedAction,
      status: serialNumber.includes('X') ? 'error' : 'success',
      confidence: serialNumber.includes('X') ? 45 : 95,
      notes: scanType === 'manual' ? 'ป้อนด้วยตนเอง' : 'สแกนอัตโนมัติ'
    };

    setScanResults(prev => [newScan, ...prev]);
    
    if (onScanComplete) {
      onScanComplete(newScan);
    }

    // Play sound if enabled
    if (settings.soundEnabled) {
      const audio = new Audio('/sounds/beep.mp3');
      audio.play().catch(() => {});
    }

    // Vibrate if enabled and supported
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  const handleManualScan = () => {
    if (manualInput.trim()) {
      simulateScan(manualInput.trim(), 'manual');
      setManualInput('');
    }
  };

  const getStatusBadge = (status: ScanResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 text-white">สำเร็จ</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">เตือน</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">ผิดพลาด</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getScanTypeIcon = (scanType: ScanResult['scanType']) => {
    switch (scanType) {
      case 'qr':
        return <QrCode className="w-4 h-4 text-blue-500" />;
      case 'barcode':
        return <Scan className="w-4 h-4 text-green-500" />;
      case 'manual':
        return <Edit className="w-4 h-4 text-orange-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDeviceStatusBadge = (status: ScannerDevice['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500 text-white">ออนไลน์</Badge>;
      case 'offline':
        return <Badge className="bg-gray-500 text-white">ออฟไลน์</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">ข้อผิดพลาด</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const filteredResults = scanResults.filter(result => {
    const matchesSearch = searchTerm === '' || 
      result.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || result.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scan className="w-6 h-6" />
            สแกน Serial Number
          </h2>
          <p className="text-muted-foreground">
            สแกน QR Code และ Barcode เพื่อติดตาม Serial Number
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showDevices} onOpenChange={setShowDevices}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Smartphone className="w-4 h-4 mr-2" />
                อุปกรณ์ ({devices.filter(d => d.status === 'online').length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>อุปกรณ์สแกน</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {devices.map((device) => (
                  <div key={device.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{device.name}</h4>
                          {getDeviceStatusBadge(device.status)}
                          <Badge variant="outline" className="text-xs">
                            {device.type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">ตำแหน่ง:</span>
                            <p className="font-medium">{device.location?.warehouseName || 'ไม่ทราบ'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ผู้ใช้:</span>
                            <p className="font-medium">{device.employee?.name || 'ไม่มี'}</p>
                          </div>
                          {device.batteryLevel && (
                            <div>
                              <span className="text-muted-foreground">แบตเตอรี่:</span>
                              <div className="flex items-center gap-2">
                                <Battery className={`w-4 h-4 ${
                                  device.batteryLevel > 50 ? 'text-green-500' :
                                  device.batteryLevel > 20 ? 'text-yellow-500' : 'text-red-500'
                                }`} />
                                <span className="font-medium">{device.batteryLevel}%</span>
                              </div>
                            </div>
                          )}
                          {device.signalStrength && (
                            <div>
                              <span className="text-muted-foreground">สัญญาณ:</span>
                              <div className="flex items-center gap-2">
                                <Signal className={`w-4 h-4 ${
                                  device.signalStrength > 70 ? 'text-green-500' :
                                  device.signalStrength > 40 ? 'text-yellow-500' : 'text-red-500'
                                }`} />
                                <span className="font-medium">{device.signalStrength}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          เห็นล่าสุด: {formatDate(device.lastSeen)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                ตั้งค่า
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ตั้งค่าการสแกน</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>โฟกัสอัตโนมัติ</Label>
                    <Switch 
                      checked={settings.autoFocus} 
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoFocus: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>ไฟแฟลช</Label>
                    <Switch 
                      checked={settings.flashlight} 
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, flashlight: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>เสียงแจ้งเตือน</Label>
                    <Switch 
                      checked={settings.soundEnabled} 
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundEnabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>การสั่น</Label>
                    <Switch 
                      checked={settings.vibrationEnabled} 
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, vibrationEnabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>โหมดต่อเนื่อง</Label>
                    <Switch 
                      checked={settings.continuousMode} 
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, continuousMode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>ตรวจจับซ้ำ</Label>
                    <Switch 
                      checked={settings.duplicateDetection} 
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, duplicateDetection: checked }))}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>ความล่าช้าการสแกน (มิลลิวินาที)</Label>
                    <Input 
                      type="number" 
                      value={settings.scanDelay} 
                      onChange={(e) => setSettings(prev => ({ ...prev, scanDelay: parseInt(e.target.value) || 1000 }))}
                      min="0"
                      max="5000"
                    />
                  </div>
                  <div>
                    <Label>เกณฑ์ความมั่นใจ (%)</Label>
                    <Input 
                      type="number" 
                      value={settings.confidenceThreshold} 
                      onChange={(e) => setSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) || 80 }))}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={() => setShowSettings(false)}>
                    บันทึก
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="w-4 h-4 mr-2" />
            ประวัติ
          </Button>
        </div>
      </div>

      {/* Scanner Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                กล้องสแกน
              </span>
              <div className="flex items-center gap-2">
                {settings.flashlight && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, flashlight: !prev.flashlight }))}
                  >
                    {settings.flashlight ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                  </Button>
                )}
                {settings.soundEnabled ? 
                  <Volume2 className="w-4 h-4 text-green-500" /> : 
                  <VolumeX className="w-4 h-4 text-gray-400" />
                }
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {isScanning ? (
                  <>
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas 
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ display: 'none' }}
                    />
                    {/* Scan Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg animate-pulse">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                      </div>
                    </div>
                    {/* Status Overlay */}
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <span>กำลังสแกน...</span>
                          <div className="flex items-center gap-2">
                            {settings.autoFocus && <Target className="w-4 h-4" />}
                            {settings.continuousMode && <RefreshCw className="w-4 h-4 animate-spin" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">กดเริ่มสแกนเพื่อเปิดกล้อง</p>
                      <Button onClick={initializeCamera}>
                        <Camera className="w-4 h-4 mr-2" />
                        เริ่มสแกน
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-center gap-2">
                {isScanning ? (
                  <>
                    <Button variant="outline" onClick={stopCamera}>
                      <X className="w-4 h-4 mr-2" />
                      หยุดสแกน
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => simulateScan('SN2024001001', 'qr')}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      จำลอง QR
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => simulateScan('SN2024001002', 'barcode')}
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      จำลอง Barcode
                    </Button>
                  </>
                ) : (
                  <Button onClick={initializeCamera}>
                    <Camera className="w-4 h-4 mr-2" />
                    เริ่มสแกน
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Input & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              ป้อนข้อมูลด้วยตนเอง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Action Selection */}
              <div>
                <Label>การดำเนินการ</Label>
                <Select value={selectedAction} onValueChange={(value: ScanResult['action']) => setSelectedAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receive">รับสินค้า</SelectItem>
                    <SelectItem value="move">ย้ายสินค้า</SelectItem>
                    <SelectItem value="pick">หยิบสินค้า</SelectItem>
                    <SelectItem value="pack">แพ็คสินค้า</SelectItem>
                    <SelectItem value="ship">จัดส่งสินค้า</SelectItem>
                    <SelectItem value="count">นับสินค้า</SelectItem>
                    <SelectItem value="inspect">ตรวจสอบสินค้า</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Manual Input */}
              <div>
                <Label>Serial Number</Label>
                <div className="flex gap-2">
                  <Input 
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="ป้อน Serial Number"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                  />
                  <Button onClick={handleManualScan} disabled={!manualInput.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <Label>การดำเนินการด่วน</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => simulateScan('SN2024001001', 'manual')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    ทดสอบ SN ปกติ
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => simulateScan('SN2024001XXX', 'manual')}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    ทดสอบ SN ผิดพลาด
                  </Button>
                </div>
              </div>

              {/* Current Session Info */}
              {currentSession && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">เซสชันปัจจุบัน</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>ชื่อ: {currentSession.sessionName}</div>
                    <div>เริ่มเมื่อ: {formatDate(currentSession.startTime)}</div>
                    <div>สแกนแล้ว: {currentSession.totalScans} ครั้ง</div>
                    <div>สำเร็จ: {currentSession.successfulScans} ครั้ง</div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {scanResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-green-600">สำเร็จ</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {scanResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-red-600">ผิดพลาด</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-5 h-5" />
                ประวัติการสแกน
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="ค้นหา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="success">สำเร็จ</SelectItem>
                    <SelectItem value="warning">เตือน</SelectItem>
                    <SelectItem value="error">ผิดพลาด</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีประวัติการสแกน</p>
                </div>
              ) : (
                filteredResults.map((result) => (
                  <div key={result.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getScanTypeIcon(result.scanType)}
                          <h4 className="font-medium">{result.serialNumber}</h4>
                          {getStatusBadge(result.status)}
                          <Badge variant="outline" className="text-xs">
                            {result.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(result.timestamp)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">สินค้า:</span>
                            <p className="font-medium">{result.product?.name || 'ไม่ทราบ'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ตำแหน่ง:</span>
                            <p className="font-medium">{result.location.warehouseName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ผู้สแกน:</span>
                            <p className="font-medium">{result.employee.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>ความมั่นใจ: {result.confidence}%</span>
                          <span>อุปกรณ์: {result.device.name}</span>
                        </div>
                        {result.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            {result.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}