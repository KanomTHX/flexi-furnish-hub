import { supabase } from './supabase';
import { InstallmentContract, InstallmentPlan, Customer, InstallmentPayment } from '@/types/pos';

export interface CreateInstallmentContractData {
  customerId: string;
  planId: string;
  totalAmount: number;
  downPayment: number;
  notes?: string;
  guarantorId?: string;
  collateral?: string;
  serialNumbers?: string[];
}

export interface UpdateInstallmentContractData {
  status?: 'active' | 'completed' | 'defaulted' | 'cancelled';
  notes?: string;
  guarantorId?: string;
  collateral?: string;
}

export interface CreatePaymentData {
  contractId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'transfer' | 'check';
  notes?: string;
  receiptNumber?: string;
}

/**
 * สร้างสัญญาผ่อนชำระใหม่
 */
export async function createInstallmentContract(
  contractData: CreateInstallmentContractData
): Promise<{ success: boolean; data?: InstallmentContract; error?: string }> {
  try {
    // ดึงข้อมูลแผนผ่อนชำระ
    const { data: plan, error: planError } = await supabase
      .from('installment_plans')
      .select('*')
      .eq('id', contractData.planId)
      .single();

    if (planError || !plan) {
      return { success: false, error: 'ไม่พบแผนผ่อนชำระที่เลือก' };
    }

    // ดึงข้อมูลลูกค้า
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', contractData.customerId)
      .single();

    if (customerError || !customer) {
      return { success: false, error: 'ไม่พบข้อมูลลูกค้า' };
    }

    // คำนวณรายละเอียดการผ่อนชำระ
    const financedAmount = contractData.totalAmount - contractData.downPayment;
    const monthlyInterestRate = plan.interest_rate / 100 / 12;
    const monthlyPayment = Math.round(
      (financedAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, plan.number_of_installments)) /
      (Math.pow(1 + monthlyInterestRate, plan.number_of_installments) - 1)
    );

    // สร้างเลขที่สัญญา
    const contractNumber = `CT${Date.now()}`;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.number_of_installments);

    // บันทึกสัญญาลงฐานข้อมูล
    const { data: newContract, error: contractError } = await supabase
      .from('installment_contracts')
      .insert({
        contract_number: contractNumber,
        customer_id: contractData.customerId,
        plan_id: contractData.planId,
        total_amount: contractData.totalAmount,
        down_payment: contractData.downPayment,
        financed_amount: financedAmount,
        monthly_payment: monthlyPayment,
        remaining_balance: financedAmount,
        interest_rate: plan.interest_rate,
        number_of_installments: plan.number_of_installments,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        notes: contractData.notes,
        guarantor_id: contractData.guarantorId,
        collateral: contractData.collateral,
        serial_numbers: contractData.serialNumbers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contractError) {
      console.error('Error creating contract:', contractError);
      return { success: false, error: 'ไม่สามารถสร้างสัญญาได้' };
    }

    // แปลงข้อมูลเป็นรูปแบบที่ใช้ในแอป
    const contract: InstallmentContract = {
      id: newContract.id,
      contractNumber: newContract.contract_number,
      customerId: newContract.customer_id,
      customerName: customer.name,
      planId: newContract.plan_id,
      totalAmount: newContract.total_amount,
      downPayment: newContract.down_payment,
      financedAmount: newContract.financed_amount,
      monthlyPayment: newContract.monthly_payment,
      remainingBalance: newContract.remaining_balance,
      interestRate: newContract.interest_rate,
      numberOfInstallments: newContract.number_of_installments,
      status: newContract.status,
      startDate: newContract.start_date,
      endDate: newContract.end_date,
      payments: [],
      notes: newContract.notes,
      guarantorId: newContract.guarantor_id,
      createdAt: newContract.created_at,
      updatedAt: newContract.updated_at
    };

    return { success: true, data: contract };
  } catch (error) {
    console.error('Error in createInstallmentContract:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างสัญญา' };
  }
}

/**
 * อัปเดตข้อมูลสัญญาผ่อนชำระ
 */
export async function updateInstallmentContract(
  contractId: string,
  updateData: UpdateInstallmentContractData
): Promise<{ success: boolean; data?: InstallmentContract; error?: string }> {
  try {
    const { data: updatedContract, error } = await supabase
      .from('installment_contracts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .select(`
        *,
        customers!inner(name),
        installment_plans!inner(plan_name)
      `)
      .single();

    if (error) {
      console.error('Error updating contract:', error);
      return { success: false, error: 'ไม่สามารถอัปเดตสัญญาได้' };
    }

    // แปลงข้อมูลเป็นรูปแบบที่ใช้ในแอป
    const contract: InstallmentContract = {
      id: updatedContract.id,
      contractNumber: updatedContract.contract_number,
      customerId: updatedContract.customer_id,
      customerName: updatedContract.customers.name,
      planId: updatedContract.plan_id,
      totalAmount: updatedContract.total_amount,
      downPayment: updatedContract.down_payment,
      financedAmount: updatedContract.financed_amount,
      monthlyPayment: updatedContract.monthly_payment,
      remainingBalance: updatedContract.remaining_balance,
      interestRate: updatedContract.interest_rate,
      numberOfInstallments: updatedContract.number_of_installments,
      status: updatedContract.status,
      startDate: updatedContract.start_date,
      endDate: updatedContract.end_date,
      payments: [],
      notes: updatedContract.notes,
      guarantorId: updatedContract.guarantor_id,
      createdAt: updatedContract.created_at,
      updatedAt: updatedContract.updated_at
    };

    return { success: true, data: contract };
  } catch (error) {
    console.error('Error in updateInstallmentContract:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตสัญญา' };
  }
}

/**
 * ลบสัญญาผ่อนชำระ
 */
export async function deleteInstallmentContract(
  contractId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // ตรวจสอบว่าสัญญามีการชำระเงินแล้วหรือไม่
    const { data: payments, error: paymentsError } = await supabase
      .from('installment_payments')
      .select('id')
      .eq('contract_id', contractId)
      .limit(1);

    if (paymentsError) {
      return { success: false, error: 'ไม่สามารถตรวจสอบประวัติการชำระเงินได้' };
    }

    if (payments && payments.length > 0) {
      return { success: false, error: 'ไม่สามารถลบสัญญาที่มีประวัติการชำระเงินแล้ว' };
    }

    // ลบสัญญา
    const { error } = await supabase
      .from('installment_contracts')
      .delete()
      .eq('id', contractId);

    if (error) {
      console.error('Error deleting contract:', error);
      return { success: false, error: 'ไม่สามารถลบสัญญาได้' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteInstallmentContract:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบสัญญา' };
  }
}

/**
 * ดึงข้อมูลสัญญาผ่อนชำระทั้งหมด
 */
export async function getInstallmentContracts(): Promise<{
  success: boolean;
  data?: InstallmentContract[];
  error?: string;
}> {
  try {
    const { data: contracts, error } = await supabase
      .from('installment_contracts')
      .select(`
        *,
        customers!inner(name, phone),
        installment_plans!inner(plan_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลสัญญาได้' };
    }

    // แปลงข้อมูลเป็นรูปแบบที่ใช้ในแอป
    const mappedContracts: InstallmentContract[] = contracts.map(contract => ({
      id: contract.id,
      contractNumber: contract.contract_number,
      customerId: contract.customer_id,
      customerName: contract.customers.name,
      planId: contract.plan_id,
      totalAmount: contract.total_amount,
      downPayment: contract.down_payment,
      financedAmount: contract.financed_amount,
      monthlyPayment: contract.monthly_payment,
      remainingBalance: contract.remaining_balance,
      interestRate: contract.interest_rate,
      numberOfInstallments: contract.number_of_installments,
      status: contract.status,
      startDate: contract.start_date,
      endDate: contract.end_date,
      payments: [],
      notes: contract.notes,
      guarantorId: contract.guarantor_id,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at
    }));

    return { success: true, data: mappedContracts };
  } catch (error) {
    console.error('Error in getInstallmentContracts:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสัญญา' };
  }
}

/**
 * ดึงข้อมูลสัญญาผ่อนชำระตาม ID
 */
export async function getInstallmentContract(
  contractId: string
): Promise<{ success: boolean; data?: InstallmentContract; error?: string }> {
  try {
    const { data: contract, error } = await supabase
      .from('installment_contracts')
      .select(`
        *,
        customers!inner(name, phone, email),
        installment_plans!inner(plan_name),
        installment_payments(*)
      `)
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('Error fetching contract:', error);
      return { success: false, error: 'ไม่พบสัญญาที่ระบุ' };
    }

    // แปลงข้อมูลการชำระเงิน
    const payments: InstallmentPayment[] = contract.installment_payments.map((payment: any) => ({
      id: payment.id,
      contractId: payment.contract_id,
      amount: payment.amount,
      paymentDate: payment.payment_date,
      paymentMethod: payment.payment_method,
      notes: payment.notes,
      receiptNumber: payment.receipt_number,
      createdAt: payment.created_at
    }));

    // แปลงข้อมูลสัญญา
    const mappedContract: InstallmentContract = {
      id: contract.id,
      contractNumber: contract.contract_number,
      customerId: contract.customer_id,
      customerName: contract.customers.name,
      planId: contract.plan_id,
      totalAmount: contract.total_amount,
      downPayment: contract.down_payment,
      financedAmount: contract.financed_amount,
      monthlyPayment: contract.monthly_payment,
      remainingBalance: contract.remaining_balance,
      interestRate: contract.interest_rate,
      numberOfInstallments: contract.number_of_installments,
      status: contract.status,
      startDate: contract.start_date,
      endDate: contract.end_date,
      payments,
      notes: contract.notes,
      guarantorId: contract.guarantor_id,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at
    };

    return { success: true, data: mappedContract };
  } catch (error) {
    console.error('Error in getInstallmentContract:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสัญญา' };
  }
}

/**
 * บันทึกการชำระเงิน
 */
export async function createInstallmentPayment(
  paymentData: CreatePaymentData
): Promise<{ success: boolean; data?: InstallmentPayment; error?: string }> {
  try {
    // ดึงข้อมูลสัญญา
    const { data: contract, error: contractError } = await supabase
      .from('installment_contracts')
      .select('remaining_balance, monthly_payment')
      .eq('id', paymentData.contractId)
      .single();

    if (contractError || !contract) {
      return { success: false, error: 'ไม่พบสัญญาที่ระบุ' };
    }

    // บันทึกการชำระเงิน
    const { data: newPayment, error: paymentError } = await supabase
      .from('installment_payments')
      .insert({
        contract_id: paymentData.contractId,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes,
        receipt_number: paymentData.receiptNumber,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return { success: false, error: 'ไม่สามารถบันทึกการชำระเงินได้' };
    }

    // อัปเดตยอดคงเหลือในสัญญา
    const newRemainingBalance = Math.max(0, contract.remaining_balance - paymentData.amount);
    const newStatus = newRemainingBalance === 0 ? 'completed' : 'active';

    const { error: updateError } = await supabase
      .from('installment_contracts')
      .update({
        remaining_balance: newRemainingBalance,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentData.contractId);

    if (updateError) {
      console.error('Error updating contract balance:', updateError);
      // ไม่ return error เพราะการชำระเงินสำเร็จแล้ว
    }

    // แปลงข้อมูลการชำระเงิน
    const payment: InstallmentPayment = {
      id: newPayment.id,
      contractId: newPayment.contract_id,
      amount: newPayment.amount,
      paymentDate: newPayment.payment_date,
      paymentMethod: newPayment.payment_method,
      notes: newPayment.notes,
      receiptNumber: newPayment.receipt_number,
      createdAt: newPayment.created_at
    };

    return { success: true, data: payment };
  } catch (error) {
    console.error('Error in createInstallmentPayment:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน' };
  }
}

/**
 * ตรวจสอบสิทธิ์การทำสัญญาผ่อนชำระ
 */
export async function checkInstallmentEligibility(
  customerId: string,
  requestedAmount: number
): Promise<{
  success: boolean;
  eligible?: boolean;
  reason?: string;
  maxAmount?: number;
  error?: string;
}> {
  try {
    // ดึงข้อมูลลูกค้า
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('monthly_income')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return { success: false, error: 'ไม่พบข้อมูลลูกค้า' };
    }

    // ดึงสัญญาที่ยังใช้งานอยู่
    const { data: activeContracts, error: contractsError } = await supabase
      .from('installment_contracts')
      .select('monthly_payment')
      .eq('customer_id', customerId)
      .in('status', ['active']);

    if (contractsError) {
      return { success: false, error: 'ไม่สามารถตรวจสอบสัญญาที่มีอยู่ได้' };
    }

    // คำนวณภาระหนี้ปัจจุบัน
    const currentMonthlyPayments = activeContracts?.reduce(
      (sum, contract) => sum + contract.monthly_payment,
      0
    ) || 0;

    // กำหนดอัตราส่วนหนี้ต่อรายได้สูงสุด (40%)
    const maxDebtRatio = 0.4;
    const maxMonthlyPayment = customer.monthly_income * maxDebtRatio;
    const availablePaymentCapacity = maxMonthlyPayment - currentMonthlyPayments;

    // ประมาณการยอดเงินสูงสุดที่สามารถขอได้ (สมมติดอกเบี้ย 15% ต่อปี, 12 เดือน)
    const estimatedInterestRate = 0.15 / 12; // 15% ต่อปี แบ่งเป็นรายเดือน
    const estimatedMonths = 12;
    const maxAmount = Math.floor(
      (availablePaymentCapacity * (Math.pow(1 + estimatedInterestRate, estimatedMonths) - 1)) /
      (estimatedInterestRate * Math.pow(1 + estimatedInterestRate, estimatedMonths))
    );

    if (availablePaymentCapacity <= 0) {
      return {
        success: true,
        eligible: false,
        reason: 'ลูกค้ามีภาระหนี้เกินกำลังการชำระแล้ว',
        maxAmount: 0
      };
    }

    if (requestedAmount > maxAmount) {
      return {
        success: true,
        eligible: false,
        reason: `ยอดเงินที่ขอเกินกำลังการชำระ สามารถขอได้สูงสุด ${maxAmount.toLocaleString()} บาท`,
        maxAmount
      };
    }

    return {
      success: true,
      eligible: true,
      maxAmount
    };
  } catch (error) {
    console.error('Error in checkInstallmentEligibility:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' };
  }
}

/**
 * คำนวณรายละเอียดการผ่อนชำระ
 */
export function calculateInstallmentDetails(
  totalAmount: number,
  plan: InstallmentPlan
): {
  downPayment: number;
  financedAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
} {
  const downPayment = Math.round(totalAmount * (plan.downPaymentPercent / 100));
  const financedAmount = totalAmount - downPayment;
  const monthlyInterestRate = plan.interestRate / 100 / 12;
  
  const monthlyPayment = Math.round(
    (financedAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, plan.months)) /
    (Math.pow(1 + monthlyInterestRate, plan.months) - 1)
  );
  
  const totalPayable = (monthlyPayment * plan.months) + downPayment + plan.processingFee;
  const totalInterest = totalPayable - totalAmount - plan.processingFee;

  return {
    downPayment,
    financedAmount,
    monthlyPayment,
    totalInterest,
    totalPayable
  };
}

/**
 * ดึงสถิติสัญญาผ่อนชำระ
 */
export async function getInstallmentStatistics(): Promise<{
  success: boolean;
  data?: {
    totalContracts: number;
    activeContracts: number;
    completedContracts: number;
    defaultedContracts: number;
    totalOutstanding: number;
    totalCollected: number;
    overdueContracts: number;
  };
  error?: string;
}> {
  try {
    // ดึงข้อมูลสัญญาทั้งหมด
    const { data: contracts, error: contractsError } = await supabase
      .from('installment_contracts')
      .select('status, remaining_balance, end_date');

    if (contractsError) {
      return { success: false, error: 'ไม่สามารถดึงข้อมูลสถิติได้' };
    }

    // ดึงข้อมูลการชำระเงินทั้งหมด
    const { data: payments, error: paymentsError } = await supabase
      .from('installment_payments')
      .select('amount');

    if (paymentsError) {
      return { success: false, error: 'ไม่สามารถดึงข้อมูลการชำระเงินได้' };
    }

    const now = new Date();
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const defaultedContracts = contracts.filter(c => c.status === 'defaulted').length;
    const totalOutstanding = contracts
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.remaining_balance, 0);
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const overdueContracts = contracts.filter(
      c => c.status === 'active' && new Date(c.end_date) < now
    ).length;

    return {
      success: true,
      data: {
        totalContracts,
        activeContracts,
        completedContracts,
        defaultedContracts,
        totalOutstanding,
        totalCollected,
        overdueContracts
      }
    };
  } catch (error) {
    console.error('Error in getInstallmentStatistics:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ' };
  }
}