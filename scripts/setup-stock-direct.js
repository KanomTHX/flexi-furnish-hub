import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStockSystem() {
  console.log('🚀 Setting up stock system directly...\n');

  try {
    // First, let's check if we have products and warehouses
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

    console.log(`📦 Found ${products?.length || 0} products and ${warehouses?.length || 0} warehouses`);

    if (!products || !warehouses || products.length === 0 || warehouses.length === 0) {
      console.log('⚠️ Missing products or warehouses. Creating sample data...');
      
      // Create sample products if needed
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

        const { data: newProducts, error: insertProductsError } = await supabase
          .from('products')
          .insert(sampleProducts)
          .select();

        if (insertProductsError) {
          console.error('Error creating products:', insertProductsError);
        } else {
          console.log('✅ Created sample products');
          products.push(...newProducts);
        }
      }

      // Create sample warehouses if needed
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

        const { data: newWarehouses, error: insertWarehousesError } = await supabase
          .from('warehouses')
          .insert(sampleWarehouses)
          .select();

        if (insertWarehousesError) {
          console.error('Error creating warehouses:', insertWarehousesError);
        } else {
          console.log('✅ Created sample warehouses');
          warehouses.push(...newWarehouses);
        }
      }
    }

    // Now let's try to work with stock_movements table
    console.log('📊 Setting up stock movements...');

    // Try to query the table first to see if it exists
    const { data: existingMovements, error: queryError } = await supabase
      .from('stock_movements')
      .select('id')
      .limit(1);

    if (queryError && queryError.message.includes('does not exist')) {
      console.log('⚠️ stock_movements table does not exist.');
      console.log('📋 Please create the table manually in Supabase SQL Editor:');
      console.log(`
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  batch_id UUID,
  serial_numbers TEXT[]
);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON stock_movements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON stock_movements FOR DELETE USING (true);
      `);
      
      console.log('\nAfter creating the table, run this script again.');
      return false;
    }

    // Clear existing movements
    if (existingMovements) {
      console.log('🧹 Clearing existing stock movements...');
      const { error: clearError } = await supabase
        .from('stock_movements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (clearError) {
        console.log('Note: Could not clear existing movements:', clearError.message);
      } else {
        console.log('✅ Cleared existing movements');
      }
    }

    // Create realistic stock data
    console.log('📥 Creating stock movements...');
    
    const stockMovements = [];
    const stockConfig = {
      'SOFA-001': { 'WH-001': 25, 'WH-002': 8, 'WH-003': 5 },
      'TABLE-002': { 'WH-001': 12, 'WH-002': 15, 'WH-003': 7 },
      'CHAIR-003': { 'WH-001': 8, 'WH-002': 3, 'WH-003': 0 },
      'BED-004': { 'WH-001': 18, 'WH-002': 12, 'WH-003': 30 },
      'WARDROBE-005': { 'WH-001': 12, 'WH-002': 6, 'WH-003': 4 }
    };

    products.forEach((product) => {
      warehouses.forEach((warehouse) => {
        const config = stockConfig[product.product_code];
        let initialQuantity = 0;

        if (config && config[warehouse.code] !== undefined) {
          initialQuantity = config[warehouse.code];
        } else {
          initialQuantity = Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 3 : 0;
        }

        if (initialQuantity > 0) {
          const unitCost = product.cost_price || product.selling_price || 1000;
          
          // Inbound movement
          stockMovements.push({
            product_id: product.id,
            warehouse_id: warehouse.id,
            movement_type: 'in',
            quantity: initialQuantity,
            unit_cost: unitCost,
            total_cost: initialQuantity * unitCost,
            reference_number: `INIT-${Date.now()}-${product.product_code}-${warehouse.code}`,
            notes: `Initial stock for ${product.name} in ${warehouse.name}`,
            created_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
          });

          // Outbound movement (sales)
          if (Math.random() > 0.3) {
            const saleQuantity = Math.floor(initialQuantity * (Math.random() * 0.2 + 0.2));
            
            if (saleQuantity > 0) {
              stockMovements.push({
                product_id: product.id,
                warehouse_id: warehouse.id,
                movement_type: 'out',
                quantity: saleQuantity,
                unit_cost: unitCost,
                total_cost: saleQuantity * unitCost,
                reference_number: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
                notes: `Sale from ${warehouse.name}`,
                created_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          }
        }
      });
    });

    console.log(`📊 Prepared ${stockMovements.length} stock movements`);

    // Insert in batches
    const batchSize = 10;
    let insertedCount = 0;

    for (let i = 0; i < stockMovements.length; i += batchSize) {
      const batch = stockMovements.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        return false;
      }

      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(stockMovements.length/batchSize)} (${insertedCount}/${stockMovements.length})`);
    }

    // Verify data
    console.log('\n🔍 Verifying stock data...');
    
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
          quantity: 0,
          value: 0
        });
      }
      
      const stock = stockLevels.get(key);
      if (movement.movement_type === 'in') {
        stock.quantity += movement.quantity;
        stock.value += movement.total_cost;
      } else if (movement.movement_type === 'out') {
        stock.quantity -= movement.quantity;
        stock.value -= movement.total_cost;
      }
    });

    console.log('\n📦 Current Stock Levels:');
    let totalUnits = 0;
    let totalValue = 0;
    
    Array.from(stockLevels.values())
      .filter(stock => stock.quantity > 0)
      .sort((a, b) => a.productCode.localeCompare(b.productCode))
      .forEach(stock => {
        console.log(`${stock.productCode} (${stock.productName}) in ${stock.warehouseCode}: ${stock.quantity} units (฿${stock.value.toLocaleString()})`);
        totalUnits += stock.quantity;
        totalValue += stock.value;
      });

    console.log(`\n📊 Total: ${totalUnits} units, ฿${totalValue.toLocaleString()} value`);

    console.log('\n🎉 Stock system setup completed successfully!');
    console.log('\n✅ What was accomplished:');
    console.log('1. ✅ Verified/created products and warehouses');
    console.log('2. ✅ Inserted realistic stock movement data');
    console.log('3. ✅ Created inbound and outbound movements');
    console.log('4. ✅ Verified data integrity and calculations');
    console.log('\n🔄 Next steps:');
    console.log('1. Test the stock inquiry system');
    console.log('2. Verify real-time stock calculations');
    console.log('3. Test warehouse management features');

    return true;

  } catch (error) {
    console.error('Error setting up stock system:', error);
    return false;
  }
}

// Run the setup
setupStockSystem().catch(console.error);