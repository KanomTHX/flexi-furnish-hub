import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileSpreadsheet, FileText, File, Building2, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBranchData } from '@/hooks/useBranchData';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { exportService, type ExportServiceOptions, type ConsolidatedReportData } from '@/services/exportService';
import type { AccountingPeriod } from '@/types/accountingExtended';
import type { Branch } from '@/types/branch';

interface MultiBranchExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultiBranchExportDialog({ open, onOpenChange }: MultiBranchExportDialogProps) {
  const [format, setFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [reportType, setReportType] = useState<'profit_loss' | 'balance_sheet' | 'cash_flow' | 'consolidated'>('consolidated');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [period, setPeriod] = useState<AccountingPeriod>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    fiscalYear: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    label: 'เดือนปัจจุบัน'
  });
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeComparison, setIncludeComparison] = useState(false);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { branches, currentBranch } = useBranchData();
  const { generateProfitLossReport, generateBalanceSheetReport, generateCashFlowReport } = useFinancialReports();

  const formatIcons = {
    excel: FileSpreadsheet,
    pdf: FileText,
    csv: File
  };

  const formatLabels = {
    excel: 'Excel (.xlsx)',
    pdf: 'PDF (.pdf)',
    csv: 'CSV (.csv)'
  };

  const reportTypeLabels = {
    profit_loss: 'รายงานกำไรขาดทุน',
    balance_sheet: 'งบดุล',
    cash_flow: 'งบกระแสเงินสด',
    consolidated: 'รายงานรวมทุกสาขา'
  };

  // Initialize with all branches selected
  useEffect(() => {
    if (branches.length > 0 && selectedBranches.length === 0) {
      setSelectedBranches(branches.map(branch => branch.id));
    }
  }, [branches, selectedBranches.length]);

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranches(prev => 
      prev.includes(branchId)
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleSelectAllBranches = () => {
    setSelectedBranches(branches.map(branch => branch.id));
  };

  const handleDeselectAllBranches = () => {
    setSelectedBranches([]);
  };

  const handleExport = async () => {
    if (selectedBranches.length === 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเลือกสาขาอย่างน้อย 1 สาขา',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Generate consolidated report data based on report type
       let consolidatedData;
       
       if (selectedBranches.length === 1) {
         // Single branch report
         const branchId = selectedBranches[0];
         switch (reportType) {
           case 'profit_loss':
             consolidatedData = await generateProfitLossReport(period.startDate, period.endDate, branchId);
             break;
           case 'balance_sheet':
             consolidatedData = await generateBalanceSheetReport(period.endDate, branchId);
             break;
           case 'cash_flow':
             consolidatedData = await generateCashFlowReport(period.startDate, period.endDate, branchId);
             break;
           default:
             // For consolidated single branch, combine all report types
             const [profitLoss, balanceSheet, cashFlow] = await Promise.all([
               generateProfitLossReport(period.startDate, period.endDate, branchId),
               generateBalanceSheetReport(period.endDate, branchId),
               generateCashFlowReport(period.startDate, period.endDate, branchId)
             ]);
             consolidatedData = { profitLoss, balanceSheet, cashFlow };
         }
       } else {
         // Multi-branch consolidated report
         const branchReports = await Promise.all(
           selectedBranches.map(async (branchId) => {
             switch (reportType) {
               case 'profit_loss':
                 return await generateProfitLossReport(period.startDate, period.endDate, branchId);
               case 'balance_sheet':
                 return await generateBalanceSheetReport(period.endDate, branchId);
               case 'cash_flow':
                 return await generateCashFlowReport(period.startDate, period.endDate, branchId);
               default:
                 const [profitLoss, balanceSheet, cashFlow] = await Promise.all([
                   generateProfitLossReport(period.startDate, period.endDate, branchId),
                   generateBalanceSheetReport(period.endDate, branchId),
                   generateCashFlowReport(period.startDate, period.endDate, branchId)
                 ]);
                 return { profitLoss, balanceSheet, cashFlow };
             }
           })
         );
         consolidatedData = { branches: branchReports, reportType };
       }

      const options: ExportServiceOptions = {
        format,
        includeDetails,
        includeSummary,
        includeWatermark,
        reportTitle: customTitle || `${reportTypeLabels[reportType]} - รายงานรวม ${selectedBranches.length} สาขา`,
        companyName: 'Flexi Furnish Hub',
        period
      };

      await exportService.exportConsolidatedReport(consolidatedData, options);

      toast({
        title: 'สำเร็จ',
        description: `ส่งออก${reportTypeLabels[reportType]}เป็น ${formatLabels[format]} เรียบร้อยแล้ว`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Multi-branch export error:', error);
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
  const selectedBranchesData = branches.filter(branch => selectedBranches.includes(branch.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            ส่งออกรายงานหลายสาขา
          </DialogTitle>
          <DialogDescription>
            เลือกสาขา ประเภทรายงาน และตัวเลือกสำหรับการส่งออกข้อมูลรวม
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="reportType">ประเภทรายงาน</Label>
              <Select value={reportType} onValueChange={(value: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'consolidated') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue>{reportTypeLabels[reportType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  เลือกสาขา ({selectedBranches.length}/{branches.length})
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllBranches}
                  >
                    เลือกทั้งหมด
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllBranches}
                  >
                    ยกเลิกทั้งหมด
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto border rounded-md p-3">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`branch-${branch.id}`}
                      checked={selectedBranches.includes(branch.id)}
                      onCheckedChange={() => handleBranchToggle(branch.id)}
                    />
                    <Label htmlFor={`branch-${branch.id}`} className="text-sm flex-1">
                      {branch.name}
                    </Label>
                    {branch.id === currentBranch?.id && (
                      <Badge variant="secondary" className="text-xs">ปัจจุบัน</Badge>
                    )}
                  </div>
                ))}
              </div>

              {selectedBranchesData.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedBranchesData.map((branch) => (
                    <Badge key={branch.id} variant="outline" className="text-xs">
                      {branch.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Period Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                ช่วงเวลา
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-xs">วันที่เริ่มต้น</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={period.startDate}
                    onChange={(e) => setPeriod(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-xs">วันที่สิ้นสุด</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={period.endDate}
                    onChange={(e) => setPeriod(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="format">รูปแบบไฟล์</Label>
              <Select value={format} onValueChange={(value: 'excel' | 'pdf' | 'csv') => setFormat(value)}>
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
                placeholder={`${reportTypeLabels[reportType]} - รายงานรวม ${selectedBranches.length} สาขา`}
              />
            </div>

            <Separator />

            {/* Export Options */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                ตัวเลือกการส่งออก
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetails"
                    checked={includeDetails}
                    onCheckedChange={(checked) => setIncludeDetails(checked === true)}
                  />
                  <Label htmlFor="includeDetails" className="text-sm">
                    รวมรายละเอียดแต่ละสาขา
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSummary"
                    checked={includeSummary}
                    onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                  />
                  <Label htmlFor="includeSummary" className="text-sm">
                    รวมสรุปข้อมูลรวม
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeComparison"
                    checked={includeComparison}
                    onCheckedChange={(checked) => setIncludeComparison(checked === true)}
                  />
                  <Label htmlFor="includeComparison" className="text-sm">
                    เปรียบเทียบระหว่างสาขา
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
                <p>ไฟล์ Excel จะแยกข้อมูลแต่ละสาขาเป็นแผ่นงานต่างหาก พร้อมแผ่นงานสรุปรวม</p>
              )}
              {format === 'pdf' && (
                <p>ไฟล์ PDF จะรวมข้อมูลทุกสาขาในเอกสารเดียว เหมาะสำหรับการนำเสนอ</p>
              )}
              {format === 'csv' && (
                <p>ไฟล์ CSV จะส่งออกเป็นไฟล์แยกสำหรับแต่ละสาขา พร้อมไฟล์สรุปรวม</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={handleExport} disabled={loading || selectedBranches.length === 0}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                กำลังส่งออก...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                ส่งออก ({selectedBranches.length} สาขา)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}