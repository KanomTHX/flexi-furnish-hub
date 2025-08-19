export interface Employee {
  id: string;
  employeeId: string; // รหัสพนักงาน
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  terminationDate?: string; // วันที่ออกจากงาน
  position: Position;
  department: Department;
  salary: number;
  commissionRate: number; // อัตราค่าคอมมิชชั่น (%)
  status: EmployeeStatus;
  avatar?: string;
  emergencyContact: EmergencyContact;
  bankAccount: BankAccount;
  documents: EmployeeDocument[];
  permissions: EmployeePermission[];
  workSchedule: WorkSchedule;
  branchId?: string; // สาขาที่สังกัด
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Position {
  id: string;
  name: string;
  description: string;
  level: number;
  baseSalary: number;
  hasCommission: boolean; // ตำแหน่งนี้มีค่าคอมมิชชั่นหรือไม่
  defaultCommissionRate: number; // อัตราค่าคอมมิชชั่นเริ่มต้น (%)
  permissions: string[];
  requirements: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  managerId?: string;
  budget: number;
  location: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branchName: string;
}

export interface EmployeeDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  uploadedAt: string;
  expiryDate?: string;
  isRequired: boolean;
}

export interface EmployeePermission {
  module: string;
  actions: PermissionAction[];
  restrictions?: string[];
}

export interface WorkSchedule {
  type: 'full-time' | 'part-time' | 'contract' | 'intern';
  workDays: WorkDay[];
  overtimeRate: number;
  vacationDays: number;
  sickDays: number;
}

export interface WorkDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  breakTime: number; // minutes
  isWorkingDay: boolean;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
  location?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  documents?: string[];
}

export interface Payroll {
  id: string;
  employeeId: string;
  period: PayrollPeriod;
  baseSalary: number;
  overtime: number;
  bonus: number;
  allowances: PayrollAllowance[];
  deductions: PayrollDeduction[];
  grossPay: number;
  tax: number;
  socialSecurity: number;
  netPay: number;
  status: PayrollStatus;
  paidAt?: string;
  createdAt: string;
}

export interface PayrollPeriod {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
}

export interface PayrollAllowance {
  type: string;
  name: string;
  amount: number;
  isTaxable: boolean;
}

export interface PayrollDeduction {
  type: string;
  name: string;
  amount: number;
  isRequired: boolean;
}

export interface Performance {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: PerformancePeriod;
  goals: PerformanceGoal[];
  ratings: PerformanceRating[];
  overallScore: number;
  feedback: string;
  developmentPlan: string[];
  status: PerformanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PerformancePeriod {
  year: number;
  quarter?: number;
  startDate: string;
  endDate: string;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  weight: number;
  target: string;
  achievement: string;
  score: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
}

export interface PerformanceRating {
  category: string;
  score: number;
  maxScore: number;
  comments: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  type: TrainingType;
  duration: number; // hours
  instructor: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  cost: number;
  materials: string[];
  requirements: string[];
  status: TrainingStatus;
  participants: TrainingParticipant[];
  createdAt: string;
}

// ระบบคอมมิชชั่น
export interface Commission {
  id: string;
  employeeId: string;
  transactionType: 'pos' | 'installment' | 'manual'; // ประเภทการขาย
  transactionId: string; // ID ของการขาย (POS หรือ Installment)
  saleAmount: number; // ยอดขาย
  commissionRate: number; // อัตราค่าคอมมิชชั่น (%)
  commissionAmount: number; // จำนวนค่าคอมมิชชั่น
  status: CommissionStatus;
  calculatedAt: string;
  paidAt?: string;
  notes?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

// ตำแหน่งงานที่กำหนดไว้ (Reference Data)
export interface PredefinedPosition {
  id: string;
  name: 'manager' | 'sales' | 'stock' | 'accounting' | 'credit_officer' | 'cash_collector';
  displayName: string;
  description: string;
  hasCommission: boolean;
  defaultCommissionRate: number;
  responsibilities: string[];
}

// การเข้างาน (Check-in/Check-out)
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// การลา
export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface TrainingParticipant {
  employeeId: string;
  enrolledAt: string;
  completedAt?: string;
  score?: number;
  certificate?: string;
  status: ParticipantStatus;
  feedback?: string;
}

export interface EmployeeAnalytics {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  terminations: number;
  averageSalary: number;
  totalPayroll: number;
  attendanceRate: number;
  turnoverRate: number;
  departmentBreakdown: DepartmentStats[];
  positionBreakdown: PositionStats[];
  ageDistribution: AgeGroup[];
  tenureDistribution: TenureGroup[];
  performanceDistribution: PerformanceGroup[];
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  averageSalary: number;
  totalBudget: number;
  utilizationRate: number;
}

export interface PositionStats {
  positionId: string;
  positionName: string;
  employeeCount: number;
  averageSalary: number;
  vacancies: number;
}

export interface AgeGroup {
  range: string;
  count: number;
  percentage: number;
}

export interface TenureGroup {
  range: string;
  count: number;
  percentage: number;
}

export interface PerformanceGroup {
  rating: string;
  count: number;
  percentage: number;
}

// Enums
export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'on-leave' | 'probation';

export type DocumentType = 
  | 'id-card' 
  | 'passport' 
  | 'resume' 
  | 'certificate' 
  | 'contract' 
  | 'medical' 
  | 'background-check'
  | 'other';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'manage';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'overtime' | 'holiday';

export type LeaveType = 
  | 'sick' // ลาป่วย
  | 'personal' // ลากิจ
  | 'vacation' // ลาพักร้อน
  | 'annual' 
  | 'maternity' 
  | 'paternity' 
  | 'emergency' 
  | 'unpaid' 
  | 'study' 
  | 'other';

export type CommissionStatus = 'pending' | 'calculated' | 'paid' | 'cancelled';

export type PredefinedPositionType = 'manager' | 'sales' | 'stock' | 'accounting' | 'credit_officer' | 'cash_collector';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type PayrollStatus = 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';

export type PerformanceStatus = 'draft' | 'in-review' | 'completed' | 'approved';

export type TrainingType = 'orientation' | 'skill-development' | 'compliance' | 'leadership' | 'technical' | 'soft-skills';

export type TrainingStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

export type ParticipantStatus = 'enrolled' | 'attending' | 'completed' | 'dropped' | 'failed';

// Filter and Search Types
export interface EmployeeFilters {
  search?: string;
  department?: string;
  position?: string;
  status?: EmployeeStatus;
  hireDate?: {
    start?: string;
    end?: string;
  };
  salary?: {
    min?: number;
    max?: number;
  };
}

export interface AttendanceFilters {
  search?: string;
  employeeId?: string;
  department?: string;
  date?: {
    start?: string;
    end?: string;
  };
  status?: AttendanceStatus;
}

export interface LeaveFilters {
  search?: string;
  employeeId?: string;
  type?: LeaveType;
  status?: LeaveStatus;
  date?: {
    start?: string;
    end?: string;
  };
}

export interface PayrollFilters {
  search?: string;
  employeeId?: string;
  department?: string;
  period?: {
    year?: number;
    month?: number;
  };
  status?: PayrollStatus;
}

export interface TrainingFilters {
  search?: string;
  type?: TrainingType;
  status?: TrainingStatus;
  date?: {
    start?: string;
    end?: string;
  };
  instructor?: string;
}

// Form Types
export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  positionId: string;
  departmentId: string;
  branchId: string;
  salary: number;
  emergencyContact: EmergencyContact;
  bankAccount: BankAccount;
  workSchedule: WorkSchedule;
}

export interface AttendanceFormData {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}

export interface LeaveFormData {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  documents?: File[];
}

export interface PayrollFormData {
  employeeId: string;
  period: PayrollPeriod;
  baseSalary: number;
  overtime: number;
  bonus: number;
  allowances: PayrollAllowance[];
  deductions: PayrollDeduction[];
}

export interface TrainingFormData {
  title: string;
  description: string;
  type: TrainingType;
  duration: number;
  instructor: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  cost: number;
  materials: string[];
  requirements: string[];
}