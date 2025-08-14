# PowerShell script to insert sample reconciliation data

param(
    [string]$ProjectRef = "hartshwcchbsnmbrjdyn",
    [string]$Password = "Toolgodsa38"
)

Write-Host "Inserting Sample Reconciliation Data" -ForegroundColor Cyan

# Supabase connection details
$DbHost = "aws-0-ap-southeast-1.pooler.supabase.com"
$DbPort = "6543"
$Database = "postgres"
$Username = "postgres.$ProjectRef"

$env:PGPASSWORD = $Password

# Sample data SQL
$sampleSQL = @'
-- Insert sample reconciliation report
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
    'January 2024 cash reconciliation - Sample Data',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (report_number) DO NOTHING;

-- Insert sample reconciliation item
INSERT INTO reconciliation_items (
    reconciliation_id,
    description,
    amount,
    type,
    is_reconciled,
    notes
) VALUES (
    (SELECT id FROM reconciliation_reports WHERE report_number = 'RECON-2024-0001'),
    'Outstanding check #1001 - Sample',
    150.00,
    'outstanding_check',
    false,
    'Check issued but not yet cleared - Sample Data'
) ON CONFLICT DO NOTHING;
'@

$sampleSQL | Out-File -FilePath "temp_sample_insert.sql" -Encoding UTF8

Write-Host "Inserting sample data..." -ForegroundColor Yellow

try {
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f "temp_sample_insert.sql" 2>&1
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "Sample data insertion failed: $_" -ForegroundColor Red
}

Write-Host "`nVerifying inserted data..." -ForegroundColor Yellow

$verifySQL = @'
SELECT 
    report_number,
    period_start,
    period_end,
    book_balance,
    statement_balance,
    variance,
    status,
    notes
FROM reconciliation_reports;

SELECT 
    r.report_number,
    i.description,
    i.amount,
    i.type,
    i.is_reconciled
FROM reconciliation_items i
JOIN reconciliation_reports r ON i.reconciliation_id = r.id;
'@

$verifySQL | Out-File -FilePath "temp_verify.sql" -Encoding UTF8

try {
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f "temp_verify.sql" 2>&1
    Write-Host $result -ForegroundColor Green
} catch {
    Write-Host "Verification failed: $_" -ForegroundColor Red
}

# Clean up
Remove-Item "temp_sample_insert.sql" -ErrorAction SilentlyContinue
Remove-Item "temp_verify.sql" -ErrorAction SilentlyContinue
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "`nSample data insertion complete!" -ForegroundColor Green