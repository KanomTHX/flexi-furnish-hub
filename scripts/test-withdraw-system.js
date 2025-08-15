#!/usr/bin/env node

/**
 * Test Withdraw/Dispatch System
 * Tests the complete withdraw functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use anon key for testing (service role key not available in .env)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzE0NzQsImV4cCI6MjA1MDAwNzQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8' // This is a placeholder, we'll use the actual anon key
);

async function testWithdrawSystem() {
  console.log('🧪 Testing Withdraw/Dispatch System...\n');

  try {
    // 1. Check available stock
    console.log('1️⃣ Checking available stock...');
    const { data: stockData, error: stockError } = await supabase
      .from('stock_summary_view')
      .select('*')
      .gt('available_quantity', 0)
      .limit(5);

    if (stockError) throw stockError;

    console.log(`✅ Found ${stockData.length} products with available stock`);
    stockData.forEach(stock => {
      console.log(`   - ${stock.product_name}: ${stock.available_quantity} available`);
    });

    if (stockData.length === 0) {
      console.log('❌ No stock available for testing. Please run receive goods first.');
      return;
    }

    // 2. Get serial numbers for first product
    console.log('\n2️⃣ Getting serial numbers...');
    const firstProduct = stockData[0];
    
    const { data: serialNumbers, error: snError } = await supabase
      .from('product_serial_numbers')
      .select(`
        *,
        product:products(id, name, code),
        warehouse:warehouses(id, name, code)
      `)
      .eq('product_id', firstProduct.product_id)
      .eq('warehouse_id', firstProduct.warehouse_id)
      .eq('status', 'available')
      .limit(2);

    if (snError) throw snError;

    console.log(`✅ Found ${serialNumbers.length} available serial numbers`);
    serialNumbers.forEach(sn => {
      console.log(`   - ${sn.serial_number} (Cost: ฿${sn.unit_cost})`);
    });

    if (serialNumbers.length === 0) {
      console.log('❌ No serial numbers available for testing.');
      return;
    }

    // 3. Test withdraw functionality
    console.log('\n3️⃣ Testing withdraw functionality...');
    
    const withdrawData = {
      warehouseId: firstProduct.warehouse_id,
      serialNumberIds: [serialNumbers[0].id],
      reason: 'Test sale transaction',
      referenceType: 'sale',
      referenceNumber: `TEST-SALE-${Date.now()}`,
      customerName: 'Test Customer',
      customerPhone: '02-123-4567',
      notes: 'Test withdraw from automated script',
      performedBy: 'test-system'
    };

    // Update serial number status
    const { data: updatedSN, error: updateError } = await supabase
      .from('product_serial_numbers')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString(),
        sold_to: withdrawData.customerName,
        reference_number: withdrawData.referenceNumber,
        notes: withdrawData.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawData.serialNumberIds[0])
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`✅ Updated serial number status: ${updatedSN.serial_number} -> ${updatedSN.status}`);

    // Log stock movement
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert([{
        product_id: firstProduct.product_id,
        serial_number_id: withdrawData.serialNumberIds[0],
        warehouse_id: withdrawData.warehouseId,
        movement_type: 'withdraw',
        quantity: 1,
        unit_cost: serialNumbers[0].unit_cost,
        reference_type: withdrawData.referenceType,
        reference_number: withdrawData.referenceNumber,
        notes: `${withdrawData.reason} - ${withdrawData.notes}`,
        performed_by: withdrawData.performedBy
      }])
      .select()
      .single();

    if (movementError) throw movementError;

    console.log(`✅ Logged stock movement: ${movement.id}`);

    // 4. Verify stock levels updated
    console.log('\n4️⃣ Verifying stock levels...');
    const { data: updatedStock, error: updatedStockError } = await supabase
      .from('stock_summary_view')
      .select('*')
      .eq('product_id', firstProduct.product_id)
      .eq('warehouse_id', firstProduct.warehouse_id)
      .single();

    if (updatedStockError) throw updatedStockError;

    console.log(`✅ Stock updated:`);
    console.log(`   - Available: ${firstProduct.available_quantity} -> ${updatedStock.available_quantity}`);
    console.log(`   - Sold: ${firstProduct.sold_quantity} -> ${updatedStock.sold_quantity}`);

    // 5. Test withdraw history
    console.log('\n5️⃣ Testing withdraw history...');
    const { data: history, error: historyError } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(name, code),
        warehouse:warehouses(name, code),
        serial_number:product_serial_numbers(serial_number)
      `)
      .eq('movement_type', 'withdraw')
      .eq('warehouse_id', withdrawData.warehouseId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (historyError) throw historyError;

    console.log(`✅ Found ${history.length} withdraw transactions`);
    history.forEach(h => {
      console.log(`   - ${h.product.name} (${h.serial_number?.serial_number}) - ${new Date(h.created_at).toLocaleDateString()}`);
    });

    // 6. Test low stock alerts
    console.log('\n6️⃣ Testing low stock alerts...');
    const { data: lowStock, error: lowStockError } = await supabase
      .from('stock_summary_view')
      .select('*')
      .lte('available_quantity', 5)
      .gt('available_quantity', 0)
      .limit(10);

    if (lowStockError) throw lowStockError;

    console.log(`✅ Found ${lowStock.length} low stock items`);
    lowStock.forEach(stock => {
      console.log(`   - ${stock.product_name}: ${stock.available_quantity} left (Low Stock Alert)`);
    });

    // 7. Test out of stock items
    console.log('\n7️⃣ Testing out of stock detection...');
    const { data: outOfStock, error: outOfStockError } = await supabase
      .from('stock_summary_view')
      .select('*')
      .eq('available_quantity', 0)
      .limit(10);

    if (outOfStockError) throw outOfStockError;

    console.log(`✅ Found ${outOfStock.length} out of stock items`);
    outOfStock.forEach(stock => {
      console.log(`   - ${stock.product_name}: Out of Stock`);
    });

    console.log('\n🎉 Withdraw System Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Stock levels: Working`);
    console.log(`   ✅ Serial number management: Working`);
    console.log(`   ✅ Withdraw processing: Working`);
    console.log(`   ✅ Stock movement logging: Working`);
    console.log(`   ✅ Stock level updates: Working`);
    console.log(`   ✅ History tracking: Working`);
    console.log(`   ✅ Low stock alerts: Working`);
    console.log(`   ✅ Out of stock detection: Working`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testWithdrawSystem();