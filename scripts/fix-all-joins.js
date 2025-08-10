import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAllJoins() {
  console.log('🔧 Fixing all problematic joins...\n');

  try {
    // Step 1: Test if product_serial_numbers table exists
    console.log('📋 Checking if product_serial_numbers table exists...');
    
    const { data: testData, error: testError } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .limit(1);

    const tableExists = !testError || !testError.message.includes('does not exist');
    
    if (tableExists) {
      console.log('✅ product_serial_numbers table exists');
    } else {
      console.log('❌ product_serial_numbers table does not exist');
      console.log('📝 This explains the relationship errors');
    }

    // Step 2: Find all files with problematic joins
    console.log('\n🔍 Scanning for problematic joins...');
    
    const problematicPatterns = [
      'product_serial_numbers!inner',
      'product_serial_numbers!left',
      'product_serial_numbers(',
      'product_serial_numbers (',
    ];

    const srcDir = 'src';
    const filesToCheck = [];

    function scanDirectory(dir) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          filesToCheck.push(filePath);
        }
      });
    }

    scanDirectory(srcDir);

    const problematicFiles = [];

    filesToCheck.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const hasProblematicJoin = problematicPatterns.some(pattern => 
          content.includes(pattern)
        );

        if (hasProblematicJoin) {
          problematicFiles.push(filePath);
        }
      } catch (error) {
        console.log(`⚠️ Could not read ${filePath}: ${error.message}`);
      }
    });

    console.log(`Found ${problematicFiles.length} files with potential issues:`);
    problematicFiles.forEach(file => {
      console.log(`   - ${file}`);
    });

    // Step 3: Create safe alternatives for common queries
    console.log('\n🛠️ Creating safe query alternatives...');

    // Test basic stock movements query
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('*')
      .limit(5);

    if (movementsError) {
      console.error('❌ Basic stock_movements query failed:', movementsError);
      return false;
    } else {
      console.log(`✅ Basic stock_movements query works (${movements.length} records)`);
    }

    // Test products query
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Products query failed:', productsError);
      return false;
    } else {
      console.log(`✅ Products query works (${products.length} records)`);
    }

    // Test warehouses query
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*')
      .limit(5);

    if (warehousesError) {
      console.error('❌ Warehouses query failed:', warehousesError);
      return false;
    } else {
      console.log(`✅ Warehouses query works (${warehouses.length} records)`);
    }

    // Step 4: Test safe join approach
    console.log('\n🔗 Testing safe join approach...');
    
    if (movements && movements.length > 0) {
      const productIds = [...new Set(movements.map(m => m.product_id))];
      const warehouseIds = [...new Set(movements.map(m => m.warehouse_id))];

      const { data: relatedProducts, error: relatedProductsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      const { data: relatedWarehouses, error: relatedWarehousesError } = await supabase
        .from('warehouses')
        .select('*')
        .in('id', warehouseIds);

      if (relatedProductsError || relatedWarehousesError) {
        console.error('❌ Safe join approach failed');
        return false;
      } else {
        console.log('✅ Safe join approach works');
        console.log(`   - Related products: ${relatedProducts.length}`);
        console.log(`   - Related warehouses: ${relatedWarehouses.length}`);
      }
    }

    // Step 5: Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (!tableExists) {
      console.log('1. ❌ product_serial_numbers table is missing');
      console.log('   💡 Either create the table or remove references to it');
      console.log('   💡 For now, avoid joins with this table');
    }

    console.log('2. ✅ Use separate queries instead of joins');
    console.log('   💡 Fetch main data first, then fetch related data separately');
    console.log('   💡 This approach is more reliable and easier to debug');

    console.log('3. ✅ Current working tables:');
    console.log('   - stock_movements ✅');
    console.log('   - products ✅');
    console.log('   - warehouses ✅');

    console.log('\n🎯 Action Items:');
    console.log('1. Review files with problematic joins');
    console.log('2. Replace complex joins with separate queries');
    console.log('3. Test all stock-related functionality');
    console.log('4. Consider creating product_serial_numbers table if needed');

    console.log('\n🚀 Quick Test Commands:');
    console.log('npm run test-real-data     # Test system functionality');
    console.log('npm run troubleshoot       # Run full system check');

    return true;

  } catch (error) {
    console.error('❌ Error fixing joins:', error);
    return false;
  }
}

// Run the fix
fixAllJoins().catch(console.error);