#!/usr/bin/env tsx

/**
 * Test Data Seeder
 * Seeds test database with comprehensive test data
 */

import { TestDataFactory } from '../factories';
import { mockDatabase } from '../mocks';

interface SeedOptions {
  suppliers?: number;
  invoicesPerSupplier?: number;
  paymentsPerInvoice?: number;
  accounts?: number;
  stockAlerts?: number;
  notifications?: number;
  journalEntries?: number;
  reports?: number;
}

class TestDataSeeder {
  private defaultOptions: SeedOptions = {
    suppliers: 20,
    invoicesPerSupplier: 5,
    paymentsPerInvoice: 1,
    accounts: 15,
    stockAlerts: 30,
    notifications: 50,
    journalEntries: 100,
    reports: 10
  };

  async seedTestData(options: SeedOptions = {}): Promise<void> {
    const config = { ...this.defaultOptions, ...options };
    
    console.log('🌱 Seeding test database...');
    console.log(`Configuration:`, config);

    // Clear existing data
    mockDatabase.clearData();
    TestDataFactory.reset();

    try {
      // Seed suppliers
      const suppliers = await this.seedSuppliers(config.suppliers!);
      console.log(`✅ Created ${suppliers.length} suppliers`);

      // Seed invoices
      const invoices = await this.seedInvoices(suppliers, config.invoicesPerSupplier!);
      console.log(`✅ Created ${invoices.length} invoices`);

      // Seed payments
      const payments = await this.seedPayments(invoices, config.paymentsPerInvoice!);
      console.log(`✅ Created ${payments.length} payments`);

      // Seed chart of accounts
      const accounts = await this.seedAccounts(config.accounts!);
      console.log(`✅ Created ${accounts.length} accounts`);

      // Seed journal entries
      const journalEntries = await this.seedJournalEntries(invoices, config.journalEntries!);
      console.log(`✅ Created ${journalEntries.length} journal entries`);

      // Seed stock alerts
      const stockAlerts = await this.seedStockAlerts(config.stockAlerts!);
      console.log(`✅ Created ${stockAlerts.length} stock alerts`);

      // Seed notifications
      const notifications = await this.seedNotifications(config.notifications!);
      console.log(`✅ Created ${notifications.length} notifications`);

      // Seed reports
      const reports = await this.seedReports(config.reports!);
      console.log(`✅ Created ${reports.length} reports`);

      console.log('\n🎉 Test data seeding completed successfully!');
      this.printSummary();

    } catch (error) {
      console.error('❌ Error seeding test data:', error);
      throw error;
    }
  }

  private async seedSuppliers(count: number): Promise<any[]> {
    const suppliers = [];
    
    for (let i = 0; i < count; i++) {
      const supplier = TestDataFactory.createTestSupplier({
        name: `Supplier ${i + 1}`,
        email: `supplier${i + 1}@example.com`,
        isActive: Math.random() > 0.1, // 90% active
        paymentTerms: this.randomPaymentTerms()
      });
      
      const saved = await mockDatabase.insert('suppliers', supplier);
      suppliers.push(saved);
    }
    
    return suppliers;
  }

  private async seedInvoices(suppliers: any[], invoicesPerSupplier: number): Promise<any[]> {
    const invoices = [];
    
    for (const supplier of suppliers) {
      for (let i = 0; i < invoicesPerSupplier; i++) {
        const invoice = TestDataFactory.createTestInvoice(supplier.id, {
          amount: this.randomAmount(100, 10000),
          status: this.randomInvoiceStatus(),
          paymentStatus: this.randomPaymentStatus(),
          dueDate: this.randomFutureDate(30),
          invoiceDate: this.randomPastDate(60)
        });
        
        const saved = await mockDatabase.insert('supplier_invoices', invoice);
        invoices.push(saved);
      }
    }
    
    return invoices;
  }

  private async seedPayments(invoices: any[], paymentsPerInvoice: number): Promise<any[]> {
    const payments = [];
    
    for (const invoice of invoices) {
      if (invoice.paymentStatus === 'paid' || Math.random() > 0.3) {
        for (let i = 0; i < paymentsPerInvoice; i++) {
          const payment = TestDataFactory.createTestPayment(invoice.id, {
            amount: invoice.totalAmount / paymentsPerInvoice,
            paymentMethod: this.randomPaymentMethod(),
            paymentDate: this.randomDateBetween(invoice.invoiceDate, new Date())
          });
          
          const saved = await mockDatabase.insert('supplier_payments', payment);
          payments.push(saved);
        }
      }
    }
    
    return payments;
  }

  private async seedAccounts(count: number): Promise<any[]> {
    const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    const accounts = [];
    
    for (let i = 0; i < count; i++) {
      const account = TestDataFactory.createTestAccount({
        accountCode: `${1000 + i}`,
        accountName: `Account ${i + 1}`,
        accountType: accountTypes[i % accountTypes.length],
        isActive: Math.random() > 0.05 // 95% active
      });
      
      const saved = await mockDatabase.insert('accounts', account);
      accounts.push(saved);
    }
    
    return accounts;
  }

  private async seedJournalEntries(invoices: any[], maxEntries: number): Promise<any[]> {
    const journalEntries = [];
    const selectedInvoices = invoices.slice(0, Math.min(invoices.length, maxEntries));
    
    for (const invoice of selectedInvoices) {
      const journalEntry = TestDataFactory.createTestJournalEntry(invoice.id, {
        totalDebit: invoice.totalAmount,
        totalCredit: invoice.totalAmount,
        description: `Journal entry for invoice ${invoice.invoiceNumber}`,
        status: Math.random() > 0.2 ? 'posted' : 'draft'
      });
      
      const saved = await mockDatabase.insert('journal_entries', journalEntry);
      journalEntries.push(saved);
    }
    
    return journalEntries;
  }

  private async seedStockAlerts(count: number): Promise<any[]> {
    const urgencyLevels = ['low', 'medium', 'high', 'critical'];
    const stockAlerts = [];
    
    for (let i = 0; i < count; i++) {
      const stockAlert = TestDataFactory.createTestStockAlert({
        productName: `Product ${i + 1}`,
        currentStock: Math.floor(Math.random() * 20),
        reorderPoint: 10 + Math.floor(Math.random() * 20),
        reorderQuantity: 50 + Math.floor(Math.random() * 100),
        urgencyLevel: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)]
      });
      
      const saved = await mockDatabase.insert('stock_alerts', stockAlert);
      stockAlerts.push(saved);
    }
    
    return stockAlerts;
  }

  private async seedNotifications(count: number): Promise<any[]> {
    const notificationTypes = ['payment_reminder', 'overdue_notice', 'monthly_statement', 'system_alert'];
    const statuses = ['scheduled', 'sent', 'failed'];
    const notifications = [];
    
    for (let i = 0; i < count; i++) {
      const notification = TestDataFactory.createTestScheduledNotification({
        type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
        recipientEmail: `recipient${i + 1}@example.com`,
        subject: `Notification ${i + 1}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        scheduledFor: this.randomFutureDate(30)
      });
      
      const saved = await mockDatabase.insert('notifications', notification);
      notifications.push(saved);
    }
    
    return notifications;
  }

  private async seedReports(count: number): Promise<any[]> {
    const reportTypes = ['supplier_performance', 'spending_analysis', 'aging', 'cash_flow'];
    const reports = [];
    
    for (let i = 0; i < count; i++) {
      const report = TestDataFactory.createTestReport({
        name: `Report ${i + 1}`,
        type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
        data: this.generateMockReportData(),
        generatedAt: this.randomPastDate(30)
      });
      
      const saved = await mockDatabase.insert('reports', report);
      reports.push(saved);
    }
    
    return reports;
  }

  private randomPaymentTerms(): string {
    const terms = ['Net 15', 'Net 30', 'Net 45', 'Net 60', '2/10 Net 30', 'Due on Receipt'];
    return terms[Math.floor(Math.random() * terms.length)];
  }

  private randomInvoiceStatus(): string {
    const statuses = ['draft', 'sent', 'approved', 'rejected'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private randomPaymentStatus(): string {
    const statuses = ['unpaid', 'partial', 'paid', 'overdue'];
    const weights = [0.3, 0.1, 0.5, 0.1]; // Weighted distribution
    return this.weightedRandom(statuses, weights);
  }

  private randomPaymentMethod(): string {
    const methods = ['bank_transfer', 'check', 'credit_card', 'ach', 'wire'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  private randomAmount(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  private randomPastDate(maxDaysAgo: number): Date {
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  }

  private randomFutureDate(maxDaysAhead: number): Date {
    const daysAhead = Math.floor(Math.random() * maxDaysAhead);
    return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  }

  private randomDateBetween(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  private generateMockReportData(): any[] {
    const dataCount = 5 + Math.floor(Math.random() * 20);
    const data = [];
    
    for (let i = 0; i < dataCount; i++) {
      data.push({
        id: i + 1,
        name: `Data Point ${i + 1}`,
        value: this.randomAmount(100, 10000),
        percentage: Math.round(Math.random() * 100 * 100) / 100,
        date: this.randomPastDate(365)
      });
    }
    
    return data;
  }

  private printSummary(): void {
    const tables = ['suppliers', 'supplier_invoices', 'supplier_payments', 'accounts', 
                   'journal_entries', 'stock_alerts', 'notifications', 'reports'];
    
    console.log('\n📊 Seeded Data Summary:');
    console.log('========================');
    
    for (const table of tables) {
      const count = mockDatabase.select(table, {}).then(records => records.length);
      console.log(`${table}: ${count} records`);
    }
  }

  async clearAllData(): Promise<void> {
    console.log('🧹 Clearing all test data...');
    mockDatabase.clearData();
    TestDataFactory.reset();
    console.log('✅ All test data cleared');
  }

  async seedMinimalData(): Promise<void> {
    await this.seedTestData({
      suppliers: 5,
      invoicesPerSupplier: 2,
      paymentsPerInvoice: 1,
      accounts: 5,
      stockAlerts: 10,
      notifications: 10,
      journalEntries: 10,
      reports: 3
    });
  }

  async seedLargeDataset(): Promise<void> {
    await this.seedTestData({
      suppliers: 100,
      invoicesPerSupplier: 10,
      paymentsPerInvoice: 2,
      accounts: 50,
      stockAlerts: 200,
      notifications: 500,
      journalEntries: 1000,
      reports: 50
    });
  }
}

// CLI interface
if (require.main === module) {
  const seeder = new TestDataSeeder();
  const command = process.argv[2];

  switch (command) {
    case 'clear':
      seeder.clearAllData();
      break;
    case 'minimal':
      seeder.seedMinimalData();
      break;
    case 'large':
      seeder.seedLargeDataset();
      break;
    case 'custom':
      const options = JSON.parse(process.argv[3] || '{}');
      seeder.seedTestData(options);
      break;
    default:
      seeder.seedTestData();
  }
}

export { TestDataSeeder };