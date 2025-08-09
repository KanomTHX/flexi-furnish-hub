#!/usr/bin/env node

/**
 * Simple Seed Script
 * Creates basic data for testing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hartshwcchbsnmbrjdyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzc1NzQsImV4cCI6MjA2OTYxMzU3NH0.A1hn4-J2z9h4iuBXQ7xhh2F5UWXHmTPP92tncJfsF24";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🌱 Starting simple data seeding...');

// Simple products data - with required product_code
const products = [
  {
    name: 'โซฟา 3 ที่นั่ง สีน้ำตาล',
    product_code: 'SOFA-001',
    description: 'โซฟาหนังแท้ 3 ที่นั่ง สีน้ำตาล สไตล์คลาสสิก'
  },
  {
    name: 'โต๊ะทำงาน ไม้โอ๊ค',
    product_code: 'TABLE-002',
    description: 'โต๊ะทำงานไม้โอ๊คแท้ พร้อมลิ้นชัก'
  },
  {
    name: 'เก้าอี้สำนักงาน หนังแท้',
    product_code: 'CHAIR-003',
    description: 'เก้าอี้สำนักงานหนังแท้ ปรับระดับได้'
  },
  {
    name: 'เตียงนอน King Size',
    product_code: 'BED-004',
    description: 'เตียงนอน King Size พร้อมที่นอนสปริง'
  },
  {
    name: 'ตู้เสื้อผ้า 4 บาน',
    product_code: 'WARDROBE-005',
    description: 'ตู้เสื้อผ้า 4 บาน สไตล์โมเดิร์น'
  }
];

// Simple warehouses data
const warehouses = [
  {
    name: 'คลังสินค้าหลัก',
    code: 'WH-001',
    location: 'กรุงเทพมหานคร'
  },
  {
    name: 'คลังสินค้าสาขา A',
    code: 'WH-002',
    location: 'นนทบุรี'
  },
  {
    name: 'คลังสินค้าสาขา B',
    code: 'WH-003',
    location: 'ปทุมธานี'
  }
];

try {
  // Test connection
  const { data: testData, error: testError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (testError) {
    console.error('❌ Connection test failed:', testError.message);
    process.exit(1);
  }

  console.log('✅ Database connection successful');

  // Insert products
  console.log('📦 Creating products...');
  const { data: insertedProducts, error: insertError } = await supabase
    .from('products')
    .insert(products)
    .select();

  if (insertError) {
    console.error('❌ Failed to insert products:', insertError.message);
  } else {
    console.log(`✅ Created ${insertedProducts.length} products`);
    console.log('📋 Products:', insertedProducts.map(p => p.name));
  }

  // Insert warehouses
  console.log('🏪 Creating warehouses...');
  const { data: insertedWarehouses, error: warehouseError } = await supabase
    .from('warehouses')
    .insert(warehouses)
    .select();

  if (warehouseError) {
    console.error('❌ Failed to insert warehouses:', warehouseError.message);
  } else {
    console.log(`✅ Created ${insertedWarehouses.length} warehouses`);
    console.log('📋 Warehouses:', insertedWarehouses.map(w => w.name));
  }

  // Create some stock movements if both products and warehouses were created
  if (insertedProducts && insertedWarehouses && insertedProducts.length > 0 && insertedWarehouses.length > 0) {
    console.log('📊 Creating stock movements...');
    
    const stockMovements = [];
    
    // Create some sample stock movements
    for (let i = 0; i < Math.min(insertedProducts.length, 3); i++) {
      const product = insertedProducts[i];
      const warehouse = insertedWarehouses[0]; // Use first warehouse
      
      stockMovements.push({
        product_id: product.id,
        warehouse_id: warehouse.id,
        movement_type: 'receive',
        quantity: Math.floor(Math.random() * 20) + 10,
        notes: `Initial stock for ${product.name}`,
        movement_date: new Date().toISOString()
      });
    }

    const { data: insertedMovements, error: movementError } = await supabase
      .from('stock_movements')
      .insert(stockMovements)
      .select();

    if (movementError) {
      console.error('❌ Failed to insert stock movements:', movementError.message);
    } else {
      console.log(`✅ Created ${insertedMovements.length} stock movements`);
    }
  }

  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Go to /warehouses page');
  console.log('2. Click on "ตรวจสอบสต็อก" tab');
  console.log('3. Test the functionality');

} catch (error) {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}