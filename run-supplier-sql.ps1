# PowerShell Script สำหรับรัน Supplier Billing SQL
param(
    [string]$ProjectRef,
    [string]$Password
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Supplier Billing SQL Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ตรวจสอบว่ามี psql หรือไม่
try {
    $psqlVersion = psql --version
    Write-Host "Found psql: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: psql not found. Please install PostgreSQL first." -ForegroundColor Red
    Write-Host "See install-psql.md for installation instructions." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# ตรวจสอบว่ามีไฟล์ SQL หรือไม่
if (-not (Test-Path "public\SUPPLIER_BILLING_TABLES.sql")) {
    Write-Host "ERROR: SQL file not found at public\SUPPLIER_BILLING_TABLES.sql" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# รับข้อมูลการเชื่อมต่อ (ถ้าไม่ได้ส่งมาเป็น parameter)
if (-not $ProjectRef) {
    $ProjectRef = Read-Host "Enter your Supabase Project Reference (from URL)"
}

if (-not $Password) {
    $Password = Read-Host "Enter your Database Password" -AsSecureString
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))
}

if (-not $ProjectRef -or -not $Password) {
    Write-Host "ERROR: Project Reference and Password are required" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# สร้าง connection string
$ConnectionString = "postgresql://postgres:$Password@$ProjectRef.supabase.co:5432/postgres"

Write-Host ""
Write-Host "Connecting to Supabase..." -ForegroundColor Yellow
Write-Host "Project: $ProjectRef" -ForegroundColor Yellow
Write-Host ""

# รัน SQL file
Write-Host "Running SQL script..." -ForegroundColor Yellow
try {
    $result = psql $ConnectionString -f "public\SUPPLIER_BILLING_TABLES.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS: SQL script executed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Tables created:" -ForegroundColor Green
        Write-Host "- suppliers" -ForegroundColor White
        Write-Host "- supplier_invoices" -ForegroundColor White
        Write-Host "- supplier_invoice_items" -ForegroundColor White
        Write-Host "- supplier_payments" -ForegroundColor White
        Write-Host "- chart_of_accounts" -ForegroundColor White
        Write-Host "- journal_entries" -ForegroundColor White
        Write-Host "- journal_entry_lines" -ForegroundColor White
        Write-Host ""
        Write-Host "Functions created:" -ForegroundColor Green
        Write-Host "- generate_supplier_code()" -ForegroundColor White
        Write-Host "- generate_invoice_number()" -ForegroundColor White
        Write-Host "- generate_payment_number()" -ForegroundColor White
        Write-Host "- update_supplier_balance()" -ForegroundColor White
        Write-Host "- And more..." -ForegroundColor White
        Write-Host ""
        Write-Host "You can now use the Supplier Billing system!" -ForegroundColor Green
    } else {
        throw "psql returned error code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Failed to execute SQL script" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Wrong password or project reference" -ForegroundColor White
    Write-Host "2. Network connection issues" -ForegroundColor White
    Write-Host "3. Database permissions" -ForegroundColor White
    Write-Host ""
    Write-Host "Please check your credentials and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"