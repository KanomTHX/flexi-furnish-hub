# PowerShell Script to Run Supplier Billing Advanced Features Migration
# This script will execute the SQL migration files against your Supabase database

param(
    [string]$SupabaseUrl = "",
    [string]$SupabasePassword = "",
    [string]$DatabaseName = "postgres",
    [string]$Username = "postgres",
    [int]$Port = 5432,
    [switch]$DryRun = $false,
    [switch]$Rollback = $false
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-SupabaseConnection {
    # Check if .env file exists and load variables
    if (Test-Path ".env") {
        Write-ColorOutput "📄 Loading environment variables from .env file..." $Blue
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($name -eq "VITE_SUPABASE_URL") {
                    $script:SupabaseUrl = $value
                }
                elseif ($name -eq "SUPABASE_DB_PASSWORD") {
                    $script:SupabasePassword = $value
                }
            }
        }
    }

    # Prompt for missing values
    if ([string]::IsNullOrEmpty($SupabaseUrl)) {
        $SupabaseUrl = Read-Host "Enter your Supabase URL (e.g., https://your-project.supabase.co)"
    }

    if ([string]::IsNullOrEmpty($SupabasePassword)) {
        $SupabasePassword = Read-Host "Enter your Supabase database password" -AsSecureString
        $SupabasePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SupabasePassword))
    }

    # Extract host from URL
    if ($SupabaseUrl -match "https://([^.]+)\.supabase\.co") {
        $ProjectId = $matches[1]
        $Host = "aws-0-ap-southeast-1.pooler.supabase.com"
        $Port = 6543
        $Username = "postgres.$ProjectId"
    } else {
        Write-ColorOutput "❌ Invalid Supabase URL format. Expected: https://your-project.supabase.co" $Red
        exit 1
    }

    return @{
        Host = $Host
        Port = $Port
        Database = $DatabaseName
        Username = $Username
        Password = $SupabasePassword
    }
}

function Test-DatabaseConnection {
    param($Connection)
    
    Write-ColorOutput "🔍 Testing database connection..." $Blue
    
    $env:PGPASSWORD = $Connection.Password
    $testResult = psql -h $Connection.Host -p $Connection.Port -U $Connection.Username -d $Connection.Database -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Database connection successful!" $Green
        return $true
    } else {
        Write-ColorOutput "❌ Database connection failed:" $Red
        Write-ColorOutput $testResult $Red
        return $false
    }
}

function Execute-SqlFile {
    param(
        [string]$FilePath,
        [hashtable]$Connection,
        [bool]$DryRun = $false
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-ColorOutput "❌ File not found: $FilePath" $Red
        return $false
    }

    $fileName = Split-Path $FilePath -Leaf
    Write-ColorOutput "📄 Processing: $fileName" $Blue

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN - Would execute: $fileName" $Yellow
        $content = Get-Content $FilePath -Raw
        Write-ColorOutput "File size: $($content.Length) characters" $Yellow
        return $true
    }

    $env:PGPASSWORD = $Connection.Password
    
    Write-ColorOutput "⚡ Executing: $fileName" $Blue
    $result = psql -h $Connection.Host -p $Connection.Port -U $Connection.Username -d $Connection.Database -f $FilePath 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Successfully executed: $fileName" $Green
        return $true
    } else {
        Write-ColorOutput "❌ Failed to execute: $fileName" $Red
        Write-ColorOutput $result $Red
        return $false
    }
}

function Main {
    Write-ColorOutput "🚀 Supplier Billing Advanced Features Migration Script" $Blue
    Write-ColorOutput "=================================================" $Blue

    # Get database connection details
    $connection = Get-SupabaseConnection

    Write-ColorOutput "📋 Connection Details:" $Blue
    Write-ColorOutput "  Host: $($connection.Host)" $Blue
    Write-ColorOutput "  Port: $($connection.Port)" $Blue
    Write-ColorOutput "  Database: $($connection.Database)" $Blue
    Write-ColorOutput "  Username: $($connection.Username)" $Blue

    # Test connection
    if (-not (Test-DatabaseConnection $connection)) {
        Write-ColorOutput "❌ Cannot proceed without database connection" $Red
        exit 1
    }

    if ($Rollback) {
        Write-ColorOutput "⚠️  ROLLBACK MODE - This will remove all advanced features!" $Yellow
        $confirm = Read-Host "Are you sure you want to rollback? Type 'YES' to confirm"
        if ($confirm -ne "YES") {
            Write-ColorOutput "❌ Rollback cancelled" $Yellow
            exit 0
        }

        $rollbackFile = "supabase/migrations/20241214000003_rollback_advanced_features.sql"
        if (Execute-SqlFile $rollbackFile $connection $DryRun) {
            Write-ColorOutput "✅ Rollback completed successfully!" $Green
        } else {
            Write-ColorOutput "❌ Rollback failed!" $Red
            exit 1
        }
        return
    }

    # Migration files in order
    $migrationFiles = @(
        "supabase/migrations/20241214000001_supplier_billing_advanced_features.sql",
        "supabase/migrations/20241214000002_advanced_constraints_and_optimizations.sql"
    )

    Write-ColorOutput "📋 Migration Plan:" $Blue
    foreach ($file in $migrationFiles) {
        if (Test-Path $file) {
            Write-ColorOutput "  ✅ $file" $Green
        } else {
            Write-ColorOutput "  ❌ $file (NOT FOUND)" $Red
        }
    }

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN MODE - No changes will be made" $Yellow
    } else {
        Write-ColorOutput "⚠️  This will modify your database. Make sure you have a backup!" $Yellow
        $confirm = Read-Host "Continue with migration? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-ColorOutput "❌ Migration cancelled" $Yellow
            exit 0
        }
    }

    # Execute migration files
    $success = $true
    foreach ($file in $migrationFiles) {
        if (-not (Execute-SqlFile $file $connection $DryRun)) {
            $success = $false
            break
        }
    }

    if ($success) {
        Write-ColorOutput "🎉 Migration completed successfully!" $Green
        Write-ColorOutput "📋 Next steps:" $Blue
        Write-ColorOutput "  1. Run the test script: node scripts/test-advanced-schema.js" $Blue
        Write-ColorOutput "  2. Update your application code to use the new tables" $Blue
        Write-ColorOutput "  3. Configure integrations (POS, accounting, email)" $Blue
        Write-ColorOutput "  4. Set up notification templates and schedules" $Blue
    } else {
        Write-ColorOutput "❌ Migration failed! Check the errors above." $Red
        Write-ColorOutput "💡 You may need to rollback using: -Rollback switch" $Yellow
        exit 1
    }
}

# Run the main function
Main