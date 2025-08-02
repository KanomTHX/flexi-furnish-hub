import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee, EmployeeFormData, WorkDay } from '@/types/employees';

interface EmployeeFormProps {
  employee?: Employee;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSuccess,
  onCancel
}) => {
  const { departments, positions, addEmployee, updateEmployee } = useEmployees();
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    address: employee?.address || '',
    dateOfBirth: employee?.dateOfBirth || '',
    hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
    positionId: employee?.position.id || '',
    departmentId: employee?.department.id || '',
    salary: employee?.salary || 0,
    emergencyContact: employee?.emergencyContact || {
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: ''
    },
    bankAccount: employee?.bankAccount || {
      bankName: '',
      accountNumber: '',
      accountName: '',
      branchName: ''
    },
    workSchedule: employee?.workSchedule || {
      type: 'full-time',
      workDays: [
        { day: 'monday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'tuesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'wednesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'thursday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'friday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'saturday', startTime: '08:00', endTime: '12:00', breakTime: 0, isWorkingDay: false },
        { day: 'sunday', startTime: '00:00', endTime: '00:00', breakTime: 0, isWorkingDay: false }
      ],
      overtimeRate: 1.5,
      vacationDays: 12,
      sickDays: 8
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    }

    if (!formData.positionId) {
      newErrors.positionId = 'กรุณาเลือกตำแหน่ง';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'กรุณาเลือกแผนก';
    }

    if (formData.salary <= 0) {
      newErrors.salary = 'กรุณากรอกเงินเดือนที่ถูกต้อง';
    }

    if (!formData.emergencyContact.name.trim()) {
      newErrors.emergencyContactName = 'กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน';
    }

    if (!formData.emergencyContact.phone.trim()) {
      newErrors.emergencyContactPhone = 'กรุณากรอกเบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      if (employee) {
        // Update existing employee
        const position = positions.find(p => p.id === formData.positionId);
        const department = departments.find(d => d.id === formData.departmentId);
        
        if (position && department) {
          updateEmployee(employee.id, {
            ...formData,
            position,
            department
          });
        }
      } else {
        // Add new employee
        addEmployee(formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWorkDay = (dayIndex: number, updates: Partial<WorkDay>) => {
    const newWorkDays = [...formData.workSchedule.workDays];
    newWorkDays[dayIndex] = { ...newWorkDays[dayIndex], ...updates };
    
    setFormData(prev => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        workDays: newWorkDays
      }
    }));
  };

  const dayNames = {
    monday: 'จันทร์',
    tuesday: 'อังคาร',
    wednesday: 'พุธ',
    thursday: 'พฤหัสบดี',
    friday: 'ศุกร์',
    saturday: 'เสาร์',
    sunday: 'อาทิตย์'
  };

  return (
    <form onSubmit={handleSubmit} className=\"space-y-6\">
      <Tabs defaultValue=\"personal\" className=\"w-full\">
        <TabsList className=\"grid w-full grid-cols-4\">
          <TabsTrigger value=\"personal\">ข้อมูลส่วนตัว</TabsTrigger>
          <TabsTrigger value=\"work\">ข้อมูลการทำงาน</TabsTrigger>
          <TabsTrigger value=\"emergency\">ผู้ติดต่อฉุกเฉิน</TabsTrigger>
          <TabsTrigger value=\"schedule\">ตารางงาน</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value=\"personal\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลส่วนตัว</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"grid gap-4 md:grid-cols-2\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"firstName\">ชื่อ *</Label>
                  <Input
                    id=\"firstName\"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className=\"text-sm text-red-500\">{errors.firstName}</p>
                  )}
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"lastName\">นามสกุล *</Label>
                  <Input
                    id=\"lastName\"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className=\"text-sm text-red-500\">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className=\"grid gap-4 md:grid-cols-2\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"email\">อีเมล *</Label>
                  <Input
                    id=\"email\"
                    type=\"email\"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className=\"text-sm text-red-500\">{errors.email}</p>
                  )}
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"phone\">โทรศัพท์ *</Label>
                  <Input
                    id=\"phone\"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className=\"text-sm text-red-500\">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className=\"space-y-2\">
                <Label htmlFor=\"address\">ที่อยู่</Label>
                <Textarea
                  id=\"address\"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className=\"space-y-2\">
                <Label htmlFor=\"dateOfBirth\">วันเกิด</Label>
                <Input
                  id=\"dateOfBirth\"
                  type=\"date\"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Information */}
        <TabsContent value=\"work\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลการทำงาน</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"grid gap-4 md:grid-cols-2\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"departmentId\">แผนก *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                  >
                    <SelectTrigger className={errors.departmentId ? 'border-red-500' : ''}>
                      <SelectValue placeholder=\"เลือกแผนก\" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && (
                    <p className=\"text-sm text-red-500\">{errors.departmentId}</p>
                  )}
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"positionId\">ตำแหน่ง *</Label>
                  <Select
                    value={formData.positionId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, positionId: value }))}
                  >
                    <SelectTrigger className={errors.positionId ? 'border-red-500' : ''}>
                      <SelectValue placeholder=\"เลือกตำแหน่ง\" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.positionId && (
                    <p className=\"text-sm text-red-500\">{errors.positionId}</p>
                  )}
                </div>
              </div>

              <div className=\"grid gap-4 md:grid-cols-2\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"salary\">เงินเดือน (บาท) *</Label>
                  <Input
                    id=\"salary\"
                    type=\"number\"
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: Number(e.target.value) }))}
                    className={errors.salary ? 'border-red-500' : ''}
                  />
                  {errors.salary && (
                    <p className=\"text-sm text-red-500\">{errors.salary}</p>
                  )}
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"hireDate\">วันที่เข้าทำงาน</Label>
                  <Input
                    id=\"hireDate\"
                    type=\"date\"
                    value={formData.hireDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Bank Account */}
              <div className=\"space-y-4 pt-4 border-t\">
                <h4 className=\"font-medium\">ข้อมูลบัญชีธนาคาร</h4>
                
                <div className=\"grid gap-4 md:grid-cols-2\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"bankName\">ธนาคาร</Label>
                    <Input
                      id=\"bankName\"
                      value={formData.bankAccount.bankName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, bankName: e.target.value }
                      }))}
                    />
                  </div>

                  <div className=\"space-y-2\">
                    <Label htmlFor=\"accountNumber\">เลขที่บัญชี</Label>
                    <Input
                      id=\"accountNumber\"
                      value={formData.bankAccount.accountNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, accountNumber: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className=\"grid gap-4 md:grid-cols-2\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"accountName\">ชื่อบัญชี</Label>
                    <Input
                      id=\"accountName\"
                      value={formData.bankAccount.accountName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, accountName: e.target.value }
                      }))}
                    />
                  </div>

                  <div className=\"space-y-2\">
                    <Label htmlFor=\"branchName\">สาขา</Label>
                    <Input
                      id=\"branchName\"
                      value={formData.bankAccount.branchName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, branchName: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contact */}
        <TabsContent value=\"emergency\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>ผู้ติดต่อฉุกเฉิน</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"grid gap-4 md:grid-cols-2\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"emergencyName\">ชื่อ *</Label>
                  <Input
                    id=\"emergencyName\"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                    className={errors.emergencyContactName ? 'border-red-500' : ''}
                  />
                  {errors.emergencyContactName && (
                    <p className=\"text-sm text-red-500\">{errors.emergencyContactName}</p>
                  )}
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"emergencyRelationship\">ความสัมพันธ์</Label>
                  <Input
                    id=\"emergencyRelationship\"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className=\"grid gap-4 md:grid-cols-2\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"emergencyPhone\">โทรศัพท์ *</Label>
                  <Input
                    id=\"emergencyPhone\"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    }))}
                    className={errors.emergencyContactPhone ? 'border-red-500' : ''}
                  />
                  {errors.emergencyContactPhone && (
                    <p className=\"text-sm text-red-500\">{errors.emergencyContactPhone}</p>
                  )}
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"emergencyEmail\">อีเมล</Label>
                  <Input
                    id=\"emergencyEmail\"
                    type=\"email\"
                    value={formData.emergencyContact.email || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, email: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Schedule */}
        <TabsContent value=\"schedule\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>ตารางการทำงาน</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"grid gap-4 md:grid-cols-3\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"workType\">ประเภทการทำงาน</Label>
                  <Select
                    value={formData.workSchedule.type}
                    onValueChange={(value: any) => setFormData(prev => ({
                      ...prev,
                      workSchedule: { ...prev.workSchedule, type: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"full-time\">เต็มเวลา</SelectItem>
                      <SelectItem value=\"part-time\">พาร์ทไทม์</SelectItem>
                      <SelectItem value=\"contract\">สัญญาจ้าง</SelectItem>
                      <SelectItem value=\"intern\">ฝึกงาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"overtimeRate\">อัตราล่วงเวลา</Label>
                  <Input
                    id=\"overtimeRate\"
                    type=\"number\"
                    step=\"0.1\"
                    value={formData.workSchedule.overtimeRate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      workSchedule: { ...prev.workSchedule, overtimeRate: Number(e.target.value) }
                    }))}
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"vacationDays\">วันลาพักร้อน (วัน/ปี)</Label>
                  <Input
                    id=\"vacationDays\"
                    type=\"number\"
                    value={formData.workSchedule.vacationDays}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      workSchedule: { ...prev.workSchedule, vacationDays: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <div className=\"space-y-4 pt-4 border-t\">
                <h4 className=\"font-medium\">วันและเวลาทำงาน</h4>
                
                <div className=\"space-y-3\">
                  {formData.workSchedule.workDays.map((day, index) => (
                    <div key={day.day} className=\"flex items-center space-x-4 p-3 border rounded-lg\">
                      <div className=\"flex items-center space-x-2\">
                        <Checkbox
                          id={`workday-${day.day}`}
                          checked={day.isWorkingDay}
                          onCheckedChange={(checked) => 
                            updateWorkDay(index, { isWorkingDay: checked as boolean })
                          }
                        />
                        <Label htmlFor={`workday-${day.day}`} className=\"w-20\">
                          {dayNames[day.day as keyof typeof dayNames]}
                        </Label>
                      </div>
                      
                      {day.isWorkingDay && (
                        <>
                          <div className=\"flex items-center space-x-2\">
                            <Label className=\"text-sm\">เริ่ม:</Label>
                            <Input
                              type=\"time\"
                              value={day.startTime}
                              onChange={(e) => updateWorkDay(index, { startTime: e.target.value })}
                              className=\"w-24\"
                            />
                          </div>
                          
                          <div className=\"flex items-center space-x-2\">
                            <Label className=\"text-sm\">สิ้นสุด:</Label>
                            <Input
                              type=\"time\"
                              value={day.endTime}
                              onChange={(e) => updateWorkDay(index, { endTime: e.target.value })}
                              className=\"w-24\"
                            />
                          </div>
                          
                          <div className=\"flex items-center space-x-2\">
                            <Label className=\"text-sm\">พัก (นาที):</Label>
                            <Input
                              type=\"number\"
                              value={day.breakTime}
                              onChange={(e) => updateWorkDay(index, { breakTime: Number(e.target.value) })}
                              className=\"w-20\"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className=\"flex items-center justify-end space-x-2 pt-4 border-t\">
        <Button type=\"button\" variant=\"outline\" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type=\"submit\" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : employee ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
        </Button>
      </div>
    </form>
  );
};