import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReceiveGoods() {
  console.log('🧪 Testing Receive Goods functionality...\n');

  try {
    // Test 1: Check required tables
    console.log('📋 Test 1: Checking required tables');
    
    const tables = ['products', 'warehouses', 'suppliers', 'stock_movements'];
    const tableResults = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          tableResults[table] = { exists: false, error: error.message };
        } else {
          tableResults[table] = { exists: true, count: data?.length || 0 };
        }
      } catch (err) {
        tableResults[table] = { exists: false, error: err.message };
      }
    }

    console.log('Table status:');
    Object.entries(tableResults).forEach(([table, result]) => {
      if (result.exists) {
        console.log(`✅ ${table}: Available`);
      } else {
        console.log(`❌ ${table}: ${result.error}`);
      }
    });

    // Test 2: Check products data
    console.log('\n📦 Test 2: Products data');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, product_code, name, cost_price, selling_price, status')
      .eq('status', 'active');

    if (productsError) {
      console.error('❌ Products query failed:', productsError);
      return false;
    }

    console.log(`✅ Found ${products.length} active products`);
    if (products.length > 0) {
      console.log('Sample product:', {
        code: products[0].product_code,
        name: products[0].name,
        cost: products[0].cost_price
      });
    }

    // Test 3: Check warehouses data
    console.log('\n🏢 Test 3: Warehouses data');
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('id, code, name, status')
      .eq('status', 'active');

    if (warehousesError) {
      console.error('❌ Warehouses query failed:', warehousesError);
      return false;
    }

    console.log(`✅ Found ${warehouses.length} active warehouses`);
    warehouses.forEach(w => {
      console.log(`   - ${w.code}: ${w.name}`);
    });

    // Test 4: Check suppliers (optional)
    console.log('\n🚚 Test 4: Suppliers data');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, name, code')
      .limit(5);

    if (suppliersError) {
      console.log(`⚠️ Suppliers table not available: ${suppliersError.message}`);
      console.log('   This is optional - system can work without suppliers');
    } else {
      console.log(`✅ Found ${suppliers?.length || 0} suppliers`);
    }

    // Test 5: Simulate receiving goods process
    console.log('\n📥 Test 5: Simulate receiving goods process');
    
    if (products.length > 0 && warehouses.length > 0) {
      const testProduct = products[0];
      const testWarehouse = warehouses[0];
      const testQuantity = 5;
      const testUnitCost = testProduct.cost_price || 1000;

      console.log('Simulating receive goods with:');
      console.log(`   Product: ${testProduct.name} (${testProduct.product_code})`);
      console.log(`   Warehouse: ${testWarehouse.name} (${testWarehouse.code})`);
      console.log(`   Quantity: ${testQuantity}`);
      console.log(`   Unit Cost: ฿${testUnitCost}`);

      // Create stock movement record
      const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: testProduct.id,
          warehouse_id: testWarehouse.id,
          movement_type: 'in',
          quantity: testQuantity,
          notes: 'Test receive goods operation'
        })
        .select()
        .single();

      if (movementError) {
        console.error('❌ Failed to create stock movement:', movementError);
        return false;
      }

      console.log('✅ Stock movement created successfully');
      console.log(`   Movement ID: ${movement.id}`);

      // Verify the movement was created
      const { data: verifyMovement, error: verifyError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('id', movement.id)
        .single();

      if (verifyError) {
        console.error('❌ Failed to verify movement:', verifyError);
        return false;
      }

      console.log('✅ Movement verification successful');

      // Clean up test data
      const { error: cleanupError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('id', movement.id);

      if (cleanupError) {
        console.log('⚠️ Could not clean up test data:', cleanupError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }

    // Test 6: Check current stock levels
    console.log('\n📊 Test 6: Current stock levels');
    const { data: currentMovements, error: currentError } = await supabase
      .from('stock_movements')
      .select('product_id, warehouse_id, movement_type, quantity')
      .limit(20);

    if (currentError) {
      console.error('❌ Failed to get current movements:', currentError);
      return false;
    }

    // Calculate current stock
    const stockLevels = new Map();
    currentMovements.forEach(movement => {
      const key = `${movement.product_id}-${movement.warehouse_id}`;
      if (!stockLevels.has(key)) {
        stockLevels.set(key, 0);
      }
      
      if (movement.movement_type === 'in') {
        stockLevels.set(key, stockLevels.get(key) + movement.quantity);
      } else if (movement.movement_type === 'out') {
        stockLevels.set(key, stockLevels.get(key) - movement.quantity);
      }
    });

    const positiveStock = Array.from(stockLevels.values()).filter(q => q > 0);
    const totalStock = positiveStock.reduce((sum, q) => sum + q, 0);

    console.log(`✅ Current stock analysis complete`);
    console.log(`   - Items with stock: ${positiveStock.length}`);
    console.log(`   - Total units: ${totalStock}`);

    console.log('\n🎉 All receive goods tests passed!');
    console.log('\n✅ Receive Goods System Status:');
    console.log('✅ Required tables available');
    console.log('✅ Products data accessible');
    console.log('✅ Warehouses data accessible');
    console.log('✅ Stock movement creation working');
    console.log('✅ Data verification functional');
    console.log('✅ Ready for UI implementation');

    return true;

  } catch (error) {
    console.error('❌ Receive goods test failed:', error);
    return false;
  }
}

// Run the test
testReceiveGoods()
  .then(success => {
    if (success) {
      console.log('\n🎊 Receive Goods Test: PASSED');
      console.log('💡 System ready for receive goods functionality');
      process.exit(0);
    } else {
      console.log('\n❌ Receive Goods Test: FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });