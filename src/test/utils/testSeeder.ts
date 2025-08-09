// Test database seeder for consistent test data
import { supabase } from '@/integrations/supabase/client';
import { SeedData, resetSeed } from '../factories';

export class TestSeeder {
  private static instance: TestSeeder;
  private seeded = false;

  static getInstance(): TestSeeder {
    if (!TestSeeder.instance) {
      TestSeeder.instance = new TestSeeder();
    }
    return TestSeeder.instance;
  }

  async seedDatabase(): Promise<void> {
    if (this.seeded) {
      return;
    }

    console.log('🌱 Seeding test database...');
    
    try {
      // Reset faker seed for consistent data
      resetSeed(12345);

      // Seed branches first (referenced by other tables)
      await this.seedBranches();
      
      // Seed users
      await this.seedUsers();
      
      // Seed warehouses
      await this.seedWarehouses();
      
      // Seed suppliers
      await this.seedSuppliers();
      
      // Seed products
      await this.seedProducts();
      
      // Seed serial numbers
      await this.seedSerialNumbers();
      
      this.seeded = true;
      console.log('✅ Test database seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed test database:', error);
      throw error;
    }
  }

  async cleanDatabase(): Promise<void> {
    console.log('🧹 Cleaning test database...');
    
    try {
      // Clean in reverse order to respect foreign key constraints
      await supabase.from('stock_movements').delete().neq('id', '');
      await supabase.from('stock_transfer_items').delete().neq('id', '');
      await supabase.from('stock_transfers').delete().neq('id', '');
      await supabase.from('product_serial_numbers').delete().neq('id', '');
      await supabase.from('products').delete().neq('id', '');
      await supabase.from('suppliers').delete().neq('id', '');
      await supabase.from('warehouses').delete().neq('id', '');
      await supabase.from('users').delete().neq('id', '');
      await supabase.from('branches').delete().neq('id', '');
      
      this.seeded = false;
      console.log('✅ Test database cleaned successfully');
    } catch (error) {
      console.error('❌ Failed to clean test database:', error);
      throw error;
    }
  }

  private async seedBranches(): Promise<void> {
    const { error } = await supabase
      .from('branches')
      .upsert(SeedData.branches, { onConflict: 'id' });
    
    if (error) throw error;
  }

  private async seedUsers(): Promise<void> {
    const users = SeedData.users.map(user => ({
      ...user,
      branch_id: SeedData.branches[0].id // Assign to first branch
    }));

    const { error } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'id' });
    
    if (error) throw error;
  }

  private async seedWarehouses(): Promise<void> {
    const warehouses = SeedData.warehouses.map((warehouse, index) => ({
      ...warehouse,
      branch_id: SeedData.branches[index % SeedData.branches.length].id,
      manager_id: SeedData.users[index % SeedData.users.length].id
    }));

    const { error } = await supabase
      .from('warehouses')
      .upsert(warehouses, { onConflict: 'id' });
    
    if (error) throw error;
  }

  private async seedSuppliers(): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .upsert(SeedData.suppliers, { onConflict: 'id' });
    
    if (error) throw error;
  }

  private async seedProducts(): Promise<void> {
    const { error } = await supabase
      .from('products')
      .upsert(SeedData.products, { onConflict: 'id' });
    
    if (error) throw error;
  }

  private async seedSerialNumbers(): Promise<void> {
    // Create serial numbers for each product in each warehouse
    const serialNumbers = [];
    
    for (const warehouse of SeedData.warehouses) {
      for (const product of SeedData.products.slice(0, 10)) { // Limit to first 10 products
        for (let i = 0; i < 5; i++) { // 5 serial numbers per product per warehouse
          serialNumbers.push({
            id: `sn-${warehouse.id}-${product.id}-${i}`,
            serial_number: `${product.code}-2024-${String(i + 1).padStart(3, '0')}`,
            product_id: product.id,
            warehouse_id: warehouse.id,
            unit_cost: product.unit_cost,
            supplier_id: SeedData.suppliers[0].id,
            status: 'available',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    // Insert in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < serialNumbers.length; i += batchSize) {
      const batch = serialNumbers.slice(i, i + batchSize);
      const { error } = await supabase
        .from('product_serial_numbers')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) throw error;
    }
  }

  // Helper methods for specific test scenarios
  async createTestWarehouse(overrides = {}): Promise<any> {
    const warehouse = {
      id: `test-warehouse-${Date.now()}`,
      name: 'Test Warehouse',
      code: 'TW001',
      branch_id: SeedData.branches[0].id,
      type: 'main',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };

    const { data, error } = await supabase
      .from('warehouses')
      .insert(warehouse)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createTestProduct(overrides = {}): Promise<any> {
    const product = {
      id: `test-product-${Date.now()}`,
      name: 'Test Product',
      code: 'TP001',
      sku: 'TP001-TEST',
      brand: 'Test Brand',
      unit_cost: 1000,
      selling_price: 2000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createTestSerialNumbers(productId: string, warehouseId: string, count = 5): Promise<any[]> {
    const serialNumbers = Array.from({ length: count }, (_, i) => ({
      id: `test-sn-${productId}-${i}`,
      serial_number: `TEST-2024-${String(i + 1).padStart(3, '0')}`,
      product_id: productId,
      warehouse_id: warehouseId,
      unit_cost: 1000,
      supplier_id: SeedData.suppliers[0].id,
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('product_serial_numbers')
      .insert(serialNumbers)
      .select();

    if (error) throw error;
    return data;
  }

  // Get seeded data for tests
  getSeedData() {
    return {
      branches: SeedData.branches,
      users: SeedData.users,
      warehouses: SeedData.warehouses,
      suppliers: SeedData.suppliers,
      products: SeedData.products
    };
  }

  // Check if database is seeded
  isSeeded(): boolean {
    return this.seeded;
  }
}

// Singleton instance
export const testSeeder = TestSeeder.getInstance();

// Helper functions for test setup
export const setupTestDatabase = async (): Promise<void> => {
  await testSeeder.seedDatabase();
};

export const cleanupTestDatabase = async (): Promise<void> => {
  await testSeeder.cleanDatabase();
};

export const resetTestDatabase = async (): Promise<void> => {
  await testSeeder.cleanDatabase();
  await testSeeder.seedDatabase();
};