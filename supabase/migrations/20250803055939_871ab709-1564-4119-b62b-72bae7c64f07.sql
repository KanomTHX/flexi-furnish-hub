-- Second migration: Create RLS policies for new tables (after enum commit)
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