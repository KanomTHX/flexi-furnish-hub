import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { WarehouseTask, TaskFilter } from '@/types/warehouse';
import {
  CheckSquare,
  Clock,
  User,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Flag,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Timer,
  MapPin,
  Package,
  Truck,
  Archive,
  RefreshCw,
  Eye,
  MessageSquare,
  Paperclip,
  Star,
  Award,
  Zap,
  ChevronDown,
  ChevronRight,
  Upload,
  Settings,
  Bell,
  Send
} from 'lucide-react';

interface TaskManagementProps {
  warehouseId: string;
}

interface ExtendedWarehouseTask extends WarehouseTask {
  serialNumbers?: string[];
  items?: TaskItem[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  completionPercentage: number;
  startedAt?: string;
  completedAt?: string;
}

interface TaskItem {
  id: string;
  productId: string;
  productName: string;
  serialNumber?: string;
  quantity: number;
  location?: string;
  status: 'pending' | 'completed';
}

interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

interface TaskFormData {
  title: string;
  description: string;
  type: WarehouseTask['type'];
  priority: WarehouseTask['priority'];
  assignedTo: string;
  dueDate: Date | undefined;
  estimatedDuration: number;
  zoneId?: string;
  rackId?: string;
  serialNumbers: string[];
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}

const TASK_TYPES = [
  { value: 'receiving', label: 'รับสินค้า', color: 'bg-blue-500', icon: Truck },
  { value: 'picking', label: 'คัดสินค้า', color: 'bg-green-500', icon: Package },
  { value: 'packing', label: 'แพ็คสินค้า', color: 'bg-purple-500', icon: Archive },
  { value: 'shipping', label: 'จัดส่ง', color: 'bg-orange-500', icon: Truck },
  { value: 'counting', label: 'ตรวจนับสต็อก', color: 'bg-yellow-500', icon: CheckSquare },
  { value: 'maintenance', label: 'บำรุงรักษา', color: 'bg-red-500', icon: Settings },
  { value: 'inspection', label: 'ตรวจคุณภาพ', color: 'bg-indigo-500', icon: CheckCircle },
  { value: 'cleaning', label: 'ทำความสะอาด', color: 'bg-teal-500', icon: RefreshCw }
] as const;

const TASK_PRIORITIES = [
  { value: 'low', label: 'ต่ำ', color: 'bg-gray-500' },
  { value: 'medium', label: 'ปานกลาง', color: 'bg-blue-500' },
  { value: 'high', label: 'สูง', color: 'bg-yellow-500' },
  { value: 'urgent', label: 'เร่งด่วน', color: 'bg-red-500' }
] as const;

const TASK_STATUSES = [
  { value: 'pending', label: 'รอดำเนินการ', color: 'bg-gray-500', icon: Clock },
  { value: 'assigned', label: 'มอบหมายแล้ว', color: 'bg-blue-500', icon: User },
  { value: 'in_progress', label: 'กำลังดำเนินการ', color: 'bg-blue-500', icon: PlayCircle },
  { value: 'completed', label: 'เสร็จสิ้น', color: 'bg-green-500', icon: CheckCircle },
  { value: 'cancelled', label: 'ยกเลิก', color: 'bg-red-500', icon: XCircle },
  { value: 'on_hold', label: 'พักงาน', color: 'bg-yellow-500', icon: PauseCircle }
] as const;

export function TaskManagement({ warehouseId }: TaskManagementProps) {
  const { toast } = useToast();
  
  // State
  const [tasks, setTasks] = useState<ExtendedWarehouseTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTask, setSelectedTask] = useState<ExtendedWarehouseTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<TaskFilter>({});
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<ExtendedWarehouseTask | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  
  // Form data
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '',
    description: '',
    type: 'receiving',
    priority: 'medium',
    assignedTo: '',
    dueDate: undefined,
    estimatedDuration: 60,
    serialNumbers: []
  });
  
  const [newComment, setNewComment] = useState('');

  // Mock data - ในการใช้งานจริงจะดึงจาก API
  useEffect(() => {
    loadTasks();
    loadEmployees();
  }, [warehouseId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Mock data with Serial Number integration
      const mockTasks: ExtendedWarehouseTask[] = [
        {
          id: 'task-1',
          title: 'รับสินค้าเฟอร์นิเจอร์ใหม่',
          description: 'รับสินค้าเฟอร์นิเจอร์จากซัพพลายเออร์ ABC และตรวจสอบ Serial Number ทุกชิ้น',
          type: 'receiving',
          priority: 'high',
          status: 'in_progress',
          assignedTo: 'emp-1',
          assignedBy: 'emp-manager',
          warehouseId,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 120,
          actualDuration: 90,
          serialNumbers: ['SN001', 'SN002', 'SN003'],
          completionPercentage: 75,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'โซฟา 3 ที่นั่ง',
              serialNumber: 'SN001',
              quantity: 1,
              location: 'A-01-01',
              status: 'completed'
            },
            {
              id: 'item-2',
              productId: 'prod-2',
              productName: 'โต๊ะทำงาน',
              serialNumber: 'SN002',
              quantity: 1,
              location: 'A-01-02',
              status: 'completed'
            },
            {
              id: 'item-3',
              productId: 'prod-3',
              productName: 'เก้าอี้สำนักงาน',
              serialNumber: 'SN003',
              quantity: 1,
              location: 'A-01-03',
              status: 'pending'
            }
          ],
          comments: [
            {
              id: 'comment-1',
              userId: 'emp-1',
              userName: 'สมชาย ใจดี',
              message: 'ได้รับสินค้า 2 รายการแล้ว กำลังตรวจสอบ Serial Number รายการสุดท้าย',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: 'task-2',
          title: 'คัดสินค้าสำหรับออเดอร์ #12345',
          description: 'คัดสินค้าตาม Serial Number ในออเดอร์และเตรียมส่งไปแผนกแพ็ค',
          type: 'picking',
          priority: 'medium',
          status: 'pending',
          assignedTo: 'emp-2',
          assignedBy: 'emp-manager',
          warehouseId,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 90,
          serialNumbers: ['SN004', 'SN005'],
          completionPercentage: 0,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              id: 'item-4',
              productId: 'prod-4',
              productName: 'ตู้เสื้อผ้า',
              serialNumber: 'SN004',
              quantity: 1,
              location: 'B-02-05',
              status: 'pending'
            },
            {
              id: 'item-5',
              productId: 'prod-5',
              productName: 'เตียงนอน',
              serialNumber: 'SN005',
              quantity: 1,
              location: 'B-03-01',
              status: 'pending'
            }
          ]
        },
        {
          id: 'task-3',
          title: 'ตรวจนับสต็อกและ Serial Number ประจำเดือน',
          description: 'ตรวจนับสต็อกสินค้าในโซน A และตรวจสอบ Serial Number ให้ตรงกับระบบ',
          type: 'counting',
          priority: 'low',
          status: 'completed',
          assignedTo: 'emp-3',
          assignedBy: 'emp-manager',
          warehouseId,
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 180,
          actualDuration: 165,
          completionPercentage: 100,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setTasks(mockTasks);
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลงานได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      // Mock data
      const mockEmployees: Employee[] = [
        {
          id: 'emp-1',
          name: 'สมชาย ใจดี',
          email: 'somchai@company.com',
          role: 'พนักงานคลังสินค้า',
          isActive: true
        },
        {
          id: 'emp-2',
          name: 'สมหญิง รักงาน',
          email: 'somying@company.com',
          role: 'พนักงานคลังสินค้า',
          isActive: true
        },
        {
          id: 'emp-3',
          name: 'สมศักดิ์ ขยัน',
          email: 'somsak@company.com',
          role: 'หัวหน้าคลังสินค้า',
          isActive: true
        }
      ];
      
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      const newTask: ExtendedWarehouseTask = {
        id: `task-${Date.now()}`,
        ...taskForm,
        assignedBy: 'current-user',
        warehouseId,
        dueDate: taskForm.dueDate?.toISOString() || '',
        status: 'pending',
        completionPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTasks(prev => [...prev, newTask]);
      setShowTaskDialog(false);
      resetTaskForm();
      
      toast({
        title: 'สร้างงานสำเร็จ',
        description: `งาน "${newTask.title}" ถูกสร้างเรียบร้อยแล้ว`
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างงานได้',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: ExtendedWarehouseTask['status']) => {
    try {
      const now = new Date().toISOString();
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const updates: Partial<ExtendedWarehouseTask> = {
            status: newStatus,
            updatedAt: now
          };
          
          if (newStatus === 'in_progress' && !task.startedAt) {
            updates.startedAt = now;
          } else if (newStatus === 'completed') {
            updates.completedAt = now;
            updates.completionPercentage = 100;
            if (task.startedAt) {
              updates.actualDuration = Math.floor((new Date(now).getTime() - new Date(task.startedAt).getTime()) / (1000 * 60));
            }
          }
          
          return { ...task, ...updates };
        }
        return task;
      }));
      
      toast({
        title: 'อัปเดตสถานะสำเร็จ',
        description: 'สถานะงานถูกอัปเดตเรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตสถานะได้',
        variant: 'destructive'
      });
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim()) return;
    
    try {
      const comment: TaskComment = {
        id: `comment-${Date.now()}`,
        userId: 'current-user',
        userName: 'ผู้ใช้ปัจจุบัน',
        message: newComment,
        createdAt: new Date().toISOString()
      };
      
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            comments: [...(task.comments || []), comment],
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      }));
      
      setNewComment('');
      
      toast({
        title: 'เพิ่มความคิดเห็นสำเร็จ',
        description: 'ความคิดเห็นถูกเพิ่มเรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มความคิดเห็นได้',
        variant: 'destructive'
      });
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      type: 'receiving',
      priority: 'medium',
      assignedTo: '',
      dueDate: undefined,
      estimatedDuration: 60,
      serialNumbers: []
    });
  };

  const getTaskTypeInfo = (type: WarehouseTask['type']) => {
    return TASK_TYPES.find(t => t.value === type) || TASK_TYPES[0];
  };

  const getTaskPriorityInfo = (priority: WarehouseTask['priority']) => {
    return TASK_PRIORITIES.find(p => p.value === priority) || TASK_PRIORITIES[1];
  };

  const getTaskStatusInfo = (status: WarehouseTask['status']) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'ไม่ระบุ';
  };

  const getStatusBadge = (status: WarehouseTask['status']) => {
    const statusInfo = getTaskStatusInfo(status);
    const IconComponent = statusInfo.icon;
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: WarehouseTask['priority']) => {
    const priorityInfo = getTaskPriorityInfo(priority);
    return (
      <Badge className={`${priorityInfo.color} text-white`}>
        <Flag className="h-3 w-3 mr-1" />
        {priorityInfo.label}
      </Badge>
    );
  };

  const onFilterChange = (newFilter: TaskFilter) => {
    setFilter(newFilter);
  };

  const onExport = () => {
    toast({
      title: 'ส่งออกข้อมูล',
      description: 'กำลังเตรียมไฟล์ส่งออก...'
    });
  };

  const onAssignTask = (taskId: string, assigneeId: string) => {
    handleUpdateTaskStatus(taskId, 'assigned');
  };

  const onStartTask = (taskId: string) => {
    handleUpdateTaskStatus(taskId, 'in_progress');
  };

  const onCompleteTask = (taskId: string, notes?: string) => {
    handleUpdateTaskStatus(taskId, 'completed');
  };

  const onCancelTask = (taskId: string, reason: string) => {
    handleUpdateTaskStatus(taskId, 'cancelled');
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.serialNumbers && task.serialNumbers.some(sn => sn.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus = !filter.status || filter.status === 'all' || task.status === filter.status;
    const matchesPriority = !filter.priority || filter.priority === 'all' || task.priority === filter.priority;
    const matchesType = !filter.type || filter.type === 'all' || task.type === filter.type;
    const matchesAssignee = !filter.assignedTo || filter.assignedTo === 'all' || task.assignedTo === filter.assignedTo;

    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssignee;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const assigned = tasks.filter(t => t.status === 'assigned').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'cancelled').length;
    
    return { total, pending, assigned, inProgress, completed, overdue };
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">จัดการงานคลังสินค้า</h2>
          <p className="text-muted-foreground">
            มอบหมายงาน ติดตามความคืบหน้า และประเมินประสิทธิภาพ พร้อมระบบ Serial Number
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => {
            const modes: typeof viewMode[] = ['list', 'kanban', 'calendar'];
            const currentIndex = modes.indexOf(viewMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            setViewMode(modes[nextIndex]);
          }}>
            {viewMode === 'list' && <CheckSquare className="w-4 h-4" />}
            {viewMode === 'kanban' && <BarChart3 className="w-4 h-4" />}
            {viewMode === 'calendar' && <CalendarIcon className="w-4 h-4" />}
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetTaskForm(); setEditingTask(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มงาน
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-blue-600">งานทั้งหมด</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">รอดำเนินการ</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
            <p className="text-sm text-blue-600">มอบหมายแล้ว</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <PlayCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-sm text-blue-600">กำลังดำเนินการ</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-green-600">เสร็จสิ้น</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-sm text-red-600">เกินกำหนด</p>
          </CardContent>
        </Card>
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
              value={filter.status || 'all'}
              onValueChange={(value) => onFilterChange({ ...filter, status: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {TASK_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.priority || 'all'}
              onValueChange={(value) => onFilterChange({ ...filter, priority: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกระดับ</SelectItem>
                {TASK_PRIORITIES.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.type || 'all'}
              onValueChange={(value) => onFilterChange({ ...filter, type: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                {TASK_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filter.assignedTo || 'all'}
              onValueChange={(value) => onFilterChange({ ...filter, assignedTo: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="ผู้รับผิดชอบ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกคน</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
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

      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">ชื่องาน *</Label>
                <Input
                  id="title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ระบุชื่องาน"
                />
              </div>
              
              <div>
                <Label htmlFor="type">ประเภทงาน *</Label>
                <Select
                  value={taskForm.type}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="อธิบายรายละเอียดงาน"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">ความสำคัญ *</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assignedTo">ผู้รับผิดชอบ *</Label>
                <Select
                  value={taskForm.assignedTo}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, assignedTo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">กำหนดเสร็จ *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskForm.dueDate ? format(taskForm.dueDate, 'dd/MM/yyyy', { locale: th }) : 'เลือกวันที่'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskForm.dueDate}
                      onSelect={(date) => setTaskForm(prev => ({ ...prev, dueDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="estimatedDuration">เวลาที่ใช้ (นาที)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={taskForm.estimatedDuration}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                  placeholder="60"
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="serialNumbers">Serial Numbers (แยกด้วยเครื่องหมายจุลภาค)</Label>
              <Input
                id="serialNumbers"
                value={taskForm.serialNumbers.join(', ')}
                onChange={(e) => {
                  const sns = e.target.value.split(',').map(sn => sn.trim()).filter(sn => sn);
                  setTaskForm(prev => ({ ...prev, serialNumbers: sns }));
                }}
                placeholder="SN001, SN002, SN003"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ระบุ Serial Number ของสินค้าที่เกี่ยวข้องกับงานนี้ (สำคัญสำหรับการติดตาม)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={!taskForm.title || !taskForm.assignedTo || !taskForm.dueDate}
            >
              {editingTask ? 'บันทึกการแก้ไข' : 'สร้างงาน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}