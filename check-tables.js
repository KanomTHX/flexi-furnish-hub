import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 ตรวจสอบตารางในฐานข้อมูล...');
  
  try {
    // ตรวจสอบตาราง notifications
    console.log('\n📋 ตรวจสอบตาราง notifications:');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (notifError) {
      console.log('❌ ตาราง notifications:', notifError.message);
    } else {
      console.log('✅ ตาราง notifications: มีอยู่');
      if (notifications.length > 0) {
        console.log('📄 โครงสร้างข้อมูล:', Object.keys(notifications[0]));
      } else {
        console.log('📄 ตารางว่าง');
      }
    }
    
    // ตรวจสอบตาราง customers
    console.log('\n📋 ตรวจสอบตาราง customers:');
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (custError) {
      console.log('❌ ตาราง customers:', custError.message);
    } else {
      console.log('✅ ตาราง customers: มีอยู่');
      if (customers.length > 0) {
        console.log('📄 โครงสร้างข้อมูล:', Object.keys(customers[0]));
      } else {
        console.log('📄 ตารางว่าง');
      }
    }
    
    // ตรวจสอบตาราง inventory
    console.log('\n📋 ตรวจสอบตาราง inventory:');
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('*')
      .limit(1);
    
    if (invError) {
      console.log('❌ ตาราง inventory:', invError.message);
    } else {
      console.log('✅ ตาราง inventory: มีอยู่');
      if (inventory.length > 0) {
        console.log('📄 โครงสร้างข้อมูล:', Object.keys(inventory[0]));
      } else {
        console.log('📄 ตารางว่าง');
      }
    }
    
    // ตรวจสอบตาราง product_inventory
    console.log('\n📋 ตรวจสอบตาราง product_inventory:');
    const { data: productInventory, error: prodInvError } = await supabase
      .from('product_inventory')
      .select('*')
      .limit(1);
    
    if (prodInvError) {
      console.log('❌ ตาราง product_inventory:', prodInvError.message);
    } else {
      console.log('✅ ตาราง product_inventory: มีอยู่');
      if (productInventory.length > 0) {
        console.log('📄 โครงสร้างข้อมูล:', Object.keys(productInventory[0]));
      } else {
        console.log('📄 ตารางว่าง');
        // ตรวจสอบโครงสร้างตารางแม้ว่าจะว่าง
        const { data: schema, error: schemaError } = await supabase
          .from('product_inventory')
          .select('*')
          .limit(0);
        if (!schemaError) {
          console.log('📄 โครงสร้างตาราง: ตรวจสอบได้');
        }
      }
    }

    // ตรวจสอบตาราง warehouses
    console.log('\n📋 ตรวจสอบตาราง warehouses:');
    const { data: warehouses, error: warehouseError } = await supabase
      .from('warehouses')
      .select('*')
      .limit(1);
    
    if (warehouseError) {
      console.log('❌ ตาราง warehouses:', warehouseError.message);
    } else {
      console.log('✅ ตาราง warehouses: มีอยู่');
      if (warehouses.length > 0) {
        console.log('📄 โครงสร้างข้อมูล:', Object.keys(warehouses[0]));
      } else {
        console.log('📄 ตารางว่าง');
      }
    }

    // ตรวจสอบความสัมพันธ์ระหว่าง product_inventory และ warehouses
    console.log('\n📋 ตรวจสอบความสัมพันธ์ product_inventory กับ warehouses:');
    const { data: inventoryWithWarehouse, error: relationError } = await supabase
      .from('product_inventory')
      .select(`
        id,
        warehouse_id,
        warehouses(
          id,
          name
        )
      `)
      .limit(1);
    
    if (relationError) {
      console.log('❌ ความสัมพันธ์:', relationError.message);
    } else {
      console.log('✅ ความสัมพันธ์: ใช้งานได้');
      if (inventoryWithWarehouse.length > 0) {
        console.log('📄 ตัวอย่างข้อมูล:', inventoryWithWarehouse[0]);
      }
    }
    
    // ตรวจสอบตาราง sale_items
    console.log('\n📋 ตรวจสอบตาราง sale_items:');
    const { data: saleItems, error: saleError } = await supabase
      .from('sale_items')
      .select('*')
      .limit(1);
    
    if (saleError) {
      console.log('❌ ตาราง sale_items:', saleError.message);
    } else {
      console.log('✅ ตาราง sale_items: มีอยู่');
      if (saleItems.length > 0) {
        console.log('📄 โครงสร้างข้อมูล:', Object.keys(saleItems[0]));
      } else {
        console.log('📄 ตารางว่าง');
      }
    }
    
    // ตรวจสอบตาราง stock_transfer_items
    console.log('\n📋 ตรวจสอบตาราง stock_transfer_items:');
    const { data: stockTransferItems, error: stockTransferError } = await supabase
      .from('stock_transfer_items')
      .select('*')
      .limit(1);
    
    if (stockTransferError) {
      console.log('❌ ตาราง stock_transfer_items:', stockTransferError.message);
    } else {
      console.log('✅ ตาราง stock_transfer_items: มีอยู่');
      if (stockTransferItems.length > 0) {
        console.log('📄 โครงสร้างข้อมูล:', Object.keys(stockTransferItems[0]));
      } else {
        console.log('📄 ตารางว่าง');
      }
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

checkTables();