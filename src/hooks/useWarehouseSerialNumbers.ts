import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SerialNumber, SNStatus } from '../types/warehouse';

export interface BranchSerialNumber {
  id: string;
  serialNumber: string;
  productId: string;
  product: {
    id: string;
    name: string;
    code: string;
    sku?: string;
    brand?: string;
    model?: string;
    category?: string;
  };
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  unitCost: number;
  supplierId?: string;
  invoiceNumber?: string;
  status: SNStatus;
  soldAt?: Date;
  soldTo?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SerialNumberFilter {
  branchId?: string;
  productId?: string;
  status?: SNStatus;
  search?: string;
}

export const useBranchSerialNumbers = () => {
  const [serialNumbers, setSerialNumbers] = useState<BranchSerialNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch serial numbers with filters
  const fetchSerialNumbers = async (filters: SerialNumberFilter = {}) => {
    try {
      setLoading(true);
      let query = supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(
            id,
            name,
            product_code,
            sku,
            brand,
            model,
            category
          ),
          branch:branches(
            id,
            name,
            code
          )
        `);

      // Apply filters
      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.ilike('serial_number', `%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        serialNumber: item.serial_number,
        productId: item.product_id,
        product: {
          id: item.product?.id || item.product_id,
          name: item.product?.name || 'Unknown Product',
          code: item.product?.product_code || 'N/A',
          sku: item.product?.sku,
          brand: item.product?.brand,
          model: item.product?.model,
          category: item.product?.category
        },
        branchId: item.branch_id,
        branch: {
          id: item.branch?.id || item.branch_id,
          name: item.branch?.name || 'Unknown Branch',
          code: item.branch?.code || 'N/A'
        },
        unitCost: item.unit_cost || 0,
        supplierId: item.supplier_id,
        invoiceNumber: item.invoice_number,
        status: item.status as SNStatus,
        soldAt: item.sold_at ? new Date(item.sold_at) : undefined,
        soldTo: item.sold_to,
        referenceNumber: item.reference_number,
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      setSerialNumbers(mappedData);
    } catch (err) {
      console.error('Error fetching serial numbers:', err);
      setError('ไม่สามารถโหลดข้อมูล Serial Number ได้');
    } finally {
      setLoading(false);
    }
  };

  // Get available serial numbers for a specific product in a warehouse
  const getAvailableSerialNumbers = async (productId: string, warehouseId: string) => {
    try {
      const { data, error } = await supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(
            id,
            name,
            product_code,
            sku
          )
        `)
        .eq('product_id', productId)
        .eq('branch_id', warehouseId)
        .eq('status', 'available')
        .order('serial_number');

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        serialNumber: item.serial_number,
        productId: item.product_id,
        product: {
          id: item.product?.id || item.product_id,
          name: item.product?.name || 'Unknown Product',
          code: item.product?.code || 'N/A',
          sku: item.product?.sku
        },
        warehouseId: item.branch_id,
        unitCost: item.unit_cost || 0,
        status: item.status as SNStatus,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (err) {
      console.error('Error fetching available serial numbers:', err);
      throw new Error('ไม่สามารถโหลดข้อมูล Serial Number ที่พร้อมใช้งานได้');
    }
  };

  // Get products that have serial numbers in a warehouse
  const getProductsWithSerialNumbers = async (warehouseId: string) => {
    try {
      const { data, error } = await supabase
        .from('serial_numbers')
        .select(`
          product_id,
          product:products(
            id,
            name,
            product_code,
            sku,
            brand,
            model
          )
        `)
        .eq('branch_id', warehouseId)
        .eq('status', 'available');

      if (error) throw error;

      // Group by product and count available serial numbers
      const productMap = new Map();
      (data || []).forEach((item: any) => {
        const productId = item.product_id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: item.product?.id || productId,
            name: item.product?.name || 'Unknown Product',
            code: item.product?.product_code || 'N/A',
            sku: item.product?.sku,
            brand: item.product?.brand,
            model: item.product?.model,
            availableCount: 0
          });
        }
        productMap.get(productId).availableCount++;
      });

      return Array.from(productMap.values());
    } catch (err) {
      console.error('Error fetching products with serial numbers:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลสินค้าที่มี Serial Number ได้');
    }
  };

  // Transfer serial numbers between warehouses
  const transferSerialNumbers = async (
    serialNumberIds: string[],
    fromWarehouseId: string,
    toWarehouseId: string,
    transferId: string,
    notes?: string
  ) => {
    try {
      // Update serial numbers to transferred status and new warehouse
      const { error: updateError } = await supabase
        .from('serial_numbers')
        .update({
          branch_id: toWarehouseId,
          status: 'available', // Keep as available in new warehouse
          reference_number: transferId,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .in('id', serialNumberIds)
        .eq('branch_id', fromWarehouseId)
        .eq('status', 'available');

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error transferring serial numbers:', err);
      throw new Error('ไม่สามารถโอนย้าย Serial Number ได้');
    }
  };

  // Update serial number status
  const updateSerialNumberStatus = async (
    serialNumberId: string,
    newStatus: SNStatus,
    referenceId?: string,
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('serial_numbers')
        .update({
          status: newStatus,
          reference_number: referenceId,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', serialNumberId);

      if (error) throw error;

      // Refresh data
      await fetchSerialNumbers();
    } catch (err) {
      console.error('Error updating serial number status:', err);
      throw new Error('ไม่สามารถอัปเดตสถานะ Serial Number ได้');
    }
  };

  // Initialize data loading
  useEffect(() => {
    fetchSerialNumbers();
  }, []);

  return {
    // Data
    serialNumbers,
    
    // State
    loading,
    error,
    
    // Actions
    fetchSerialNumbers,
    getAvailableSerialNumbers,
    getProductsWithSerialNumbers,
    transferSerialNumbers,
    updateSerialNumberStatus,
    
    // Refresh
    refreshData: () => fetchSerialNumbers()
  };
};

export default useBranchSerialNumbers;