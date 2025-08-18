import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SerialNumber, SerialNumberSelection } from '../types/pos';
import { useToast } from './use-toast';

export function useSerialNumbers() {
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // ดึงข้อมูล Serial Numbers ทั้งหมด
  const fetchSerialNumbers = async (filters?: {
    branchId?: string;
    productId?: string;
    status?: SerialNumber['status'];
  }) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(*),
          installment_contract:installment_contracts(*)
        `);

      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setSerialNumbers(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล Serial Numbers';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ดึง Serial Numbers ที่พร้อมใช้งานสำหรับสินค้าที่เลือก
  const getAvailableSerialNumbers = async (productId: string, branchId: string): Promise<SerialNumber[]> => {
    try {
      const { data, error } = await supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(*)
        `)
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .eq('status', 'available')
        .order('received_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching available serial numbers:', err);
      return [];
    }
  };

  // สร้าง Serial Number ใหม่
  const createSerialNumber = async (serialNumberData: Omit<SerialNumber, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('serial_numbers')
        .insert({
          product_id: serialNumberData.productId,
          branch_id: serialNumberData.branchId,
          serial_number: serialNumberData.serialNumber,
          status: serialNumberData.status,
          cost_price: serialNumberData.costPrice,
          selling_price: serialNumberData.sellingPrice,
          received_date: serialNumberData.receivedDate,
          notes: serialNumberData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'เพิ่ม Serial Number เรียบร้อยแล้ว',
      });

      // รีเฟรชข้อมูล
      await fetchSerialNumbers();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่ม Serial Number';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // อัปเดตสถานะ Serial Number
  const updateSerialNumberStatus = async (
    serialNumberId: string,
    status: SerialNumber['status'],
    installmentContractId?: string
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'installment' && installmentContractId) {
        updateData.installment_contract_id = installmentContractId;
        updateData.sold_date = new Date().toISOString();
      } else if (status === 'available') {
        updateData.installment_contract_id = null;
        updateData.sold_date = null;
      }

      const { error } = await supabase
        .from('serial_numbers')
        .update(updateData)
        .eq('id', serialNumberId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error updating serial number status:', err);
      throw err;
    }
  };

  // อัปเดตสถานะ Serial Numbers หลายตัวพร้อมกัน
  const updateMultipleSerialNumbers = async (
    serialNumberIds: string[],
    status: SerialNumber['status'],
    installmentContractId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const updatePromises = serialNumberIds.map(id =>
        updateSerialNumberStatus(id, status, installmentContractId)
      );

      await Promise.all(updatePromises);

      toast({
        title: 'สำเร็จ',
        description: `อัปเดตสถานะ Serial Numbers ${serialNumberIds.length} รายการเรียบร้อยแล้ว`,
      });

      // รีเฟรชข้อมูล
      await fetchSerialNumbers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตสถานะ';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ลบ Serial Number
  const deleteSerialNumber = async (serialNumberId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('serial_numbers')
        .delete()
        .eq('id', serialNumberId);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'ลบ Serial Number เรียบร้อยแล้ว',
      });

      // รีเฟรชข้อมูล
      await fetchSerialNumbers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบ Serial Number';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ค้นหา Serial Number
  const searchSerialNumbers = async (searchTerm: string, branchId?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(*),
          installment_contract:installment_contracts(*)
        `)
        .ilike('serial_number', `%${searchTerm}%`);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setSerialNumbers(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหา';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    serialNumbers,
    loading,
    error,
    fetchSerialNumbers,
    getAvailableSerialNumbers,
    createSerialNumber,
    updateSerialNumberStatus,
    updateMultipleSerialNumbers,
    deleteSerialNumber,
    searchSerialNumbers,
  };
}

export default useSerialNumbers;