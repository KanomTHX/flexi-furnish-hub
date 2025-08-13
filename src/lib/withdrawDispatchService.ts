// Placeholder withdraw dispatch service for compatibility
import { SerialNumber } from '@/types/warehouseStock';

// Placeholder service that returns empty data since tables don't exist
export const withdrawDispatchService = {
  async getAvailableSerialNumbers(filters?: any): Promise<SerialNumber[]> {
    return [];
  },

  async getClaimedSerialNumbers(filters?: any): Promise<SerialNumber[]> {
    return [];
  },

  async claimSerialNumber(serialNumberId: string, data: any): Promise<void> {
    throw new Error('Withdraw dispatch functionality not available');
  },

  async updateClaimedStatus(serialNumberId: string, status: string): Promise<void> {
    throw new Error('Withdraw dispatch functionality not available');
  },

  async generateWithdrawReport(filters?: any): Promise<any> {
    return {
      totalItems: 0,
      totalValue: 0,
      withdrawnItems: [],
      summary: {}
    };
  }
};
