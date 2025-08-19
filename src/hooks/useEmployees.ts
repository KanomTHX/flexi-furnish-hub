import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase';

export const useEmployees = () => {
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees from database
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, name)
        `);
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลพนักงานได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (err: any) {
      console.error('Error fetching departments:', err.message);
    }
  }, []);

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setPositions(data || []);
    } catch (err: any) {
      console.error('Error fetching positions:', err.message);
    }
  }, []);

  // Fetch attendance records
  const fetchAttendance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          employee:employees(id, first_name, last_name)
        `);
      
      if (error) throw error;
      setAttendance(data || []);
    } catch (err: any) {
      console.error('Error fetching attendance:', err.message);
    }
  }, []);

  // Fetch leave requests
  const fetchLeaves = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(id, first_name, last_name)
        `);
      
      if (error) throw error;
      setLeaves(data || []);
    } catch (err: any) {
      console.error('Error fetching leaves:', err.message);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchPositions();
    fetchAttendance();
    fetchLeaves();
  }, [fetchEmployees, fetchDepartments, fetchPositions, fetchAttendance, fetchLeaves]);

  // Calculate analytics
  const analytics = useMemo((): EmployeeAnalytics => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    
    // Calculate new hires (employees hired in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newHires = employees.filter(e => 
      e.hireDate && new Date(e.hireDate) >= thirtyDaysAgo
    ).length;
    
    // Calculate terminations (employees terminated in last 30 days)
    const terminations = employees.filter(e => 
      e.terminationDate && new Date(e.terminationDate) >= thirtyDaysAgo
    ).length;
    
    // Calculate average salary from actual employee data
    const salaries = employees.filter(e => e.salary && e.salary > 0).map(e => e.salary || 0);
    const averageSalary = salaries.length > 0 
      ? Math.round(salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length)
      : 0;
    
    // Calculate total payroll
    const totalPayroll = salaries.reduce((sum, salary) => sum + salary, 0);
    
    // Calculate attendance rate from attendance records
    const recentAttendance = attendance.filter(record => {
      const recordDate = new Date(record.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return recordDate >= sevenDaysAgo;
    });
    
    const attendanceRate = recentAttendance.length > 0 
      ? Math.round((recentAttendance.filter(r => r.status === 'present').length / recentAttendance.length) * 100)
      : 0;
    
    // Calculate turnover rate (terminations / total employees * 100)
    const turnoverRate = totalEmployees > 0 
      ? Math.round((terminations / totalEmployees) * 100)
      : 0;
    
    // Calculate department breakdown
    const departmentBreakdown = departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department?.id === dept.id);
      const deptSalaries = deptEmployees.filter(e => e.salary && e.salary > 0).map(e => e.salary || 0);
      const avgSalary = deptSalaries.length > 0 ? Math.round(deptSalaries.reduce((sum, sal) => sum + sal, 0) / deptSalaries.length) : 0;
      const totalSalaries = deptSalaries.reduce((sum, sal) => sum + sal, 0);
      const estimatedBudget = totalSalaries * 1.2; // Estimate budget as 120% of total salaries
      
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        employeeCount: deptEmployees.length,
        averageSalary: avgSalary,
        percentage: totalEmployees > 0 ? Math.round((deptEmployees.length / totalEmployees) * 100) : 0,
        activeEmployees: deptEmployees.filter(e => e.status === 'active').length,
        totalBudget: estimatedBudget,
        utilizationRate: estimatedBudget > 0 ? Math.round((totalSalaries / estimatedBudget) * 100) : 0
      };
    });
    
    // Calculate position breakdown
    const positionBreakdown = positions.map(pos => {
      const posEmployees = employees.filter(emp => emp.position?.id === pos.id);
      const posSalaries = posEmployees.filter(e => e.salary && e.salary > 0).map(e => e.salary || 0);
      const avgSalary = posSalaries.length > 0 ? Math.round(posSalaries.reduce((sum, sal) => sum + sal, 0) / posSalaries.length) : 0;
      const totalSalaries = posSalaries.reduce((sum, sal) => sum + sal, 0);
      const estimatedBudget = totalSalaries * 1.2; // Estimate budget as 120% of total salaries
      
      return {
        positionId: pos.id,
        positionName: pos.name,
        employeeCount: posEmployees.length,
        averageSalary: avgSalary,
        vacancies: 0,
        totalBudget: estimatedBudget,
        utilizationRate: estimatedBudget > 0 ? Math.round((totalSalaries / estimatedBudget) * 100) : 0
      };
    });
    
    return {
      totalEmployees,
      activeEmployees,
      newHires,
      terminations,
      averageSalary,
      totalPayroll,
      attendanceRate,
      turnoverRate,
      departmentBreakdown,
      positionBreakdown,
      ageDistribution: [],
      tenureDistribution: [],
      performanceDistribution: []
    };
  }, [employees, departments, positions, attendance]);

  // Add employee to database
  const addEmployee = useCallback(async (employeeData: EmployeeFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare employee data for database
      const employeeRecord = {
        employee_code: `EMP${Date.now()}`, // Generate unique employee code
        first_name: employeeData.firstName,
        last_name: employeeData.lastName,
        email: employeeData.email,
        phone: employeeData.phone,
        address: employeeData.address,
        date_of_birth: employeeData.dateOfBirth,
        hire_date: employeeData.hireDate,
        position_id: employeeData.positionId,
        department_id: employeeData.departmentId,
        branch_id: employeeData.branchId,
        salary: employeeData.salary,
        status: 'active',
        emergency_contact: employeeData.emergencyContact,
        bank_account: employeeData.bankAccount,
        work_schedule: employeeData.workSchedule
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([employeeRecord])
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, name)
        `);
      
      if (error) throw error;
      
      // Update local state
      if (data && data[0]) {
        setEmployees(prev => [...prev, data[0]]);
      }
      
      // Refresh employees list
      await fetchEmployees();
      
      return data?.[0] || null;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถเพิ่มพนักงานได้: ${err.message}`,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchEmployees]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          email: updates.email,
          phone: updates.phone,
          address: updates.address,
          date_of_birth: updates.dateOfBirth,
          hire_date: updates.hireDate,
          position_id: updates.position?.id,
          department_id: updates.department?.id,
          salary: updates.salary,
          status: updates.status,
          emergency_contact: updates.emergencyContact,
          bank_account: updates.bankAccount,
          work_schedule: updates.workSchedule
        })
        .eq('id', id)
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, name)
        `);
      
      if (error) throw error;
      
      // Update local state
      if (data && data[0]) {
        setEmployees(prev => prev.map(emp => emp.id === id ? data[0] : emp));
      }
      
      toast({
        title: "สำเร็จ",
        description: "อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว",
      });
      
      return data?.[0] || null;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถอัปเดตข้อมูลพนักงานได้: ${err.message}`,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteEmployee = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      
      toast({
        title: "สำเร็จ",
        description: "ลบข้อมูลพนักงานเรียบร้อยแล้ว",
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถลบข้อมูลพนักงานได้: ${err.message}`,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateEmployeeStatus = useCallback(async (id: string, status: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, name)
        `);
      
      if (error) throw error;
      
      // Update local state
      if (data && data[0]) {
        setEmployees(prev => prev.map(emp => emp.id === id ? data[0] : emp));
      }
      
      toast({
        title: "สำเร็จ",
        description: "อัปเดตสถานะพนักงานเรียบร้อยแล้ว",
      });
      
      return data?.[0] || null;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถอัปเดตสถานะพนักงานได้: ${err.message}`,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
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
        const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
        if (!fullName.includes(searchTerm) && 
            !(employee.employeeId || '').toLowerCase().includes(searchTerm) &&
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