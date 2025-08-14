# PowerShell script to run reconciliation system migration

Write-Host "Running Reconciliation System Migration..." -ForegroundColor Green

# Read the SQL file content
$sqlContent = Get-Content -Path "supabase/migrations/20241214000004_reconciliation_system.sql" -Raw

Write-Host "SQL Migration Content:" -ForegroundColor Yellow
Write-Host $sqlContent

Write-Host "`nMigration file ready to execute." -ForegroundColor Green
Write-Host "Please run this SQL content in your Supabase SQL Editor or database client." -ForegroundColor Cyan

# Also create a simplified version for manual execution
$simplifiedSql = @"
-- Reconciliation System Tables Migration
-- Run this in your Supabase SQL Editor

-- Create reconciliation_reports table
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

-- Create reconciliation_items table
CREATE TABLE IF NOT EXISTS reconciliation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID NOT NULL REFERENCES reconciliation_reports(id) ON DELETE CASCADE,
    transaction_id UUID,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('outstanding_check', 'deposit_in_transit', 'bank_charge', 'interest_earned', 'error_correction')),
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    reconciled_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reconciliation_adjustments table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_account_id ON reconciliation_reports(account_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_status ON reconciliation_reports(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_items_reconciliation_id ON reconciliation_items(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_adjustments_reconciliation_id ON reconciliation_adjustments(reconciliation_id);

-- Enable RLS
ALTER TABLE reconciliation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_adjustments ENABLE ROW LEVEL SECURITY;

-- Create basic policies (adjust as needed for your auth setup)
CREATE POLICY "Enable all operations for authenticated users" ON reconciliation_reports FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON reconciliation_items FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON reconciliation_adjustments FOR ALL USING (true);
"@

# Save simplified SQL to a file
$simplifiedSql | Out-File -FilePath "reconciliation_migration_simple.sql" -Encoding UTF8

Write-Host "`nSimplified migration saved to: reconciliation_migration_simple.sql" -ForegroundColor Green
Write-Host "You can copy and paste this content into your Supabase SQL Editor." -ForegroundColor Cyan