-- Simple check for reconciliation tables existence
-- Copy and paste this into Supabase SQL Editor

-- 1. Check if tables exist
SELECT 
    'reconciliation_reports' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reconciliation_reports'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'reconciliation_items' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reconciliation_items'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'reconciliation_adjustments' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reconciliation_adjustments'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. Check table record counts
SELECT 
    'reconciliation_reports' as table_name, 
    COUNT(*) as record_count 
FROM reconciliation_reports
UNION ALL
SELECT 
    'reconciliation_items' as table_name, 
    COUNT(*) as record_count 
FROM reconciliation_items
UNION ALL
SELECT 
    'reconciliation_adjustments' as table_name, 
    COUNT(*) as record_count 
FROM reconciliation_adjustments;

-- 3. Check if functions exist
SELECT 
    routine_name,
    routine_type,
    CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.routines 
WHERE routine_name IN (
    'generate_reconciliation_report_number', 
    'update_reconciled_balance',
    'update_updated_at_column'
)
ORDER BY routine_name;

-- 4. Show sample data from reconciliation_reports if exists
SELECT 
    report_number,
    period_start,
    period_end,
    book_balance,
    statement_balance,
    variance,
    status,
    created_at
FROM reconciliation_reports 
LIMIT 5;