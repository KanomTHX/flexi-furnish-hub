-- Create new custom types (avoiding existing ones)
CREATE TYPE IF NOT EXISTS account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
CREATE TYPE IF NOT EXISTS account_category AS ENUM (
  'current_asset', 'fixed_asset', 'intangible_asset',
  'current_liability', 'long_term_liability',
  'owner_equity', 'retained_earnings',
  'sales_revenue', 'other_revenue',
  'cost_of_goods_sold', 'operating_expense', 'other_expense'
);
CREATE TYPE IF NOT EXISTS journal_entry_status AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- Accounting Module Tables
CREATE TABLE IF NOT EXISTS public.accounts (
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

CREATE TABLE IF NOT EXISTS public.journal_entries (
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

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  description TEXT,
  debit_amount NUMERIC(15,2) DEFAULT 0,
  credit_amount NUMERIC(15,2) DEFAULT 0,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employee Module Types and Tables
CREATE TYPE IF NOT EXISTS employee_status AS ENUM ('active', 'inactive', 'terminated', 'on-leave', 'probation');
CREATE TYPE IF NOT EXISTS document_type AS ENUM ('id-card', 'passport', 'resume', 'certificate', 'contract', 'medical', 'background-check', 'other');
CREATE TYPE IF NOT EXISTS attendance_status AS ENUM ('present', 'absent', 'late', 'half-day', 'overtime', 'holiday');
CREATE TYPE IF NOT EXISTS leave_type AS ENUM ('annual', 'sick', 'maternity', 'paternity', 'emergency', 'unpaid', 'study', 'other');
CREATE TYPE IF NOT EXISTS leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE IF NOT EXISTS payroll_status AS ENUM ('draft', 'calculated', 'approved', 'paid', 'cancelled');
CREATE TYPE IF NOT EXISTS training_type AS ENUM ('orientation', 'skill-development', 'compliance', 'leadership', 'technical', 'soft-skills');
CREATE TYPE IF NOT EXISTS training_status AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');
CREATE TYPE IF NOT EXISTS participant_status AS ENUM ('enrolled', 'attending', 'completed', 'dropped', 'failed');

CREATE TABLE IF NOT EXISTS public.departments (
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

CREATE TABLE IF NOT EXISTS public.positions (
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

CREATE TABLE IF NOT EXISTS public.employees (
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

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date DATE,
  is_required BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.attendance (
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

CREATE TABLE IF NOT EXISTS public.leaves (
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

CREATE TABLE IF NOT EXISTS public.payrolls (
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

CREATE TABLE IF NOT EXISTS public.trainings (
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

CREATE TABLE IF NOT EXISTS public.training_participants (
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

-- Enable RLS on new tables
DO $$
BEGIN
  -- Accounting tables
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'accounts') THEN
    ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
    ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'journal_entry_lines') THEN
    ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Employee tables
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments') THEN
    ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'positions') THEN
    ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employee_documents') THEN
    ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance') THEN
    ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leaves') THEN
    ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payrolls') THEN
    ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trainings') THEN
    ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_participants') THEN
    ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for new tables (avoiding conflicts)
DO $$
BEGIN
  -- Accounting policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Accounting access for admins') THEN
    EXECUTE 'CREATE POLICY "Accounting access for admins" ON public.accounts FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = ''admin'')
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Journal entries admin access') THEN
    EXECUTE 'CREATE POLICY "Journal entries admin access" ON public.journal_entries FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = ''admin'')
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entry_lines' AND policyname = 'Journal entry lines admin access') THEN
    EXECUTE 'CREATE POLICY "Journal entry lines admin access" ON public.journal_entry_lines FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = ''admin'')
    )';
  END IF;

  -- Employee policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'HR data access') THEN
    EXECUTE 'CREATE POLICY "HR data access" ON public.departments FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin'', ''hr''))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'positions' AND policyname = 'Positions access') THEN
    EXECUTE 'CREATE POLICY "Positions access" ON public.positions FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin'', ''hr''))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Employees access') THEN
    EXECUTE 'CREATE POLICY "Employees access" ON public.employees FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin'', ''hr''))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_documents' AND policyname = 'Employee documents access') THEN
    EXECUTE 'CREATE POLICY "Employee documents access" ON public.employee_documents FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin'', ''hr''))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Attendance access') THEN
    EXECUTE 'CREATE POLICY "Attendance access" ON public.attendance FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin'', ''hr''))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaves' AND policyname = 'Leaves access') THEN
    EXECUTE 'CREATE POLICY "Leaves access" ON public.leaves FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin'', ''hr''))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payrolls' AND policyname = 'Payrolls access') THEN
    EXECUTE 'CREATE POLICY "Payrolls access" ON public.payrolls FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin'', ''hr''))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trainings' AND policyname = 'Trainings access') THEN
    EXECUTE 'CREATE POLICY "Trainings access" ON public.trainings FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid())
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_participants' AND policyname = 'Training participants access') THEN
    EXECUTE 'CREATE POLICY "Training participants access" ON public.training_participants FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid())
    )';
  END IF;
END $$;

-- Create triggers for updated_at (avoiding conflicts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_accounts_updated_at') THEN
    CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_journal_entries_updated_at') THEN
    CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_departments_updated_at') THEN
    CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_positions_updated_at') THEN
    CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_employees_updated_at') THEN
    CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_trainings_updated_at') THEN
    CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;