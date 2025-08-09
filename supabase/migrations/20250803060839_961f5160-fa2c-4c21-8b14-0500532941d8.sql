-- Insert mock data for testing (only if tables exist)

-- Insert branches first (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branches') THEN
        INSERT INTO branches (id, name, address, phone, is_active, created_at, updated_at) VALUES
        ('branch-001', 'สาขาหลัก - สุขุมวิท', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', '02-123-4567', true, NOW(), NOW()),
        ('branch-002', 'สาขา 2 - รัชดาภิเษก', '456 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310', '02-234-5678', true, NOW(), NOW()),
        ('branch-003', 'สาขา 3 - ลาดพร้าว', '789 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900', '02-345-6789', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Insert product categories (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_categories') THEN
        INSERT INTO product_categories (id, name, description, is_active, created_at) VALUES
        ('cat-001', 'เฟอร์นิเจอร์สำนักงาน', 'เก้าอี้ โต๊ะ และอุปกรณ์สำนักงาน', true, NOW()),
        ('cat-002', 'ห้องนั่งเล่น', 'โซฟา โต๊ะกาแฟ และเฟอร์นิเจอร์ห้องนั่งเล่น', true, NOW()),
        ('cat-003', 'ห้องนอน', 'เตียง ตู้ และเฟอร์นิเจอร์ห้องนอน', true, NOW()),
        ('cat-004', 'ห้องอาหาร', 'โต๊ะอาหาร เก้าอี้ และเฟอร์นิเจอร์ห้องอาหาร', true, NOW()),
        ('cat-005', 'ที่เก็บของ', 'ชั้นวาง ตู้เก็บของ', true, NOW())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Insert products (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        INSERT INTO products (id, name, brand, model, description, category_id, base_price, cost_price, is_active, created_at, updated_at) VALUES
        ('prod-001', 'เก้าอี้สำนักงานผู้บริหาร', 'OfficeComfort', 'OC-001', 'เก้าอี้สำนักงานผู้บริหารแบบเออร์โกโนมิกส์ พร้อมพนักพิงหลัง', 'cat-001', 12500, 8000, true, NOW(), NOW()),
        ('prod-002', 'ชุดโต๊ะอาหาร (4 เก้าอี้)', 'DiningSet', 'DT-205', 'โต๊ะอาหารไม้แท้ พร้อมเก้าอี้ 4 ตัวแบบเข้าชุด', 'cat-004', 25900, 18000, true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;