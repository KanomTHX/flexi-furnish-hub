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