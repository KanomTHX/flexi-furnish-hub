-- Add commission_rate to employees table
ALTER TABLE public.employees 
ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Add branch_id to employees table (if not exists)
ALTER TABLE public.employees 
ADD COLUMN branch_id UUID REFERENCES public.branches(id);

-- Update positions table to support commission settings
ALTER TABLE public.positions 
ADD COLUMN has_commission BOOLEAN DEFAULT false,
ADD COLUMN default_commission_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (default_commission_rate >= 0 AND default_commission_rate <= 100);

-- Create commissions table
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('pos', 'installment', 'manual')),
    transaction_id UUID NOT NULL, -- References pos_sales.id or installment_contracts.id
    sale_amount DECIMAL(15,2) NOT NULL CHECK (sale_amount >= 0),
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    commission_amount DECIMAL(15,2) NOT NULL CHECK (commission_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'paid', 'cancelled')),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    branch_id UUID REFERENCES public.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create attendance_records table (enhanced version)
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    total_hours DECIMAL(4,2),
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one record per employee per date
    UNIQUE(employee_id, date)
);

-- Create leave_requests table (enhanced version)
CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sick', 'personal', 'vacation', 'annual', 'maternity', 'paternity', 'emergency', 'unpaid', 'study', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL CHECK (days > 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejected_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure end_date is after start_date
    CHECK (end_date >= start_date)
);

-- Create predefined_positions table (reference data)
CREATE TABLE public.predefined_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE CHECK (name IN ('manager', 'sales', 'stock', 'accounting', 'credit_officer', 'cash_collector')),
    display_name TEXT NOT NULL,
    description TEXT,
    has_commission BOOLEAN NOT NULL DEFAULT false,
    default_commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (default_commission_rate >= 0 AND default_commission_rate <= 100),
    responsibilities TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert predefined positions
INSERT INTO public.predefined_positions (name, display_name, description, has_commission, default_commission_rate, responsibilities) VALUES
('manager', 'ผู้จัดการ', 'ดูแลภาพรวม มีค่าคอมมิชชั่น', true, 1.00, ARRAY['ดูแลทีม', 'วางแผนการขาย', 'ติดตามผลงาน']),
('sales', 'ฝ่ายขาย', 'ได้ค่าคอมมิชชั่นจากการขาย POS / เช่าซื้อ', true, 2.00, ARRAY['ขายสินค้า', 'ดูแลลูกค้า', 'ปิดการขาย']),
('stock', 'ฝ่ายสต็อก', 'จัดการสินค้า ไม่มีค่าคอมมิชชั่น', false, 0.00, ARRAY['จัดการสต็อก', 'ตรวจนับสินค้า', 'จัดส่งสินค้า']),
('accounting', 'ฝ่ายบัญชี', 'ทำบัญชี/วางบิล ไม่มีค่าคอมมิชชั่น', false, 0.00, ARRAY['ทำบัญชี', 'วางบิล', 'จัดการการเงิน']),
('credit_officer', 'ฝ่ายเจ้าหน้าที่เครดิต', 'ดูแลลูกค้าเครดิต/เช่าซื้อ มีค่าคอม', true, 1.50, ARRAY['ประเมินเครดิต', 'ดูแลลูกค้าเช่าซื้อ', 'ติดตามหนี้']),
('cash_collector', 'ฝ่ายเก็บเงิน', 'รับชำระหนี้ลูกค้า มีค่าคอม', true, 0.50, ARRAY['เก็บเงิน', 'ติดตามหนี้', 'รับชำระ']);

-- Create indexes for better performance
CREATE INDEX idx_commissions_employee_id ON public.commissions(employee_id);
CREATE INDEX idx_commissions_transaction_type ON public.commissions(transaction_type);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_calculated_at ON public.commissions(calculated_at);
CREATE INDEX idx_commissions_branch_id ON public.commissions(branch_id);

CREATE INDEX idx_attendance_records_employee_id ON public.attendance_records(employee_id);
CREATE INDEX idx_attendance_records_date ON public.attendance_records(date);
CREATE INDEX idx_attendance_records_status ON public.attendance_records(status);

CREATE INDEX idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predefined_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view commissions" ON public.commissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert commissions" ON public.commissions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update commissions" ON public.commissions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view attendance records" ON public.attendance_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert attendance records" ON public.attendance_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update attendance records" ON public.attendance_records
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view leave requests" ON public.leave_requests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert leave requests" ON public.leave_requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update leave requests" ON public.leave_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view predefined positions" ON public.predefined_positions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predefined_positions_updated_at BEFORE UPDATE ON public.predefined_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    p_employee_id UUID,
    p_transaction_type TEXT,
    p_transaction_id UUID,
    p_sale_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
    v_commission_rate DECIMAL;
    v_commission_amount DECIMAL;
    v_commission_id UUID;
BEGIN
    -- Get employee commission rate
    SELECT commission_rate INTO v_commission_rate
    FROM public.employees
    WHERE id = p_employee_id;
    
    -- Calculate commission amount
    v_commission_amount := p_sale_amount * (v_commission_rate / 100);
    
    -- Insert commission record
    INSERT INTO public.commissions (
        employee_id,
        transaction_type,
        transaction_id,
        sale_amount,
        commission_rate,
        commission_amount,
        status
    ) VALUES (
        p_employee_id,
        p_transaction_type,
        p_transaction_id,
        p_sale_amount,
        v_commission_rate,
        v_commission_amount,
        'calculated'
    ) RETURNING id INTO v_commission_id;
    
    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.commissions IS 'ตารางเก็บข้อมูลค่าคอมมิชชั่นของพนักงาน';
COMMENT ON TABLE public.attendance_records IS 'ตารางเก็บข้อมูลการเข้างานของพนักงาน';
COMMENT ON TABLE public.leave_requests IS 'ตารางเก็บข้อมูลการลาของพนักงาน';
COMMENT ON TABLE public.predefined_positions IS 'ตารางเก็บข้อมูลตำแหน่งงานที่กำหนดไว้';
COMMENT ON FUNCTION calculate_commission IS 'ฟังก์ชันคำนวณค่าคอมมิชชั่นอัตโนมัติ';