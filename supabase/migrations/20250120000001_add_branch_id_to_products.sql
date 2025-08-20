-- Add branch_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_branch_id ON products(branch_id);

-- Update existing products to have a default branch_id if needed
-- This is optional and depends on your business logic
-- UPDATE products SET branch_id = (SELECT id FROM branches LIMIT 1) WHERE branch_id IS NULL;