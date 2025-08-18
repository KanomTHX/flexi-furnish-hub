import { supabase } from '@/lib/supabase';
import type { Sale } from '@/types/pos';
import type { SupabaseSalesTransaction } from '@/hooks/useSupabasePOS';

export interface POSAccountingIntegrationOptions {
  autoCreateAccountingEntry?: boolean;
  defaultRevenueAccountId?: string;
  defaultTaxAccountId?: string;
  defaultCashAccountId?: string;
  defaultCardAccountId?: string;
}

export interface AccountingTransactionData {
  transactionId: string;
  description: string;
  amount: number;
  debitAccountId: string;
  creditAccountId: string;
  branchId: string;
  referenceType: 'pos_sale';
  referenceId: string;
  transactionDate: string;
  employeeId: string;
  customerId?: string;
}

export class POSAccountingIntegrationService {
  private options: POSAccountingIntegrationOptions;

  constructor(options: POSAccountingIntegrationOptions = {}) {
    this.options = {
      autoCreateAccountingEntry: true,
      defaultRevenueAccountId: '4100', // รายได้จากการขาย
      defaultTaxAccountId: '2300', // ภาษีขาย
      defaultCashAccountId: '1100', // เงินสด
      defaultCardAccountId: '1120', // เงินฝากธนาคาร
      ...options
    };
  }

  /**
   * สร้างรายการบัญชีจากการขาย POS
   */
  async createAccountingEntriesFromPOSSale(
    sale: Sale | SupabaseSalesTransaction,
    options?: Partial<POSAccountingIntegrationOptions>
  ): Promise<{ success: boolean; transactionIds: string[]; error?: string }> {
    try {
      const config = { ...this.options, ...options };
      const transactionIds: string[] = [];

      // ตรวจสอบว่ามีการสร้างรายการบัญชีแล้วหรือไม่
      const existingEntries = await this.checkExistingAccountingEntries(
        'pos_sale',
        sale.id
      );

      if (existingEntries.length > 0) {
        return {
          success: true,
          transactionIds: existingEntries.map(entry => entry.id),
          error: 'Accounting entries already exist for this sale'
        };
      }

      const saleData = this.normalizeSaleData(sale);
      const transactionDate = new Date(saleData.transactionDate).toISOString();

      // 1. บันทึกรายได้จากการขาย (เครดิต)
      const revenueEntry = await this.createAccountingTransaction({
        transactionId: `POS-REV-${saleData.id}`,
        description: `รายได้จากการขาย POS ${saleData.transactionNumber}`,
        amount: saleData.subtotal, // ยอดก่อนภาษี
        debitAccountId: this.getPaymentAccountId(saleData.paymentMethod, config),
        creditAccountId: config.defaultRevenueAccountId!,
        branchId: saleData.branchId,
        referenceType: 'pos_sale',
        referenceId: saleData.id,
        transactionDate,
        employeeId: saleData.employeeId,
        customerId: saleData.customerId
      });

      if (revenueEntry) {
        transactionIds.push(revenueEntry.id);
      }

      // 2. บันทึกภาษีขาย (ถ้ามี)
      if (saleData.taxAmount > 0) {
        const taxEntry = await this.createAccountingTransaction({
          transactionId: `POS-TAX-${saleData.id}`,
          description: `ภาษีขาย POS ${saleData.transactionNumber}`,
          amount: saleData.taxAmount,
          debitAccountId: this.getPaymentAccountId(saleData.paymentMethod, config),
          creditAccountId: config.defaultTaxAccountId!,
          branchId: saleData.branchId,
          referenceType: 'pos_sale',
          referenceId: saleData.id,
          transactionDate,
          employeeId: saleData.employeeId,
          customerId: saleData.customerId
        });

        if (taxEntry) {
          transactionIds.push(taxEntry.id);
        }
      }

      // 3. บันทึกส่วนลด (ถ้ามี)
      if (saleData.discountAmount > 0) {
        const discountEntry = await this.createAccountingTransaction({
          transactionId: `POS-DISC-${saleData.id}`,
          description: `ส่วนลดการขาย POS ${saleData.transactionNumber}`,
          amount: saleData.discountAmount,
          debitAccountId: '6200', // ค่าใช้จ่ายส่วนลด
          creditAccountId: this.getPaymentAccountId(saleData.paymentMethod, config),
          branchId: saleData.branchId,
          referenceType: 'pos_sale',
          referenceId: saleData.id,
          transactionDate,
          employeeId: saleData.employeeId,
          customerId: saleData.customerId
        });

        if (discountEntry) {
          transactionIds.push(discountEntry.id);
        }
      }

      return {
        success: true,
        transactionIds
      };

    } catch (error) {
      console.error('Error creating accounting entries from POS sale:', error);
      return {
        success: false,
        transactionIds: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * สร้างรายการบัญชีเดี่ยว
   */
  private async createAccountingTransaction(
    data: AccountingTransactionData
  ): Promise<{ id: string } | null> {
    try {
      const { data: transaction, error } = await supabase
        .from('accounting_transactions')
        .insert({
          transaction_id: data.transactionId,
          description: data.description,
          amount: data.amount,
          debit_account_id: data.debitAccountId,
          credit_account_id: data.creditAccountId,
          branch_id: data.branchId,
          reference_type: data.referenceType,
          reference_id: data.referenceId,
          transaction_date: data.transactionDate,
          created_by: data.employeeId,
          customer_id: data.customerId
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating accounting transaction:', error);
        return null;
      }

      return transaction;
    } catch (error) {
      console.error('Error in createAccountingTransaction:', error);
      return null;
    }
  }

  /**
   * ตรวจสอบรายการบัญชีที่มีอยู่แล้ว
   */
  private async checkExistingAccountingEntries(
    referenceType: string,
    referenceId: string
  ): Promise<{ id: string }[]> {
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('id')
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId);

      if (error) {
        console.error('Error checking existing accounting entries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in checkExistingAccountingEntries:', error);
      return [];
    }
  }

  /**
   * แปลงข้อมูลการขายให้เป็นรูปแบบมาตรฐาน
   */
  private normalizeSaleData(sale: Sale | SupabaseSalesTransaction): {
    id: string;
    transactionNumber: string;
    branchId: string;
    employeeId: string;
    customerId?: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: string;
    transactionDate: string;
  } {
    if ('saleNumber' in sale) {
      // Sale type from POS
      return {
        id: sale.id,
        transactionNumber: sale.saleNumber,
        branchId: 'default', // TODO: Get from context
        employeeId: sale.employeeId,
        customerId: sale.customerId,
        subtotal: sale.subtotal,
        discountAmount: sale.discount,
        taxAmount: sale.tax,
        totalAmount: sale.total,
        paymentMethod: sale.paymentMethod.type,
        transactionDate: sale.createdAt
      };
    } else {
      // SupabaseSalesTransaction type
      return {
        id: sale.id,
        transactionNumber: sale.transaction_number,
        branchId: sale.branch_id,
        employeeId: sale.employee_id,
        customerId: sale.customer_id,
        subtotal: sale.total_amount - sale.tax_amount,
        discountAmount: sale.discount_amount,
        taxAmount: sale.tax_amount,
        totalAmount: sale.net_amount,
        paymentMethod: sale.payment_method,
        transactionDate: sale.transaction_date
      };
    }
  }

  /**
   * กำหนด Account ID ตามวิธีการชำระเงิน
   */
  private getPaymentAccountId(
    paymentMethod: string,
    config: POSAccountingIntegrationOptions
  ): string {
    switch (paymentMethod.toLowerCase()) {
      case 'cash':
        return config.defaultCashAccountId || '1100';
      case 'card':
      case 'credit':
      case 'transfer':
        return config.defaultCardAccountId || '1120';
      default:
        return config.defaultCashAccountId || '1100';
    }
  }

  /**
   * ดึงข้อมูลรายการบัญชีที่เกี่ยวข้องกับการขาย POS
   */
  async getAccountingEntriesForPOSSale(
    saleId: string
  ): Promise<{
    success: boolean;
    entries: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select(`
          *,
          debit_account:accounts!debit_account_id(code, name),
          credit_account:accounts!credit_account_id(code, name)
        `)
        .eq('reference_type', 'pos_sale')
        .eq('reference_id', saleId)
        .order('created_at', { ascending: true });

      if (error) {
        return {
          success: false,
          entries: [],
          error: error.message
        };
      }

      return {
        success: true,
        entries: data || []
      };
    } catch (error) {
      return {
        success: false,
        entries: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * ลบรายการบัญชีที่เกี่ยวข้องกับการขาย POS (สำหรับการยกเลิกการขาย)
   */
  async deleteAccountingEntriesForPOSSale(
    saleId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('accounting_transactions')
        .delete()
        .eq('reference_type', 'pos_sale')
        .eq('reference_id', saleId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const posAccountingIntegration = new POSAccountingIntegrationService();