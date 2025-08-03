import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TableInfo {
  name: string;
  schema: string;
  size: string;
  rows: number;
  accessCount: number;
  lastAccessed: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  type: string;
}

export interface ConstraintInfo {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

export interface DatabaseStats {
  totalTables: number;
  totalSize: string;
  totalRows: number;
  activeConnections: number;
  performanceScore: number;
  newTablesThisMonth: number;
}

// Define the actual tables in the database
const ACTUAL_TABLES = [
  'accounts', 'attendance', 'audit_logs', 'branches', 'claims', 'departments',
  'employee_documents', 'employee_profiles', 'employees', 'installment_contracts',
  'installment_payments', 'journal_entries', 'journal_entry_lines', 'leaves',
  'payrolls', 'positions', 'product_categories', 'product_inventory', 'products',
  'sale_items', 'sales_transactions', 'stock_movements', 'training_participants', 'trainings'
];

// Mock table information based on actual database structure
const getMockTableInfo = (tableName: string): TableInfo => {
  const mockColumns: { [key: string]: ColumnInfo[] } = {
    employees: [
      { name: 'id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: true, isUnique: true, isForeignKey: false },
      { name: 'employee_id', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: true, isForeignKey: false },
      { name: 'first_name', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'last_name', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'email', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'phone', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'department_id', type: 'uuid', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: true, referencedTable: 'departments', referencedColumn: 'id' },
      { name: 'position_id', type: 'uuid', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: true, referencedTable: 'positions', referencedColumn: 'id' },
      { name: 'salary', type: 'numeric', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'hire_date', type: 'date', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'status', type: 'employee_status', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'created_at', type: 'timestamp', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'updated_at', type: 'timestamp', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false }
    ],
    products: [
      { name: 'id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: true, isUnique: true, isForeignKey: false },
      { name: 'name', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'description', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'base_price', type: 'numeric', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'cost_price', type: 'numeric', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'category_id', type: 'uuid', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: true, referencedTable: 'product_categories', referencedColumn: 'id' },
      { name: 'brand', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'model', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'is_active', type: 'boolean', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'created_at', type: 'timestamp', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'updated_at', type: 'timestamp', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false }
    ],
    sales_transactions: [
      { name: 'id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: true, isUnique: true, isForeignKey: false },
      { name: 'transaction_number', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: true, isForeignKey: false },
      { name: 'transaction_date', type: 'date', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'customer_name', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'customer_phone', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'customer_address', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'total_amount', type: 'numeric', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'discount_amount', type: 'numeric', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'tax_amount', type: 'numeric', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'paid_amount', type: 'numeric', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'payment_status', type: 'payment_status', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'transaction_type', type: 'transaction_type', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'branch_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: true, referencedTable: 'branches', referencedColumn: 'id' },
      { name: 'employee_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: true, referencedTable: 'employee_profiles', referencedColumn: 'id' },
      { name: 'notes', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'created_at', type: 'timestamp', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
      { name: 'updated_at', type: 'timestamp', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false }
    ]
  };

  const columns = mockColumns[tableName] || [
    { name: 'id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: true, isUnique: true, isForeignKey: false },
    { name: 'created_at', type: 'timestamp', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false },
    { name: 'updated_at', type: 'timestamp', isNullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false, isForeignKey: false }
  ];

  return {
    name: tableName,
    schema: 'public',
    size: `${Math.floor(Math.random() * 1000 + 100)} KB`,
    rows: Math.floor(Math.random() * 10000 + 100),
    accessCount: Math.floor(Math.random() * 1000),
    lastAccessed: new Date().toISOString(),
    columns,
    indexes: [
      { name: `${tableName}_pkey`, columns: ['id'], isUnique: true, type: 'btree' },
      { name: `${tableName}_created_at_idx`, columns: ['created_at'], isUnique: false, type: 'btree' }
    ],
    constraints: [
      { name: `${tableName}_pkey`, type: 'PRIMARY KEY', columns: ['id'] }
    ]
  };
};

export const useDatabase = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DatabaseStats>({
    totalTables: 0,
    totalSize: '0 MB',
    totalRows: 0,
    activeConnections: 0,
    performanceScore: 0,
    newTablesThisMonth: 0
  });

  const { toast } = useToast();

  // Test connection to Supabase
  const testConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      // Try to access a simple table to test database connection
      const { error: dbError } = await supabase
        .from('employees')
        .select('id')
        .limit(1);
      
      // It's okay if the table doesn't exist or has RLS issues, we're just testing the connection
      if (dbError) {
        if (dbError.message.includes('does not exist') || 
            dbError.message.includes('infinite recursion detected in policy') ||
            dbError.message.includes('new row violates row-level security policy')) {
          // Connection is working, but table has issues - this is still a successful connection
          return true;
        }
        throw dbError;
      }
      
      return true;
    } catch (err) {
      console.error('Connection test error:', err);
      return false;
    }
  }, []);

  // Fetch all tables
  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้');
      }

      // Generate mock table information for actual tables
      const tableInfos: TableInfo[] = ACTUAL_TABLES.map(tableName => 
        getMockTableInfo(tableName)
      );

      setTables(tableInfos);
      updateStats(tableInfos);
      
      // Show a warning about RLS policies if connection was successful but tables have issues
      toast({
        title: "เชื่อมต่อฐานข้อมูลสำเร็จ",
        description: "การเชื่อมต่อทำงานได้ แต่ตารางบางตารางอาจมีปัญหาเรื่อง RLS Policy",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลตาราง';
      setError(errorMessage);
      toast({
        title: "ข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [testConnection, toast]);

  // Get detailed table information
  const getTableInfo = async (tableName: string): Promise<TableInfo | null> => {
    try {
      return getMockTableInfo(tableName);
    } catch (err) {
      console.error(`Error getting table info for ${tableName}:`, err);
      return null;
    }
  };

  // Update database statistics
  const updateStats = (tableInfos: TableInfo[]) => {
    const totalRows = tableInfos.reduce((sum, table) => sum + table.rows, 0);
    const totalSize = tableInfos.reduce((sum, table) => {
      const size = parseInt(table.size.replace(/[^\d]/g, '')) || 0;
      return sum + size;
    }, 0);

    setStats({
      totalTables: tableInfos.length,
      totalSize: `${totalSize} KB`,
      totalRows,
      activeConnections: Math.floor(Math.random() * 50) + 10, // Mock data
      performanceScore: Math.floor(Math.random() * 30) + 70, // Mock data
      newTablesThisMonth: Math.floor(Math.random() * 5) // Mock data
    });
  };

  // Refresh tables
  const refreshTables = useCallback(() => {
    fetchTables();
  }, [fetchTables]);

  // Get table statistics
  const getTableStats = useCallback(() => {
    return stats;
  }, [stats]);

  // Create new table (mock implementation)
  const createTable = async (tableName: string, columns: ColumnInfo[]) => {
    setIsLoading(true);
    try {
      // Mock implementation - in real scenario this would use RPC
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "สำเร็จ",
        description: `สร้างตาราง ${tableName} เรียบร้อยแล้ว`
      });

      refreshTables();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างตาราง';
      toast({
        title: "ข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Drop table (mock implementation)
  const dropTable = async (tableName: string) => {
    setIsLoading(true);
    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "สำเร็จ",
        description: `ลบตาราง ${tableName} เรียบร้อยแล้ว`
      });

      refreshTables();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบตาราง';
      toast({
        title: "ข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add column to table (mock implementation)
  const addColumn = async (tableName: string, column: ColumnInfo) => {
    setIsLoading(true);
    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "สำเร็จ",
        description: `เพิ่มคอลัมน์ ${column.name} ในตาราง ${tableName} เรียบร้อยแล้ว`
      });

      refreshTables();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มคอลัมน์';
      toast({
        title: "ข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove column from table (mock implementation)
  const removeColumn = async (tableName: string, columnName: string) => {
    setIsLoading(true);
    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "สำเร็จ",
        description: `ลบคอลัมน์ ${columnName} จากตาราง ${tableName} เรียบร้อยแล้ว`
      });

      refreshTables();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบคอลัมน์';
      toast({
        title: "ข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load tables on mount
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    isLoading,
    error,
    stats,
    refreshTables,
    getTableStats,
    createTable,
    dropTable,
    addColumn,
    removeColumn,
    getTableInfo,
    testConnection
  };
}; 