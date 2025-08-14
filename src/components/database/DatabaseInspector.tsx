// Database Inspector Component - ตรวจสอบสถานะฐานข้อมูล
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Code,
  Table,
  Zap,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DatabaseInspector } from '@/utils/databaseInspector';

export function DatabaseInspectorComponent() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ตรวจสอบฐานข้อมูล
  const inspectDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const databaseReport = await DatabaseInspector.generateDatabaseReport();
      setReport(databaseReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // สร้าง SQL สำหรับตารางที่ขาดหายไป
  const generateMissingSQL = () => {
    if (!report) return '';

    let sql = `-- SQL สำหรับสร้างตารางและ Functions ที่ขาดหายไป
-- Generated on ${new Date().toISOString()}

`;

    // ตารางที่ขาดหายไป
    if (report.tables.missing.length > 0) {
      sql += `-- ========================================
-- MISSING TABLES
-- ========================================

`;

      report.tables.missing.forEach((table: string) => {
        sql += `-- TODO: Create table ${table}
-- ${getTableSQL(table)}

`;
      });
    }

    // Functions ที่ขาดหายไป
    if (report.functions.missing.length > 0) {
      sql += `-- ========================================
-- MISSING FUNCTIONS
-- ========================================

`;

      report.functions.missing.forEach((func: string) => {
        sql += `-- TODO: Create function ${func}
-- ${getFunctionSQL(func)}

`;
      });
    }

    // Views ที่ขาดหายไป
    if (report.views.missing.length > 0) {
      sql += `-- ========================================
-- MISSING VIEWS
-- ========================================

`;

      report.views.missing.forEach((view: string) => {
        sql += `-- TODO: Create view ${view}
-- ${getViewSQL(view)}

`;
      });
    }

    return sql;
  };

  // ดาวน์โหลด SQL
  const downloadSQL = () => {
    const sql = generateMissingSQL();
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missing_supplier_billing_tables.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // เรียกใช้เมื่อ component โหลด
  useEffect(() => {
    inspectDatabase();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>กำลังตรวจสอบฐานข้อมูล...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <XCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</p>
            <p className="mb-4">{error}</p>
            <Button onClick={inspectDatabase}>
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>ไม่มีข้อมูลการตรวจสอบ</p>
            <Button onClick={inspectDatabase} className="mt-4">
              <Eye className="h-4 w-4 mr-2" />
              ตรวจสอบฐานข้อมูล
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Inspector</h2>
          <p className="text-muted-foreground">ตรวจสอบสถานะตารางและ Functions ในฐานข้อมูล</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={inspectDatabase} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          {report.summary.missingTables > 0 || report.summary.missingFunctions > 0 || report.summary.missingViews > 0 ? (
            <Button onClick={downloadSQL}>
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลด SQL
            </Button>
          ) : null}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ความสมบูรณ์</p>
                <p className="text-2xl font-bold">{report.summary.completionPercentage}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={report.summary.completionPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ตาราง</p>
                <p className="text-2xl font-bold">{report.tables.existing.length}/{report.summary.totalTables}</p>
                {report.summary.missingTables > 0 && (
                  <p className="text-xs text-red-600">ขาด: {report.summary.missingTables}</p>
                )}
              </div>
              <Table className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Functions</p>
                <p className="text-2xl font-bold">{report.functions.existing.length}/{report.summary.totalFunctions}</p>
                {report.summary.missingFunctions > 0 && (
                  <p className="text-xs text-red-600">ขาด: {report.summary.missingFunctions}</p>
                )}
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-2xl font-bold">{report.views.existing.length}/{report.summary.totalViews}</p>
                {report.summary.missingViews > 0 && (
                  <p className="text-xs text-red-600">ขาด: {report.summary.missingViews}</p>
                )}
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report */}
      <Tabs defaultValue="tables">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tables">ตาราง</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="views">Views</TabsTrigger>
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Existing Tables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  ตารางที่มีอยู่ ({report.tables.existing.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.tables.existing.map((table: string) => (
                    <div key={table} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{table}</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        มีอยู่
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Tables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  ตารางที่ขาดหายไป ({report.tables.missing.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.tables.missing.length === 0 ? (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>ตารางครบถ้วนแล้ว!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.tables.missing.map((table: string) => (
                      <div key={table} className="flex items-center justify-between p-2 border rounded border-red-200">
                        <span className="font-medium">{table}</span>
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          ขาดหายไป
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Functions Tab */}
        <TabsContent value="functions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Existing Functions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Functions ที่มีอยู่ ({report.functions.existing.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.functions.existing.map((func: string) => (
                    <div key={func} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{func}</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        มีอยู่
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Functions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Functions ที่ขาดหายไป ({report.functions.missing.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.functions.missing.length === 0 ? (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Functions ครบถ้วนแล้ว!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.functions.missing.map((func: string) => (
                      <div key={func} className="flex items-center justify-between p-2 border rounded border-red-200">
                        <span className="font-medium">{func}</span>
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          ขาดหายไป
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Views Tab */}
        <TabsContent value="views" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Existing Views */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Views ที่มีอยู่ ({report.views.existing.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.views.existing.map((view: string) => (
                    <div key={view} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{view}</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        มีอยู่
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Views */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Views ที่ขาดหายไป ({report.views.missing.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.views.missing.length === 0 ? (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Views ครบถ้วนแล้ว!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.views.missing.map((view: string) => (
                      <div key={view} className="flex items-center justify-between p-2 border rounded border-red-200">
                        <span className="font-medium">{view}</span>
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          ขาดหายไป
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* SQL Preview */}
      {(report.summary.missingTables > 0 || report.summary.missingFunctions > 0 || report.summary.missingViews > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              SQL สำหรับสร้างส่วนที่ขาดหายไป
            </CardTitle>
            <CardDescription>
              คลิก "ดาวน์โหลด SQL" เพื่อได้ไฟล์ SQL ที่สมบูรณ์
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-96">
              <code>{generateMissingSQL()}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions สำหรับสร้าง SQL
function getTableSQL(tableName: string): string {
  const tableDefinitions: { [key: string]: string } = {
    'suppliers': `CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_code VARCHAR(20) UNIQUE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  tax_id VARCHAR(20),
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
    'supplier_invoices': `CREATE TABLE supplier_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status payment_status DEFAULT 'pending',
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
    'supplier_invoice_items': `CREATE TABLE supplier_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
    'supplier_payments': `CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  invoice_id UUID REFERENCES supplier_invoices(id),
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card')),
  reference_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
  };

  return tableDefinitions[tableName] || `-- Definition for ${tableName} not found`;
}

function getFunctionSQL(functionName: string): string {
  const functionDefinitions: { [key: string]: string } = {
    'generate_supplier_code': `CREATE OR REPLACE FUNCTION generate_supplier_code() RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(supplier_code FROM 4) AS INTEGER)), 0) + 1
  INTO counter
  FROM suppliers
  WHERE supplier_code ~ '^SUP[0-9]+$';
  
  new_code := 'SUP' || LPAD(counter::TEXT, 3, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;`,
    'update_supplier_balance': `CREATE OR REPLACE FUNCTION update_supplier_balance(
  supplier_id UUID,
  amount DECIMAL(12,2)
) RETURNS VOID AS $$
BEGIN
  UPDATE suppliers 
  SET 
    current_balance = current_balance + amount,
    updated_at = NOW()
  WHERE id = supplier_id;
END;
$$ LANGUAGE plpgsql;`
  };

  return functionDefinitions[functionName] || `-- Definition for ${functionName} not found`;
}

function getViewSQL(viewName: string): string {
  const viewDefinitions: { [key: string]: string } = {
    'supplier_billing_summary': `CREATE OR REPLACE VIEW supplier_billing_summary AS
SELECT 
  s.id as supplier_id,
  s.supplier_name,
  s.supplier_code,
  s.current_balance,
  COUNT(si.id) as total_invoices,
  COALESCE(SUM(si.total_amount), 0) as total_amount,
  COALESCE(SUM(si.paid_amount), 0) as paid_amount,
  COALESCE(SUM(si.remaining_amount), 0) as outstanding_amount,
  COALESCE(SUM(CASE WHEN si.due_date < CURRENT_DATE AND si.remaining_amount > 0 THEN si.remaining_amount ELSE 0 END), 0) as overdue_amount,
  MAX(sp.payment_date) as last_payment_date,
  COALESCE(AVG(EXTRACT(DAY FROM (sp.payment_date - si.invoice_date))), 0) as average_payment_days
FROM suppliers s
LEFT JOIN supplier_invoices si ON s.id = si.supplier_id
LEFT JOIN supplier_payments sp ON si.id = sp.invoice_id
WHERE s.status = 'active'
GROUP BY s.id, s.supplier_name, s.supplier_code, s.current_balance;`
  };

  return viewDefinitions[viewName] || `-- Definition for ${viewName} not found`;
}