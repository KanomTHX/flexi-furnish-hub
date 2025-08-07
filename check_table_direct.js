import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function checkTable() {
  try {
    // Try to select from the table to see what columns exist
    const { data, error } = await supabase
      .from('installment_plans')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Available columns in installment_plans:');
      console.log('=====================================');
      Object.keys(data[0]).forEach(key => {
        console.log(`- ${key}: ${typeof data[0][key]} (value: ${data[0][key]})`);
      });
    } else {
      console.log('Table is empty, trying to get structure another way...');
      
      // Try to insert a test record to see what's missing
      const testData = {
        plan_number: 'TEST001',
        total_amount: 10000,
        name: 'Test Plan',
        months: 12,
        interest_rate: 0,
        down_payment: 1000,
        installment_amount: 833.33,
        status: 'active'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('installment_plans')
        .insert(testData)
        .select();
        
      if (insertError) {
        console.log('Insert error (this helps us see required fields):');
        console.log(insertError);
      } else {
        console.log('Test insert successful:', insertData);
        // Clean up
        await supabase
          .from('installment_plans')
          .delete()
          .eq('plan_number', 'TEST001');
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTable();