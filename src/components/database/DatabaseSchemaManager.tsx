import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Eye, Edit, Trash2, Database, Table as TableIcon, Columns, Key } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';
import { CreateTableDialog } from './CreateTableDialog';
import { EditTableDialog } from './EditTableDialog';
import { TableDetailsDialog } from './TableDetailsDialog';

export const DatabaseSchemaManager = () => {
  const { tables, isLoading, refreshTables } = useDatabase();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');

  const handleViewDetails = (tableName: string) => {
    setSelectedTable(tableName);
    setShowDetailsDialog(true);
  };

  const handleEditTable = (tableName: string) => {
    setSelectedTable(tableName);
    setShowEditDialog(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    refreshTables();
    toast({
      title: "สร้างตารางสำเร็จ",
      description: "ตารางใหม่ได้รับการสร้างแล้ว",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">จัดการโครงสร้างฐานข้อมูล</h2>
          <p className="text-muted-foreground">
            สร้าง แก้ไข และจัดการตารางในฐานข้อมูล
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างตารางใหม่
        </Button>
      </div>

      {/* Tables List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            ตารางทั้งหมด ({tables.length})
          </CardTitle>
          <CardDescription>
            รายการตารางทั้งหมดในฐานข้อมูล
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อตาราง</TableHead>
                  <TableHead>คอลัมน์</TableHead>
                  <TableHead>ขนาด</TableHead>
                  <TableHead>แถว</TableHead>
                  <TableHead>การเข้าถึง</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-4 w-4 text-muted-foreground" />
                        {table.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Columns className="h-4 w-4 text-muted-foreground" />
                        {table.columns.length}
                      </div>
                    </TableCell>
                    <TableCell>{table.size}</TableCell>
                    <TableCell>{table.rows}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {table.accessCount} ครั้ง
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(table.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTable(table.name)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Table Dialog */}
      <CreateTableDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Table Dialog */}
      <EditTableDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        tableName={selectedTable}
        onSuccess={() => {
          setShowEditDialog(false);
          refreshTables();
          toast({
            title: "แก้ไขตารางสำเร็จ",
            description: "ตารางได้รับการอัปเดตแล้ว",
          });
        }}
      />

      {/* Table Details Dialog */}
      <TableDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        tableName={selectedTable}
      />
    </div>
  );
}; 