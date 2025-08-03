import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  DollarSign,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  totalDebit: number;
  totalCredit: number;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: string;
  lines: any[];
  notes?: string;
}

interface PendingApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingEntries: JournalEntry[];
  onApprove: (entryId: string, approvedBy: string, notes?: string) => void;
  onReject: (entryId: string, rejectedBy: string, reason: string) => void;
}

export function PendingApprovalDialog({ 
  open, 
  onOpenChange, 
  pendingEntries,
  onApprove,
  onReject
}: PendingApprovalDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  // Filter entries based on search
  const filteredEntries = pendingEntries.filter(entry =>
    entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowApprovalForm(true);
    setShowRejectionForm(false);
  };

  const handleReject = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowRejectionForm(true);
    setShowApprovalForm(false);
  };

  const confirmApproval = () => {
    if (selectedEntry) {
      onApprove(selectedEntry.id, 'current-user', approvalNotes);
      toast({
        title: "อนุมัติรายการสำเร็จ",
        description: `รายการ ${selectedEntry.entryNumber} ได้รับการอนุมัติแล้ว`,
      });
      resetForms();
    }
  };

  const confirmRejection = () => {
    if (selectedEntry && rejectionReason.trim()) {
      onReject(selectedEntry.id, 'current-user', rejectionReason);
      toast({
        title: "ปฏิเสธรายการแล้ว",
        description: `รายการ ${selectedEntry.entryNumber} ถูกปฏิเสธ`,
        variant: "destructive"
      });
      resetForms();
    } else {
      toast({
        title: "กรุณากรอกเหตุผล",
        description: "กรุณากรอกเหตุผลในการปฏิเสธรายการ",
        variant: "destructive"
      });
    }
  };

  const resetForms = () => {
    setSelectedEntry(null);
    setApprovalNotes('');
    setRejectionReason('');
    setShowApprovalForm(false);
    setShowRejectionForm(false);
  };

  const viewEntryDetails = (entry: JournalEntry) => {
    setSelectedEntry(entry);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">รออนุมัติ</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge variant="destructive">ปฏิเสธ</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            รายการรออนุมัติ ({pendingEntries.length} รายการ)
          </DialogTitle>
          <DialogDescription>
            ตรวจสอบและอนุมัติรายการบัญชีที่รอการอนุมัติ
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              รายการทั้งหมด ({filteredEntries.length})
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedEntry}>
              <Eye className="w-4 h-4" />
              รายละเอียด
            </TabsTrigger>
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหารายการ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Entries List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีรายการรออนุมัติ</p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-medium text-lg">{entry.entryNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {entry.description}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>{new Date(entry.date).toLocaleDateString('th-TH')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span>{entry.createdBy}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-muted-foreground" />
                              <span>฿{entry.totalDebit.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span>{new Date(entry.createdAt).toLocaleDateString('th-TH')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(entry.status)}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewEntryDetails(entry)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(entry)}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(entry)}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {selectedEntry ? (
              <div className="space-y-4">
                {/* Entry Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>รายละเอียดรายการ {selectedEntry.entryNumber}</span>
                      {getStatusBadge(selectedEntry.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">วันที่</label>
                        <div>{new Date(selectedEntry.date).toLocaleDateString('th-TH')}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">เลขที่อ้างอิง</label>
                        <div>{selectedEntry.reference || '-'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">คำอธิบาย</label>
                        <div>{selectedEntry.description}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ผู้สร้าง</label>
                        <div>{selectedEntry.createdBy}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">วันที่สร้าง</label>
                        <div>{new Date(selectedEntry.createdAt).toLocaleString('th-TH')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Journal Lines */}
                <Card>
                  <CardHeader>
                    <CardTitle>รายการบัญชี</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <div className="col-span-4">บัญชี</div>
                        <div className="col-span-4">คำอธิบาย</div>
                        <div className="col-span-2">เดบิต</div>
                        <div className="col-span-2">เครดิต</div>
                      </div>
                      
                      {selectedEntry.lines?.map((line, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 text-sm py-2 border-b">
                          <div className="col-span-4">
                            <div className="font-medium">{line.accountName}</div>
                            <div className="text-xs text-muted-foreground">{line.accountCode}</div>
                          </div>
                          <div className="col-span-4">{line.description}</div>
                          <div className="col-span-2 text-right">
                            {line.debit > 0 ? line.debit.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                          </div>
                          <div className="col-span-2 text-right">
                            {line.credit > 0 ? line.credit.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                          </div>
                        </div>
                      ))}
                      
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium pt-2 border-t">
                        <div className="col-span-8 text-right">รวม:</div>
                        <div className="col-span-2 text-right">
                          ฿{selectedEntry.totalDebit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="col-span-2 text-right">
                          ฿{selectedEntry.totalCredit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedEntry)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    อนุมัติ
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedEntry)}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    ปฏิเสธ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>เลือกรายการเพื่อดูรายละเอียด</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Approval Form */}
        {showApprovalForm && selectedEntry && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">อนุมัติรายการ {selectedEntry.entryNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">หมายเหตุการอนุมัติ (ไม่บังคับ)</label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForms}>
                  ยกเลิก
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={confirmApproval}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ยืนยันการอนุมัติ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Form */}
        {showRejectionForm && selectedEntry && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">ปฏิเสธรายการ {selectedEntry.entryNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">เหตุผลในการปฏิเสธ <span className="text-red-500">*</span></label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="กรุณาระบุเหตุผลในการปฏิเสธรายการ..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForms}>
                  ยกเลิก
                </Button>
                <Button variant="destructive" onClick={confirmRejection}>
                  <XCircle className="w-4 h-4 mr-2" />
                  ยืนยันการปฏิเสธ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}