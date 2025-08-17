import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { transferService } from '@/services/transferService';
import {
  TransferRequest,
  TransferShipment,
  CreateTransferRequestData,
  CreateTransferShipmentData,
  UpdateTransferRequestData,
  ApproveTransferRequestData,
  ReceiveShipmentData,
  TransferRequestFilters,
  TransferShipmentFilters,
  TransferStatistics,
} from '@/types/transfer';

// Hook for managing transfer requests
export const useTransferRequests = (initialFilters: TransferRequestFilters = {}) => {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransferRequestFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const { toast } = useToast();

  const fetchRequests = useCallback(async (page: number = 1, newFilters?: TransferRequestFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = newFilters || filters;
      const response = await transferService.getTransferRequests(currentFilters, page, pagination.limit);
      
      if (page === 1) {
        setRequests(response.data);
      } else {
        setRequests(prev => [...prev, ...response.data]);
      }
      
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        hasMore: response.has_more,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, toast]);

  const createRequest = useCallback(async (data: CreateTransferRequestData) => {
    try {
      setLoading(true);
      const newRequest = await transferService.createTransferRequest(data);
      setRequests(prev => [newRequest, ...prev]);
      toast({
        title: 'สำเร็จ',
        description: 'สร้างคำขอโอนย้ายสินค้าเรียบร้อยแล้ว',
      });
      return newRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างคำขอ';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateRequest = useCallback(async (id: string, data: UpdateTransferRequestData) => {
    try {
      setLoading(true);
      const updatedRequest = await transferService.updateTransferRequest(id, data);
      setRequests(prev => prev.map(req => req.id === id ? updatedRequest : req));
      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตคำขอโอนย้ายสินค้าเรียบร้อยแล้ว',
      });
      return updatedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตคำขอ';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const approveRequest = useCallback(async (id: string, data: ApproveTransferRequestData) => {
    try {
      setLoading(true);
      const approvedRequest = await transferService.approveTransferRequest(id, data);
      setRequests(prev => prev.map(req => req.id === id ? approvedRequest : req));
      toast({
        title: 'สำเร็จ',
        description: 'อนุมัติคำขอโอนย้ายสินค้าเรียบร้อยแล้ว',
      });
      return approvedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอนุมัติคำขอ';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const rejectRequest = useCallback(async (id: string, reason: string) => {
    try {
      setLoading(true);
      const rejectedRequest = await transferService.rejectTransferRequest(id, reason);
      setRequests(prev => prev.map(req => req.id === id ? rejectedRequest : req));
      toast({
        title: 'สำเร็จ',
        description: 'ปฏิเสธคำขอโอนย้ายสินค้าเรียบร้อยแล้ว',
      });
      return rejectedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteRequest = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await transferService.deleteTransferRequest(id);
      setRequests(prev => prev.filter(req => req.id !== id));
      toast({
        title: 'สำเร็จ',
        description: 'ลบคำขอโอนย้ายสินค้าเรียบร้อยแล้ว',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบคำขอ';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const applyFilters = useCallback((newFilters: TransferRequestFilters) => {
    setFilters(newFilters);
    fetchRequests(1, newFilters);
  }, [fetchRequests]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchRequests(pagination.page + 1);
    }
  }, [fetchRequests, pagination.hasMore, pagination.page, loading]);

  const refresh = useCallback(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests(1);
  }, []);

  return {
    requests,
    loading,
    error,
    filters,
    pagination,
    createRequest,
    updateRequest,
    approveRequest,
    rejectRequest,
    deleteRequest,
    applyFilters,
    loadMore,
    refresh,
  };
};

// Hook for managing transfer shipments
export const useTransferShipments = (initialFilters: TransferShipmentFilters = {}) => {
  const [shipments, setShipments] = useState<TransferShipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransferShipmentFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const { toast } = useToast();

  const fetchShipments = useCallback(async (page: number = 1, newFilters?: TransferShipmentFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = newFilters || filters;
      const response = await transferService.getTransferShipments(currentFilters, page, pagination.limit);
      
      if (page === 1) {
        setShipments(response.data);
      } else {
        setShipments(prev => [...prev, ...response.data]);
      }
      
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        hasMore: response.has_more,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, toast]);

  const createShipment = useCallback(async (data: CreateTransferShipmentData) => {
    try {
      setLoading(true);
      const newShipment = await transferService.createTransferShipment(data);
      setShipments(prev => [newShipment, ...prev]);
      toast({
        title: 'สำเร็จ',
        description: 'สร้างการจัดส่งเรียบร้อยแล้ว',
      });
      return newShipment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างการจัดส่ง';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const receiveShipment = useCallback(async (shipmentId: string, data: ReceiveShipmentData) => {
    try {
      setLoading(true);
      const receivedShipment = await transferService.receiveShipment(shipmentId, data);
      setShipments(prev => prev.map(shipment => shipment.id === shipmentId ? receivedShipment : shipment));
      toast({
        title: 'สำเร็จ',
        description: 'รับสินค้าเรียบร้อยแล้ว',
      });
      return receivedShipment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรับสินค้า';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const applyFilters = useCallback((newFilters: TransferShipmentFilters) => {
    setFilters(newFilters);
    fetchShipments(1, newFilters);
  }, [fetchShipments]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchShipments(pagination.page + 1);
    }
  }, [fetchShipments, pagination.hasMore, pagination.page, loading]);

  const refresh = useCallback(() => {
    fetchShipments(1);
  }, [fetchShipments]);

  useEffect(() => {
    fetchShipments(1);
  }, []);

  return {
    shipments,
    loading,
    error,
    filters,
    pagination,
    createShipment,
    receiveShipment,
    applyFilters,
    loadMore,
    refresh,
  };
};

// Hook for managing a single transfer request
export const useTransferRequest = (id: string | null) => {
  const [request, setRequest] = useState<TransferRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await transferService.getTransferRequest(id);
      setRequest(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const updateRequest = useCallback(async (data: UpdateTransferRequestData) => {
    if (!id) return;
    
    try {
      setLoading(true);
      const updatedRequest = await transferService.updateTransferRequest(id, data);
      setRequest(updatedRequest);
      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตคำขอโอนย้ายสินค้าเรียบร้อยแล้ว',
      });
      return updatedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตคำขอ';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const approveRequest = useCallback(async (data: ApproveTransferRequestData) => {
    if (!id) return;
    
    try {
      setLoading(true);
      const approvedRequest = await transferService.approveTransferRequest(id, data);
      setRequest(approvedRequest);
      toast({
        title: 'สำเร็จ',
        description: 'อนุมัติคำขอโอนย้ายสินค้าเรียบร้อยแล้ว',
      });
      return approvedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอนุมัติคำขอ';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const rejectRequest = useCallback(async (reason: string) => {
    if (!id) return;
    
    try {
      setLoading(true);
      const rejectedRequest = await transferService.rejectTransferRequest(id, reason);
      setRequest(rejectedRequest);
      toast({
        title: 'สำเร็จ',
        description: 'ปฏิเสธคำขอโอนย้ายสินค้าเรียบร้อยแล้ว',
      });
      return rejectedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const refresh = useCallback(() => {
    fetchRequest();
  }, [fetchRequest]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return {
    request,
    loading,
    error,
    updateRequest,
    approveRequest,
    rejectRequest,
    refresh,
  };
};

// Hook for transfer statistics
export const useTransferStatistics = (dateFrom?: string, dateTo?: string) => {
  const [statistics, setStatistics] = useState<TransferStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transferService.getTransferStatistics(dateFrom, dateTo);
      setStatistics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดสstatistics';
      setError(errorMessage);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, toast]);

  const refresh = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh,
  };
};

// Hook for document upload
export const useTransferDocuments = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadDocument = useCallback(async (
    file: File,
    transferRequestId?: string,
    transferShipmentId?: string,
    documentType: string = 'other'
  ) => {
    try {
      setUploading(true);
      await transferService.uploadDocument(file, transferRequestId, transferShipmentId, documentType);
      toast({
        title: 'สำเร็จ',
        description: 'อัปโหลดเอกสารเรียบร้อยแล้ว',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลดเอกสาร';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setUploading(false);
    }
  }, [toast]);

  return {
    uploading,
    uploadDocument,
  };
};