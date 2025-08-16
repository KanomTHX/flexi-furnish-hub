// Simple integration hook replacement
import { useState } from 'react';

export const useSimpleIntegration = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [status, setStatus] = useState('active');

  const sync = async () => {
    return { success: true, message: 'Sync completed' };
  };

  return {
    isConnected,
    status,
    sync,
    loading: false,
    error: null,
    journalEntries: [],
    purchaseOrders: [],
    analytics: { 
      processed: 0, 
      errors: 0,
      supplierPerformance: [],
      paymentTrends: []
    },
    generateSupplierAnalytics: () => Promise.resolve({}),
    generateSupplierPerformanceReport: () => Promise.resolve({}),
    isIntegrationEnabled: { 
      journalEntries: true, 
      purchaseOrders: true,
      posIntegration: true,
      warehouseIntegration: true,
      reporting: true
    }
  };
};