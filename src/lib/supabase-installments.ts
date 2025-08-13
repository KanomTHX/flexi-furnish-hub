// ===================================================================
// SUPABASE INSTALLMENT MANAGEMENT FUNCTIONS
// ฟังก์ชันจัดการสัญญาผ่อนชำระ - ใช้ Column Names ที่ถูกต้อง
// ===================================================================

import { supabase } from './supabase';
import { InstallmentContract, InstallmentPayment, Customer, InstallmentPlan } from '@/types/installments';
import { calculateMonthlyPayment, calculateTotalInterest } from '@/utils/installmentHelpers';

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * สร้าง UUID ที่ใช้ได้ในทุกเบราว์เซอร์
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ===================================================================
// INSTALLMENT CONTRACT OPERATIONS
// ===================================================================

/**
 * สร้างสัญญาผ่อนชำระใหม่
 */
export async function createInstallmentContract(
  contractData: {
    customer: Customer;
    plan: InstallmentPlan;
    totalAmount: number;
    downPayment: number;
    guarantorId?: string;
    collateral?: string;
    terms?: string;
    notes?: string;
  }
): Promise<InstallmentContract> {
  try {
    const contractNumber = `CONTRACT-${Date.now()}`;
    const financedAmount = contractData.totalAmount - contractData.downPayment;
    const monthlyPayment = calculateMonthlyPayment(
      financedAmount,
      contractData.plan.interestRate,
      contractData.plan.months
    );
    const totalInterest = calculateTotalInterest(financedAmount, monthlyPayment, contractData.plan.months);
    const totalPayable = financedAmount + totalInterest + contractData.plan.processingFee;

    // สร้างสัญญาในฐานข้อมูล (ใช้ column names ที่ถูกต้อง)
    const { data, error } = await supabase
      .from('installment_contracts')
      .insert({
        contract_number: contractNumber,
        status: 'pending', // ใช้ 'pending' แทน 'draft'
        transaction_id: generateUUID(), // สร้าง UUID ใหม่
        customer_id: contractData.customer.id,
        plan_id: contractData.plan.id,
        guarantor_id: contractData.guarantorId || null,
        down_payment: contractData.downPayment,
        remaining_amount: financedAmount,
        monthly_payment: monthlyPayment,
        financed_amount: financedAmount,
        total_interest: totalInterest,
        processing_fee: contractData.plan.processingFee,
        total_payable: totalPayable,
        contract_date: new Date().toISOString().split('T')[0],
        first_payment_date: getFirstPaymentDate(),
        last_payment_date: getLastPaymentDate(contractData.plan.months),
        paid_installments: 0,
        remaining_installments: contractData.plan.months,
        total_paid: 0,
        remaining_balance: totalPayable,
        collateral: contractData.collateral,
        terms: contractData.terms,
        notes: contractData.notes,
        created_by: 'current_user' // TODO: ใช้ user ID จริง
      })
      .select()
      .single();

    if (error) throw error;

    // สร้างตารางการชำระเงิน
    await createPaymentSchedule(data.id, contractData.plan, monthlyPayment);

    return mapContractFromDB(data);
  } catch (error) {
    console.error('Error creating installment contract:', error);
    throw new Error('ไม่สามารถสร้างสัญญาผ่อนชำระได้');
  }
}

/**
 * ดึงสัญญาผ่อนชำระทั้งหมด
 */
export async function getInstallmentContracts(branchId?: string): Promise<InstallmentContract[]> {
  try {
    let query = supabase
      .from('installment_contracts')
      .select(`
        *,
        customers(*),
        installment_plans(*),
        guarantors(*)
      `)
      .order('created_at', { ascending: false });

    if (branchId) {
      // ใช้ join กับ customers table เพื่อ filter ตาม branch
      query = query.eq('customers.branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapContractFromDB);
  } catch (error) {
    console.error('Error fetching installment contracts:', error);
    throw new Error('ไม่สามารถดึงข้อมูลสัญญาได้');
  }
}

/**
 * ดึงสัญญาตาม ID
 */
export async function getInstallmentContractById(id: string): Promise<InstallmentContract | null> {
  try {
    const { data, error } = await supabase
      .from('installment_contracts')
      .select(`
        *,
        customers(*),
        installment_plans(*),
        guarantors(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapContractFromDB(data);
  } catch (error) {
    console.error('Error fetching installment contract:', error);
    throw new Error('ไม่สามารถดึงข้อมูลสัญญาได้');
  }
}

// ===================================================================
// INSTALLMENT PAYMENT OPERATIONS
// ===================================================================

/**
 * สร้างตารางการชำระเงิน
 */
async function createPaymentSchedule(
  contractId: string,
  plan: InstallmentPlan,
  monthlyPayment: number
): Promise<void> {
  try {
    const payments = [];
    const startDate = new Date();
    
    for (let i = 1; i <= plan.months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      payments.push({
        contract_id: contractId, // เพิ่ม contract_id
        installment_plan_id: plan.id, // ใช้ชื่อคอลัมน์ที่ถูกต้อง
        payment_number: i, // ใช้ payment_number แทน installment_number
        due_date: dueDate.toISOString().split('T')[0],
        amount_due: monthlyPayment, // ใช้ amount_due แทน amount
        amount_paid: 0,
        principal_amount: calculatePrincipalAmount(monthlyPayment, plan.interestRate),
        interest_amount: calculateInterestAmount(monthlyPayment, plan.interestRate),
        status: 'pending',
        late_fee: 0,
        discount: 0
      });
    }

    const { error } = await supabase
      .from('installment_payments')
      .insert(payments);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating payment schedule:', error);
    throw new Error('ไม่สามารถสร้างตารางการชำระเงินได้');
  }
}

/**
 * ดึงการชำระเงินของสัญญา
 */
export async function getContractPayments(contractId: string): Promise<InstallmentPayment[]> {
  try {
    const { data, error } = await supabase
      .from('installment_payments')
      .select('*')
      .eq('contract_id', contractId) // ใช้ contract_id
      .order('payment_number'); // ใช้ payment_number

    if (error) throw error;

    return data.map(mapPaymentFromDB);
  } catch (error) {
    console.error('Error fetching contract payments:', error);
    throw new Error('ไม่สามารถดึงข้อมูลการชำระเงินได้');
  }
}

/**
 * บันทึกการชำระเงิน
 */
export async function recordPayment(
  paymentId: string,
  paidAmount: number,
  paymentMethod: string,
  receiptNumber?: string
): Promise<InstallmentPayment> {
  try {
    const { data, error } = await supabase
      .from('installment_payments')
      .update({
        amount_paid: paidAmount, // ใช้ amount_paid
        payment_date: new Date().toISOString().split('T')[0], // ใช้ payment_date
        payment_method: paymentMethod,
        receipt_number: receiptNumber,
        status: paidAmount >= 0 ? 'paid' : 'partial',
        processed_by: 'current_user' // TODO: ใช้ user ID จริง
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return mapPaymentFromDB(data);
  } catch (error) {
    console.error('Error recording payment:', error);
    throw new Error('ไม่สามารถบันทึกการชำระเงินได้');
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================



/**
 * คำนวณเงินต้นในแต่ละงวด
 */
function calculatePrincipalAmount(monthlyPayment: number, annualRate: number): number {
  if (annualRate === 0) return monthlyPayment;
  // สำหรับการคำนวณที่ซับซ้อนกว่านี้ ต้องใช้ amortization schedule
  return monthlyPayment * 0.8; // ประมาณการ
}

/**
 * คำนวณดอกเบี้ยในแต่ละงวด
 */
function calculateInterestAmount(monthlyPayment: number, annualRate: number): number {
  if (annualRate === 0) return 0;
  return monthlyPayment * 0.2; // ประมาณการ
}

/**
 * หาวันที่ชำระงวดแรก (เดือนถัดไป)
 */
function getFirstPaymentDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split('T')[0];
}

/**
 * หาวันที่ชำระงวดสุดท้าย
 */
function getLastPaymentDate(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

/**
 * แปลงข้อมูลสัญญาจากฐานข้อมูล
 */
function mapContractFromDB(data: any): InstallmentContract {
  return {
    id: data.id,
    transaction_id: data.transaction_id,
    contractNumber: data.contract_number,
    customerId: data.customer_id,
    customer: data.customers,
    planId: data.plan_id,
    plan: data.installment_plans,
    guarantorId: data.guarantor_id,
    guarantor: data.guarantors,
    totalAmount: data.remaining_amount + data.down_payment,
    total_months: data.total_months,
    downPayment: data.down_payment,
    down_payment: data.down_payment,
    monthly_payment: data.monthly_payment,
    remaining_amount: data.remaining_amount,
    financedAmount: data.financed_amount || data.remaining_amount,
    totalInterest: data.total_interest || 0,
    processingFee: data.processing_fee || 0,
    totalPayable: data.total_payable || data.remaining_amount,
    monthlyPayment: data.monthly_payment,
    contractDate: data.contract_date || data.created_at,
    start_date: data.start_date,
    end_date: data.end_date,
    interest_rate: data.interest_rate,
    firstPaymentDate: data.first_payment_date,
    lastPaymentDate: data.last_payment_date,
    status: data.status,
    payments: [],
    paidInstallments: data.paid_installments || 0,
    remainingInstallments: data.remaining_installments || 0,
    totalPaid: data.total_paid || 0,
    remainingBalance: data.remaining_balance || data.remaining_amount,
    collateral: data.collateral,
    terms: data.terms,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    branchId: data.branch_id
  };
}

/**
 * แปลงข้อมูลการชำระเงินจากฐานข้อมูล
 */
function mapPaymentFromDB(data: any): InstallmentPayment {
  return {
    id: data.id,
    contract_id: data.contract_id,
    payment_number: data.payment_number, // use correct field name
    dueDate: data.due_date,
    amount: data.amount_due, // map amount_due -> amount
    principalAmount: data.principal_amount || 0,
    interestAmount: data.interest_amount || 0,
    status: data.status,
    paidDate: data.payment_date, // map payment_date -> paidDate
    paidAmount: data.amount_paid, // map amount_paid -> paidAmount
    paymentMethod: data.payment_method,
    receiptNumber: data.receipt_number,
    lateFee: data.late_fee || 0,
    discount: data.discount || 0,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    processedBy: data.processed_by,
    branchId: data.branch_id
  };
}