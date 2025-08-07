import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function runMigration() {
  try {
    console.log('Running fixed installment_plans migration...');
    
    const migrationSQL = readFileSync('fixed_number_of_installments_migration.sql', 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('Migration error:', error);
      return;
    }
    
    console.log('Migration completed successfully!');
    console.log('Result:', data);
    
    // ตรวจสอบผลลัพธ์
    const { data: plans, error: selectError } = await supabase
      .from('installment_plans')
      .select('plan_number, name, months, number_of_installments, total_amount, installment_amount, status')
      .order('plan_number');
      
    if (selectError) {
      console.error('Error checking results:', selectError);
    } else {
      console.log('\nInstallment plans in database:');
      console.log('==============================');
      plans.forEach(plan => {
        console.log(`${plan.plan_number}: ${plan.name} (${plan.number_of_installments} งวด, ${plan.total_amount} บาท)`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();