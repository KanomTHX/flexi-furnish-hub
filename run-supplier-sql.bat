@echo off
echo ========================================
echo Running Supplier Billing SQL Script
echo ========================================

REM ตรวจสอบว่ามี psql หรือไม่
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: psql not found. Please install PostgreSQL first.
    echo See install-psql.md for installation instructions.
    pause
    exit /b 1
)

REM ตรวจสอบว่ามีไฟล์ SQL หรือไม่
if not exist "public\SUPPLIER_BILLING_TABLES.sql" (
    echo ERROR: SQL file not found at public\SUPPLIER_BILLING_TABLES.sql
    pause
    exit /b 1
)

REM ตรวจสอบว่ามี .env.local หรือไม่
if not exist ".env.local" (
    echo ERROR: .env.local file not found
    echo Please create .env.local with your Supabase credentials
    pause
    exit /b 1
)

echo.
echo Please provide your Supabase connection details:
echo.

REM รับข้อมูลการเชื่อมต่อจากผู้ใช้
set /p PROJECT_REF="Enter your Supabase Project Reference (from URL): "
set /p DB_PASSWORD="Enter your Database Password: "

if "%PROJECT_REF%"=="" (
    echo ERROR: Project Reference is required
    pause
    exit /b 1
)

if "%DB_PASSWORD%"=="" (
    echo ERROR: Database Password is required
    pause
    exit /b 1
)

REM สร้าง connection string
set CONNECTION_STRING=postgresql://postgres:%DB_PASSWORD%@%PROJECT_REF%.supabase.co:5432/postgres

echo.
echo Connecting to Supabase...
echo Project: %PROJECT_REF%
echo.

REM รัน SQL file
echo Running SQL script...
psql "%CONNECTION_STRING%" -f "public\SUPPLIER_BILLING_TABLES.sql"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS: SQL script executed successfully!
    echo ========================================
    echo.
    echo Tables created:
    echo - suppliers
    echo - supplier_invoices
    echo - supplier_invoice_items
    echo - supplier_payments
    echo - chart_of_accounts
    echo - journal_entries
    echo - journal_entry_lines
    echo.
    echo Functions created:
    echo - generate_supplier_code()
    echo - generate_invoice_number()
    echo - generate_payment_number()
    echo - update_supplier_balance()
    echo - And more...
    echo.
    echo You can now use the Supplier Billing system!
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to execute SQL script
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Wrong password or project reference
    echo 2. Network connection issues
    echo 3. Database permissions
    echo.
    echo Please check your credentials and try again.
)

echo.
pause