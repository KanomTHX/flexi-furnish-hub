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

async function createRealStockData() {
  console.log('🚀 Creating real stock data...\n');

  try {
    // First, check if we have products and warehouses
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

    // Check if stock_movements table exists by trying to query it
    const { data: existingMovements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('id')
      .limit(1);

    if (movementsError && movementsError.message.includes('does not exist')) {
      console.log('⚠️ stock_movements table does not exist. Please create it first using SQL editor.');
      console.log('📋 Run the SQL script: scripts/create-stock-movements-simple.sql');
      return false;
    }

    // Clear existing movements if any
    if (existingMovements && existingMovements.length > 0) {
      console.log('🧹 Clearing existing stock movements...');
      const { error: deleteError } = await supabase
        .from('stock_movements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('Error clearing existing movements:', deleteError);
      } else {
        console.log('✅ Existing movements cleared');
      }
    }

    // Create initial stock movements (receiving goods)
    console.log('📥 Creating inbound stock movements...');
    const inboundMovements = [];

    products.forEach((product, productIndex) => {
      warehouses.forEach((warehouse, warehouseIndex) => {
        let quantity = 0;
        
        // Create realistic stock distribution
        if (product.product_code === 'SOFA-001' && warehouse.code === 'WH-001') {
          quantity = 25; // Main warehouse has most sofas
        } else if (product.product_code === 'TABLE-002' && warehouse.code === 'WH-002') {
          quantity = 15; // Branch A has tables
        } else if (product.product_code === 'CHAIR-003' && warehouse.code === 'WH-001') {
          quantity = 8; // Main warehouse has chairs
        } else if (product.product_code === 'BED-004' && warehouse.code === 'WH-003') {
          quantity = 30; // Branch B has beds
        } else if (product.product_code === 'WARDROBE-005' && warehouse.code === 'WH-001') {
          quantity = 12; // Main warehouse has wardrobes
        } else {
          // Random quantities for other combinations (some will be 0)
          quantity = Math.random() > 0.5 ? Math.floor(Math.random() * 15) + 5 : 0;
        }

        if (quantity > 0) {
          const unitCost = product.cost_price || product.selling_price || 1000;
          
          inboundMovements.push({
            product_id: product.id,
            warehouse_id: warehouse.id,
            movement_type: 'in',
            quantity: quantity,
            unit_cost: unitCost,
            total_cost: quantity * unitCost,
            reference_number: `INIT-${Date.now()}-${productIndex}-${warehouseIndex}`,
            notes: `Initial stock for ${product.name} in ${warehouse.name}`,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random date within last week
          });
        }
      });
    });

    // Insert inbound movements
    if (inboundMovements.length > 0) {
      const { error: inboundError } = await supabase
        .from('stock_movements')
        .insert(inboundMovements);

      if (inboundError) {
        console.error('Error inserting inbound movements:', inboundError);
        return false;
      }

      console.log(`✅ Created ${inboundMovements.length} inbound movements`);
    }

    // Create some outbound movements to simulate sales
    console.log('📤 Creating outbound stock movements...');
    const outboundMovements = [];

    inboundMovements.forEach((inbound) => {
      // Create outbound movements for some items (simulate sales)
      if (Math.random() > 0.3) { // 70% chance of having sales
        const saleQuantity = Math.floor(inbound.quantity * (Math.random() * 0.4 + 0.1)); // 10-50% of stock sold
        
        if (saleQuantity > 0) {
          outboundMovements.push({
            product_id: inbound.product_id,
            warehouse_id: inbound.warehouse_id,
            movement_type: 'out',
            quantity: saleQuantity,
            unit_cost: inbound.unit_cost,
            total_cost: saleQuantity * inbound.unit_cost,
            reference_number: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            notes: `Sale from warehouse`,
            created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 3 days
          });
        }
      }
    });

    if (outboundMovements.length > 0) {
      const { error: outboundError } = await supabase
        .from('stock_movements')
        .insert(outboundMovements);

      if (outboundError) {
        console.error('Error inserting outbound movements:', outboundError);
        return false;
      }

      console.log(`✅ Created ${outboundMovements.length} outbound movements`);
    }

    // Verify the data
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

    console.log('\n📊 Stock Data Summary:');
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
    Array.from(stockLevels.values()).forEach(stock => {
      if (stock.quantity > 0) {
        console.log(`${stock.productCode} (${stock.productName}) in ${stock.warehouseCode}: ${stock.quantity} units`);
      }
    });

    console.log('\n🎉 Real stock data created successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the stock inquiry system');
    console.log('2. Verify real-time stock calculations');
    console.log('3. Check the warehouse management interface');

    return true;

  } catch (error) {
    console.error('Error creating stock data:', error);
    return false;
  }
}

// Run the function
createRealStockData().catch(console.error);