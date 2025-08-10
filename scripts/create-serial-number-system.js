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

async function createSerialNumberSystem() {
  console.log('🔧 Creating Serial Number System with Price Tracking...\n');

  try {
    // Step 1: Check if product_serial_numbers table exists
    console.log('📋 Step 1: Checking product_serial_numbers table...');
    
    const { data: testSN, error: testSNError } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .limit(1);

    if (testSNError && testSNError.message.includes('does not exist')) {
      console.log('❌ product_serial_numbers table does not exist');
      console.log('📝 Creating table structure...');
      
      // Since we can't create tables directly, provide SQL script
      console.log('\n📋 Please run this SQL in Supabase SQL Editor:');
      console.log(`
-- Create product_serial_numbers table with price tracking
CREATE TABLE IF NOT EXISTS product_serial_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  
  -- Price information (captured at receiving time)
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  supplier_price DECIMAL(10,2), -- Original supplier price
  
  -- Status and tracking
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'transferred')),
  
  -- Receiving information
  received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_by UUID,
  supplier_id UUID,
  invoice_number VARCHAR(100),
  batch_number VARCHAR(100),
  
  -- Sale information (when sold)
  sold_date TIMESTAMP WITH TIME ZONE,
  sold_to VARCHAR(255),
  sale_price DECIMAL(10,2), -- Actual sale price (may differ from selling_price)
  
  -- Additional tracking
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_product_id ON product_serial_numbers (product_id);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_warehouse_id ON product_serial_numbers (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_status ON product_serial_numbers (status);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_serial_number ON product_serial_numbers (serial_number);

-- Enable RLS
ALTER TABLE product_serial_numbers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON product_serial_numbers FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON product_serial_numbers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON product_serial_numbers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON product_serial_numbers FOR DELETE USING (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_serial_numbers_updated_at 
    BEFORE UPDATE ON product_serial_numbers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      
      console.log('\n⚠️ Please create the table first, then run this script again.');
      return false;
    }

    console.log('✅ product_serial_numbers table exists');

    // Step 2: Test the table structure
    console.log('\n📋 Step 2: Testing table structure...');
    
    const { data: sampleSN, error: sampleError } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error accessing table:', sampleError);
      return false;
    }

    console.log('✅ Table structure accessible');

    // Step 3: Get products and warehouses for demo data
    console.log('\n📋 Step 3: Getting products and warehouses...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .limit(3);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return false;
    }

    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active')
      .limit(2);

    if (warehousesError) {
      console.error('❌ Error fetching warehouses:', warehousesError);
      return false;
    }

    console.log(`✅ Found ${products.length} products and ${warehouses.length} warehouses`);

    // Step 4: Create sample serial numbers with different prices
    console.log('\n📋 Step 4: Creating sample serial numbers with price tracking...');
    
    const serialNumbers = [];
    const currentDate = new Date();
    
    products.forEach((product, productIndex) => {
      warehouses.forEach((warehouse, warehouseIndex) => {
        // Create 3-5 serial numbers per product-warehouse combination
        const quantity = Math.floor(Math.random() * 3) + 3; // 3-5 items
        
        for (let i = 0; i < quantity; i++) {
          // Generate unique serial number
          const serialNumber = `${product.product_code}-${warehouse.code}-${String(productIndex * 100 + warehouseIndex * 10 + i + 1).padStart(4, '0')}`;
          
          // Simulate price variations (±10% from base price)
          const baseCostPrice = product.cost_price || 1000;
          const baseSellingPrice = product.selling_price || 1500;
          
          const priceVariation = (Math.random() - 0.5) * 0.2; // ±10%
          const costPrice = Math.round(baseCostPrice * (1 + priceVariation));
          const sellingPrice = Math.round(baseSellingPrice * (1 + priceVariation));
          const supplierPrice = Math.round(costPrice * 0.95); // Slightly lower than cost
          
          // Simulate different receiving dates (last 30 days)
          const receivedDate = new Date(currentDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
          
          serialNumbers.push({
            serial_number: serialNumber,
            product_id: product.id,
            warehouse_id: warehouse.id,
            cost_price: costPrice,
            selling_price: sellingPrice,
            supplier_price: supplierPrice,
            status: 'available',
            received_date: receivedDate.toISOString(),
            invoice_number: `INV-${Math.floor(Math.random() * 10000)}`,
            batch_number: `BATCH-${productIndex + 1}-${warehouseIndex + 1}`,
            notes: `Received on ${receivedDate.toLocaleDateString('th-TH')} with price ฿${costPrice.toLocaleString()}`
          });
        }
      });
    });

    // Insert serial numbers in batches
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < serialNumbers.length; i += batchSize) {
      const batch = serialNumbers.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('product_serial_numbers')
        .insert(batch);

      if (insertError) {
        console.error('❌ Error inserting batch:', insertError);
        return false;
      }

      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(serialNumbers.length/batchSize)} (${insertedCount}/${serialNumbers.length})`);
    }

    // Step 5: Verify the data
    console.log('\n📋 Step 5: Verifying serial number data...');
    
    const { data: allSNs, error: verifyError } = await supabase
      .from('product_serial_numbers')
      .select(`
        *,
        products (name, product_code),
        warehouses (name, code)
      `)
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return false;
    }

    console.log('\n📊 Serial Number System Summary:');
    console.log(`Total serial numbers: ${allSNs.length}`);
    
    // Group by status
    const statusCounts = {};
    allSNs.forEach(sn => {
      statusCounts[sn.status] = (statusCounts[sn.status] || 0) + 1;
    });
    
    console.log('Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} items`);
    });

    // Price analysis
    const prices = allSNs.map(sn => sn.cost_price);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    console.log('\nPrice analysis:');
    console.log(`  - Average cost price: ฿${avgPrice.toLocaleString()}`);
    console.log(`  - Price range: ฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`);

    // Sample data display
    console.log('\n📋 Sample serial numbers:');
    allSNs.slice(0, 5).forEach(sn => {
      console.log(`  ${sn.serial_number}:`);
      console.log(`    Product: ${sn.products.name} (${sn.products.product_code})`);
      console.log(`    Warehouse: ${sn.warehouses.name} (${sn.warehouses.code})`);
      console.log(`    Cost: ฿${sn.cost_price.toLocaleString()}, Selling: ฿${sn.selling_price.toLocaleString()}`);
      console.log(`    Status: ${sn.status}, Received: ${new Date(sn.received_date).toLocaleDateString('th-TH')}`);
      console.log('');
    });

    console.log('🎉 Serial Number System with Price Tracking created successfully!');
    console.log('\n✅ System Features:');
    console.log('✅ Individual price tracking per serial number');
    console.log('✅ Historical price data preservation');
    console.log('✅ Supplier price tracking');
    console.log('✅ Receiving date and batch tracking');
    console.log('✅ Status management (available, reserved, sold, etc.)');
    console.log('✅ Invoice and batch number tracking');
    console.log('✅ Ready for integration with receiving system');

    return true;

  } catch (error) {
    console.error('❌ Error creating serial number system:', error);
    return false;
  }
}

// Run the function
createSerialNumberSystem().catch(console.error);