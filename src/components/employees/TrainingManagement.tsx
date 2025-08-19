import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  GraduationCap,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Users,
  Clock,
  Calendar,
  MapPin,
  Download,
  RefreshCw,
  BookOpen,
  Award,
  UserPlus
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { TrainingFilters, Training } from '@/types/employees';

export const TrainingManagement: React.FC = () => {
  const {
    employees,
    trainings,
    getFilteredTrainings,
    updateTraining,
    enrollInTraining,
    loading
  } = useEmployees();

  const [filters, setFilters] = useState<TrainingFilters>({});
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  const filteredTrainings = getFilteredTrainings(filters);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleTypeFilter = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      type: value === 'all' ? undefined : value as any
    }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: value === 'all' ? undefined : value as any
    }));
  };

  const handleInstructorFilter = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      instructor: value === 'all' ? undefined : value
    }));
  };

  const handleDateFilter = (type: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      date: {
        ...prev.date,
        [type]: value || undefined
      }
    }));
  };

  const getTrainingTypeBadge = (type: string) => {
    const typeConfig = {
      orientation: { label: 'ปฐมนิเทศ', variant: 'default' as const },
      'skill-development': { label: 'พัฒนาทักษะ', variant: 'secondary' as const },
      compliance: { label: 'กฎระเบียบ', variant: 'outline' as const },
      leadership: { label: 'ภาวะผู้นำ', variant: 'default' as const },
      technical: { label: 'เทคนิค', variant: 'secondary' as const },
      'soft-skills': { label: 'ทักษะนุ่ม', variant: 'outline' as const }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.technical;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { label: 'วางแผน', variant: 'secondary' as const },
      ongoing: { label: 'กำลังดำเนินการ', variant: 'default' as const },
      completed: { label: 'เสร็จสิ้น', variant: 'default' as const },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getParticipantStatusBadge = (status: string) => {
    const statusConfig = {
      enrolled: { label: 'ลงทะเบียน', variant: 'secondary' as const },
      attending: { label: 'เข้าร่วม', variant: 'default' as const },
      completed: { label: 'เสร็จสิ้น', variant: 'default' as const },
      dropped: { label: 'ถอนตัว', variant: 'outline' as const },
      failed: { label: 'ไม่ผ่าน', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.enrolled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'ไม่พบข้อมูล';
  };

  const getEmployeeById = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleEnrollEmployee = (trainingId: string, employeeId: string) => {
    enrollInTraining(trainingId, employeeId);
  };

  // Get unique instructors for filter
  const uniqueInstructors = [...new Set(trainings.map(t => t.instructor))];

  // Calculate summary statistics
  const totalTrainings = filteredTrainings.length;
  const plannedTrainings = filteredTrainings.filter(t => t.status === 'planned').length;
  const ongoingTrainings = filteredTrainings.filter(t => t.status === 'ongoing').length;
  const completedTrainings = filteredTrainings.filter(t => t.status === 'completed').length;
  const totalParticipants = filteredTrainings.reduce((sum, t) => sum + t.participants.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">จัดการการอบรม</h2>
          <p className="text-muted-foreground">
            จัดการหลักสูตรอบรมและการเข้าร่วมของพนักงาน ({filteredTrainings.length} หลักสูตร)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                สร้างหลักสูตร
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>สร้างหลักสูตรอบรม</DialogTitle>
                <DialogDescription>
                  สร้างหลักสูตรอบรมใหม่สำหรับพนักงาน
                </DialogDescription>
              </DialogHeader>
              {/* Add TrainingForm component here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">รวมทั้งหมด</p>
                <p className="text-xl font-bold">{totalTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gray-50">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">วางแผน</p>
                <p className="text-xl font-bold">{plannedTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">กำลังดำเนินการ</p>
                <p className="text-xl font-bold">{ongoingTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <Award className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">เสร็จสิ้น</p>
                <p className="text-xl font-bold">{completedTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-50">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">ผู้เข้าร่วม</p>
                <p className="text-xl font-bold">{totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาหลักสูตร"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={filters.type || 'all'} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="orientation">ปฐมนิเทศ</SelectItem>
                <SelectItem value="skill-development">พัฒนาทักษะ</SelectItem>
                <SelectItem value="compliance">กฎระเบียบ</SelectItem>
                <SelectItem value="leadership">ภาวะผู้นำ</SelectItem>
                <SelectItem value="technical">เทคนิค</SelectItem>
                <SelectItem value="soft-skills">ทักษะนุ่ม</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="planned">วางแผน</SelectItem>
                <SelectItem value="ongoing">กำลังดำเนินการ</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.instructor || 'all'} onValueChange={handleInstructorFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="วิทยากร" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกวิทยากร</SelectItem>
                {uniqueInstructors.map((instructor) => (
                  <SelectItem key={instructor} value={instructor}>
                    {instructor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={filters.date?.start || ''}
                onChange={(e) => handleDateFilter('start', e.target.value)}
                className="w-[140px]"
              />
              <span className="text-muted-foreground">ถึง</span>
              <Input
                type="date"
                value={filters.date?.end || ''}
                onChange={(e) => handleDateFilter('end', e.target.value)}
                className="w-[140px]"
              />
            </div>

            {Object.keys(filters).length > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                ล้างตัวกรอง
              </Button>
            )}

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Training Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการหลักสูตรอบรม</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrainings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบหลักสูตรอบรม</h3>
              <p>ไม่มีหลักสูตรอบรมที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>หลักสูตร</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>วิทยากร</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>ระยะเวลา</TableHead>
                    <TableHead>สถานที่</TableHead>
                    <TableHead>ผู้เข้าร่วม</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{training.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {training.description.length > 50 
                              ? `${training.description.substring(0, 50)}...` 
                              : training.description
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTrainingTypeBadge(training.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <BookOpen className="h-3 w-3 mr-1 text-muted-foreground" />
                          {training.instructor}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          <div>
                            <div className="text-sm">
                              {new Date(training.startDate).toLocaleDateString('th-TH')}
                            </div>
                            {training.startDate !== training.endDate && (
                              <div className="text-xs text-muted-foreground">
                                ถึง {new Date(training.endDate).toLocaleDateString('th-TH')}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          {training.duration} ชม.
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                          {training.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {training.participants.length}/{training.maxParticipants}
                          </Badge>
                          {training.participants.length < training.maxParticipants && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTraining(training);
                                setShowEnrollDialog(true);
                              }}
                            >
                              <UserPlus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(training.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTraining(training);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              ดูรายละเอียด
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTraining(training);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTraining(training);
                                setShowEnrollDialog(true);
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              เพิ่มผู้เข้าร่วม
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดหลักสูตรอบรม</DialogTitle>
          </DialogHeader>
          {selectedTraining && (
            <div className="space-y-6">
              {/* Training Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ข้อมูลหลักสูตร</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ชื่อหลักสูตร</label>
                      <p className="font-medium">{selectedTraining.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">คำอธิบาย</label>
                      <p className="text-sm">{selectedTraining.description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ประเภท</label>
                      <div className="mt-1">{getTrainingTypeBadge(selectedTraining.type)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">สถานะ</label>
                      <div className="mt-1">{getStatusBadge(selectedTraining.status)}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">รายละเอียดการจัด</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">วิทยากร</label>
                      <p className="font-medium">{selectedTraining.instructor}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">สถานที่</label>
                      <p className="font-medium">{selectedTraining.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">วันที่</label>
                      <p className="font-medium">
                        {new Date(selectedTraining.startDate).toLocaleDateString('th-TH')}
                        {selectedTraining.startDate !== selectedTraining.endDate && 
                          ` - ${new Date(selectedTraining.endDate).toLocaleDateString('th-TH')}`
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ระยะเวลา</label>
                      <p className="font-medium">{selectedTraining.duration} ชั่วโมง</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ค่าใช้จ่าย</label>
                      <p className="font-medium">฿{selectedTraining.cost.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Materials and Requirements */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">เอกสารประกอบ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTraining.materials.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedTraining.materials.map((material, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <BookOpen className="h-3 w-3 mr-2 text-muted-foreground" />
                            {material}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">ไม่มีเอกสารประกอบ</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ข้อกำหนด</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTraining.requirements.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedTraining.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Award className="h-3 w-3 mr-2 text-muted-foreground" />
                            {requirement}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">ไม่มีข้อกำหนดพิเศษ</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Participants */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    ผู้เข้าร่วม ({selectedTraining.participants.length}/{selectedTraining.maxParticipants})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTraining.participants.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTraining.participants.map((participant) => {
                        const employee = getEmployeeById(participant.employeeId);
                        return (
                          <div key={participant.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={employee?.avatar} />
                                <AvatarFallback>
                      {employee?.firstName?.charAt(0) || ''}{employee?.lastName?.charAt(0) || ''}
                    </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {getEmployeeName(participant.employeeId)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ลงทะเบียน: {new Date(participant.enrolledAt).toLocaleDateString('th-TH')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getParticipantStatusBadge(participant.status)}
                              {participant.score && (
                                <Badge variant="outline">{participant.score} คะแนน</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      ยังไม่มีผู้เข้าร่วม
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มผู้เข้าร่วมอบรม</DialogTitle>
            <DialogDescription>
              เลือกพนักงานที่ต้องการเข้าร่วมหลักสูตร {selectedTraining?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="เลือกพนักงาน" />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter(emp => !selectedTraining?.participants.some(p => p.employeeId === emp.id))
                  .map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} - {employee.employeeId}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setShowEnrollDialog(false)}
                variant="outline" 
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button className="flex-1">
                เพิ่มผู้เข้าร่วม
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};