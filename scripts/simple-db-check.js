// Simple Database Connection Check
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hartshwcchbsnmbrjdyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzc1NzQsImV4cCI6MjA2OTYxMzU3NH0.A1hn4-J2z9h4iuBXQ7xhh2F5UWXHmTPP92tncJfsF24";

console.log('🔍 Simple Database Check');
console.log('========================');
console.log('Project: hartshwcchbsnmbrjdyn');
console.log('URL:', SUPABASE_URL);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConnection() {
  try {
    console.log('🔌 Testing connection...');
    const startTime = Date.now();
    
    // Try to access a simple table first
    const { data, error } = await supabase
      .from('branches')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log(`✅ Connection successful (${responseTime}ms)`);
    console.log('📊 Basic table access working');
    
    return true;
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return false;
  }
}

async function checkCoreTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ ${tableName}: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ ${tableName}: ${count || 0} records`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${tableName}: ${error.message}`);
    return false;
  }
}

async function checkCoreTables() {
  console.log('\n🏢 Checking core tables...');
  
  const tables = [
    'branches',
    'employees',
    'customers',
    'products',
    'warehouses'
  ];
  
  let successCount = 0;
  for (const table of tables) {
    const success = await checkCoreTable(table);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Core tables status: ${successCount}/${tables.length} accessible`);
  return successCount;
}

async function main() {
  const connected = await checkConnection();
  
  if (connected) {
    const coreTablesCount = await checkCoreTables();
    
    console.log('\n🎯 Summary:');
    console.log(`   Connection: ${connected ? '✅ OK' : '❌ Failed'}`);
    console.log(`   Core Tables: ${coreTablesCount}/5 accessible`);
    
    if (connected && coreTablesCount >= 3) {
      console.log('\n🎉 Database is ready for use!');
    } else {
      console.log('\n⚠️  Database needs setup or has issues');
    }
  }
}

main().catch(console.error);