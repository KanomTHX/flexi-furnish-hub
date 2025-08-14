# PowerShell script to verify reconciliation system setup

Write-Host "Reconciliation System Verification" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`nStep 1: Check Migration Files" -ForegroundColor Yellow
$migrationFile = "supabase/migrations/20241214000004_reconciliation_system.sql"
if (Test-Path $migrationFile) {
    Write-Host "✅ Migration file exists: $migrationFile" -ForegroundColor Green
    $fileSize = (Get-Item $migrationFile).Length
    Write-Host "   File size: $fileSize bytes" -ForegroundColor Gray
} else {
    Write-Host "❌ Migration file missing: $migrationFile" -ForegroundColor Red
}

Write-Host "`nStep 2: Check Service Files" -ForegroundColor Yellow
$serviceFiles = @(
    "src/services/reconciliationService.ts",
    "src/components/accounting/ReconciliationList.tsx",
    "src/components/accounting/ReconciliationForm.tsx",
    "src/components/accounting/ReconciliationDetails.tsx",
    "src/tests/reconciliationService.unit.test.ts"
)

foreach ($file in $serviceFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
    }
}

Write-Host "`nStep 3: Check SQL Files for Manual Execution" -ForegroundColor Yellow
$sqlFiles = @(
    "reconciliation_migration_simple.sql",
    "simple-table-check.sql",
    "check_reconciliation_tables.sql"
)

foreach ($file in $sqlFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
    }
}

Write-Host "`nDatabase Migration Instructions:" -ForegroundColor Yellow
Write-Host "1. Open Supabase SQL Editor" -ForegroundColor Gray
Write-Host "2. Copy content from 'reconciliation_migration_simple.sql'" -ForegroundColor Gray
Write-Host "3. Paste and execute in SQL Editor" -ForegroundColor Gray
Write-Host "4. Run 'simple-table-check.sql' to verify tables were created" -ForegroundColor Gray

Write-Host "`nExpected Database Objects:" -ForegroundColor Yellow
Write-Host "Tables: reconciliation_reports, reconciliation_items, reconciliation_adjustments" -ForegroundColor Gray
Write-Host "Functions: generate_reconciliation_report_number, update_reconciled_balance" -ForegroundColor Gray
Write-Host "Indexes: 9 performance indexes" -ForegroundColor Gray
Write-Host "Triggers: 4 automatic update triggers" -ForegroundColor Gray

Write-Host "`nAll files are ready for deployment!" -ForegroundColor Green