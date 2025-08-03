import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Key, 
  Link, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useDatabase, ColumnInfo } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DATA_TYPES = [
  { value: 'uuid', label: 'UUID', description: 'Unique identifier' },
  { value: 'text', label: 'TEXT', description: 'Variable-length string' },
  { value: 'varchar', label: 'VARCHAR', description: 'Variable-length string with limit' },
  { value: 'char', label: 'CHAR', description: 'Fixed-length string' },
  { value: 'integer', label: 'INTEGER', description: '32-bit integer' },
  { value: 'bigint', label: 'BIGINT', description: '64-bit integer' },
  { value: 'smallint', label: 'SMALLINT', description: '16-bit integer' },
  { value: 'numeric', label: 'NUMERIC', description: 'Decimal number' },
  { value: 'decimal', label: 'DECIMAL', description: 'Decimal number' },
  { value: 'real', label: 'REAL', description: '32-bit floating point' },
  { value: 'double precision', label: 'DOUBLE PRECISION', description: '64-bit floating point' },
  { value: 'boolean', label: 'BOOLEAN', description: 'True/false value' },
  { value: 'date', label: 'DATE', description: 'Date only' },
  { value: 'time', label: 'TIME', description: 'Time only' },
  { value: 'timestamp', label: 'TIMESTAMP', description: 'Date and time' },
  { value: 'timestamptz', label: 'TIMESTAMPTZ', description: 'Date and time with timezone' },
  { value: 'interval', label: 'INTERVAL', description: 'Time interval' },
  { value: 'json', label: 'JSON', description: 'JSON data' },
  { value: 'jsonb', label: 'JSONB', description: 'Binary JSON' },
  { value: 'bytea', label: 'BYTEA', description: 'Binary data' },
  { value: 'point', label: 'POINT', description: 'Geometric point' },
  { value: 'line', label: 'LINE', description: 'Geometric line' },
  { value: 'circle', label: 'CIRCLE', description: 'Geometric circle' },
  { value: 'box', label: 'BOX', description: 'Geometric box' },
  { value: 'path', label: 'PATH', description: 'Geometric path' },
  { value: 'polygon', label: 'POLYGON', description: 'Geometric polygon' },
  { value: 'cidr', label: 'CIDR', description: 'Network address' },
  { value: 'inet', label: 'INET', description: 'IP address' },
  { value: 'macaddr', label: 'MACADDR', description: 'MAC address' },
  { value: 'bit', label: 'BIT', description: 'Fixed-length bit string' },
  { value: 'bit varying', label: 'BIT VARYING', description: 'Variable-length bit string' },
  { value: 'xml', label: 'XML', description: 'XML data' },
  { value: 'tsvector', label: 'TSVECTOR', description: 'Text search vector' },
  { value: 'tsquery', label: 'TSQUERY', description: 'Text search query' },
  { value: 'uuid[]', label: 'UUID[]', description: 'Array of UUIDs' },
  { value: 'text[]', label: 'TEXT[]', description: 'Array of text' },
  { value: 'integer[]', label: 'INTEGER[]', description: 'Array of integers' },
  { value: 'numeric[]', label: 'NUMERIC[]', description: 'Array of decimals' },
  { value: 'boolean[]', label: 'BOOLEAN[]', description: 'Array of booleans' },
  { value: 'date[]', label: 'DATE[]', description: 'Array of dates' },
  { value: 'timestamp[]', label: 'TIMESTAMP[]', description: 'Array of timestamps' },
  { value: 'json[]', label: 'JSON[]', description: 'Array of JSON' },
  { value: 'jsonb[]', label: 'JSONB[]', description: 'Array of binary JSON' }
];

export const CreateTableDialog: React.FC<CreateTableDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnInfo[]>([
    {
      name: 'id',
      type: 'uuid',
      isNullable: false,
      defaultValue: 'gen_random_uuid()',
      isPrimaryKey: true,
      isUnique: false,
      isForeignKey: false
    }
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const { createTable } = useDatabase();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!tableName.trim()) {
      newErrors.push('กรุณาระบุชื่อตาราง');
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      newErrors.push('ชื่อตารางต้องขึ้นต้นด้วยตัวอักษรหรือ _ และมีได้เฉพาะตัวอักษร ตัวเลข และ _');
    }

    if (columns.length === 0) {
      newErrors.push('ตารางต้องมีคอลัมน์อย่างน้อย 1 คอลัมน์');
    }

    const columnNames = columns.map(col => col.name.toLowerCase());
    const duplicateNames = columnNames.filter((name, index) => columnNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      newErrors.push(`มีชื่อคอลัมน์ซ้ำ: ${duplicateNames.join(', ')}`);
    }

    const primaryKeys = columns.filter(col => col.isPrimaryKey);
    if (primaryKeys.length === 0) {
      newErrors.push('ตารางต้องมี Primary Key อย่างน้อย 1 คอลัมน์');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createTable(tableName, columns);
      toast({
        title: "สำเร็จ",
        description: `สร้างตาราง ${tableName} เรียบร้อยแล้ว`
      });
      onSuccess();
      resetForm();
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างตาราง',
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setTableName('');
    setColumns([
      {
        name: 'id',
        type: 'uuid',
        isNullable: false,
        defaultValue: 'gen_random_uuid()',
        isPrimaryKey: true,
        isUnique: false,
        isForeignKey: false
      }
    ]);
    setErrors([]);
  };

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        name: '',
        type: 'text',
        isNullable: true,
        defaultValue: null,
        isPrimaryKey: false,
        isUnique: false,
        isForeignKey: false
      }
    ]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: keyof ColumnInfo, value: any) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const getDataTypeDescription = (type: string) => {
    return DATA_TYPES.find(dt => dt.value === type)?.description || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างตารางใหม่</DialogTitle>
          <DialogDescription>
            กำหนดโครงสร้างของตารางใหม่ในฐานข้อมูล
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="tableName">ชื่อตาราง</Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="example_table"
            />
            <p className="text-sm text-muted-foreground">
              ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น
            </p>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 border border-destructive rounded-md bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">ข้อผิดพลาด</span>
              </div>
              <ul className="text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Columns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>คอลัมน์</Label>
              <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มคอลัมน์
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">ชื่อคอลัมน์</TableHead>
                    <TableHead className="w-[150px]">ประเภทข้อมูล</TableHead>
                    <TableHead className="w-[100px]">Nullable</TableHead>
                    <TableHead className="w-[150px]">ค่าเริ่มต้น</TableHead>
                    <TableHead className="w-[100px]">Primary Key</TableHead>
                    <TableHead className="w-[100px]">Unique</TableHead>
                    <TableHead className="w-[80px]">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((column, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={column.name}
                          onChange={(e) => updateColumn(index, 'name', e.target.value)}
                          placeholder="column_name"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={column.type}
                          onValueChange={(value) => updateColumn(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {type.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={column.isNullable}
                          onCheckedChange={(checked) => 
                            updateColumn(index, 'isNullable', checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={column.defaultValue || ''}
                          onChange={(e) => updateColumn(index, 'defaultValue', e.target.value || null)}
                          placeholder="NULL"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={column.isPrimaryKey}
                          onCheckedChange={(checked) => 
                            updateColumn(index, 'isPrimaryKey', checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={column.isUnique}
                          onCheckedChange={(checked) => 
                            updateColumn(index, 'isUnique', checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeColumn(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>ตัวอย่าง SQL</Label>
            <div className="p-4 bg-muted rounded-md font-mono text-sm">
              {(() => {
                const columnDefinitions = columns.map(col => {
                  let def = `${col.name} ${col.type}`;
                  if (!col.isNullable) def += ' NOT NULL';
                  if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
                  if (col.isPrimaryKey) def += ' PRIMARY KEY';
                  if (col.isUnique) def += ' UNIQUE';
                  return def;
                }).join(',\n  ');

                return `CREATE TABLE ${tableName} (\n  ${columnDefinitions}\n);`;
              })()}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit}>
            <CheckCircle className="h-4 w-4 mr-2" />
            สร้างตาราง
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 