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
  serialNumbers?: string[];
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
    return {
      id: 'mock-id',
      transferNumber: `TRF-${Date.now()}`,
      sourceWarehouseId: request.sourceWarehouseId,
      targetWarehouseId: request.targetWarehouseId,
      totalItems: request.items.length,
      items: request.items,
      status: 'pending' as const,
      initiatedBy: initiatedBy,
      createdAt: new Date().toISOString(),
      notes: request.notes
    };
  },

  async confirmTransfer(confirmation: TransferConfirmation) {
    return {
      id: 'mock-id',
      transferNumber: `TRF-${Date.now()}`,
      sourceWarehouseId: 'mock-source',
      targetWarehouseId: 'mock-target',
      totalItems: 1,
      items: [],
      status: 'completed' as const,
      initiatedBy: 'mock-user',
      createdAt: new Date().toISOString()
    };
  },

  async cancelTransfer(transferId: string, reason: string, cancelledBy: string) {
    // Mock implementation
  },

  async getTransferById(transferId: string) {
    return null;
  }
};