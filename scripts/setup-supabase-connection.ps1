# PowerShell Script to Setup Supabase Connection
# This script helps you configure the connection to your Supabase database

param(
    [switch]$ShowEnvExample = $false
)

$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-EnvExample {
    Write-ColorOutput "📄 Example .env file content:" $Blue
    Write-ColorOutput "================================" $Blue
    Write-ColorOutput "# Supabase Configuration" $Green
    Write-ColorOutput "VITE_SUPABASE_URL=https://your-project-id.supabase.co" $Green
    Write-ColorOutput "VITE_SUPABASE_ANON_KEY=your-anon-key-here" $Green
    Write-ColorOutput "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here" $Green
    Write-ColorOutput "SUPABASE_DB_PASSWORD=your-database-password-here" $Green
    Write-ColorOutput "" $Green
    Write-ColorOutput "# Optional: Custom database settings" $Green
    Write-ColorOutput "SUPABASE_DB_HOST=db.your-project-id.supabase.co" $Green
    Write-ColorOutput "SUPABASE_DB_PORT=5432" $Green
    Write-ColorOutput "SUPABASE_DB_NAME=postgres" $Green
    Write-ColorOutput "SUPABASE_DB_USER=postgres" $Green
    Write-ColorOutput "================================" $Blue
}

function Test-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-ColorOutput "❌ .env file not found!" $Red
        Write-ColorOutput "💡 Create a .env file in your project root with your Supabase credentials" $Yellow
        Show-EnvExample
        return $false
    }

    Write-ColorOutput "✅ .env file found" $Green
    
    # Check for required variables
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @("VITE_SUPABASE_URL", "SUPABASE_DB_PASSWORD")
    $missingVars = @()

    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=") {
            $missingVars += $var
        }
    }

    if ($missingVars.Count -gt 0) {
        Write-ColorOutput "⚠️  Missing required environment variables:" $Yellow
        foreach ($var in $missingVars) {
            Write-ColorOutput "  - $var" $Red
        }
        return $false
    }

    Write-ColorOutput "✅ All required environment variables found" $Green
    return $true
}

function Get-SupabaseInfo {
    Write-ColorOutput "🔍 Checking Supabase project information..." $Blue
    
    if (Test-Path ".env") {
        $envVars = @{}
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                $envVars[$name] = $value
            }
        }

        if ($envVars.ContainsKey("VITE_SUPABASE_URL")) {
            $url = $envVars["VITE_SUPABASE_URL"]
            if ($url -match "https://([^.]+)\.supabase\.co") {
                $projectId = $matches[1]
                Write-ColorOutput "📋 Project Information:" $Blue
                Write-ColorOutput "  Project ID: $projectId" $Green
                Write-ColorOutput "  Supabase URL: $url" $Green
                Write-ColorOutput "  Database Host: aws-0-ap-southeast-1.pooler.supabase.com" $Green
                Write-ColorOutput "  Database Port: 6543" $Green
                Write-ColorOutput "  Database Name: postgres" $Green
                Write-ColorOutput "  Database User: postgres.$projectId" $Green
                return $true
            }
        }
    }
    
    Write-ColorOutput "❌ Could not extract project information" $Red
    return $false
}

function Test-DatabaseConnection {
    Write-ColorOutput "🔍 Testing database connection..." $Blue
    
    if (-not (Test-Path ".env")) {
        Write-ColorOutput "❌ .env file not found. Cannot test connection." $Red
        return $false
    }

    # Load environment variables
    $envVars = @{}
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$name] = $value
        }
    }

    if (-not $envVars.ContainsKey("VITE_SUPABASE_URL") -or -not $envVars.ContainsKey("SUPABASE_DB_PASSWORD")) {
        Write-ColorOutput "❌ Missing required environment variables for connection test" $Red
        return $false
    }

    $url = $envVars["VITE_SUPABASE_URL"]
    $password = $envVars["SUPABASE_DB_PASSWORD"]

    if ($url -match "https://([^.]+)\.supabase\.co") {
        $projectId = $matches[1]
        $host = "aws-0-ap-southeast-1.pooler.supabase.com"
        
        $env:PGPASSWORD = $password
        $testResult = psql -h $host -p 6543 -U "postgres.$projectId" -d postgres -c "SELECT 'Connection successful!' as status;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Database connection successful!" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Database connection failed:" $Red
            Write-ColorOutput $testResult $Red
            Write-ColorOutput "" $Yellow
            Write-ColorOutput "💡 Common issues:" $Yellow
            Write-ColorOutput "  - Check your database password" $Yellow
            Write-ColorOutput "  - Ensure your IP is whitelisted in Supabase" $Yellow
            Write-ColorOutput "  - Verify the project URL is correct" $Yellow
            return $false
        }
    } else {
        Write-ColorOutput "❌ Invalid Supabase URL format" $Red
        return $false
    }
}

function Main {
    Write-ColorOutput "🔧 Supabase Connection Setup" $Blue
    Write-ColorOutput "============================" $Blue

    if ($ShowEnvExample) {
        Show-EnvExample
        return
    }

    # Check if psql is available
    try {
        $psqlVersion = psql --version 2>&1
        Write-ColorOutput "✅ PostgreSQL client (psql) is available: $psqlVersion" $Green
    } catch {
        Write-ColorOutput "❌ PostgreSQL client (psql) not found!" $Red
        Write-ColorOutput "💡 Please install PostgreSQL client tools" $Yellow
        return
    }

    # Test .env file
    if (-not (Test-EnvFile)) {
        Write-ColorOutput "" $Yellow
        Write-ColorOutput "💡 To see an example .env file, run:" $Yellow
        Write-ColorOutput "  .\scripts\setup-supabase-connection.ps1 -ShowEnvExample" $Yellow
        return
    }

    # Show project info
    Get-SupabaseInfo | Out-Null

    # Test connection
    if (Test-DatabaseConnection) {
        Write-ColorOutput "" $Green
        Write-ColorOutput "🎉 Setup complete! You can now run the migration:" $Green
        Write-ColorOutput "  .\scripts\run-migration.ps1" $Green
        Write-ColorOutput "" $Blue
        Write-ColorOutput "📋 Available options:" $Blue
        Write-ColorOutput "  .\scripts\run-migration.ps1 -DryRun    # Test without making changes" $Blue
        Write-ColorOutput "  .\scripts\run-migration.ps1 -Rollback  # Remove advanced features" $Blue
    } else {
        Write-ColorOutput "" $Red
        Write-ColorOutput "❌ Connection test failed. Please check your configuration." $Red
    }
}

# Run the main function
Main