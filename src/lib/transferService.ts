// Placeholder transfer service for compatibility
export interface TransferRequest {
  id: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  items: Array<{
    productId: string;
    quantity: number;
    serialNumbers?: string[];
  }>;
  requestedBy: string;
  notes?: string;
}

export interface TransferConfirmation {
  transferId: string;
  confirmedBy: string;
  receivedItems: Array<{
    productId: string;
    quantity: number;
    serialNumbers?: string[];
  }>;
  notes?: string;
}

export const transferService = {
  async getTransfers(filters?: any) {
    return [];
  },

  async getAvailableSerialNumbers(warehouseId: string, searchTerm?: string) {
    return [];
  },

  async initiateTransfer(request: TransferRequest, initiatedBy: string) {
    throw new Error('Transfer functionality not available');
  },

  async confirmTransfer(confirmation: TransferConfirmation) {
    throw new Error('Transfer functionality not available');
  },

  async cancelTransfer(transferId: string, reason: string, cancelledBy: string) {
    throw new Error('Transfer functionality not available');
  },

  async getTransferById(transferId: string) {
    return null;
  }
};