/**
 * Mock Services for Testing
 * Provides mock implementations of all external dependencies
 */

import { vi } from 'vitest';
import {
  AccountingService,
  ReportingService,
  POSIntegrationService,
  NotificationService,
  JournalEntry,
  Account,
  ReconciliationReport,
  Report,
  StockAlert,
  AutoPurchaseOrder,
  ScheduledNotification,
  SyncResult,
  NotificationResult
} from '@/types/advanced';

export class MockAccountingService implements AccountingService {
  private mockResponses = new Map<string, any>();
  private callHistory: Array<{ method: string; args: any[] }> = [];

  setMockResponse(method: string, response: any): void {
    this.mockResponses.set(method, response);
  }

  simulateError(method: string, error: Error): void {
    this.mockResponses.set(method, { error });
  }

  getCallHistory(): Array<{ method: string; args: any[] }> {
    return this.callHistory;
  }

  clearHistory(): void {
    this.callHistory = [];
  }

  async createJournalEntry(transaction: any): Promise<JournalEntry> {
    this.callHistory.push({ method: 'createJournalEntry', args: [transaction] });
    const response = this.mockResponses.get('createJournalEntry');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-journal-entry-id',
      entryNumber: 'JE-001',
      transactionDate: new Date(),
      description: 'Mock journal entry',
      reference: transaction.id,
      totalDebit: transaction.amount,
      totalCredit: transaction.amount,
      entries: [],
      status: 'draft',
      createdBy: 'mock-user',
      createdAt: new Date()
    };
  }

  async getChartOfAccounts(): Promise<Account[]> {
    this.callHistory.push({ method: 'getChartOfAccounts', args: [] });
    const response = this.mockResponses.get('getChartOfAccounts');
    if (response?.error) throw response.error;
    return response || [];
  }

  async reconcileSupplierBalances(period: any): Promise<ReconciliationReport> {
    this.callHistory.push({ method: 'reconcileSupplierBalances', args: [period] });
    const response = this.mockResponses.get('reconcileSupplierBalances');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-reconciliation-id',
      periodStart: period.start,
      periodEnd: period.end,
      supplierBalanceTotal: 10000,
      accountingBalanceTotal: 10000,
      discrepancyAmount: 0,
      discrepancies: [],
      status: 'completed',
      createdAt: new Date()
    };
  }

  async syncWithExternalSystem(systemType: string): Promise<SyncResult> {
    this.callHistory.push({ method: 'syncWithExternalSystem', args: [systemType] });
    const response = this.mockResponses.get('syncWithExternalSystem');
    if (response?.error) throw response.error;
    return response || {
      success: true,
      recordsProcessed: 10,
      errors: [],
      syncedAt: new Date()
    };
  }
}

export class MockReportingService implements ReportingService {
  private mockResponses = new Map<string, any>();
  private callHistory: Array<{ method: string; args: any[] }> = [];

  setMockResponse(method: string, response: any): void {
    this.mockResponses.set(method, response);
  }

  simulateError(method: string, error: Error): void {
    this.mockResponses.set(method, { error });
  }

  getCallHistory(): Array<{ method: string; args: any[] }> {
    return this.callHistory;
  }

  clearHistory(): void {
    this.callHistory = [];
  }

  async generateSupplierPerformanceReport(params: any): Promise<Report> {
    this.callHistory.push({ method: 'generateSupplierPerformanceReport', args: [params] });
    const response = this.mockResponses.get('generateSupplierPerformanceReport');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-report-id',
      name: 'Supplier Performance Report',
      type: 'supplier_performance',
      parameters: params,
      data: [],
      metadata: { totalRecords: 0, generationTime: 100, filters: {} },
      generatedAt: new Date(),
      generatedBy: 'mock-user'
    };
  }

  async generateSpendingAnalysisReport(params: any): Promise<Report> {
    this.callHistory.push({ method: 'generateSpendingAnalysisReport', args: [params] });
    const response = this.mockResponses.get('generateSpendingAnalysisReport');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-report-id',
      name: 'Spending Analysis Report',
      type: 'spending_analysis',
      parameters: params,
      data: [],
      metadata: { totalRecords: 0, generationTime: 100, filters: {} },
      generatedAt: new Date(),
      generatedBy: 'mock-user'
    };
  }

  async generateAgingReport(params: any): Promise<Report> {
    this.callHistory.push({ method: 'generateAgingReport', args: [params] });
    const response = this.mockResponses.get('generateAgingReport');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-report-id',
      name: 'Aging Report',
      type: 'aging',
      parameters: params,
      data: [],
      metadata: { totalRecords: 0, generationTime: 100, filters: {} },
      generatedAt: new Date(),
      generatedBy: 'mock-user'
    };
  }

  async generateCashFlowProjection(params: any): Promise<Report> {
    this.callHistory.push({ method: 'generateCashFlowProjection', args: [params] });
    const response = this.mockResponses.get('generateCashFlowProjection');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-report-id',
      name: 'Cash Flow Projection',
      type: 'cash_flow',
      parameters: params,
      data: [],
      metadata: { totalRecords: 0, generationTime: 100, filters: {} },
      generatedAt: new Date(),
      generatedBy: 'mock-user'
    };
  }

  async scheduleReport(schedule: any): Promise<any> {
    this.callHistory.push({ method: 'scheduleReport', args: [schedule] });
    const response = this.mockResponses.get('scheduleReport');
    if (response?.error) throw response.error;
    return response || { id: 'mock-scheduled-report-id', ...schedule };
  }

  async exportReport(reportId: string, format: string): Promise<any> {
    this.callHistory.push({ method: 'exportReport', args: [reportId, format] });
    const response = this.mockResponses.get('exportReport');
    if (response?.error) throw response.error;
    return response || { success: true, downloadUrl: 'mock-download-url' };
  }
}

export class MockPOSIntegrationService implements POSIntegrationService {
  private mockResponses = new Map<string, any>();
  private callHistory: Array<{ method: string; args: any[] }> = [];

  setMockResponse(method: string, response: any): void {
    this.mockResponses.set(method, response);
  }

  simulateError(method: string, error: Error): void {
    this.mockResponses.set(method, { error });
  }

  getCallHistory(): Array<{ method: string; args: any[] }> {
    return this.callHistory;
  }

  clearHistory(): void {
    this.callHistory = [];
  }

  async syncInventoryLevels(): Promise<SyncResult> {
    this.callHistory.push({ method: 'syncInventoryLevels', args: [] });
    const response = this.mockResponses.get('syncInventoryLevels');
    if (response?.error) throw response.error;
    return response || {
      success: true,
      recordsProcessed: 100,
      errors: [],
      syncedAt: new Date()
    };
  }

  async processLowStockAlerts(alerts: StockAlert[]): Promise<AutoPurchaseOrder[]> {
    this.callHistory.push({ method: 'processLowStockAlerts', args: [alerts] });
    const response = this.mockResponses.get('processLowStockAlerts');
    if (response?.error) throw response.error;
    return response || [];
  }

  async updateInventoryFromDelivery(delivery: any): Promise<any> {
    this.callHistory.push({ method: 'updateInventoryFromDelivery', args: [delivery] });
    const response = this.mockResponses.get('updateInventoryFromDelivery');
    if (response?.error) throw response.error;
    return response || { success: true };
  }

  async getPreferredSuppliers(productId: string): Promise<any[]> {
    this.callHistory.push({ method: 'getPreferredSuppliers', args: [productId] });
    const response = this.mockResponses.get('getPreferredSuppliers');
    if (response?.error) throw response.error;
    return response || [];
  }

  async createAutomaticPurchaseOrder(stockAlert: StockAlert): Promise<AutoPurchaseOrder> {
    this.callHistory.push({ method: 'createAutomaticPurchaseOrder', args: [stockAlert] });
    const response = this.mockResponses.get('createAutomaticPurchaseOrder');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-apo-id',
      orderNumber: 'APO-001',
      supplierId: stockAlert.preferredSupplierId,
      items: [],
      totalAmount: 1000,
      expectedDeliveryDate: new Date(),
      status: 'draft',
      automationReason: 'Low stock alert',
      createdAt: new Date()
    };
  }
}

export class MockNotificationService implements NotificationService {
  private mockResponses = new Map<string, any>();
  private callHistory: Array<{ method: string; args: any[] }> = [];

  setMockResponse(method: string, response: any): void {
    this.mockResponses.set(method, response);
  }

  simulateError(method: string, error: Error): void {
    this.mockResponses.set(method, { error });
  }

  getCallHistory(): Array<{ method: string; args: any[] }> {
    return this.callHistory;
  }

  clearHistory(): void {
    this.callHistory = [];
  }

  async schedulePaymentReminder(invoice: any): Promise<ScheduledNotification> {
    this.callHistory.push({ method: 'schedulePaymentReminder', args: [invoice] });
    const response = this.mockResponses.get('schedulePaymentReminder');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-notification-id',
      type: 'payment_reminder',
      recipientEmail: 'supplier@test.com',
      subject: 'Payment Reminder',
      content: 'Your payment is due',
      scheduledFor: new Date(),
      status: 'scheduled',
      templateId: 'mock-template-id',
      relatedEntityId: invoice.id,
      relatedEntityType: 'invoice'
    };
  }

  async sendOverdueNotification(invoice: any): Promise<NotificationResult> {
    this.callHistory.push({ method: 'sendOverdueNotification', args: [invoice] });
    const response = this.mockResponses.get('sendOverdueNotification');
    if (response?.error) throw response.error;
    return response || {
      success: true,
      messageId: 'mock-message-id',
      sentAt: new Date()
    };
  }

  async sendMonthlyStatement(supplier: any): Promise<NotificationResult> {
    this.callHistory.push({ method: 'sendMonthlyStatement', args: [supplier] });
    const response = this.mockResponses.get('sendMonthlyStatement');
    if (response?.error) throw response.error;
    return response || {
      success: true,
      messageId: 'mock-message-id',
      sentAt: new Date()
    };
  }

  async createCustomReminder(reminder: any): Promise<ScheduledNotification> {
    this.callHistory.push({ method: 'createCustomReminder', args: [reminder] });
    const response = this.mockResponses.get('createCustomReminder');
    if (response?.error) throw response.error;
    return response || {
      id: 'mock-notification-id',
      type: 'custom',
      recipientEmail: reminder.recipientEmail,
      subject: reminder.subject,
      content: reminder.content,
      scheduledFor: reminder.scheduledFor,
      status: 'scheduled',
      templateId: reminder.templateId,
      relatedEntityId: reminder.relatedEntityId,
      relatedEntityType: reminder.relatedEntityType
    };
  }

  async getNotificationHistory(filters: any): Promise<any[]> {
    this.callHistory.push({ method: 'getNotificationHistory', args: [filters] });
    const response = this.mockResponses.get('getNotificationHistory');
    if (response?.error) throw response.error;
    return response || [];
  }
}

// Database Mock
export class MockDatabase {
  private data = new Map<string, any[]>();
  private callHistory: Array<{ method: string; table: string; args: any[] }> = [];

  constructor() {
    // Initialize with empty tables
    this.data.set('suppliers', []);
    this.data.set('supplier_invoices', []);
    this.data.set('supplier_payments', []);
    this.data.set('journal_entries', []);
    this.data.set('accounts', []);
    this.data.set('stock_alerts', []);
    this.data.set('notifications', []);
  }

  async select(table: string, filters?: any): Promise<any[]> {
    this.callHistory.push({ method: 'select', table, args: [filters] });
    const tableData = this.data.get(table) || [];
    
    if (!filters) return [...tableData];
    
    return tableData.filter(record => {
      return Object.entries(filters).every(([key, value]) => record[key] === value);
    });
  }

  async insert(table: string, record: any): Promise<any> {
    this.callHistory.push({ method: 'insert', table, args: [record] });
    const tableData = this.data.get(table) || [];
    const newRecord = { ...record, id: record.id || `mock-id-${Date.now()}` };
    tableData.push(newRecord);
    this.data.set(table, tableData);
    return newRecord;
  }

  async update(table: string, id: string, updates: any): Promise<any> {
    this.callHistory.push({ method: 'update', table, args: [id, updates] });
    const tableData = this.data.get(table) || [];
    const index = tableData.findIndex(record => record.id === id);
    
    if (index === -1) throw new Error(`Record not found: ${id}`);
    
    tableData[index] = { ...tableData[index], ...updates };
    return tableData[index];
  }

  async delete(table: string, id: string): Promise<boolean> {
    this.callHistory.push({ method: 'delete', table, args: [id] });
    const tableData = this.data.get(table) || [];
    const index = tableData.findIndex(record => record.id === id);
    
    if (index === -1) return false;
    
    tableData.splice(index, 1);
    return true;
  }

  getCallHistory(): Array<{ method: string; table: string; args: any[] }> {
    return this.callHistory;
  }

  clearHistory(): void {
    this.callHistory = [];
  }

  clearData(): void {
    this.data.clear();
    this.data.set('suppliers', []);
    this.data.set('supplier_invoices', []);
    this.data.set('supplier_payments', []);
    this.data.set('journal_entries', []);
    this.data.set('accounts', []);
    this.data.set('stock_alerts', []);
    this.data.set('notifications', []);
  }

  seedData(table: string, records: any[]): void {
    this.data.set(table, [...records]);
  }
}

// Global mock instances
export const mockAccountingService = new MockAccountingService();
export const mockReportingService = new MockReportingService();
export const mockPOSIntegrationService = new MockPOSIntegrationService();
export const mockNotificationService = new MockNotificationService();
export const mockDatabase = new MockDatabase();

// Reset all mocks
export function resetAllMocks(): void {
  mockAccountingService.clearHistory();
  mockReportingService.clearHistory();
  mockPOSIntegrationService.clearHistory();
  mockNotificationService.clearHistory();
  mockDatabase.clearHistory();
  mockDatabase.clearData();
  vi.clearAllMocks();
}