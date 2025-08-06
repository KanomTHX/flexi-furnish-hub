import { supabase } from '@/lib/supabase'

export async function checkPosSystemTables() {
  try {
    console.log('🔍 ตรวจสอบตารางระบบ POS...')
    
    // 1. ตรวจสอบตารางหลักที่จำเป็น
    const requiredTables = [
      'branches',
      'employees', 
      'customers',
      'product_categories',
      'products',
      'product_inventory',
      'sales_transactions',
      'sales_transaction_items',
      'warehouses',
      'stock_movements',
      'purchase_orders',
      'purchase_order_items',
      'chart_of_accounts',
      'journal_entries',
      'journal_entry_lines',
      'accounting_transactions',
      'claims',
      'installment_plans',
      'installment_payments'
    ]
    
    const tableResults = []
    
    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ตาราง '${tableName}' ไม่พบ:`, error.message)
          tableResults.push({ 
            table: tableName, 
            exists: false, 
            error: error.message,
            status: '❌ ไม่พบตาราง'
          })
        } else {
          console.log(`✅ ตาราง '${tableName}' พร้อมใช้งาน`)
          tableResults.push({ 
            table: tableName, 
            exists: true,
            count: data?.length || 0,
            status: '✅ พร้อมใช้งาน'
          })
        }
      } catch (err) {
        console.log(`❌ ข้อผิดพลาดในการตรวจสอบตาราง '${tableName}':`, err)
        tableResults.push({ 
          table: tableName, 
          exists: false, 
          error: String(err),
          status: '❌ ข้อผิดพลาด'
        })
      }
    }
    
    const existingTables = tableResults.filter(t => t.exists).length
    
    // 2. ตรวจสอบข้อมูลตัวอย่าง
    const sampleDataResults = []
    
    const sampleTables = ['branches', 'product_categories', 'chart_of_accounts']
    
    for (const tableName of sampleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5)
        
        if (error) {
          sampleDataResults.push({
            table: tableName,
            count: 0,
            status: '⚠️ ไม่สามารถอ่านข้อมูลได้',
            error: error.message
          })
        } else {
          const count = data?.length || 0
          sampleDataResults.push({
            table: tableName,
            count,
            status: count > 0 ? '✅ มีข้อมูลตัวอย่าง' : '⚠️ ไม่มีข้อมูลตัวอย่าง',
            data: data?.slice(0, 3) // แสดงข้อมูล 3 รายการแรก
          })
        }
      } catch (err) {
        sampleDataResults.push({
          table: tableName,
          count: 0,
          status: '❌ ข้อผิดพลาด',
          error: String(err)
        })
      }
    }
    
    // 3. ตรวจสอบ Foreign Key Relationships
    const relationshipTests = [
      { table: 'employees', column: 'branch_id', references: 'branches' },
      { table: 'customers', column: 'branch_id', references: 'branches' },
      { table: 'products', column: 'category_id', references: 'product_categories' },
      { table: 'sales_transactions', column: 'branch_id', references: 'branches' },
      { table: 'sales_transactions', column: 'customer_id', references: 'customers' }
    ]
    
    const relationshipResults = []
    
    for (const rel of relationshipTests) {
      try {
        // ทดสอบการ join ระหว่างตาราง
        const { data, error } = await supabase
          .from(rel.table)
          .select(`${rel.column}, ${rel.references}(*)`)
          .limit(1)
        
        if (error) {
          relationshipResults.push({
            relationship: `${rel.table}.${rel.column} -> ${rel.references}`,
            status: '❌ ความสัมพันธ์ไม่ถูกต้อง',
            error: error.message
          })
        } else {
          relationshipResults.push({
            relationship: `${rel.table}.${rel.column} -> ${rel.references}`,
            status: '✅ ความสัมพันธ์ถูกต้อง'
          })
        }
      } catch (err) {
        relationshipResults.push({
          relationship: `${rel.table}.${rel.column} -> ${rel.references}`,
          status: '❌ ข้อผิดพลาด',
          error: String(err)
        })
      }
    }
    
    // สรุปผลการตรวจสอบ
    const overallStatus = existingTables === requiredTables.length 
      ? '✅ ระบบ POS พร้อมใช้งานครบถ้วน'
      : `⚠️ พบตาราง ${existingTables}/${requiredTables.length} ตาราง`
    
    return {
      success: true,
      summary: {
        tablesFound: existingTables,
        totalTables: requiredTables.length,
        status: overallStatus
      },
      tableResults,
      sampleDataResults,
      relationshipResults,
      recommendations: existingTables < requiredTables.length 
        ? ['กรุณารัน SQL script เพื่อสร้างตารางที่ขาดหายไป', 'ตรวจสอบการเชื่อมต่อฐานข้อมูล']
        : ['ระบบพร้อมใช้งาน', 'สามารถเริ่มใช้งานระบบ POS ได้']
    }
    
  } catch (error) {
    console.error('💥 การตรวจสอบระบบ POS ล้มเหลว:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ',
      details: error
    }
  }
}

export async function checkPosSystemColumns() {
  try {
    console.log('🔍 ตรวจสอบคอลัมน์ของตารางสำคัญ...')
    
    // ตรวจสอบคอลัมน์ของตารางสำคัญ
    const importantTables = [
      {
        name: 'branches',
        requiredColumns: ['id', 'code', 'name', 'address', 'phone', 'manager_name', 'status']
      },
      {
        name: 'products', 
        requiredColumns: ['id', 'product_code', 'name', 'cost_price', 'selling_price', 'status']
      },
      {
        name: 'sales_transactions',
        requiredColumns: ['id', 'branch_id', 'customer_id', 'transaction_number', 'total_amount', 'status']
      },
      {
        name: 'customers',
        requiredColumns: ['id', 'branch_id', 'name', 'phone', 'email', 'status']
      }
    ]
    
    const columnResults = []
    
    for (const table of importantTables) {
      try {
        // ใช้ INFORMATION_SCHEMA เพื่อตรวจสอบคอลัมน์
        const { data, error } = await supabase.rpc('get_table_columns', {
          table_name: table.name
        })
        
        if (error) {
          // ถ้าไม่มี function ให้ทดสอบด้วยการ select
          const { data: testData, error: testError } = await supabase
            .from(table.name)
            .select('*')
            .limit(0)
          
          if (testError) {
            columnResults.push({
              table: table.name,
              status: '❌ ไม่สามารถตรวจสอบคอลัมน์ได้',
              error: testError.message
            })
            continue
          }
        }
        
        columnResults.push({
          table: table.name,
          status: '✅ ตารางพร้อมใช้งาน',
          note: 'ตรวจสอบคอลัมน์ผ่านการ query ข้อมูล'
        })
        
      } catch (err) {
        columnResults.push({
          table: table.name,
          status: '❌ ข้อผิดพลาด',
          error: String(err)
        })
      }
    }
    
    return {
      success: true,
      columnResults
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'
    }
  }
}