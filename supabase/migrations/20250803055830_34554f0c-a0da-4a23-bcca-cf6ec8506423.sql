-- First, add new roles to the existing user_role enum
DO $$
BEGIN
    -- Check if we need to add new roles to the existing enum
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hr' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'hr';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'warehouse_manager' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'warehouse_manager';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'accountant' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'accountant';
    END IF;
END $$;

-- Now create RLS policies for new tables that don't have policies yet
DO $$
BEGIN
  -- Accounting policies (Admin access only)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Accounting access for admins') THEN
    EXECUTE 'CREATE POLICY "Accounting access for admins" ON public.accounts FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = ''admin''::user_role)
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Journal entries admin access') THEN
    EXECUTE 'CREATE POLICY "Journal entries admin access" ON public.journal_entries FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = ''admin''::user_role)
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entry_lines' AND policyname = 'Journal entry lines admin access') THEN
    EXECUTE 'CREATE POLICY "Journal entry lines admin access" ON public.journal_entry_lines FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role = ''admin''::user_role)
    )';
  END IF;

  -- Employee policies (Admin and HR access)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'HR data access') THEN
    EXECUTE 'CREATE POLICY "HR data access" ON public.departments FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin''::user_role, ''hr''::user_role))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'positions' AND policyname = 'Positions access') THEN
    EXECUTE 'CREATE POLICY "Positions access" ON public.positions FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin''::user_role, ''hr''::user_role))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Employees access') THEN
    EXECUTE 'CREATE POLICY "Employees access" ON public.employees FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin''::user_role, ''hr''::user_role))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_documents' AND policyname = 'Employee documents access') THEN
    EXECUTE 'CREATE POLICY "Employee documents access" ON public.employee_documents FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin''::user_role, ''hr''::user_role))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Attendance access') THEN
    EXECUTE 'CREATE POLICY "Attendance access" ON public.attendance FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin''::user_role, ''hr''::user_role))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaves' AND policyname = 'Leaves access') THEN
    EXECUTE 'CREATE POLICY "Leaves access" ON public.leaves FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin''::user_role, ''hr''::user_role))
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payrolls' AND policyname = 'Payrolls access') THEN
    EXECUTE 'CREATE POLICY "Payrolls access" ON public.payrolls FOR ALL USING (
      EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN (''admin''::user_role, ''hr''::user_role))
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

-- Create triggers for updated_at columns on new tables
DO $$
BEGIN
  -- Only create triggers if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_accounts_updated_at' AND table_name = 'accounts') THEN
    CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_journal_entries_updated_at' AND table_name = 'journal_entries') THEN
    CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_departments_updated_at' AND table_name = 'departments') THEN
    CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_positions_updated_at' AND table_name = 'positions') THEN
    CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_employees_updated_at' AND table_name = 'employees') THEN
    CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_trainings_updated_at' AND table_name = 'trainings') THEN
    CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;