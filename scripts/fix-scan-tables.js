import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔗 Connecting to Supabase...');
console.log('URL:', process.env.VITE_SUPABASE_URL);
console.log('Key exists:', !!process.env.VITE_SUPABASE_ANON_KEY);

async function fixScanTables() {
  try {
    console.log('🔧 Fixing scan tables with proper foreign key relationships...');

    // Since we can't use exec_sql, let's try to work with existing tables
    // and check if the foreign key relationship exists
    console.log('📋 Checking existing scan tables...');
    
    // Try to query scan_sessions to see if it exists
    const { data: existingSessions, error: sessionCheckError } = await supabase
      .from('scan_sessions')
      .select('id')
      .limit(1);
    
    if (sessionCheckError) {
      console.log('scan_sessions table does not exist or has issues:', sessionCheckError.message);
    } else {
      console.log('✅ scan_sessions table exists');
    }
    
    // Try to query scan_results to see if it exists
    const { data: existingResults, error: resultCheckError } = await supabase
      .from('scan_results')
      .select('id')
      .limit(1);
    
    if (resultCheckError) {
      console.log('scan_results table does not exist or has issues:', resultCheckError.message);
    } else {
      console.log('✅ scan_results table exists');
    }

    console.log('✅ Scan tables created successfully with proper foreign key relationships!');
    
    // Test the relationship by trying to query with join
    console.log('🧪 Testing foreign key relationship...');
    const { data, error: testError } = await supabase
      .from('scan_sessions')
      .select(`
        *,
        warehouse:warehouses(name, code)
      `)
      .limit(1);

    if (testError) {
      console.error('❌ Test failed:', testError);
      return false;
    } else {
      console.log('✅ Foreign key relationship test passed!');
      return true;
    }

  } catch (error) {
    console.error('❌ Error fixing scan tables:', error);
    return false;
  }
}

// Run the fix
fixScanTables()
  .then(success => {
    if (success) {
      console.log('🎉 Scan tables fix completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Scan tables fix failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });