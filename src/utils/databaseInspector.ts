// Database Inspector - ตรวจสอบตารางที่มีในฐานข้อมูลจริง
import { supabase } from '@/integrations/supabase/client';
import { AuthManager } from './authManager';

export class DatabaseInspector {
  /**
   * ดึงรายชื่อตารางทั้งหมดในฐานข้อมูล
   */
  static async getAllTables(): Promise<string[]> {
    return await AuthManager.withAuth(async () => {
      try {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');

        if (error) throw error;
        
        return data?.map(table => table.table_name) || [];
      } catch (error) {
        console.error('Error fetching tables:', error);
        return [];
      }
    });
  }

  /**
   * ตรวจสอบว่าตารางมีอยู่หรือไม่
   */
  static async tableExists(tableName: string): Promise<boolean> {
    return await AuthManager.withAuth(async () => {
      try {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .single();

        return !error && !!data;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * ดึงโครงสร้างของตาราง
   */
  static async getTableStructure(tableName: string): Promise<any[]> {
    return await AuthManager.withAuth(async () => {
      try {
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position');

        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error(`Error fetching structure for table ${tableName}:`, error);
        return [];
      }
    });
  }

  /**
   * ตรวจสอบตารางที่เกี่ยวข้องกับ Supplier Billing
   */
  static async checkSupplierBillingTables(): Promise<{
    existing: string[];
    missing: string[];
    structures: { [key: string]: any[] };
  }> {
    const requiredTables = [
      'suppliers',
      'supplier_invoices',
      'supplier_invoice_items',
      'supplier_payments',
      'purchase_orders',
      'purchase_order_items',
      'chart_of_accounts',
      'journal_entries',
      'journal_entry_lines'
    ];

    const existing: string[] = [];
    const missing: string[] = [];
    const structures: { [key: string]: any[] } = {};

    for (const table of requiredTables) {
      const exists = await this.tableExists(table);
      if (exists) {
        existing.push(table);
        structures[table] = await this.getTableStructure(table);
      } else {
        missing.push(table);
      }
    }

    return { existing, missing, structures };
  }

  /**
   * ตรวจสอบ Functions และ Procedures
   */
  static async checkFunctions(): Promise<{
    existing: string[];
    missing: string[];
  }> {
    return await AuthManager.withAuth(async () => {
      const requiredFunctions = [
        'generate_supplier_code',
        'generate_invoice_number',
        'generate_payment_number',
        'generate_journal_entry_number',
        'generate_purchase_order_number',
        'update_supplier_balance',
        'get_supplier_monthly_trends'
      ];

      const existing: string[] = [];
      const missing: string[] = [];

      try {
        const { data, error } = await supabase
          .from('information_schema.routines')
          .select('routine_name')
          .eq('routine_schema', 'public')
          .eq('routine_type', 'FUNCTION');

        if (error) throw error;

        const existingFunctions = data?.map(f => f.routine_name) || [];

        for (const func of requiredFunctions) {
          if (existingFunctions.includes(func)) {
            existing.push(func);
          } else {
            missing.push(func);
          }
        }
      } catch (error) {
        console.error('Error checking functions:', error);
        // ถ้าไม่สามารถตรวจสอบได้ ให้ถือว่าทุกอันขาดหายไป
        missing.push(...requiredFunctions);
      }

      return { existing, missing };
    });
  }

  /**
   * ตรวจสอบ Views
   */
  static async checkViews(): Promise<{
    existing: string[];
    missing: string[];
  }> {
    return await AuthManager.withAuth(async () => {
      const requiredViews = [
        'supplier_billing_summary',
        'stock_summary_view'
      ];

      const existing: string[] = [];
      const missing: string[] = [];

      try {
        const { data, error } = await supabase
          .from('information_schema.views')
          .select('table_name')
          .eq('table_schema', 'public');

        if (error) throw error;

        const existingViews = data?.map(v => v.table_name) || [];

        for (const view of requiredViews) {
          if (existingViews.includes(view)) {
            existing.push(view);
          } else {
            missing.push(view);
          }
        }
      } catch (error) {
        console.error('Error checking views:', error);
        missing.push(...requiredViews);
      }

      return { existing, missing };
    });
  }

  /**
   * สร้างรายงานสถานะฐานข้อมูลแบบครบถ้วน
   */
  static async generateDatabaseReport(): Promise<{
    tables: { existing: string[]; missing: string[]; structures: { [key: string]: any[] } };
    functions: { existing: string[]; missing: string[] };
    views: { existing: string[]; missing: string[] };
    summary: {
      totalTables: number;
      missingTables: number;
      totalFunctions: number;
      missingFunctions: number;
      totalViews: number;
      missingViews: number;
      completionPercentage: number;
    };
  }> {
    const [tables, functions, views] = await Promise.all([
      this.checkSupplierBillingTables(),
      this.checkFunctions(),
      this.checkViews()
    ]);

    const totalItems = 
      tables.existing.length + tables.missing.length +
      functions.existing.length + functions.missing.length +
      views.existing.length + views.missing.length;

    const existingItems = 
      tables.existing.length + 
      functions.existing.length + 
      views.existing.length;

    const completionPercentage = totalItems > 0 ? Math.round((existingItems / totalItems) * 100) : 0;

    return {
      tables,
      functions,
      views,
      summary: {
        totalTables: tables.existing.length + tables.missing.length,
        missingTables: tables.missing.length,
        totalFunctions: functions.existing.length + functions.missing.length,
        missingFunctions: functions.missing.length,
        totalViews: views.existing.length + views.missing.length,
        missingViews: views.missing.length,
        completionPercentage
      }
    };
  }
}

export default DatabaseInspector;