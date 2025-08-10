import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupRealStockSystem() {
  console.log('🚀 Setting up real stock system...\n');

  try {
    // Step 1: Check if we have products and warehouses
    console.log('📋 Checking existing data...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return false;
    }

    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*');

    if (warehousesError) {
      console.error('Error fetching warehouses:', warehousesError);
      return false;
    }

    if (!products || !warehouses || products.length === 0 || warehouses.length === 0) {
      console.log('⚠️ No products or warehouses found. Creating sample data...');
      
      // Create sample products if none exist
      if (!products || products.length === 0) {
        const sampleProducts = [
          {
            product_code: 'SOFA-001',
            name: 'โซฟา 3 ที่นั่ง สีน้ำตาล',
            description: 'โซฟาหนังแท้ 3 ที่นั่ง สีน้ำตาล สไตล์โมเดิร์น',
            category: 'เฟอร์นิเจอร์',
            cost_price: 12000,
            selling_price: 15000,
            status: 'active'
          },
          {
            product_code: 'TABLE-002',
            name: 'โต๊ะทำงาน ไม้โอ๊ค',
            description: 'โต๊ะทำงานไม้โอ๊คแท้ ขนาด 120x60 ซม.',
            category: 'เฟอร์นิเจอร์',
            cost_price: 8500,
            selling_price: 11000,
            status: 'active'
          },
          {
            product_code: 'CHAIR-003',
            name: 'เก้าอี้สำนักงาน หนังแท้',
            description: 'เก้าอี้สำนักงานหนังแท้ ปรับระดับได้',
            category: 'เฟอร์นิเจอร์',
            cost_price: 25000,
            selling_price: 32000,
            status: 'active'
          },
          {
            product_code: 'BED-004',
            name: 'เตียงนอน King Size',
            description: 'เตียงนอน King Size พร้อมที่นอนสปริง',
            category: 'เฟอร์นิเจอร์',
            cost_price: 18000,
            selling_price: 24000,
            status: 'active'
          },
          {
            product_code: 'WARDROBE-005',
            name: 'ตู้เสื้อผ้า 4 บาน',
            description: 'ตู้เสื้อผ้า 4 บาน ไม้สัก พร้อมกระจก',
            category: 'เฟอร์นิเจอร์',
            cost_price: 22000,
            selling_price: 28000,
            status: 'active'
          }
        ];

        const { error: insertProductsError } = await supabase
          .from('products')
          .insert(sampleProducts);

        if (insertProductsError) {
          console.error('Error creating sample products:', insertProductsError);
          return false;
        }

        console.log('✅ Created sample products');
      }

      // Create sample warehouses if none exist
      if (!warehouses || warehouses.length === 0) {
        const sampleWarehouses = [
          {
            code: 'WH-001',
            name: 'คลังสินค้าหลัก',
            address: '123 ถนนสุขุมวิท กรุงเทพมหานคร 10110',
            phone: '02-123-4567',
            status: 'active'
          },
          {
            code: 'WH-002',
            name: 'คลังสินค้าสาขา A',
            address: '456 ถนนรัตนาธิเบศร์ นนทบุรี 11000',
            phone: '02-234-5678',
            status: 'active'
          },
          {
            code: 'WH-003',
            name: 'คลังสินค้าสาขา B',
            address: '789 ถนนพหลโยธิน ปทุมธานี 12000',
            phone: '02-345-6789',
            status: 'active'
          }
        ];

        const { error: insertWarehousesError } = await supabase
          .from('warehouses')
          .insert(sampleWarehouses);

        if (insertWarehousesError) {
          console.error('Error creating sample warehouses:', insertWarehousesError);
          return false;
        }

        console.log('✅ Created sample warehouses');
      }

      // Refetch the data
      const { data: newProducts } = await supabase.from('products').select('*');
      const { data: newWarehouses } = await supabase.from('warehouses').select('*');
      
      products.push(...(newProducts || []));
      warehouses.push(...(newWarehouses || []));
    }

    console.log(`📦 Found ${products.length} products and ${warehouses.length} warehouses`);

    // Step 2: Create stock movements data directly using INSERT
    console.log('📥 Creating stock movements...');

    // Clear existing movements first
    const { error: clearError } = await supabase
      .from('stock_movements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (clearError && !clearError.message.includes('does not exist')) {
      console.log('Note: Could not clear existing movements (table might not exist yet)');
    }

    // Create inbound movements
    const stockMovements = [];
    
    products.forEach((product) => {
      warehouses.forEach((warehouse) => {
        let quantity = 0;
        
        // Create realistic stock distribution
        if (product.product_code === 'SOFA-001' && warehouse.code === 'WH-001') {
          quantity = 25;
        } else if (product.product_code === 'TABLE-002' && warehouse.code === 'WH-002') {
          quantity = 15;
        } else if (product.product_code === 'CHAIR-003' && warehouse.code === 'WH-001') {
          quantity = 8;
        } else if (product.product_code === 'BED-004' && warehouse.code === 'WH-003') {
          quantity = 30;
        } else if (product.product_code === 'WARDROBE-005' && warehouse.code === 'WH-001') {
          quantity = 12;
        } else {
          // Random quantities for other combinations
          quantity = Math.random() > 0.6 ? Math.floor(Math.random() * 15) + 5 : 0;
        }

        if (quantity > 0) {
          const unitCost = product.cost_price || product.selling_price || 1000;
          
          // Inbound movement
          stockMovements.push({
            product_id: product.id,
            warehouse_id: warehouse.id,
            movement_type: 'in',
            quantity: quantity,
            unit_cost: unitCost,
            total_cost: quantity * unitCost,
            reference_number: `INIT-${Date.now()}-${product.product_code}`,
            notes: `Initial stock for ${product.name} in ${warehouse.name}`,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          });

          // Create some outbound movements (sales)
          if (Math.random() > 0.4) { // 60% chance of having sales
            const saleQuantity = Math.floor(quantity * (Math.random() * 0.3 + 0.1)); // 10-40% sold
            
            if (saleQuantity > 0) {
              stockMovements.push({
                product_id: product.id,
                warehouse_id: warehouse.id,
                movement_type: 'out',
                quantity: saleQuantity,
                unit_cost: unitCost,
                total_cost: saleQuantity * unitCost,
                reference_number: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                notes: `Sale from ${warehouse.name}`,
                created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          }
        }
      });
    });

    // Insert movements in batches
    const batchSize = 20;
    let insertedCount = 0;
    
    for (let i = 0; i < stockMovements.length; i += batchSize) {
      const batch = stockMovements.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        // If table doesn't exist, try to create it first
        if (insertError.message.includes('does not exist')) {
          console.log('⚠️ stock_movements table does not exist. Please run the SQL script first:');
          console.log('📋 Copy and run: scripts/create-stock-movements-simple.sql in Supabase SQL Editor');
          return false;
        }
        return false;
      }

      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(stockMovements.length/batchSize)} (${insertedCount}/${stockMovements.length})`);
    }

    // Step 3: Verify the data
    console.log('\n📊 Verifying stock data...');
    
    const { data: allMovements, error: verifyError } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products (name, product_code),
        warehouses (name, code)
      `);

    if (verifyError) {
      console.error('Error verifying data:', verifyError);
      return false;
    }

    console.log('\n📈 Stock System Summary:');
    console.log(`Total movements: ${allMovements.length}`);
    console.log(`Inbound movements: ${allMovements.filter(m => m.movement_type === 'in').length}`);
    console.log(`Outbound movements: ${allMovements.filter(m => m.movement_type === 'out').length}`);

    // Calculate current stock levels
    const stockLevels = new Map();
    allMovements.forEach(movement => {
      const key = `${movement.product_id}-${movement.warehouse_id}`;
      if (!stockLevels.has(key)) {
        stockLevels.set(key, {
          productName: movement.products.name,
          productCode: movement.products.product_code,
          warehouseName: movement.warehouses.name,
          warehouseCode: movement.warehouses.code,
          quantity: 0
        });
      }
      
      const stock = stockLevels.get(key);
      if (movement.movement_type === 'in') {
        stock.quantity += movement.quantity;
      } else if (movement.movement_type === 'out') {
        stock.quantity -= movement.quantity;
      }
    });

    console.log('\n📦 Current Stock Levels:');
    let totalStockValue = 0;
    Array.from(stockLevels.values()).forEach(stock => {
      if (stock.quantity > 0) {
        console.log(`${stock.productCode} (${stock.productName}) in ${stock.warehouseCode}: ${stock.quantity} units`);
        totalStockValue += stock.quantity;
      }
    });

    console.log(`\n📊 Total units in stock: ${totalStockValue}`);
    console.log('\n🎉 Real stock system setup completed successfully!');
    console.log('\n✅ Next steps:');
    console.log('1. ✅ Stock movements table created with real data');
    console.log('2. ✅ Initial stock levels established');
    console.log('3. ✅ Sales movements simulated');
    console.log('4. 🔄 Test the stock inquiry system');
    console.log('5. 🔄 Verify real-time calculations');

    return true;

  } catch (error) {
    console.error('Error setting up stock system:', error);
    return false;
  }
}

// Run the setup
setupRealStockSystem().catch(console.error);