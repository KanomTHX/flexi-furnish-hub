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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Save,
  X
} from 'lucide-react';

interface JournalEntryLine {
  id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
}

interface CreateJournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onCreateEntry: (entry: any) => void;
}

export function CreateJournalEntryDialog({ 
  open, 
  onOpenChange, 
  accounts, 
  onCreateEntry 
}: CreateJournalEntryDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    notes: ''
  });

  const [journalLines, setJournalLines] = useState<JournalEntryLine[]>([
    {
      id: '1',
      accountId: '',
      accountName: '',
      accountCode: '',
      description: '',
      debit: 0,
      credit: 0
    },
    {
      id: '2',
      accountId: '',
      accountName: '',
      accountCode: '',
      description: '',
      debit: 0,
      credit: 0
    }
  ]);

  const [errors, setErrors] = useState<string[]>([]);

  // Calculate totals
  const totalDebit = journalLines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = journalLines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLineChange = (lineId: string, field: string, value: any) => {
    setJournalLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value };
        
        // If account is selected, update account info
        if (field === 'accountId' && value) {
          const account = accounts.find(acc => acc.id === value);
          if (account) {
            updatedLine.accountName = account.name;
            updatedLine.accountCode = account.code;
          }
        }
        
        // Ensure only debit or credit has value, not both
        if (field === 'debit' && value > 0) {
          updatedLine.credit = 0;
        } else if (field === 'credit' && value > 0) {
          updatedLine.debit = 0;
        }
        
        return updatedLine;
      }
      return line;
    }));
  };

  const addJournalLine = () => {
    const newLine: JournalEntryLine = {
      id: Date.now().toString(),
      accountId: '',
      accountName: '',
      accountCode: '',
      description: '',
      debit: 0,
      credit: 0
    };
    setJournalLines(prev => [...prev, newLine]);
  };

  const removeJournalLine = (lineId: string) => {
    if (journalLines.length > 2) {
      setJournalLines(prev => prev.filter(line => line.id !== lineId));
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.description.trim()) {
      errors.push('กรุณากรอกคำอธิบายรายการ');
    }

    if (!formData.date) {
      errors.push('กรุณาเลือกวันที่');
    }

    // Check if all lines have accounts selected
    const linesWithoutAccount = journalLines.filter(line => !line.accountId);
    if (linesWithoutAccount.length > 0) {
      errors.push('กรุณาเลือกบัญชีสำหรับทุกรายการ');
    }

    // Check if all lines have either debit or credit
    const linesWithoutAmount = journalLines.filter(line => 
      (!line.debit || line.debit === 0) && (!line.credit || line.credit === 0)
    );
    if (linesWithoutAmount.length > 0) {
      errors.push('กรุณากรอกจำนวนเงินสำหรับทุกรายการ');
    }

    // Check if journal is balanced
    if (!isBalanced) {
      errors.push('รายการบัญชีไม่สมดุล (เดบิต ≠ เครดิต)');
    }

    // Check minimum amount
    if (totalDebit === 0 || totalCredit === 0) {
      errors.push('จำนวนเงินต้องมากกว่า 0');
    }

    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newJournalEntry = {
        id: `JE-${Date.now()}`,
        entryNumber: `JE${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
        date: formData.date,
        reference: formData.reference,
        description: formData.description,
        notes: formData.notes,
        lines: journalLines.filter(line => line.accountId && (line.debit > 0 || line.credit > 0)),
        totalDebit,
        totalCredit,
        status: 'pending',
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        approvedBy: null,
        approvedAt: null
      };

      onCreateEntry(newJournalEntry);
      
      toast({
        title: "สร้างรายการบัญชีสำเร็จ",
        description: `รายการ ${newJournalEntry.entryNumber} ถูกสร้างและรอการอนุมัติ`,
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        notes: ''
      });
      
      setJournalLines([
        {
          id: '1',
          accountId: '',
          accountName: '',
          accountCode: '',
          description: '',
          debit: 0,
          credit: 0
        },
        {
          id: '2',
          accountId: '',
          accountName: '',
          accountCode: '',
          description: '',
          debit: 0,
          credit: 0
        }
      ]);
      
      setErrors([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายการบัญชีได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      notes: ''
    });
    setJournalLines([
      {
        id: '1',
        accountId: '',
        accountName: '',
        accountCode: '',
        description: '',
        debit: 0,
        credit: 0
      },
      {
        id: '2',
        accountId: '',
        accountName: '',
        accountCode: '',
        description: '',
        debit: 0,
        credit: 0
      }
    ]);
    setErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            สร้างรายการบัญชี (Journal Entry)
          </DialogTitle>
          <DialogDescription>
            สร้างรายการบัญชีใหม่ตามหลักการบัญชีคู่
          </DialogDescription>
        </DialogHeader>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลหัวรายการ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    วันที่ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">เลขที่อ้างอิง</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    placeholder="เช่น INV-001, REC-001"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">
                  คำอธิบายรายการ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="เช่น ขายสินค้าเงินสด, รับชำระหนี้จากลูกค้า"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Journal Lines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">รายการบัญชี</CardTitle>
                <Button onClick={addJournalLine} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มรายการ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-4">บัญชี</div>
                  <div className="col-span-3">คำอธิบาย</div>
                  <div className="col-span-2">เดบิต</div>
                  <div className="col-span-2">เครดิต</div>
                  <div className="col-span-1">ลบ</div>
                </div>

                {/* Journal Lines */}
                {journalLines.map((line, index) => (
                  <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Select
                        value={line.accountId}
                        onValueChange={(value) => handleLineChange(line.id, 'accountId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกบัญชี" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                  {account.code}
                                </span>
                                <span>{account.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-3">
                      <Input
                        value={line.description}
                        onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                        placeholder="คำอธิบาย"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={line.debit || ''}
                        onChange={(e) => handleLineChange(line.id, 'debit', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="text-right"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={line.credit || ''}
                        onChange={(e) => handleLineChange(line.id, 'credit', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="text-right"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeJournalLine(line.id)}
                        disabled={journalLines.length <= 2}
                        className="w-full"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-12 gap-2 items-center font-medium">
                    <div className="col-span-7 text-right">รวม:</div>
                    <div className="col-span-2">
                      <div className="text-right p-2 bg-gray-50 rounded">
                        {totalDebit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-right p-2 bg-gray-50 rounded">
                        {totalCredit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="flex justify-center">
                        {isBalanced ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <Badge variant={isBalanced ? "default" : "destructive"}>
                      {isBalanced ? "รายการสมดุล" : `ต่างกัน ${Math.abs(totalDebit - totalCredit).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isBalanced}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}