import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Customer, 
  CustomerData, 
  CustomerFilterOptions,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerMetrics,
  CustomerAnalytics
} from '@/types/customer';
import { InstallmentContract } from '@/types/pos';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ข้อมูลลูกค้าจะโหลดจากฐานข้อมูล Supabase

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
        setCustomers([]);
        return;
      }

      if (!customersData || customersData.length === 0) {
        setCustomers([]);
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
      setCustomers([]);
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

  // จัดการผู้ค้ำประกัน
  const addGuarantor = useCallback(async (customerId: string, guarantorData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('guarantors')
        .insert({
          customer_id: customerId,
          name: guarantorData.name,
          phone: guarantorData.phone,
          email: guarantorData.email,
          address: guarantorData.address,
          id_card: guarantorData.idCard,
          relationship: guarantorData.relationship,
          occupation: guarantorData.occupation,
          monthly_income: guarantorData.monthlyIncome
        });

      if (error) {
        console.error('เกิดข้อผิดพลาดในการเพิ่มผู้ค้ำประกัน:', error);
        throw new Error('ไม่สามารถเพิ่มผู้ค้ำประกันได้');
      }
      
      toast.success('เพิ่มผู้ค้ำประกันสำเร็จ');
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเพิ่มผู้ค้ำประกัน');
      toast.error('ไม่สามารถเพิ่มผู้ค้ำประกันได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ดึงข้อมูลผู้ค้ำประกัน
  const getGuarantors = useCallback(async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('guarantors')
        .select('*')
        .eq('customer_id', customerId);

      if (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ค้ำประกัน:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ค้ำประกัน:', err);
      return [];
    }
  }, []);

  // คำนวณ Customer Metrics
  const calculateCustomerMetrics = useCallback((customerId: string): CustomerMetrics => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return {
        totalContracts: 0,
        activeContracts: 0,
        completedContracts: 0,
        totalFinanced: 0,
        totalPaid: 0,
        remainingBalance: 0,
        overdueAmount: 0,
        onTimePaymentRate: 0,
        averageContractValue: 0,
        creditUtilization: 0,
        daysSinceLastPayment: 0,
        totalInterestPaid: 0
      };
    }

    const completedContracts = customer.totalContracts - customer.activeContracts;
    const remainingBalance = customer.totalFinanced - customer.totalPaid;
    const averageContractValue = customer.totalContracts > 0 ? customer.totalFinanced / customer.totalContracts : 0;
    const creditUtilization = customer.monthlyIncome > 0 ? (customer.totalFinanced / (customer.monthlyIncome * 12)) * 100 : 0;
    const daysSinceLastPayment = customer.lastPaymentDate ? 
      Math.floor((new Date().getTime() - customer.lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      totalContracts: customer.totalContracts,
      activeContracts: customer.activeContracts,
      completedContracts,
      totalFinanced: customer.totalFinanced,
      totalPaid: customer.totalPaid,
      remainingBalance,
      overdueAmount: customer.overdueAmount,
      onTimePaymentRate: 85, // จะคำนวณจากข้อมูลจริงในอนาคต
      averageContractValue,
      creditUtilization,
      daysSinceLastPayment,
      totalInterestPaid: customer.totalPaid * 0.15 // ประมาณการดอกเบี้ย
    };
  }, [customers]);

  // คำนวณ Customer Analytics
  const calculateCustomerAnalytics = useCallback((): CustomerAnalytics => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const activeCustomers = customers.filter(c => c.activeContracts > 0);
    const newThisMonth = customers.filter(c => new Date(c.customerSince) >= thisMonth);
    const newLastMonth = customers.filter(c => {
      const customerSince = new Date(c.customerSince);
      return customerSince >= lastMonth && customerSince < thisMonth;
    });
    
    const riskDistribution = customers.reduce((acc, customer) => {
      acc[customer.riskLevel]++;
      return acc;
    }, { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>);
    
    const totalValue = customers.reduce((sum, c) => sum + c.totalFinanced, 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.totalFinanced - c.totalPaid), 0);
    const totalOverdue = customers.reduce((sum, c) => sum + c.overdueAmount, 0);
    
    const totalPayments = customers.reduce((sum, c) => sum + c.totalPaid, 0);
    const onTimePayments = customers.filter(c => c.overdueAmount === 0).length;
    const onTimeRate = customers.length > 0 ? (onTimePayments / customers.length) * 100 : 0;
    
    const topCustomersByValue = [...customers]
      .sort((a, b) => b.totalFinanced - a.totalFinanced)
      .slice(0, 10);
    
    const topCustomersByPayments = [...customers]
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10);
    
    const riskCustomers = customers
      .filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical')
      .sort((a, b) => b.overdueAmount - a.overdueAmount)
      .slice(0, 10);
    
    return {
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      newCustomersThisMonth: newThisMonth.length,
      newCustomersLastMonth: newLastMonth.length,
      
      lowRiskCustomers: riskDistribution.low,
      mediumRiskCustomers: riskDistribution.medium,
      highRiskCustomers: riskDistribution.high,
      criticalRiskCustomers: riskDistribution.critical,
      
      totalCustomerValue: totalValue,
      averageCustomerValue: customers.length > 0 ? totalValue / customers.length : 0,
      totalOutstandingAmount: totalOutstanding,
      totalOverdueAmount: totalOverdue,
      
      onTimePaymentRate: onTimeRate,
      averagePaymentDelay: 0, // TODO: Calculate from payment history
      defaultRate: 0, // TODO: Calculate from contract data
      
      customerGrowthRate: newLastMonth.length > 0 ? ((newThisMonth.length - newLastMonth.length) / newLastMonth.length) * 100 : 0,
      customerRetentionRate: 95, // TODO: Calculate from actual data
      customerChurnRate: 5, // TODO: Calculate from actual data
      
      topCustomersByValue,
      topCustomersByPayments,
      riskCustomers
    };
  }, [customers]);

  // กรองลูกค้าขั้นสูง
  const filterCustomers = useCallback((options: CustomerFilterOptions) => {
    let filtered = [...customers];

    if (options.riskLevel) {
      filtered = filtered.filter(c => c.riskLevel === options.riskLevel);
    }

    if (options.creditScoreRange) {
      const { min, max } = options.creditScoreRange;
      filtered = filtered.filter(c => c.creditScore >= min && c.creditScore <= max);
    }

    if (options.incomeRange) {
      const { min, max } = options.incomeRange;
      filtered = filtered.filter(c => c.monthlyIncome >= min && c.monthlyIncome <= max);
    }

    if (options.hasActiveContracts !== undefined) {
      filtered = filtered.filter(c => 
        options.hasActiveContracts ? c.activeContracts > 0 : c.activeContracts === 0
      );
    }

    if (options.hasOverdue !== undefined) {
      filtered = filtered.filter(c => 
        options.hasOverdue ? c.overdueAmount > 0 : c.overdueAmount === 0
      );
    }

    if (options.occupation) {
      filtered = filtered.filter(c => c.occupation === options.occupation);
    }

    if (options.customerSinceRange) {
      const { start, end } = options.customerSinceRange;
      filtered = filtered.filter(c => c.customerSince >= start && c.customerSince <= end);
    }

    return filtered;
  }, [customers]);

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
      loadCustomers,
      addGuarantor,
      getGuarantors,
      calculateCustomerMetrics,
      calculateCustomerAnalytics,
      filterCustomers
    }
  };
}