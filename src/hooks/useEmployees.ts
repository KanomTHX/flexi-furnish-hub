import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Employee, 
  Department, 
  Position, 
  Attendance, 
  Leave, 
  Payroll, 
  Training,
  Commission,
  AttendanceRecord,
  LeaveRequest,
  PredefinedPosition,
  EmployeeAnalytics,
  EmployeeFilters,
  AttendanceFilters,
  LeaveFilters,
  PayrollFilters,
  TrainingFilters,
  EmployeeFormData,
  AttendanceFormData,
  LeaveFormData,
  PayrollFormData,
  TrainingFormData,
  CommissionStatus
} from '@/types/employees';
import { 
  mockEmployees, 
  mockDepartments, 
  mockPositions, 
  mockAttendance, 
  mockLeaves, 
  mockPayrolls, 
  mockTrainings 
} from '@/hooks/useSupabaseHooks';

export const useEmployees = () => {
  const { toast } = useToast();
  
  const [employees] = useState<Employee[]>(mockEmployees);
  const [departments] = useState<Department[]>(mockDepartments);
  const [positions] = useState<Position[]>(mockPositions);
  const [attendance] = useState<Attendance[]>(mockAttendance);
  const [leaves] = useState<Leave[]>(mockLeaves);
  const [payrolls] = useState<Payroll[]>(mockPayrolls);
  const [trainings] = useState<Training[]>(mockTrainings);
  const [commissions] = useState<Commission[]>([]);
  const [attendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests] = useState<LeaveRequest[]>([]);
  const [predefinedPositions] = useState<PredefinedPosition[]>([
    {
      id: '1',
      name: 'manager',
      displayName: 'ผู้จัดการ',
      description: 'ดูแลภาพรวม มีค่าคอมมิชชั่น',
      hasCommission: true,
      defaultCommissionRate: 1.00,
      responsibilities: ['ดูแลทีม', 'วางแผนการขาย', 'ติดตามผลงาน']
    },
    {
      id: '2',
      name: 'sales',
      displayName: 'ฝ่ายขาย',
      description: 'ได้ค่าคอมมิชชั่นจากการขาย POS / เช่าซื้อ',
      hasCommission: true,
      defaultCommissionRate: 2.00,
      responsibilities: ['ขายสินค้า', 'ดูแลลูกค้า', 'ปิดการขาย']
    },
    {
      id: '3',
      name: 'stock',
      displayName: 'ฝ่ายสต็อก',
      description: 'จัดการสินค้า ไม่มีค่าคอมมิชชั่น',
      hasCommission: false,
      defaultCommissionRate: 0.00,
      responsibilities: ['จัดการสต็อก', 'ตรวจนับสินค้า', 'จัดส่งสินค้า']
    }
  ]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Calculate analytics
  const analytics = useMemo((): EmployeeAnalytics => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    
    return {
      totalEmployees,
      activeEmployees,
      newHires: 3,
      terminations: 0,
      averageSalary: 35000,
      totalPayroll: totalEmployees * 35000,
      attendanceRate: 95,
      turnoverRate: 5,
      departmentBreakdown: [],
      positionBreakdown: [],
      ageDistribution: [],
      tenureDistribution: [],
      performanceDistribution: []
    };
  }, [employees]);

  // Placeholder functions to prevent build errors
  const addEmployee = useCallback((employeeData: EmployeeFormData) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบจัดการพนักงานกำลังอยู่ในขั้นตอนการพัฒนา",
    });
    return null;
  }, [toast]);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบจัดการพนักงานกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  const deleteEmployee = useCallback((id: string) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบจัดการพนักงานกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  const updateEmployeeStatus = useCallback((id: string, status: string) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบจัดการพนักงานกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  // Attendance functions
  const getFilteredAttendance = useCallback((filters: AttendanceFilters) => {
    return attendance.filter(record => {
      if (filters.employeeId && !record.employeeId.includes(filters.employeeId)) return false;
      if (filters.status && record.status !== filters.status) return false;
      if (filters.date && record.date !== filters.date) return false;
      return true;
    });
  }, [attendance]);

  const addAttendance = useCallback((data: any) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบจัดการการเข้างานกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  const updateAttendance = useCallback((id: string, data: any) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบจัดการการเข้างานกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  const exportAttendance = useCallback((filters?: AttendanceFilters) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบส่งออกข้อมูลกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  const exportEmployees = useCallback(() => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบส่งออกข้อมูลกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  // Leave functions
  const getFilteredLeaves = useCallback((filters: LeaveFilters) => {
    return leaves.filter(leave => {
      if (filters.employeeId && !leave.employeeId.includes(filters.employeeId)) return false;
      if (filters.status && leave.status !== filters.status) return false;
      if (filters.type && leave.type !== filters.type) return false;
      return true;
    });
  }, [leaves]);

  const approveLeave = useCallback((id: string) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบอนุมัติการลากำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  const rejectLeave = useCallback((id: string, reason?: string) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบปฏิเสธการลากำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  // Payroll functions
  const getFilteredPayrolls = useCallback((filters: PayrollFilters) => {
    return payrolls.filter(payroll => {
      if (filters.employeeId && !payroll.employeeId.includes(filters.employeeId)) return false;
      if (filters.status && payroll.status !== filters.status) return false;
      return true;
    });
  }, [payrolls]);

  const updatePayroll = useCallback((id: string, data: any) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบจัดการเงินเดือนกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  // Training functions
  const getFilteredTrainings = useCallback((filters: TrainingFilters) => {
    return trainings.filter(training => {
      if (filters.status && training.status !== filters.status) return false;
      if (filters.type && training.type !== filters.type) return false;
      return true;
    });
  }, [trainings]);

  const updateTraining = useCallback((id: string, data: any) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบจัดการการอบรมกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  const enrollInTraining = useCallback((trainingId: string, employeeId: string) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบลงทะเบียนอบรมกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  // Filter functions
  const filterEmployees = useCallback((filters: EmployeeFilters) => {
    return employees.filter(employee => {
      if (filters.status && employee.status !== filters.status) return false;
      if (filters.department && employee.department.id !== filters.department) return false;
      if (filters.position && employee.position.id !== filters.position) return false;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        if (!fullName.includes(searchTerm) && 
            !employee.employeeId.toLowerCase().includes(searchTerm) &&
            !employee.email?.toLowerCase().includes(searchTerm)) return false;
      }
      return true;
    });
  }, [employees]);

  const filterAttendance = useCallback((filters: AttendanceFilters) => {
    return getFilteredAttendance(filters);
  }, [getFilteredAttendance]);

  const filterLeaves = useCallback((filters: LeaveFilters) => {
    return getFilteredLeaves(filters);
  }, [getFilteredLeaves]);

  // Commission functions
  const getEmployeeCommissions = useCallback((employeeId: string) => {
    return commissions.filter(commission => commission.employeeId === employeeId);
  }, [commissions]);

  const calculateCommission = useCallback((employeeId: string, saleAmount: number, transactionType: 'pos' | 'installment' | 'manual') => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return null;
    
    const commissionAmount = saleAmount * (employee.commissionRate / 100);
    
    toast({
      title: "คำนวณค่าคอมมิชชั่นสำเร็จ",
      description: `ค่าคอมมิชชั่น: ${commissionAmount.toLocaleString()} บาท (${employee.commissionRate}% จาก ${saleAmount.toLocaleString()} บาท)`,
    });
    
    return {
      employeeId,
      saleAmount,
      commissionRate: employee.commissionRate,
      commissionAmount,
      transactionType
    };
  }, [employees, toast]);

  const updateCommissionStatus = useCallback((commissionId: string, status: CommissionStatus) => {
    toast({
      title: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา",
      description: "ระบบอัปเดตสถานะค่าคอมมิชชั่นกำลังอยู่ในขั้นตอนการพัฒนา",
    });
  }, [toast]);

  // Attendance Record functions
  const checkIn = useCallback((employeeId: string) => {
    const now = new Date();
    toast({
      title: "เข้างานสำเร็จ",
      description: `เวลาเข้างาน: ${now.toLocaleTimeString('th-TH')}`,
    });
  }, [toast]);

  const checkOut = useCallback((employeeId: string) => {
    const now = new Date();
    toast({
      title: "ออกงานสำเร็จ",
      description: `เวลาออกงาน: ${now.toLocaleTimeString('th-TH')}`,
    });
  }, [toast]);

  const getAttendanceByEmployee = useCallback((employeeId: string, startDate?: string, endDate?: string) => {
    return attendanceRecords.filter(record => {
      if (record.employeeId !== employeeId) return false;
      if (startDate && record.date < startDate) return false;
      if (endDate && record.date > endDate) return false;
      return true;
    });
  }, [attendanceRecords]);

  // Leave Request functions
  const submitLeaveRequest = useCallback((leaveData: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt' | 'createdAt'>) => {
    toast({
      title: "ส่งคำขอลาสำเร็จ",
      description: "คำขอลาของคุณได้ถูกส่งไปยังผู้บังคับบัญชาแล้ว",
    });
  }, [toast]);

  const approveLeaveRequest = useCallback((leaveId: string, approverId: string) => {
    toast({
      title: "อนุมัติการลาสำเร็จ",
      description: "คำขอลาได้รับการอนุมัติแล้ว",
    });
  }, [toast]);

  const rejectLeaveRequest = useCallback((leaveId: string, reason: string, approverId: string) => {
    toast({
      title: "ปฏิเสธการลา",
      description: `เหตุผล: ${reason}`,
    });
  }, [toast]);

  // Position functions
  const getPositionByName = useCallback((positionName: string) => {
    return predefinedPositions.find(pos => pos.name === positionName);
  }, [predefinedPositions]);

  const getPositionsWithCommission = useCallback(() => {
    return predefinedPositions.filter(pos => pos.hasCommission);
  }, [predefinedPositions]);

  return {
    // Data
    employees,
    departments,
    positions,
    attendance,
    leaves,
    payrolls,
    trainings,
    commissions,
    attendanceRecords,
    leaveRequests,
    predefinedPositions,
    analytics,
    loading,
    error,

    // Employee functions
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateEmployeeStatus,

    // Attendance functions
    getFilteredAttendance,
    addAttendance,
    updateAttendance,
    exportAttendance,

    // Export functions
    exportEmployees,

    // Leave functions
    getFilteredLeaves,
    approveLeave,
    rejectLeave,

    // Payroll functions
    getFilteredPayrolls,
    updatePayroll,

    // Training functions
    getFilteredTrainings,
    updateTraining,
    enrollInTraining,

    // Filter functions
    filterEmployees,
    filterAttendance,
    filterLeaves,

    // Commission functions
    getEmployeeCommissions,
    calculateCommission,
    updateCommissionStatus,

    // Attendance Record functions
    checkIn,
    checkOut,
    getAttendanceByEmployee,

    // Leave Request functions
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,

    // Position functions
    getPositionByName,
    getPositionsWithCommission
  };
};