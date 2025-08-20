#!/usr/bin/env node

/**
 * Seed Warehouse Data Script
 * This script creates real data in the database for testing
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://hartshwcchbsnmbrjdyn.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzc1NzQsImV4cCI6MjA2OTYxMzU3NH0.A1hn4-J2z9h4iuBXQ7xhh2F5UWXHmTPP92tncJfsF24";

// Create Supabase client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`${colors.green}[${timestamp}] ${message}${colors.reset}`);
}

function warn(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`${colors.yellow}[${timestamp}] WARNING: ${message}${colors.reset}`);
}

function error(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.error(`${colors.red}[${timestamp}] ERROR: ${message}${colors.reset}`);
}

function info(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`${colors.blue}[${timestamp}] ${message}${colors.reset}`);
}

// Sample data
const sampleProducts = [
  {
    name: 'โซฟา 3 ที่นั่ง สีน้ำตาล',
    product_code: 'SOFA-001',
    sku: 'SF001',
    category: 'เฟอร์นิเจอร์',
    brand: 'HomePro',
    model: 'Classic-3S',
    description: 'โซฟาหนังแท้ 3 ที่นั่ง สีน้ำตาล สไตล์คลาสสิก',
    unit_cost: 12000,
    selling_price: 18000,
    barcode: '1234567890123',
    is_active: true
  },
  {
    name: 'โต๊ะทำงาน ไม้โอ๊ค',
    product_code: 'TABLE-002',
    sku: 'TB002',
    category: 'เฟอร์นิเจอร์',
    brand: 'IKEA',
    model: 'WorkDesk-Pro',
    description: 'โต๊ะทำงานไม้โอ๊คแท้ พร้อมลิ้นชัก',
    unit_cost: 8500,
    selling_price: 12500,
    barcode: '1234567890124',
    is_active: true
  },
  {
    name: 'เก้าอี้สำนักงาน หนังแท้',
    product_code: 'CHAIR-003',
    sku: 'CH003',
    category: 'เฟอร์นิเจอร์',
    brand: 'Herman Miller',
    model: 'Aeron-Chair',
    description: 'เก้าอี้สำนักงานหนังแท้ ปรับระดับได้',
    unit_cost: 25000,
    selling_price: 35000,
    barcode: '1234567890125',
    is_active: true
  },
  {
    name: 'เตียงนอน King Size',
    product_code: 'BED-004',
    sku: 'BD004',
    category: 'เฟอร์นิเจอร์',
    brand: 'Serta',
    model: 'Perfect-Sleep',
    description: 'เตียงนอน King Size พร้อมที่นอนสปริง',
    unit_cost: 18000,
    selling_price: 25000,
    barcode: '1234567890126',
    is_active: true
  },
  {
    name: 'ตู้เสื้อผ้า 4 บาน',
    product_code: 'WARDROBE-005',
    sku: 'WD005',
    category: 'เฟอร์นิเจอร์',
    brand: 'Index Living',
    model: 'Modern-4D',
    description: 'ตู้เสื้อผ้า 4 บาน สไตล์โมเดิร์น',
    unit_cost: 15000,
    selling_price: 22000,
    barcode: '1234567890127',
    is_active: true
  }
];

const sampleWarehouses = [
  {
    name: 'คลังสินค้าหลัก',
    code: 'WH-001',
    location: 'กรุงเทพมหานคร',
    capacity: 1000,
    status: 'active',
    type: 'main',
    description: 'คลังสินค้าหลักสำหรับเก็บสินค้าทั้งหมด'
  },
  {
    name: 'คลังสินค้าสาขา A',
    code: 'WH-002',
    location: 'นนทบุรี',
    capacity: 500,
    status: 'active',
    type: 'branch',
    description: 'คลังสินค้าสาขา A สำหรับพื้นที่ภาคกลาง'
  },
  {
    name: 'คลังสินค้าสาขา B',
    code: 'WH-003',
    location: 'ปทุมธานี',
    capacity: 750,
    status: 'active',
    type: 'branch',
    description: 'คลังสินค้าสาขา B สำหรับพื้นที่ภาคกลาง'
  }
];

async function checkConnection() {
  try {
    const { data, error } = await supabase.from('employee_profiles').select('count').limit(1);
    if (error) {
      throw error;
    }
    log('Database connection successful');
    return true;
  } catch (err) {
    error(`Database connection failed: ${err.message}`);
    return false;
  }
}

async function createProducts() {
  log('Creating products...');
  
  try {
    // Check if products table exists and get its structure
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (checkError) {
      warn(`Products table check failed: ${checkError.message}`);
      log('Attempting to create products with available fields...');
    }

    // Simplify products data to match existing schema
    const simplifiedProducts = sampleProducts.map(product => ({
      name: product.name,
      description: product.description,
      price: product.selling_price,
      category: product.category,
      brand: product.brand,
      model: product.model,
      is_active: product.is_active
    }));

    // Insert products
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert(simplifiedProducts)
      .select();

    if (insertError) {
      error(`Failed to create products: ${insertError.message}`);
      return false;
    }

    log(`Created ${insertData.length} products`);
    return insertData;
  } catch (err) {
    error(`Error creating products: ${err.message}`);
    return false;
  }
}

async function createWarehouses() {
  log('Creating warehouses...');
  
  try {
    // Check if warehouses table exists
    const { data: existingWarehouses, error: checkError } = await supabase
      .from('warehouses')
      .select('*')
      .limit(1);
    
    if (checkError) {
      warn(`Warehouses table check failed: ${checkError.message}`);
      log('Attempting to create warehouses with available fields...');
    }

    // Simplify warehouses data to match existing schema
    const simplifiedWarehouses = sampleWarehouses.map(warehouse => ({
      name: warehouse.name,
      location: warehouse.location,
      description: warehouse.description,
      is_active: warehouse.status === 'active'
    }));

    // Insert warehouses
    const { data: insertData, error: insertError } = await supabase
      .from('warehouses')
      .insert(simplifiedWarehouses)
      .select();

    if (insertError) {
      error(`Failed to create warehouses: ${insertError.message}`);
      return false;
    }

    log(`Created ${insertData.length} warehouses`);
    return insertData;
  } catch (err) {
    error(`Error creating warehouses: ${err.message}`);
    return false;
  }
}

async function createSerialNumbers(products, warehouses) {
  log('Creating serial numbers...');
  
  try {
    const serialNumbers = [];
    
    // Create serial numbers for each product in each warehouse
    for (const product of products) {
      for (const warehouse of warehouses) {
        const quantity = Math.floor(Math.random() * 20) + 5; // 5-25 items per warehouse
        
        for (let i = 1; i <= quantity; i++) {
          const serialNumber = `${product.code}-${warehouse.code}-${String(i).padStart(3, '0')}`;
          
          serialNumbers.push({
            product_id: product.id,
            warehouse_id: warehouse.id,
            serial_number: serialNumber,
            status: Math.random() > 0.8 ? 'sold' : 'available', // 20% sold, 80% available
            purchase_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
            unit_cost: product.unit_cost,
            notes: `Serial number for ${product.name} in ${warehouse.name}`
          });
        }
      }
    }

    // Insert serial numbers in batches
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < serialNumbers.length; i += batchSize) {
      const batch = serialNumbers.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('serial_numbers')
        .insert(batch)
        .select();

      if (error) {
        error(`Failed to create serial numbers batch: ${error.message}`);
        continue;
      }

      insertedCount += data.length;
      info(`Inserted ${data.length} serial numbers (batch ${Math.floor(i/batchSize) + 1})`);
    }

    log(`Created ${insertedCount} serial numbers total`);
    return insertedCount;
  } catch (err) {
    error(`Error creating serial numbers: ${err.message}`);
    return 0;
  }
}

async function createStockMovements(products, warehouses) {
  log('Creating stock movements...');
  
  try {
    const movements = [];
    
    // Create some sample stock movements
    for (const product of products) {
      for (const warehouse of warehouses) {
        // Receive movement
        movements.push({
          product_id: product.id,
          warehouse_id: warehouse.id,
          movement_type: 'receive',
          quantity: Math.floor(Math.random() * 20) + 10,
          unit_cost: product.unit_cost,
          reference_type: 'purchase',
          reference_id: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          notes: `Initial stock receive for ${product.name}`,
          created_by: 'system',
          movement_date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        });

        // Some withdraw movements
        if (Math.random() > 0.5) {
          movements.push({
            product_id: product.id,
            warehouse_id: warehouse.id,
            movement_type: 'withdraw',
            quantity: Math.floor(Math.random() * 5) + 1,
            unit_cost: product.unit_cost,
            reference_type: 'sale',
            reference_id: `SO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            notes: `Sale withdrawal for ${product.name}`,
            created_by: 'system',
            movement_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          });
        }
      }
    }

    // Insert movements
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movements)
      .select();

    if (error) {
      error(`Failed to create stock movements: ${error.message}`);
      return false;
    }

    log(`Created ${data.length} stock movements`);
    return data;
  } catch (err) {
    error(`Error creating stock movements: ${err.message}`);
    return false;
  }
}

async function generateSummaryReport() {
  log('Generating summary report...');
  
  try {
    // Get counts
    const { data: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact' });
    
    const { data: warehousesCount } = await supabase
      .from('warehouses')
      .select('id', { count: 'exact' });
    
    const { data: serialNumbersCount } = await supabase
      .from('serial_numbers')
      .select('id', { count: 'exact' });
    
    const { data: movementsCount } = await supabase
      .from('stock_movements')
      .select('id', { count: 'exact' });

    const report = `
# Warehouse Data Seeding Report

**Date:** ${new Date().toISOString()}

## Summary
- **Products:** ${productsCount?.length || 0} items
- **Warehouses:** ${warehousesCount?.length || 0} locations
- **Serial Numbers:** ${serialNumbersCount?.length || 0} items
- **Stock Movements:** ${movementsCount?.length || 0} transactions

## Products Created
${sampleProducts.map(p => `- ${p.name} (${p.code})`).join('\n')}

## Warehouses Created
${sampleWarehouses.map(w => `- ${w.name} (${w.code}) - ${w.location}`).join('\n')}

## Next Steps
1. Go to /warehouses page
2. Click on "ตรวจสอบสต็อก" tab
3. Test the stock inquiry functionality
4. Verify data is displaying correctly

---
*Generated by warehouse data seeding script*
`;

    fs.writeFileSync('warehouse-seed-report.md', report);
    log('Summary report generated: warehouse-seed-report.md');
    
    return report;
  } catch (err) {
    error(`Error generating report: ${err.message}`);
    return null;
  }
}

async function main() {
  log('🌱 Starting warehouse data seeding...');
  
  // Check connection
  const connected = await checkConnection();
  if (!connected) {
    error('Cannot proceed without database connection');
    process.exit(1);
  }

  // Create data
  const products = await createProducts();
  if (!products) {
    error('Failed to create products');
    process.exit(1);
  }

  const warehouses = await createWarehouses();
  if (!warehouses) {
    error('Failed to create warehouses');
    process.exit(1);
  }

  const serialNumbersCount = await createSerialNumbers(products, warehouses);
  if (serialNumbersCount === 0) {
    warn('No serial numbers were created');
  }

  const movements = await createStockMovements(products, warehouses);
  if (!movements) {
    warn('No stock movements were created');
  }

  // Generate report
  await generateSummaryReport();

  log('🎉 Warehouse data seeding completed successfully!');
  log('');
  log('Next steps:');
  log('1. Run: npm run build');
  log('2. Run: npm run preview');
  log('3. Go to /warehouses page');
  log('4. Test the stock inquiry functionality');
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run main function
main().catch(err => {
  error(`Script failed: ${err.message}`);
  process.exit(1);
});