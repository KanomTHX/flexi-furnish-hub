import { useState, useCallback, useMemo } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
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
  mockTrainings,
  mockEmployeeAnalytics 
} from '@/data/mockEmployeesData';

interface EmployeesState {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  attendance: Attendance[];
  leaves: Leave[];
  payrolls: Payroll[];
  trainings: Training[];
  analytics: EmployeeAnalytics;
  loading: boolean;
  error: string | null;
}

export const useEmployees = () => {
  const { toast } = useToast();
  
  // Real-time data queries
  const employeesQuery = useSupabaseQuery<Employee>(
    ['employees'],
    'employees',
    `
      *,
      department:departments(*),
      position:positions(*)
    `,
    { realtime: true, orderBy: { column: 'created_at', ascending: false } }
  );

  const departmentsQuery = useSupabaseQuery<Department>(
    ['departments'],
    'departments',
    '*',
    { realtime: true }
  );

  const positionsQuery = useSupabaseQuery<Position>(
    ['positions'],
    'positions',
    '*',
    { realtime: true }
  );

  const attendanceQuery = useSupabaseQuery<Attendance>(
    ['attendance'],
    'attendance',
    `
      *,
      employee:employees(*)
    `,
    { 
      realtime: true, 
      orderBy: { column: 'date', ascending: false },
      limit: 100 
    }
  );

  const leavesQuery = useSupabaseQuery<Leave>(
    ['leaves'],
    'leaves',
    `
      *,
      employee:employees(*)
    `,
    { realtime: true, orderBy: { column: 'applied_at', ascending: false } }
  );

  const payrollsQuery = useSupabaseQuery<Payroll>(
    ['payrolls'],
    'payrolls',
    `
      *,
      employee:employees(*)
    `,
    { realtime: true, orderBy: { column: 'created_at', ascending: false } }
  );

  // Mutations
  const addEmployeeMutation = useSupabaseMutation('employees', 'insert', {
    invalidateQueries: [['employees']],
  });

  const updateEmployeeMutation = useSupabaseMutation('employees', 'update', {
    invalidateQueries: [['employees']],
  });

  const deleteEmployeeMutation = useSupabaseMutation('employees', 'delete', {
    invalidateQueries: [['employees']],
  });

  const addAttendanceMutation = useSupabaseMutation('attendance', 'insert', {
    invalidateQueries: [['attendance']],
  });

  const addLeaveMutation = useSupabaseMutation('leaves', 'insert', {
    invalidateQueries: [['leaves']],
  });

  // Fallback to mock data if queries are loading or failed
  const employees = employeesQuery.data || mockEmployees;
  const departments = departmentsQuery.data || mockDepartments;
  const positions = positionsQuery.data || mockPositions;
  const attendance = attendanceQuery.data || mockAttendance;
  const leaves = leavesQuery.data || mockLeaves;
  const payrolls = payrollsQuery.data || mockPayrolls;
  const trainings = mockTrainings; // Keep as mock for now

  const loading = employeesQuery.isLoading || departmentsQuery.isLoading || positionsQuery.isLoading;
  const error = employeesQuery.error || departmentsQuery.error || positionsQuery.error;

  const state: EmployeesState = {
    employees,
    departments,
    positions,
    attendance,
    leaves,
    payrolls,
    trainings,
    analytics: mockEmployeeAnalytics,
    loading,
    error: error?.message || null
  };

  // Employee Management
  const addEmployee = useCallback((employeeData: EmployeeFormData) => {
    const position = state.positions.find(p => p.id === employeeData.positionId);
    const department = state.departments.find(d => d.id === employeeData.departmentId);
    
    if (!position || !department) {
      throw new Error('Position or Department not found');
    }

    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      employeeId: `EMP${String(state.employees.length + 1).padStart(3, '0')}`,
      ...employeeData,
      position,
      department,
      status: 'active' as const,
      documents: [],
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      updatedBy: 'current-user'
    };

    setState(prev => ({
      ...prev,
      employees: [...prev.employees, newEmployee]
    }));

    return newEmployee;
  }, [state.employees.length]);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setState(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === id 
          ? { ...emp, ...updates, updatedAt: new Date().toISOString() }
          : emp
      )
    }));
  }, []);

  const updateEmployeeStatus = useCallback((id: string, status: string) => {
    setState(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === id 
          ? { ...emp, status: status as any, updatedAt: new Date().toISOString() }
          : emp
      )
    }));
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      employees: prev.employees.filter(emp => emp.id !== id)
    }));
  }, []);

  const getEmployee = useCallback((id: string) => {
    return state.employees.find(emp => emp.id === id);
  }, [state.employees]);

  // Department Management
  const addDepartment = useCallback((department: Omit<Department, 'id' | 'createdAt'>) => {
    const newDepartment: Department = {
      ...department,
      id: `dept-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      departments: [...prev.departments, newDepartment]
    }));

    return newDepartment;
  }, []);

  const updateDepartment = useCallback((id: string, updates: Partial<Department>) => {
    setState(prev => ({
      ...prev,
      departments: prev.departments.map(dept => 
        dept.id === id ? { ...dept, ...updates } : dept
      )
    }));
  }, []);

  // Position Management
  const addPosition = useCallback((position: Omit<Position, 'id'>) => {
    const newPosition: Position = {
      ...position,
      id: `pos-${Date.now()}`
    };

    setState(prev => ({
      ...prev,
      positions: [...prev.positions, newPosition]
    }));

    return newPosition;
  }, []);

  const updatePosition = useCallback((id: string, updates: Partial<Position>) => {
    setState(prev => ({
      ...prev,
      positions: prev.positions.map(pos => 
        pos.id === id ? { ...pos, ...updates } : pos
      )
    }));
  }, []);

  // Attendance Management
  const addAttendance = useCallback((attendanceData: AttendanceFormData) => {
    const newAttendance: Attendance = {
      id: `att-${Date.now()}`,
      ...attendanceData,
      totalHours: calculateTotalHours(attendanceData.checkIn, attendanceData.checkOut, attendanceData.breakStart, attendanceData.breakEnd),
      overtimeHours: 0, // Calculate based on work schedule
      status: 'present',
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      attendance: [...prev.attendance, newAttendance]
    }));

    return newAttendance;
  }, []);

  const updateAttendance = useCallback((id: string, updates: Partial<Attendance>) => {
    setState(prev => ({
      ...prev,
      attendance: prev.attendance.map(att => 
        att.id === id ? { ...att, ...updates } : att
      )
    }));
  }, []);

  // Leave Management
  const addLeave = useCallback((leaveData: LeaveFormData) => {
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newLeave: Leave = {
      id: `leave-${Date.now()}`,
      employeeId: leaveData.employeeId,
      type: leaveData.type,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason,
      days,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      documents: leaveData.documents?.map(file => file.name) || []
    };

    setState(prev => ({
      ...prev,
      leaves: [...prev.leaves, newLeave]
    }));

    return newLeave;
  }, []);

  const updateLeave = useCallback((id: string, updates: Partial<Leave>) => {
    setState(prev => ({
      ...prev,
      leaves: prev.leaves.map(leave => 
        leave.id === id ? { ...leave, ...updates } : leave
      )
    }));
  }, []);

  const approveLeave = useCallback((id: string, approverId: string) => {
    setState(prev => ({
      ...prev,
      leaves: prev.leaves.map(leave => 
        leave.id === id 
          ? { 
              ...leave, 
              status: 'approved', 
              approvedBy: approverId,
              approvedAt: new Date().toISOString()
            }
          : leave
      )
    }));
  }, []);

  const rejectLeave = useCallback((id: string, reason: string) => {
    setState(prev => ({
      ...prev,
      leaves: prev.leaves.map(leave => 
        leave.id === id 
          ? { 
              ...leave, 
              status: 'rejected', 
              rejectedReason: reason
            }
          : leave
      )
    }));
  }, []);

  // Payroll Management
  const addPayroll = useCallback((payrollData: PayrollFormData) => {
    const grossPay = payrollData.baseSalary + payrollData.overtime + payrollData.bonus + 
                    payrollData.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
    
    const totalDeductions = payrollData.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    const netPay = grossPay - totalDeductions;

    const newPayroll: Payroll = {
      id: `payroll-${Date.now()}`,
      ...payrollData,
      grossPay,
      tax: payrollData.deductions.find(d => d.type === 'tax')?.amount || 0,
      socialSecurity: payrollData.deductions.find(d => d.type === 'social')?.amount || 0,
      netPay,
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      payrolls: [...prev.payrolls, newPayroll]
    }));

    return newPayroll;
  }, []);

  const updatePayroll = useCallback((id: string, updates: Partial<Payroll>) => {
    setState(prev => ({
      ...prev,
      payrolls: prev.payrolls.map(payroll => 
        payroll.id === id ? { ...payroll, ...updates } : payroll
      )
    }));
  }, []);

  // Training Management
  const addTraining = useCallback((trainingData: TrainingFormData) => {
    const newTraining: Training = {
      id: `training-${Date.now()}`,
      ...trainingData,
      status: 'planned',
      participants: [],
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      trainings: [...prev.trainings, newTraining]
    }));

    return newTraining;
  }, []);

  const updateTraining = useCallback((id: string, updates: Partial<Training>) => {
    setState(prev => ({
      ...prev,
      trainings: prev.trainings.map(training => 
        training.id === id ? { ...training, ...updates } : training
      )
    }));
  }, []);

  const enrollInTraining = useCallback((trainingId: string, employeeId: string) => {
    setState(prev => ({
      ...prev,
      trainings: prev.trainings.map(training => 
        training.id === trainingId 
          ? {
              ...training,
              participants: [
                ...training.participants,
                {
                  employeeId,
                  enrolledAt: new Date().toISOString(),
                  status: 'enrolled'
                }
              ]
            }
          : training
      )
    }));
  }, []);

  // Filtering Functions
  const getFilteredEmployees = useCallback((filters: EmployeeFilters) => {
    return state.employees.filter(employee => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const employeeId = employee.employeeId.toLowerCase();
        const email = employee.email.toLowerCase();
        
        if (!fullName.includes(searchTerm) && 
            !employeeId.includes(searchTerm) && 
            !email.includes(searchTerm)) {
          return false;
        }
      }

      if (filters.department && employee.department.id !== filters.department) {
        return false;
      }

      if (filters.position && employee.position.id !== filters.position) {
        return false;
      }

      if (filters.status && employee.status !== filters.status) {
        return false;
      }

      if (filters.hireDate) {
        const hireDate = new Date(employee.hireDate);
        if (filters.hireDate.start && hireDate < new Date(filters.hireDate.start)) {
          return false;
        }
        if (filters.hireDate.end && hireDate > new Date(filters.hireDate.end)) {
          return false;
        }
      }

      if (filters.salary) {
        if (filters.salary.min && employee.salary < filters.salary.min) {
          return false;
        }
        if (filters.salary.max && employee.salary > filters.salary.max) {
          return false;
        }
      }

      return true;
    });
  }, [state.employees]);

  const getFilteredAttendance = useCallback((filters: AttendanceFilters) => {
    return state.attendance.filter(attendance => {
      if (filters.employeeId && attendance.employeeId !== filters.employeeId) {
        return false;
      }

      if (filters.department) {
        const employee = state.employees.find(emp => emp.id === attendance.employeeId);
        if (!employee || employee.department.id !== filters.department) {
          return false;
        }
      }

      if (filters.date) {
        const attendanceDate = new Date(attendance.date);
        if (filters.date.start && attendanceDate < new Date(filters.date.start)) {
          return false;
        }
        if (filters.date.end && attendanceDate > new Date(filters.date.end)) {
          return false;
        }
      }

      if (filters.status && attendance.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [state.attendance, state.employees]);

  const getFilteredLeaves = useCallback((filters: LeaveFilters) => {
    return state.leaves.filter(leave => {
      if (filters.employeeId && leave.employeeId !== filters.employeeId) {
        return false;
      }

      if (filters.type && leave.type !== filters.type) {
        return false;
      }

      if (filters.status && leave.status !== filters.status) {
        return false;
      }

      if (filters.date) {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        
        if (filters.date.start) {
          const filterStart = new Date(filters.date.start);
          if (endDate < filterStart) {
            return false;
          }
        }
        
        if (filters.date.end) {
          const filterEnd = new Date(filters.date.end);
          if (startDate > filterEnd) {
            return false;
          }
        }
      }

      return true;
    });
  }, [state.leaves]);

  const getFilteredPayrolls = useCallback((filters: PayrollFilters) => {
    return state.payrolls.filter(payroll => {
      if (filters.employeeId && payroll.employeeId !== filters.employeeId) {
        return false;
      }

      if (filters.department) {
        const employee = state.employees.find(emp => emp.id === payroll.employeeId);
        if (!employee || employee.department.id !== filters.department) {
          return false;
        }
      }

      if (filters.period) {
        if (filters.period.year && payroll.period.year !== filters.period.year) {
          return false;
        }
        if (filters.period.month && payroll.period.month !== filters.period.month) {
          return false;
        }
      }

      if (filters.status && payroll.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [state.payrolls, state.employees]);

  const getFilteredTrainings = useCallback((filters: TrainingFilters) => {
    return state.trainings.filter(training => {
      if (filters.type && training.type !== filters.type) {
        return false;
      }

      if (filters.status && training.status !== filters.status) {
        return false;
      }

      if (filters.instructor && !training.instructor.toLowerCase().includes(filters.instructor.toLowerCase())) {
        return false;
      }

      if (filters.date) {
        const startDate = new Date(training.startDate);
        const endDate = new Date(training.endDate);
        
        if (filters.date.start) {
          const filterStart = new Date(filters.date.start);
          if (endDate < filterStart) {
            return false;
          }
        }
        
        if (filters.date.end) {
          const filterEnd = new Date(filters.date.end);
          if (startDate > filterEnd) {
            return false;
          }
        }
      }

      return true;
    });
  }, [state.trainings]);

  // Analytics
  const calculateAnalytics = useCallback(() => {
    const totalEmployees = state.employees.length;
    const activeEmployees = state.employees.filter(emp => emp.status === 'active').length;
    
    // Calculate new hires (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newHires = state.employees.filter(emp => new Date(emp.hireDate) >= thirtyDaysAgo).length;
    
    const averageSalary = state.employees.reduce((sum, emp) => sum + emp.salary, 0) / totalEmployees;
    const totalPayroll = state.employees.reduce((sum, emp) => sum + emp.salary, 0);

    return {
      ...state.analytics,
      totalEmployees,
      activeEmployees,
      newHires,
      averageSalary,
      totalPayroll
    };
  }, [state.employees, state.analytics]);

  // Utility Functions
  const calculateTotalHours = (checkIn: string, checkOut: string, breakStart?: string, breakEnd?: string) => {
    const checkInTime = new Date(`2000-01-01T${checkIn}:00`);
    const checkOutTime = new Date(`2000-01-01T${checkOut}:00`);
    
    let totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
    
    if (breakStart && breakEnd) {
      const breakStartTime = new Date(`2000-01-01T${breakStart}:00`);
      const breakEndTime = new Date(`2000-01-01T${breakEnd}:00`);
      const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
      totalMinutes -= breakMinutes;
    }
    
    return totalMinutes / 60; // Convert to hours
  };

  // Export Functions
  const exportEmployees = useCallback(() => {
    const csvData = state.employees.map(emp => ({
      'รหัสพนักงาน': emp.employeeId,
      'ชื่อ': emp.firstName,
      'นามสกุล': emp.lastName,
      'อีเมล': emp.email,
      'โทรศัพท์': emp.phone,
      'แผนก': emp.department.name,
      'ตำแหน่ง': emp.position.name,
      'เงินเดือน': emp.salary,
      'สถานะ': emp.status,
      'วันที่เข้าทำงาน': emp.hireDate
    }));

    const csv = convertToCSV(csvData);
    downloadCSV(csv, `employees-${new Date().toISOString().split('T')[0]}.csv`);
  }, [state.employees]);

  const exportAttendance = useCallback((filters?: AttendanceFilters) => {
    const attendanceData = filters ? getFilteredAttendance(filters) : state.attendance;
    
    const csvData = attendanceData.map(att => {
      const employee = state.employees.find(emp => emp.id === att.employeeId);
      return {
        'วันที่': att.date,
        'รหัสพนักงาน': employee?.employeeId || '',
        'ชื่อ-นามสกุล': employee ? `${employee.firstName} ${employee.lastName}` : '',
        'เวลาเข้า': att.checkIn || '',
        'เวลาออก': att.checkOut || '',
        'ชั่วโมงทำงาน': att.totalHours,
        'ชั่วโมงล่วงเวลา': att.overtimeHours,
        'สถานะ': att.status,
        'หมายเหตุ': att.notes || ''
      };
    });

    const csv = convertToCSV(csvData);
    downloadCSV(csv, `attendance-${new Date().toISOString().split('T')[0]}.csv`);
  }, [state.attendance, state.employees, getFilteredAttendance]);

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    // State
    ...state,
    
    // Employee Management
    addEmployee,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee,
    getEmployee,
    getFilteredEmployees,
    
    // Department Management
    addDepartment,
    updateDepartment,
    
    // Position Management
    addPosition,
    updatePosition,
    
    // Attendance Management
    addAttendance,
    updateAttendance,
    getFilteredAttendance,
    
    // Leave Management
    addLeave,
    updateLeave,
    approveLeave,
    rejectLeave,
    getFilteredLeaves,
    
    // Payroll Management
    addPayroll,
    updatePayroll,
    getFilteredPayrolls,
    
    // Training Management
    addTraining,
    updateTraining,
    enrollInTraining,
    getFilteredTrainings,
    
    // Analytics
    calculateAnalytics,
    
    // Export Functions
    exportEmployees,
    exportAttendance
  };
};