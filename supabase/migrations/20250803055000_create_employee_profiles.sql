-- Create employee_profiles table for authentication and role management
-- This table is required for RLS policies

CREATE TABLE IF NOT EXISTS public.employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'warehouse_manager', 'warehouse_staff', 'sales', 'accountant', 'employee')),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    department TEXT,
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_profiles
CREATE POLICY "Users can view own profile" 
ON public.employee_profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.employee_profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles" 
ON public.employee_profiles 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.employee_profiles ep 
        WHERE ep.user_id = auth.uid() 
        AND ep.role = 'admin'
    )
);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_profiles_updated_at
BEFORE UPDATE ON public.employee_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_employee_profiles_user_id ON public.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_role ON public.employee_profiles(role);
CREATE INDEX idx_employee_profiles_employee_id ON public.employee_profiles(employee_id);
CREATE INDEX idx_employee_profiles_active ON public.employee_profiles(is_active);

-- Insert a default admin user (you can modify this as needed)
-- Note: This assumes you have a user in auth.users table
-- You may need to adjust this based on your authentication setup
INSERT INTO public.employee_profiles (user_id, role, first_name, last_name, email, department, position)
SELECT 
    id,
    'admin',
    'System',
    'Administrator',
    email,
    'IT',
    'System Administrator'
FROM auth.users 
WHERE email LIKE '%admin%' OR email LIKE '%system%'
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.employee_profiles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;