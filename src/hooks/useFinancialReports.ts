import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import { exportService } from '../services/exportService';
import type {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TaxReport,
  ExportOptions,
  AccountingPeriod,
  ReportLineItem
} from '../types/accountingExtended';

// Define missing types
interface FinancialReport {
  id: string;
  report_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  branch_id?: string;
  data: any;
  status: string;
  generated_by: string;
  created_at: string;
  updated_at: string;
}

interface ReportFilters {
  branch_id?: string;
  report_type?: string;
  date_from?: string;
  date_to?: string;
}

export function useFinancialReports() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [currentReport, setCurrentReport] = useState<FinancialReport | null>(null);
  const { toast } = useToast();

  // ========================================
  // REPORT MANAGEMENT
  // ========================================

  const fetchReports = async (filters?: ReportFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('financial_reports')
        .select('*');

      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters?.report_type) {
        query = query.eq('report_type', filters.report_type);
      }
      if (filters?.date_from) {
        query = query.gte('period_start', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('period_end', filters.date_to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดรายงานได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportById = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCurrentReport(data);
      return data;
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดรายงานได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // PROFIT & LOSS REPORT
  // ========================================

  const generateProfitLossReport = async (
    periodStart: string,
    periodEnd: string,
    branchId?: string
  ): Promise<ProfitLossReport> => {
    try {
      setLoading(true);

      // ดึงข้อมูลรายได้จาก POS และ AR Invoices
      const revenueData = await calculateRevenue(periodStart, periodEnd, branchId);
      
      // ดึงข้อมูลค่าใช้จ่ายจาก Expenses และ AP Invoices
      const expenseData = await calculateExpenses(periodStart, periodEnd, branchId);
      
      // คำนวณกำไรขาดทุน
      const grossProfit = revenueData.totalRevenue - revenueData.costOfGoodsSold;
      const operatingIncome = grossProfit - expenseData.operatingExpenses;
      const netIncome = operatingIncome - expenseData.interestExpense - expenseData.taxExpense;

      const report: ProfitLossReport = {
        id: '',
        reportNumber: `PL${Date.now()}`,
        period: {
          startDate: periodStart,
          endDate: periodEnd,
          fiscalYear: new Date(periodStart).getFullYear(),
          label: `${periodStart} to ${periodEnd}`
        },
        branchId: branchId,
        revenues: [
          { accountId: '4000', accountCode: '4000', accountName: 'Sales Revenue', amount: revenueData.salesRevenue },
          { accountId: '4100', accountCode: '4100', accountName: 'Installment Revenue', amount: revenueData.installmentRevenue },
          { accountId: '4900', accountCode: '4900', accountName: 'Other Revenue', amount: revenueData.otherRevenue }
        ],
        costOfGoodsSold: [
          { accountId: '5000', accountCode: '5000', accountName: 'Cost of Goods Sold', amount: revenueData.costOfGoodsSold }
        ],
        grossProfit: grossProfit,
        operatingExpenses: [
          { accountId: '6000', accountCode: '6000', accountName: 'Selling Expenses', amount: expenseData.sellingExpenses },
          { accountId: '6100', accountCode: '6100', accountName: 'Administrative Expenses', amount: expenseData.administrativeExpenses }
        ],
        operatingIncome: operatingIncome,
        otherIncome: [
          { accountId: '7000', accountCode: '7000', accountName: 'Interest Income', amount: expenseData.interestIncome },
          { accountId: '7100', accountCode: '7100', accountName: 'Other Income', amount: expenseData.otherIncome }
        ],
        otherExpenses: [
          { accountId: '8000', accountCode: '8000', accountName: 'Interest Expense', amount: expenseData.interestExpense },
          { accountId: '8100', accountCode: '8100', accountName: 'Other Expenses', amount: expenseData.otherExpenses },
          { accountId: '8200', accountCode: '8200', accountName: 'Tax Expense', amount: expenseData.taxExpense }
        ],
        netIncome: netIncome,
        generatedAt: new Date().toISOString(),
        generatedBy: 'current_user'
      };

      // บันทึกรายงานลงฐานข้อมูล
      const { data: savedReport, error } = await supabase
        .from('financial_reports')
        .insert({
          report_name: `Profit & Loss Report ${new Date().toISOString().split('T')[0]}`,
          report_type: 'profit_loss',
          period_start: periodStart,
          period_end: periodEnd,
          branch_id: branchId,
          data: report,
          status: 'completed',
          generated_by: 'current_user' // TODO: ใช้ user ID จริง
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'สร้างรายงานกำไรขาดทุนเรียบร้อยแล้ว'
      });

      await fetchReports();
      return report;
    } catch (error) {
      console.error('Error generating P&L report:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายงานกำไรขาดทุนได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // BALANCE SHEET REPORT
  // ========================================

  const generateBalanceSheetReport = async (
    asOfDate: string,
    branchId?: string
  ): Promise<BalanceSheetReport> => {
    try {
      setLoading(true);

      // ดึงข้อมูลสินทรัพย์
      const assetsData = await calculateAssets(asOfDate, branchId);
      
      // ดึงข้อมูลหนี้สิน
      const liabilitiesData = await calculateLiabilities(asOfDate, branchId);
      
      // ดึงข้อมูลส่วนของเจ้าของ
      const equityData = await calculateEquity(asOfDate, branchId);

      const report: BalanceSheetReport = {
        id: '',
        reportNumber: `BS${Date.now()}`,
        asOfDate: asOfDate,
        branchId: branchId,
        assets: {
          currentAssets: [
            { accountId: '1000', accountCode: '1000', accountName: 'Cash and Equivalents', amount: assetsData.cashAndEquivalents },
            { accountId: '1100', accountCode: '1100', accountName: 'Accounts Receivable', amount: assetsData.accountsReceivable },
            { accountId: '1200', accountCode: '1200', accountName: 'Inventory', amount: assetsData.inventory },
            { accountId: '1300', accountCode: '1300', accountName: 'Prepaid Expenses', amount: assetsData.prepaidExpenses }
          ],
          fixedAssets: [
            { accountId: '1500', accountCode: '1500', accountName: 'Property, Plant & Equipment', amount: assetsData.propertyPlantEquipment },
            { accountId: '1600', accountCode: '1600', accountName: 'Accumulated Depreciation', amount: assetsData.accumulatedDepreciation }
          ],
          otherAssets: [
            { accountId: '1700', accountCode: '1700', accountName: 'Intangible Assets', amount: assetsData.intangibleAssets }
          ],
          totalAssets: assetsData.totalAssets
        },
        liabilities: {
          currentLiabilities: [
            { accountId: '2000', accountCode: '2000', accountName: 'Accounts Payable', amount: liabilitiesData.accountsPayable },
            { accountId: '2100', accountCode: '2100', accountName: 'Short-term Debt', amount: liabilitiesData.shortTermDebt },
            { accountId: '2200', accountCode: '2200', accountName: 'Accrued Expenses', amount: liabilitiesData.accruedExpenses }
          ],
          longTermLiabilities: [
            { accountId: '2500', accountCode: '2500', accountName: 'Long-term Debt', amount: liabilitiesData.longTermDebt },
            { accountId: '2600', accountCode: '2600', accountName: 'Deferred Tax', amount: liabilitiesData.deferredTax }
          ],
          totalLiabilities: liabilitiesData.totalLiabilities
        },
        equity: {
          ownerEquity: [
            { accountId: '3000', accountCode: '3000', accountName: 'Share Capital', amount: equityData.shareCapital },
            { accountId: '3100', accountCode: '3100', accountName: 'Other Equity', amount: equityData.otherEquity }
          ],
          retainedEarnings: equityData.retainedEarnings,
          totalEquity: equityData.totalEquity
        },
        generatedAt: new Date().toISOString(),
        generatedBy: 'current_user'
      };

      // บันทึกรายงานลงฐานข้อมูล
      const { data: savedReport, error } = await supabase
        .from('financial_reports')
        .insert({
          report_name: `Balance Sheet Report ${new Date().toISOString().split('T')[0]}`,
          report_type: 'balance_sheet',
          period_start: asOfDate,
          period_end: asOfDate,
          branch_id: branchId,
          data: report,
          status: 'completed',
          generated_by: 'current_user' // TODO: ใช้ user ID จริง
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'สร้างรายงานงบดุลเรียบร้อยแล้ว'
      });

      await fetchReports();
      return report;
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายงานงบดุลได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // CASH FLOW REPORT
  // ========================================

  const generateCashFlowReport = async (
    periodStart: string,
    periodEnd: string,
    branchId?: string
  ): Promise<CashFlowReport> => {
    try {
      setLoading(true);

      // ดึงข้อมูลกระแสเงินสดจากกิจกรรมดำเนินงาน
      const operatingData = await calculateOperatingCashFlow(periodStart, periodEnd, branchId);
      
      // ดึงข้อมูลกระแสเงินสดจากกิจกรรมลงทุน
      const investingData = await calculateInvestingCashFlow(periodStart, periodEnd, branchId);
      
      // ดึงข้อมูลกระแสเงินสดจากกิจกรรมจัดหาเงิน
      const financingData = await calculateFinancingCashFlow(periodStart, periodEnd, branchId);

      const netCashFlow = operatingData.netOperatingCashFlow + investingData.netInvestingCashFlow + financingData.netFinancingCashFlow;

      const report: CashFlowReport = {
        id: '',
        reportNumber: `CF${Date.now()}`,
        period: {
          startDate: periodStart,
          endDate: periodEnd,
          fiscalYear: new Date(periodStart).getFullYear(),
          label: `${periodStart} to ${periodEnd}`
        },
        branchId: branchId,
        operatingActivities: {
          netIncome: operatingData.netIncome,
          adjustments: [
            { accountId: '9000', accountCode: '9000', accountName: 'Depreciation', amount: operatingData.depreciation }
          ],
          workingCapitalChanges: [
            { accountId: '9100', accountCode: '9100', accountName: 'Changes in Working Capital', amount: operatingData.changesInWorkingCapital }
          ],
          netCashFromOperating: operatingData.netOperatingCashFlow
        },
        investingActivities: {
          activities: [
            { accountId: '9200', accountCode: '9200', accountName: 'Capital Expenditures', amount: investingData.capitalExpenditures },
            { accountId: '9300', accountCode: '9300', accountName: 'Asset Sales', amount: investingData.assetSales }
          ],
          netCashFromInvesting: investingData.netInvestingCashFlow
        },
        financingActivities: {
          activities: [
            { accountId: '9400', accountCode: '9400', accountName: 'Debt Proceeds', amount: financingData.debtProceeds },
            { accountId: '9500', accountCode: '9500', accountName: 'Debt Payments', amount: financingData.debtPayments },
            { accountId: '9600', accountCode: '9600', accountName: 'Equity Proceeds', amount: financingData.equityProceeds },
            { accountId: '9700', accountCode: '9700', accountName: 'Dividend Payments', amount: financingData.dividendPayments }
          ],
          netCashFromFinancing: financingData.netFinancingCashFlow
        },
        netCashFlow: netCashFlow,
        beginningCash: operatingData.beginningCashBalance,
        endingCash: operatingData.beginningCashBalance + netCashFlow,
        generatedAt: new Date().toISOString(),
        generatedBy: 'current_user'
      };

      // บันทึกรายงานลงฐานข้อมูล
      const { data: savedReport, error } = await supabase
        .from('financial_reports')
        .insert({
          report_name: `Cash Flow Report ${new Date().toISOString().split('T')[0]}`,
          report_type: 'cash_flow',
          period_start: periodStart,
          period_end: periodEnd,
          branch_id: branchId,
          data: report,
          status: 'completed',
          generated_by: 'current_user' // TODO: ใช้ user ID จริง
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'สร้างรายงานกระแสเงินสดเรียบร้อยแล้ว'
      });

      await fetchReports();
      return report;
    } catch (error) {
      console.error('Error generating cash flow report:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายงานกระแสเงินสดได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TAX REPORT
  // ========================================

  const generateTaxReport = async (
    periodStart: string,
    periodEnd: string,
    branchId?: string
  ): Promise<TaxReport> => {
    try {
      setLoading(true);

      // ดึงข้อมูลภาษีจาก tax_transactions
      let query = supabase
        .from('tax_transactions')
        .select('*')
        .gte('transaction_date', periodStart)
        .lte('transaction_date', periodEnd);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: taxTransactions, error } = await query;
      if (error) throw error;

      // คำนวณสรุปภาษี
      const vatSummary = taxTransactions
        .filter(t => t.tax_type === 'vat')
        .reduce((acc, t) => ({
          input_vat: acc.input_vat + (t.tax_direction === 'input' ? t.tax_amount : 0),
          output_vat: acc.output_vat + (t.tax_direction === 'output' ? t.tax_amount : 0),
          net_vat: acc.net_vat + (t.tax_direction === 'output' ? t.tax_amount : -t.tax_amount)
        }), { input_vat: 0, output_vat: 0, net_vat: 0 });

      const withholdingTaxSummary = taxTransactions
        .filter(t => t.tax_type === 'withholding_tax')
        .reduce((acc, t) => acc + t.tax_amount, 0);

      const report: TaxReport = {
        id: '',
        reportNumber: `TAX${Date.now()}`,
        reportType: 'comprehensive',
        period: {
          startDate: periodStart,
          endDate: periodEnd,
          fiscalYear: new Date(periodStart).getFullYear(),
          label: `${periodStart} to ${periodEnd}`
        },
        branchId: branchId,
        salesVAT: {
          totalSales: vatSummary.output_vat / 0.07, // Assuming 7% VAT
          vatAmount: vatSummary.output_vat,
          transactions: []
        },
        purchaseVAT: {
          totalPurchases: vatSummary.input_vat / 0.07,
          vatAmount: vatSummary.input_vat,
          transactions: []
        },
        withholdingTax: {
          totalWithholding: withholdingTaxSummary,
          transactions: []
        },
        netVATPayable: vatSummary.net_vat,
        generatedAt: new Date().toISOString(),
        generatedBy: 'current_user'
      };

      // บันทึกรายงานลงฐานข้อมูล
      const { data: savedReport, error: saveError } = await supabase
        .from('financial_reports')
        .insert({
          report_name: `Tax Report ${new Date().toISOString().split('T')[0]}`,
          report_type: 'tax_report',
          period_start: periodStart,
          period_end: periodEnd,
          branch_id: branchId,
          data: report,
          status: 'completed',
          generated_by: 'current_user' // TODO: ใช้ user ID จริง
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: 'สำเร็จ',
        description: 'สร้างรายงานภาษีเรียบร้อยแล้ว'
      });

      await fetchReports();
      return report;
    } catch (error) {
      console.error('Error generating tax report:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายงานภาษีได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // EXPORT FUNCTIONS
  // ========================================

  const exportReport = async (reportId: string, options: ExportOptions) => {
    try {
      setLoading(true);
      
      const report = await getReportById(reportId);
      if (!report) throw new Error('ไม่พบรายงาน');

      // Use exportService to handle actual export
      const exportOptions = {
        ...options,
        reportTitle: report.report_name,
        companyName: 'Flexi Furnish Hub'
      };

      // Export based on report type
      switch (report.report_type) {
        case 'profit_loss':
          if (report.data) {
            await exportService.exportProfitLossReport(report.data as ProfitLossReport, exportOptions);
          }
          break;
        case 'balance_sheet':
          if (report.data) {
            await exportService.exportBalanceSheetReport(report.data as BalanceSheetReport, exportOptions);
          }
          break;
        case 'cash_flow':
          if (report.data) {
            // Note: Cash flow export would need to be implemented in exportService
            console.log('Cash flow export not yet implemented');
          }
          break;
        default:
          throw new Error('ประเภทรายงานไม่รองรับ');
      }
      
      toast({
        title: 'สำเร็จ',
        description: `ส่งออกรายงานเป็น ${options.format.toUpperCase()} เรียบร้อยแล้ว`
      });

      return true;
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกรายงานได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  // Helper functions สำหรับคำนวณข้อมูลรายงาน
  const calculateRevenue = async (periodStart: string, periodEnd: string, branchId?: string) => {
    // TODO: Implement revenue calculation from POS and AR invoices
    return {
      salesRevenue: 0,
      installmentRevenue: 0,
      otherRevenue: 0,
      totalRevenue: 0,
      costOfGoodsSold: 0
    };
  };

  const calculateExpenses = async (periodStart: string, periodEnd: string, branchId?: string) => {
    // TODO: Implement expense calculation from expenses and AP invoices
    return {
      sellingExpenses: 0,
      administrativeExpenses: 0,
      operatingExpenses: 0,
      interestIncome: 0,
      interestExpense: 0,
      otherIncome: 0,
      otherExpenses: 0,
      taxExpense: 0
    };
  };

  const calculateAssets = async (asOfDate: string, branchId?: string) => {
    // TODO: Implement asset calculation
    return {
      cashAndEquivalents: 0,
      accountsReceivable: 0,
      inventory: 0,
      prepaidExpenses: 0,
      totalCurrentAssets: 0,
      propertyPlantEquipment: 0,
      accumulatedDepreciation: 0,
      intangibleAssets: 0,
      totalNonCurrentAssets: 0,
      totalAssets: 0
    };
  };

  const calculateLiabilities = async (asOfDate: string, branchId?: string) => {
    // TODO: Implement liability calculation
    return {
      accountsPayable: 0,
      shortTermDebt: 0,
      accruedExpenses: 0,
      totalCurrentLiabilities: 0,
      longTermDebt: 0,
      deferredTax: 0,
      totalNonCurrentLiabilities: 0,
      totalLiabilities: 0
    };
  };

  const calculateEquity = async (asOfDate: string, branchId?: string) => {
    // TODO: Implement equity calculation
    return {
      shareCapital: 0,
      retainedEarnings: 0,
      otherEquity: 0,
      totalEquity: 0
    };
  };

  const calculateOperatingCashFlow = async (periodStart: string, periodEnd: string, branchId?: string) => {
    // TODO: Implement operating cash flow calculation
    return {
      netIncome: 0,
      depreciation: 0,
      changesInWorkingCapital: 0,
      otherOperatingActivities: 0,
      netOperatingCashFlow: 0,
      beginningCashBalance: 0
    };
  };

  const calculateInvestingCashFlow = async (periodStart: string, periodEnd: string, branchId?: string) => {
    // TODO: Implement investing cash flow calculation
    return {
      capitalExpenditures: 0,
      assetSales: 0,
      otherInvestingActivities: 0,
      netInvestingCashFlow: 0
    };
  };

  const calculateFinancingCashFlow = async (periodStart: string, periodEnd: string, branchId?: string) => {
    // TODO: Implement financing cash flow calculation
    return {
      debtProceeds: 0,
      debtPayments: 0,
      equityProceeds: 0,
      dividendPayments: 0,
      otherFinancingActivities: 0,
      netFinancingCashFlow: 0
    };
  };

  return {
    // State
    loading,
    reports,
    currentReport,

    // Report management
    fetchReports,
    getReportById,

    // Report generation
    generateProfitLossReport,
    generateBalanceSheetReport,
    generateCashFlowReport,
    generateTaxReport,

    // Export functions
    exportReport
  };
}