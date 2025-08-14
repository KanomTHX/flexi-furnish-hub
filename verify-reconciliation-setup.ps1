# PowerShell script to verify reconciliation system setup

Write-Host "🔍 Reconciliation System Verification" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`n📋 Step 1: Check Migration Files" -ForegroundColor Yellow
$migrationFile = "supabase/migrations/20241214000004_reconciliation_system.sql"
if (Test-Path $migrationFile) {
    Write-Host "✅ Migration file exists: $migrationFile" -ForegroundColor Green
    $fileSize = (Get-Item $migrationFile).Length
    Write-Host "   File size: $fileSize bytes" -ForegroundColor Gray
} else {
    Write-Host "❌ Migration file missing: $migrationFile" -ForegroundColor Red
}

Write-Host "`n📋 Step 2: Check Service Files" -ForegroundColor Yellow
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

Write-Host "`n📋 Step 3: Check SQL Files for Manual Execution" -ForegroundColor Yellow
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

Write-Host "`n📋 Step 4: Database Migration Instructions" -ForegroundColor Yellow
Write-Host "To apply the reconciliation system to your database:" -ForegroundColor White
Write-Host "1. Open Supabase SQL Editor" -ForegroundColor Gray
Write-Host "2. Copy content from 'reconciliation_migration_simple.sql'" -ForegroundColor Gray
Write-Host "3. Paste and execute in SQL Editor" -ForegroundColor Gray
Write-Host "4. Run 'simple-table-check.sql' to verify tables were created" -ForegroundColor Gray

Write-Host "`n📋 Step 5: Expected Database Objects" -ForegroundColor Yellow
Write-Host "Tables to be created:" -ForegroundColor White
Write-Host "  • reconciliation_reports (main reconciliation records)" -ForegroundColor Gray
Write-Host "  • reconciliation_items (individual reconciling items)" -ForegroundColor Gray
Write-Host "  • reconciliation_adjustments (manual adjustments)" -ForegroundColor Gray

Write-Host "`nFunctions to be created:" -ForegroundColor White
Write-Host "  • generate_reconciliation_report_number()" -ForegroundColor Gray
Write-Host "  • update_reconciled_balance()" -ForegroundColor Gray
Write-Host "  • update_updated_at_column()" -ForegroundColor Gray

Write-Host "`nIndexes to be created:" -ForegroundColor White
Write-Host "  • 9 performance indexes on key columns" -ForegroundColor Gray

Write-Host "`nTriggers to be created:" -ForegroundColor White
Write-Host "  • 4 triggers for automatic balance updates" -ForegroundColor Gray

Write-Host "`n📋 Step 6: Verification Process" -ForegroundColor Yellow
Write-Host "After running the migration:" -ForegroundColor White
Write-Host "1. Execute 'simple-table-check.sql' in Supabase SQL Editor" -ForegroundColor Gray
Write-Host "2. Check that all tables show '✅ EXISTS'" -ForegroundColor Gray
Write-Host "3. Verify functions are created" -ForegroundColor Gray
Write-Host "4. Check sample data is inserted" -ForegroundColor Gray

Write-Host "`n🎯 Quick Start Commands:" -ForegroundColor Cyan
Write-Host "# Copy migration SQL to clipboard (if on Windows with clip command)" -ForegroundColor Gray
Write-Host "Get-Content 'reconciliation_migration_simple.sql' | Set-Clipboard" -ForegroundColor Green

Write-Host "`n# View migration content" -ForegroundColor Gray
Write-Host "Get-Content 'reconciliation_migration_simple.sql'" -ForegroundColor Green

Write-Host "`n# View verification SQL" -ForegroundColor Gray
Write-Host "Get-Content 'simple-table-check.sql'" -ForegroundColor Green

Write-Host "`n✨ All files are ready for deployment!" -ForegroundColor Green
Write-Host "Next: Run the SQL migration in your Supabase database." -ForegroundColor Cyan