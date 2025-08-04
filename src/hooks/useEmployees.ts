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
  TrainingFormData
} from '@/types/employees';
import { 
  mockEmployees, 
  mockDepartments, 
  mockPositions, 
  mockAttendance, 
  mockLeaves, 
  mockPayrolls, 
  mockTrainings 
} from '@/data/mockEmployeesData';

export const useEmployees = () => {
  const { toast } = useToast();
  
  const [employees] = useState<Employee[]>(mockEmployees);
  const [departments] = useState<Department[]>(mockDepartments);
  const [positions] = useState<Position[]>(mockPositions);
  const [attendance] = useState<Attendance[]>(mockAttendance);
  const [leaves] = useState<Leave[]>(mockLeaves);
  const [payrolls] = useState<Payroll[]>(mockPayrolls);
  const [trainings] = useState<Training[]>(mockTrainings);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Calculate analytics
  const analytics = useMemo((): EmployeeAnalytics => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    
    return {
      totalEmployees,
      activeEmployees,
      onLeave: 0,
      avgAttendanceRate: 95,
      newHiresThisMonth: 3,
      pendingLeaves: 5,
      upcomingTrainings: 2
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

  return {
    // Data
    employees,
    departments,
    positions,
    attendance,
    leaves,
    payrolls,
    trainings,
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
    filterLeaves
  };
};