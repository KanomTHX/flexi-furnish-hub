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

async function createStockMovementsTable() {
  console.log('🔧 Creating stock_movements table...');

  try {
    // Create stock_movements table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
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
          serial_numbers TEXT[],
          
          -- Indexes for better performance
          INDEX idx_stock_movements_product_warehouse (product_id, warehouse_id),
          INDEX idx_stock_movements_created_at (created_at),
          INDEX idx_stock_movements_type (movement_type)
        );

        -- Enable RLS
        ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Enable read access for all users" ON stock_movements FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users" ON stock_movements FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users" ON stock_movements FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users" ON stock_movements FOR DELETE USING (true);
      `
    });

    if (createTableError) {
      console.error('Error creating table:', createTableError);
      return false;
    }

    console.log('✅ stock_movements table created successfully');
    return true;

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function seedInitialStockData() {
  console.log('🌱 Seeding initial stock data...');

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

    // Create initial stock movements (receiving goods)
    const stockMovements = [];

    products.forEach((product, productIndex) => {
      warehouses.forEach((warehouse, warehouseIndex) => {
        // Create different stock levels for different combinations
        let quantity = 0;
        
        if (productIndex === 0 && warehouseIndex === 0) {
          quantity = 25; // SOFA-001 in main warehouse
        } else if (productIndex === 1 && warehouseIndex === 1) {
          quantity = 15; // TABLE-002 in branch A
        } else if (productIndex === 2 && warehouseIndex === 0) {
          quantity = 8; // CHAIR-003 in main warehouse
        } else if (productIndex === 3 && warehouseIndex === 2) {
          quantity = 30; // BED-004 in branch B
        } else if (productIndex === 4 && warehouseIndex === 0) {
          quantity = 12; // WARDROBE-005 in main warehouse
        } else {
          // Random quantities for other combinations
          quantity = Math.floor(Math.random() * 20) + 5;
        }

        if (quantity > 0) {
          const unitCost = product.cost_price || product.selling_price || 1000;
          
          stockMovements.push({
            product_id: product.id,
            warehouse_id: warehouse.id,
            movement_type: 'in',
            quantity: quantity,
            unit_cost: unitCost,
            total_cost: quantity * unitCost,
            reference_number: `INIT-${Date.now()}-${productIndex}-${warehouseIndex}`,
            notes: `Initial stock for ${product.name} in ${warehouse.name}`,
            created_at: new Date().toISOString()
          });
        }
      });
    });

    // Insert stock movements in batches
    const batchSize = 10;
    for (let i = 0; i < stockMovements.length; i += batchSize) {
      const batch = stockMovements.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting stock movements batch:', insertError);
        return false;
      }

      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(stockMovements.length/batchSize)}`);
    }

    console.log(`✅ Successfully created ${stockMovements.length} initial stock movements`);
    return true;

  } catch (error) {
    console.error('Error seeding stock data:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up stock movements system...\n');

  // Step 1: Create table
  const tableCreated = await createStockMovementsTable();
  if (!tableCreated) {
    console.error('❌ Failed to create stock_movements table');
    process.exit(1);
  }

  // Step 2: Seed initial data
  const dataSeeded = await seedInitialStockData();
  if (!dataSeeded) {
    console.error('❌ Failed to seed initial stock data');
    process.exit(1);
  }

  console.log('\n🎉 Stock movements system setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test the stock inquiry system');
  console.log('2. Verify real-time stock calculations');
  console.log('3. Test stock movements (in/out/transfer)');
}

// Run if this is the main module
main().catch(console.error);

export { createStockMovementsTable, seedInitialStockData };