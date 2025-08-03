-- Create custom types first
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
CREATE TYPE account_category AS ENUM (
  'current_asset', 'fixed_asset', 'intangible_asset',
  'current_liability', 'long_term_liability',
  'owner_equity', 'retained_earnings',
  'sales_revenue', 'other_revenue',
  'cost_of_goods_sold', 'operating_expense', 'other_expense'
);
CREATE TYPE journal_entry_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'payment', 'receipt', 'adjustment', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'processed', 'cancelled');

-- Accounting Module Tables
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  category account_category NOT NULL,
  parent_id UUID REFERENCES public.accounts(id),
  balance NUMERIC(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  total_debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  status journal_entry_status DEFAULT 'draft',
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  description TEXT,
  debit_amount NUMERIC(15,2) DEFAULT 0,
  credit_amount NUMERIC(15,2) DEFAULT 0,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type transaction_type NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  source_module TEXT NOT NULL,
  source_id UUID NOT NULL,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  status transaction_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employee Module Types and Tables
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated', 'on-leave', 'probation');
CREATE TYPE document_type AS ENUM ('id-card', 'passport', 'resume', 'certificate', 'contract', 'medical', 'background-check', 'other');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half-day', 'overtime', 'holiday');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'maternity', 'paternity', 'emergency', 'unpaid', 'study', 'other');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE payroll_status AS ENUM ('draft', 'calculated', 'approved', 'paid', 'cancelled');
CREATE TYPE training_type AS ENUM ('orientation', 'skill-development', 'compliance', 'leadership', 'technical', 'soft-skills');
CREATE TYPE training_status AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');
CREATE TYPE participant_status AS ENUM ('enrolled', 'attending', 'completed', 'dropped', 'failed');

CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  budget NUMERIC(15,2) DEFAULT 0,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 1,
  base_salary NUMERIC(12,2) NOT NULL,
  permissions TEXT[],
  requirements TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  hire_date DATE NOT NULL,
  position_id UUID REFERENCES public.positions(id),
  department_id UUID REFERENCES public.departments(id),
  salary NUMERIC(12,2) NOT NULL,
  status employee_status DEFAULT 'active',
  avatar TEXT,
  emergency_contact JSONB,
  bank_account JSONB,
  work_schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL
);

CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date DATE,
  is_required BOOLEAN DEFAULT false
);

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC(4,2) DEFAULT 0,
  overtime_hours NUMERIC(4,2) DEFAULT 0,
  status attendance_status DEFAULT 'present',
  notes TEXT,
  location TEXT,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE TABLE public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(3,1) NOT NULL,
  reason TEXT NOT NULL,
  status leave_status DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  documents TEXT[]
);

CREATE TABLE public.payrolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  base_salary NUMERIC(12,2) NOT NULL,
  overtime NUMERIC(12,2) DEFAULT 0,
  bonus NUMERIC(12,2) DEFAULT 0,
  allowances JSONB DEFAULT '[]',
  deductions JSONB DEFAULT '[]',
  gross_pay NUMERIC(12,2) NOT NULL,
  tax NUMERIC(12,2) DEFAULT 0,
  social_security NUMERIC(12,2) DEFAULT 0,
  net_pay NUMERIC(12,2) NOT NULL,
  status payroll_status DEFAULT 'draft',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, period_year, period_month)
);

CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type training_type NOT NULL,
  duration INTEGER NOT NULL, -- hours
  instructor TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_participants INTEGER DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0,
  materials TEXT[],
  requirements TEXT[],
  status training_status DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.training_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC(5,2),
  certificate TEXT,
  status participant_status DEFAULT 'enrolled',
  feedback TEXT,
  UNIQUE(training_id, employee_id)
);

-- Warehouse Module Types and Tables
CREATE TYPE warehouse_type AS ENUM ('main', 'branch', 'distribution', 'retail', 'temporary');
CREATE TYPE warehouse_status AS ENUM ('active', 'inactive', 'maintenance', 'closed');
CREATE TYPE zone_type AS ENUM ('receiving', 'storage', 'picking', 'packing', 'shipping', 'returns', 'quarantine', 'office');
CREATE TYPE rack_type AS ENUM ('pallet', 'shelf', 'bin', 'floor', 'hanging');
CREATE TYPE location_status AS ENUM ('empty', 'occupied', 'reserved', 'blocked', 'damaged');
CREATE TYPE equipment_type AS ENUM ('forklift', 'conveyor', 'scanner', 'scale', 'printer', 'computer', 'camera', 'sensor');
CREATE TYPE equipment_status AS ENUM ('operational', 'maintenance', 'broken', 'retired');
CREATE TYPE staff_position AS ENUM ('manager', 'supervisor', 'forklift_operator', 'picker', 'packer', 'receiver', 'security', 'maintenance');
CREATE TYPE staff_department AS ENUM ('operations', 'receiving', 'shipping', 'inventory', 'maintenance', 'security', 'administration');
CREATE TYPE staff_shift AS ENUM ('morning', 'afternoon', 'night', 'rotating');
CREATE TYPE transfer_status AS ENUM ('draft', 'pending', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE transfer_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE item_condition AS ENUM ('new', 'used', 'damaged', 'refurbished');
CREATE TYPE document_type_warehouse AS ENUM ('transfer_order', 'packing_list', 'delivery_note', 'receipt', 'invoice', 'photo');
CREATE TYPE task_type AS ENUM ('receiving', 'picking', 'packing', 'shipping', 'counting', 'maintenance', 'cleaning', 'inspection');
CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');

CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type warehouse_type NOT NULL,
  status warehouse_status DEFAULT 'active',
  address JSONB NOT NULL,
  contact JSONB NOT NULL,
  capacity JSONB NOT NULL,
  facilities JSONB NOT NULL,
  operating_hours JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL
);

CREATE TABLE public.warehouse_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type zone_type NOT NULL,
  description TEXT,
  area NUMERIC(10,2) NOT NULL,
  capacity INTEGER NOT NULL,
  current_stock INTEGER DEFAULT 0,
  utilization_percentage NUMERIC(5,2) DEFAULT 0,
  temperature JSONB,
  humidity JSONB,
  restrictions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(warehouse_id, code)
);

CREATE TABLE public.storage_racks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.warehouse_zones(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type rack_type NOT NULL,
  dimensions JSONB NOT NULL,
  levels INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_inspection DATE,
  next_inspection DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rack_id UUID NOT NULL REFERENCES public.storage_racks(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL,
  position INTEGER NOT NULL,
  status location_status DEFAULT 'empty',
  product_id UUID,
  quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  last_movement TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  dimensions JSONB NOT NULL,
  max_weight NUMERIC(10,2) NOT NULL,
  current_weight NUMERIC(10,2) DEFAULT 0,
  notes TEXT
);

CREATE TABLE public.warehouse_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  zone_id UUID REFERENCES public.warehouse_zones(id),
  name TEXT NOT NULL,
  type equipment_type NOT NULL,
  model TEXT,
  serial_number TEXT UNIQUE,
  status equipment_status DEFAULT 'operational',
  last_maintenance DATE,
  next_maintenance DATE,
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.warehouse_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  employee_id UUID REFERENCES public.employees(id),
  name TEXT NOT NULL,
  position staff_position NOT NULL,
  department staff_department NOT NULL,
  shift staff_shift NOT NULL,
  phone TEXT,
  email TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  permissions TEXT[],
  certifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.warehouse_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT NOT NULL UNIQUE,
  from_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status transfer_status DEFAULT 'draft',
  priority transfer_priority DEFAULT 'normal',
  total_items INTEGER DEFAULT 0,
  total_value NUMERIC(15,2) DEFAULT 0,
  requested_date DATE NOT NULL,
  scheduled_date DATE,
  shipped_date DATE,
  delivered_date DATE,
  estimated_delivery DATE,
  carrier JSONB,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  received_by UUID,
  received_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.warehouse_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  requested_quantity INTEGER NOT NULL,
  shipped_quantity INTEGER DEFAULT 0,
  received_quantity INTEGER DEFAULT 0,
  unit_cost NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(12,2) NOT NULL,
  from_location_id UUID REFERENCES public.storage_locations(id),
  to_location_id UUID REFERENCES public.storage_locations(id),
  batch TEXT,
  expiry_date DATE,
  condition item_condition DEFAULT 'new',
  notes TEXT
);

CREATE TABLE public.transfer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.warehouse_transfers(id) ON DELETE CASCADE,
  type document_type_warehouse NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID NOT NULL
);

CREATE TABLE public.warehouse_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  type task_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority DEFAULT 'normal',
  status task_status DEFAULT 'pending',
  assigned_to UUID,
  assigned_by UUID NOT NULL,
  estimated_duration INTEGER, -- minutes
  actual_duration INTEGER,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  related_items JSONB,
  instructions TEXT,
  notes TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
-- Accounting policies (Admin access)
CREATE POLICY "Accounting access for admins" ON public.accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = 'admin')
);

CREATE POLICY "Journal entries admin access" ON public.journal_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = 'admin')
);

CREATE POLICY "Journal entry lines admin access" ON public.journal_entry_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = 'admin')
);

CREATE POLICY "Transactions admin access" ON public.transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = 'admin')
);

-- Employee policies (Admin and HR access)
CREATE POLICY "HR data access" ON public.departments FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'hr'))
);

CREATE POLICY "Positions access" ON public.positions FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'hr'))
);

CREATE POLICY "Employees access" ON public.employees FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'hr'))
);

CREATE POLICY "Employee documents access" ON public.employee_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'hr'))
);

CREATE POLICY "Attendance access" ON public.attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'hr'))
);

CREATE POLICY "Leaves access" ON public.leaves FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'hr'))
);

CREATE POLICY "Payrolls access" ON public.payrolls FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'hr'))
);

CREATE POLICY "Trainings access" ON public.trainings FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid())
);

CREATE POLICY "Training participants access" ON public.training_participants FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid())
);

-- Warehouse policies (Admin and warehouse staff access)
CREATE POLICY "Warehouses access" ON public.warehouses FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Warehouse zones access" ON public.warehouse_zones FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Storage racks access" ON public.storage_racks FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Storage locations access" ON public.storage_locations FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Warehouse equipment access" ON public.warehouse_equipment FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Warehouse staff access" ON public.warehouse_staff FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Warehouse transfers access" ON public.warehouse_transfers FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Transfer items access" ON public.transfer_items FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Transfer documents access" ON public.transfer_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

CREATE POLICY "Warehouse tasks access" ON public.warehouse_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager'))
);

-- Create triggers for updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouse_zones_updated_at BEFORE UPDATE ON public.warehouse_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouse_equipment_updated_at BEFORE UPDATE ON public.warehouse_equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouse_transfers_updated_at BEFORE UPDATE ON public.warehouse_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouse_tasks_updated_at BEFORE UPDATE ON public.warehouse_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();