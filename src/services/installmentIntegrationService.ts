// Placeholder service for installment integration
export interface InstallmentStockReservation {
  id: string;
  contractId: string;
  contractNumber: string;
  productId: string;
  serialNumber: string;
  warehouseId: string;
  reservedAt: Date;
  status: 'reserved' | 'confirmed' | 'released';
}

export interface InstallmentStockItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  serialNumbers?: string[];
}

export interface ContractStockData {
  contractId: string;
  contractNumber: string;
  items: InstallmentStockItem[];
  warehouseId: string;
  customerId?: string;
  branchId?: string;
}

export interface ExtendedInstallmentStockItem extends InstallmentStockItem {
  warehouseId?: string;
}

export const installmentIntegrationService = {
  async syncContracts(): Promise<void> {
    // Mock implementation
  },

  async validateContract(contract: any): Promise<boolean> {
    return true;
  },

  async reserveStockForContract(contractData: ContractStockData): Promise<InstallmentStockReservation[]> {
    return [];
  },

  async confirmStockSale(contractId: string, saleData: any): Promise<void> {
    // Mock implementation
  },

  async releaseReservedStock(contractId: string, reason?: string): Promise<void> {
    // Mock implementation
  },

  async onInstallmentContractCreated(contract: any, items: InstallmentStockItem[]): Promise<InstallmentStockReservation[]> {
    return [];
  },

  async onInstallmentContractCancelled(contractId: string, reason?: string): Promise<void> {
    // Mock implementation
  },

  async onInstallmentSaleConfirmed(contractId: string, saleData: any): Promise<void> {
    // Mock implementation
  },

  async trackInstallmentSNs(contractId: string): Promise<any[]> {
    return [];
  },

  async getInstallmentSNHistory(serialNumber: string): Promise<any[]> {
    return [];
  }
};
