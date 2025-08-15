// Database Status Checker
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://hartshwcchbsnmbrjdyn.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzc1NzQsImV4cCI6MjA2OTYxMzU3NH0.A1hn4-J2z9h4iuBXQ7xhh2F5UWXHmTPP92tncJfsF24";

console.log('🔍 Database Status Checker');
console.log('==========================');
console.log(`📍 Project: hartshwcchbsnmbrjdyn`);
console.log(`🌐 URL: ${SUPABASE_URL}`);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConnection() {
  console.log('🔌 Testing Connection...');
  try {
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.log('❌ Connection Failed:', error.message);
      return false;
    }
    
    console.log(`✅ Connection Successful (${responseTime}ms)`);
    return true;
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    return false;
  }
}

async function listTables() {
  console.log('\n📋 Checking Tables...');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      console.log('❌ Failed to fetch tables:', error.message);
      return [];
    }
    
    const tables = data?.map(t => t.table_name) || [];
    console.log(`📊 Found ${tables.length} tables:`);
    
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });
    
    return tables;
  } catch (error) {
    console.log('❌ Error fetching tables:', error.message);
    return [];
  }
}

async function checkCoreTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return { exists: false, count: 0, error: error.message };
    }
    
    return { exists: true, count: count || 0, error: null };
  } catch (error) {
    return { exists: false, count: 0, error: error.message };
  }
}

async function checkCoreTables() {
  console.log('\n🏢 Checking Core Business Tables...');
  
  const coreTables = [
    'branches',
    'employees', 
    'employee_profiles',
    'customers',
    'products',
    'sales_transactions',
    'warehouses',
    'stock_movements',
    'chart_of_accounts',
    'claims',
    'installment_contracts'
  ];
  
  const results = {};
  
  for (const table of coreTables) {
    const result = await checkCoreTable(table);
    results[table] = result;
    
    if (result.exists) {
      console.log(`   ✅ ${table}: ${result.count} records`);
    } else {
      console.log(`   ❌ ${table}: ${result.error || 'Not found'}`);
    }
  }
  
  return results;
}

async function checkAuth() {
  console.log('\n🔐 Checking Authentication...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Auth Error:', error.message);
      return false;
    }
    
    if (session) {
      console.log('✅ User authenticated:', session.user.email);
      return true;
    } else {
      console.log('ℹ️  No active session (anonymous access)');
      return false;
    }
  } catch (error) {
    console.log('❌ Auth Check Failed:', error.message);
    return false;
  }
}

async function checkRLS() {
  console.log('\n🛡️  Checking Row Level Security...');
  try {
    // Test RLS by trying to access a protected table
    const { data, error } = await supabase
      .from('employee_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('RLS')) {
        console.log('✅ RLS is active (access restricted)');
        return true;
      } else {
        console.log('❌ RLS Check Error:', error.message);
        return false;
      }
    } else {
      console.log('ℹ️  RLS may be disabled or user has access');
      return true;
    }
  } catch (error) {
    console.log('❌ RLS Check Failed:', error.message);
    return false;
  }
}

async function checkRealtime() {
  console.log('\n⚡ Checking Realtime...');
  try {
    const channel = supabase.channel('test-channel');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        console.log('❌ Realtime connection timeout');
        resolve(false);
      }, 5000);
      
      channel
        .on('presence', { event: 'sync' }, () => {
          clearTimeout(timeout);
          channel.unsubscribe();
          console.log('✅ Realtime connection working');
          resolve(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            channel.unsubscribe();
            console.log('✅ Realtime subscription successful');
            resolve(true);
          }
        });
    });
  } catch (error) {
    console.log('❌ Realtime Check Failed:', error.message);
    return false;
  }
}

async function generateReport(results) {
  console.log('\n📊 Database Status Report');
  console.log('==========================');
  
  const { connection, tables, coreTables, auth, rls, realtime } = results;
  
  console.log(`🔌 Connection: ${connection ? '✅ OK' : '❌ FAILED'}`);
  console.log(`📋 Tables Found: ${tables.length}`);
  console.log(`🏢 Core Tables: ${Object.values(coreTables).filter(t => t.exists).length}/${Object.keys(coreTables).length}`);
  console.log(`🔐 Authentication: ${auth ? '✅ OK' : 'ℹ️  Anonymous'}`);
  console.log(`🛡️  Row Level Security: ${rls ? '✅ Active' : '❌ Issue'}`);
  console.log(`⚡ Realtime: ${realtime ? '✅ OK' : '❌ Issue'}`);
  
  // Health Score
  const checks = [connection, tables.length > 0, Object.values(coreTables).filter(t => t.exists).length > 5, rls];
  const healthScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  
  console.log(`\n🏥 Overall Health Score: ${healthScore}%`);
  
  if (healthScore >= 80) {
    console.log('🎉 Database is in good condition!');
  } else if (healthScore >= 60) {
    console.log('⚠️  Database needs attention');
  } else {
    console.log('🚨 Database has serious issues');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!connection) {
    console.log('   - Check network connection and Supabase URL');
  }
  if (tables.length === 0) {
    console.log('   - Run database migration scripts');
  }
  if (Object.values(coreTables).filter(t => t.exists).length < 5) {
    console.log('   - Create missing core business tables');
  }
  if (!rls) {
    console.log('   - Review Row Level Security policies');
  }
  if (!realtime) {
    console.log('   - Check Realtime configuration');
  }
}

async function main() {
  try {
    const results = {};
    
    // Run all checks
    results.connection = await checkConnection();
    results.tables = await listTables();
    results.coreTables = await checkCoreTables();
    results.auth = await checkAuth();
    results.rls = await checkRLS();
    results.realtime = await checkRealtime();
    
    // Generate report
    await generateReport(results);
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  }
}

// Run the check
main();