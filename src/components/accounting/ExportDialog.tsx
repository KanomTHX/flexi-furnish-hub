import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportService, type ExportServiceOptions, type ConsolidatedReportData } from '@/services/exportService';
import type {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  AccountingPeriod
} from '@/types/accountingExtended';
import type { Account, JournalEntry, Transaction } from '@/types/accounting';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: 'chart_of_accounts' | 'journal_entries' | 'transactions' | 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'consolidated';
  data?: Account[] | JournalEntry[] | Transaction[] | ProfitLossReport | BalanceSheetReport | CashFlowReport | ConsolidatedReportData;
  title?: string;
}

export function ExportDialog({ open, onOpenChange, exportType, data, title }: ExportDialogProps) {
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [customTitle, setCustomTitle] = useState(title || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatIcons = {
    excel: FileSpreadsheet,
    pdf: FileText,

  };

  const formatLabels = {
    excel: 'Excel (.xlsx)',
    pdf: 'PDF (.pdf)',

  };

  const exportTypeLabels = {
    chart_of_accounts: 'ผังบัญชี',
    journal_entries: 'รายการบัญชี',
    transactions: 'ธุรกรรม',
    profit_loss: 'รายงานกำไรขาดทุน',
    balance_sheet: 'งบดุล',
    cash_flow: 'งบกระแสเงินสด',
    consolidated: 'รายงานรวมทุกสาขา'
  };

  const handleExport = async () => {
    if (!data) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่มีข้อมูลสำหรับการส่งออก',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const options: ExportServiceOptions = {
        format,
        includeDetails,
        includeSummary,
        includeWatermark,
        reportTitle: customTitle || exportTypeLabels[exportType],
        companyName: 'Flexi Furnish Hub'
      };

      switch (exportType) {
        case 'chart_of_accounts':
          await exportService.exportChartOfAccounts(data as Account[], options);
          break;
        case 'journal_entries':
          await exportService.exportJournalEntries(data as JournalEntry[], options);
          break;
        case 'transactions':
          await exportService.exportTransactions(data as Transaction[], options);
          break;
        case 'profit_loss':
          await exportService.exportProfitLossReport(data as ProfitLossReport, options);
          break;
        case 'balance_sheet':
          await exportService.exportBalanceSheetReport(data as BalanceSheetReport, options);
          break;
        case 'cash_flow':
          // Note: Cash flow export would need to be implemented
          toast({
            title: 'แจ้งเตือน',
            description: 'การส่งออกงบกระแสเงินสดยังไม่รองรับ',
            variant: 'destructive'
          });
          return;
        case 'consolidated':
          await exportService.exportConsolidatedReport(data as ConsolidatedReportData, options);
          break;
        default:
          throw new Error('ประเภทการส่งออกไม่รองรับ');
      }

      toast({
        title: 'สำเร็จ',
        description: `ส่งออก${exportTypeLabels[exportType]}เป็น ${formatLabels[format]} เรียบร้อยแล้ว`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const FormatIcon = formatIcons[format];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            ส่งออกข้อมูล
          </DialogTitle>
          <DialogDescription>
            เลือกรูปแบบและตัวเลือกสำหรับการส่งออก{exportTypeLabels[exportType]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">รูปแบบไฟล์</Label>
            <Select value={format} onValueChange={(value: 'excel' | 'pdf') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <FormatIcon className="h-4 w-4" />
                    {formatLabels[format]}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(formatLabels).map(([key, label]) => {
                  const Icon = formatIcons[key as keyof typeof formatIcons];
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Title */}
          <div className="space-y-2">
            <Label htmlFor="title">ชื่อรายงาน</Label>
            <Input
              id="title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={exportTypeLabels[exportType]}
            />
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">ตัวเลือกการส่งออก</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(checked === true)}
                />
                <Label htmlFor="includeDetails" className="text-sm">
                  รวมรายละเอียด
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                />
                <Label htmlFor="includeSummary" className="text-sm">
                  รวมสรุปข้อมูล
                </Label>
              </div>

              {format === 'pdf' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeWatermark"
                    checked={includeWatermark}
                    onCheckedChange={(checked) => setIncludeWatermark(checked === true)}
                  />
                  <Label htmlFor="includeWatermark" className="text-sm">
                    เพิ่มลายน้ำ "DRAFT"
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Format-specific notes */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            {format === 'excel' && (
              <p>ไฟล์ Excel จะรวมข้อมูลหลายแผ่นงานและสามารถแก้ไขได้</p>
            )}
            {format === 'pdf' && (
              <p>ไฟล์ PDF เหมาะสำหรับการพิมพ์และการแชร์ที่ไม่ต้องการแก้ไข</p>
            )}
                 )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                กำลังส่งออก...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                ส่งออก
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}