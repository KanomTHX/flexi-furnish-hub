# PowerShell script to run reconciliation migration

param(
    [string]$ProjectRef = "hartshwcchbsnmbrjdyn",
    [string]$Password = "Toolgodsa38"
)

Write-Host "Running Reconciliation Migration to Supabase" -ForegroundColor Cyan
Write-Host "Project Reference: $ProjectRef" -ForegroundColor Yellow

# Supabase connection details
$DbHost = "aws-0-ap-southeast-1.pooler.supabase.com"
$DbPort = "6543"
$Database = "postgres"
$Username = "postgres.$ProjectRef"

Write-Host "`nStep 1: Testing Connection" -ForegroundColor Yellow
$env:PGPASSWORD = $Password

# Test connection first
try {
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Connection successful!" -ForegroundColor Green
    } else {
        Write-Host "Connection failed: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Connection error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Running Migration" -ForegroundColor Yellow

# Read and execute the migration
$migrationFile = "reconciliation_migration_simple.sql"
if (Test-Path $migrationFile) {
    Write-Host "Executing migration from: $migrationFile" -ForegroundColor Gray
    
    try {
        $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f $migrationFile 2>&1
        Write-Host "Migration executed!" -ForegroundColor Green
        if ($result -match "ERROR") {
            Write-Host "Migration errors:" -ForegroundColor Yellow
            Write-Host $result -ForegroundColor Red
        }
    } catch {
        Write-Host "Migration failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Verifying Tables" -ForegroundColor Yellow

# Save check query to temp file
$checkSQL = @'
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_name IN ('reconciliation_reports', 'reconciliation_items', 'reconciliation_adjustments')
ORDER BY table_name;
'@

$checkSQL | Out-File -FilePath "temp_check.sql" -Encoding UTF8

try {
    Write-Host "Checking table existence..." -ForegroundColor Gray
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f "temp_check.sql" 2>&1
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "Table check failed: $_" -ForegroundColor Red
}

Write-Host "`nStep 4: Checking Record Counts" -ForegroundColor Yellow

$countSQL = @'
SELECT 'reconciliation_reports' as table_name, COUNT(*) as record_count FROM reconciliation_reports
UNION ALL
SELECT 'reconciliation_items' as table_name, COUNT(*) as record_count FROM reconciliation_items
UNION ALL
SELECT 'reconciliation_adjustments' as table_name, COUNT(*) as record_count FROM reconciliation_adjustments;
'@

$countSQL | Out-File -FilePath "temp_count.sql" -Encoding UTF8

try {
    Write-Host "Checking record counts..." -ForegroundColor Gray
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f "temp_count.sql" 2>&1
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "Count check failed: $_" -ForegroundColor Red
}

Write-Host "`nStep 5: Sample Data Check" -ForegroundColor Yellow

$sampleSQL = @'
SELECT report_number, status, book_balance, statement_balance, variance 
FROM reconciliation_reports 
LIMIT 3;
'@

$sampleSQL | Out-File -FilePath "temp_sample.sql" -Encoding UTF8

try {
    Write-Host "Checking sample data..." -ForegroundColor Gray
    $result = psql -h $DbHost -p $DbPort -d $Database -U $Username -f "temp_sample.sql" 2>&1
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "Sample data check failed: $_" -ForegroundColor Red
}

# Clean up temp files
Remove-Item "temp_check.sql" -ErrorAction SilentlyContinue
Remove-Item "temp_count.sql" -ErrorAction SilentlyContinue
Remove-Item "temp_sample.sql" -ErrorAction SilentlyContinue

# Clean up environment variable
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "`nReconciliation System Migration Complete!" -ForegroundColor Green
Write-Host "Check the output above to verify all tables were created successfully." -ForegroundColor Cyan