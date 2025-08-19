import { useState, useCallback, useMemo, useEffect } from 'react';
import { Customer, InstallmentContract } from '@/types/pos';
import { supabase } from '@/lib/supabase';

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

// Fallback data สำหรับกรณีที่ไม่มีข้อมูลในฐานข้อมูล
const fallbackCustomers: CustomerData[] = [
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
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // โหลดข้อมูลลูกค้าจากฐานข้อมูล
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) {
        console.warn('ไม่สามารถโหลดข้อมูลลูกค้าจากฐานข้อมูล:', customersError);
        setCustomers(fallbackCustomers);
        return;
      }

      if (!customersData || customersData.length === 0) {
        setCustomers(fallbackCustomers);
        return;
      }

      // แปลงข้อมูลจากฐานข้อมูลให้ตรงกับ CustomerData interface
      const formattedCustomers: CustomerData[] = customersData.map(customer => ({
        id: customer.id,
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        idCard: customer.id_card || '',
        occupation: customer.occupation || '',
        monthlyIncome: customer.monthly_income || 0,
        creditScore: customer.credit_score || 500,
        totalContracts: customer.total_contracts || 0,
        activeContracts: customer.active_contracts || 0,
        totalFinanced: customer.total_financed || 0,
        totalPaid: customer.total_paid || 0,
        overdueAmount: customer.overdue_amount || 0,
        lastPaymentDate: customer.last_payment_date ? new Date(customer.last_payment_date) : new Date(),
        riskLevel: customer.risk_level || 'low',
        customerSince: customer.created_at ? new Date(customer.created_at) : new Date(),
        notes: customer.notes || ''
      }));

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า:', err);
      setError('ไม่สามารถโหลดข้อมูลลูกค้าได้');
      setCustomers(fallbackCustomers);
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // สร้างลูกค้าใหม่
  const createCustomer = useCallback(async (customerData: Omit<CustomerData, 'id' | 'customerSince'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const customerRecord = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        id_card: customerData.idCard,
        occupation: customerData.occupation,
        monthly_income: customerData.monthlyIncome,
        credit_score: customerData.creditScore,
        total_contracts: customerData.totalContracts,
        active_contracts: customerData.activeContracts,
        total_financed: customerData.totalFinanced,
        total_paid: customerData.totalPaid,
        overdue_amount: customerData.overdueAmount,
        last_payment_date: customerData.lastPaymentDate.toISOString(),
        risk_level: customerData.riskLevel,
        notes: customerData.notes
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([customerRecord])
        .select()
        .single();

      if (error) {
        console.error('เกิดข้อผิดพลาดในการสร้างลูกค้า:', error);
        throw new Error('ไม่สามารถสร้างลูกค้าได้');
      }

      const newCustomer: CustomerData = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        idCard: data.id_card,
        occupation: data.occupation,
        monthlyIncome: data.monthly_income,
        creditScore: data.credit_score,
        totalContracts: data.total_contracts,
        activeContracts: data.active_contracts,
        totalFinanced: data.total_financed,
        totalPaid: data.total_paid,
        overdueAmount: data.overdue_amount,
        lastPaymentDate: new Date(data.last_payment_date),
        riskLevel: data.risk_level,
        customerSince: new Date(data.created_at),
        notes: data.notes
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
      const updateRecord: any = {};
      
      if (customerData.name !== undefined) updateRecord.name = customerData.name;
      if (customerData.phone !== undefined) updateRecord.phone = customerData.phone;
      if (customerData.email !== undefined) updateRecord.email = customerData.email;
      if (customerData.address !== undefined) updateRecord.address = customerData.address;
      if (customerData.idCard !== undefined) updateRecord.id_card = customerData.idCard;
      if (customerData.occupation !== undefined) updateRecord.occupation = customerData.occupation;
      if (customerData.monthlyIncome !== undefined) updateRecord.monthly_income = customerData.monthlyIncome;
      if (customerData.creditScore !== undefined) updateRecord.credit_score = customerData.creditScore;
      if (customerData.totalContracts !== undefined) updateRecord.total_contracts = customerData.totalContracts;
      if (customerData.activeContracts !== undefined) updateRecord.active_contracts = customerData.activeContracts;
      if (customerData.totalFinanced !== undefined) updateRecord.total_financed = customerData.totalFinanced;
      if (customerData.totalPaid !== undefined) updateRecord.total_paid = customerData.totalPaid;
      if (customerData.overdueAmount !== undefined) updateRecord.overdue_amount = customerData.overdueAmount;
      if (customerData.lastPaymentDate !== undefined) updateRecord.last_payment_date = customerData.lastPaymentDate.toISOString();
      if (customerData.riskLevel !== undefined) updateRecord.risk_level = customerData.riskLevel;
      if (customerData.notes !== undefined) updateRecord.notes = customerData.notes;

      const { error } = await supabase
        .from('customers')
        .update(updateRecord)
        .eq('id', customerId);

      if (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตลูกค้า:', error);
        throw new Error('ไม่สามารถอัปเดตลูกค้าได้');
      }
      
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
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        console.error('เกิดข้อผิดพลาดในการลบลูกค้า:', error);
        throw new Error('ไม่สามารถลบลูกค้าได้');
      }
      
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
      recalculateCreditScore,
      loadCustomers
    }
  };
}