// สคริปต์ทดสอบการบันทึกข้อมูลการรับสินค้า
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://hartshwcchbsnmbrjdyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReceiveLogs() {
  console.log('🔍 ตรวจสอบข้อมูลการรับสินค้าในฐานข้อมูล...');
  
  try {
    // ตรวจสอบตารางที่มีอยู่จริงในฐานข้อมูล
    console.log('\n📋 ตรวจสอบตารางที่เกี่ยวข้องกับการรับสินค้า...');
    
    // ตรวจสอบตาราง receive_logs
    console.log('\n1. ตรวจสอบตาราง receive_logs:');
    const { data: receiveLogs, error: receiveError } = await supabase
      .from('receive_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (receiveError) {
      console.log('❌ ตาราง receive_logs ไม่มีอยู่:', receiveError.message);
      
      // ตรวจสอบตารางอื่นที่อาจใช้สำหรับการรับสินค้า
      console.log('\n2. ตรวจสอบตาราง warehouses:');
      const { data: warehouses, error: warehouseError } = await supabase
        .from('warehouses')
        .select('*')
        .limit(5);
      
      if (warehouseError) {
        console.log('❌ ตาราง warehouses:', warehouseError.message);
      } else {
        console.log(`✅ ตาราง warehouses: พบ ${warehouses?.length || 0} รายการ`);
        if (warehouses && warehouses.length > 0) {
          warehouses.forEach((wh, index) => {
            console.log(`   ${index + 1}. ${wh.name} (${wh.code || wh.id})`);
          });
        }
      }
      
      console.log('\n3. ตรวจสอบตาราง suppliers:');
      const { data: suppliers, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .limit(5);
      
      if (supplierError) {
        console.log('❌ ตาราง suppliers:', supplierError.message);
      } else {
        console.log(`✅ ตาราง suppliers: พบ ${suppliers?.length || 0} รายการ`);
        if (suppliers && suppliers.length > 0) {
          suppliers.forEach((sup, index) => {
            console.log(`   ${index + 1}. ${sup.name || sup.supplier_name} (${sup.code || sup.supplier_code || sup.id})`);
          });
        }
      }
      
      // ตรวจสอบตารางอื่นๆ ที่อาจเกี่ยวข้อง
      console.log('\n4. ตรวจสอบตาราง stock_movements:');
      const { data: movements, error: movementError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('movement_type', 'receive')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (movementError) {
        console.log('❌ ตาราง stock_movements:', movementError.message);
      } else {
        console.log(`✅ ตาราง stock_movements (receive): พบ ${movements?.length || 0} รายการ`);
        if (movements && movements.length > 0) {
          movements.forEach((mov, index) => {
            console.log(`   ${index + 1}. Product: ${mov.product_id}, Qty: ${mov.quantity}, Ref: ${mov.reference_number}`);
          });
        }
      }
      
      console.log('\n5. ตรวจสอบตาราง product_inventory:');
      const { data: inventory, error: inventoryError } = await supabase
        .from('product_inventory')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(5);
      
      if (inventoryError) {
        console.log('❌ ตาราง product_inventory:', inventoryError.message);
      } else {
        console.log(`✅ ตาราง product_inventory: พบ ${inventory?.length || 0} รายการ`);
        if (inventory && inventory.length > 0) {
          inventory.forEach((inv, index) => {
            console.log(`   ${index + 1}. Product: ${inv.product_id}, Warehouse: ${inv.warehouse_id}, Qty: ${inv.quantity}`);
          });
        }
      }
      
      return;
    }

    console.log(`✅ จำนวน receive_logs ทั้งหมด: ${receiveLogs?.length || 0}`);
    
    if (receiveLogs && receiveLogs.length > 0) {
      console.log('\n📋 รายการการรับสินค้าล่าสุด:');
      receiveLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. ${log.receive_number}`);
        console.log(`   - Supplier ID: ${log.supplier_id || 'ไม่ระบุ'}`);
        console.log(`   - Warehouse ID: ${log.warehouse_id}`);
        console.log(`   - Invoice: ${log.invoice_number || 'ไม่ระบุ'}`);
        console.log(`   - จำนวนรายการ: ${log.total_items}`);
        console.log(`   - ยอดรวม: ${log.total_cost}`);
        console.log(`   - สถานะ: ${log.status}`);
        console.log(`   - วันที่สร้าง: ${new Date(log.created_at).toLocaleString('th-TH')}`);
        console.log(`   - หมายเหตุ: ${log.notes || 'ไม่มี'}`);
      });
    } else {
      console.log('📝 ยังไม่มีข้อมูลการรับสินค้าในระบบ');
    }

    // ตรวจสอบตาราง stock_movements ที่เกี่ยวข้อง
    console.log('\n🔍 ตรวจสอบ stock_movements ที่เกี่ยวข้อง...');
    const { data: movements, error: movementError } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('movement_type', 'receive')
      .order('created_at', { ascending: false })
      .limit(10);

    if (movementError) {
      console.log('❌ ข้อผิดพลาดในการดึงข้อมูล stock_movements:', movementError.message);
      return;
    }

    console.log(`✅ จำนวน stock_movements (receive) ทั้งหมด: ${movements?.length || 0}`);
    
    if (movements && movements.length > 0) {
      console.log('\n📋 รายการ stock movements ล่าสุด:');
      movements.forEach((movement, index) => {
        console.log(`\n${index + 1}. Movement ID: ${movement.id}`);
        console.log(`   - Product ID: ${movement.product_id}`);
        console.log(`   - Warehouse ID: ${movement.warehouse_id}`);
        console.log(`   - จำนวน: ${movement.quantity}`);
        console.log(`   - ราคาต่อหน่วย: ${movement.unit_cost}`);
        console.log(`   - Reference: ${movement.reference_number || 'ไม่ระบุ'}`);
        console.log(`   - วันที่สร้าง: ${new Date(movement.created_at).toLocaleString('th-TH')}`);
      });
    }

    // ตรวจสอบตาราง product_inventory
    console.log('\n🔍 ตรวจสอบสต็อกสินค้าปัจจุบัน...');
    const { data: inventory, error: inventoryError } = await supabase
      .from('product_inventory')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(5);

    if (inventoryError) {
      console.log('❌ ข้อผิดพลาดในการดึงข้อมูล product_inventory:', inventoryError.message);
      return;
    }

    console.log(`✅ จำนวนรายการสต็อก: ${inventory?.length || 0}`);
    
    if (inventory && inventory.length > 0) {
      console.log('\n📋 สต็อกสินค้าปัจจุบัน:');
      inventory.forEach((item, index) => {
        console.log(`\n${index + 1}. Product ID: ${item.product_id}`);
        console.log(`   - Warehouse ID: ${item.warehouse_id}`);
        console.log(`   - จำนวนคงเหลือ: ${item.quantity}`);
        console.log(`   - จำนวนที่จอง: ${item.reserved_quantity}`);
        console.log(`   - จำนวนที่ใช้ได้: ${item.available_quantity}`);
        console.log(`   - อัปเดตล่าสุด: ${new Date(item.last_updated).toLocaleString('th-TH')}`);
      });
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// รันการตรวจสอบ
checkReceiveLogs();