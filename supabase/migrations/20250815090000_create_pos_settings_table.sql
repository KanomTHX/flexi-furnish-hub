-- POS Settings Migration
-- Created: 2025-08-15
-- Purpose: Create pos_settings table for storing POS system configuration

-- ========================================
-- POS SETTINGS TABLE
-- ========================================

-- Create pos_settings table
CREATE TABLE public.pos_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id),
  store_name TEXT NOT NULL DEFAULT 'Flexi Furnish Hub',
  store_address TEXT,
  store_phone TEXT,
  store_tax_id TEXT,
  store_email TEXT,
  store_website TEXT,
  currency_code TEXT DEFAULT 'THB',
  currency_symbol TEXT DEFAULT '฿',
  tax_rate NUMERIC(5,2) DEFAULT 7.00,
  receipt_header TEXT,
  receipt_footer TEXT,
  receipt_logo_url TEXT,
  auto_print_receipt BOOLEAN DEFAULT false,
  receipt_copies INTEGER DEFAULT 1,
  enable_discount BOOLEAN DEFAULT true,
  max_discount_percent NUMERIC(5,2) DEFAULT 100.00,
  enable_tax BOOLEAN DEFAULT true,
  price_includes_tax BOOLEAN DEFAULT false,
  round_total BOOLEAN DEFAULT true,
  round_method TEXT DEFAULT 'nearest', -- 'up', 'down', 'nearest'
  default_payment_method TEXT DEFAULT 'cash',
  enable_customer_display BOOLEAN DEFAULT false,
  enable_barcode_scanner BOOLEAN DEFAULT false,
  enable_cash_drawer BOOLEAN DEFAULT false,
  backup_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  last_backup_at TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'Asia/Bangkok',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  time_format TEXT DEFAULT '24h',
  language TEXT DEFAULT 'th',
  theme TEXT DEFAULT 'light',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT pos_settings_tax_rate_check CHECK (tax_rate >= 0 AND tax_rate <= 100),
  CONSTRAINT pos_settings_max_discount_check CHECK (max_discount_percent >= 0 AND max_discount_percent <= 100),
  CONSTRAINT pos_settings_receipt_copies_check CHECK (receipt_copies > 0),
  CONSTRAINT pos_settings_round_method_check CHECK (round_method IN ('up', 'down', 'nearest'))
);

-- Create indexes for better performance
CREATE INDEX idx_pos_settings_branch_id ON public.pos_settings(branch_id);
CREATE INDEX idx_pos_settings_created_by ON public.pos_settings(created_by);

-- Enable RLS (Row Level Security)
ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view pos_settings for their branch" ON public.pos_settings
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM public.employee_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pos_settings for their branch" ON public.pos_settings
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM public.employee_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pos_settings for their branch" ON public.pos_settings
  FOR UPDATE USING (
    branch_id IN (
      SELECT branch_id FROM public.employee_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_pos_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pos_settings_updated_at
  BEFORE UPDATE ON public.pos_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pos_settings_updated_at();

-- Insert default settings for existing branches
INSERT INTO public.pos_settings (
  branch_id,
  store_name,
  created_by
)
SELECT 
  b.id as branch_id,
  'Flexi Furnish Hub' as store_name,
  COALESCE(b.admin_user_id, '00000000-0000-0000-0000-000000000000'::uuid) as created_by
FROM public.branches b
WHERE NOT EXISTS (
  SELECT 1 FROM public.pos_settings ps 
  WHERE ps.branch_id = b.id
);

-- Add comments
COMMENT ON TABLE public.pos_settings IS 'POS system configuration settings for each branch';
COMMENT ON COLUMN public.pos_settings.store_name IS 'Display name of the store';
COMMENT ON COLUMN public.pos_settings.tax_rate IS 'Default tax rate percentage (0-100)';
COMMENT ON COLUMN public.pos_settings.round_method IS 'Method for rounding totals: up, down, or nearest';
COMMENT ON COLUMN public.pos_settings.backup_frequency IS 'How often to backup data: hourly, daily, weekly';