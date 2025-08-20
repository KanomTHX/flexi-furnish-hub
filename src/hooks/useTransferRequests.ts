import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TransferRequest, 
  TransferRequestStatus, 
  TransferRequestPriority,
  CreateTransferRequestData,
  TransferRequestFilters,
  TransferRequestStats
} from '../types/transfer';

// Database interfaces
interface DatabaseTransferRequest {
  id: string;
  request_number: string;
  source_branch_id: string;
  destination_branch_id: string;
  status: TransferRequestStatus;
  priority: TransferRequestPriority;
  requested_date: string;
  required_date: string;
  approved_date?: string;
  completed_date?: string;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseTransferRequestItem {
  id: string;
  transfer_request_id: string;
  product_id: string;
  requested_quantity: number;
  approved_quantity?: number;
  transferred_quantity: number;
  unit: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    product_code: string;
  };
}

interface DatabaseBranch {
  id: string;
  name: string;
  code: string;
}

interface DatabaseProduct {
  id: string;
  name: string;
  product_code: string;
  unit: string;
}

export function useTransferRequests() {
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [warehouses, setWarehouses] = useState<DatabaseWarehouse[]>([]);
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform database data to frontend format
  const transformTransferRequest = (dbRequest: DatabaseTransferRequest, items: DatabaseTransferRequestItem[]): TransferRequest => {
    return {
      id: dbRequest.id,
      requestNumber: dbRequest.request_number,
      sourceBranchId: dbRequest.source_branch_id,
      destinationBranchId: dbRequest.destination_branch_id,
      status: dbRequest.status,
      priority: dbRequest.priority,
      requestedDate: new Date(dbRequest.requested_date),
      requiredDate: new Date(dbRequest.required_date),
      approvedDate: dbRequest.approved_date ? new Date(dbRequest.approved_date) : undefined,
      completedDate: dbRequest.completed_date ? new Date(dbRequest.completed_date) : undefined,
      notes: dbRequest.notes,
      items: items.map(item => ({
        id: item.id,
        transferRequestId: item.transfer_request_id,
        productId: item.product_id,
        productName: item.products?.name || '',
        productCode: item.products?.product_code || '',
        requestedQuantity: item.requested_quantity,
        approvedQuantity: item.approved_quantity,
        transferredQuantity: item.transferred_quantity,
        availableQuantity: 0, // Will be fetched separately if needed
        unit: item.unit,
        notes: item.notes
      })),
      createdAt: new Date(dbRequest.created_at),
      updatedAt: new Date(dbRequest.updated_at),
      createdBy: dbRequest.created_by,
      updatedBy: dbRequest.updated_by,
      approvedBy: dbRequest.approved_by
    };
  };

  // Fetch transfer requests from database
  const fetchTransferRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('transfer_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('transfer_request_items')
        .select(`
          *,
          products (
            id,
            name,
            product_code
          )
        `);

      if (itemsError) throw itemsError;

      const transformedRequests = requestsData.map(request => {
        const requestItems = itemsData.filter(item => item.transfer_request_id === request.id);
        return transformTransferRequest(request, requestItems);
      });

      setTransferRequests(transformedRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transfer requests';
      setError(errorMessage);
      console.error('Error fetching transfer requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, product_code, unit')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchTransferRequests();
    fetchWarehouses();
    fetchProducts();
  }, []);

  // Get filtered transfer requests
  const getFilteredRequests = (filters: TransferRequestFilters) => {
    return transferRequests.filter(request => {
      if (filters.status && request.status !== filters.status) return false;
      if (filters.priority && request.priority !== filters.priority) return false;
      if (filters.sourceWarehouseId && request.sourceWarehouseId !== filters.sourceWarehouseId) return false;
      if (filters.destinationWarehouseId && request.destinationWarehouseId !== filters.destinationWarehouseId) return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          request.requestNumber.toLowerCase().includes(searchLower) ||
          request.notes?.toLowerCase().includes(searchLower) ||
          request.items.some(item => 
            item.productName.toLowerCase().includes(searchLower) ||
            item.productCode.toLowerCase().includes(searchLower)
          )
        );
      }
      return true;
    });
  };

  // Get transfer request statistics
  const getStats = (): TransferRequestStats => {
    const total = transferRequests.length;
    const pending = transferRequests.filter(r => r.status === 'pending').length;
    const approved = transferRequests.filter(r => r.status === 'approved').length;
    const inTransit = transferRequests.filter(r => r.status === 'in_transit').length;
    const completed = transferRequests.filter(r => r.status === 'completed').length;
    const cancelled = transferRequests.filter(r => r.status === 'cancelled').length;

    return {
      total,
      pending,
      approved,
      inTransit,
      completed,
      cancelled
    };
  };

  // Create new transfer request
  const createTransferRequest = async (data: CreateTransferRequestData): Promise<TransferRequest> => {
    setLoading(true);
    setError(null);

    try {
      // Generate request number
      const requestCount = transferRequests.length + 1;
      const requestNumber = `TR-2024-${String(requestCount).padStart(3, '0')}`;

      // Create transfer request
      const { data: requestData, error: requestError } = await supabase
        .from('transfer_requests')
        .insert({
          request_number: requestNumber,
          source_warehouse_id: data.sourceWarehouseId,
          destination_warehouse_id: data.destinationWarehouseId,
          status: 'pending',
          priority: data.priority,
          required_date: data.requiredDate.toISOString(),
          notes: data.notes
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create transfer request items
      const itemsToInsert = data.items.map(item => ({
        transfer_request_id: requestData.id,
        product_id: item.productId,
        requested_quantity: item.requestedQuantity,
        unit: item.unit,
        notes: item.notes
      }));

      const { data: itemsData, error: itemsError } = await supabase
        .from('transfer_request_items')
        .insert(itemsToInsert)
        .select(`
          *,
          products (
            id,
            name,
            product_code
          )
        `);

      if (itemsError) throw itemsError;

      // Transform and return the new request
      const newRequest = transformTransferRequest(requestData, itemsData);
      
      // Refresh the transfer requests list
      await fetchTransferRequests();
      
      return newRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transfer request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update transfer request status
  const updateTransferRequestStatus = async (id: string, status: TransferRequestStatus): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add specific date fields based on status
      if (status === 'approved') {
        updateData.approved_date = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('transfer_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Refresh the transfer requests list
      await fetchTransferRequests();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transfer request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get transfer request by ID
  const getTransferRequestById = (id: string): TransferRequest | undefined => {
    return transferRequests.find(request => request.id === id);
  };

  // Delete transfer request
  const deleteTransferRequest = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Delete transfer request (items will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('transfer_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the transfer requests list
      await fetchTransferRequests();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transfer request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    transferRequests,
    loading,
    error,
    getFilteredRequests,
    getStats,
    createTransferRequest,
    updateTransferRequestStatus,
    getTransferRequestById,
    deleteTransferRequest,
    warehouses,
    products,
    refreshData: fetchTransferRequests
  };
}

export default useTransferRequests;