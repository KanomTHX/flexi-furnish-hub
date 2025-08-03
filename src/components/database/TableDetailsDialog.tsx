import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Table as TableIcon, Columns, Key, Link, Eye, Download, Copy, Share2 } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { Label } from '@/components/ui/label';

interface TableDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
}

export const TableDetailsDialog: React.FC<TableDetailsDialogProps> = ({ 
  open, 
  onOpenChange, 
  tableName 
}) => {
  const { tables } = useDatabase();
  const table = tables.find(t => t.name === tableName);

  if (!table) {
    return null;
  }

  const getTableSize = (size: string) => {
    const sizeNum = parseInt(size.replace(/[^\d]/g, ''));
    if (sizeNum > 1024) return `${(sizeNum / 1024).toFixed(1)} MB`;
    return size;
  };

  const generateSQL = () => {
    const columns = table.columns.map(col => {
      let sql = `  ${col.name} ${col.type}`;
      if (!col.isNullable) sql += ' NOT NULL';
      if (col.defaultValue) sql += ` DEFAULT ${col.defaultValue}`;
      if (col.isPrimaryKey) sql += ' PRIMARY KEY';
      if (col.isUnique) sql += ' UNIQUE';
      return sql;
    }).join(',\n');

    return `CREATE TABLE ${table.name} (\n${columns}\n);`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            รายละเอียดตาราง: {tableName}
          </DialogTitle>
          <DialogDescription>ดูรายละเอียดโครงสร้างและข้อมูลของตาราง</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Table Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TableIcon className="h-4 w-4 text-blue-600" />
                <Label className="text-sm font-medium">ชื่อตาราง</Label>
              </div>
              <div className="text-lg font-semibold">{table.name}</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Columns className="h-4 w-4 text-green-600" />
                <Label className="text-sm font-medium">จำนวนแถว</Label>
              </div>
              <div className="text-lg font-semibold">{table.rows.toLocaleString()}</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-purple-600" />
                <Label className="text-sm font-medium">ขนาด</Label>
              </div>
              <div className="text-lg font-semibold">{getTableSize(table.size)}</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-orange-600" />
                <Label className="text-sm font-medium">คอลัมน์</Label>
              </div>
              <div className="text-lg font-semibold">{table.columns.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="columns" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="columns" className="flex items-center gap-2">
                <Columns className="h-4 w-4" />
                คอลัมน์
              </TabsTrigger>
              <TabsTrigger value="indexes" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                ดัชนี
              </TabsTrigger>
              <TabsTrigger value="constraints" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                ข้อจำกัด
              </TabsTrigger>
              <TabsTrigger value="sql" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                SQL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="columns" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">คอลัมน์ทั้งหมด</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      คัดลอก
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      ดาวน์โหลด
                    </Button>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อคอลัมน์</TableHead>
                      <TableHead>ประเภทข้อมูล</TableHead>
                      <TableHead>Nullable</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Primary Key</TableHead>
                      <TableHead>Unique</TableHead>
                      <TableHead>Foreign Key</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.columns.map((column) => (
                      <TableRow key={column.name}>
                        <TableCell className="font-medium">{column.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{column.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={column.isNullable ? "secondary" : "default"}>
                            {column.isNullable ? "ใช่" : "ไม่"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {column.defaultValue || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={column.isPrimaryKey ? "default" : "secondary"}>
                            {column.isPrimaryKey ? "ใช่" : "ไม่"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={column.isUnique ? "default" : "secondary"}>
                            {column.isUnique ? "ใช่" : "ไม่"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={column.isForeignKey ? "default" : "secondary"}>
                            {column.isForeignKey ? "ใช่" : "ไม่"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="indexes" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">ดัชนี</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อดัชนี</TableHead>
                      <TableHead>คอลัมน์</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>Unique</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.indexes.map((index) => (
                      <TableRow key={index.name}>
                        <TableCell className="font-medium">{index.name}</TableCell>
                        <TableCell>{index.columns.join(', ')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{index.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={index.isUnique ? "default" : "secondary"}>
                            {index.isUnique ? "ใช่" : "ไม่"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">ข้อจำกัด</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อข้อจำกัด</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>คอลัมน์</TableHead>
                      <TableHead>ตารางอ้างอิง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.constraints.map((constraint) => (
                      <TableRow key={constraint.name}>
                        <TableCell className="font-medium">{constraint.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{constraint.type}</Badge>
                        </TableCell>
                        <TableCell>{constraint.columns.join(', ')}</TableCell>
                        <TableCell>
                          {constraint.referencedTable ? (
                            <span className="text-sm text-muted-foreground">
                              {constraint.referencedTable}.{constraint.referencedColumns?.join(', ')}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="sql" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">SQL CREATE TABLE</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(generateSQL())}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      คัดลอก
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([generateSQL()], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${table.name}.sql`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ดาวน์โหลด
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    <code>{generateSQL()}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
            <Button>
              <Share2 className="h-4 w-4 mr-2" />
              แชร์
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 