-- Fix infinite recursion in employee_profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON public.employee_profiles;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.employee_profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate policies using security definer functions
CREATE POLICY "Admins can view all profiles" 
ON public.employee_profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update profiles" 
ON public.employee_profiles 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can create profiles" 
ON public.employee_profiles 
FOR INSERT 
WITH CHECK (public.is_admin());