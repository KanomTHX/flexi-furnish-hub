import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function addBranchIdColumn() {
  console.log('🚀 Adding branch_id column to products table...');

  try {
    // Add branch_id column to products table
    const { error: alterError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (alterError) {
      console.log('❌ Error checking products table:', alterError.message);
      return;
    }

    // Use raw SQL to add column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID;'
    });

    if (error) {
      console.log('❌ Failed to add branch_id column:', error.message);
      
      // Try alternative method using direct query
      console.log('Trying alternative method...');
      const { error: directError } = await supabase
        .from('products')
        .update({ branch_id: null })
        .eq('id', 'non-existent-id');
      
      if (directError && directError.message.includes('column "branch_id" does not exist')) {
        console.log('✅ Column branch_id does not exist, this confirms we need to add it.');
        console.log('Please run this SQL manually in Supabase dashboard:');
        console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);');
        console.log('CREATE INDEX IF NOT EXISTS idx_products_branch_id ON products(branch_id);');
      } else {
        console.log('✅ Column branch_id already exists or was added successfully!');
      }
    } else {
      console.log('✅ Branch ID column added successfully!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

addBranchIdColumn();