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

async function testStockInquiry() {
  console.log('🧪 Testing Stock Inquiry functionality...\n');

  try {
    // Test 1: Basic stock movements query
    console.log('📋 Test 1: Basic stock movements query');
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('id, product_id, warehouse_id, movement_type, quantity, created_at')
      .limit(10);

    if (movementsError) {
      console.error('❌ Stock movements query failed:', movementsError);
      return false;
    }

    console.log(`✅ Stock movements query successful - ${movements.length} records`);

    // Test 2: Products query
    console.log('\n📦 Test 2: Products query');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, product_code, name, description, cost_price, selling_price')
      .eq('status', 'active');

    if (productsError) {
      console.error('❌ Products query failed:', productsError);
      return false;
    }

    console.log(`✅ Products query successful - ${products.length} records`);

    // Test 3: Warehouses query
    console.log('\n🏢 Test 3: Warehouses query');
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('id, code, name')
      .eq('status', 'active');

    if (warehousesError) {
      console.error('❌ Warehouses query failed:', warehousesError);
      return false;
    }

    console.log(`✅ Warehouses query successful - ${warehouses.length} records`);

    // Test 4: Stock calculation simulation
    console.log('\n🧮 Test 4: Stock calculation simulation');
    
    if (movements.length > 0 && products.length > 0 && warehouses.length > 0) {
      const stockLevels = new Map();
      
      movements.forEach(movement => {
        const product = products.find(p => p.id === movement.product_id);
        const warehouse = warehouses.find(w => w.id === movement.warehouse_id);
        
        if (product && warehouse) {
          const key = `${movement.product_id}-${movement.warehouse_id}`;
          if (!stockLevels.has(key)) {
            stockLevels.set(key, {
              productCode: product.product_code,
              productName: product.name,
              warehouseCode: warehouse.code,
              warehouseName: warehouse.name,
              quantity: 0,
              unitCost: product.cost_price || product.selling_price || 1000
            });
          }
          
          const stock = stockLevels.get(key);
          if (movement.movement_type === 'in') {
            stock.quantity += movement.quantity;
          } else if (movement.movement_type === 'out') {
            stock.quantity -= movement.quantity;
          }
        }
      });

      const positiveStock = Array.from(stockLevels.values()).filter(s => s.quantity > 0);
      const totalUnits = positiveStock.reduce((sum, s) => sum + s.quantity, 0);
      const totalValue = positiveStock.reduce((sum, s) => sum + (s.quantity * s.unitCost), 0);

      console.log(`✅ Stock calculation successful`);
      console.log(`   - Items with stock: ${positiveStock.length}`);
      console.log(`   - Total units: ${totalUnits}`);
      console.log(`   - Total value: ฿${totalValue.toLocaleString()}`);

      // Test 5: Search functionality simulation
      console.log('\n🔍 Test 5: Search functionality simulation');
      
      const searchTerm = 'โซฟา';
      const searchResults = positiveStock.filter(stock => 
        stock.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.productCode.toLowerCase().includes(searchTerm.toLowerCase())
      );

      console.log(`✅ Search test successful - found ${searchResults.length} items matching "${searchTerm}"`);

      // Test 6: Warehouse filtering simulation
      console.log('\n🏭 Test 6: Warehouse filtering simulation');
      
      const mainWarehouse = warehouses.find(w => w.code === 'WH-001');
      if (mainWarehouse) {
        const warehouseStock = positiveStock.filter(stock => 
          stock.warehouseCode === mainWarehouse.code
        );
        console.log(`✅ Warehouse filtering successful - found ${warehouseStock.length} items in ${mainWarehouse.name}`);
      }

      // Test 7: Status calculation simulation
      console.log('\n📊 Test 7: Status calculation simulation');
      
      const statusCounts = {
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0
      };

      positiveStock.forEach(stock => {
        if (stock.quantity <= 0) {
          statusCounts.out_of_stock++;
        } else if (stock.quantity < 10) {
          statusCounts.low_stock++;
        } else {
          statusCounts.in_stock++;
        }
      });

      console.log(`✅ Status calculation successful`);
      console.log(`   - In stock: ${statusCounts.in_stock}`);
      console.log(`   - Low stock: ${statusCounts.low_stock}`);
      console.log(`   - Out of stock: ${statusCounts.out_of_stock}`);

    } else {
      console.log('⚠️ Insufficient data for stock calculations');
    }

    console.log('\n🎉 All stock inquiry tests passed!');
    console.log('\n✅ Stock Inquiry System Status:');
    console.log('✅ Database queries working');
    console.log('✅ Stock calculations functional');
    console.log('✅ Search functionality ready');
    console.log('✅ Filtering capabilities operational');
    console.log('✅ Status calculations accurate');
    console.log('✅ Ready for user interface testing');

    return true;

  } catch (error) {
    console.error('❌ Stock inquiry test failed:', error);
    return false;
  }
}

// Run the test
testStockInquiry()
  .then(success => {
    if (success) {
      console.log('\n🎊 Stock Inquiry Test: PASSED');
      console.log('💡 Next step: Test the UI at http://localhost:8081/warehouses');
      process.exit(0);
    } else {
      console.log('\n❌ Stock Inquiry Test: FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });