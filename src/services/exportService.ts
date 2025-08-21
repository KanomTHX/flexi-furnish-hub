import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from '@/utils/accountingHelpers';
import {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TaxReport,
  ExportOptions,
  AccountingPeriod,
  BranchFinancialSummary
} from '@/types/accountingExtended';
import { Account, JournalEntry, Transaction } from '@/types/accounting';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ConsolidatedReportData {
  branches: BranchFinancialSummary[];
  consolidated: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  period: AccountingPeriod;
}

export interface ExportServiceOptions extends ExportOptions {
  reportTitle?: string;
  companyName?: string;
  logoUrl?: string;
  includeWatermark?: boolean;
  customHeaders?: Record<string, string>;
}

export class ExportService {
  private static instance: ExportService;
  
  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // ========================================
  // CHART OF ACCOUNTS EXPORT
  // ========================================

  async exportChartOfAccounts(
    accounts: Account[],
    options: ExportServiceOptions
  ): Promise<void> {
    const data = accounts.map(account => ({
      'รหัสบัญชี': account.code,
      'ชื่อบัญชี': account.name,
      'ประเภท': this.getAccountTypeLabel(account.type),
      'หมวดหมู่': this.getAccountCategoryLabel(account.category),
      'ยอดคงเหลือ': formatCurrency(account.balance),
      'สถานะ': account.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน',
      'คำอธิบาย': account.description || '-'
    }));

    if (options.format === 'excel') {
      await this.exportToExcel(data, 'ผังบัญชี', options);
    } else if (options.format === 'pdf') {
      await this.exportToPDF(data, 'ผังบัญชี', options);
    }
  }

  // ========================================
  // JOURNAL ENTRIES EXPORT
  // ========================================

  async exportJournalEntries(
    entries: JournalEntry[],
    options: ExportServiceOptions
  ): Promise<void> {
    const data: any[] = [];
    
    entries.forEach(entry => {
      entry.entries.forEach((line, index) => {
        data.push({
          'เลขที่รายการ': index === 0 ? entry.entryNumber : '',
          'วันที่': index === 0 ? formatDate(entry.date) : '',
          'คำอธิบาย': index === 0 ? entry.description : '',
          'รหัสบัญชี': line.account.code,
          'ชื่อบัญชี': line.account.name,
          'เดบิต': line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-',
          'เครดิต': line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-',
          'สถานะ': index === 0 ? this.getJournalStatusLabel(entry.status) : '',
          'ผู้สร้าง': index === 0 ? entry.createdBy : '',
          'วันที่สร้าง': index === 0 ? formatDate(entry.createdAt) : ''
        });
      });
      // Add separator row
      data.push({
        'เลขที่รายการ': '---',
        'วันที่': '---',
        'คำอธิบาย': '---',
        'รหัสบัญชี': '---',
        'ชื่อบัญชี': '---',
        'เดบิต': '---',
        'เครดิต': '---',
        'สถานะ': '---',
        'ผู้สร้าง': '---',
        'วันที่สร้าง': '---'
      });
    });

    if (options.format === 'excel') {
      await this.exportToExcel(data, 'รายการบัญชี', options);
    } else if (options.format === 'pdf') {
      await this.exportToPDF(data, 'รายการบัญชี', options);
    }
  }

  // ========================================
  // TRANSACTIONS EXPORT
  // ========================================

  async exportTransactions(
    transactions: Transaction[],
    options: ExportServiceOptions
  ): Promise<void> {
    const data = transactions.map(transaction => ({
      'เลขที่ธุรกรรม': transaction.id,
      'วันที่': formatDate(transaction.date),
      'ประเภท': this.getTransactionTypeLabel(transaction.type),
      'คำอธิบาย': transaction.description,
      'จำนวนเงิน': formatCurrency(transaction.amount),
      'สาขา': '-', // Transaction doesn't have branch property
      'อ้างอิง': transaction.reference || '-',
      'สถานะ': this.getTransactionStatusLabel(transaction.status),
      'ผู้สร้าง': '-', // Transaction doesn't have createdBy property
      'วันที่สร้าง': formatDate(transaction.createdAt)
    }));

    if (options.format === 'excel') {
      await this.exportToExcel(data, 'ธุรกรรม', options);
    } else if (options.format === 'pdf') {
      await this.exportToPDF(data, 'ธุรกรรม', options);
    }
  }

  // ========================================
  // FINANCIAL REPORTS EXPORT
  // ========================================

  async exportProfitLossReport(
    report: ProfitLossReport,
    options: ExportServiceOptions
  ): Promise<void> {
    const data: any[] = [];
    
    // Header information
    data.push({
      'รายการ': 'รายงานกำไรขาดทุน',
      'จำนวนเงิน': '',
      'เปอร์เซ็นต์': ''
    });
    
    data.push({
      'รายการ': `ระยะเวลา: ${report.period.label}`,
      'จำนวนเงิน': '',
      'เปอร์เซ็นต์': ''
    });
    
    if (report.branch) {
      data.push({
        'รายการ': `สาขา: ${report.branch.name}`,
        'จำนวนเงิน': '',
        'เปอร์เซ็นต์': ''
      });
    }
    
    data.push({ 'รายการ': '', 'จำนวนเงิน': '', 'เปอร์เซ็นต์': '' });

    // Revenues
    data.push({
      'รายการ': 'รายได้',
      'จำนวนเงิน': '',
      'เปอร์เซ็นต์': ''
    });
    
    const totalRevenue = report.revenues.reduce((sum, item) => sum + item.amount, 0);
    report.revenues.forEach(item => {
      data.push({
        'รายการ': `  ${item.accountName}`,
        'จำนวนเงิน': formatCurrency(item.amount),
        'เปอร์เซ็นต์': `${((item.amount / totalRevenue) * 100).toFixed(1)}%`
      });
    });
    
    data.push({
      'รายการ': 'รวมรายได้',
      'จำนวนเงิน': formatCurrency(totalRevenue),
      'เปอร์เซ็นต์': '100.0%'
    });
    
    data.push({ 'รายการ': '', 'จำนวนเงิน': '', 'เปอร์เซ็นต์': '' });

    // Cost of Goods Sold
    if (report.costOfGoodsSold.length > 0) {
      data.push({
        'รายการ': 'ต้นทุนขาย',
        'จำนวนเงิน': '',
        'เปอร์เซ็นต์': ''
      });
      
      const totalCOGS = report.costOfGoodsSold.reduce((sum, item) => sum + item.amount, 0);
      report.costOfGoodsSold.forEach(item => {
        data.push({
          'รายการ': `  ${item.accountName}`,
          'จำนวนเงิน': formatCurrency(item.amount),
          'เปอร์เซ็นต์': `${((item.amount / totalRevenue) * 100).toFixed(1)}%`
        });
      });
      
      data.push({
        'รายการ': 'รวมต้นทุนขาย',
        'จำนวนเงิน': formatCurrency(totalCOGS),
        'เปอร์เซ็นต์': `${((totalCOGS / totalRevenue) * 100).toFixed(1)}%`
      });
      
      data.push({
        'รายการ': 'กำไรขั้นต้น',
        'จำนวนเงิน': formatCurrency(report.grossProfit),
        'เปอร์เซ็นต์': `${((report.grossProfit / totalRevenue) * 100).toFixed(1)}%`
      });
      
      data.push({ 'รายการ': '', 'จำนวนเงิน': '', 'เปอร์เซ็นต์': '' });
    }

    // Operating Expenses
    data.push({
      'รายการ': 'ค่าใช้จ่ายในการดำเนินงาน',
      'จำนวนเงิน': '',
      'เปอร์เซ็นต์': ''
    });
    
    const totalOpEx = report.operatingExpenses.reduce((sum, item) => sum + item.amount, 0);
    report.operatingExpenses.forEach(item => {
      data.push({
        'รายการ': `  ${item.accountName}`,
        'จำนวนเงิน': formatCurrency(item.amount),
        'เปอร์เซ็นต์': `${((item.amount / totalRevenue) * 100).toFixed(1)}%`
      });
    });
    
    data.push({
      'รายการ': 'รวมค่าใช้จ่ายดำเนินงาน',
      'จำนวนเงิน': formatCurrency(totalOpEx),
      'เปอร์เซ็นต์': `${((totalOpEx / totalRevenue) * 100).toFixed(1)}%`
    });
    
    data.push({
      'รายการ': 'กำไรจากการดำเนินงาน',
      'จำนวนเงิน': formatCurrency(report.operatingIncome),
      'เปอร์เซ็นต์': `${((report.operatingIncome / totalRevenue) * 100).toFixed(1)}%`
    });
    
    data.push({ 'รายการ': '', 'จำนวนเงิน': '', 'เปอร์เซ็นต์': '' });

    // Net Income
    data.push({
      'รายการ': 'กำไรสุทธิ',
      'จำนวนเงิน': formatCurrency(report.netIncome),
      'เปอร์เซ็นต์': `${((report.netIncome / totalRevenue) * 100).toFixed(1)}%`
    });

    const title = `รายงานกำไรขาดทุน${report.branch ? ` - ${report.branch.name}` : ''}`;
    
    if (options.format === 'excel') {
      await this.exportToExcel(data, title, options);
    } else if (options.format === 'pdf') {
      await this.exportToPDF(data, title, options);
    }
  }

  async exportBalanceSheetReport(
    report: BalanceSheetReport,
    options: ExportServiceOptions
  ): Promise<void> {
    const data: any[] = [];
    
    // Header
    data.push({
      'รายการ': 'งบดุล',
      'จำนวนเงิน': ''
    });
    
    data.push({
      'รายการ': `ณ วันที่ ${formatDate(report.asOfDate)}`,
      'จำนวนเงิน': ''
    });
    
    if (report.branch) {
      data.push({
        'รายการ': `สาขา: ${report.branch.name}`,
        'จำนวนเงิน': ''
      });
    }
    
    data.push({ 'รายการ': '', 'จำนวนเงิน': '' });

    // Assets
    data.push({
      'รายการ': 'สินทรัพย์',
      'จำนวนเงิน': ''
    });
    
    // Current Assets
    if (report.assets.currentAssets.length > 0) {
      data.push({
        'รายการ': 'สินทรัพย์หมุนเวียน',
        'จำนวนเงิน': ''
      });
      
      report.assets.currentAssets.forEach(item => {
        data.push({
          'รายการ': `  ${item.accountName}`,
          'จำนวนเงิน': formatCurrency(item.amount)
        });
      });
      
      const totalCurrentAssets = report.assets.currentAssets.reduce((sum, item) => sum + item.amount, 0);
      data.push({
        'รายการ': 'รวมสินทรัพย์หมุนเวียน',
        'จำนวนเงิน': formatCurrency(totalCurrentAssets)
      });
    }
    
    // Fixed Assets
    if (report.assets.fixedAssets.length > 0) {
      data.push({
        'รายการ': 'สินทรัพย์ถาวร',
        'จำนวนเงิน': ''
      });
      
      report.assets.fixedAssets.forEach(item => {
        data.push({
          'รายการ': `  ${item.accountName}`,
          'จำนวนเงิน': formatCurrency(item.amount)
        });
      });
      
      const totalFixedAssets = report.assets.fixedAssets.reduce((sum, item) => sum + item.amount, 0);
      data.push({
        'รายการ': 'รวมสินทรัพย์ถาวร',
        'จำนวนเงิน': formatCurrency(totalFixedAssets)
      });
    }
    
    data.push({
      'รายการ': 'รวมสินทรัพย์',
      'จำนวนเงิน': formatCurrency(report.assets.totalAssets)
    });
    
    data.push({ 'รายการ': '', 'จำนวนเงิน': '' });

    // Liabilities
    data.push({
      'รายการ': 'หนี้สิน',
      'จำนวนเงิน': ''
    });
    
    // Current Liabilities
    if (report.liabilities.currentLiabilities.length > 0) {
      data.push({
        'รายการ': 'หนี้สินหมุนเวียน',
        'จำนวนเงิน': ''
      });
      
      report.liabilities.currentLiabilities.forEach(item => {
        data.push({
          'รายการ': `  ${item.accountName}`,
          'จำนวนเงิน': formatCurrency(item.amount)
        });
      });
      
      const totalCurrentLiabilities = report.liabilities.currentLiabilities.reduce((sum, item) => sum + item.amount, 0);
      data.push({
        'รายการ': 'รวมหนี้สินหมุนเวียน',
        'จำนวนเงิน': formatCurrency(totalCurrentLiabilities)
      });
    }
    
    data.push({
      'รายการ': 'รวมหนี้สิน',
      'จำนวนเงิน': formatCurrency(report.liabilities.totalLiabilities)
    });
    
    data.push({ 'รายการ': '', 'จำนวนเงิน': '' });

    // Equity
    data.push({
      'รายการ': 'ส่วนของเจ้าของ',
      'จำนวนเงิน': ''
    });
    
    report.equity.ownerEquity.forEach(item => {
      data.push({
        'รายการ': `  ${item.accountName}`,
        'จำนวนเงิน': formatCurrency(item.amount)
      });
    });
    
    data.push({
      'รายการ': '  กำไรสะสม',
      'จำนวนเงิน': formatCurrency(report.equity.retainedEarnings)
    });
    
    data.push({
      'รายการ': 'รวมส่วนของเจ้าของ',
      'จำนวนเงิน': formatCurrency(report.equity.totalEquity)
    });
    
    data.push({ 'รายการ': '', 'จำนวนเงิน': '' });
    
    data.push({
      'รายการ': 'รวมหนี้สินและส่วนของเจ้าของ',
      'จำนวนเงิน': formatCurrency(report.liabilities.totalLiabilities + report.equity.totalEquity)
    });

    const title = `งบดุล${report.branch ? ` - ${report.branch.name}` : ''}`;
    
    if (options.format === 'excel') {
      await this.exportToExcel(data, title, options);
    } else if (options.format === 'pdf') {
      await this.exportToPDF(data, title, options);
    }
  }

  // ========================================
  // MULTI-BRANCH & CONSOLIDATED REPORTS
  // ========================================

  async exportConsolidatedReport(
    consolidatedData: ConsolidatedReportData,
    options: ExportServiceOptions
  ): Promise<void> {
    const data: any[] = [];
    
    // Header
    data.push({
      'รายการ': 'รายงานรวมทุกสาขา',
      'จำนวนเงิน': '',
      'เปอร์เซ็นต์': ''
    });
    
    data.push({
      'รายการ': `ระยะเวลา: ${consolidatedData.period.label}`,
      'จำนวนเงิน': '',
      'เปอร์เซ็นต์': ''
    });
    
    data.push({ 'รายการ': '', 'จำนวนเงิน': '', 'เปอร์เซ็นต์': '' });

    // Branch Summary
    data.push({
      'รายการ': 'สรุปตามสาขา',
      'จำนวนเงิน': '',
      'เปอร์เซ็นต์': ''
    });
    
    data.push({
      'รายการ': 'สาขา',
      'รายได้': 'รายได้',
      'ค่าใช้จ่าย': 'ค่าใช้จ่าย',
      'กำไรสุทธิ': 'กำไรสุทธิ',
      'เปอร์เซ็นต์': '% ของรายได้รวม'
    });
    
    const totalRevenue = consolidatedData.consolidated.totalRevenue;
    
    consolidatedData.branches.forEach(branch => {
      data.push({
        'รายการ': branch.branchName,
        'รายได้': formatCurrency(branch.revenue),
        'ค่าใช้จ่าย': formatCurrency(branch.expenses),
        'กำไรสุทธิ': formatCurrency(branch.netIncome),
        'เปอร์เซ็นต์': `${((branch.revenue / totalRevenue) * 100).toFixed(1)}%`
      });
    });
    
    data.push({ 'รายการ': '', 'รายได้': '', 'ค่าใช้จ่าย': '', 'กำไรสุทธิ': '', 'เปอร์เซ็นต์': '' });

    // Consolidated Summary
    data.push({
      'รายการ': 'สรุปรวม',
      'รายได้': '',
      'ค่าใช้จ่าย': '',
      'กำไรสุทธิ': '',
      'เปอร์เซ็นต์': ''
    });
    
    data.push({
      'รายการ': 'รายได้รวม',
      'รายได้': formatCurrency(consolidatedData.consolidated.totalRevenue),
      'ค่าใช้จ่าย': '',
      'กำไรสุทธิ': '',
      'เปอร์เซ็นต์': '100.0%'
    });
    
    data.push({
      'รายการ': 'ค่าใช้จ่ายรวม',
      'รายได้': '',
      'ค่าใช้จ่าย': formatCurrency(consolidatedData.consolidated.totalExpenses),
      'กำไรสุทธิ': '',
      'เปอร์เซ็นต์': `${((consolidatedData.consolidated.totalExpenses / totalRevenue) * 100).toFixed(1)}%`
    });
    
    data.push({
      'รายการ': 'กำไรสุทธิรวม',
      'รายได้': '',
      'ค่าใช้จ่าย': '',
      'กำไรสุทธิ': formatCurrency(consolidatedData.consolidated.netIncome),
      'เปอร์เซ็นต์': `${((consolidatedData.consolidated.netIncome / totalRevenue) * 100).toFixed(1)}%`
    });

    if (options.format === 'excel') {
      await this.exportToExcel(data, 'รายงานรวมทุกสาขา', options);
    } else if (options.format === 'pdf') {
      await this.exportToPDF(data, 'รายงานรวมทุกสาขา', options);
    }
  }

  // ========================================
  // CORE EXPORT FUNCTIONS
  // ========================================

  private async exportToExcel(
    data: any[],
    sheetName: string,
    options: ExportServiceOptions
  ): Promise<void> {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const columnWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Add metadata sheet if requested
    if (options.includeSummary) {
      const metadataSheet = XLSX.utils.json_to_sheet([
        { 'ข้อมูล': 'ชื่อรายงาน', 'ค่า': options.reportTitle || sheetName },
        { 'ข้อมูล': 'บริษัท', 'ค่า': options.companyName || 'Flexi Furnish Hub' },
        { 'ข้อมูล': 'วันที่สร้าง', 'ค่า': formatDate(new Date()) },
        { 'ข้อมูล': 'จำนวนรายการ', 'ค่า': data.length.toString() }
      ]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'ข้อมูลรายงาน');
    }
    
    const fileName = `${sheetName}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private async exportToPDF(
    data: any[],
    title: string,
    options: ExportServiceOptions
  ): Promise<void> {
    const doc = new jsPDF();
    
    // Add Thai font support (if available)
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    if (options.companyName) {
      doc.setFontSize(12);
      doc.text(options.companyName, 20, 30);
    }
    
    doc.setFontSize(10);
    doc.text(`วันที่สร้าง: ${formatDate(new Date())}`, 20, 40);
    
    // Table
    const headers = Object.keys(data[0] || {});
    const rows = data.map(row => headers.map(header => row[header] || ''));
    
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    // Watermark
    if (options.includeWatermark) {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(50);
      doc.text('DRAFT', 105, 150, { angle: 45, align: 'center' });
    }
    
    const fileName = `${title}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }



  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  private getAccountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'asset': 'สินทรัพย์',
      'liability': 'หนี้สิน',
      'equity': 'ทุน',
      'revenue': 'รายได้',
      'expense': 'ค่าใช้จ่าย'
    };
    return labels[type] || type;
  }

  private getAccountCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'current_asset': 'สินทรัพย์หมุนเวียน',
      'fixed_asset': 'สินทรัพย์ถาวร',
      'intangible_asset': 'สินทรัพย์ไม่มีตัวตน',
      'current_liability': 'หนี้สินหมุนเวียน',
      'long_term_liability': 'หนี้สินระยะยาว',
      'owner_equity': 'ทุนเจ้าของ',
      'retained_earnings': 'กำไรสะสม',
      'sales_revenue': 'รายได้จากการขาย',
      'other_revenue': 'รายได้อื่น',
      'cost_of_goods_sold': 'ต้นทุนขาย',
      'operating_expense': 'ค่าใช้จ่ายดำเนินงาน',
      'other_expense': 'ค่าใช้จ่ายอื่น'
    };
    return labels[category] || category;
  }

  private getJournalStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'แบบร่าง',
      'pending': 'รออนุมัติ',
      'approved': 'อนุมัติแล้ว',
      'rejected': 'ปฏิเสธ'
    };
    return labels[status] || status;
  }

  private getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'sale': 'การขาย',
      'purchase': 'การซื้อ',
      'payment': 'การจ่าย',
      'receipt': 'การรับ',
      'transfer': 'การโอน',
      'adjustment': 'การปรับปรุง'
    };
    return labels[type] || type;
  }

  private getTransactionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'รอดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก',
      'failed': 'ล้มเหลว'
    };
    return labels[status] || status;
  }
}

// Export singleton instance
export const exportService = ExportService.getInstance();