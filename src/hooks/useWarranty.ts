import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type Definitions
export interface WarrantyRecord {
  id: string;
  serial_number: string;
  product_id: string;
  product_name: string;
  product_code: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  purchase_date: string;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_period: number; // months
  warranty_type: WarrantyType;
  status: WarrantyStatus;
  supplier_name: string;
  invoice_number: string;
  purchase_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WarrantyMetrics {
  totalWarranties: number;
  activeWarranties: number;
  expiredWarranties: number;
  expiringThisMonth: number;
  averageWarrantyPeriod: number;
  totalWarrantyValue: number;
}

export interface WarrantyFilter {
  status?: WarrantyStatus | 'all';
  warranty_type?: WarrantyType | 'all';
  search?: string;
  date_from?: string;
  date_to?: string;
  expiring_soon?: boolean;
}

export interface CreateWarrantyData {
  serial_number: string;
  product_id: string;
  product_name: string;
  product_code: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  purchase_date: string;
  warranty_start_date: string;
  warranty_period: number;
  warranty_type: WarrantyType;
  supplier_name: string;
  invoice_number: string;
  purchase_price: number;
  notes?: string;
}

export interface UpdateWarrantyData {
  status?: WarrantyStatus;
  warranty_end_date?: string;
  notes?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export type WarrantyType = 'manufacturer' | 'extended' | 'store' | 'none';
export type WarrantyStatus = 'active' | 'expired' | 'voided' | 'transferred';



export function useWarranty() {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [metrics, setMetrics] = useState<WarrantyMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper functions
  const calculateWarrantyEndDate = (startDate: string, periodMonths: number): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + periodMonths);
    return end.toISOString().split('T')[0];
  };

  const isWarrantyExpired = (endDate: string): boolean => {
    return new Date(endDate) < new Date();
  };

  const isWarrantyExpiringSoon = (endDate: string, days: number = 30): boolean => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays > 0;
  };

  const getDaysUntilExpiry = (endDate: string): number => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Load warranties data
  const loadWarranties = useCallback(async (filters?: WarrantyFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      // Query warranties from serial_numbers table with warranty information
      let query = supabase
        .from('serial_numbers')
        .select(`
          id,
          serial_number,
          product_id,
          products!inner(name, product_code),
          customer_name,
          customer_email,
          customer_phone,
          purchase_date,
          warranty_start_date,
          warranty_expiry_date,
          warranty_period_months,
          warranty_type,
          status,
          supplier_name,
          invoice_number,
          purchase_price,
          notes,
          created_at,
          updated_at
        `)
        .not('warranty_expiry_date', 'is', null);
      
      if (filters?.status && filters.status !== 'all') {
        // Map warranty status to serial number status
        if (filters.status === 'active') {
          query = query.eq('status', 'sold').gte('warranty_expiry_date', new Date().toISOString().split('T')[0]);
        } else if (filters.status === 'expired') {
          query = query.eq('status', 'sold').lt('warranty_expiry_date', new Date().toISOString().split('T')[0]);
        }
      }
      
      if (filters?.search) {
        query = query.or(`serial_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,products.name.ilike.%${filters.search}%`);
      }
      
      if (filters?.date_from) {
        query = query.gte('warranty_start_date', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('warranty_expiry_date', filters.date_to);
      }
      
      if (filters?.expiring_soon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const today = new Date().toISOString().split('T')[0];
        const futureDate = thirtyDaysFromNow.toISOString().split('T')[0];
        query = query.gte('warranty_expiry_date', today).lte('warranty_expiry_date', futureDate);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match WarrantyRecord interface
      const transformedWarranties: WarrantyRecord[] = (data || []).map(item => ({
        id: item.id,
        serial_number: item.serial_number,
        product_id: item.product_id,
        product_name: item.products?.name || '',
        product_code: item.products?.product_code || '',
        customer_id: '', // Not available in serial_numbers table
        customer_name: item.customer_name || '',
        customer_email: item.customer_email || '',
        customer_phone: item.customer_phone || '',
        purchase_date: item.purchase_date || '',
        warranty_start_date: item.warranty_start_date || '',
        warranty_end_date: item.warranty_expiry_date || '',
        warranty_period: item.warranty_period_months || 0,
        warranty_type: (item.warranty_type as WarrantyType) || 'none',
        status: item.warranty_expiry_date && new Date(item.warranty_expiry_date) >= new Date() ? 'active' : 'expired',
        supplier_name: item.supplier_name || '',
        invoice_number: item.invoice_number || '',
        purchase_price: item.purchase_price || 0,
        notes: item.notes || '',
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setWarranties(transformedWarranties);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลการรับประกัน';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load warranty metrics
  const loadMetrics = useCallback(async () => {
    try {
      // Calculate metrics from serial_numbers table
      const { data: allWarranties, error } = await supabase
        .from('serial_numbers')
        .select('warranty_expiry_date, purchase_price, warranty_period_months')
        .not('warranty_expiry_date', 'is', null);
      
      if (error) throw error;
      
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const totalWarranties = allWarranties?.length || 0;
      const activeWarranties = allWarranties?.filter(w => 
        w.warranty_expiry_date && new Date(w.warranty_expiry_date) >= today
      ).length || 0;
      const expiredWarranties = totalWarranties - activeWarranties;
      const expiringThisMonth = allWarranties?.filter(w => 
        w.warranty_expiry_date && 
        new Date(w.warranty_expiry_date) >= today &&
        new Date(w.warranty_expiry_date) <= thirtyDaysFromNow
      ).length || 0;
      
      const totalValue = allWarranties?.reduce((sum, w) => sum + (w.purchase_price || 0), 0) || 0;
      const avgPeriod = allWarranties?.length > 0 
        ? allWarranties.reduce((sum, w) => sum + (w.warranty_period_months || 0), 0) / allWarranties.length
        : 0;
      
      setMetrics({
        totalWarranties,
        activeWarranties,
        expiredWarranties,
        expiringThisMonth,
        averageWarrantyPeriod: Math.round(avgPeriod * 10) / 10,
        totalWarrantyValue: totalValue
      });
      
    } catch (err) {
      console.error('Error loading warranty metrics:', err);
    }
  }, []);

  // Create new warranty
  const createWarranty = useCallback(async (warrantyData: CreateWarrantyData): Promise<WarrantyRecord | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const warrantyEndDate = calculateWarrantyEndDate(
        warrantyData.warranty_start_date,
        warrantyData.warranty_period
      );
      
      const newWarranty: WarrantyRecord = {
        id: Date.now().toString(), // Mock ID
        ...warrantyData,
        warranty_end_date: warrantyEndDate,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert into serial_numbers table
      const { data, error } = await supabase
        .from('serial_numbers')
        .insert([{
          serial_number: warrantyData.serial_number,
          product_id: warrantyData.product_id,
          customer_name: warrantyData.customer_name,
          customer_email: warrantyData.customer_email,
          customer_phone: warrantyData.customer_phone,
          purchase_date: warrantyData.purchase_date,
          warranty_start_date: warrantyData.warranty_start_date,
          warranty_expiry_date: warrantyEndDate,
          warranty_period_months: warrantyData.warranty_period,
          warranty_type: warrantyData.warranty_type,
          supplier_name: warrantyData.supplier_name,
          invoice_number: warrantyData.invoice_number,
          purchase_price: warrantyData.purchase_price,
          notes: warrantyData.notes,
          status: 'sold'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Reload warranties to get updated data
      await loadWarranties();
      
      toast.success('สร้างการรับประกันสำเร็จ');
      return newWarranty;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างการรับประกัน';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update warranty
  const updateWarranty = useCallback(async (id: string, updateData: UpdateWarrantyData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Update serial_numbers table
      const updatePayload: any = {};
      
      if (updateData.customer_name) updatePayload.customer_name = updateData.customer_name;
      if (updateData.customer_email) updatePayload.customer_email = updateData.customer_email;
      if (updateData.customer_phone) updatePayload.customer_phone = updateData.customer_phone;
      if (updateData.warranty_end_date) updatePayload.warranty_expiry_date = updateData.warranty_end_date;
      if (updateData.notes) updatePayload.notes = updateData.notes;
      
      const { error } = await supabase
        .from('serial_numbers')
        .update({
          ...updatePayload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Reload warranties to get updated data
      await loadWarranties();
      
      toast.success('อัปเดตการรับประกันสำเร็จ');
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตการรับประกัน';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Void warranty
  const voidWarranty = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    return updateWarranty(id, { 
      status: 'voided',
      notes: reason ? `ยกเลิก: ${reason}` : 'ยกเลิกการรับประกัน'
    });
  }, [updateWarranty]);

  // Transfer warranty
  const transferWarranty = useCallback(async (id: string, newCustomerData: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  }): Promise<boolean> => {
    return updateWarranty(id, {
      status: 'transferred',
      ...newCustomerData,
      notes: `โอนย้ายให้ ${newCustomerData.customer_name}`
    });
  }, [updateWarranty]);

  // Get warranty by serial number
  const getWarrantyBySerial = useCallback(async (serialNumber: string): Promise<WarrantyRecord | null> => {
    try {
      const { data, error } = await supabase
        .from('serial_numbers')
        .select(`
          id,
          serial_number,
          product_id,
          products!inner(name, product_code),
          customer_name,
          customer_email,
          customer_phone,
          purchase_date,
          warranty_start_date,
          warranty_expiry_date,
          warranty_period_months,
          warranty_type,
          status,
          supplier_name,
          invoice_number,
          purchase_price,
          notes,
          created_at,
          updated_at
        `)
        .eq('serial_number', serialNumber)
        .not('warranty_expiry_date', 'is', null)
        .single();
      
      if (error) return null;
      
      // Transform data to match WarrantyRecord interface
      const warranty: WarrantyRecord = {
        id: data.id,
        serial_number: data.serial_number,
        product_id: data.product_id,
        product_name: data.products?.name || '',
        product_code: data.products?.product_code || '',
        customer_id: '',
        customer_name: data.customer_name || '',
        customer_email: data.customer_email || '',
        customer_phone: data.customer_phone || '',
        purchase_date: data.purchase_date || '',
        warranty_start_date: data.warranty_start_date || '',
        warranty_end_date: data.warranty_expiry_date || '',
        warranty_period: data.warranty_period_months || 0,
        warranty_type: (data.warranty_type as WarrantyType) || 'none',
        status: data.warranty_expiry_date && new Date(data.warranty_expiry_date) >= new Date() ? 'active' : 'expired',
        supplier_name: data.supplier_name || '',
        invoice_number: data.invoice_number || '',
        purchase_price: data.purchase_price || 0,
        notes: data.notes || '',
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      return warranty;
      
    } catch (err) {
      console.error('Error getting warranty by serial:', err);
      return null;
    }
  }, []);

  // Get warranties expiring soon
  const getExpiringWarranties = useCallback(async (days: number = 30): Promise<WarrantyRecord[]> => {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const today = new Date().toISOString().split('T')[0];
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('serial_numbers')
        .select(`
          id,
          serial_number,
          product_id,
          products!inner(name, product_code),
          customer_name,
          customer_email,
          customer_phone,
          purchase_date,
          warranty_start_date,
          warranty_expiry_date,
          warranty_period_months,
          warranty_type,
          status,
          supplier_name,
          invoice_number,
          purchase_price,
          notes,
          created_at,
          updated_at
        `)
        .eq('status', 'sold')
        .gte('warranty_expiry_date', today)
        .lte('warranty_expiry_date', futureDateStr)
        .not('warranty_expiry_date', 'is', null)
        .order('warranty_expiry_date', { ascending: true });
      
      if (error) throw error;
      
      // Transform data to match WarrantyRecord interface
      const expiringWarranties: WarrantyRecord[] = (data || []).map(item => ({
        id: item.id,
        serial_number: item.serial_number,
        product_id: item.product_id,
        product_name: item.products?.name || '',
        product_code: item.products?.product_code || '',
        customer_id: '',
        customer_name: item.customer_name || '',
        customer_email: item.customer_email || '',
        customer_phone: item.customer_phone || '',
        purchase_date: item.purchase_date || '',
        warranty_start_date: item.warranty_start_date || '',
        warranty_end_date: item.warranty_expiry_date || '',
        warranty_period: item.warranty_period_months || 0,
        warranty_type: (item.warranty_type as WarrantyType) || 'none',
        status: 'active',
        supplier_name: item.supplier_name || '',
        invoice_number: item.invoice_number || '',
        purchase_price: item.purchase_price || 0,
        notes: item.notes || '',
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      return expiringWarranties;
      
    } catch (err) {
      console.error('Error getting expiring warranties:', err);
      return [];
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    loadWarranties();
    loadMetrics();
  }, [loadWarranties, loadMetrics]);

  return {
    warranties,
    metrics,
    loading,
    error,
    loadWarranties,
    loadMetrics,
    createWarranty,
    updateWarranty,
    voidWarranty,
    transferWarranty,
    getWarrantyBySerial,
    getExpiringWarranties,
    // Helper functions
    calculateWarrantyEndDate,
    isWarrantyExpired,
    isWarrantyExpiringSoon,
    getDaysUntilExpiry
  };
}