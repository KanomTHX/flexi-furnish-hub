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

async function checkStockTableStructure() {
  console.log('🔍 Checking stock_movements table structure...\n');

  try {
    // Try to get table structure by querying with limit 0
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .limit(0);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ stock_movements table does not exist');
        console.log('\n📋 To create the table, run this SQL in Supabase SQL Editor:');
        console.log(`
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON stock_movements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON stock_movements FOR DELETE USING (true);
        `);
        return false;
      } else {
        console.error('Error checking table:', error);
        return false;
      }
    }

    console.log('✅ stock_movements table exists');

    // Try to insert a minimal test record to see what columns are available
    const testRecord = {
      product_id: '00000000-0000-0000-0000-000000000001', // This will fail but show us the structure
      warehouse_id: '00000000-0000-0000-0000-000000000001',
      movement_type: 'in',
      quantity: 1
    };

    const { error: insertError } = await supabase
      .from('stock_movements')
      .insert([testRecord]);

    if (insertError) {
      console.log('📋 Table structure analysis from error:');
      console.log('Error:', insertError.message);
      
      if (insertError.message.includes('violates foreign key constraint')) {
        console.log('✅ Basic columns (product_id, warehouse_id, movement_type, quantity) exist');
        console.log('✅ Foreign key constraints are working');
      }
    }

    // Check existing data
    const { data: existingData, error: selectError } = await supabase
      .from('stock_movements')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('Error selecting data:', selectError);
    } else {
      console.log(`\n📊 Current data: ${existingData.length} records found`);
      if (existingData.length > 0) {
        console.log('Sample record structure:');
        console.log(JSON.stringify(existingData[0], null, 2));
      }
    }

    return true;

  } catch (error) {
    console.error('Error checking table structure:', error);
    return false;
  }
}

// Run the check
checkStockTableStructure().catch(console.error);