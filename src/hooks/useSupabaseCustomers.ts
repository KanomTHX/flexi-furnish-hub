import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, InstallmentContract } from '@/types/pos';

interface SupabaseCustomer {
  id: string;
  branch_id: string;
  customer_code: string;
  type: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  id_card?: string;
  tax_id?: string;
  occupation?: string;
  monthly_income?: number;
  credit_limit?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

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

export function useSupabaseCustomers() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // แปลงข้อมูลจาก Supabase เป็น CustomerData
  const convertToCustomerData = useCallback((customer: SupabaseCustomer): CustomerData => {
    // คำนวณคะแนนเครดิตเบื้องต้น
    let creditScore = 500; // Base score
    
    if (customer.monthly_income) {
      if (customer.monthly_income >= 50000) creditScore += 150;
      else if (customer.monthly_income >= 30000) creditScore += 100;
      else if (customer.monthly_income >= 20000) creditScore += 50;
    }

    const highRiskOccupations = ['ค้าขาย', 'อิสระ'];
    if (customer.occupation && !highRiskOccupations.includes(customer.occupation)) {
      creditScore += 50;
    }

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      idCard: customer.id_card || '',
      occupation: customer.occupation || '',
      monthlyIncome: customer.monthly_income || 0,
      creditScore: Math.min(850, Math.max(300, creditScore)),
      totalContracts: 0,
      activeContracts: 0,
      totalFinanced: 0,
      totalPaid: 0,
      overdueAmount: 0,
      lastPaymentDate: new Date(),
      riskLevel: 'low',
      customerSince: new Date(customer.created_at),
      notes: ''
    };
  }, []);

  // โหลดข้อมูลลูกค้าทั้งหมด
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const customersData = (data || []).map(convertToCustomerData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('ไม่สามารถโหลดข้อมูลลูกค้าได้');
    } finally {
      setLoading(false);
    }
  }, [convertToCustomerData]);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // สร้างลูกค้าใหม่
  const createCustomer = useCallback(async (customerData: Omit<CustomerData, 'id' | 'customerSince' | 'creditScore' | 'totalContracts' | 'activeContracts' | 'totalFinanced' | 'totalPaid' | 'overdueAmount' | 'lastPaymentDate' | 'riskLevel'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // สร้าง customer code
      const customerCode = `C${Date.now().toString().slice(-6)}`;
      
      const { data, error: insertError } = await supabase
        .from('customers')
        .insert({
          branch_id: '00000000-0000-0000-0000-000000000001', // Default branch
          customer_code: customerCode,
          type: 'individual',
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address,
          id_card: customerData.idCard,
          occupation: customerData.occupation,
          monthly_income: customerData.monthlyIncome,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newCustomer = convertToCustomerData(data);
      setCustomers(prev => [newCustomer, ...prev]);
      
      return newCustomer;
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('เกิดข้อผิดพลาดในการสร้างลูกค้า');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertToCustomerData]);

  // อัปเดตลูกค้า
  const updateCustomer = useCallback(async (customerId: string, customerData: Partial<CustomerData>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updateData: any = {};
      
      if (customerData.name) updateData.name = customerData.name;
      if (customerData.phone) updateData.phone = customerData.phone;
      if (customerData.email) updateData.email = customerData.email;
      if (customerData.address) updateData.address = customerData.address;
      if (customerData.idCard) updateData.id_card = customerData.idCard;
      if (customerData.occupation) updateData.occupation = customerData.occupation;
      if (customerData.monthlyIncome !== undefined) updateData.monthly_income = customerData.monthlyIncome;

      const { error: updateError } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId);

      if (updateError) throw updateError;

      // อัปเดต local state
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, ...customerData }
          : customer
      ));
    } catch (err) {
      console.error('Error updating customer:', err);
      setError('เกิดข้อผิดพลาดในการอัปเดตลูกค้า');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ลบลูกค้า (soft delete)
  const deleteCustomer = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('customers')
        .update({ status: 'inactive' })
        .eq('id', customerId);

      if (deleteError) throw deleteError;

      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    } catch (err) {
      console.error('Error deleting customer:', err);
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
      const today = new Date().toISOString().split('T')[0];
      const overdueAmount = customerContracts.reduce((sum, contract) => {
        const overduePayments = contract.payments.filter(p => 
          p.status === 'pending' && p.dueDate < today
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
      if (overdueAmount > 0 && totalFinanced > 0) {
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
      averageCreditScore: customers.length > 0 
        ? customers.reduce((sum, c) => sum + c.creditScore, 0) / customers.length 
        : 0,
      totalFinanced: customers.reduce((sum, c) => sum + c.totalFinanced, 0),
      totalOverdue: customers.reduce((sum, c) => sum + c.overdueAmount, 0)
    };
  }, [customers]);

  // หาลูกค้าตาม ID
  const getCustomerById = useCallback((customerId: string) => {
    return customers.find(customer => customer.id === customerId);
  }, [customers]);

  // คำนวณคะแนนเครดิตใหม่
  const recalculateCreditScore = useCallback(async (customerId: string, contracts: InstallmentContract[]) => {
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
      
      if (totalPayments.length > 0) {
        const onTimeRatio = paidOnTime / totalPayments.length;
        
        if (onTimeRatio >= 0.95) score += 100;
        else if (onTimeRatio >= 0.85) score += 50;
        else if (onTimeRatio < 0.7) score -= 100;
      }
    }

    // Overdue factor
    if (customer.overdueAmount > 0 && customer.totalFinanced > 0) {
      const overdueRatio = customer.overdueAmount / customer.totalFinanced;
      if (overdueRatio > 0.3) score -= 150;
      else if (overdueRatio > 0.1) score -= 75;
    }

    const finalScore = Math.min(850, Math.max(300, score));
    
    await updateCustomer(customerId, { creditScore: finalScore });
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