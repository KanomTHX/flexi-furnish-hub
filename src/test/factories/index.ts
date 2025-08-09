// Test data factories for consistent test data generation
import { faker } from '@faker-js/faker';

// Base factory interface
interface Factory<T> {
  build(overrides?: Partial<T>): T;
  buildList(count: number, overrides?: Partial<T>): T[];
}

// Generic factory implementation
class BaseFactory<T> implements Factory<T> {
  constructor(private generator: (overrides?: Partial<T>) => T) {}

  build(overrides?: Partial<T>): T {
    return this.generator(overrides);
  }

  buildList(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

// Warehouse factory
export const WarehouseFactory = new BaseFactory((overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name() + ' Warehouse',
  code: faker.string.alphanumeric(6).toUpperCase(),
  branch_id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['main', 'branch', 'showroom', 'damaged'] as const),
  address: faker.location.streetAddress(),
  manager_id: faker.string.uuid(),
  capacity: faker.number.int({ min: 100, max: 10000 }),
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides
}));

// Product factory
export const ProductFactory = new BaseFactory((overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  code: faker.string.alphanumeric(6).toUpperCase(),
  sku: faker.string.alphanumeric(10).toUpperCase(),
  brand: faker.company.name(),
  model: faker.commerce.productAdjective(),
  category: faker.commerce.department(),
  unit_cost: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
  selling_price: faker.number.float({ min: 200, max: 20000, fractionDigits: 2 }),
  description: faker.commerce.productDescription(),
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides
}));

// Serial Number factory
export const SerialNumberFactory = new BaseFactory((overrides = {}) => {
  const productCode = overrides.product_code || 'TP001';
  const year = new Date().getFullYear();
  const sequence = faker.number.int({ min: 1, max: 9999 });
  
  return {
    id: faker.string.uuid(),
    serial_number: `${productCode}-${year}-${String(sequence).padStart(4, '0')}`,
    product_id: faker.string.uuid(),
    warehouse_id: faker.string.uuid(),
    unit_cost: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    supplier_id: faker.string.uuid(),
    invoice_number: faker.string.alphanumeric(10).toUpperCase(),
    status: faker.helpers.arrayElement(['available', 'sold', 'reserved', 'transferred', 'claimed', 'damaged'] as const),
    sold_at: null,
    sold_to: null,
    reference_number: null,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides
  };
});

// Supplier factory
export const SupplierFactory = new BaseFactory((overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  code: faker.string.alphanumeric(6).toUpperCase(),
  contact_person: faker.person.fullName(),
  phone: faker.phone.number(),
  email: faker.internet.email(),
  address: faker.location.streetAddress(),
  tax_id: faker.string.numeric(13),
  payment_terms: faker.helpers.arrayElement(['NET30', 'NET60', 'COD']),
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides
}));

// Stock Movement factory
export const StockMovementFactory = new BaseFactory((overrides = {}) => ({
  id: faker.string.uuid(),
  product_id: faker.string.uuid(),
  serial_number_id: faker.string.uuid(),
  warehouse_id: faker.string.uuid(),
  movement_type: faker.helpers.arrayElement(['receive', 'withdraw', 'transfer_out', 'transfer_in', 'adjustment', 'claim'] as const),
  quantity: faker.number.int({ min: 1, max: 10 }),
  unit_cost: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
  reference_type: faker.helpers.arrayElement(['purchase', 'sale', 'transfer', 'adjustment', 'claim'] as const),
  reference_id: faker.string.uuid(),
  reference_number: faker.string.alphanumeric(10).toUpperCase(),
  notes: faker.lorem.sentence(),
  performed_by: faker.string.uuid(),
  created_at: faker.date.past().toISOString(),
  ...overrides
}));

// Transfer factory
export const TransferFactory = new BaseFactory((overrides = {}) => ({
  id: faker.string.uuid(),
  transfer_number: faker.string.alphanumeric(10).toUpperCase(),
  source_warehouse_id: faker.string.uuid(),
  target_warehouse_id: faker.string.uuid(),
  status: faker.helpers.arrayElement(['pending', 'in_transit', 'completed', 'cancelled'] as const),
  total_items: faker.number.int({ min: 1, max: 50 }),
  notes: faker.lorem.sentence(),
  initiated_by: faker.string.uuid(),
  confirmed_by: null,
  created_at: faker.date.past().toISOString(),
  confirmed_at: null,
  ...overrides
}));

// User factory
export const UserFactory = new BaseFactory((overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: faker.helpers.arrayElement(['admin', 'manager', 'staff'] as const),
  branch_id: faker.string.uuid(),
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides
}));

// Branch factory
export const BranchFactory = new BaseFactory((overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name() + ' Branch',
  code: faker.string.alphanumeric(6).toUpperCase(),
  address: faker.location.streetAddress(),
  phone: faker.phone.number(),
  manager_id: faker.string.uuid(),
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides
}));

// Scenario builders for complex test scenarios
export class TestScenarioBuilder {
  static createWarehouseWithStock(options: {
    warehouseCount?: number;
    productCount?: number;
    serialNumbersPerProduct?: number;
  } = {}) {
    const {
      warehouseCount = 2,
      productCount = 5,
      serialNumbersPerProduct = 10
    } = options;

    const warehouses = WarehouseFactory.buildList(warehouseCount);
    const products = ProductFactory.buildList(productCount);
    const serialNumbers = [];

    for (const warehouse of warehouses) {
      for (const product of products) {
        const sns = SerialNumberFactory.buildList(serialNumbersPerProduct, {
          product_id: product.id,
          warehouse_id: warehouse.id,
          product_code: product.code
        });
        serialNumbers.push(...sns);
      }
    }

    return {
      warehouses,
      products,
      serialNumbers,
      movements: serialNumbers.map(sn => 
        StockMovementFactory.build({
          product_id: sn.product_id,
          serial_number_id: sn.id,
          warehouse_id: sn.warehouse_id,
          movement_type: 'receive'
        })
      )
    };
  }

  static createTransferScenario(options: {
    sourceWarehouse?: any;
    targetWarehouse?: any;
    itemCount?: number;
  } = {}) {
    const sourceWarehouse = options.sourceWarehouse || WarehouseFactory.build();
    const targetWarehouse = options.targetWarehouse || WarehouseFactory.build();
    const itemCount = options.itemCount || 5;

    const products = ProductFactory.buildList(itemCount);
    const serialNumbers = products.map(product =>
      SerialNumberFactory.build({
        product_id: product.id,
        warehouse_id: sourceWarehouse.id,
        product_code: product.code,
        status: 'available'
      })
    );

    const transfer = TransferFactory.build({
      source_warehouse_id: sourceWarehouse.id,
      target_warehouse_id: targetWarehouse.id,
      total_items: itemCount
    });

    return {
      sourceWarehouse,
      targetWarehouse,
      products,
      serialNumbers,
      transfer
    };
  }

  static createReceiveGoodsScenario(options: {
    warehouse?: any;
    supplier?: any;
    productCount?: number;
    quantityPerProduct?: number;
  } = {}) {
    const warehouse = options.warehouse || WarehouseFactory.build();
    const supplier = options.supplier || SupplierFactory.build();
    const productCount = options.productCount || 3;
    const quantityPerProduct = options.quantityPerProduct || 5;

    const products = ProductFactory.buildList(productCount);
    const receiveItems = products.map(product => ({
      product_id: product.id,
      quantity: quantityPerProduct,
      unit_cost: product.unit_cost
    }));

    const serialNumbers = [];
    for (const product of products) {
      const sns = SerialNumberFactory.buildList(quantityPerProduct, {
        product_id: product.id,
        warehouse_id: warehouse.id,
        supplier_id: supplier.id,
        product_code: product.code,
        status: 'available'
      });
      serialNumbers.push(...sns);
    }

    return {
      warehouse,
      supplier,
      products,
      receiveItems,
      serialNumbers,
      totalItems: productCount * quantityPerProduct,
      totalCost: receiveItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
    };
  }
}

// Seed data for consistent testing
export const SeedData = {
  warehouses: WarehouseFactory.buildList(5, { is_active: true }),
  products: ProductFactory.buildList(20, { is_active: true }),
  suppliers: SupplierFactory.buildList(10, { is_active: true }),
  users: UserFactory.buildList(15, { is_active: true }),
  branches: BranchFactory.buildList(3, { is_active: true })
};

// Reset faker seed for consistent test runs
export const resetSeed = (seed = 12345) => {
  faker.seed(seed);
};

export default {
  WarehouseFactory,
  ProductFactory,
  SerialNumberFactory,
  SupplierFactory,
  StockMovementFactory,
  TransferFactory,
  UserFactory,
  BranchFactory,
  TestScenarioBuilder,
  SeedData,
  resetSeed
};