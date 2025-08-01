import { useState, useCallback, useMemo } from 'react';
import { Customer, InstallmentContract } from '@/types/pos';

interface CustomerData extends Customer {
  creditScore: number;
  totalContracts: number;
  activeContracts: number;
  totalFinanced: number;
  totalPaid: number;
  overdueAmount: number;
  lastPaymentDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  customerSince: Date;
  notes: string;
}

// Mock data สำหรับลูกค้า
const mockCustomers: CustomerData[] = [
  {
    id: 'customer-001',
    name: 'สมชาย ใจดี',
    phone: '081-234-5678',
    email: 'somchai@example.com',
    address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110',
    idCard: '1-2345-67890-12-3',
    occupation: 'พนักงานบริษัท',
    monthlyIncome: 35000,
    creditScore: 720,
    totalContracts: 2,
    activeContracts: 1,
    totalFinanced: 150000,
    totalPaid: 75000,
    overdueAmount: 0,
    lastPaymentDate: new Date('2024-01-15'),
    riskLevel: 'low',
    customerSince: new Date('2023-06-15'),
    notes: 'ลูกค้าดี ชำระตรงเวลา'
  },
  {
    id: 'customer-002',
    name: 'สมหญิง รักงาน',
    phone: '082-345-6789',
    email: 'somying@example.com',
    address: '456 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    idCard: '2-3456-78901-23-4',
    occupation: 'ข้าราชการ',
    monthlyIncome: 45000,
    creditScore: 780,
    totalContracts: 1,
    activeContracts: 1,
    totalFinanced: 80000,
    totalPaid: 40000,
    overdueAmount: 0,
    lastPaymentDate: new Date('2024-01-10'),
    riskLevel: 'low',
    customerSince: new Date('2023-08-20'),
    notes: 'ข้าราชการ เสถียร'
  },
  {
    id: 'customer-003',
    name: 'วิชัย ขยัน',
    phone: '083-456-7890',
    email: 'wichai@example.com',
    address: '789 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400',
    idCard: '3-4567-89012-34-5',
    occupation: 'ค้าขาย',
    monthlyIncome: 25000,
    creditScore: 650,
    totalContracts: 3,
    activeContracts: 2,
    totalFinanced: 200000,
    totalPaid: 120000,
    overdueAmount: 15000,
    lastPaymentDate: new Date('2023-12-20'),
    riskLevel: 'medium',
    customerSince: new Date('2023-03-10'),
    notes: 'ค้าขาย รายได้ไม่แน่นอน'
  },
  {
    id: 'customer-004',
    name: 'มาลี ขยัน',
    phone: '084-567-8901',
    email: 'malee@example.com',
    address: '321 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ 10400',
    idCard: '4-5678-90123-45-6',
    occupation: 'พนักงานบริษัท',
    monthlyIncome: 30000,
    creditScore: 680,
    totalContracts: 1,
    activeContracts: 1,
    totalFinanced: 60000,
    totalPaid: 30000,
    overdueAmount: 0,
    lastPaymentDate: new Date('2024-01-05'),
    riskLevel: 'low',
    customerSince: new Date('2023-09-15'),
    notes: ''
  },
  {
    id: 'customer-005',
    name: 'สุชาติ ลำบาก',
    phone: '085-678-9012',
    email: 'suchart@example.com',
    address: '654 ถนนลาดพร้าว แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230',
    idCard: '5-6789-01234-56-7',
    occupation: 'อิสระ',
    monthlyIncome: 20000,
    creditScore: 580,
    totalContracts: 2,
    activeContracts: 1,
    totalFinanced: 100000,
    totalPaid: 45000,
    overdueAmount: 25000,
    lastPaymentDate: new Date('2023-11-30'),
    riskLevel: 'high',
    customerSince: new Date('2023-01-20'),
    notes: 'ความเสี่ยงสูง ต้องติดตามใกล้ชิด'
  }
];

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerData[]>(mockCustomers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // สร้างลูกค้าใหม่
  const createCustomer = useCallback(async (customerData: Omit<CustomerData, 'id' | 'customerSince'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCustomer: CustomerData = {
        ...customerData,
        id: `customer-${Date.now()}`,
        customerSince: new Date()
      };
      
      setCustomers(prev => [newCustomer, ...prev]);
      return newCustomer;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้างลูกค้า');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // อัปเดตลูกค้า
  const updateCustomer = useCallback(async (customerId: string, customerData: Partial<CustomerData>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, ...customerData }
          : customer
      ));
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตลูกค้า');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ลบลูกค้า
  const deleteCustomer = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการลบลูกค้า');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ค้นหาลูกค้า
  const searchCustomers = useCallback((query: string) => {
    if (!query.trim()) return customers;
    
    const searchTerm = query.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.idCard.includes(searchTerm)
    );
  }, [customers]);

  // กรองลูกค้าตามความเสี่ยง
  const filterCustomersByRisk = useCallback((riskLevel: 'low' | 'medium' | 'high') => {
    return customers.filter(customer => customer.riskLevel === riskLevel);
  }, [customers]);

  // หาลูกค้าที่มีสัญญาใช้งาน
  const getActiveCustomers = useCallback(() => {
    return customers.filter(customer => customer.activeContracts > 0);
  }, [customers]);

  // หาลูกค้าที่ค้างชำระ
  const getOverdueCustomers = useCallback(() => {
    return customers.filter(customer => customer.overdueAmount > 0);
  }, [customers]);

  // อัปเดตข้อมูลลูกค้าจากสัญญา
  const updateCustomerFromContracts = useCallback((contracts: InstallmentContract[]) => {
    setCustomers(prev => prev.map(customer => {
      const customerContracts = contracts.filter(c => c.customerId === customer.id);
      
      if (customerContracts.length === 0) return customer;
      
      const totalContracts = customerContracts.length;
      const activeContracts = customerContracts.filter(c => c.status === 'active').length;
      const totalFinanced = customerContracts.reduce((sum, c) => sum + c.totalAmount, 0);
      const totalPaid = customerContracts.reduce((sum, c) => sum + c.totalPaid, 0);
      
      // คำนวณยอดค้างชำระ
      const overdueAmount = customerContracts.reduce((sum, contract) => {
        const overduePayments = contract.payments.filter(p => 
          p.status === 'overdue' || 
          (p.status === 'pending' && new Date(p.dueDate) < new Date())
        );
        return sum + overduePayments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0);
      
      // หาวันที่ชำระล่าสุด
      const allPayments = customerContracts.flatMap(c => c.payments);
      const paidPayments = allPayments.filter(p => p.status === 'paid' && p.paidDate);
      const lastPaymentDate = paidPayments.length > 0 
        ? new Date(Math.max(...paidPayments.map(p => new Date(p.paidDate!).getTime())))
        : customer.lastPaymentDate;
      
      // ประเมินความเสี่ยงใหม่
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (overdueAmount > 0) {
        const overdueRatio = overdueAmount / totalFinanced;
        if (overdueRatio > 0.3) riskLevel = 'high';
        else if (overdueRatio > 0.1) riskLevel = 'medium';
      }
      
      return {
        ...customer,
        totalContracts,
        activeContracts,
        totalFinanced,
        totalPaid,
        overdueAmount,
        lastPaymentDate,
        riskLevel
      };
    }));
  }, []);

  // คำนวณสถิติลูกค้า
  const customerStats = useMemo(() => {
    return {
      total: customers.length,
      active: customers.filter(c => c.activeContracts > 0).length,
      overdue: customers.filter(c => c.overdueAmount > 0).length,
      highRisk: customers.filter(c => c.riskLevel === 'high').length,
      averageCreditScore: customers.reduce((sum, c) => sum + c.creditScore, 0) / customers.length,
      totalFinanced: customers.reduce((sum, c) => sum + c.totalFinanced, 0),
      totalOverdue: customers.reduce((sum, c) => sum + c.overdueAmount, 0)
    };
  }, [customers]);

  // หาลูกค้าตาม ID
  const getCustomerById = useCallback((customerId: string) => {
    return customers.find(customer => customer.id === customerId);
  }, [customers]);

  // คำนวณคะแนนเครดิตใหม่
  const recalculateCreditScore = useCallback((customerId: string, contracts: InstallmentContract[]) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const customerContracts = contracts.filter(c => c.customerId === customerId);
    let score = 500; // Base score

    // Income factor
    if (customer.monthlyIncome >= 50000) score += 150;
    else if (customer.monthlyIncome >= 30000) score += 100;
    else if (customer.monthlyIncome >= 20000) score += 50;

    // Occupation factor
    const highRiskOccupations = ['ค้าขาย', 'อิสระ'];
    if (!highRiskOccupations.includes(customer.occupation)) score += 50;

    // Payment history factor
    if (customerContracts.length > 0) {
      const totalPayments = customerContracts.flatMap(c => c.payments);
      const paidOnTime = totalPayments.filter(p => 
        p.status === 'paid' && p.paidDate && new Date(p.paidDate) <= new Date(p.dueDate)
      ).length;
      const onTimeRatio = paidOnTime / totalPayments.length;
      
      if (onTimeRatio >= 0.95) score += 100;
      else if (onTimeRatio >= 0.85) score += 50;
      else if (onTimeRatio < 0.7) score -= 100;
    }

    // Overdue factor
    if (customer.overdueAmount > 0) {
      const overdueRatio = customer.overdueAmount / customer.totalFinanced;
      if (overdueRatio > 0.3) score -= 150;
      else if (overdueRatio > 0.1) score -= 75;
    }

    const finalScore = Math.min(850, Math.max(300, score));
    
    updateCustomer(customerId, { creditScore: finalScore });
  }, [customers, updateCustomer]);

  return {
    customers,
    loading,
    error,
    customerStats,
    actions: {
      createCustomer,
      updateCustomer,
      deleteCustomer,
      searchCustomers,
      filterCustomersByRisk,
      getActiveCustomers,
      getOverdueCustomers,
      updateCustomerFromContracts,
      getCustomerById,
      recalculateCreditScore
    }
  };
}