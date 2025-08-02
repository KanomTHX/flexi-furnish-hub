import { 
  Employee, 
  Department, 
  Position, 
  Attendance, 
  Leave, 
  Payroll, 
  Training,
  EmployeeAnalytics 
} from '@/types/employees';

// Mock Departments
export const mockDepartments: Department[] = [
  {
    id: 'dept-001',
    name: 'ฝ่ายขาย',
    description: 'ฝ่ายขายและการตลาด',
    managerId: 'emp-001',
    budget: 500000,
    location: 'ชั้น 1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'dept-002',
    name: 'ฝ่ายคลังสินค้า',
    description: 'ฝ่ายจัดการคลังสินค้าและโลจิสติกส์',
    managerId: 'emp-005',
    budget: 300000,
    location: 'ชั้น B1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'dept-003',
    name: 'ฝ่ายบัญชี',
    description: 'ฝ่ายบัญชีและการเงิน',
    managerId: 'emp-007',
    budget: 250000,
    location: 'ชั้น 2',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'dept-004',
    name: 'ฝ่ายบริหาร',
    description: 'ฝ่ายบริหารและทรัพยากรบุคคล',
    budget: 400000,
    location: 'ชั้น 3',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Mock Positions
export const mockPositions: Position[] = [
  {
    id: 'pos-001',
    name: 'ผู้จัดการฝ่ายขาย',
    description: 'รับผิดชอบการบริหารจัดการฝ่ายขาย',
    level: 5,
    baseSalary: 45000,
    permissions: ['sales:manage', 'reports:view', 'employees:view'],
    requirements: ['ปริญญาตรี', 'ประสบการณ์ 5 ปี'],
    isActive: true
  },
  {
    id: 'pos-002',
    name: 'พนักงานขาย',
    description: 'ขายสินค้าและให้บริการลูกค้า',
    level: 2,
    baseSalary: 18000,
    permissions: ['pos:use', 'customers:view', 'products:view'],
    requirements: ['มัธยมศึกษา', 'ประสบการณ์ 1 ปี'],
    isActive: true
  },
  {
    id: 'pos-003',
    name: 'แคชเชียร์',
    description: 'รับชำระเงินและออกใบเสร็จ',
    level: 1,
    baseSalary: 15000,
    permissions: ['pos:use', 'payments:process'],
    requirements: ['มัธยมศึกษา'],
    isActive: true
  },
  {
    id: 'pos-004',
    name: 'พนักงานคลังสินค้า',
    description: 'จัดการสินค้าในคลัง',
    level: 2,
    baseSalary: 16000,
    permissions: ['inventory:manage', 'stock:update'],
    requirements: ['มัธยมศึกษา'],
    isActive: true
  },
  {
    id: 'pos-005',
    name: 'หัวหน้าคลังสินค้า',
    description: 'บริหารจัดการคลังสินค้า',
    level: 4,
    baseSalary: 35000,
    permissions: ['inventory:manage', 'warehouse:manage', 'reports:view'],
    requirements: ['ปริญญาตรี', 'ประสบการณ์ 3 ปี'],
    isActive: true
  },
  {
    id: 'pos-006',
    name: 'พนักงานบัญชี',
    description: 'จัดทำบัญชีและรายงานทางการเงิน',
    level: 3,
    baseSalary: 25000,
    permissions: ['accounting:manage', 'reports:create'],
    requirements: ['ปริญญาตรี สาขาบัญชี', 'ประสบการณ์ 2 ปี'],
    isActive: true
  },
  {
    id: 'pos-007',
    name: 'หัวหน้าบัญชี',
    description: 'บริหารจัดการฝ่ายบัญชี',
    level: 5,
    baseSalary: 40000,
    permissions: ['accounting:manage', 'finance:manage', 'reports:manage'],
    requirements: ['ปริญญาตรี สาขาบัญชี', 'ประสบการณ์ 5 ปี'],
    isActive: true
  }
];

// Mock Employees
export const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    employeeId: 'EMP001',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'somchai@company.com',
    phone: '081-234-5678',
    address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    dateOfBirth: '1985-05-15',
    hireDate: '2020-01-15',
    position: mockPositions[0],
    department: mockDepartments[0],
    salary: 45000,
    status: 'active',
    avatar: '/avatars/somchai.jpg',
    emergencyContact: {
      name: 'สมหญิง ใจดี',
      relationship: 'ภรรยา',
      phone: '081-234-5679',
      email: 'somying@email.com'
    },
    bankAccount: {
      bankName: 'ธนาคารกสิกรไทย',
      accountNumber: '123-4-56789-0',
      accountName: 'สมชาย ใจดี',
      branchName: 'สาขาสุขุมวิท'
    },
    documents: [
      {
        id: 'doc-001',
        type: 'id-card',
        name: 'บัตรประชาชน',
        url: '/documents/id-card-001.pdf',
        uploadedAt: '2020-01-15T00:00:00Z',
        isRequired: true
      }
    ],
    permissions: [
      {
        module: 'sales',
        actions: ['create', 'read', 'update', 'delete', 'manage']
      }
    ],
    workSchedule: {
      type: 'full-time',
      workDays: [
        { day: 'monday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'tuesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'wednesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'thursday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'friday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'saturday', startTime: '08:00', endTime: '12:00', breakTime: 0, isWorkingDay: true },
        { day: 'sunday', startTime: '00:00', endTime: '00:00', breakTime: 0, isWorkingDay: false }
      ],
      overtimeRate: 1.5,
      vacationDays: 15,
      sickDays: 10
    },
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'emp-002',
    employeeId: 'EMP002',
    firstName: 'สมหญิง',
    lastName: 'รักงาน',
    email: 'somying@company.com',
    phone: '082-345-6789',
    address: '456 ถนนพหลโยธิน กรุงเทพฯ 10400',
    dateOfBirth: '1990-08-20',
    hireDate: '2021-03-01',
    position: mockPositions[1],
    department: mockDepartments[0],
    salary: 18000,
    status: 'active',
    emergencyContact: {
      name: 'สมศักดิ์ รักงาน',
      relationship: 'พ่อ',
      phone: '082-345-6788'
    },
    bankAccount: {
      bankName: 'ธนาคารไทยพาณิชย์',
      accountNumber: '234-5-67890-1',
      accountName: 'สมหญิง รักงาน',
      branchName: 'สาขาพหลโยธิน'
    },
    documents: [],
    permissions: [
      {
        module: 'pos',
        actions: ['read', 'create']
      }
    ],
    workSchedule: {
      type: 'full-time',
      workDays: [
        { day: 'monday', startTime: '09:00', endTime: '18:00', breakTime: 60, isWorkingDay: true },
        { day: 'tuesday', startTime: '09:00', endTime: '18:00', breakTime: 60, isWorkingDay: true },
        { day: 'wednesday', startTime: '09:00', endTime: '18:00', breakTime: 60, isWorkingDay: true },
        { day: 'thursday', startTime: '09:00', endTime: '18:00', breakTime: 60, isWorkingDay: true },
        { day: 'friday', startTime: '09:00', endTime: '18:00', breakTime: 60, isWorkingDay: true },
        { day: 'saturday', startTime: '09:00', endTime: '13:00', breakTime: 0, isWorkingDay: true },
        { day: 'sunday', startTime: '00:00', endTime: '00:00', breakTime: 0, isWorkingDay: false }
      ],
      overtimeRate: 1.5,
      vacationDays: 12,
      sickDays: 8
    },
    createdAt: '2021-03-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: 'emp-001',
    updatedBy: 'emp-001'
  },
  {
    id: 'emp-003',
    employeeId: 'EMP003',
    firstName: 'สมศักดิ์',
    lastName: 'ขยันทำงาน',
    email: 'somsak@company.com',
    phone: '083-456-7890',
    address: '789 ถนนรัชดาภิเษก กรุงเทพฯ 10310',
    dateOfBirth: '1995-12-10',
    hireDate: '2022-06-15',
    position: mockPositions[2],
    department: mockDepartments[0],
    salary: 15000,
    status: 'active',
    emergencyContact: {
      name: 'สมใจ ขยันทำงาน',
      relationship: 'แม่',
      phone: '083-456-7891'
    },
    bankAccount: {
      bankName: 'ธนาคารกรุงเทพ',
      accountNumber: '345-6-78901-2',
      accountName: 'สมศักดิ์ ขยันทำงาน',
      branchName: 'สาขารัชดาภิเษก'
    },
    documents: [],
    permissions: [
      {
        module: 'pos',
        actions: ['read', 'create']
      }
    ],
    workSchedule: {
      type: 'full-time',
      workDays: [
        { day: 'monday', startTime: '10:00', endTime: '19:00', breakTime: 60, isWorkingDay: true },
        { day: 'tuesday', startTime: '10:00', endTime: '19:00', breakTime: 60, isWorkingDay: true },
        { day: 'wednesday', startTime: '10:00', endTime: '19:00', breakTime: 60, isWorkingDay: true },
        { day: 'thursday', startTime: '10:00', endTime: '19:00', breakTime: 60, isWorkingDay: true },
        { day: 'friday', startTime: '10:00', endTime: '19:00', breakTime: 60, isWorkingDay: true },
        { day: 'saturday', startTime: '10:00', endTime: '14:00', breakTime: 0, isWorkingDay: true },
        { day: 'sunday', startTime: '00:00', endTime: '00:00', breakTime: 0, isWorkingDay: false }
      ],
      overtimeRate: 1.5,
      vacationDays: 10,
      sickDays: 6
    },
    createdAt: '2022-06-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: 'emp-001',
    updatedBy: 'emp-001'
  },
  {
    id: 'emp-004',
    employeeId: 'EMP004',
    firstName: 'สมปอง',
    lastName: 'จัดการดี',
    email: 'sompong@company.com',
    phone: '084-567-8901',
    address: '321 ถนนลาดพร้าว กรุงเทพฯ 10230',
    dateOfBirth: '1988-03-25',
    hireDate: '2020-08-01',
    position: mockPositions[3],
    department: mockDepartments[1],
    salary: 16000,
    status: 'active',
    emergencyContact: {
      name: 'สมจิตต์ จัดการดี',
      relationship: 'ภรรยา',
      phone: '084-567-8902'
    },
    bankAccount: {
      bankName: 'ธนาคารกรุงศรีอยุธยา',
      accountNumber: '456-7-89012-3',
      accountName: 'สมปอง จัดการดี',
      branchName: 'สาขาลาดพร้าว'
    },
    documents: [],
    permissions: [
      {
        module: 'inventory',
        actions: ['read', 'update']
      }
    ],
    workSchedule: {
      type: 'full-time',
      workDays: [
        { day: 'monday', startTime: '07:00', endTime: '16:00', breakTime: 60, isWorkingDay: true },
        { day: 'tuesday', startTime: '07:00', endTime: '16:00', breakTime: 60, isWorkingDay: true },
        { day: 'wednesday', startTime: '07:00', endTime: '16:00', breakTime: 60, isWorkingDay: true },
        { day: 'thursday', startTime: '07:00', endTime: '16:00', breakTime: 60, isWorkingDay: true },
        { day: 'friday', startTime: '07:00', endTime: '16:00', breakTime: 60, isWorkingDay: true },
        { day: 'saturday', startTime: '07:00', endTime: '11:00', breakTime: 0, isWorkingDay: true },
        { day: 'sunday', startTime: '00:00', endTime: '00:00', breakTime: 0, isWorkingDay: false }
      ],
      overtimeRate: 1.5,
      vacationDays: 12,
      sickDays: 8
    },
    createdAt: '2020-08-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'emp-005',
    employeeId: 'EMP005',
    firstName: 'สมหมาย',
    lastName: 'บริหารเก่ง',
    email: 'sommai@company.com',
    phone: '085-678-9012',
    address: '654 ถนนวิภาวดี กรุงเทพฯ 10900',
    dateOfBirth: '1982-11-08',
    hireDate: '2019-04-01',
    position: mockPositions[4],
    department: mockDepartments[1],
    salary: 35000,
    status: 'active',
    emergencyContact: {
      name: 'สมคิด บริหารเก่ง',
      relationship: 'พี่ชาย',
      phone: '085-678-9013'
    },
    bankAccount: {
      bankName: 'ธนาคารทหารไทยธนชาต',
      accountNumber: '567-8-90123-4',
      accountName: 'สมหมาย บริหารเก่ง',
      branchName: 'สาขาวิภาวดี'
    },
    documents: [],
    permissions: [
      {
        module: 'warehouse',
        actions: ['create', 'read', 'update', 'delete', 'manage']
      }
    ],
    workSchedule: {
      type: 'full-time',
      workDays: [
        { day: 'monday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'tuesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'wednesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'thursday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'friday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'saturday', startTime: '08:00', endTime: '12:00', breakTime: 0, isWorkingDay: true },
        { day: 'sunday', startTime: '00:00', endTime: '00:00', breakTime: 0, isWorkingDay: false }
      ],
      overtimeRate: 1.5,
      vacationDays: 15,
      sickDays: 10
    },
    createdAt: '2019-04-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// Mock Attendance Data
export const mockAttendance: Attendance[] = [
  {
    id: 'att-001',
    employeeId: 'emp-001',
    date: '2025-02-08',
    checkIn: '08:00',
    checkOut: '17:30',
    breakStart: '12:00',
    breakEnd: '13:00',
    totalHours: 8.5,
    overtimeHours: 0.5,
    status: 'present',
    location: 'สำนักงาน',
    createdAt: '2025-02-08T08:00:00Z'
  },
  {
    id: 'att-002',
    employeeId: 'emp-002',
    date: '2025-02-08',
    checkIn: '09:15',
    checkOut: '18:00',
    breakStart: '12:30',
    breakEnd: '13:30',
    totalHours: 7.75,
    overtimeHours: 0,
    status: 'late',
    location: 'สำนักงาน',
    notes: 'มาสาย 15 นาที',
    createdAt: '2025-02-08T09:15:00Z'
  }
];

// Mock Leave Data
export const mockLeaves: Leave[] = [
  {
    id: 'leave-001',
    employeeId: 'emp-002',
    type: 'annual',
    startDate: '2025-02-10',
    endDate: '2025-02-12',
    days: 3,
    reason: 'พักผ่อนกับครอบครัว',
    status: 'approved',
    appliedAt: '2025-02-05T10:00:00Z',
    approvedBy: 'emp-001',
    approvedAt: '2025-02-06T14:00:00Z'
  },
  {
    id: 'leave-002',
    employeeId: 'emp-003',
    type: 'sick',
    startDate: '2025-02-07',
    endDate: '2025-02-07',
    days: 1,
    reason: 'ป่วยไข้หวัด',
    status: 'pending',
    appliedAt: '2025-02-07T07:00:00Z'
  }
];

// Mock Payroll Data
export const mockPayrolls: Payroll[] = [
  {
    id: 'payroll-001',
    employeeId: 'emp-001',
    period: {
      year: 2025,
      month: 1,
      startDate: '2025-01-01',
      endDate: '2025-01-31'
    },
    baseSalary: 45000,
    overtime: 2500,
    bonus: 5000,
    allowances: [
      { type: 'transport', name: 'ค่าเดินทาง', amount: 2000, isTaxable: false },
      { type: 'meal', name: 'ค่าอาหาร', amount: 1500, isTaxable: false }
    ],
    deductions: [
      { type: 'tax', name: 'ภาษีเงินได้', amount: 3500, isRequired: true },
      { type: 'social', name: 'ประกันสังคม', amount: 750, isRequired: true }
    ],
    grossPay: 56000,
    tax: 3500,
    socialSecurity: 750,
    netPay: 51750,
    status: 'paid',
    paidAt: '2025-02-01T00:00:00Z',
    createdAt: '2025-01-31T00:00:00Z'
  }
];

// Mock Training Data
export const mockTrainings: Training[] = [
  {
    id: 'training-001',
    title: 'การใช้งานระบบ POS',
    description: 'อบรมการใช้งานระบบขายหน้าร้าน',
    type: 'technical',
    duration: 4,
    instructor: 'อาจารย์สมชาย',
    location: 'ห้องประชุม A',
    startDate: '2025-02-15',
    endDate: '2025-02-15',
    maxParticipants: 10,
    cost: 5000,
    materials: ['คู่มือการใช้งาน', 'แบบฝึกหัด'],
    requirements: ['พนักงานใหม่'],
    status: 'planned',
    participants: [
      {
        employeeId: 'emp-002',
        enrolledAt: '2025-02-08T10:00:00Z',
        status: 'enrolled'
      },
      {
        employeeId: 'emp-003',
        enrolledAt: '2025-02-08T10:30:00Z',
        status: 'enrolled'
      }
    ],
    createdAt: '2025-02-01T00:00:00Z'
  }
];

// Mock Analytics Data
export const mockEmployeeAnalytics: EmployeeAnalytics = {
  totalEmployees: 5,
  activeEmployees: 5,
  newHires: 1,
  terminations: 0,
  averageSalary: 25800,
  totalPayroll: 129000,
  attendanceRate: 95.5,
  turnoverRate: 0,
  departmentBreakdown: [
    {
      departmentId: 'dept-001',
      departmentName: 'ฝ่ายขาย',
      employeeCount: 3,
      averageSalary: 26000,
      totalBudget: 500000,
      utilizationRate: 78
    },
    {
      departmentId: 'dept-002',
      departmentName: 'ฝ่ายคลังสินค้า',
      employeeCount: 2,
      averageSalary: 25500,
      totalBudget: 300000,
      utilizationRate: 85
    }
  ],
  positionBreakdown: [
    {
      positionId: 'pos-001',
      positionName: 'ผู้จัดการฝ่ายขาย',
      employeeCount: 1,
      averageSalary: 45000,
      vacancies: 0
    },
    {
      positionId: 'pos-002',
      positionName: 'พนักงานขาย',
      employeeCount: 1,
      averageSalary: 18000,
      vacancies: 1
    }
  ],
  ageDistribution: [
    { range: '20-30', count: 2, percentage: 40 },
    { range: '31-40', count: 2, percentage: 40 },
    { range: '41-50', count: 1, percentage: 20 }
  ],
  tenureDistribution: [
    { range: '0-1 ปี', count: 1, percentage: 20 },
    { range: '1-3 ปี', count: 2, percentage: 40 },
    { range: '3-5 ปี', count: 2, percentage: 40 }
  ],
  performanceDistribution: [
    { rating: 'ดีเยี่ยม', count: 2, percentage: 40 },
    { rating: 'ดี', count: 2, percentage: 40 },
    { rating: 'พอใช้', count: 1, percentage: 20 }
  ]
};