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

async function checkProductsStructure() {
  console.log('🔍 Checking products table structure...\n');

  try {
    // Get sample product data to see structure
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return false;
    }

    if (products && products.length > 0) {
      console.log('📋 Products table structure:');
      console.log(JSON.stringify(products[0], null, 2));
    }

    // Check warehouses structure too
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*')
      .limit(1);

    if (warehousesError) {
      console.error('Error fetching warehouses:', warehousesError);
      return false;
    }

    if (warehouses && warehouses.length > 0) {
      console.log('\n📋 Warehouses table structure:');
      console.log(JSON.stringify(warehouses[0], null, 2));
    }

    // Check stock_movements structure
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('*')
      .limit(1);

    if (movementsError) {
      console.error('Error fetching stock movements:', movementsError);
      return false;
    }

    if (movements && movements.length > 0) {
      console.log('\n📋 Stock movements table structure:');
      console.log(JSON.stringify(movements[0], null, 2));
    }

    return true;

  } catch (error) {
    console.error('Error checking table structures:', error);
    return false;
  }
}

// Run the check
checkProductsStructure().catch(console.error);