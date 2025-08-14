# PowerShell script to check if reconciliation tables exist

Write-Host "Checking Reconciliation System Tables..." -ForegroundColor Green

# SQL queries to check table existence
$checkTablesSQL = @"
-- Check if reconciliation tables exist
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('reconciliation_reports', 'reconciliation_items', 'reconciliation_adjustments')
ORDER BY tablename;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('reconciliation_reports', 'reconciliation_items', 'reconciliation_adjustments')
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('reconciliation_reports', 'reconciliation_items', 'reconciliation_adjustments')
ORDER BY tablename, indexname;

-- Check functions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('generate_reconciliation_report_number', 'update_reconciled_balance')
ORDER BY routine_name;

-- Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('reconciliation_reports', 'reconciliation_items', 'reconciliation_adjustments')
ORDER BY event_object_table, trigger_name;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('reconciliation_reports', 'reconciliation_items', 'reconciliation_adjustments')
ORDER BY tablename, policyname;

-- Check sample data
SELECT 'reconciliation_reports' as table_name, COUNT(*) as record_count FROM reconciliation_reports
UNION ALL
SELECT 'reconciliation_items' as table_name, COUNT(*) as record_count FROM reconciliation_items
UNION ALL
SELECT 'reconciliation_adjustments' as table_name, COUNT(*) as record_count FROM reconciliation_adjustments;
"@

# Save the SQL to a file for easy execution
$checkTablesSQL | Out-File -FilePath "check_reconciliation_tables.sql" -Encoding UTF8

Write-Host "`nSQL queries saved to: check_reconciliation_tables.sql" -ForegroundColor Green
Write-Host "Copy and paste this content into your Supabase SQL Editor to check table status." -ForegroundColor Cyan

Write-Host "`n=== SQL Content ===" -ForegroundColor Yellow
Write-Host $checkTablesSQL

Write-Host "`n=== Expected Tables ===" -ForegroundColor Yellow
Write-Host "1. reconciliation_reports - Main reconciliation records"
Write-Host "2. reconciliation_items - Individual reconciliation items"
Write-Host "3. reconciliation_adjustments - Manual adjustments"

Write-Host "`n=== Expected Functions ===" -ForegroundColor Yellow
Write-Host "1. generate_reconciliation_report_number() - Auto-generate report numbers"
Write-Host "2. update_reconciled_balance() - Auto-update balances"
Write-Host "3. update_updated_at_column() - Update timestamps"

Write-Host "`n=== Expected Triggers ===" -ForegroundColor Yellow
Write-Host "1. trigger_update_reconciled_balance_items"
Write-Host "2. trigger_update_reconciled_balance_adjustments"
Write-Host "3. trigger_reconciliation_reports_updated_at"
Write-Host "4. trigger_reconciliation_items_updated_at"

Write-Host "`n=== Expected Indexes ===" -ForegroundColor Yellow
Write-Host "1. idx_reconciliation_reports_account_id"
Write-Host "2. idx_reconciliation_reports_status"
Write-Host "3. idx_reconciliation_reports_period"
Write-Host "4. idx_reconciliation_reports_created_at"
Write-Host "5. idx_reconciliation_items_reconciliation_id"
Write-Host "6. idx_reconciliation_items_type"
Write-Host "7. idx_reconciliation_items_is_reconciled"
Write-Host "8. idx_reconciliation_adjustments_reconciliation_id"
Write-Host "9. idx_reconciliation_adjustments_journal_entry_id"

Write-Host "`nRun the SQL queries in Supabase SQL Editor to verify all components are created." -ForegroundColor Green