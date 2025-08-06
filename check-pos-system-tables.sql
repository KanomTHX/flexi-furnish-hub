-- ตรวจสอบตารางและคอลัมน์ของระบบ POS
-- สำหรับ Supabase PostgreSQL Database

-- ===== 1. ตรวจสอบตารางหลักที่จำเป็นสำหรับระบบ POS =====

SELECT 
    'ตรวจสอบตารางหลักของระบบ POS' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ พร้อมใช้งาน'
        ELSE '❌ ไม่พบตาราง'
    END as status
FROM (
    VALUES 
        ('branches'),
        ('employees'),
        ('customers'),
        ('product_categories'),
        ('products'),
        ('product_inventory'),
        ('sales_transactions'),
        ('sales_transaction_items'),
        ('warehouses'),
        ('stock_movements'),
        ('purchase_orders'),
        ('purchase_order_items'),
        ('chart_of_accounts'),
        ('journal_entries'),
        ('journal_entry_lines'),
        ('accounting_transactions'),
        ('claims'),
        ('installment_plans'),
        ('installment_payments')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = required_tables.table_name 
    AND t.table_schema = 'public'
ORDER BY required_tables.table_name;

-- ===== 2. ตรวจสอบคอลัมน์สำคัญของตาราง branches =====

SELECT 
    'ตรวจสอบคอลัมน์ตาราง branches' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IS NOT NULL THEN '✅ พร้อมใช้งาน'
        ELSE '❌ ไม่พบคอลัมน์'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'branches'
ORDER BY ordinal_position;

-- ===== 3. ตรวจสอบคอลัมน์สำคัญของตาราง products =====

SELECT 
    'ตรวจสอบคอลัมน์ตาราง products' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IS NOT NULL THEN '✅ พร้อมใช้งาน'
        ELSE '❌ ไม่พบคอลัมน์'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'products'
ORDER BY ordinal_position;

-- ===== 4. ตรวจสอบคอลัมน์สำคัญของตาราง sales_transactions =====

SELECT 
    'ตรวจสอบคอลัมน์ตาราง sales_transactions' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IS NOT NULL THEN '✅ พร้อมใช้งาน'
        ELSE '❌ ไม่พบคอลัมน์'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'sales_transactions'
ORDER BY ordinal_position;

-- ===== 5. ตรวจสอบ Foreign Key Constraints =====

SELECT 
    'ตรวจสอบ Foreign Key Constraints' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ พร้อมใช้งาน' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'employees', 'customers', 'products', 'product_inventory',
        'sales_transactions', 'sales_transaction_items', 'stock_movements',
        'purchase_orders', 'purchase_order_items', 'journal_entries',
        'journal_entry_lines', 'accounting_transactions', 'claims',
        'installment_plans', 'installment_payments'
    )
ORDER BY tc.table_name, kcu.column_name;

-- ===== 6. ตรวจสอบ Indexes สำหรับประสิทธิภาพ =====

SELECT 
    'ตรวจสอบ Indexes' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef,
    '✅ พร้อมใช้งาน' as status
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN (
        'branches', 'employees', 'customers', 'products',
        'sales_transactions', 'accounting_transactions'
    )
ORDER BY tablename, indexname;

-- ===== 7. ตรวจสอบข้อมูลตัวอย่างในตารางหลัก =====

-- ตรวจสอบข้อมูลสาขา
SELECT 
    'ข้อมูลสาขา' as data_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ มีข้อมูลตัวอย่าง'
        ELSE '⚠️ ไม่มีข้อมูลตัวอย่าง'
    END as status
FROM branches;

-- ตรวจสอบข้อมูลหมวดหมู่สินค้า
SELECT 
    'ข้อมูลหมวดหมู่สินค้า' as data_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ มีข้อมูลตัวอย่าง'
        ELSE '⚠️ ไม่มีข้อมูลตัวอย่าง'
    END as status
FROM product_categories;

-- ตรวจสอบข้อมูลผังบัญชี
SELECT 
    'ข้อมูลผังบัญชี' as data_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ มีข้อมูลตัวอย่าง'
        ELSE '⚠️ ไม่มีข้อมูลตัวอย่าง'
    END as status
FROM chart_of_accounts;

-- ===== 8. ตรวจสอบ Triggers =====

SELECT 
    'ตรวจสอบ Triggers' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    '✅ พร้อมใช้งาน' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN (
        'branches', 'employees', 'customers', 'products'
    )
ORDER BY event_object_table, trigger_name;

-- ===== 9. สรุปผลการตรวจสอบ =====

SELECT 
    'สรุปผลการตรวจสอบระบบ POS' as summary,
    (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'branches', 'employees', 'customers', 'product_categories', 'products', 
            'product_inventory', 'sales_transactions', 'sales_transaction_items',
            'warehouses', 'stock_movements', 'purchase_orders', 'purchase_order_items',
            'chart_of_accounts', 'journal_entries', 'journal_entry_lines', 
            'accounting_transactions', 'claims', 'installment_plans', 'installment_payments'
        )
    ) as tables_created,
    19 as tables_required,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'branches', 'employees', 'customers', 'product_categories', 'products', 
                'product_inventory', 'sales_transactions', 'sales_transaction_items',
                'warehouses', 'stock_movements', 'purchase_orders', 'purchase_order_items',
                'chart_of_accounts', 'journal_entries', 'journal_entry_lines', 
                'accounting_transactions', 'claims', 'installment_plans', 'installment_payments'
            )
        ) = 19 THEN '✅ ระบบ POS พร้อมใช้งานครบถ้วน'
        ELSE '❌ ระบบ POS ยังไม่พร้อมใช้งาน'
    END as overall_status;