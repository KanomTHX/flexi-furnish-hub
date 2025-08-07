import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function runMigrationStepByStep() {
  try {
    console.log('Step 1: Adding missing columns...');
    
    // Step 1: Add missing columns one by one
    const columns = [
      'name VARCHAR(255)',
      'months INTEGER',
      'down_payment_percent DECIMAL(5,2)',
      'processing_fee DECIMAL(10,2) DEFAULT 0',
      'description TEXT',
      'min_amount DECIMAL(12,2) DEFAULT 0',
      'max_amount DECIMAL(12,2)',
      'requires_guarantor BOOLEAN DEFAULT FALSE',
      'is_active BOOLEAN DEFAULT TRUE',
      'installment_amount DECIMAL(12,2)',
      'number_of_installments INTEGER'
    ];
    
    for (const column of columns) {
      try {
        const { error } = await supabase.rpc('exec', {
          sql: `ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS ${column};`
        });
        if (error) {
          console.log(`Column ${column.split(' ')[0]} might already exist or error:`, error.message);
        } else {
          console.log(`✓ Added column: ${column.split(' ')[0]}`);
        }
      } catch (err) {
        console.log(`Column ${column.split(' ')[0]} error:`, err.message);
      }
    }
    
    console.log('\nStep 2: Inserting sample data...');
    
    // Step 2: Get branch_id
    const { data: branches } = await supabase
      .from('branches')
      .select('id')
      .limit(1);
      
    const branchId = branches && branches.length > 0 
      ? branches[0].id 
      : '00000000-0000-0000-0000-000000000000';
    
    console.log('Using branch_id:', branchId);
    
    // Step 3: Insert sample plans
    const samplePlans = [
      {
        plan_number: 'PLAN003',
        total_amount: 10000.00,
        name: 'ผ่อน 0% 3 งวด',
        months: 3,
        number_of_installments: 3,
        interest_rate: 0.00,
        down_payment: 1000.00,
        down_payment_percent: 10.00,
        processing_fee: 200.00,
        description: 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย',
        min_amount: 3000,
        max_amount: 30000,
        requires_guarantor: false,
        is_active: true,
        installment_amount: 3333.33,
        status: 'active',
        branch_id: branchId
      },
      {
        plan_number: 'PLAN006',
        total_amount: 15000.00,
        name: 'ผ่อน 0% 6 งวด',
        months: 6,
        number_of_installments: 6,
        interest_rate: 0.00,
        down_payment: 2000.00,
        down_payment_percent: 20.00,
        processing_fee: 500.00,
        description: 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย',
        min_amount: 5000,
        max_amount: 50000,
        requires_guarantor: false,
        is_active: true,
        installment_amount: 2166.67,
        status: 'active',
        branch_id: branchId
      },
      {
        plan_number: 'PLAN012',
        total_amount: 50000.00,
        name: 'ผ่อน 0% 12 งวด',
        months: 12,
        number_of_installments: 12,
        interest_rate: 0.00,
        down_payment: 3000.00,
        down_payment_percent: 30.00,
        processing_fee: 1000.00,
        description: 'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย',
        min_amount: 10000,
        max_amount: 100000,
        requires_guarantor: false,
        is_active: true,
        installment_amount: 3916.67,
        status: 'active',
        branch_id: branchId
      }
    ];
    
    for (const plan of samplePlans) {
      try {
        // Check if plan already exists
        const { data: existing } = await supabase
          .from('installment_plans')
          .select('plan_number')
          .eq('plan_number', plan.plan_number)
          .single();
          
        if (existing) {
          console.log(`Plan ${plan.plan_number} already exists, skipping...`);
          continue;
        }
        
        const { data, error } = await supabase
          .from('installment_plans')
          .insert(plan)
          .select();
          
        if (error) {
          console.error(`Error inserting ${plan.plan_number}:`, error);
        } else {
          console.log(`✓ Inserted plan: ${plan.plan_number} - ${plan.name}`);
        }
      } catch (err) {
        console.error(`Error with plan ${plan.plan_number}:`, err.message);
      }
    }
    
    console.log('\nStep 3: Checking results...');
    
    // Check results
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
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

runMigrationStepByStep();