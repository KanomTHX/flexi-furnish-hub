// ===================================================================
// DATABASE SCHEMA CHECKER
// สคริปต์ตรวจสอบโครงสร้างตารางใน Supabase
// ===================================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// โหลด environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * ดึงรายชื่อตารางทั้งหมด
 */
async function getAllTables() {
    try {
        // ใช้ SQL query ผ่าน rpc หรือ raw query
        const { data, error } = await supabase.rpc('get_table_names');

        if (error && error.code === '42883') {
            // ถ้าไม่มี function ให้ลองวิธีอื่น
            const tables = [
                'branches', 'employees', 'customers', 'products', 'product_categories',
                'sales_transactions', 'accounting_transactions', 'chart_of_accounts',
                'installment_plans', 'installment_contracts', 'installment_payments',
                'guarantors', 'contract_history', 'contract_documents'
            ];

            const existingTables = [];
            for (const table of tables) {
                const exists = await tableExists(table);
                if (exists) existingTables.push(table);
            }

            return existingTables;
        }

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching tables:', error);
        // Fallback: ลองตารางที่คาดว่าจะมี
        const commonTables = [
            'branches', 'employees', 'customers', 'products',
            'installment_plans', 'installment_contracts', 'installment_payments'
        ];

        const existingTables = [];
        for (const table of commonTables) {
            const exists = await tableExists(table);
            if (exists) existingTables.push(table);
        }

        return existingTables;
    }
}

/**
 * ดึงโครงสร้างคอลัมน์ของตาราง
 */
async function getTableColumns(tableName) {
    try {
        // ลองดึงข้อมูลจากตารางโดยตรงเพื่อดูโครงสร้าง
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            console.warn(`Cannot access table ${tableName}:`, error.message);
            return [];
        }

        // ถ้าได้ข้อมูลมา ให้ดูโครงสร้างจาก object
        if (data && data.length > 0) {
            const columns = Object.keys(data[0]).map(key => ({
                column_name: key,
                data_type: typeof data[0][key],
                is_nullable: 'UNKNOWN',
                column_default: null
            }));
            return columns;
        }

        // ถ้าไม่มีข้อมูล ให้ลอง insert ข้อมูลเปล่าเพื่อดู error
        try {
            await supabase.from(tableName).insert({}).select();
        } catch (insertError) {
            // Parse error message เพื่อดูโครงสร้าง
            console.log(`Insert error for ${tableName}:`, insertError.message);
        }

        return [];
    } catch (error) {
        console.error(`Error fetching columns for ${tableName}:`, error);
        return [];
    }
}

/**
 * ดึงข้อมูล foreign keys
 */
async function getForeignKeys(tableName) {
    try {
        const { data, error } = await supabase.rpc('get_foreign_keys', {
            table_name: tableName
        });

        if (error && error.code !== '42883') { // Function doesn't exist
            throw error;
        }

        return data || [];
    } catch (error) {
        // ถ้าไม่มี function ให้ใช้วิธีอื่น
        try {
            const { data, error: queryError } = await supabase
                .from('information_schema.key_column_usage')
                .select(`
          column_name,
          referenced_table_name,
          referenced_column_name
        `)
                .eq('table_schema', 'public')
                .eq('table_name', tableName)
                .not('referenced_table_name', 'is', null);

            if (queryError) throw queryError;
            return data || [];
        } catch (fallbackError) {
            console.warn(`Could not fetch foreign keys for ${tableName}`);
            return [];
        }
    }
}

/**
 * ตรวจสอบว่าตารางมีอยู่หรือไม่
 */
async function tableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        return !error;
    } catch (error) {
        return false;
    }
}

// ===================================================================
// MAIN CHECKING FUNCTIONS
// ===================================================================

/**
 * ตรวจสอบตารางที่เกี่ยวข้องกับ installments
 */
async function checkInstallmentTables() {
    console.log('\n🔍 ตรวจสอบตารางที่เกี่ยวข้องกับ Installments...\n');

    const installmentTables = [
        'customers',
        'installment_plans',
        'installment_contracts',
        'installment_payments',
        'guarantors',
        'contract_history',
        'contract_documents'
    ];

    const results = {};

    for (const tableName of installmentTables) {
        console.log(`📋 ตรวจสอบตาราง: ${tableName}`);

        const exists = await tableExists(tableName);

        if (exists) {
            console.log(`  ✅ ตารางมีอยู่`);

            const columns = await getTableColumns(tableName);
            const foreignKeys = await getForeignKeys(tableName);

            results[tableName] = {
                exists: true,
                columns: columns,
                foreignKeys: foreignKeys
            };

            console.log(`  📊 จำนวนคอลัมน์: ${columns.length}`);

            // แสดงคอลัมน์สำคัญ
            const importantColumns = columns.filter(col =>
                col.column_name.includes('id') ||
                col.column_name.includes('name') ||
                col.column_name.includes('customer') ||
                col.column_name.includes('guarantor')
            );

            if (importantColumns.length > 0) {
                console.log(`  🔑 คอลัมน์สำคัญ:`);
                importantColumns.forEach(col => {
                    console.log(`    - ${col.column_name} (${col.data_type})`);
                });
            }

        } else {
            console.log(`  ❌ ตารางไม่มีอยู่`);
            results[tableName] = {
                exists: false,
                columns: [],
                foreignKeys: []
            };
        }

        console.log('');
    }

    return results;
}

/**
 * ตรวจสอบโครงสร้างตาราง customers
 */
async function checkCustomersTable() {
    console.log('👤 ตรวจสอบโครงสร้างตาราง customers...\n');

    const exists = await tableExists('customers');
    if (!exists) {
        console.log('❌ ตาราง customers ไม่มีอยู่');
        return null;
    }

    const columns = await getTableColumns('customers');

    console.log('📊 คอลัมน์ในตาราง customers:');
    columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* Required' : ''}`);
    });

    // ตรวจสอบคอลัมน์ที่จำเป็นสำหรับ installments
    const requiredColumns = [
        'id_card',
        'occupation',
        'monthly_income',
        'workplace',
        'work_address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship'
    ];

    console.log('\n🔍 ตรวจสอบคอลัมน์ที่จำเป็นสำหรับ installments:');
    const missingColumns = [];

    requiredColumns.forEach(colName => {
        const exists = columns.some(col => col.column_name === colName);
        if (exists) {
            console.log(`  ✅ ${colName}`);
        } else {
            console.log(`  ❌ ${colName} - ไม่มีอยู่`);
            missingColumns.push(colName);
        }
    });

    return {
        exists: true,
        columns: columns,
        missingColumns: missingColumns
    };
}

/**
 * ตรวจสอบโครงสร้างตาราง installment_contracts
 */
async function checkInstallmentContractsTable() {
    console.log('\n📄 ตรวจสอบโครงสร้างตาราง installment_contracts...\n');

    const exists = await tableExists('installment_contracts');
    if (!exists) {
        console.log('❌ ตาราง installment_contracts ไม่มีอยู่');
        return null;
    }

    const columns = await getTableColumns('installment_contracts');

    console.log('📊 คอลัมน์ในตาราง installment_contracts:');
    columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* Required' : ''}`);
    });

    // ตรวจสอบคอลัมน์ที่เกี่ยวข้องกับ customer
    const customerColumns = columns.filter(col =>
        col.column_name.includes('customer')
    );

    console.log('\n🔍 คอลัมน์ที่เกี่ยวข้องกับ customer:');
    customerColumns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    return {
        exists: true,
        columns: columns,
        customerColumns: customerColumns
    };
}

/**
 * สร้างรายงานสรุป
 */
function generateReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 สรุปผลการตรวจสอบ');
    console.log('='.repeat(60));

    const existingTables = Object.keys(results).filter(table => results[table].exists);
    const missingTables = Object.keys(results).filter(table => !results[table].exists);

    console.log(`\n✅ ตารางที่มีอยู่ (${existingTables.length}):`, existingTables.join(', '));
    console.log(`❌ ตารางที่ไม่มีอยู่ (${missingTables.length}):`, missingTables.join(', '));

    // สร้าง migration recommendations
    console.log('\n🔧 คำแนะนำสำหรับ Migration:');

    if (missingTables.length > 0) {
        console.log('\n1. ตารางที่ต้องสร้างใหม่:');
        missingTables.forEach(table => {
            console.log(`   - CREATE TABLE ${table}`);
        });
    }

    if (results.customers && results.customers.missingColumns && results.customers.missingColumns.length > 0) {
        console.log('\n2. คอลัมน์ที่ต้องเพิ่มในตาราง customers:');
        results.customers.missingColumns.forEach(col => {
            console.log(`   - ALTER TABLE customers ADD COLUMN ${col}`);
        });
    }

    // ตรวจสอบ foreign key relationships
    if (results.installment_contracts && results.installment_contracts.exists) {
        const customerCols = results.installment_contracts.customerColumns;
        if (customerCols.length > 0) {
            console.log('\n3. ความสัมพันธ์กับตาราง customers:');
            customerCols.forEach(col => {
                console.log(`   - ${col.column_name} -> customers.id`);
            });
        }
    }
}

// ===================================================================
// MAIN EXECUTION
// ===================================================================

async function main() {
    console.log('🚀 เริ่มตรวจสอบโครงสร้างฐานข้อมูล Supabase...');
    console.log(`📡 URL: ${supabaseUrl}`);

    try {
        // ตรวจสอบการเชื่อมต่อด้วยการลองเข้าถึงตารางที่น่าจะมี
        const { data, error } = await supabase.from('branches').select('id').limit(1);
        if (error && !error.message.includes('does not exist')) {
            throw new Error(`ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${error.message}`);
        }
        console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

        // ตรวจสอบตารางทั้งหมด
        const allTables = await getAllTables();
        console.log(`\n📊 พบตารางทั้งหมด ${allTables.length} ตาราง:`, allTables.join(', '));

        // ตรวจสอบตารางที่เกี่ยวข้องกับ installments
        const installmentResults = await checkInstallmentTables();

        // ตรวจสอบตาราง customers โดยเฉพาะ
        const customersResult = await checkCustomersTable();
        if (customersResult) {
            installmentResults.customers = { ...installmentResults.customers, ...customersResult };
        }

        // ตรวจสอบตาราง installment_contracts โดยเฉพาะ
        const contractsResult = await checkInstallmentContractsTable();
        if (contractsResult) {
            installmentResults.installment_contracts = { ...installmentResults.installment_contracts, ...contractsResult };
        }

        // สร้างรายงานสรุป
        generateReport(installmentResults);

        // บันทึกผลลัพธ์เป็นไฟล์ JSON
        const fs = await import('fs');
        fs.writeFileSync('database_schema_check_result.json', JSON.stringify(installmentResults, null, 2));
        console.log('\n💾 บันทึกผลลัพธ์ในไฟล์: database_schema_check_result.json');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        process.exit(1);
    }
}

// รันสคริปต์
main().then(() => {
    console.log('\n✅ ตรวจสอบเสร็จสิ้น');
    process.exit(0);
}).catch(error => {
    console.error('❌ เกิดข้อผิดพลาดในการรันสคริปต์:', error);
    process.exit(1);
});