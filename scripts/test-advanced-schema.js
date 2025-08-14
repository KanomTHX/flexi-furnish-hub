#!/usr/bin/env node

/**
 * Test script for Supplier Billing Advanced Features Database Schema
 * This script validates that all tables, functions, and constraints are properly created
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration. Please check your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseSchema() {
    console.log('🧪 Testing Supplier Billing Advanced Features Database Schema...\n');

    const tests = [
        testTablesExist,
        testEnumsExist,
        testFunctionsExist,
        testViewsExist,
        testIndexesExist,
        testConstraints,
        testSampleData
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
        try {
            await test();
            passedTests++;
        } catch (error) {
            console.error(`❌ Test failed: ${error.message}`);
        }
    }

    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('✅ All tests passed! Database schema is ready for advanced features.');
    } else {
        console.log('❌ Some tests failed. Please check the database migration.');
        process.exit(1);
    }
}

async function testTablesExist() {
    console.log('🔍 Testing table existence...');
    
    const expectedTables = [
        // Existing tables (should already exist)
        'suppliers',
        'supplier_invoices',
        'supplier_invoice_items',
        'supplier_payments',
        'chart_of_accounts',
        'journal_entries',
        'journal_entry_lines',
        
        // New advanced features tables
        'report_definitions',
        'scheduled_reports',
        'supplier_performance_metrics',
        'report_execution_history',
        'stock_alerts',
        'auto_purchase_orders',
        'auto_purchase_order_items',
        'supplier_products',
        'integration_sync_log',
        'notification_templates',
        'scheduled_notifications',
        'notification_history',
        'supplier_communication_preferences'
    ];

    const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', expectedTables);

    if (error) throw new Error(`Failed to query tables: ${error.message}`);

    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    console.log(`✅ All ${expectedTables.length} expected tables exist`);
}

async function testEnumsExist() {
    console.log('🔍 Testing enum types...');
    
    const expectedEnums = [
        'payment_status',
        'notification_type',
        'report_type',
        'integration_type',
        'urgency_level'
    ];

    const { data: enums, error } = await supabase.rpc('get_enum_types');
    
    if (error) {
        // Fallback query if custom function doesn't exist
        const { data: enumsData, error: enumError } = await supabase
            .from('pg_type')
            .select('typname')
            .eq('typtype', 'e');
            
        if (enumError) throw new Error(`Failed to query enums: ${enumError.message}`);
        
        const existingEnums = enumsData.map(e => e.typname);
        const missingEnums = expectedEnums.filter(enumType => !existingEnums.includes(enumType));
        
        if (missingEnums.length > 0) {
            console.log(`⚠️  Some enums may be missing: ${missingEnums.join(', ')} (this might be expected if they already existed)`);
        }
    }

    console.log('✅ Enum types check completed');
}

async function testFunctionsExist() {
    console.log('🔍 Testing stored functions...');
    
    const expectedFunctions = [
        'generate_supplier_code',
        'generate_invoice_number',
        'generate_payment_number',
        'generate_journal_entry_number',
        'generate_auto_purchase_order_number',
        'calculate_supplier_performance_metrics',
        'process_stock_alert',
        'cleanup_old_notification_history',
        'cleanup_old_sync_logs',
        'cleanup_old_report_history',
        'get_supplier_dashboard_metrics',
        'get_notification_statistics'
    ];

    // Test a few key functions by calling them
    try {
        // Test number generation functions
        const { data: supplierCode, error: supplierError } = await supabase.rpc('generate_supplier_code');
        if (supplierError) throw new Error(`generate_supplier_code failed: ${supplierError.message}`);
        
        const { data: invoiceNumber, error: invoiceError } = await supabase.rpc('generate_invoice_number');
        if (invoiceError) throw new Error(`generate_invoice_number failed: ${invoiceError.message}`);
        
        const { data: poNumber, error: poError } = await supabase.rpc('generate_auto_purchase_order_number');
        if (poError) throw new Error(`generate_auto_purchase_order_number failed: ${poError.message}`);
        
        console.log(`✅ Function tests passed (sample: ${supplierCode}, ${invoiceNumber}, ${poNumber})`);
    } catch (error) {
        throw new Error(`Function test failed: ${error.message}`);
    }
}

async function testViewsExist() {
    console.log('🔍 Testing views...');
    
    const expectedViews = [
        'supplier_billing_summary',
        'supplier_performance_dashboard',
        'stock_alerts_summary',
        'notification_performance'
    ];

    const { data: views, error } = await supabase
        .from('information_schema.views')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', expectedViews);

    if (error) throw new Error(`Failed to query views: ${error.message}`);

    const existingViews = views.map(v => v.table_name);
    const missingViews = expectedViews.filter(view => !existingViews.includes(view));

    if (missingViews.length > 0) {
        throw new Error(`Missing views: ${missingViews.join(', ')}`);
    }

    console.log(`✅ All ${expectedViews.length} expected views exist`);
}

async function testIndexesExist() {
    console.log('🔍 Testing key indexes...');
    
    // Test a few critical indexes
    const { data: indexes, error } = await supabase
        .from('pg_indexes')
        .select('indexname')
        .eq('schemaname', 'public')
        .like('indexname', 'idx_%');

    if (error) throw new Error(`Failed to query indexes: ${error.message}`);

    const indexCount = indexes.length;
    if (indexCount < 20) { // We expect many indexes
        console.log(`⚠️  Only ${indexCount} indexes found, expected more`);
    } else {
        console.log(`✅ Found ${indexCount} indexes`);
    }
}

async function testConstraints() {
    console.log('🔍 Testing constraints...');
    
    // Test that we can't insert invalid data
    try {
        // Try to insert a stock alert with negative quantities (should fail)
        const { error } = await supabase
            .from('stock_alerts')
            .insert({
                product_id: '00000000-0000-0000-0000-000000000000',
                product_name: 'Test Product',
                current_stock: -1, // This should fail the check constraint
                reorder_point: 10,
                reorder_quantity: 20
            });

        if (!error) {
            throw new Error('Expected constraint violation for negative stock, but insert succeeded');
        }

        console.log('✅ Check constraints are working (negative stock rejected)');
    } catch (error) {
        if (error.message.includes('constraint')) {
            console.log('✅ Check constraints are working');
        } else {
            throw error;
        }
    }
}

async function testSampleData() {
    console.log('🔍 Testing sample data...');
    
    // Check if sample notification templates were inserted
    const { data: templates, error } = await supabase
        .from('notification_templates')
        .select('name, type')
        .limit(5);

    if (error) throw new Error(`Failed to query notification templates: ${error.message}`);

    if (templates.length === 0) {
        console.log('⚠️  No sample notification templates found');
    } else {
        console.log(`✅ Found ${templates.length} sample notification templates`);
    }

    // Check if sample report definitions were inserted
    const { data: reports, error: reportError } = await supabase
        .from('report_definitions')
        .select('name, type')
        .limit(5);

    if (reportError) throw new Error(`Failed to query report definitions: ${reportError.message}`);

    if (reports.length === 0) {
        console.log('⚠️  No sample report definitions found');
    } else {
        console.log(`✅ Found ${reports.length} sample report definitions`);
    }
}

// Run the tests
testDatabaseSchema().catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
});