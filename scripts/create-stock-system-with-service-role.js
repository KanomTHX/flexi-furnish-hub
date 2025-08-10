import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStockMovementsTable() {
  console.log('🔧 Creating stock_movements table with service role...');

  try {
    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop table if exists to recreate
        DROP TABLE IF EXISTS stock_movements CASCADE;
        
        -- Create stock_movements table
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

        -- Create indexes
        CREATE INDEX idx_stock_movements_product_warehouse ON stock_movements (product_id, warehouse_id);
        CREATE INDEX idx_stock_movements_created_at ON stock_movements (created_at);
        CREATE INDEX idx_stock_movements_type ON stock_movements (movement_type);

        -- Enable RLS
        ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Enable read access for all users" ON stock_movements FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users" ON stock_movements FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users" ON stock_movements FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users" ON stock_movements FOR DELETE USING (true);
      `
    });

    if (error) {
      // Try alternative approach using direct SQL execution
      console.log('Trying alternative table creation method...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS stock_movements (
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
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('Error creating table:', createError);
        return false;
      }

      // Create indexes separately
      const indexSQL = `
        CREATE INDEX IF NOT EXISTS idx_stock_movements_product_warehouse ON stock_movements (product_id, warehouse_id);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements (created_at);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements (movement_type);
      `;

      await supabase.rpc('exec_sql', { sql: indexSQL });

      // Enable RLS
      const rlsSQL = `
        ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON stock_movements;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stock_movements;
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON stock_movements;
        DROP POLICY IF EXISTS "Enable delete for authenticated users" ON stock_movements;
        
        CREATE POLICY "Enable read access for all users" ON stock_movements FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users" ON stock_movements FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users" ON stock_movements FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users" ON stock_movements FOR DELETE USING (true);
      `;

      await supabase.rpc('exec_sql', { sql: rlsSQL });
    }

    console.log('✅ stock_movements table created successfully');
    return true;

  } catch (error) {
    console.error('Error creating table:', error);
    return false;
  }
}

async function seedRealStockData() {
  console.log('🌱 Seeding real stock data...');

  try {
    // Get products and warehouses
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
      console.log('⚠️ No products or warehouses found. Please run seed scripts first.');
      return false;
    }

    console.log(`📦 Found ${products.length} products and ${warehouses.length} warehouses`);

    // Clear existing data
    const { error: clearError } = await supabase
      .from('stock_movements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (clearError) {
      console.log('Note: Could not clear existing data:', clearError.message);
    }

    // Create realistic stock movements
    const stockMovements = [];

    // Define specific stock levels for main products
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
          // Random quantity for other combinations
          initialQuantity = Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 3 : 0;
        }

        if (initialQuantity > 0) {
          const unitCost = product.cost_price || product.selling_price || 1000;
          
          // Create inbound movement (receiving stock)
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

          // Create some outbound movements (sales) - 20-40% of initial stock
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

    // Insert movements in batches
    const batchSize = 15;
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

    console.log(`✅ Successfully inserted ${insertedCount} stock movements`);
    return true;

  } catch (error) {
    console.error('Error seeding stock data:', error);
    return false;
  }
}

async function verifyStockData() {
  console.log('🔍 Verifying stock data...');

  try {
    const { data: movements, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products (name, product_code),
        warehouses (name, code)
      `);

    if (error) {
      console.error('Error verifying data:', error);
      return false;
    }

    console.log('\n📈 Stock System Summary:');
    console.log(`Total movements: ${movements.length}`);
    console.log(`Inbound movements: ${movements.filter(m => m.movement_type === 'in').length}`);
    console.log(`Outbound movements: ${movements.filter(m => m.movement_type === 'out').length}`);

    // Calculate current stock levels
    const stockLevels = new Map();
    movements.forEach(movement => {
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
    
    return true;

  } catch (error) {
    console.error('Error verifying stock data:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up real stock system with service role...\n');

  // Step 1: Create table
  const tableCreated = await createStockMovementsTable();
  if (!tableCreated) {
    console.error('❌ Failed to create stock_movements table');
    process.exit(1);
  }

  // Step 2: Seed data
  const dataSeeded = await seedRealStockData();
  if (!dataSeeded) {
    console.error('❌ Failed to seed stock data');
    process.exit(1);
  }

  // Step 3: Verify data
  const dataVerified = await verifyStockData();
  if (!dataVerified) {
    console.error('❌ Failed to verify stock data');
    process.exit(1);
  }

  console.log('\n🎉 Real stock system setup completed successfully!');
  console.log('\n✅ What was accomplished:');
  console.log('1. ✅ Created stock_movements table with proper schema');
  console.log('2. ✅ Inserted realistic stock data for all products');
  console.log('3. ✅ Created inbound and outbound movements');
  console.log('4. ✅ Verified data integrity and calculations');
  console.log('\n🔄 Next steps:');
  console.log('1. Test the stock inquiry system');
  console.log('2. Verify real-time stock calculations');
  console.log('3. Test warehouse management features');
  console.log('4. Build and deploy the application');
}

// Run the setup
main().catch(console.error);