-- Insert mock data for testing (corrected UUID format) - only if tables exist

-- Insert branches first (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branches') THEN
        INSERT INTO branches (id, name, address, phone, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'สาขาหลัก - สุขุมวิท', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', '02-123-4567', true, NOW(), NOW()),
        (gen_random_uuid(), 'สาขา 2 - รัชดาภิเษก', '456 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310', '02-234-5678', true, NOW(), NOW()),
        (gen_random_uuid(), 'สาขา 3 - ลาดพร้าว', '789 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900', '02-345-6789', true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert product categories (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_categories') THEN
        INSERT INTO product_categories (id, name, description, is_active, created_at) VALUES
        (gen_random_uuid(), 'เฟอร์นิเจอร์สำนักงาน', 'เก้าอี้ โต๊ะ และอุปกรณ์สำนักงาน', true, NOW()),
        (gen_random_uuid(), 'ห้องนั่งเล่น', 'โซฟา โต๊ะกาแฟ และเฟอร์นิเจอร์ห้องนั่งเล่น', true, NOW()),
        (gen_random_uuid(), 'ห้องนอน', 'เตียง ตู้ และเฟอร์นิเจอร์ห้องนอน', true, NOW()),
        (gen_random_uuid(), 'ห้องอาหาร', 'โต๊ะอาหาร เก้าอี้ และเฟอร์นิเจอร์ห้องอาหาร', true, NOW()),
        (gen_random_uuid(), 'ที่เก็บของ', 'ชั้นวาง ตู้เก็บของ', true, NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END $$;