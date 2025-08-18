import { supabase } from '../lib/supabase';
import {
  FinancialStatement,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  FinancialPeriod,
  ReportFilters,
  AccountBalance,
  Account,
  AccountType,
  CashFlowItem
} from '../types/accounting';

export interface FinancialReportFilters {
  branchId?: string;
  startDate: string;
  endDate: string;
  periodType?: 'monthly' | 'quarterly' | 'yearly';
  comparisonPeriod?: {
    startDate: string;
    endDate: string;
  };
}

export interface BranchFinancialComparison {
  branchId: string;
  branchName: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  growthRate?: number;
  marketShare: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

class FinancialReportService {
  // Income Statement (Profit & Loss)
  async generateIncomeStatement(filters: FinancialReportFilters): Promise<IncomeStatement> {
    try {
      // Build revenue query with optional branch filter
      let revenueQuery = supabase
        .from('accounting_transactions')
        .select('amount, transaction_date, account_id, accounts(name, account_type)')
        .eq('transaction_type', 'credit')
        .gte('transaction_date', filters.startDate)
        .lte('transaction_date', filters.endDate)
        .in('accounts.account_type', ['revenue', 'sales']);

      if (filters.branchId) {
        revenueQuery = revenueQuery.eq('branch_id', filters.branchId);
      }

      const { data: revenueData, error: revenueError } = await revenueQuery;

      if (revenueError) throw revenueError;

      // Build expense query with optional branch filter
      let expenseQuery = supabase
        .from('accounting_transactions')
        .select('amount, transaction_date, account_id, accounts(name, account_type)')
        .eq('transaction_type', 'debit')
        .gte('transaction_date', filters.startDate)
        .lte('transaction_date', filters.endDate)
        .in('accounts.account_type', ['expense', 'cost_of_goods_sold']);

      if (filters.branchId) {
        expenseQuery = expenseQuery.eq('branch_id', filters.branchId);
      }

      const { data: expenseData, error: expenseError } = await expenseQuery;

      if (expenseError) throw expenseError;

      // Calculate totals
      const totalRevenue = revenueData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const costOfGoodsSold = expenseData?.filter(item => 
        (item.accounts as any)?.account_type === 'cost_of_goods_sold'
      ).reduce((sum, item) => sum + item.amount, 0) || 0;
      
      const operatingExpenses = expenseData?.filter(item => 
        (item.accounts as any)?.account_type === 'expense'
      ).reduce((sum, item) => sum + item.amount, 0) || 0;

      const grossProfit = totalRevenue - costOfGoodsSold;
      const netIncome = grossProfit - operatingExpenses;

      return {
        id: `income_${Date.now()}`,
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          periodType: filters.periodType || 'monthly',
          fiscalYear: new Date(filters.endDate).getFullYear()
        },
        revenues: [
          {
            accountId: 'sales',
            accountCode: 'SALES',
            accountName: 'Sales Revenue',
            balance: totalRevenue,
            debitTotal: 0,
            creditTotal: totalRevenue
          }
        ],
        expenses: [
          {
            accountId: 'cogs',
            accountCode: 'COGS',
            accountName: 'Cost of Goods Sold',
            balance: costOfGoodsSold,
            debitTotal: costOfGoodsSold,
            creditTotal: 0
          },
          {
            accountId: 'operating',
            accountCode: 'OPEX',
            accountName: 'Operating Expenses',
            balance: operatingExpenses,
            debitTotal: operatingExpenses,
            creditTotal: 0
          }
        ],
        grossProfit,
        operatingIncome: grossProfit - operatingExpenses,
        netIncome,
        totalRevenues: totalRevenue,
        totalExpenses: costOfGoodsSold + operatingExpenses,
        branchId: filters.branchId,
        generatedAt: new Date().toISOString(),
        generatedBy: 'system'
      };
    } catch (error) {
      console.error('Error generating income statement:', error);
      throw error;
    }
  }

  // Balance Sheet
  async generateBalanceSheet(filters: FinancialReportFilters): Promise<BalanceSheet> {
    try {
      // Build account query with optional branch filter
      let accountQuery = supabase
        .from('accounts')
        .select(`
          id,
          name,
          account_type,
          current_balance,
          accounting_transactions(
            amount,
            transaction_type,
            transaction_date
          )
        `);

      if (filters.branchId) {
        accountQuery = accountQuery.eq('branch_id', filters.branchId);
      }

      const { data: accountData, error: accountError } = await accountQuery;

      if (accountError) throw accountError;

      // Calculate balances by account type
      const calculateBalance = (accountType: string) => {
        return accountData?.filter(account => account.account_type === accountType)
          .reduce((sum, account) => {
            const transactions = account.accounting_transactions || [];
            const balance = transactions
              .filter(t => t.transaction_date <= filters.endDate)
              .reduce((bal, t) => {
                return t.transaction_type === 'debit' ? bal + t.amount : bal - t.amount;
              }, 0);
            return sum + balance;
          }, 0) || 0;
      };

      const currentAssets = calculateBalance('current_asset');
      const fixedAssets = calculateBalance('fixed_asset');
      const totalAssets = currentAssets + fixedAssets;

      const currentLiabilities = calculateBalance('current_liability');
      const longTermLiabilities = calculateBalance('long_term_liability');
      const totalLiabilities = currentLiabilities + longTermLiabilities;

      const equity = calculateBalance('equity');
      const retainedEarnings = totalAssets - totalLiabilities - equity;

      return {
        id: `balance_${Date.now()}`,
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          periodType: filters.periodType || 'monthly',
          fiscalYear: new Date(filters.endDate).getFullYear()
        },
        assets: {
          currentAssets,
          fixedAssets,
          totalAssets
        },
        liabilities: {
          currentLiabilities,
          longTermLiabilities,
          totalLiabilities
        },
        equity: {
          ownerEquity: [],
          retainedEarnings,
          totalEquity: equity + retainedEarnings
        },
        branchId: filters.branchId,
        generatedAt: new Date().toISOString(),
        generatedBy: 'system'
      };
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      throw error;
    }
  }

  // Cash Flow Statement
  async generateCashFlowStatement(filters: FinancialReportFilters): Promise<CashFlowStatement> {
    try {
      // Build cash transactions query with optional branch filter
      let cashQuery = supabase
        .from('accounting_transactions')
        .select(`
          amount,
          transaction_type,
          transaction_date,
          description,
          accounts(name, account_type)
        `)
        .gte('transaction_date', filters.startDate)
        .lte('transaction_date', filters.endDate)
        .eq('accounts.name', 'Cash');

      if (filters.branchId) {
        cashQuery = cashQuery.eq('branch_id', filters.branchId);
      }

      const { data: cashTransactions, error: cashError } = await cashQuery;

      if (cashError) throw cashError;

      // Categorize cash flows
      const operatingCashFlow = cashTransactions?.filter(t => 
        t.description?.includes('sale') || 
        t.description?.includes('payment') ||
        t.description?.includes('expense')
      ).reduce((sum, t) => {
        return t.transaction_type === 'debit' ? sum + t.amount : sum - t.amount;
      }, 0) || 0;

      const investingCashFlow = cashTransactions?.filter(t => 
        t.description?.includes('equipment') || 
        t.description?.includes('asset')
      ).reduce((sum, t) => {
        return t.transaction_type === 'debit' ? sum - t.amount : sum + t.amount;
      }, 0) || 0;

      const financingCashFlow = cashTransactions?.filter(t => 
        t.description?.includes('loan') || 
        t.description?.includes('investment')
      ).reduce((sum, t) => {
        return t.transaction_type === 'debit' ? sum - t.amount : sum + t.amount;
      }, 0) || 0;

      const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

      return {
        id: `cashflow_${Date.now()}`,
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          periodType: filters.periodType || 'monthly',
          fiscalYear: new Date(filters.endDate).getFullYear()
        },
        operatingActivities: [
          {
            description: 'Net Income',
            amount: operatingCashFlow
          }
        ],
        investingActivities: [
          {
            description: 'Equipment Purchases',
            amount: investingCashFlow
          }
        ],
        financingActivities: [
          {
            description: 'Loan Proceeds/Payments',
            amount: financingCashFlow
          }
        ],
        netCashFromOperating: operatingCashFlow,
        netCashFromInvesting: investingCashFlow,
        netCashFromFinancing: financingCashFlow,
        netCashFlow,
        beginningCash: 0, // Would need to calculate from previous period
        endingCash: netCashFlow,
        branchId: filters.branchId,
        generatedAt: new Date().toISOString(),
        generatedBy: 'system'
      };
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      throw error;
    }
  }

  // Financial Summary
  async getFinancialSummary(filters: FinancialReportFilters): Promise<FinancialSummary> {
    try {
      const [incomeStatement, balanceSheet, cashFlowStatement] = await Promise.all([
        this.generateIncomeStatement(filters),
        this.generateBalanceSheet(filters),
        this.generateCashFlowStatement(filters)
      ]);

      return {
        totalRevenue: incomeStatement.totalRevenues,
        totalExpenses: incomeStatement.totalExpenses,
        netIncome: incomeStatement.netIncome,
        totalAssets: balanceSheet.assets.totalAssets,
        totalLiabilities: balanceSheet.liabilities.totalLiabilities,
        totalEquity: balanceSheet.equity.totalEquity
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }

  // Branch Comparison
  async getBranchComparison(filters: Omit<FinancialReportFilters, 'branchId'>): Promise<BranchFinancialComparison[]> {
    try {
      // Get all branches
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id, name, is_active')
        .eq('is_active', true);

      if (branchError) throw branchError;

      const comparisons: BranchFinancialComparison[] = [];

      for (const branch of branches || []) {
        const branchFilters = { ...filters, branchId: branch.id };
        const summary = await this.getFinancialSummary(branchFilters);
        
        // Calculate growth rate if comparison period is provided
        let growthRate: number | undefined;
        if (filters.comparisonPeriod) {
          const previousSummary = await this.getFinancialSummary({
            ...branchFilters,
            startDate: filters.comparisonPeriod.startDate,
            endDate: filters.comparisonPeriod.endDate
          });
          
          if (previousSummary.totalRevenue > 0) {
            growthRate = ((summary.totalRevenue - previousSummary.totalRevenue) / previousSummary.totalRevenue) * 100;
          }
        }

        comparisons.push({
          branchId: branch.id,
          branchName: branch.name,
          totalRevenue: summary.totalRevenue,
          totalExpenses: summary.totalExpenses,
          netIncome: summary.netIncome,
          growthRate: growthRate,
          marketShare: 0 // Would need to calculate based on total company revenue
        });
      }

      return comparisons.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } catch (error) {
      console.error('Error getting branch comparison:', error);
      throw error;
    }
  }

  // Save Financial Statement
  async saveFinancialStatement(statement: FinancialStatement): Promise<void> {
    try {
      const { error } = await supabase
        .from('financial_statements')
        .insert({
          id: statement.id,
          type: statement.type,
          period_start: statement.period.startDate,
          period_end: statement.period.endDate,
          data: statement.data,
          generated_at: statement.generatedAt,
          generated_by: statement.generatedBy
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving financial statement:', error);
      throw error;
    }
  }

  // Get Financial Statement
  async getFinancialStatement(id: string): Promise<FinancialStatement | null> {
    try {
      const { data, error } = await supabase
        .from('financial_statements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        type: data.type,
        period: {
          startDate: data.period_start,
          endDate: data.period_end,
          fiscalYear: new Date(data.period_end).getFullYear()
        },
        data: data.data,
        generatedAt: data.generated_at,
        generatedBy: data.generated_by
      };
    } catch (error) {
      console.error('Error getting financial statement:', error);
      throw error;
    }
  }

  // Get Saved Financial Statements
  async getFinancialStatements(filters: ReportFilters): Promise<FinancialStatement[]> {
    try {
      let query = supabase
        .from('financial_statements')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }

      if (filters.startDate) {
        query = query.gte('period->start_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('period->end_date', filters.endDate);
      }

      // Note: statementType is not available in ReportFilters interface
      // This filter would need to be added to the interface if needed

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting financial statements:', error);
      throw error;
    }
  }
}

export const financialReportService = new FinancialReportService();
export default financialReportService;