#!/usr/bin/env node

/**
 * Check Database Schema
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hartshwcchbsnmbrjdyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzc1NzQsImV4cCI6MjA2OTYxMzU3NH0.A1hn4-J2z9h4iuBXQ7xhh2F5UWXHmTPP92tncJfsF24";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Checking database schema...');

const tables = ['products', 'warehouses', 'product_serial_numbers', 'stock_movements'];

for (const table of tables) {
  try {
    console.log(`\n📋 Checking table: ${table}`);
    
    // Try to get table structure by selecting with limit 0
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    } else {
      console.log(`✅ Table ${table}: exists`);
      
      // Try to get one record to see structure
      const { data: sampleData } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (sampleData && sampleData.length > 0) {
        console.log(`📄 Sample data structure:`, Object.keys(sampleData[0]));
      } else {
        console.log(`📄 Table is empty`);
      }
    }
  } catch (err) {
    console.log(`❌ Error checking ${table}:`, err.message);
  }
}

// Try to create a simple product
console.log('\n🧪 Testing simple product creation...');
try {
  const { data, error } = await supabase
    .from('products')
    .insert({ name: 'Test Product' })
    .select();
  
  if (error) {
    console.log('❌ Product creation failed:', error.message);
  } else {
    console.log('✅ Product created successfully:', data);
    
    // Clean up - delete the test product
    await supabase
      .from('products')
      .delete()
      .eq('name', 'Test Product');
    console.log('🧹 Test product cleaned up');
  }
} catch (err) {
  console.log('❌ Product creation error:', err.message);
}

console.log('\n🎉 Schema check completed!');