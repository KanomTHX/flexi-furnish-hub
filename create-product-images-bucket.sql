-- สร้าง storage bucket สำหรับรูปสินค้า
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- สร้าง RLS policies สำหรับ bucket product-images

-- Policy สำหรับการดูรูปภาพ (public access)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'product-images-select-policy',
  'product-images',
  'Allow public to view product images',
  'true',
  'true',
  'SELECT'
)
ON CONFLICT (id) DO NOTHING;

-- Policy สำหรับการอัปโหลดรูปภาพ (authenticated users)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'product-images-insert-policy',
  'product-images',
  'Allow authenticated users to upload product images',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'INSERT'
)
ON CONFLICT (id) DO NOTHING;

-- Policy สำหรับการอัปเดตรูปภาพ (authenticated users)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'product-images-update-policy',
  'product-images',
  'Allow authenticated users to update product images',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'UPDATE'
)
ON CONFLICT (id) DO NOTHING;

-- Policy สำหรับการลบรูปภาพ (authenticated users)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'product-images-delete-policy',
  'product-images',
  'Allow authenticated users to delete product images',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'DELETE'
)
ON CONFLICT (id) DO NOTHING;