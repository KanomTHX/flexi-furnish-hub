@echo off
echo ========================================
echo Supplier Billing Advanced Features Migration
echo ========================================
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell is available'" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is not available
    echo Please install PowerShell to run this migration
    pause
    exit /b 1
)

echo Choose an option:
echo 1. Setup and test Supabase connection
echo 2. Run migration (with confirmation)
echo 3. Run migration (dry run - no changes)
echo 4. Verify migration results
echo 5. Rollback migration (removes all advanced features)
echo 6. Show environment file example
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo.
    echo Running Supabase connection setup...
    powershell -ExecutionPolicy Bypass -File "scripts\setup-supabase-connection.ps1"
) else if "%choice%"=="2" (
    echo.
    echo Running migration...
    powershell -ExecutionPolicy Bypass -File "scripts\run-migration.ps1"
) else if "%choice%"=="3" (
    echo.
    echo Running migration in dry-run mode...
    powershell -ExecutionPolicy Bypass -File "scripts\run-migration.ps1" -DryRun
) else if "%choice%"=="4" (
    echo.
    echo Verifying migration results...
    powershell -ExecutionPolicy Bypass -File "scripts\verify-migration.ps1"
) else if "%choice%"=="5" (
    echo.
    echo WARNING: This will remove all advanced features!
    powershell -ExecutionPolicy Bypass -File "scripts\run-migration.ps1" -Rollback
) else if "%choice%"=="6" (
    echo.
    echo Showing environment file example...
    powershell -ExecutionPolicy Bypass -File "scripts\setup-supabase-connection.ps1" -ShowEnvExample
) else (
    echo Invalid choice. Please run the script again.
)

echo.
pause