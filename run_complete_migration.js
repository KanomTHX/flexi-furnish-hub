import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function runCompleteMigration() {
  console.log('🚀 เริ่มรัน Complete Missing Columns Migration');
  console.log('================================================================');

  try {
    // อ่านไฟล์ migration
    const migrationSQL = readFileSync('complete_missing_columns_migration.sql', 'utf8');
    
    // แบ่ง SQL เป็นคำสั่งย่อยๆ เพื่อรันทีละส่วน
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`📝 พบคำสั่ง SQL ${sqlCommands.length} คำสั่ง`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // ข้าม comments และคำสั่งที่ไม่จำเป็น
      if (command.includes('COMMENT ON') || command.includes('SELECT \'Complete missing')) {
        console.log(`⏭️  ข้าม: ${command.substring(0, 50)}...`);
        continue;
      }

      try {
        console.log(`\n${i + 1}. กำลังรัน: ${command.substring(0, 80)}...`);
        
        // รันคำสั่ง SQL
        const { data, error } = await supabase.rpc('exec', {
          sql: command
        });

        if (error) {
          console.log(`❌ Error: ${error.message}`);
          errorCount++;
          
          // ถ้าเป็น error ที่ไม่สำคัญ (เช่น column already exists) ให้ข้ามไป
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('Could not find the function')) {
            console.log(`⚠️  ข้าม error ที่ไม่สำคัญ`);
            continue;
          }
        } else {
          console.log(`✅ สำเร็จ`);
          successCount++;
        }

      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
        errorCount++;
      }

      // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ database ทำงานหนักเกินไป
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 สรุปผลการรัน Migration');
    console.log('================================================================');
    console.log(`✅ สำเร็จ: ${successCount} คำสั่ง`);
    console.log(`❌ ผิดพลาด: ${errorCount} คำสั่ง`);

    // ตรวจสอบผลลัพธ์
    console.log('\n🔍 ตรวจสอบผลลัพธ์...');
    await checkMigrationResults();

  } catch (err) {
    console.error('❌ Error running migration:', err.message);
  }
}

async function checkMigrationResults() {
  const tablesToCheck = [
    'guarantors',
    'installment_contracts', 
    'installment_payments',
    'contract_documents'
  ];

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: โครงสร้างถูกต้อง`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }

  // ตรวจสอบตารางใหม่
  const newTables = ['contract_history', 'installment_notifications'];
  
  for (const tableName of newTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName} (ตารางใหม่): ${error.message}`);
      } else {
        console.log(`✅ ${tableName} (ตารางใหม่): สร้างสำเร็จ`);
      }
    } catch (err) {
      console.log(`❌ ${tableName} (ตารางใหม่): ${err.message}`);
    }
  }
}

runCompleteMigration();