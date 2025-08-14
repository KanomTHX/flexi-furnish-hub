# Check available accounts and insert sample data

param(
    [string]$ProjectRef = "hartshwcchbsnmbrjdyn",
    [string]$Password = "Toolgodsa38"
)

Write-Host "Checking Available Accounts" -ForegroundColor Cyan

$DbHost = "aws-0-ap-southeast-1.pooler.supabase.com"
$DbPort = "6543"
$Database = "postgres"
$Username = "postgres.$ProjectRef"

$env:PGPASSWORD = $Password

# Check available accounts
$checkAccountsSQL = @'
SELECT id, account_code, account_name, account_type 
FROM chart_of_accounts 
WHERE is_active = true 
ORDER BY account_code 
LIMIT 10;
'@

$checkAccountsSQL | Out-File -FilePath "temp_check_accounts.sql" -Encoding UTF8

Write-Host "Available accounts:" -ForegroundColor Yellow

try {
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f "temp_check_accounts.sql" 2>&1
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "Account check failed: $_" -ForegroundColor Red
}

# Insert sample data with first available account
$insertWithFirstAccountSQL = @'
-- Insert sample reconciliation report using first available account
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
    (SELECT id FROM chart_of_accounts WHERE is_active = true LIMIT 1),
    15000.00,
    14850.00,
    15000.00,
    150.00,
    'draft',
    'January 2024 reconciliation - Sample Data',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (report_number) DO UPDATE SET
    notes = EXCLUDED.notes || ' (Updated)';

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
);
'@

$insertWithFirstAccountSQL | Out-File -FilePath "temp_insert_fixed.sql" -Encoding UTF8

Write-Host "`nInserting sample data with first available account..." -ForegroundColor Yellow

try {
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f "temp_insert_fixed.sql" 2>&1
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "Insert failed: $_" -ForegroundColor Red
}

# Verify final data
$verifyFinalSQL = @'
SELECT 
    r.report_number,
    a.account_code,
    a.account_name,
    r.book_balance,
    r.statement_balance,
    r.variance,
    r.status
FROM reconciliation_reports r
JOIN chart_of_accounts a ON r.account_id = a.id;

SELECT 
    'Total Reports' as metric,
    COUNT(*) as count
FROM reconciliation_reports
UNION ALL
SELECT 
    'Total Items' as metric,
    COUNT(*) as count
FROM reconciliation_items;
'@

$verifyFinalSQL | Out-File -FilePath "temp_verify_final.sql" -Encoding UTF8

Write-Host "`nFinal verification:" -ForegroundColor Yellow

try {
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f "temp_verify_final.sql" 2>&1
    Write-Host $result -ForegroundColor Green
} catch {
    Write-Host "Final verification failed: $_" -ForegroundColor Red
}

# Clean up
Remove-Item "temp_check_accounts.sql" -ErrorAction SilentlyContinue
Remove-Item "temp_insert_fixed.sql" -ErrorAction SilentlyContinue
Remove-Item "temp_verify_final.sql" -ErrorAction SilentlyContinue
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "`nReconciliation system setup and verification complete!" -ForegroundColor Green