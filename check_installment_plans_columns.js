import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function checkTableStructure() {
  try {
    // Try to get column information
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'installment_plans')
      .eq('table_schema', 'public')
      .order('ordinal_position');
      
    if (error) {
      console.log('Error getting columns:', error);
      return;
    }
    
    console.log('installment_plans table columns:');
    console.log('=====================================');
    data.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) default: ${col.column_default || 'none'}`);
    });
    
    // Also check constraints
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'installment_plans')
      .eq('table_schema', 'public');
      
    if (!constraintError && constraints) {
      console.log('\nConstraints:');
      console.log('============');
      constraints.forEach(c => {
        console.log(`${c.constraint_name}: ${c.constraint_type}`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTableStructure();