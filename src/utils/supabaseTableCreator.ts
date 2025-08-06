import { supabaseAdmin } from '@/lib/supabase'

// ข้อมูลตารางที่ต้องสร้าง
export const tableDefinitions = [
  {
    name: 'branches',
    sql: `
      CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        manager_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'employees',
    sql: `
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        employee_code VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        position VARCHAR(100),
        department VARCHAR(100),
        hire_date DATE,
        salary DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'product_categories',
    sql: `
      CREATE TABLE IF NOT EXISTS product_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES product_categories(id),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'products',
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID REFERENCES product_categories(id),
        product_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        unit VARCHAR(20) DEFAULT 'piece',
        cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        min_stock_level INTEGER DEFAULT 0,
        max_stock_level INTEGER DEFAULT 1000,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'customers',
    sql: `
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        customer_code VARCHAR(20) UNIQUE,
        type VARCHAR(20) DEFAULT 'individual' CHECK (type IN ('individual', 'business')),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        tax_id VARCHAR(20),
        credit_limit DECIMAL(12,2) DEFAULT 0,
        current_balance DECIMAL(12,2) DEFAULT 0,
        total_purchases DECIMAL(12,2) DEFAULT 0,
        last_purchase_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'product_inventory',
    sql: `
      CREATE TABLE IF NOT EXISTS product_inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 0,
        reserved_quantity INTEGER DEFAULT 0,
        available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock', 'discontinued')),
        UNIQUE(branch_id, product_id)
      )
    `
  },
  {
    name: 'sales_transactions',
    sql: `
      CREATE TABLE IF NOT EXISTS sales_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        customer_id UUID REFERENCES customers(id),
        employee_id UUID REFERENCES employees(id),
        transaction_number VARCHAR(50) UNIQUE NOT NULL,
        transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(12,2) DEFAULT 0,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'credit')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'sales_transaction_items',
    sql: `
      CREATE TABLE IF NOT EXISTS sales_transaction_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'warehouses',
    sql: `
      CREATE TABLE IF NOT EXISTS warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        location TEXT,
        capacity INTEGER,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'stock_movements',
    sql: `
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        warehouse_id UUID REFERENCES warehouses(id),
        product_id UUID REFERENCES products(id),
        movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment')),
        quantity INTEGER NOT NULL,
        reference_type VARCHAR(50),
        reference_id UUID,
        notes TEXT,
        created_by UUID REFERENCES employees(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'purchase_orders',
    sql: `
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_contact TEXT,
        order_date DATE NOT NULL,
        expected_delivery_date DATE,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
        notes TEXT,
        created_by UUID REFERENCES employees(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'purchase_order_items',
    sql: `
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(12,2) NOT NULL,
        received_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'chart_of_accounts',
    sql: `
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_code VARCHAR(20) UNIQUE NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
        account_category VARCHAR(100),
        parent_account_id UUID REFERENCES chart_of_accounts(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'journal_entries',
    sql: `
      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        entry_number VARCHAR(50) UNIQUE NOT NULL,
        entry_date DATE NOT NULL,
        description TEXT NOT NULL,
        reference_type VARCHAR(50),
        reference_id UUID,
        total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
        created_by UUID REFERENCES employees(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'journal_entry_lines',
    sql: `
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
        account_id UUID REFERENCES chart_of_accounts(id),
        description TEXT,
        debit_amount DECIMAL(12,2) DEFAULT 0,
        credit_amount DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'accounting_transactions',
    sql: `
      CREATE TABLE IF NOT EXISTS accounting_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        transaction_number VARCHAR(50) UNIQUE NOT NULL,
        transaction_date DATE NOT NULL,
        reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('sales', 'purchase', 'payment', 'receipt', 'adjustment', 'other')),
        reference_id UUID,
        description TEXT NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'claims',
    sql: `
      CREATE TABLE IF NOT EXISTS claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        customer_id UUID REFERENCES customers(id),
        product_id UUID REFERENCES products(id),
        claim_number VARCHAR(50) UNIQUE NOT NULL,
        claim_date DATE NOT NULL,
        claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN ('warranty', 'defect', 'damage', 'return', 'exchange')),
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'approved', 'rejected', 'resolved')),
        resolution TEXT,
        compensation_amount DECIMAL(10,2) DEFAULT 0,
        handled_by UUID REFERENCES employees(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'installment_plans',
    sql: `
      CREATE TABLE IF NOT EXISTS installment_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES branches(id),
        customer_id UUID REFERENCES customers(id),
        sales_transaction_id UUID REFERENCES sales_transactions(id),
        plan_number VARCHAR(50) UNIQUE NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        down_payment DECIMAL(12,2) DEFAULT 0,
        installment_amount DECIMAL(12,2) NOT NULL,
        number_of_installments INTEGER NOT NULL,
        interest_rate DECIMAL(5,2) DEFAULT 0,
        start_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: 'installment_payments',
    sql: `
      CREATE TABLE IF NOT EXISTS installment_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        installment_plan_id UUID REFERENCES installment_plans(id) ON DELETE CASCADE,
        payment_number INTEGER NOT NULL,
        due_date DATE NOT NULL,
        amount_due DECIMAL(12,2) NOT NULL,
        amount_paid DECIMAL(12,2) DEFAULT 0,
        payment_date DATE,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'transfer')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
        late_fee DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  }
]

// ข้อมูลตัวอย่าง
export const sampleData = [
  {
    table: 'branches',
    data: [
      { code: 'BKK', name: 'สาขากรุงเทพฯ', address: '123 ถนนสุขุมวิท กรุงเทพฯ', phone: '02-123-4567', manager_name: 'นายสมชาย ใจดี' },
      { code: 'CNX', name: 'สาขาเชียงใหม่', address: '456 ถนนนิมมานเหมินท์ เชียงใหม่', phone: '053-123-456', manager_name: 'นางสาวสมหญิง รักงาน' },
      { code: 'HKT', name: 'สาขาภูเก็ต', address: '789 ถนนป่าตอง ภูเก็ต', phone: '076-123-456', manager_name: 'นายสมศักดิ์ ขยันทำงาน' }
    ]
  },
  {
    table: 'product_categories',
    data: [
      { code: 'LIV', name: 'เฟอร์นิเจอร์ห้องนั่งเล่น', description: 'โซฟา เก้าอี้ โต๊ะกาแฟ' },
      { code: 'BED', name: 'เฟอร์นิเจอร์ห้องนอน', description: 'เตียง ตู้เสื้อผ้า โต๊ะแป้ง' },
      { code: 'OFF', name: 'เฟอร์นิเจอร์สำนักงาน', description: 'โต๊ะทำงาน เก้าอี้สำนักงาน ตู้เอกสาร' },
      { code: 'DEC', name: 'อุปกรณ์ตแต่งบ้าน', description: 'โคมไฟ กระจก ของตกแต่ง' }
    ]
  },
  {
    table: 'chart_of_accounts',
    data: [
      { account_code: '1000', account_name: 'เงินสด', account_type: 'asset', account_category: 'current_asset' },
      { account_code: '1100', account_name: 'ลูกหนี้การค้า', account_type: 'asset', account_category: 'current_asset' },
      { account_code: '1200', account_name: 'สินค้าคงเหลือ', account_type: 'asset', account_category: 'current_asset' },
      { account_code: '2000', account_name: 'เจ้าหนี้การค้า', account_type: 'liability', account_category: 'current_liability' },
      { account_code: '3000', account_name: 'ทุนจดทะเบียน', account_type: 'equity', account_category: 'capital' },
      { account_code: '4000', account_name: 'รายได้จากการขาย', account_type: 'revenue', account_category: 'sales_revenue' },
      { account_code: '5000', account_name: 'ต้นทุนขาย', account_type: 'expense', account_category: 'cost_of_goods_sold' },
      { account_code: '6000', account_name: 'ค่าใช้จ่ายในการดำเนินงาน', account_type: 'expense', account_category: 'operating_expense' }
    ]
  }
]

export class SupabaseTableCreator {
  private supabase = supabaseAdmin

  async createAllTables() {
    const results = []
    let successCount = 0

    console.log('🚀 Starting table creation process...')

    for (const tableDef of tableDefinitions) {
      try {
        console.log(`📋 Creating table: ${tableDef.name}`)
        
        // ตรวจสอบว่าตารางมีอยู่แล้วหรือไม่
        try {
          const { error: checkError } = await this.supabase
            .from(tableDef.name)
            .select('*')
            .limit(1)
            .maybeSingle()

          if (!checkError || checkError.code === 'PGRST116') {
            console.log(`✅ Table ${tableDef.name} already exists`)
            results.push({
              table: tableDef.name,
              success: true,
              message: 'Table already exists',
              skipped: true
            })
            successCount++
            continue
          }
        } catch (checkTableError) {
          // ตารางไม่มี - ดำเนินการสร้างต่อ
          console.log(`📋 Table ${tableDef.name} does not exist, creating...`)
        }

        // พยายามสร้างตารางด้วยวิธีต่างๆ
        const createResult = await this.createTableWithFallback(tableDef)
        results.push(createResult)
        
        if (createResult.success) {
          successCount++
        }

        // รอสักครู่ก่อนสร้างตารางถัดไป
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`❌ Error creating table ${tableDef.name}:`, error)
        results.push({
          table: tableDef.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`🎯 Table creation completed: ${successCount}/${tableDefinitions.length} successful`)

    return {
      success: successCount > 0,
      results,
      summary: `${successCount}/${tableDefinitions.length} tables created successfully`,
      totalTables: tableDefinitions.length,
      successCount
    }
  }

  private async createTableWithFallback(tableDef: { name: string; sql: string }) {
    // วิธีที่ 1: ลองใช้ direct query (อาจไม่ได้ผล)
    try {
      const { error } = await this.supabase.rpc('exec', { sql: tableDef.sql })
      if (!error) {
        return {
          table: tableDef.name,
          success: true,
          method: 'direct_query'
        }
      }
    } catch (error) {
      console.log(`Direct query failed for ${tableDef.name}, trying alternative...`)
    }

    // วิธีที่ 2: ใช้ REST API (สำหรับตารางง่ายๆ)
    try {
      const result = await this.createTableViaREST(tableDef)
      if (result.success) {
        return result
      }
    } catch (error) {
      console.log(`REST API failed for ${tableDef.name}`)
    }

    // วิธีที่ 3: แจ้งให้ใช้ SQL Editor
    return {
      table: tableDef.name,
      success: false,
      requiresManualCreation: true,
      message: `Please create table ${tableDef.name} manually using Supabase SQL Editor`,
      sql: tableDef.sql
    }
  }

  private async createTableViaREST(tableDef: { name: string; sql: string }) {
    // สำหรับตารางพื้นฐานที่ไม่มี foreign key
    const basicTables = ['branches', 'product_categories', 'chart_of_accounts']
    
    if (!basicTables.includes(tableDef.name)) {
      throw new Error('Table requires foreign keys - use SQL Editor')
    }

    // ลองสร้างตารางพื้นฐาน (จริงๆ แล้วยังคงต้องใช้ SQL Editor)
    throw new Error('REST API table creation not implemented')
  }

  async insertSampleData() {
    const results = []
    let successCount = 0

    console.log('📝 Inserting sample data...')

    for (const sampleDataSet of sampleData) {
      try {
        // ตรวจสอบว่าตารางมีข้อมูลแล้วหรือไม่
        const { data: existingData, count } = await this.supabase
          .from(sampleDataSet.table)
          .select('*', { count: 'exact', head: true })

        if (count && count > 0) {
          console.log(`✅ Table ${sampleDataSet.table} already has data`)
          results.push({
            table: sampleDataSet.table,
            success: true,
            message: 'Data already exists',
            skipped: true
          })
          successCount++
          continue
        }

        // Insert ข้อมูล
        const { error } = await this.supabase
          .from(sampleDataSet.table)
          .insert(sampleDataSet.data)

        if (error) {
          throw error
        }

        console.log(`✅ Sample data inserted into ${sampleDataSet.table}`)
        results.push({
          table: sampleDataSet.table,
          success: true,
          message: `Inserted ${sampleDataSet.data.length} records`
        })
        successCount++

      } catch (error) {
        console.error(`❌ Error inserting data into ${sampleDataSet.table}:`, error)
        results.push({
          table: sampleDataSet.table,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      success: successCount > 0,
      results,
      summary: `${successCount}/${sampleData.length} data sets inserted successfully`
    }
  }

  async checkTablesExist() {
    try {
      const existingTables: string[] = []
      
      // ตรวจสอบตารางทีละตาราง
      for (const tableDef of tableDefinitions) {
        try {
          // พยายามดึงข้อมูลจากตาราง (แค่ 1 แถว)
          const { error } = await this.supabase
            .from(tableDef.name)
            .select('*')
            .limit(1)
            .maybeSingle()

          // ถ้าไม่มี error แสดงว่าตารางมีอยู่
          if (!error) {
            existingTables.push(tableDef.name)
          } else if (error.code === 'PGRST116') {
            // PGRST116 = No rows found (ตารางมีอยู่แต่ไม่มีข้อมูล)
            existingTables.push(tableDef.name)
          }
          // ถ้า error อื่นๆ แสดงว่าตารางไม่มี
        } catch (tableError) {
          // ถ้า error แสดงว่าตารางไม่มี - ข้ามไป
          console.log(`Table ${tableDef.name} does not exist`)
        }
      }

      const missingTables = tableDefinitions
        .map(t => t.name)
        .filter(name => !existingTables.includes(name))

      return {
        success: true,
        existingTables,
        missingTables,
        totalRequired: tableDefinitions.length,
        totalExisting: existingTables.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}