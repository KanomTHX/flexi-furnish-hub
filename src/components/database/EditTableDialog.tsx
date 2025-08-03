import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useDatabase, ColumnInfo } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  onSuccess: () => void;
}

export const EditTableDialog: React.FC<EditTableDialogProps> = ({ 
  open, 
  onOpenChange, 
  tableName, 
  onSuccess 
}) => {
  const { tables, addColumn, removeColumn } = useDatabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('VARCHAR');
  
  const table = tables.find(t => t.name === tableName);

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาระบุชื่อคอลัมน์",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
              const newColumn: ColumnInfo = {
          name: newColumnName,
          type: newColumnType,
          isNullable: true,
          defaultValue: null,
          isPrimaryKey: false,
          isUnique: false,
          isForeignKey: false
        };

      await addColumn(tableName, newColumn);
      
      setNewColumnName('');
      setNewColumnType('VARCHAR');
      
      toast({
        title: "เพิ่มคอลัมน์สำเร็จ",
        description: `คอลัมน์ ${newColumnName} ถูกเพิ่มแล้ว`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "เพิ่มคอลัมน์ล้มเหลว",
        description: "ไม่สามารถเพิ่มคอลัมน์ได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveColumn = async (columnName: string) => {
    setIsLoading(true);
    try {
      await removeColumn(tableName, columnName);
      
      toast({
        title: "ลบคอลัมน์สำเร็จ",
        description: `คอลัมน์ ${columnName} ถูกลบแล้ว`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "ลบคอลัมน์ล้มเหลว",
        description: "ไม่สามารถลบคอลัมน์ได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!table) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขตาราง: {tableName}</DialogTitle>
          <DialogDescription>แก้ไขโครงสร้างและคอลัมน์ของตาราง</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Table Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">ชื่อตาราง</Label>
              <div className="text-sm text-muted-foreground mt-1">{table.name}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">ขนาด</Label>
              <div className="text-sm text-muted-foreground mt-1">{table.size}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">จำนวนแถว</Label>
              <div className="text-sm text-muted-foreground mt-1">{table.rows}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">จำนวนคอลัมน์</Label>
              <div className="text-sm text-muted-foreground mt-1">{table.columns.length}</div>
            </div>
          </div>

          {/* Add New Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">เพิ่มคอลัมน์ใหม่</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="columnName">ชื่อคอลัมน์</Label>
                <Input
                  id="columnName"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="ชื่อคอลัมน์"
                />
              </div>
              <div>
                <Label htmlFor="columnType">ประเภทข้อมูล</Label>
                <select
                  id="columnType"
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="VARCHAR">VARCHAR</option>
                  <option value="INTEGER">INTEGER</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="TEXT">TEXT</option>
                  <option value="TIMESTAMP">TIMESTAMP</option>
                  <option value="DECIMAL">DECIMAL</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddColumn}
                  disabled={isLoading || !newColumnName.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มคอลัมน์
                </Button>
              </div>
            </div>
          </div>

          {/* Columns Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">คอลัมน์ทั้งหมด</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อคอลัมน์</TableHead>
                  <TableHead>ประเภทข้อมูล</TableHead>
                  <TableHead>Nullable</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Primary Key</TableHead>
                  <TableHead>Unique</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveColumn(column.name)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Indexes Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ดัชนี</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อดัชนี</TableHead>
                  <TableHead>คอลัมน์</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
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
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Constraints Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ข้อจำกัด</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อข้อจำกัด</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>คอลัมน์</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
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
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            <Save className="h-4 w-4 mr-2" />
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 