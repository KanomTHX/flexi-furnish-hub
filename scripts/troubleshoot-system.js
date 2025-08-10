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

async function troubleshootSystem() {
  console.log('🔍 System Troubleshooting Tool...\n');

  const issues = [];
  const fixes = [];

  try {
    // Check 1: Database Connection
    console.log('🔌 Checking database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (connectionError) {
      issues.push('Database connection failed');
      fixes.push('Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
      console.log('❌ Database connection failed');
    } else {
      console.log('✅ Database connection successful');
    }

    // Check 2: Required Tables
    console.log('\n📋 Checking required tables...');
    const requiredTables = ['products', 'warehouses', 'stock_movements'];
    
    for (const table of requiredTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        issues.push(`Table '${table}' not accessible`);
        fixes.push(`Create or check permissions for table '${table}'`);
        console.log(`❌ Table '${table}' not accessible`);
      } else {
        console.log(`✅ Table '${table}' accessible`);
      }
    }

    // Check 3: Data Existence
    console.log('\n📊 Checking data existence...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    if (productsError || !products || products.length === 0) {
      issues.push('No active products found');
      fixes.push('Run: npm run create-stock-minimal to create sample data');
      console.log('❌ No active products found');
    } else {
      console.log(`✅ Found ${products.length} active products`);
    }

    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active');

    if (warehousesError || !warehouses || warehouses.length === 0) {
      issues.push('No active warehouses found');
      fixes.push('Run: npm run create-stock-minimal to create sample data');
      console.log('❌ No active warehouses found');
    } else {
      console.log(`✅ Found ${warehouses.length} active warehouses`);
    }

    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('*');

    if (movementsError || !movements || movements.length === 0) {
      issues.push('No stock movements found');
      fixes.push('Run: npm run create-stock-minimal to create sample data');
      console.log('❌ No stock movements found');
    } else {
      console.log(`✅ Found ${movements.length} stock movements`);
    }

    // Check 4: Data Relationships
    console.log('\n🔗 Checking data relationships...');
    
    if (movements && movements.length > 0) {
      const orphanedMovements = movements.filter(movement => {
        const hasProduct = products?.some(p => p.id === movement.product_id);
        const hasWarehouse = warehouses?.some(w => w.id === movement.warehouse_id);
        return !hasProduct || !hasWarehouse;
      });

      if (orphanedMovements.length > 0) {
        issues.push(`${orphanedMovements.length} orphaned stock movements found`);
        fixes.push('Clean up orphaned movements or restore missing products/warehouses');
        console.log(`❌ Found ${orphanedMovements.length} orphaned movements`);
      } else {
        console.log('✅ All stock movements have valid relationships');
      }
    }

    // Check 5: Stock Calculations
    console.log('\n🧮 Checking stock calculations...');
    
    if (movements && movements.length > 0 && products && warehouses) {
      const stockLevels = new Map();
      let negativeStockCount = 0;

      movements.forEach(movement => {
        const key = `${movement.product_id}-${movement.warehouse_id}`;
        if (!stockLevels.has(key)) {
          stockLevels.set(key, 0);
        }
        
        if (movement.movement_type === 'in') {
          stockLevels.set(key, stockLevels.get(key) + movement.quantity);
        } else if (movement.movement_type === 'out') {
          stockLevels.set(key, stockLevels.get(key) - movement.quantity);
        }
      });

      Array.from(stockLevels.values()).forEach(quantity => {
        if (quantity < 0) negativeStockCount++;
      });

      if (negativeStockCount > 0) {
        issues.push(`${negativeStockCount} items have negative stock`);
        fixes.push('Review stock movements for data integrity issues');
        console.log(`⚠️ Found ${negativeStockCount} items with negative stock`);
      } else {
        console.log('✅ All stock calculations are positive');
      }

      const positiveStock = Array.from(stockLevels.values()).filter(q => q > 0);
      console.log(`✅ ${positiveStock.length} items have positive stock`);
    }

    // Check 6: Product Pricing
    console.log('\n💰 Checking product pricing...');
    
    if (products) {
      const productsWithoutPricing = products.filter(p => 
        !p.cost_price || p.cost_price <= 0 || !p.selling_price || p.selling_price <= 0
      );

      if (productsWithoutPricing.length > 0) {
        issues.push(`${productsWithoutPricing.length} products missing proper pricing`);
        fixes.push('Run: npm run create-stock-enhanced to update product pricing');
        console.log(`⚠️ ${productsWithoutPricing.length} products missing proper pricing`);
      } else {
        console.log('✅ All products have proper pricing');
      }
    }

    // Check 7: Environment Configuration
    console.log('\n⚙️ Checking environment configuration...');
    
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length > 0) {
      issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      fixes.push('Check .env.local file and ensure all required variables are set');
      console.log(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    } else {
      console.log('✅ All required environment variables are set');
    }

    // Summary Report
    console.log('\n' + '='.repeat(50));
    console.log('📋 TROUBLESHOOTING SUMMARY');
    console.log('='.repeat(50));

    if (issues.length === 0) {
      console.log('🎉 NO ISSUES FOUND!');
      console.log('✅ System is working properly');
      console.log('✅ All checks passed');
      console.log('✅ Ready for use');
    } else {
      console.log(`⚠️ FOUND ${issues.length} ISSUE(S):`);
      console.log('');
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ❌ ${issue}`);
        console.log(`   💡 Fix: ${fixes[index]}`);
        console.log('');
      });

      console.log('🔧 RECOMMENDED ACTIONS:');
      console.log('1. Address the issues listed above');
      console.log('2. Run this troubleshoot script again to verify fixes');
      console.log('3. Run: npm run test-real-data to verify system functionality');
    }

    console.log('\n🚀 QUICK FIX COMMANDS:');
    console.log('npm run create-stock-minimal    # Create basic stock data');
    console.log('npm run create-stock-enhanced   # Add enhanced data with pricing');
    console.log('npm run fix-relationships       # Fix relationship issues');
    console.log('npm run test-real-data          # Test system functionality');

    return issues.length === 0;

  } catch (error) {
    console.error('❌ Troubleshooting failed:', error);
    console.log('\n💡 If this error persists:');
    console.log('1. Check your internet connection');
    console.log('2. Verify Supabase project is active');
    console.log('3. Check .env.local file configuration');
    return false;
  }
}

// Run troubleshooting
troubleshootSystem()
  .then(success => {
    if (success) {
      console.log('\n🎊 System Status: HEALTHY');
      process.exit(0);
    } else {
      console.log('\n⚠️ System Status: NEEDS ATTENTION');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Troubleshooting execution error:', error);
    process.exit(1);
  });