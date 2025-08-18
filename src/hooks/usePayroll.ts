import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Payroll, PayrollFilters, PayrollFormData, Employee, Attendance } from '@/types/employees';

export const usePayroll = () => {
  const { toast } = useToast();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ดึงข้อมูลเงินเดือนทั้งหมด
  const fetchPayrolls = useCallback(async (filters?: PayrollFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('payrolls')
        .select(`
          *,
          employee:employees(
            id,
            employee_code,
            first_name,
            last_name,
            position:positions(name),
            department:departments(name)
          )
        `);

      // Apply filters
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.period?.year) {
        query = query.eq('period_year', filters.period.year);
      }
      if (filters?.period?.month) {
        query = query.eq('period_month', filters.period.month);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPayrolls(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // สร้างข้อมูลเงินเดือนใหม่
  const createPayroll = useCallback(async (payrollData: PayrollFormData) => {
    setLoading(true);
    setError(null);

    try {
      // ตรวจสอบว่ามีข้อมูลเงินเดือนสำหรับพนักงานในเดือนนี้แล้วหรือไม่
      const { data: existing } = await supabase
        .from('payrolls')
        .select('id')
        .eq('employee_id', payrollData.employeeId)
        .eq('period_year', payrollData.period.year)
        .eq('period_month', payrollData.period.month)
        .single();

      if (existing) {
        throw new Error('มีข้อมูลเงินเดือนสำหรับพนักงานในเดือนนี้แล้ว');
      }

      // คำนวณเงินเดือนสุทธิ
      const allowancesTotal = payrollData.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
      const deductionsTotal = payrollData.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
      
      const grossPay = payrollData.baseSalary + 
                      payrollData.overtime + 
                      payrollData.bonus + 
                      allowancesTotal;
      
      const totalDeductions = deductionsTotal;
      
      const netPay = grossPay - totalDeductions;

      const { data, error } = await supabase
        .from('payrolls')
        .insert({
          employee_id: payrollData.employeeId,
          period_year: payrollData.period.year,
          period_month: payrollData.period.month,
          start_date: payrollData.period.startDate,
          end_date: payrollData.period.endDate,
          base_salary: payrollData.baseSalary,
          overtime: payrollData.overtime,
          bonus: payrollData.bonus,
          allowances: allowancesTotal,
          deductions: deductionsTotal,
          gross_pay: grossPay,
          net_pay: netPay,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "สร้างข้อมูลเงินเดือนสำเร็จ",
        description: `สร้างข้อมูลเงินเดือนสำหรับเดือน ${payrollData.period.month}/${payrollData.period.year} แล้ว`,
      });

      // Refresh data
      await fetchPayrolls();
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการสร้างข้อมูลเงินเดือน';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchPayrolls]);

  // อัปเดตข้อมูลเงินเดือน
  const updatePayroll = useCallback(async (id: string, updates: Partial<PayrollFormData>) => {
    setLoading(true);
    setError(null);

    try {
      // คำนวณเงินเดือนสุทธิใหม่ถ้ามีการเปลี่ยนแปลงตัวเลข
      const updateData: any = { ...updates };
      
      if (updates.baseSalary !== undefined || 
          updates.overtime !== undefined || 
          updates.bonus !== undefined || 
          updates.allowances !== undefined ||
          updates.deductions !== undefined) {
        
        // ดึงข้อมูลปัจจุบัน
        const { data: current } = await supabase
          .from('payrolls')
          .select('*')
          .eq('id', id)
          .single();

        if (current) {
          const newAllowances = updates.allowances || current.allowances || [];
          const newDeductions = updates.deductions || current.deductions || [];
          
          const allowancesTotal = Array.isArray(newAllowances) 
            ? newAllowances.reduce((sum: number, allowance: any) => sum + (allowance.amount || 0), 0)
            : (newAllowances || 0);
          
          const deductionsTotal = Array.isArray(newDeductions)
            ? newDeductions.reduce((sum: number, deduction: any) => sum + (deduction.amount || 0), 0)
            : (newDeductions || 0);
          
          const grossPay = (updates.baseSalary ?? current.base_salary || 0) + 
                          (updates.overtime ?? current.overtime || 0) + 
                          (updates.bonus ?? current.bonus || 0) + 
                          allowancesTotal;
          
          updateData.gross_pay = grossPay;
          updateData.net_pay = grossPay - deductionsTotal;
          
          // Convert form data to database format
          if (updates.baseSalary !== undefined) updateData.base_salary = updates.baseSalary;
          if (updates.allowances !== undefined) updateData.allowances = allowancesTotal;
          if (updates.deductions !== undefined) updateData.deductions = deductionsTotal;
        }
      }

      const { data, error } = await supabase
        .from('payrolls')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "อัปเดตข้อมูลเงินเดือนสำเร็จ",
        description: "ข้อมูลเงินเดือนได้รับการอัปเดตแล้ว",
      });

      // Refresh data
      await fetchPayrolls();
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลเงินเดือน';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchPayrolls]);

  // ลบข้อมูลเงินเดือน
  const deletePayroll = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('payrolls')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "ลบข้อมูลเงินเดือนสำเร็จ",
        description: "ข้อมูลเงินเดือนได้ถูกลบแล้ว",
      });

      // Refresh data
      await fetchPayrolls();
    } catch (err: any) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดในการลบข้อมูลเงินเดือน';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchPayrolls]);

  // อนุมัติเงินเดือน
  const approvePayroll = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payrolls')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "อนุมัติเงินเดือนสำเร็จ",
        description: "ข้อมูลเงินเดือนได้รับการอนุมัติแล้ว",
      });

      await fetchPayrolls();
      return data;
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchPayrolls]);

  // จ่ายเงินเดือน
  const payPayroll = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payrolls')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "จ่ายเงินเดือนสำเร็จ",
        description: "ข้อมูลเงินเดือนได้รับการอัปเดตเป็นจ่ายแล้ว",
      });

      await fetchPayrolls();
      return data;
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchPayrolls]);

  // ดึงข้อมูลเงินเดือนของพนักงานคนหนึ่ง
  const getEmployeePayrolls = useCallback(async (employeeId: string) => {
    return await fetchPayrolls({ employeeId });
  }, [fetchPayrolls]);

  // คำนวณสถิติเงินเดือน
  const getPayrollStats = useCallback(async () => {
    try {
      const { data: payrolls, error } = await supabase
        .from('payrolls')
        .select('net_pay, status, period_year, period_month');

      if (error) throw error;

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const currentMonthPayrolls = payrolls?.filter(
        p => p.period_month === currentMonth && p.period_year === currentYear
      ) || [];

      const totalNetPay = currentMonthPayrolls.reduce(
        (sum, payroll) => sum + (payroll.net_pay || 0), 0
      );

      const paidCount = currentMonthPayrolls.filter(p => p.status === 'paid').length;
      const pendingCount = currentMonthPayrolls.filter(p => p.status === 'pending').length;
      const approvedCount = currentMonthPayrolls.filter(p => p.status === 'approved').length;

      return {
        totalNetPay,
        totalEmployees: currentMonthPayrolls.length,
        paidCount,
        pendingCount,
        approvedCount
      };
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงสถิติเงินเดือนได้",
        variant: "destructive",
      });
      return {
        totalNetPay: 0,
        totalEmployees: 0,
        paidCount: 0,
        pendingCount: 0,
        approvedCount: 0
      };
    }
  }, [toast]);

  // Load data on mount
  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // Get employee attendance data for payroll calculation
  const getEmployeeAttendance = useCallback(async (employeeId: string, year: number, month: number) => {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      const workDays = attendance?.filter(a => a.status === 'present').length || 0;
      const lateDays = attendance?.filter(a => a.late_minutes && a.late_minutes > 0).length || 0;
      const absentDays = attendance?.filter(a => a.status === 'absent').length || 0;
      const totalLateMins = attendance?.reduce((sum, a) => sum + (a.late_minutes || 0), 0) || 0;

      return {
        workDays,
        lateDays,
        absentDays,
        totalLateMins,
        attendanceRecords: attendance || []
      };
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      return {
        workDays: 0,
        lateDays: 0,
        absentDays: 0,
        totalLateMins: 0,
        attendanceRecords: []
      };
    }
  }, []);

  // Calculate payroll based on employee data and attendance
  const calculatePayrollFromAttendance = useCallback(async (employeeId: string, year: number, month: number) => {
    try {
      // Get employee data
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select(`
          *,
          position:positions(base_salary, allowances),
          department:departments(name)
        `)
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;

      // Get attendance data
      const attendanceData = await getEmployeeAttendance(employeeId, year, month);

      // Calculate base salary (pro-rated based on work days)
      const totalWorkDaysInMonth = new Date(year, month, 0).getDate();
      const baseSalary = employee.position?.base_salary || 0;
      const dailySalary = baseSalary / totalWorkDaysInMonth;
      const calculatedBaseSalary = dailySalary * attendanceData.workDays;

      // Calculate deductions for late/absent
      const lateDeduction = (attendanceData.totalLateMins / 60) * (dailySalary / 8); // Assume 8 hours per day
      const absentDeduction = dailySalary * attendanceData.absentDays;

      // Calculate allowances
      const allowances = employee.position?.allowances || [];
      const allowancesTotal = allowances.reduce((sum: number, allowance: any) => {
        return sum + (allowance.amount || 0);
      }, 0);

      // Calculate gross and net pay
      const grossPay = calculatedBaseSalary + allowancesTotal;
      const totalDeductions = lateDeduction + absentDeduction;
      const netPay = grossPay - totalDeductions;

      return {
        baseSalary: calculatedBaseSalary,
        allowances,
        deductions: [
          ...(lateDeduction > 0 ? [{ type: 'late', amount: lateDeduction, description: `หักเงินมาสาย ${attendanceData.totalLateMins} นาที` }] : []),
          ...(absentDeduction > 0 ? [{ type: 'absent', amount: absentDeduction, description: `หักเงินขาดงาน ${attendanceData.absentDays} วัน` }] : [])
        ],
        grossPay,
        netPay,
        attendanceData
      };
    } catch (err: any) {
      console.error('Error calculating payroll:', err);
      throw err;
    }
  }, [getEmployeeAttendance]);

  return {
    // Data
    payrolls,
    loading,
    error,

    // Functions
    fetchPayrolls,
    createPayroll,
    updatePayroll,
    deletePayroll,
    approvePayroll,
    payPayroll,
    getEmployeePayrolls,
    getPayrollStats,
    getEmployeeAttendance,
    calculatePayrollFromAttendance
  };
};

export default usePayroll;