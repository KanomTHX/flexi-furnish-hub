import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Search, Package, Hash, Calendar, DollarSign, X } from 'lucide-react';
import { SerialNumber, SerialNumberSelection, Product } from '@/types/pos';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { formatCurrency } from '@/utils/reportHelpers';

interface SerialNumberSelectorProps {
  branchId: string;
  selectedProducts: Product[];
  onSelectionChange: (selections: SerialNumberSelection[]) => void;
  initialSelections?: SerialNumberSelection[];
}

export function SerialNumberSelector({
  branchId,
  selectedProducts,
  onSelectionChange,
  initialSelections = []
}: SerialNumberSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selections, setSelections] = useState<SerialNumberSelection[]>(initialSelections);
  const [availableSerialNumbers, setAvailableSerialNumbers] = useState<Record<string, SerialNumber[]>>({});
  const [loading, setLoading] = useState(false);
  
  const { getAvailableSerialNumbers } = useSerialNumbers();
  const { toast } = useToast();

  // โหลด Serial Numbers ที่พร้อมใช้งานสำหรับแต่ละสินค้า
  useEffect(() => {
    const loadAvailableSerialNumbers = async () => {
      setLoading(true);
      try {
        const serialNumbersData: Record<string, SerialNumber[]> = {};
        
        for (const product of selectedProducts) {
          const serialNumbers = await getAvailableSerialNumbers(product.id, branchId);
          serialNumbersData[product.id] = serialNumbers;
        }
        
        setAvailableSerialNumbers(serialNumbersData);
        
        // สร้าง initial selections ถ้ายังไม่มี
        if (selections.length === 0) {
          const initialSelections = selectedProducts.map(product => ({
            productId: product.id,
            productName: product.name,
            serialNumbers: serialNumbersData[product.id] || [],
            selectedSerialNumbers: [],
            totalQuantity: 0,
            unitPrice: product.price,
            totalPrice: 0
          }));
          setSelections(initialSelections);
        }
      } catch (error) {
        console.error('Error loading serial numbers:', error);
        toast({
          title: 'ข้อผิดพลาด',
          description: 'ไม่สามารถโหลดข้อมูล Serial Numbers ได้',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedProducts.length > 0) {
      loadAvailableSerialNumbers();
    }
  }, [selectedProducts, branchId, getAvailableSerialNumbers]);

  // อัปเดต selections เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    onSelectionChange(selections);
  }, [selections, onSelectionChange]);

  // จัดการการเลือก/ยกเลิกเลือก Serial Number
  const handleSerialNumberToggle = (productId: string, serialNumberId: string, checked: boolean) => {
    setSelections(prev => prev.map(selection => {
      if (selection.productId !== productId) return selection;
      
      const updatedSelectedSerialNumbers = checked
        ? [...selection.selectedSerialNumbers, serialNumberId]
        : selection.selectedSerialNumbers.filter(id => id !== serialNumberId);
      
      const totalQuantity = updatedSelectedSerialNumbers.length;
      const totalPrice = totalQuantity * selection.unitPrice;
      
      return {
        ...selection,
        selectedSerialNumbers: updatedSelectedSerialNumbers,
        totalQuantity,
        totalPrice
      };
    }));
  };

  // ลบ Serial Number ที่เลือกแล้ว
  const handleRemoveSerialNumber = (productId: string, serialNumberId: string) => {
    handleSerialNumberToggle(productId, serialNumberId, false);
  };

  // กรอง Serial Numbers ตามคำค้นหา
  const getFilteredSerialNumbers = (serialNumbers: SerialNumber[]) => {
    if (!searchTerm) return serialNumbers;
    return serialNumbers.filter(sn => 
      sn.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // คำนวณยอดรวมทั้งหมด
  const totalAmount = selections.reduce((sum, selection) => sum + selection.totalPrice, 0);
  const totalQuantity = selections.reduce((sum, selection) => sum + selection.totalQuantity, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            เลือก Serial Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล Serial Numbers...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ช่องค้นหา */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            เลือก Serial Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหา Serial Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {/* สรุปการเลือก */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalQuantity}</div>
              <div className="text-sm text-muted-foreground">รายการที่เลือก</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-muted-foreground">ยอดรวม</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* รายการสินค้าและ Serial Numbers */}
      {selections.map((selection) => {
        const availableSerials = availableSerialNumbers[selection.productId] || [];
        const filteredSerials = getFilteredSerialNumbers(availableSerials);
        
        return (
          <Card key={selection.productId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {selection.productName}
                </div>
                <Badge variant="outline">
                  {selection.totalQuantity} / {availableSerials.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Serial Numbers ที่เลือกแล้ว */}
              {selection.selectedSerialNumbers.length > 0 && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Serial Numbers ที่เลือก:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selection.selectedSerialNumbers.map(serialId => {
                      const serial = availableSerials.find(s => s.id === serialId);
                      if (!serial) return null;
                      
                      return (
                        <Badge key={serialId} variant="secondary" className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {serial.serialNumber}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleRemoveSerialNumber(selection.productId, serialId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                  <Separator className="my-3" />
                </div>
              )}
              
              {/* รายการ Serial Numbers ที่พร้อมใช้งาน */}
              <Label className="text-sm font-medium mb-2 block">Serial Numbers ที่พร้อมใช้งาน:</Label>
              <ScrollArea className="h-48 border rounded-md p-3">
                {filteredSerials.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? 'ไม่พบ Serial Number ที่ค้นหา' : 'ไม่มี Serial Number ที่พร้อมใช้งาน'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSerials.map((serial) => {
                      const isSelected = selection.selectedSerialNumbers.includes(serial.id);
                      
                      return (
                        <div
                          key={serial.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleSerialNumberToggle(selection.productId, serial.id, checked as boolean)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{serial.serialNumber}</span>
                              <Badge variant="outline" className="text-xs">
                                {serial.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {serial.costPrice && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ต้นทุน: {formatCurrency(serial.costPrice)}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                รับเข้า: {new Date(serial.receivedDate).toLocaleDateString('th-TH')}
                              </div>
                            </div>
                            {serial.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{serial.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              
              {/* สรุปสำหรับสินค้านี้ */}
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span>จำนวนที่เลือก:</span>
                  <span className="font-medium">{selection.totalQuantity} รายการ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>ราคาต่อหน่วย:</span>
                  <span className="font-medium">{formatCurrency(selection.unitPrice)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-medium">
                  <span>ยอดรวม:</span>
                  <span className="text-primary">{formatCurrency(selection.totalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default SerialNumberSelector;