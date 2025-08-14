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
