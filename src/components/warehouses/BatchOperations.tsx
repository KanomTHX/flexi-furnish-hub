import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Layers, 
  Trash2, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Package,
  Edit,
  ArrowUpDown,
  QrCode,
  History,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { WarehouseService } from '@/services/warehouseService';
import { useBranchData } from '@/hooks/useBranchData';
import type { SerialNumber, StockLevel, Branch } from '@/types/warehouse';

interface BatchOperationsProps {
  branchId?: string;
}

export type BatchOperationType = 
  | 'transfer'
  | 'withdraw'
  | 'adjust'
  | 'status_update'
  | 'price_update'
  | 'export_data'
  | 'import_data';

export interface BatchOperation {
  id: string;
  type: BatchOperationType;
  branchId: string;
  targetBranchId?: string;
  newStatus?: string;
  newPrice?: number;
  adjustmentReason?: string;
  notes?: string;
  serialNumbers: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  createdAt: Date;
  completedAt?: Date;
  performedBy: string;
}

export interface BatchResult {
  serialNumber: string;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  data?: any;
}

export interface ValidationResult {
  serialNumber: string;
  isValid: boolean;
  exists: boolean;
  productName?: string;
  currentStatus?: string;
  warehouseName?: string;
  message?: string;
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  branchId: initialBranchId
}) => {
  // Branch data
  const { currentBranch, branches } = useBranchData();
  const [selectedBranch, setSelectedBranch] = useState(initialBranchId || currentBranch?.id || '');
  // State management
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);

  
  // Batch operation state
  const [batchForm, setBatchForm] = useState({
    type: '' as BatchOperationType | '',
    branchId: selectedBranch,
    targetBranchId: '',
    newStatus: '',
    newPrice: 0,
    adjustmentReason: '',
    notes: '',
    serialNumbers: [] as string[],
    performedBy: 'current-user' // Should come from auth context
  });

  // Processing state
  const [currentOperation, setCurrentOperation] = useState<BatchOperation | null>(null);
  const [operationHistory, setOperationHistory] = useState<BatchOperation[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  
  // Input state
  const [inputText, setInputText] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Load operation history on component mount
  useEffect(() => {
    loadOperationHistory();
  }, []);

  // Load operation history
  const loadOperationHistory = async () => {
    try {
      // For now, we'll use mock data - in real implementation, this would come from database
      const mockHistory: BatchOperation[] = [
        {
          id: 'batch-1',
          type: 'status_update',
          branchId: 'branch-1',
          newStatus: 'damaged',
          serialNumbers: ['SN001', 'SN002', 'SN003'],
          status: 'completed',
          progress: 100,
          totalItems: 3,
          processedItems: 3,
          successfulItems: 3,
          failedItems: 0,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          completedAt: new Date(Date.now() - 86400000 + 300000), // 5 minutes later
          performedBy: 'user-1',
          notes: 'Mark damaged items from inspection'
        }
      ];
      setOperationHistory(mockHistory);
    } catch (error) {
      console.error('Error loading operation history:', error);
    }
  };

  // Handle text input
  const handleTextInput = (text: string) => {
    setInputText(text);
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    setBatchForm(prev => ({ ...prev, serialNumbers: lines }));
    
    if (lines.length > 0) {
      validateSerialNumbers(lines);
    } else {
      setValidationResults([]);
    }
  };

  // Validate serial numbers
  const validateSerialNumbers = async (serialNumbers: string[]) => {
    if (!selectedBranch) {
      toast.error('กรุณาเลือกสาขาก่อน');
      return;
    }

    setLoading(true);
    const results: ValidationResult[] = [];

    try {
      for (const sn of serialNumbers) {
        // Basic format validation
        const isValidFormat = sn.length >= 5 && /^[A-Za-z0-9\-_]+$/.test(sn);
        
        if (!isValidFormat) {
          results.push({
            serialNumber: sn,
            isValid: false,
            exists: false,
            message: 'รูปแบบ Serial Number ไม่ถูกต้อง'
          });
          continue;
        }

        // Check if exists in database
        try {
          const response = await WarehouseService.getSerialNumbers({
            branchId: selectedBranch,
            search: sn,
            limit: 1
          });

          if (response.data.length > 0) {
            const serialNumber = response.data[0];
            results.push({
              serialNumber: sn,
              isValid: true,
              exists: true,
              productName: serialNumber.product?.name,
              currentStatus: serialNumber.status,
              warehouseName: serialNumber.warehouse?.name,
              message: 'พบในระบบ'
            });
          } else {
            results.push({
              serialNumber: sn,
              isValid: true,
              exists: false,
              message: 'ไม่พบในระบบ'
            });
          }
        } catch (error) {
          results.push({
            serialNumber: sn,
            isValid: false,
            exists: false,
            message: 'เกิดข้อผิดพลาดในการตรวจสอบ'
          });
        }
      }

      setValidationResults(results);
      
      const validCount = results.filter(r => r.isValid && r.exists).length;
      const invalidCount = results.length - validCount;
      
      if (validCount > 0) {
        toast.success(`ตรวจสอบเสร็จสิ้น: พบ ${validCount} รายการ, ไม่พบ ${invalidCount} รายการ`);
      } else {
        toast.warning('ไม่พบ Serial Number ที่ถูกต้องในระบบ');
      }

    } catch (error) {
      console.error('Error validating serial numbers:', error);
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบ Serial Number');
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode scan
  const handleScanBarcode = (barcode: string) => {
    if (!batchForm.serialNumbers.includes(barcode)) {
      const newSNs = [...batchForm.serialNumbers, barcode];
      setBatchForm(prev => ({ ...prev, serialNumbers: newSNs }));
      setInputText(newSNs.join('\n'));
      toast.success(`เพิ่ม ${barcode} แล้ว`);
    } else {
      toast.warning('Serial Number นี้มีอยู่แล้ว');
    }
  };

  // Remove serial number
  const removeSerialNumber = (snToRemove: string) => {
    const newSNs = batchForm.serialNumbers.filter(sn => sn !== snToRemove);
    setBatchForm(prev => ({ ...prev, serialNumbers: newSNs }));
    setInputText(newSNs.join('\n'));
    setValidationResults(prev => prev.filter(r => r.serialNumber !== snToRemove));
    toast.success('ลบรายการแล้ว');
  };

  // Clear all
  const clearAll = () => {
    setBatchForm(prev => ({ ...prev, serialNumbers: [] }));
    setInputText('');
    setValidationResults([]);
    toast.success('ล้างข้อมูลทั้งหมดแล้ว');
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        handleTextInput(text);
      };
      reader.readAsText(file);
      toast.success(`นำเข้าไฟล์ ${file.name} แล้ว`);
    }
  };

  // Export data
  const exportData = () => {
    const validResults = validationResults.filter(r => r.isValid && r.exists);
    if (validResults.length === 0) {
      toast.error('ไม่มีข้อมูลที่ถูกต้องสำหรับส่งออก');
      return;
    }

    const csvContent = [
      'Serial Number,Product Name,Status,Warehouse,Message',
      ...validResults.map(r => 
        `${r.serialNumber},${r.productName || ''},${r.currentStatus || ''},${r.warehouseName || ''},${r.message || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `batch_validation_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('ส่งออกข้อมูลเสร็จสิ้น');
  };

  // Process batch operation
  const processBatchOperation = async () => {
    try {
      // Validation
      if (!batchForm.type) {
        toast.error('กรุณาเลือกประเภทการดำเนินการ');
        return;
      }

      if (!selectedBranch) {
        toast.error('กรุณาเลือกสาขา');
        return;
      }

      const validSNs = validationResults.filter(r => r.isValid && r.exists);
      if (validSNs.length === 0) {
        toast.error('ไม่มี Serial Number ที่ถูกต้องสำหรับดำเนินการ');
        return;
      }

      // Additional validation based on operation type
      if (batchForm.type === 'transfer' && !batchForm.targetBranchId) {
        toast.error('กรุณาเลือกสาขาปลายทาง');
        return;
      }

      if (batchForm.type === 'status_update' && !batchForm.newStatus) {
        toast.error('กรุณาเลือกสถานะใหม่');
        return;
      }

      if (batchForm.type === 'adjust' && !batchForm.adjustmentReason) {
        toast.error('กรุณาระบุเหตุผลการปรับปรุง');
        return;
      }

      setLoading(true);

      // Create batch operation
      const operation: BatchOperation = {
        id: `batch-${Date.now()}`,
        type: batchForm.type,
        branchId: selectedBranch,
        targetBranchId: batchForm.targetBranchId,
        newStatus: batchForm.newStatus,
        newPrice: batchForm.newPrice,
        adjustmentReason: batchForm.adjustmentReason,
        notes: batchForm.notes,
        serialNumbers: validSNs.map(r => r.serialNumber),
        status: 'processing',
        progress: 0,
        totalItems: validSNs.length,
        processedItems: 0,
        successfulItems: 0,
        failedItems: 0,
        createdAt: new Date(),
        performedBy: batchForm.performedBy
      };

      setCurrentOperation(operation);

      // Process each serial number
      let processedCount = 0;
      let successCount = 0;
      let failedCount = 0;

      for (const result of validSNs) {
        try {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 500));

          // Process based on operation type
          switch (batchForm.type) {
            case 'status_update':
              // Update status using warehouse service
              await updateSerialNumberStatus(result.serialNumber, batchForm.newStatus);
              break;
            
            case 'transfer':
              // Transfer using warehouse service
              await transferSerialNumber(result.serialNumber, batchForm.targetBranchId);
              break;
            
            case 'adjust':
              // Adjust using warehouse service
              await adjustSerialNumber(result.serialNumber, batchForm.adjustmentReason);
              break;
            
            default:
              throw new Error(`Unsupported operation type: ${batchForm.type}`);
          }

          successCount++;
        } catch (error) {
          console.error(`Error processing ${result.serialNumber}:`, error);
          failedCount++;
        }

        processedCount++;
        const progress = Math.round((processedCount / validSNs.length) * 100);
        
        setCurrentOperation(prev => prev ? {
          ...prev,
          progress,
          processedItems: processedCount,
          successfulItems: successCount,
          failedItems: failedCount
        } : null);
      }

      // Complete operation
      const completedOperation: BatchOperation = {
        ...operation,
        status: failedCount === 0 ? 'completed' : 'completed',
        progress: 100,
        processedItems: processedCount,
        successfulItems: successCount,
        failedItems: failedCount,
        completedAt: new Date()
      };

      setCurrentOperation(completedOperation);
      setOperationHistory(prev => [completedOperation, ...prev]);

      toast.success(`ดำเนินการเสร็จสิ้น: สำเร็จ ${successCount}/${processedCount} รายการ`);

      // Reset form
      setBatchForm({
        type: '',
        branchId: selectedBranch,
        targetBranchId: '',
        newStatus: '',
        newPrice: 0,
        adjustmentReason: '',
        notes: '',
        serialNumbers: [],
        performedBy: 'current-user'
      });
      setInputText('');
      setValidationResults([]);

    } catch (error) {
      console.error('Error processing batch operation:', error);
      toast.error('เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for processing
  const updateSerialNumberStatus = async (serialNumber: string, newStatus: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('product_inventory')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('serial_number', serialNumber);

    if (error) throw error;
  };

  const transferSerialNumber = async (serialNumber: string, targetBranchId: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('product_inventory')
      .update({
        branch_id: targetBranchId,
        status: 'transferred',
        updated_at: new Date().toISOString()
      })
      .eq('serial_number', serialNumber);

    if (error) throw error;
  };

  const adjustSerialNumber = async (serialNumber: string, reason: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('product_inventory')
      .update({
        notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('serial_number', serialNumber);

    if (error) throw error;
  };

  // Get validation summary
  const getValidationSummary = () => {
    const total = validationResults.length;
    const valid = validationResults.filter(r => r.isValid && r.exists).length;
    const invalid = total - valid;
    return { total, valid, invalid };
  };

  const { total, valid, invalid } = getValidationSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6" />
            จัดการกลุ่ม
          </h2>
          <p className="text-muted-foreground">ดำเนินการกับสินค้าหลายรายการพร้อมกัน</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData} disabled={valid === 0}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออกข้อมูล
          </Button>
          <Button onClick={processBatchOperation} disabled={loading || valid === 0}>
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'กำลังดำเนินการ...' : 'เริ่มดำเนินการ'}
          </Button>
        </div>
      </div>

      {/* Branch Selection */}
      <Card>
        <CardHeader>
          <CardTitle>เลือกสาขา</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedBranch} 
            onValueChange={(value) => {
              setSelectedBranch(value);
              setBatchForm(prev => ({ ...prev, branchId: value }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="เลือกสาขา" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Current Operation Progress */}
      {currentOperation && currentOperation.status === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 animate-spin" />
              กำลังดำเนินการ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>ความคืบหน้า</span>
                  <span>{currentOperation.progress}%</span>
                </div>
                <Progress value={currentOperation.progress} className="w-full" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{currentOperation.processedItems}</p>
                  <p className="text-sm text-muted-foreground">ดำเนินการแล้ว</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{currentOperation.successfulItems}</p>
                  <p className="text-sm text-muted-foreground">สำเร็จ</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{currentOperation.failedItems}</p>
                  <p className="text-sm text-muted-foreground">ล้มเหลว</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedBranch && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">สร้างการดำเนินการ</TabsTrigger>
            <TabsTrigger value="validate">ตรวจสอบข้อมูล ({total})</TabsTrigger>
            <TabsTrigger value="history">ประวัติ</TabsTrigger>
          </TabsList>

          {/* Create Operation Tab */}
          <TabsContent value="create" className="space-y-6">
            {/* Operation Type */}
            <Card>
              <CardHeader>
                <CardTitle>เลือกประเภทการดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="operationType">ประเภทการดำเนินการ</Label>
                  <Select 
                    value={batchForm.type} 
                    onValueChange={(value: BatchOperationType) => setBatchForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทการดำเนินการ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status_update">อัปเดตสถานะ</SelectItem>
                      <SelectItem value="transfer">โอนย้ายสาขา</SelectItem>
                      <SelectItem value="adjust">ปรับปรุงข้อมูล</SelectItem>
                      <SelectItem value="price_update">อัปเดตราคา</SelectItem>
                      <SelectItem value="export_data">ส่งออกข้อมูล</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional fields based on operation type */}
                {batchForm.type === 'transfer' && (
                  <div>
                    <Label htmlFor="targetBranch">สาขาปลายทาง</Label>
                    <Select 
                      value={batchForm.targetBranchId} 
                      onValueChange={(value) => setBatchForm(prev => ({ ...prev, targetBranchId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสาขาปลายทาง" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches
                          .filter(b => b.id !== selectedBranch)
                          .map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} ({branch.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {batchForm.type === 'status_update' && (
                  <div>
                    <Label htmlFor="newStatus">สถานะใหม่</Label>
                    <Select 
                      value={batchForm.newStatus} 
                      onValueChange={(value) => setBatchForm(prev => ({ ...prev, newStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสถานะใหม่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">พร้อมใช้งาน</SelectItem>
                        <SelectItem value="damaged">เสียหาย</SelectItem>
                        <SelectItem value="claimed">เคลม</SelectItem>
                        <SelectItem value="reserved">จอง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {batchForm.type === 'price_update' && (
                  <div>
                    <Label htmlFor="newPrice">ราคาใหม่</Label>
                    <Input
                      id="newPrice"
                      type="number"
                      value={batchForm.newPrice}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, newPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                {batchForm.type === 'adjust' && (
                  <div>
                    <Label htmlFor="adjustmentReason">เหตุผลการปรับปรุง</Label>
                    <Textarea
                      id="adjustmentReason"
                      value={batchForm.adjustmentReason}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, adjustmentReason: e.target.value }))}
                      placeholder="ระบุเหตุผลการปรับปรุง"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Textarea
                    id="notes"
                    value={batchForm.notes}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="หมายเหตุเพิ่มเติม"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Serial Number Input */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Serial Numbers</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScanner(!showScanner)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    สแกน
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-import')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    นำเข้าไฟล์
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    disabled={batchForm.serialNumbers.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    ล้างทั้งหมด
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  id="file-import"
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileImport}
                  className="hidden"
                />

                {showScanner && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">สแกนบาร์โค้ด</h4>
                      <Button variant="ghost" size="sm" onClick={() => setShowScanner(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="สแกนหรือพิมพ์ Serial Number"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              handleScanBarcode(value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="serialNumbers">Serial Numbers (หนึ่งรายการต่อบรรทัด)</Label>
                  <Textarea
                    id="serialNumbers"
                    value={inputText}
                    onChange={(e) => handleTextInput(e.target.value)}
                    placeholder="ป้อน Serial Numbers หนึ่งรายการต่อบรรทัด"
                    rows={8}
                    disabled={loading}
                  />
                </div>

                {batchForm.serialNumbers.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {batchForm.serialNumbers.length} รายการ
                    </span>
                    <Button
                      onClick={() => validateSerialNumbers(batchForm.serialNumbers)}
                      disabled={loading || !selectedBranch}
                      size="sm"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      ตรวจสอบ
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validate" className="space-y-6">
            {/* Validation Summary */}
            {validationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>สรุปผลการตรวจสอบ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{total}</p>
                      <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{valid}</p>
                      <p className="text-sm text-muted-foreground">ถูกต้อง</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{invalid}</p>
                      <p className="text-sm text-muted-foreground">ไม่ถูกต้อง</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation Results */}
            <Card>
              <CardHeader>
                <CardTitle>ผลการตรวจสอบ</CardTitle>
              </CardHeader>
              <CardContent>
                {validationResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีข้อมูลที่ตรวจสอบ</p>
                    <p className="text-sm">กลับไปที่แท็บ "สร้างการดำเนินการ" เพื่อเพิ่มข้อมูล</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead>สถานะปัจจุบัน</TableHead>
                        <TableHead>คลัง</TableHead>
                        <TableHead>ผลการตรวจสอบ</TableHead>
                        <TableHead>การดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResults.map((result) => (
                        <TableRow key={result.serialNumber}>
                          <TableCell className="font-mono">{result.serialNumber}</TableCell>
                          <TableCell>
                            {result.productName || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.currentStatus ? (
                              <Badge variant="outline">{result.currentStatus}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.warehouseName || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {result.isValid && result.exists ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">{result.message}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSerialNumber(result.serialNumber)}
                            >
                              <X className="h-4 w-4" />
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

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ประวัติการดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent>
                {operationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีประวัติการดำเนินการ</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>วันที่</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>จำนวน</TableHead>
                        <TableHead>ผลลัพธ์</TableHead>
                        <TableHead>การดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operationHistory.map((operation) => (
                        <TableRow key={operation.id}>
                          <TableCell>
                            {operation.createdAt.toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{operation.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={operation.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {operation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{operation.totalItems}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="text-green-600">{operation.successfulItems} สำเร็จ</span>
                              {operation.failedItems > 0 && (
                                <span className="text-red-600 ml-2">{operation.failedItems} ล้มเหลว</span>
                              )}
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
      )}
    </div>
  );
};

export default BatchOperations;