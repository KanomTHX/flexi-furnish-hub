import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TransferRequest {
  id: string;
  source_branch_id: string;
  destination_branch_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed';
  requested_by: string;
  approved_by?: string;
  request_date: string;
  approved_date?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface TransferItem {
  id: string;
  transfer_request_id: string;
  product_id: string;
  quantity_requested: number;
  quantity_approved?: number;
  quantity_transferred?: number;
  unit_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  // Serial Numbers for this transfer item
  serial_numbers?: {
    id: string;
    serial_number: string;
    status: 'pending' | 'transferred' | 'received';
  }[];
}

export interface StockTransfer {
  id: string;
  transfer_request_id: string;
  source_branch_id: string;
  target_branch_id: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  shipped_date?: string;
  delivered_date?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: TransferItem[];
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  manager_id?: string;
  branch_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransferMetrics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  inTransitRequests: number;
  totalValue: number;
  averageProcessingTime: number;
}

export const useTransferData = () => {
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [metrics, setMetrics] = useState<TransferMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError('ไม่สามารถโหลดข้อมูลคลังสินค้าได้');
    }
  };

  // Fetch transfer requests with related data
  const fetchTransferRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('transfer_requests')
        .select(`
          *,
          source_warehouse:warehouses!source_warehouse_id(
            id, name, code,
            branch:branches(id, name, code)
          ),
          destination_warehouse:warehouses!destination_warehouse_id(
            id, name, code,
            branch:branches(id, name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const mappedData = data.map((item: any) => ({
          ...item,
          source_branch: item.source_warehouse?.branch || { id: item.source_warehouse_id, name: 'Unknown', code: 'UNK' },
          destination_branch: item.destination_warehouse?.branch || { id: item.destination_warehouse_id, name: 'Unknown', code: 'UNK' },
          source_warehouse: item.source_warehouse || { id: item.source_warehouse_id, name: 'Unknown', code: 'UNK' },
          destination_warehouse: item.destination_warehouse || { id: item.destination_warehouse_id, name: 'Unknown', code: 'UNK' },
          items: item.transfer_request_items || []
        }));
        setTransferRequests(mappedData);
      } else {
        setTransferRequests([]);
      }
    } catch (err) {
      console.error('Error fetching transfer requests:', err);
      setError('ไม่สามารถโหลดข้อมูลคำขอโอนย้ายได้');
    }
  };

  // Fetch transfer items
  const fetchTransferItems = async () => {
    try {
      const { data, error } = await supabase
        .from('transfer_request_items')
        .select(`
          *,
          product:products(id, name, product_code, unit)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransferItems(data || []);
    } catch (err) {
      console.error('Error fetching transfer items:', err);
      setError('ไม่สามารถโหลดข้อมูลรายการโอนย้ายได้');
    }
  };

  // Fetch stock transfers
  const fetchStockTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_transfers')
        .select(`
          *,
          source_warehouse:warehouses!source_warehouse_id(
            id, name, code,
            branch:branches(id, name, code)
          ),
          target_warehouse:warehouses!target_warehouse_id(
            id, name, code,
            branch:branches(id, name, code)
          ),
          stock_transfer_items(
            *,
            product:products(id, name, product_code, unit)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const mappedData = data.map((item: any) => ({
          ...item,
          source_branch: item.source_warehouse?.branch || { id: item.source_warehouse_id, name: 'Unknown', code: 'UNK' },
          target_branch: item.target_warehouse?.branch || { id: item.target_warehouse_id, name: 'Unknown', code: 'UNK' },
          source_warehouse: item.source_warehouse || { id: item.source_warehouse_id, name: 'Unknown', code: 'UNK' },
          target_warehouse: item.target_warehouse || { id: item.target_warehouse_id, name: 'Unknown', code: 'UNK' },
          items: item.stock_transfer_items || []
        }));
        setStockTransfers(mappedData);
      } else {
        setStockTransfers([]);
      }
    } catch (err) {
      console.error('Error fetching stock transfers:', err);
      setError('ไม่สามารถโหลดข้อมูลการโอนย้ายสต็อกได้');
    }
  };

  // Calculate metrics
  const calculateMetrics = async () => {
    try {
      const { data: requests, error } = await supabase
        .from('transfer_requests')
        .select('status, created_at, approved_date');

      if (error) throw error;

      const totalRequests = requests?.length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const approvedRequests = requests?.filter(r => r.status === 'approved').length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const rejectedRequests = requests?.filter(r => r.status === 'rejected').length || 0;
      const inTransitRequests = requests?.filter(r => r.status === 'in_transit').length || 0;

      // Calculate average processing time for approved requests
      const approvedWithDates = requests?.filter(r => 
        r.status === 'approved' && r.created_at && r.approved_date
      ) || [];
      
      const totalProcessingTime = approvedWithDates.reduce((sum, request) => {
        const created = new Date(request.created_at).getTime();
        const approved = new Date(request.approved_date!).getTime();
        return sum + (approved - created);
      }, 0);

      const averageProcessingTime = approvedWithDates.length > 0 
        ? totalProcessingTime / approvedWithDates.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Calculate total value (would need to join with items and products)
      const { data: itemsData } = await supabase
        .from('transfer_request_items')
        .select('quantity_requested, unit_cost');

      const totalValue = itemsData?.reduce((sum, item) => 
        sum + (item.quantity_requested * item.unit_cost), 0
      ) || 0;

      setMetrics({
        totalRequests,
        pendingRequests,
        approvedRequests,
        completedRequests,
        rejectedRequests,
        inTransitRequests,
        totalValue,
        averageProcessingTime
      });
    } catch (err) {
      console.error('Error calculating metrics:', err);
    }
  };

  // Create new transfer request with serial numbers
  const createTransferRequest = async (
    requestData: Omit<TransferRequest, 'id' | 'created_at' | 'updated_at'>,
    items?: {
      product_id: string;
      serial_number_ids: string[];
      unit_cost: number;
      notes?: string;
    }[]
  ) => {
    try {
      const { data, error } = await supabase
        .from('transfer_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;
      
      // If items with serial numbers are provided, create transfer items
      if (items && items.length > 0) {
        const transferItems = [];
        
        for (const item of items) {
          // Create transfer request item
          const { data: itemData, error: itemError } = await supabase
            .from('transfer_request_items')
            .insert({
              transfer_request_id: data.id,
              product_id: item.product_id,
              quantity_requested: item.serial_number_ids.length,
              unit_cost: item.unit_cost,
              notes: item.notes
            })
            .select()
            .single();
            
          if (itemError) throw itemError;
          
          // Create stock transfer items with serial numbers
          for (const serialNumberId of item.serial_number_ids) {
            const { error: transferItemError } = await supabase
              .from('stock_transfer_items')
              .insert({
                transfer_id: data.id,
                serial_number_id: serialNumberId,
                product_id: item.product_id,
                quantity: 1,
                unit_cost: item.unit_cost,
                status: 'pending'
              });
              
            if (transferItemError) throw transferItemError;
          }
        }
      }
      
      // Refresh data
      await fetchTransferRequests();
      await calculateMetrics();
      
      return data;
    } catch (err) {
      console.error('Error creating transfer request:', err);
      throw new Error('ไม่สามารถสร้างคำขอโอนย้ายได้');
    }
  };

  // Update transfer request status
  const updateTransferRequestStatus = async (id: string, status: TransferRequest['status'], approvedBy?: string) => {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (status === 'approved' && approvedBy) {
        updateData.approved_by = approvedBy;
        updateData.approved_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('transfer_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      // Handle serial number transfers based on status
      if (status === 'approved') {
        await handleSerialNumberTransferOnApproval(id);
      } else if (status === 'completed') {
        await handleSerialNumberTransferOnCompletion(id);
      }
      
      // Refresh data
      await fetchTransferRequests();
      await calculateMetrics();
    } catch (err) {
      console.error('Error updating transfer request:', err);
      throw new Error('ไม่สามารถอัปเดตสถานะคำขอโอนย้ายได้');
    }
  };

  // Handle serial number transfer when request is approved
  const handleSerialNumberTransferOnApproval = async (transferRequestId: string) => {
    try {
      // Get transfer request details
      const { data: transferRequest, error: transferError } = await supabase
        .from('transfer_requests')
        .select('source_branch_id, destination_branch_id')
        .eq('id', transferRequestId)
        .single();

      if (transferError) throw transferError;

      // Get all stock transfer items for this request
      const { data: transferItems, error: itemsError } = await supabase
        .from('stock_transfer_items')
        .select('serial_number_id, product_id')
        .eq('transfer_id', transferRequestId);

      if (itemsError) throw itemsError;

      // Update serial numbers status to 'in_transit' and remove from source warehouse
      for (const item of transferItems || []) {
        // Update serial number status
        const { error: snError } = await supabase
          .from('serial_numbers')
          .update({
            status: 'in_transit',
            branch_id: null, // Remove from source branch
            updated_at: new Date().toISOString()
          })
          .eq('id', item.serial_number_id);

        if (snError) throw snError;

        // Update stock transfer item status
        const { error: transferItemError } = await supabase
          .from('stock_transfer_items')
          .update({
            status: 'in_transit',
            updated_at: new Date().toISOString()
          })
          .eq('serial_number_id', item.serial_number_id)
          .eq('transfer_id', transferRequestId);

        if (transferItemError) throw transferItemError;
      }
    } catch (err) {
      console.error('Error handling serial number transfer on approval:', err);
      throw new Error('ไม่สามารถโอนย้าย Serial Number ได้');
    }
  };

  // Handle serial number transfer when request is completed
  const handleSerialNumberTransferOnCompletion = async (transferRequestId: string) => {
    try {
      // Get transfer request details
      const { data: transferRequest, error: transferError } = await supabase
        .from('transfer_requests')
        .select('destination_branch_id')
        .eq('id', transferRequestId)
        .single();

      if (transferError) throw transferError;

      // Get all stock transfer items for this request
      const { data: transferItems, error: itemsError } = await supabase
        .from('stock_transfer_items')
        .select('serial_number_id, product_id')
        .eq('transfer_id', transferRequestId);

      if (itemsError) throw itemsError;

      // Update serial numbers to destination warehouse
      for (const item of transferItems || []) {
        // Update serial number to destination warehouse
        const { error: snError } = await supabase
          .from('serial_numbers')
          .update({
            status: 'available',
            branch_id: transferRequest.destination_branch_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.serial_number_id);

        if (snError) throw snError;

        // Update stock transfer item status
        const { error: transferItemError } = await supabase
          .from('stock_transfer_items')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('serial_number_id', item.serial_number_id)
          .eq('transfer_id', transferRequestId);

        if (transferItemError) throw transferItemError;
      }
    } catch (err) {
      console.error('Error handling serial number transfer on completion:', err);
      throw new Error('ไม่สามารถโอนย้าย Serial Number ไปยังคลังปลายทางได้');
    }
  };

  // Add transfer items
  const addTransferItems = async (transferRequestId: string, items: Omit<TransferItem, 'id' | 'transfer_request_id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const itemsWithRequestId = items.map(item => ({
        ...item,
        transfer_request_id: transferRequestId
      }));

      const { error } = await supabase
        .from('transfer_request_items')
        .insert(itemsWithRequestId);

      if (error) throw error;
      
      // Refresh data
      await fetchTransferItems();
    } catch (err) {
      console.error('Error adding transfer items:', err);
      throw new Error('ไม่สามารถเพิ่มรายการโอนย้ายได้');
    }
  };

  // Initialize data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchWarehouses(),
          fetchTransferRequests(),
          fetchTransferItems(),
          fetchStockTransfers(),
          calculateMetrics()
        ]);
      } catch (err) {
        console.error('Error loading transfer data:', err);
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const transferRequestsSubscription = supabase
      .channel('transfer_requests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transfer_requests' },
        () => {
          fetchTransferRequests();
          calculateMetrics();
        }
      )
      .subscribe();

    const transferItemsSubscription = supabase
      .channel('transfer_items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transfer_request_items' },
        () => {
          fetchTransferItems();
        }
      )
      .subscribe();

    const stockTransfersSubscription = supabase
      .channel('stock_transfers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'stock_transfers' },
        () => {
          fetchStockTransfers();
        }
      )
      .subscribe();

    return () => {
      transferRequestsSubscription.unsubscribe();
      transferItemsSubscription.unsubscribe();
      stockTransfersSubscription.unsubscribe();
    };
  }, []);

  return {
    // Data
    transferRequests,
    transferItems,
    stockTransfers,
    warehouses,
    metrics,
    
    // State
    loading,
    error,
    
    // Actions
    createTransferRequest,
    updateTransferRequestStatus,
    addTransferItems,
    
    // Refresh functions
    refreshData: async () => {
      await Promise.all([
        fetchWarehouses(),
        fetchTransferRequests(),
        fetchTransferItems(),
        fetchStockTransfers(),
        calculateMetrics()
      ]);
    }
  };
};

export default useTransferData;