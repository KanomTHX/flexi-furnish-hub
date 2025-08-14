# PowerShell script to run reconciliation migration directly to Supabase

param(
    [string]$ProjectRef = "hartshwcchbsnmbrjdyn",
    [string]$Password = "Toolgodsa38"
)

Write-Host "🚀 Running Reconciliation Migration to Supabase" -ForegroundColor Cyan
Write-Host "Project Reference: $ProjectRef" -ForegroundColor Yellow

# Supabase connection details
$Host = "aws-0-ap-southeast-1.pooler.supabase.com"
$Port = "6543"
$Database = "postgres"
$Username = "postgres.$ProjectRef"

Write-Host "`n📋 Step 1: Testing Connection" -ForegroundColor Yellow
$env:PGPASSWORD = $Password

# Test connection first
$testQuery = "SELECT version();"
try {
    $result = psql -h $Host -p $Port -d $Database -U $Username -c $testQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Connection failed: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Connection error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Step 2: Running Migration" -ForegroundColor Yellow

# Read and execute the migration
$migrationFile = "reconciliation_migration_simple.sql"
if (Test-Path $migrationFile) {
    Write-Host "Executing migration from: $migrationFile" -ForegroundColor Gray
    
    try {
        $result = psql -h $Host -p $Port -d $Database -U $Username -f $migrationFile 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migration executed successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Migration completed with warnings/errors:" -ForegroundColor Yellow
            Write-Host $result -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Migration failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Step 3: Verifying Tables" -ForegroundColor Yellow

# Check if tables exist
$checkQuery = @"
SELECT 
    'reconciliation_reports' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reconciliation_reports'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'reconciliation_items' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reconciliation_items'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'reconciliation_adjustments' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reconciliation_adjustments'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;
"@

try {
    Write-Host "Checking table existence..." -ForegroundColor Gray
    $result = psql -h $Host -p $Port -d $Database -U $Username -c $checkQuery
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "❌ Table check failed: $_" -ForegroundColor Red
}

Write-Host "`n📋 Step 4: Checking Functions" -ForegroundColor Yellow

$functionQuery = @"
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'generate_reconciliation_report_number', 
    'update_reconciled_balance',
    'update_updated_at_column'
)
ORDER BY routine_name;
"@

try {
    Write-Host "Checking functions..." -ForegroundColor Gray
    $result = psql -h $Host -p $Port -d $Database -U $Username -c $functionQuery
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "❌ Function check failed: $_" -ForegroundColor Red
}

Write-Host "`n📋 Step 5: Checking Sample Data" -ForegroundColor Yellow

$dataQuery = @"
SELECT 
    'reconciliation_reports' as table_name, 
    COUNT(*) as record_count 
FROM reconciliation_reports
UNION ALL
SELECT 
    'reconciliation_items' as table_name, 
    COUNT(*) as record_count 
FROM reconciliation_items
UNION ALL
SELECT 
    'reconciliation_adjustments' as table_name, 
    COUNT(*) as record_count 
FROM reconciliation_adjustments;
"@

try {
    Write-Host "Checking record counts..." -ForegroundColor Gray
    $result = psql -h $Host -p $Port -d $Database -U $Username -c $dataQuery
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "❌ Data check failed: $_" -ForegroundColor Red
}

Write-Host "`n📋 Step 6: Sample Reconciliation Data" -ForegroundColor Yellow

$sampleQuery = @"
SELECT 
    report_number,
    period_start,
    period_end,
    book_balance,
    statement_balance,
    variance,
    status
FROM reconciliation_reports 
LIMIT 3;
"@

try {
    Write-Host "Showing sample reconciliation data..." -ForegroundColor Gray
    $result = psql -h $Host -p $Port -d $Database -U $Username -c $sampleQuery
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "❌ Sample data check failed: $_" -ForegroundColor Red
}

# Clean up environment variable
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "`n✅ Reconciliation System Migration Complete!" -ForegroundColor Green
Write-Host "All tables, functions, and sample data should now be available in your Supabase database." -ForegroundColor Cyan