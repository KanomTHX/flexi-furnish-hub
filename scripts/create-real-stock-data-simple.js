import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRealStockData() {
  console.log('🚀 Creating real stock data from database...\n');

  try {
    // Step 1: Check existing data
    console.log('📋 Checking existing data...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return false;
    }

    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active');

    if (warehousesError) {
      console.error('Error fetching warehouses:', warehousesError);
      return false;
    }

    if (!products || !warehouses || products.length === 0 || warehouses.length === 0) {
      console.log('⚠️ No active products or warehouses found.');
      console.log('Please ensure you have products and warehouses in your database.');
      return false;
    }

    console.log(`📦 Found ${products.length} products and ${warehouses.length} warehouses`);

    // Step 2: Clear existing stock movements
    console.log('🧹 Clearing existing stock movements...');
    
    const { error: clearError } = await supabase
      .from('stock_movements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (clearError) {
      console.log('Note: Could not clear existing movements:', clearError.message);
    } else {
      console.log('✅ Existing movements cleared');
    }

    // Step 3: Create realistic stock movements
    console.log('📥 Creating inbound stock movements...');
    
    const stockMovements = [];
    const currentTime = new Date();

    // Create inbound movements for each product-warehouse combination
    products.forEach((product, productIndex) => {
      warehouses.forEach((warehouse, warehouseIndex) => {
        let quantity = 0;
        
        // Create realistic stock distribution based on product and warehouse
        switch (product.product_code) {
          case 'SOFA-001':
            if (warehouse.code === 'WH-001') quantity = 25; // Main warehouse
            else if (warehouse.code === 'WH-002') quantity = 10; // Branch A
            else if (warehouse.code === 'WH-003') quantity = 8; // Branch B
            break;
          case 'TABLE-002':
            if (warehouse.code === 'WH-001') quantity = 15;
            else if (warehouse.code === 'WH-002') quantity = 20; // Branch A specializes in tables
            else if (warehouse.code === 'WH-003') quantity = 12;
            break;
          case 'CHAIR-003':
            if (warehouse.code === 'WH-001') quantity = 18; // Main warehouse has most chairs
            else if (warehouse.code === 'WH-002') quantity = 8;
            else if (warehouse.code === 'WH-003') quantity = 5;
            break;
          case 'BED-004':
            if (warehouse.code === 'WH-001') quantity = 12;
            else if (warehouse.code === 'WH-002') quantity = 15;
            else if (warehouse.code === 'WH-003') quantity = 25; // Branch B specializes in beds
            break;
          case 'WARDROBE-005':
            if (warehouse.code === 'WH-001') quantity = 20; // Main warehouse
            else if (warehouse.code === 'WH-002') quantity = 8;
            else if (warehouse.code === 'WH-003') quantity = 6;
            break;
          default:
            // For any other products, create random quantities
            quantity = Math.floor(Math.random() * 20) + 5;
        }

        if (quantity > 0) {
          const unitCost = product.cost_price || product.selling_price || 1000;
          const totalCost = quantity * unitCost;
          
          // Create inbound movement (receiving goods)
          stockMovements.push({
            product_id: product.id,
            warehouse_id: warehouse.id,
            movement_type: 'in',
            quantity: quantity,
            unit_cost: unitCost,
            total_cost: totalCost,
            reference_number: `RECV-${Date.now()}-${productIndex}-${warehouseIndex}`,
            notes: `Initial stock receiving: ${product.name} to ${warehouse.name}`,
            created_at: new Date(currentTime.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random date within last week
          });
        }
      });
    });

    // Insert inbound movements
    if (stockMovements.length > 0) {
      const { error: inboundError } = await supabase
        .from('stock_movements')
        .insert(stockMovements);

      if (inboundError) {
        console.error('Error inserting inbound movements:', inboundError);
        return false;
      }

      console.log(`✅ Created ${stockMovements.length} inbound movements`);
    }

    // Step 4: Create outbound movements (sales)
    console.log('📤 Creating outbound stock movements (sales)...');
    
    const outboundMovements = [];
    
    stockMovements.forEach((inbound, index) => {
      // Create sales for 70% of the stock items
      if (Math.random() > 0.3) {
        // Sell 10-40% of the received stock
        const salePercentage = Math.random() * 0.3 + 0.1; // 10-40%
        const saleQuantity = Math.floor(inbound.quantity * salePercentage);
        
        if (saleQuantity > 0) {
          outboundMovements.push({
            product_id: inbound.product_id,
            warehouse_id: inbound.warehouse_id,
            movement_type: 'out',
            quantity: saleQuantity,
            unit_cost: inbound.unit_cost,
            total_cost: saleQuantity * inbound.unit_cost,
            reference_number: `SALE-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
            notes: `Sale transaction`,
            created_at: new Date(currentTime.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 3 days
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

    // Step 5: Verify and display results
    console.log('\n📊 Verifying stock data...');
    
    const { data: allMovements, error: verifyError } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products (name, product_code),
        warehouses (name, code)
      `)
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('Error verifying data:', verifyError);
      return false;
    }

    console.log('\n📈 Stock Movement Summary:');
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
          totalValue: 0
        });
      }
      
      const stock = stockLevels.get(key);
      if (movement.movement_type === 'in') {
        stock.quantity += movement.quantity;
        stock.totalValue += movement.total_cost || 0;
      } else if (movement.movement_type === 'out') {
        stock.quantity -= movement.quantity;
        stock.totalValue -= movement.total_cost || 0;
      }
    });

    console.log('\n📦 Current Stock Levels:');
    let totalUnits = 0;
    let totalValue = 0;
    
    Array.from(stockLevels.values())
      .filter(stock => stock.quantity > 0)
      .sort((a, b) => a.productCode.localeCompare(b.productCode))
      .forEach(stock => {
        console.log(`${stock.productCode} (${stock.productName})`);
        console.log(`  └─ ${stock.warehouseCode} (${stock.warehouseName}): ${stock.quantity} units`);
        totalUnits += stock.quantity;
        totalValue += stock.totalValue;
      });

    console.log(`\n📊 Summary:`);
    console.log(`Total units in stock: ${totalUnits}`);
    console.log(`Total stock value: ฿${totalValue.toLocaleString()}`);
    console.log(`Active products: ${products.length}`);
    console.log(`Active warehouses: ${warehouses.length}`);

    console.log('\n🎉 Real stock data created successfully!');
    console.log('\n✅ Next steps:');
    console.log('1. Test the stock inquiry system at /warehouses');
    console.log('2. Verify real-time stock calculations');
    console.log('3. Check search and filter functionality');
    console.log('4. Test the warehouse management interface');

    return true;

  } catch (error) {
    console.error('Error creating real stock data:', error);
    return false;
  }
}

// Run the function
createRealStockData().catch(console.error);