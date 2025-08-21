import { supabase } from '@/lib/supabase';
import { InstallmentContract, InstallmentPayment, Customer } from '@/types/pos';
import { Database } from '@/integrations/supabase/types';

type InstallmentContractInsert = Database['public']['Tables']['installment_contracts']['Insert'];
type InstallmentContractUpdate = Database['public']['Tables']['installment_contracts']['Update'];
type InstallmentPaymentInsert = Database['public']['Tables']['installment_payments']['Insert'];

export interface CreateInstallmentContractData {
  customer_id: string;
  total_amount: number;
  down_payment: number;
  monthly_payment: number;
  installment_months: number;
  interest_rate: number;
  start_date: string;
  guarantor_name?: string;
  guarantor_phone?: string;
  guarantor_id_card?: string;
  guarantor_address?: string;
  guarantor_occupation?: string;
  guarantor_income?: number;
  notes?: string;
  branch_id?: string;
}

export interface CreateInstallmentPaymentData {
  contract_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  branch_id?: string;
}

/**
 * สร้างสัญญาผ่อนชำระใหม่
 */
export async function createInstallmentContract(data: CreateInstallmentContractData): Promise<InstallmentContract> {
  try {
    const contractData: InstallmentContractInsert = {
      customer_id: data.customer_id,
      total_amount: data.total_amount,
      down_payment: data.down_payment,
      monthly_payment: data.monthly_payment,
      installment_months: data.installment_months,
      interest_rate: data.interest_rate,
      start_date: data.start_date,
      guarantor_name: data.guarantor_name,
      guarantor_phone: data.guarantor_phone,
      guarantor_id_card: data.guarantor_id_card,
      guarantor_address: data.guarantor_address,
      guarantor_occupation: data.guarantor_occupation,
      guarantor_income: data.guarantor_income,
      notes: data.notes,
      branch_id: data.branch_id,
      status: 'active',
      remaining_amount: data.total_amount - data.down_payment,
      next_payment_date: new Date(new Date(data.start_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    const { data: contract, error } = await supabase
      .from('installment_contracts')
      .insert(contractData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create installment contract: ${error.message}`);
    }

    return contract as InstallmentContract;
  } catch (error) {
    console.error('Error creating installment contract:', error);
    throw error;
  }
}

/**
 * อัปเดตสัญญาผ่อนชำระ
 */
export async function updateInstallmentContract(
  contractId: string, 
  updates: Partial<CreateInstallmentContractData>
): Promise<InstallmentContract> {
  try {
    const updateData: InstallmentContractUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data: contract, error } = await supabase
      .from('installment_contracts')
      .update(updateData)
      .eq('id', contractId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update installment contract: ${error.message}`);
    }

    return contract as InstallmentContract;
  } catch (error) {
    console.error('Error updating installment contract:', error);
    throw error;
  }
}

/**
 * สร้างการชำระเงินงวด
 */
export async function createInstallmentPayment(data: CreateInstallmentPaymentData): Promise<InstallmentPayment> {
  try {
    const paymentData: InstallmentPaymentInsert = {
      contract_id: data.contract_id,
      amount: data.amount,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      notes: data.notes,
      branch_id: data.branch_id,
      status: 'completed'
    };

    const { data: payment, error } = await supabase
      .from('installment_payments')
      .insert(paymentData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create installment payment: ${error.message}`);
    }

    // อัปเดตยอดคงเหลือในสัญญา
    const { data: contract } = await supabase
      .from('installment_contracts')
      .select('remaining_amount, installment_months')
      .eq('id', data.contract_id)
      .single();

    if (contract) {
      const newRemainingAmount = Math.max(0, contract.remaining_amount - data.amount);
      const nextPaymentDate = new Date(new Date(data.payment_date).getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      await supabase
        .from('installment_contracts')
        .update({
          remaining_amount: newRemainingAmount,
          next_payment_date: newRemainingAmount > 0 ? nextPaymentDate : null,
          status: newRemainingAmount === 0 ? 'completed' : 'active'
        })
        .eq('id', data.contract_id);
    }

    return payment as InstallmentPayment;
  } catch (error) {
    console.error('Error creating installment payment:', error);
    throw error;
  }
}

/**
 * ดึงข้อมูลสัญญาผ่อนชำระทั้งหมด
 */
export async function getInstallmentContracts(branchId?: string): Promise<InstallmentContract[]> {
  try {
    let query = supabase
      .from('installment_contracts')
      .select(`
        *,
        customers (
          id,
          name,
          phone,
          email,
          id_card
        )
      `)
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data: contracts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch installment contracts: ${error.message}`);
    }

    return contracts as InstallmentContract[];
  } catch (error) {
    console.error('Error fetching installment contracts:', error);
    throw error;
  }
}

/**
 * ดึงข้อมูลการชำระเงินของสัญญา
 */
export async function getInstallmentPayments(contractId: string): Promise<InstallmentPayment[]> {
  try {
    const { data: payments, error } = await supabase
      .from('installment_payments')
      .select('*')
      .eq('contract_id', contractId)
      .order('payment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch installment payments: ${error.message}`);
    }

    return payments as InstallmentPayment[];
  } catch (error) {
    console.error('Error fetching installment payments:', error);
    throw error;
  }
}

/**
 * ลบสัญญาผ่อนชำระ
 */
export async function deleteInstallmentContract(contractId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('installment_contracts')
      .delete()
      .eq('id', contractId);

    if (error) {
      throw new Error(`Failed to delete installment contract: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting installment contract:', error);
    throw error;
  }
}