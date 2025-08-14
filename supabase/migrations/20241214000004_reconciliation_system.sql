-- Create reconciliation system tables

-- Reconciliation Reports table
CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number VARCHAR(50) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    book_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    statement_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    reconciled_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    variance DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'reviewed')),
    reconciled_by UUID,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reconciliation Items table
CREATE TABLE IF NOT EXISTS reconciliation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID NOT NULL REFERENCES reconciliation_reports(id) ON DELETE CASCADE,
    transaction_id UUID, -- Optional reference to a specific transaction
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('outstanding_check', 'deposit_in_transit', 'bank_charge', 'interest_earned', 'error_correction')),
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    reconciled_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reconciliation Adjustments table
CREATE TABLE IF NOT EXISTS reconciliation_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID NOT NULL REFERENCES reconciliation_reports(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_account_id ON reconciliation_reports(account_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_status ON reconciliation_reports(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_period ON reconciliation_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_created_at ON reconciliation_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_reconciliation_items_reconciliation_id ON reconciliation_items(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_items_type ON reconciliation_items(type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_items_is_reconciled ON reconciliation_items(is_reconciled);

CREATE INDEX IF NOT EXISTS idx_reconciliation_adjustments_reconciliation_id ON reconciliation_adjustments(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_adjustments_journal_entry_id ON reconciliation_adjustments(journal_entry_id);

-- Create function to generate reconciliation report numbers
CREATE OR REPLACE FUNCTION generate_reconciliation_report_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    report_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    
    -- Get the next number for this year
    SELECT COALESCE(MAX(
        CASE 
            WHEN report_number ~ ('^RECON-' || current_year || '-[0-9]+$')
            THEN CAST(SUBSTRING(report_number FROM '[0-9]+$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO next_number
    FROM reconciliation_reports
    WHERE report_number LIKE 'RECON-' || current_year || '-%';
    
    report_number := 'RECON-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN report_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to update reconciled balance automatically
CREATE OR REPLACE FUNCTION update_reconciled_balance()
RETURNS TRIGGER AS $$
DECLARE
    recon_id UUID;
    book_bal DECIMAL(12,2);
    stmt_bal DECIMAL(12,2);
    new_reconciled_bal DECIMAL(12,2);
    new_variance DECIMAL(12,2);
    item_adjustment DECIMAL(12,2);
    adj_adjustment DECIMAL(12,2);
BEGIN
    -- Get reconciliation ID based on the table being updated
    IF TG_TABLE_NAME = 'reconciliation_items' THEN
        recon_id := COALESCE(NEW.reconciliation_id, OLD.reconciliation_id);
    ELSIF TG_TABLE_NAME = 'reconciliation_adjustments' THEN
        recon_id := COALESCE(NEW.reconciliation_id, OLD.reconciliation_id);
    END IF;
    
    -- Get current book and statement balances
    SELECT book_balance, statement_balance
    INTO book_bal, stmt_bal
    FROM reconciliation_reports
    WHERE id = recon_id;
    
    -- Calculate adjustment from reconciliation items
    SELECT COALESCE(SUM(
        CASE 
            WHEN is_reconciled AND type IN ('outstanding_check', 'bank_charge') THEN -amount
            WHEN is_reconciled THEN amount
            ELSE 0
        END
    ), 0)
    INTO item_adjustment
    FROM reconciliation_items
    WHERE reconciliation_id = recon_id;
    
    -- Calculate adjustment from manual adjustments
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'debit' THEN amount
            ELSE -amount
        END
    ), 0)
    INTO adj_adjustment
    FROM reconciliation_adjustments
    WHERE reconciliation_id = recon_id;
    
    -- Calculate new reconciled balance and variance
    new_reconciled_bal := book_bal + item_adjustment + adj_adjustment;
    new_variance := ABS(new_reconciled_bal - stmt_bal);
    
    -- Update the reconciliation report
    UPDATE reconciliation_reports
    SET 
        reconciled_balance = new_reconciled_bal,
        variance = new_variance,
        updated_at = NOW()
    WHERE id = recon_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update reconciled balance
CREATE TRIGGER trigger_update_reconciled_balance_items
    AFTER INSERT OR UPDATE OR DELETE ON reconciliation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_reconciled_balance();

CREATE TRIGGER trigger_update_reconciled_balance_adjustments
    AFTER INSERT OR UPDATE OR DELETE ON reconciliation_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION update_reconciled_balance();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reconciliation_reports_updated_at
    BEFORE UPDATE ON reconciliation_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reconciliation_items_updated_at
    BEFORE UPDATE ON reconciliation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for reconciliation tables
ALTER TABLE reconciliation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_adjustments ENABLE ROW LEVEL SECURITY;

-- Policies for reconciliation_reports
CREATE POLICY "Users can view reconciliation reports" ON reconciliation_reports
    FOR SELECT USING (true);

CREATE POLICY "Users can create reconciliation reports" ON reconciliation_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update reconciliation reports" ON reconciliation_reports
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete reconciliation reports" ON reconciliation_reports
    FOR DELETE USING (true);

-- Policies for reconciliation_items
CREATE POLICY "Users can view reconciliation items" ON reconciliation_items
    FOR SELECT USING (true);

CREATE POLICY "Users can create reconciliation items" ON reconciliation_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update reconciliation items" ON reconciliation_items
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete reconciliation items" ON reconciliation_items
    FOR DELETE USING (true);

-- Policies for reconciliation_adjustments
CREATE POLICY "Users can view reconciliation adjustments" ON reconciliation_adjustments
    FOR SELECT USING (true);

CREATE POLICY "Users can create reconciliation adjustments" ON reconciliation_adjustments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update reconciliation adjustments" ON reconciliation_adjustments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete reconciliation adjustments" ON reconciliation_adjustments
    FOR DELETE USING (true);

-- Insert sample data for testing
INSERT INTO reconciliation_reports (
    report_number,
    period_start,
    period_end,
    account_id,
    book_balance,
    statement_balance,
    reconciled_balance,
    variance,
    status,
    notes,
    created_by
) VALUES (
    'RECON-2024-0001',
    '2024-01-01',
    '2024-01-31',
    (SELECT id FROM chart_of_accounts WHERE account_code = 'CASH' LIMIT 1),
    15000.00,
    14850.00,
    15000.00,
    150.00,
    'draft',
    'January 2024 cash reconciliation',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (report_number) DO NOTHING;

-- Add some sample reconciliation items
INSERT INTO reconciliation_items (
    reconciliation_id,
    description,
    amount,
    type,
    is_reconciled,
    notes
) VALUES (
    (SELECT id FROM reconciliation_reports WHERE report_number = 'RECON-2024-0001'),
    'Outstanding check #1001',
    150.00,
    'outstanding_check',
    false,
    'Check issued but not yet cleared'
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE reconciliation_reports IS 'Stores reconciliation reports for account balance matching';
COMMENT ON TABLE reconciliation_items IS 'Stores individual reconciliation items like outstanding checks and deposits in transit';
COMMENT ON TABLE reconciliation_adjustments IS 'Stores manual adjustments made during reconciliation process';

COMMENT ON COLUMN reconciliation_reports.report_number IS 'Unique report number in format RECON-YYYY-NNNN';
COMMENT ON COLUMN reconciliation_reports.book_balance IS 'Balance from our accounting records';
COMMENT ON COLUMN reconciliation_reports.statement_balance IS 'Balance from external statement (bank, supplier, etc.)';
COMMENT ON COLUMN reconciliation_reports.reconciled_balance IS 'Calculated balance after applying reconciliation items and adjustments';
COMMENT ON COLUMN reconciliation_reports.variance IS 'Absolute difference between reconciled balance and statement balance';

COMMENT ON COLUMN reconciliation_items.type IS 'Type of reconciliation item: outstanding_check, deposit_in_transit, bank_charge, interest_earned, error_correction';
COMMENT ON COLUMN reconciliation_items.is_reconciled IS 'Whether this item has been reconciled/cleared';

COMMENT ON COLUMN reconciliation_adjustments.type IS 'Whether this adjustment is a debit or credit';
COMMENT ON COLUMN reconciliation_adjustments.journal_entry_id IS 'Reference to the journal entry created for this adjustment';