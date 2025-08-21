import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSerialFunction() {
  try {
    console.log('🔧 สร้างฟังก์ชัน generate_serial_number...');
    
    // สร้างฟังก์ชัน generate_serial_number
    const { data, error } = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION public.generate_serial_number(
          product_code TEXT,
          warehouse_code TEXT
        )
        RETURNS TEXT
        LANGUAGE plpgsql
        AS $$
        DECLARE
          serial_number TEXT;
          counter INTEGER;
        BEGIN
          -- สร้างหมายเลขซีเรียลในรูปแบบ: PRODUCT_CODE-WAREHOUSE_CODE-YYYYMMDD-NNNN
          -- เช่น: PROD12345678-BR1234-20241221-0001
          
          -- หาหมายเลขลำดับถัดไป
          SELECT COALESCE(MAX(
            CAST(
              SUBSTRING(
                serial_number FROM 
                LENGTH(product_code || '-' || warehouse_code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-') + 1
              ) AS INTEGER
            )
          ), 0) + 1
          INTO counter
          FROM serial_numbers
          WHERE serial_number LIKE product_code || '-' || warehouse_code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
          
          -- สร้างหมายเลขซีเรียล
          serial_number := product_code || '-' || warehouse_code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
          
          RETURN serial_number;
        END;
        $$;
      `
    });
    
    if (error) {
      console.error('❌ Error creating function:', error);
      return;
    }
    
    console.log('✅ สร้างฟังก์ชัน generate_serial_number สำเร็จ!');
    
    // ทดสอบฟังก์ชัน
    console.log('🧪 ทดสอบฟังก์ชัน...');
    const { data: testResult, error: testError } = await supabase.rpc('generate_serial_number', {
      product_code: 'PROD-TEST',
      warehouse_code: 'BR-001'
    });
    
    if (testError) {
      console.error('❌ Error testing function:', testError);
      return;
    }
    
    console.log('✅ ทดสอบฟังก์ชันสำเร็จ! Serial Number:', testResult);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

createSerialFunction();