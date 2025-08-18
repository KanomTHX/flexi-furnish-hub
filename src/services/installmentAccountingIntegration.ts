import { supabase } from '@/lib/supabase';
import type { InstallmentContract, InstallmentPayment } from '@/types/unified';

export interface InstallmentAccountingIntegrationOptions {
  autoCreateAccountingEntry?: boolean;
  defaultReceivableAccountId?: string;
  defaultInterestRevenueAccountId?: string;
  defaultCashAccountId?: string;
  defaultCardAccountId?: string;
  defaultTransferAccountId?: string;
  vatRate?: number;
  includeVAT?: boolean;
  roundingPrecision?: number;
}

export interface InstallmentAccountingTransactionData {
  transactionId: string;
  description: string;
  amount: number;
  debitAccountId: string;
  creditAccountId: string;
  branchId: string;
  referenceType: 'installment_contract' | 'installment_payment';
  referenceId: string;
  transactionDate: string;
  employeeId: string;
  customerId?: string;
  accountId: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
}

class InstallmentAccountingIntegrationService {
  private defaultOptions: InstallmentAccountingIntegrationOptions = {
    autoCreateAccountingEntry: true,
    defaultReceivableAccountId: '1300', // ลูกหนี้การค้า
    defaultInterestRevenueAccountId: '4200', // รายได้ดอกเบี้ย
    defaultCashAccountId: '1100', // เงินสด
    defaultCardAccountId: '1110', // เงินฝากธนาคาร
    defaultTransferAccountId: '1120', // เงินโอน
    vatRate: 0.07,
    includeVAT: false, // เช่าซื้อมักไม่มี VAT
    roundingPrecision: 2
  };

  /**
   * สร้างรายการบัญชีเมื่อมีการสร้างสัญญาเช่าซื้อ
   */
  async createAccountingEntriesFromInstallmentContract(
    contract: InstallmentContract,
    options?: Partial<InstallmentAccountingIntegrationOptions>
  ): Promise<{ success: boolean; transactionIds: string[]; error?: string }> {
    try {
      const opts = { ...this.defaultOptions, ...options };
      const transactionIds: string[] = [];

      // คำนวณยอดเงิน
      const principalAmount = contract.financedAmount;
      const totalInterest = contract.totalInterest || 0;
      const downPayment = contract.downPayment || 0;

      // 1. บันทึกการรับเงินดาวน์ (ถ้ามี)
      if (downPayment > 0) {
        const downPaymentTransactionId = await this.createAccountingTransaction({
          transactionId: `INST-DOWN-${contract.id}-${Date.now()}`,
          description: `เงินดาวน์สัญญาเช่าซื้อ ${contract.contractNumber}`,
          amount: downPayment,
          debitAccountId: opts.defaultCashAccountId!,
          creditAccountId: '4100', // รายได้จากการขาย
          branchId: contract.branchId || 'default',
          referenceType: 'installment_contract',
          referenceId: contract.id,
          transactionDate: new Date().toISOString().split('T')[0],
          employeeId: contract.saleId || 'system',
          customerId: contract.customer.id,
          accountId: opts.defaultCashAccountId!,
          accountName: 'เงินสด',
          debitAmount: downPayment,
          creditAmount: 0
        });
        transactionIds.push(downPaymentTransactionId);

        // Credit entry สำหรับรายได้
        const revenueTransactionId = await this.createAccountingTransaction({
          transactionId: `INST-REV-${contract.id}-${Date.now()}`,
          description: `รายได้จากการขายเช่าซื้อ ${contract.contractNumber}`,
          amount: downPayment,
          debitAccountId: opts.defaultCashAccountId!,
          creditAccountId: '4100',
          branchId: contract.branchId || 'default',
          referenceType: 'installment_contract',
          referenceId: contract.id,
          transactionDate: new Date().toISOString().split('T')[0],
          employeeId: contract.saleId || 'system',
          customerId: contract.customer.id,
          accountId: '4100',
          accountName: 'รายได้จากการขาย',
          debitAmount: 0,
          creditAmount: downPayment
        });
        transactionIds.push(revenueTransactionId);
      }

      // 2. บันทึกลูกหนี้เช่าซื้อ
      const receivableTransactionId = await this.createAccountingTransaction({
        transactionId: `INST-AR-${contract.id}-${Date.now()}`,
        description: `ลูกหนี้เช่าซื้อ ${contract.contractNumber}`,
        amount: principalAmount,
        debitAccountId: opts.defaultReceivableAccountId!,
        creditAccountId: '4100',
        branchId: contract.branchId || 'default',
        referenceType: 'installment_contract',
        referenceId: contract.id,
        transactionDate: new Date().toISOString().split('T')[0],
        employeeId: contract.saleId || 'system',
        customerId: contract.customer.id,
        accountId: opts.defaultReceivableAccountId!,
        accountName: 'ลูกหนี้การค้า',
        debitAmount: principalAmount,
        creditAmount: 0
      });
      transactionIds.push(receivableTransactionId);

      // Credit entry สำหรับรายได้
      const salesRevenueTransactionId = await this.createAccountingTransaction({
        transactionId: `INST-SALES-${contract.id}-${Date.now()}`,
        description: `รายได้จากการขายเช่าซื้อ ${contract.contractNumber}`,
        amount: principalAmount,
        debitAccountId: opts.defaultReceivableAccountId!,
        creditAccountId: '4100',
        branchId: contract.branchId || 'default',
        referenceType: 'installment_contract',
        referenceId: contract.id,
        transactionDate: new Date().toISOString().split('T')[0],
        employeeId: contract.saleId || 'system',
        customerId: contract.customer.id,
        accountId: '4100',
        accountName: 'รายได้จากการขาย',
        debitAmount: 0,
        creditAmount: principalAmount
      });
      transactionIds.push(salesRevenueTransactionId);

      return {
        success: true,
        transactionIds
      };
    } catch (error) {
      console.error('Error creating accounting entries from installment contract:', error);
      return {
        success: false,
        transactionIds: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * สร้างรายการบัญชีเมื่อมีการชำระงวด
   */
  async createAccountingEntriesFromInstallmentPayment(
    payment: InstallmentPayment,
    contract: InstallmentContract,
    options?: Partial<InstallmentAccountingIntegrationOptions>
  ): Promise<{ success: boolean; transactionIds: string[]; error?: string }> {
    try {
      const opts = { ...this.defaultOptions, ...options };
      const transactionIds: string[] = [];

      // คำนวณส่วนต้นทุนและดอกเบี้ย
      const totalPayment = payment.amount_paid || payment.amount;
      const principalAmount = payment.principal_amount || totalPayment * 0.8; // สมมติ 80% เป็นต้นทุน
      const interestAmount = payment.interest_amount || totalPayment * 0.2; // สมมติ 20% เป็นดอกเบี้ย

      // เลือก account ตามวิธีการชำระเงิน
      let cashAccountId = opts.defaultCashAccountId!;
      let cashAccountName = 'เงินสด';
      
      switch (payment.payment_method) {
        case 'card':
          cashAccountId = opts.defaultCardAccountId!;
          cashAccountName = 'เงินฝากธนาคาร';
          break;
        case 'transfer':
          cashAccountId = opts.defaultTransferAccountId!;
          cashAccountName = 'เงินโอน';
          break;
        default:
          cashAccountId = opts.defaultCashAccountId!;
          cashAccountName = 'เงินสด';
      }

      // 1. บันทึกการรับเงิน (Debit Cash)
      const cashTransactionId = await this.createAccountingTransaction({
        transactionId: `INST-PAY-CASH-${payment.id}-${Date.now()}`,
        description: `รับชำระงวดที่ ${payment.installmentNumber} สัญญา ${contract.contractNumber}`,
        amount: totalPayment,
        debitAccountId: cashAccountId,
        creditAccountId: opts.defaultReceivableAccountId!,
        branchId: contract.branchId || 'default',
        referenceType: 'installment_payment',
        referenceId: payment.id,
        transactionDate: payment.paidDate || new Date().toISOString().split('T')[0],
        employeeId: 'system',
        customerId: contract.customer.id,
        accountId: cashAccountId,
        accountName: cashAccountName,
        debitAmount: totalPayment,
        creditAmount: 0
      });
      transactionIds.push(cashTransactionId);

      // 2. ลดลูกหนี้ส่วนต้นทุน (Credit Accounts Receivable)
      const receivableTransactionId = await this.createAccountingTransaction({
        transactionId: `INST-PAY-AR-${payment.id}-${Date.now()}`,
        description: `ลดลูกหนี้งวดที่ ${payment.installmentNumber} สัญญา ${contract.contractNumber}`,
        amount: principalAmount,
        debitAccountId: cashAccountId,
        creditAccountId: opts.defaultReceivableAccountId!,
        branchId: contract.branchId || 'default',
        referenceType: 'installment_payment',
        referenceId: payment.id,
        transactionDate: payment.paidDate || new Date().toISOString().split('T')[0],
        employeeId: 'system',
        customerId: contract.customer.id,
        accountId: opts.defaultReceivableAccountId!,
        accountName: 'ลูกหนี้การค้า',
        debitAmount: 0,
        creditAmount: principalAmount
      });
      transactionIds.push(receivableTransactionId);

      // 3. บันทึกรายได้ดอกเบี้ย (Credit Interest Revenue)
      if (interestAmount > 0) {
        const interestTransactionId = await this.createAccountingTransaction({
          transactionId: `INST-PAY-INT-${payment.id}-${Date.now()}`,
          description: `รายได้ดอกเบี้ยงวดที่ ${payment.installmentNumber} สัญญา ${contract.contractNumber}`,
          amount: interestAmount,
          debitAccountId: cashAccountId,
          creditAccountId: opts.defaultInterestRevenueAccountId!,
          branchId: contract.branchId || 'default',
          referenceType: 'installment_payment',
          referenceId: payment.id,
          transactionDate: payment.paidDate || new Date().toISOString().split('T')[0],
          employeeId: 'system',
          customerId: contract.customer.id,
          accountId: opts.defaultInterestRevenueAccountId!,
          accountName: 'รายได้ดอกเบี้ย',
          debitAmount: 0,
          creditAmount: interestAmount
        });
        transactionIds.push(interestTransactionId);
      }

      return {
        success: true,
        transactionIds
      };
    } catch (error) {
      console.error('Error creating accounting entries from installment payment:', error);
      return {
        success: false,
        transactionIds: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * สร้างรายการบัญชีในฐานข้อมูล
   */
  private async createAccountingTransaction(
    data: InstallmentAccountingTransactionData
  ): Promise<string> {
    const { data: result, error } = await supabase
      .from('accounting_transactions')
      .insert({
        transaction_number: data.transactionId,
        date: data.transactionDate,
        description: data.description,
        amount: data.amount,
        account_id: data.accountId,
        account_name: data.accountName,
        debit_amount: data.debitAmount,
        credit_amount: data.creditAmount,
        reference_type: data.referenceType,
        reference_id: data.referenceId,
        branch_id: data.branchId,
        employee_id: data.employeeId,
        customer_id: data.customerId,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create accounting transaction: ${error.message}`);
    }

    return result.id;
  }

  /**
   * ดึงรายการบัญชีที่เกี่ยวข้องกับสัญญาเช่าซื้อ
   */
  async getAccountingEntriesForInstallmentContract(
    contractId: string
  ): Promise<{ success: boolean; entries: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*')
        .eq('reference_type', 'installment_contract')
        .eq('reference_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
   * ดึงรายการบัญชีที่เกี่ยวข้องกับการชำระงวด
   */
  async getAccountingEntriesForInstallmentPayment(
    paymentId: string
  ): Promise<{ success: boolean; entries: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*')
        .eq('reference_type', 'installment_payment')
        .eq('reference_id', paymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
   * ลบรายการบัญชีที่เกี่ยวข้องกับสัญญาเช่าซื้อ
   */
  async deleteAccountingEntriesForInstallmentContract(
    contractId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('accounting_transactions')
        .delete()
        .eq('reference_type', 'installment_contract')
        .eq('reference_id', contractId);

      if (error) throw error;

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
export const installmentAccountingIntegration = new InstallmentAccountingIntegrationService();
export default installmentAccountingIntegration;