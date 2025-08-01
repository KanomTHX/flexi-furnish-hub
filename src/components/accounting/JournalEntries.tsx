import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JournalEntry, JournalEntryFilter, Account } from '@/types/accounting';
import { formatCurrency, formatDate, journalEntryStatusLabels } from '@/utils/accountingHelpers';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Check, 
  X, 
  Download,
  FileText,
  Calendar,
  User
} from 'lucide-react';

interface JournalEntriesProps {
  entries: JournalEntry[];
  accounts: Account[];
  filter: JournalEntryFilter;
  onFilterChange: (filter: JournalEntryFilter) => void;
  onExport: () => void;
  onApprove: (entryId: string, approvedBy: string) => void;
  onReject: (entryId: string) => void;
  onCreateEntry: () => void;
}

export function JournalEntries({
  entries,
  accounts,
  filter,
  onFilterChange,
  onExport,
  onApprove,
  onReject,
  onCreateEntry
}: JournalEntriesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {journalEntryStatusLabels[status as keyof typeof journalEntryStatusLabels] || status}
      </Badge>
    );
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.reference && entry.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">รายการบัญชี</h2>
          <p className="text-muted-foreground">
            จัดการรายการบัญชีและการอนุมัติ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
          <Button onClick={onCreateEntry}>
            <Plus className="w-4 h-4 mr-2" />
            สร้างรายการใหม่
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ตัวกรองและค้นหา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหารายการ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filter.status || ''}
              onValueChange={(value) => onFilterChange({ ...filter, status: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                <SelectItem value="draft">ร่าง</SelectItem>
                <SelectItem value="pending">รออนุมัติ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="rejected">ปฏิเสธ</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="วันที่เริ่มต้น"
              value={filter.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filter, dateFrom: e.target.value || undefined })}
            />

            <Input
              type="date"
              placeholder="วันที่สิ้นสุด"
              value={filter.dateTo || ''}
              onChange={(e) => onFilterChange({ ...filter, dateTo: e.target.value || undefined })}
            />

            <Select
              value={filter.accountId || ''}
              onValueChange={(value) => onFilterChange({ ...filter, accountId: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="บัญชี" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                onFilterChange({});
                setSearchTerm('');
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">ไม่พบรายการบัญชีที่ตรงกับเงื่อนไขการค้นหา</p>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{entry.entryNumber}</h3>
                      {getStatusBadge(entry.status)}
                      {entry.reference && (
                        <Badge variant="outline">
                          อ้างอิง: {entry.reference}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{entry.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(entry.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>สร้างโดย: {entry.createdBy}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-600">
                          เดบิต: {formatCurrency(entry.totalDebit)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-600">
                          เครดิต: {formatCurrency(entry.totalCredit)}
                        </span>
                      </div>
                    </div>

                    {entry.approvedBy && (
                      <div className="mt-2 text-sm text-green-600">
                        อนุมัติโดย: {entry.approvedBy} เมื่อ {entry.approvedAt && formatDate(entry.approvedAt)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      ดูรายละเอียด
                    </Button>
                    
                    {entry.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onApprove(entry.id, 'current-user')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          อนุมัติ
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onReject(entry.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          ปฏิเสธ
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Journal Entry Lines Preview */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">รายการย่อย:</h4>
                  <div className="space-y-1">
                    {entry.entries.slice(0, 3).map((line, index) => (
                      <div key={line.id} className="flex justify-between text-sm">
                        <span>{line.account.code} - {line.account.name}</span>
                        <div className="flex gap-4">
                          <span className="text-green-600 w-20 text-right">
                            {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-'}
                          </span>
                          <span className="text-blue-600 w-20 text-right">
                            {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {entry.entries.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        และอีก {entry.entries.length - 3} รายการ...
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปรายการบัญชี</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {entries.filter(e => e.status === 'draft').length}
              </div>
              <div className="text-sm text-muted-foreground">ร่าง</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {entries.filter(e => e.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">รออนุมัติ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {entries.filter(e => e.status === 'approved').length}
              </div>
              <div className="text-sm text-muted-foreground">อนุมัติแล้ว</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {entries.filter(e => e.status === 'rejected').length}
              </div>
              <div className="text-sm text-muted-foreground">ปฏิเสธ</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

// Entry Detail Modal Component
function EntryDetailModal({ 
  entry, 
  onClose 
}: { 
  entry: JournalEntry;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">รายละเอียดรายการบัญชี</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">เลขที่รายการ</label>
              <div className="text-lg">{entry.entryNumber}</div>
            </div>
            <div>
              <label className="text-sm font-medium">วันที่</label>
              <div>{formatDate(entry.date)}</div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">คำอธิบาย</label>
            <div>{entry.description}</div>
          </div>

          {entry.reference && (
            <div>
              <label className="text-sm font-medium">อ้างอิง</label>
              <div>{entry.reference}</div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">รายการย่อย</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium border-b pb-2">
                <div className="col-span-6">บัญชี</div>
                <div className="col-span-2 text-right">เดบิต</div>
                <div className="col-span-2 text-right">เครดิต</div>
                <div className="col-span-2">คำอธิบาย</div>
              </div>
              {entry.entries.map((line) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 text-sm">
                  <div className="col-span-6">
                    {line.account.code} - {line.account.name}
                  </div>
                  <div className="col-span-2 text-right text-green-600">
                    {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-'}
                  </div>
                  <div className="col-span-2 text-right text-blue-600">
                    {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-'}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {line.description || '-'}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium border-t pt-2">
                <div className="col-span-6">รวม</div>
                <div className="col-span-2 text-right text-green-600">
                  {formatCurrency(entry.totalDebit)}
                </div>
                <div className="col-span-2 text-right text-blue-600">
                  {formatCurrency(entry.totalCredit)}
                </div>
                <div className="col-span-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}