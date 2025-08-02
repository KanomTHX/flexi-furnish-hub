import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WarehouseTask, TaskFilter } from '@/types/warehouse';
import { CheckSquare, Clock, User, AlertTriangle, Search, Filter, Download } from 'lucide-react';

interface TaskManagementProps {
  tasks: WarehouseTask[];
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onExport: () => void;
  onAssignTask: (taskId: string, assigneeId: string) => void;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string, notes?: string) => void;
  onCancelTask: (taskId: string, reason: string) => void;
}

export function TaskManagement({
  tasks,
  filter,
  onFilterChange,
  onExport,
  onAssignTask,
  onStartTask,
  onCompleteTask,
  onCancelTask
}: TaskManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      assigned: 'outline', 
      in_progress: 'default',
      completed: 'default',
      cancelled: 'destructive'
    } as const;

    const labels = {
      pending: 'รอดำเนินการ',
      assigned: 'มอบหมายแล้ว',
      in_progress: 'กำลังดำเนินการ', 
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    const labels = {
      low: 'ต่ำ',
      medium: 'ปานกลาง', 
      high: 'สูง',
      urgent: 'เร่งด่วน'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[priority as keyof typeof labels] || priority}
      </span>
    );
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filter.status || task.status === filter.status;
    const matchesPriority = !filter.priority || task.priority === filter.priority;
    const matchesWarehouse = !filter.warehouseId || task.warehouseId === filter.warehouseId;
    const matchesAssignee = !filter.assignedTo || task.assignedTo === filter.assignedTo;

    return matchesSearch && matchesStatus && matchesPriority && matchesWarehouse && matchesAssignee;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การจัดการงาน</h2>
          <p className="text-muted-foreground">
            จัดการและติดตามงานในคลังสินค้า
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
          <Button>
            <CheckSquare className="w-4 h-4 mr-2" />
            เพิ่มงานใหม่
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ตัวกรองและค้นหา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหางาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filter.status || ''}
              onValueChange={(value) => onFilterChange({ ...filter, status: value as any || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
                <SelectItem value="on_hold">หยุดชั่วคราว</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.priority || ''}
              onValueChange={(value) => onFilterChange({ ...filter, priority: value as any || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
                <SelectItem value="medium">ปานกลาง</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="urgent">เร่งด่วน</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.type || ''}
              onValueChange={(value) => onFilterChange({ ...filter, type: value as any || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ประเภทงาน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="receiving">รับสินค้า</SelectItem>
                <SelectItem value="picking">เบิกสินค้า</SelectItem>
                <SelectItem value="packing">แพ็คสินค้า</SelectItem>
                <SelectItem value="shipping">ส่งสินค้า</SelectItem>
                <SelectItem value="counting">นับสินค้า</SelectItem>
                <SelectItem value="maintenance">บำรุงรักษา</SelectItem>
                <SelectItem value="cleaning">ทำความสะอาด</SelectItem>
                <SelectItem value="inspection">ตรวจสอบ</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                onFilterChange({});
                setSearchTerm('');
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">ไม่พบงานที่ตรงกับเงื่อนไขการค้นหา</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{task.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>ผู้รับผิดชอบ: {task.assignedTo || 'ยังไม่มอบหมาย'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>กำหนดเสร็จ: {new Date(task.dueDate).toLocaleDateString('th-TH')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <span>ประเภท: {task.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>ระยะเวลาที่ประมาณ: {task.estimatedDuration} นาที</span>
                      </div>
                    </div>

                    {task.notes && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{task.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onAssignTask(task.id, 'current-user')}
                      >
                        มอบหมาย
                      </Button>
                    )}
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onStartTask(task.id)}
                      >
                        เริ่มงาน
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => onCompleteTask(task.id)}
                      >
                        เสร็จสิ้น
                      </Button>
                    )}
                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onCancelTask(task.id, 'ยกเลิกโดยผู้ใช้')}
                      >
                        ยกเลิก
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress indicator for overdue tasks */}
                {new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'cancelled' && (
                  <div className="mt-3 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">งานเกินกำหนด</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">รอดำเนินการ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.assignedTo && t.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">มอบหมายแล้ว</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {tasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">กำลังดำเนินการ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">เสร็จสิ้น</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'cancelled').length}
              </div>
              <div className="text-sm text-muted-foreground">เกินกำหนด</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}