import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  RotateCcw, 
  Filter,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface FilterState {
  accounts: any;
  journalEntries: any;
  transactions: any;
}

interface ClearFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: FilterState;
  onClearAllFilters: () => void;
  onClearAccountFilter: () => void;
  onClearJournalEntryFilter: () => void;
  onClearTransactionFilter: () => void;
}

export function ClearFiltersDialog({ 
  open, 
  onOpenChange, 
  currentFilters,
  onClearAllFilters,
  onClearAccountFilter,
  onClearJournalEntryFilter,
  onClearTransactionFilter
}: ClearFiltersDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Count active filters
  const getActiveFiltersCount = (filter: any) => {
    if (!filter) return 0;
    return Object.keys(filter).filter(key => {
      const value = filter[key];
      return value !== undefined && value !== null && value !== '' && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;
  };

  const accountFiltersCount = getActiveFiltersCount(currentFilters.accounts);
  const journalFiltersCount = getActiveFiltersCount(currentFilters.journalEntries);
  const transactionFiltersCount = getActiveFiltersCount(currentFilters.transactions);
  const totalFiltersCount = accountFiltersCount + journalFiltersCount + transactionFiltersCount;

  const handleClearAll = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onClearAllFilters();
      toast({
        title: "ล้างตัวกรองสำเร็จ",
        description: "ตัวกรองทั้งหมดถูกล้างแล้ว",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถล้างตัวกรองได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearSpecific = async (type: 'accounts' | 'journal' | 'transactions') => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      switch (type) {
        case 'accounts':
          onClearAccountFilter();
          toast({
            title: "ล้างตัวกรองบัญชี",
            description: "ตัวกรองบัญชีถูกล้างแล้ว",
          });
          break;
        case 'journal':
          onClearJournalEntryFilter();
          toast({
            title: "ล้างตัวกรองรายการบัญชี",
            description: "ตัวกรองรายการบัญชีถูกล้างแล้ว",
          });
          break;
        case 'transactions':
          onClearTransactionFilter();
          toast({
            title: "ล้างตัวกรองธุรกรรม",
            description: "ตัวกรองธุรกรรมถูกล้างแล้ว",
          });
          break;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถล้างตัวกรองได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilterDetails = (filter: any, type: string) => {
    if (!filter) return [];
    
    const details: string[] = [];
    
    Object.keys(filter).forEach(key => {
      const value = filter[key];
      if (value !== undefined && value !== null && value !== '' && 
          (Array.isArray(value) ? value.length > 0 : true)) {
        
        let displayValue = value;
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'ใช่' : 'ไม่';
        }
        
        details.push(`${key}: ${displayValue}`);
      }
    });
    
    return details;
  };

  if (totalFiltersCount === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              ล้างตัวกรอง
            </DialogTitle>
            <DialogDescription>
              จัดการตัวกรองข้อมูลในระบบบัญชี
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-medium mb-2">ไม่มีตัวกรองที่ใช้งาน</h3>
            <p className="text-muted-foreground">
              ขณะนี้ไม่มีตัวกรองใดที่กำลังใช้งานอยู่
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ล้างตัวกรอง
          </DialogTitle>
          <DialogDescription>
            จัดการตัวกรองข้อมูลในระบบบัญชี ({totalFiltersCount} ตัวกรองที่ใช้งาน)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    ตัวกรองที่ใช้งานทั้งหมด
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  {totalFiltersCount} ตัวกรอง
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Filter Categories */}
          <div className="space-y-3">
            {/* Account Filters */}
            {accountFiltersCount > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      ตัวกรองบัญชี
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{accountFiltersCount} ตัวกรอง</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearSpecific('accounts')}
                        disabled={loading}
                      >
                        <X className="w-3 h-3 mr-1" />
                        ล้าง
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {getFilterDetails(currentFilters.accounts, 'accounts').map((detail, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {detail}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Journal Entry Filters */}
            {journalFiltersCount > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      ตัวกรองรายการบัญชี
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{journalFiltersCount} ตัวกรอง</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearSpecific('journal')}
                        disabled={loading}
                      >
                        <X className="w-3 h-3 mr-1" />
                        ล้าง
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {getFilterDetails(currentFilters.journalEntries, 'journal').map((detail, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {detail}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Filters */}
            {transactionFiltersCount > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      ตัวกรองธุรกรรม
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{transactionFiltersCount} ตัวกรอง</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearSpecific('transactions')}
                        disabled={loading}
                      >
                        <X className="w-3 h-3 mr-1" />
                        ล้าง
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {getFilterDetails(currentFilters.transactions, 'transactions').map((detail, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {detail}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Warning */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800 mb-1">คำเตือน</div>
                  <div className="text-sm text-yellow-700">
                    การล้างตัวกรองจะทำให้ข้อมูลทั้งหมดแสดงขึ้นมา 
                    และคุณจะต้องตั้งค่าตัวกรองใหม่หากต้องการกรองข้อมูล
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleClearAll} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {loading ? 'กำลังล้าง...' : 'ล้างตัวกรองทั้งหมด'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}