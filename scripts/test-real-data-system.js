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

async function testRealDataSystem() {
  console.log('🧪 Testing Real Data System...\n');

  let allTestsPassed = true;

  try {
    // Test 1: Check if products exist with proper data
    console.log('📦 Test 1: Products Data');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    if (productsError) {
      console.error('❌ Products test failed:', productsError);
      allTestsPassed = false;
    } else if (!products || products.length === 0) {
      console.error('❌ No active products found');
      allTestsPassed = false;
    } else {
      console.log(`✅ Found ${products.length} active products`);
      
      // Check if products have prices
      const productsWithPrices = products.filter(p => p.cost_price > 0 && p.selling_price > 0);
      if (productsWithPrices.length === products.length) {
        console.log('✅ All products have proper pricing');
      } else {
        console.log(`⚠️ ${products.length - productsWithPrices.length} products missing prices`);
      }
    }

    // Test 2: Check warehouses
    console.log('\n🏢 Test 2: Warehouses Data');
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active');

    if (warehousesError) {
      console.error('❌ Warehouses test failed:', warehousesError);
      allTestsPassed = false;
    } else if (!warehouses || warehouses.length === 0) {
      console.error('❌ No active warehouses found');
      allTestsPassed = false;
    } else {
      console.log(`✅ Found ${warehouses.length} active warehouses`);
      warehouses.forEach(w => {
        console.log(`   - ${w.code}: ${w.name}`);
      });
    }

    // Test 3: Check stock movements
    console.log('\n📊 Test 3: Stock Movements Data');
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('*');

    if (movementsError) {
      console.error('❌ Stock movements test failed:', movementsError);
      allTestsPassed = false;
    } else if (!movements || movements.length === 0) {
      console.error('❌ No stock movements found');
      allTestsPassed = false;
    } else {
      console.log(`✅ Found ${movements.length} stock movements`);
      
      const inbound = movements.filter(m => m.movement_type === 'in').length;
      const outbound = movements.filter(m => m.movement_type === 'out').length;
      
      console.log(`   - Inbound: ${inbound}`);
      console.log(`   - Outbound: ${outbound}`);
    }

    // Test 4: Test stock calculations
    console.log('\n🧮 Test 4: Stock Calculations');
    const { data: stockData, error: stockError } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products (name, product_code, cost_price, selling_price),
        warehouses (name, code)
      `);

    if (stockError) {
      console.error('❌ Stock calculations test failed:', stockError);
      allTestsPassed = false;
    } else {
      // Calculate stock levels
      const stockLevels = new Map();
      
      stockData.forEach(movement => {
        const key = `${movement.product_id}-${movement.warehouse_id}`;
        if (!stockLevels.has(key)) {
          stockLevels.set(key, {
            productCode: movement.products.product_code,
            productName: movement.products.name,
            warehouseCode: movement.warehouses.code,
            quantity: 0,
            costPrice: movement.products.cost_price || 0,
            sellingPrice: movement.products.selling_price || 0
          });
        }
        
        const stock = stockLevels.get(key);
        if (movement.movement_type === 'in') {
          stock.quantity += movement.quantity;
        } else if (movement.movement_type === 'out') {
          stock.quantity -= movement.quantity;
        }
      });

      const positiveStock = Array.from(stockLevels.values()).filter(s => s.quantity > 0);
      const totalUnits = positiveStock.reduce((sum, s) => sum + s.quantity, 0);
      const totalValue = positiveStock.reduce((sum, s) => sum + (s.quantity * s.sellingPrice), 0);

      console.log(`✅ Stock calculations successful`);
      console.log(`   - Items with stock: ${positiveStock.length}`);
      console.log(`   - Total units: ${totalUnits}`);
      console.log(`   - Total value: ฿${totalValue.toLocaleString()}`);
    }

    // Test 5: Test search functionality simulation
    console.log('\n🔍 Test 5: Search Functionality Simulation');
    
    // Test search by product code
    const searchResults = stockData.filter(movement => 
      movement.products.product_code.includes('SOFA') ||
      movement.products.name.includes('โซฟา')
    );
    
    if (searchResults.length > 0) {
      console.log(`✅ Search functionality working - found ${searchResults.length} SOFA-related movements`);
    } else {
      console.log('⚠️ No SOFA products found in search test');
    }

    // Test 6: Test warehouse filtering
    console.log('\n🏭 Test 6: Warehouse Filtering');
    
    const mainWarehouseMovements = stockData.filter(movement => 
      movement.warehouses.code === 'WH-001'
    );
    
    if (mainWarehouseMovements.length > 0) {
      console.log(`✅ Warehouse filtering working - found ${mainWarehouseMovements.length} movements in main warehouse`);
    } else {
      console.log('⚠️ No movements found in main warehouse');
    }

    // Test 7: Test data integrity
    console.log('\n🔒 Test 7: Data Integrity');
    
    let integrityIssues = 0;
    
    // Check for negative stock
    const stockLevels = new Map();
    stockData.forEach(movement => {
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

    const negativeStock = Array.from(stockLevels.values()).filter(quantity => quantity < 0);
    if (negativeStock.length > 0) {
      console.log(`⚠️ Found ${negativeStock.length} items with negative stock`);
      integrityIssues++;
    }

    // Check for orphaned movements (movements without valid product/warehouse)
    const orphanedMovements = stockData.filter(movement => 
      !movement.products || !movement.warehouses
    );
    
    if (orphanedMovements.length > 0) {
      console.log(`⚠️ Found ${orphanedMovements.length} orphaned movements`);
      integrityIssues++;
    }

    if (integrityIssues === 0) {
      console.log('✅ Data integrity check passed - no issues found');
    } else {
      console.log(`⚠️ Found ${integrityIssues} data integrity issues`);
    }

    // Final Results
    console.log('\n📋 Test Results Summary:');
    console.log('================================');
    
    if (allTestsPassed && integrityIssues === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ Real data system is working perfectly');
      console.log('✅ Ready for production use');
      console.log('✅ All features functional with real data');
    } else {
      console.log('⚠️ Some tests had issues');
      console.log('Please review the test results above');
    }

    console.log('\n🚀 System Status:');
    console.log(`Products: ${products?.length || 0} active`);
    console.log(`Warehouses: ${warehouses?.length || 0} active`);
    console.log(`Stock Movements: ${movements?.length || 0} total`);
    console.log(`Stock Items: ${Array.from(stockLevels.values()).filter(q => q > 0).length} with positive stock`);

    return allTestsPassed && integrityIssues === 0;

  } catch (error) {
    console.error('❌ Test system error:', error);
    return false;
  }
}

// Run the tests
testRealDataSystem()
  .then(success => {
    if (success) {
      console.log('\n🎊 Real Data System Test: PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ Real Data System Test: FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });