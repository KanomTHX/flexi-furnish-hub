/**
 * Test Data Factories
 * Provides factory functions to create test data for all entities
 */

import { 
  Supplier, 
  SupplierInvoice, 
  SupplierPayment,
  JournalEntry,
  JournalEntryLine,
  Account,
  ReconciliationReport,
  Report,
  SupplierPerformanceMetrics,
  StockAlert,
  AutoPurchaseOrder,
  ScheduledNotification,
  NotificationTemplate
} from '@/types/advanced';

let idCounter = 1;

const generateId = () => `test-id-${idCounter++}`;
const generateUUID = () => `${generateId()}-uuid`;

export class TestDataFactory {
  static reset() {
    idCounter = 1;
  }

  static createTestSupplier(overrides: Partial<Supplier> = {}): Supplier {
    const id = generateUUID();
    return {
      id,
      name: `Test Supplier ${idCounter}`,
      email: `supplier${idCounter}@test.com`,
      phone: `+1-555-${String(idCounter).padStart(4, '0')}`,
      address: `${idCounter} Test Street`,
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
      taxId: `TAX${String(idCounter).padStart(6, '0')}`,
      paymentTerms: 'Net 30',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createTestInvoice(supplierId?: string, overrides: Partial<SupplierInvoice> = {}): SupplierInvoice {
    const id = generateUUID();
    return {
      id,
      invoiceNumber: `INV-${String(idCounter).padStart(6, '0')}`,
      supplierId: supplierId || generateUUID(),
      amount: 1000.00,
      taxAmount: 100.00,
      totalAmount: 1100.00,
      currency: 'USD',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: `Test invoice ${idCounter}`,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createTestPayment(invoiceId?: string, overrides: Partial<SupplierPayment> = {}): SupplierPayment {
    const id = generateUUID();
    return {
      id,
      invoiceId: invoiceId || generateUUID(),
      amount: 1100.00,
      paymentDate: new Date(),
      paymentMethod: 'bank_transfer',
      reference: `PAY-${String(idCounter).padStart(6, '0')}`,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createTestJournalEntry(transactionId?: string, overrides: Partial<JournalEntry> = {}): JournalEntry {
    const id = generateUUID();
    return {
      id,
      entryNumber: `JE-${String(idCounter).padStart(6, '0')}`,
      transactionDate: new Date(),
      description: `Test journal entry ${idCounter}`,
      reference: transactionId || generateUUID(),
      totalDebit: 1100.00,
      totalCredit: 1100.00,
      entries: [
        this.createTestJournalEntryLine({ debitAmount: 1100.00, creditAmount: 0 }),
        this.createTestJournalEntryLine({ debitAmount: 0, creditAmount: 1100.00 })
      ],
      status: 'draft',
      createdBy: generateUUID(),
      createdAt: new Date(),
      ...overrides
    };
  }

  static createTestJournalEntryLine(overrides: Partial<JournalEntryLine> = {}): JournalEntryLine {
    return {
      accountCode: `ACC-${String(idCounter).padStart(4, '0')}`,
      accountName: `Test Account ${idCounter}`,
      debitAmount: 0,
      creditAmount: 0,
      description: `Test entry line ${idCounter}`,
      reference: `REF-${idCounter}`,
      ...overrides
    };
  }

  static createTestAccount(overrides: Partial<Account> = {}): Account {
    const id = generateUUID();
    return {
      id,
      accountCode: `ACC-${String(idCounter).padStart(4, '0')}`,
      accountName: `Test Account ${idCounter}`,
      accountType: 'asset',
      parentAccountId: null,
      isActive: true,
      createdAt: new Date(),
      ...overrides
    };
  }

  static createTestReconciliationReport(overrides: Partial<ReconciliationReport> = {}): ReconciliationReport {
    const id = generateUUID();
    return {
      id,
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      supplierBalanceTotal: 10000.00,
      accountingBalanceTotal: 9950.00,
      discrepancyAmount: 50.00,
      discrepancies: [],
      status: 'completed',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createTestReport(overrides: Partial<Report> = {}): Report {
    const id = generateUUID();
    return {
      id,
      name: `Test Report ${idCounter}`,
      type: 'supplier_performance',
      parameters: {},
      data: [],
      metadata: {
        totalRecords: 0,
        generationTime: 100,
        filters: {}
      },
      generatedAt: new Date(),
      generatedBy: generateUUID(),
      ...overrides
    };
  }

  static createTestSupplierPerformanceMetrics(supplierId?: string, overrides: Partial<SupplierPerformanceMetrics> = {}): SupplierPerformanceMetrics {
    return {
      supplierId: supplierId || generateUUID(),
      supplierName: `Test Supplier ${idCounter}`,
      totalSpend: 50000.00,
      averagePaymentDays: 28.5,
      onTimeDeliveryRate: 95.5,
      qualityScore: 4.2,
      reliabilityScore: 4.5,
      costEfficiencyRating: 4.0,
      ...overrides
    };
  }

  static createTestStockAlert(overrides: Partial<StockAlert> = {}): StockAlert {
    const id = generateUUID();
    return {
      id,
      productId: generateUUID(),
      productName: `Test Product ${idCounter}`,
      currentStock: 5,
      reorderPoint: 10,
      reorderQuantity: 50,
      preferredSupplierId: generateUUID(),
      urgencyLevel: 'medium',
      generatedAt: new Date(),
      ...overrides
    };
  }

  static createTestAutoPurchaseOrder(stockAlertId?: string, overrides: Partial<AutoPurchaseOrder> = {}): AutoPurchaseOrder {
    const id = generateUUID();
    return {
      id,
      orderNumber: `APO-${String(idCounter).padStart(6, '0')}`,
      supplierId: generateUUID(),
      items: [],
      totalAmount: 2500.00,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'draft',
      automationReason: 'Low stock alert triggered',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createTestScheduledNotification(overrides: Partial<ScheduledNotification> = {}): ScheduledNotification {
    const id = generateUUID();
    return {
      id,
      type: 'payment_reminder',
      recipientEmail: `recipient${idCounter}@test.com`,
      subject: `Test Notification ${idCounter}`,
      content: `This is a test notification content ${idCounter}`,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'scheduled',
      templateId: generateUUID(),
      relatedEntityId: generateUUID(),
      relatedEntityType: 'invoice',
      ...overrides
    };
  }

  static createTestNotificationTemplate(overrides: Partial<NotificationTemplate> = {}): NotificationTemplate {
    const id = generateUUID();
    return {
      id,
      name: `Test Template ${idCounter}`,
      type: 'payment_reminder',
      subject: 'Payment Reminder: Invoice {{invoiceNumber}}',
      htmlContent: '<p>Dear {{supplierName}}, your payment is due.</p>',
      textContent: 'Dear {{supplierName}}, your payment is due.',
      variables: [
        { name: 'supplierName', type: 'string', required: true },
        { name: 'invoiceNumber', type: 'string', required: true }
      ],
      isActive: true,
      ...overrides
    };
  }

  static createBulkTestData(count: number = 10) {
    const suppliers = Array.from({ length: count }, () => this.createTestSupplier());
    const invoices = suppliers.flatMap(supplier => 
      Array.from({ length: 2 }, () => this.createTestInvoice(supplier.id))
    );
    const payments = invoices.map(invoice => this.createTestPayment(invoice.id));
    
    return {
      suppliers,
      invoices,
      payments,
      journalEntries: invoices.map(invoice => this.createTestJournalEntry(invoice.id)),
      accounts: Array.from({ length: 5 }, () => this.createTestAccount()),
      stockAlerts: Array.from({ length: count }, () => this.createTestStockAlert()),
      notifications: Array.from({ length: count }, () => this.createTestScheduledNotification())
    };
  }

  static cleanupTestData(): Promise<void> {
    // Reset counter and clear any persistent test data
    this.reset();
    return Promise.resolve();
  }
}