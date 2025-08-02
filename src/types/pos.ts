// POS Sales Types
export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    category: string;
    stock: number;
    image?: string;
    description?: string;
    barcode?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount?: number;
}

export interface Customer {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    
    // ข้อมูลเพิ่มเติมสำหรับสัญญาผ่อน
    idCard?: string; // เลขบัตรประชาชน
    occupation?: string; // อาชีพ
    monthlyIncome?: number; // รายได้ต่อเดือน
    workplace?: string; // สถานที่ทำงาน
    workAddress?: string; // ที่อยู่ที่ทำงาน
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    creditScore?: number; // คะแนนเครดิต
    blacklisted?: boolean; // บัญชีดำ
    notes?: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: 'cash' | 'card' | 'transfer' | 'installment';
    icon: string;
}

// Installment Contract Types
export interface InstallmentPlan {
    id: string;
    name: string;
    months: number;
    interestRate: number; // อัตราดอกเบี้ยต่อปี (%)
    downPaymentPercent: number; // เปอร์เซ็นต์เงินดาวน์
    processingFee: number; // ค่าธรรมเนียมการจัดทำสัญญา
    description?: string;
    isActive: boolean;
}

export interface InstallmentPayment {
    id: string;
    contractId: string;
    installmentNumber: number; // งวดที่
    dueDate: string;
    amount: number;
    principalAmount: number; // เงินต้น
    interestAmount: number; // ดอกเบี้ย
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    paidDate?: string;
    paidAmount?: number;
    paymentMethod?: string;
    receiptNumber?: string;
    notes?: string;
}

export interface InstallmentContract {
    id: string;
    contractNumber: string;
    saleId: string;
    customerId: string;
    customer: Customer;
    planId: string;
    plan: InstallmentPlan;
    
    // จำนวนเงิน
    totalAmount: number; // ยอดรวมสินค้า
    downPayment: number; // เงินดาวน์
    financedAmount: number; // ยอดที่ผ่อน
    totalInterest: number; // ดอกเบี้ยรวม
    processingFee: number; // ค่าธรรมเนียม
    totalPayable: number; // ยอดที่ต้องชำระรวม
    monthlyPayment: number; // ค่างวดต่อเดือน
    
    // วันที่
    contractDate: string;
    firstPaymentDate: string;
    lastPaymentDate: string;
    
    // สถานะ
    status: 'draft' | 'active' | 'completed' | 'defaulted' | 'cancelled';
    
    // การชำระเงิน
    payments: InstallmentPayment[];
    paidInstallments: number;
    remainingInstallments: number;
    totalPaid: number;
    remainingBalance: number;
    
    // ข้อมูลเพิ่มเติม
    guarantor?: Customer; // ผู้ค้ำประกัน
    collateral?: string; // หลักประกัน
    notes?: string;
    terms?: string; // เงื่อนไขพิเศษ
    
    // ข้อมูลระบบ
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: string;
}

export interface InstallmentSummary {
    totalContracts: number;
    activeContracts: number;
    totalFinanced: number;
    totalCollected: number;
    overdueAmount: number;
    overdueContracts: number;
    monthlyCollection: number;
}

export interface Sale {
    id: string;
    saleNumber: string;
    customerId?: string;
    customer?: Customer;
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: 'pending' | 'completed' | 'failed';
    status: 'draft' | 'completed' | 'cancelled' | 'refunded';
    createdAt: string;
    updatedAt: string;
    employeeId: string;
    notes?: string;
    
    // สำหรับการขายแบบผ่อน
    installmentContractId?: string;
    installmentContract?: InstallmentContract;
}

export interface POSState {
    cart: CartItem[];
    customer?: Customer;
    paymentMethod?: PaymentMethod;
    discount: number;
    tax: number;
    subtotal: number;
    total: number;
    sales: Sale[];
}