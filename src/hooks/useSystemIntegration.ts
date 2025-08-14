// System Integration Hook - เชื่อมต่อระบบต่างๆ
import { useState, useCallback } from 'react';
import { IntegrationService } from '@/services/integrationService';
import type { 
  JournalEntry,
  PurchaseOrderIntegration 
} from '@/services/integrationService';
import type { 
  SupplierInvoice, 
  SupplierPayment 
} from '@/types/supplier';
import type { 
  ReceiveLog,
  StockMovement 
} from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';

export interface UseSystemIntegrationOptions {
  autoSync?: boolean;
  enableJournalEntries?: boolean;
  enablePOSIntegration?: boolean;
  enableWarehouseIntegration?: boolean;
  enableReporting?: boolean;
}

export function useSystemIntegration(options: UseSystemIntegrationOptions = {}) {
  const {
    autoSync = true,
    enableJournalEntries = true,
    enablePOSIntegration = true,
    enableWarehouseIntegration = true,
    enableReporting = true
  } = options;

  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderIntegration[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // ==================== ACCOUNTING INTEGRATION ====================

  /**
   * สร้าง Journal Entry สำหรับใบแจ้งหนี้
   */
  const createInvoiceJournalEntry = useCallback(async (invoice: SupplierInvoice) => {
    if (!enableJournalEntries) return null;

    try {
      setLoading(true);
      setError(null);

      const journalEntry = await IntegrationService.createInvoiceJournalEntry(invoice);
      
      setJournalEntries(prev => [journalEntry, ...prev]);

      if (autoSync) {
        toast({
          title: 'สำเร็จ',
          description: `สร้าง Journal Entry ${journalEntry.entryNumber} สำหรับใบแจ้งหนี้ ${invoice.invoiceNumber}`,
        });
      }

      return journalEntry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้าง Journal Entry ได้';
      setError(errorMessage);
      
      if (autoSync) {
        toast({
          title: 'ข้อผิดพลาด',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enableJournalEntries, autoSync, toast]);

  /**
   * สร้าง Journal Entry สำหรับการชำระเงิน
   */
  const createPaymentJournalEntry = useCallback(async (payment: SupplierPayment) => {
    if (!enableJournalEntries) return null;

    try {
      setLoading(true);
      setError(null);

      const journalEntry = await IntegrationService.createPaymentJournalEntry(payment);
      
      setJournalEntries(prev => [journalEntry, ...prev]);

      if (autoSync) {
        toast({
          title: 'สำเร็จ',
          description: `สร้าง Journal Entry ${journalEntry.entryNumber} สำหรับการชำระเงิน ${payment.paymentNumber}`,
        });
      }

      return journalEntry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้าง Journal Entry ได้';
      setError(errorMessage);
      
      if (autoSync) {
        toast({
          title: 'ข้อผิดพลาด',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enableJournalEntries, autoSync, toast]);

  // ==================== POS INTEGRATION ====================

  /**
   * สร้าง Purchase Order จาก POS
   */
  const createPurchaseOrderFromPOS = useCallback(async (orderData: {
    supplierId: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    notes?: string;
    expectedDeliveryDate?: Date;
  }) => {
    if (!enablePOSIntegration) return null;

    try {
      setLoading(true);
      setError(null);

      const purchaseOrder = await IntegrationService.createPurchaseOrderFromPOS(orderData);
      
      setPurchaseOrders(prev => [purchaseOrder, ...prev]);

      if (autoSync) {
        toast({
          title: 'สำเร็จ',
          description: `สร้าง Purchase Order ${purchaseOrder.orderNumber} จาก POS System`,
        });
      }

      return purchaseOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้าง Purchase Order จาก POS ได้';
      setError(errorMessage);
      
      if (autoSync) {
        toast({
          title: 'ข้อผิดพลาด',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enablePOSIntegration, autoSync, toast]);

  /**
   * อัปเดต Purchase Order เมื่อรับสินค้า
   */
  const updatePurchaseOrderOnReceive = useCallback(async (
    orderId: string,
    receivedItems: { productId: string; receivedQuantity: number }[]
  ) => {
    if (!enablePOSIntegration) return;

    try {
      setLoading(true);
      setError(null);

      await IntegrationService.updatePurchaseOrderOnReceive(orderId, receivedItems);

      // อัปเดต local state
      setPurchaseOrders(prev => 
        prev.map(po => {
          if (po.id === orderId) {
            const updatedItems = po.items.map(item => {
              const receivedItem = receivedItems.find(ri => ri.productId === item.productId);
              if (receivedItem) {
                return {
                  ...item,
                  receivedQuantity: item.receivedQuantity + receivedItem.receivedQuantity
                };
              }
              return item;
            });

            const isFullyReceived = updatedItems.every(item => 
              item.receivedQuantity >= item.quantity
            );

            return {
              ...po,
              status: isFullyReceived ? 'received' : 'approved',
              items: updatedItems
            };
          }
          return po;
        })
      );

      if (autoSync) {
        toast({
          title: 'สำเร็จ',
          description: 'อัปเดต Purchase Order เมื่อรับสินค้าเรียบร้อยแล้ว',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถอัปเดต Purchase Order ได้';
      setError(errorMessage);
      
      if (autoSync) {
        toast({
          title: 'ข้อผิดพลาด',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enablePOSIntegration, autoSync, toast]);

  // ==================== WAREHOUSE INTEGRATION ====================

  /**
   * รับสินค้าเข้าคลังพร้อมเชื่อมต่อ Purchase Order
   */
  const receiveGoodsWithPurchaseOrder = useCallback(async (receiveData: {
    warehouseId: string;
    purchaseOrderId: string;
    supplierId: string;
    invoiceNumber?: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    notes?: string;
    receivedBy: string;
  }) => {
    if (!enableWarehouseIntegration) return null;

    try {
      setLoading(true);
      setError(null);

      const result = await IntegrationService.receiveGoodsWithPurchaseOrder(receiveData);

      // อัปเดต Purchase Order state ถ้าเปิดใช้งาน POS Integration
      if (enablePOSIntegration) {
        await updatePurchaseOrderOnReceive(
          receiveData.purchaseOrderId,
          receiveData.items.map(item => ({
            productId: item.productId,
            receivedQuantity: item.quantity
          }))
        );
      }

      if (autoSync) {
        toast({
          title: 'สำเร็จ',
          description: `รับสินค้าเข้าคลัง ${result.receiveLog.receiveNumber} และเชื่อมต่อ Purchase Order เรียบร้อยแล้ว`,
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถรับสินค้าเข้าคลังได้';
      setError(errorMessage);
      
      if (autoSync) {
        toast({
          title: 'ข้อผิดพลาด',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enableWarehouseIntegration, enablePOSIntegration, autoSync, updatePurchaseOrderOnReceive, toast]);

  // ==================== REPORTING INTEGRATION ====================

  /**
   * สร้างข้อมูล Analytics
   */
  const generateSupplierAnalytics = useCallback(async (dateFrom?: Date, dateTo?: Date) => {
    if (!enableReporting) return null;

    try {
      setLoading(true);
      setError(null);

      const analyticsData = await IntegrationService.generateSupplierAnalytics(dateFrom, dateTo);
      
      setAnalytics(analyticsData);

      return analyticsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างข้อมูล Analytics ได้';
      setError(errorMessage);
      
      if (autoSync) {
        toast({
          title: 'ข้อผิดพลาด',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [enableReporting, autoSync, toast]);

  /**
   * สร้างรายงาน Supplier Performance
   */
  const generateSupplierPerformanceReport = useCallback(async (supplierId?: string) => {
    if (!enableReporting) return null;

    try {
      setLoading(true);
      setError(null);

      const report = await IntegrationService.generateSupplierPerformanceReport(supplierId);

      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างรายงาน Supplier Performance ได้';
      setError(errorMessage);
      
      if (autoSync) {
        toast({
          title: 'ข้อผิดพลาด',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [enableReporting, autoSync, toast]);

  // ==================== INTEGRATED WORKFLOWS ====================

  /**
   * Workflow: สร้างใบแจ้งหนี้พร้อม Journal Entry
   */
  const createInvoiceWithJournalEntry = useCallback(async (
    invoiceData: any,
    createInvoiceFunction: (data: any) => Promise<SupplierInvoice>
  ) => {
    try {
      setLoading(true);
      setError(null);

      // สร้างใบแจ้งหนี้
      const invoice = await createInvoiceFunction(invoiceData);

      // สร้าง Journal Entry (ถ้าเปิดใช้งาน)
      if (enableJournalEntries) {
        await createInvoiceJournalEntry(invoice);
      }

      return invoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างใบแจ้งหนี้พร้อม Journal Entry ได้';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enableJournalEntries, createInvoiceJournalEntry]);

  /**
   * Workflow: ชำระเงินพร้อม Journal Entry
   */
  const createPaymentWithJournalEntry = useCallback(async (
    paymentData: any,
    createPaymentFunction: (data: any) => Promise<SupplierPayment>
  ) => {
    try {
      setLoading(true);
      setError(null);

      // สร้างการชำระเงิน
      const payment = await createPaymentFunction(paymentData);

      // สร้าง Journal Entry (ถ้าเปิดใช้งาน)
      if (enableJournalEntries) {
        await createPaymentJournalEntry(payment);
      }

      return payment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างการชำระเงินพร้อม Journal Entry ได้';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enableJournalEntries, createPaymentJournalEntry]);

  /**
   * Workflow: รับสินค้าครบวงจร (PO -> Warehouse -> Accounting)
   */
  const completeReceiveWorkflow = useCallback(async (receiveData: {
    warehouseId: string;
    purchaseOrderId: string;
    supplierId: string;
    invoiceNumber?: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    notes?: string;
    receivedBy: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // รับสินค้าเข้าคลังพร้อมอัปเดต PO
      const result = await receiveGoodsWithPurchaseOrder(receiveData);

      if (autoSync) {
        toast({
          title: 'สำเร็จ',
          description: 'ดำเนินการรับสินค้าครบวงจรเรียบร้อยแล้ว (คลัง + PO + บัญชี)',
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดำเนินการรับสินค้าครบวงจรได้';
      setError(errorMessage);
      
      if (autoSync) {
        toast({
          title: 'ข้อผิดพลาด',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [receiveGoodsWithPurchaseOrder, autoSync, toast]);

  return {
    // State
    loading,
    error,
    journalEntries,
    purchaseOrders,
    analytics,

    // Accounting Integration
    createInvoiceJournalEntry,
    createPaymentJournalEntry,

    // POS Integration
    createPurchaseOrderFromPOS,
    updatePurchaseOrderOnReceive,

    // Warehouse Integration
    receiveGoodsWithPurchaseOrder,

    // Reporting Integration
    generateSupplierAnalytics,
    generateSupplierPerformanceReport,

    // Integrated Workflows
    createInvoiceWithJournalEntry,
    createPaymentWithJournalEntry,
    completeReceiveWorkflow,

    // Utilities
    clearError: () => setError(null),
    isIntegrationEnabled: {
      journalEntries: enableJournalEntries,
      posIntegration: enablePOSIntegration,
      warehouseIntegration: enableWarehouseIntegration,
      reporting: enableReporting
    }
  };
}