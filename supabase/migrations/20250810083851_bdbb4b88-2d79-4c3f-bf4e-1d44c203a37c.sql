-- Create system_settings table to persist application settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to fully manage settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role full access to system settings"
ON public.system_settings
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Auto update updated_at on changes
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index for latest settings lookup
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON public.system_settings(updated_at);
