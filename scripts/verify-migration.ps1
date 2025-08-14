# PowerShell Script to Verify Supplier Billing Advanced Features Migration
# This script checks if all tables, functions, and views were created successfully

param(
    [string]$SupabaseUrl = "",
    [string]$SupabasePassword = ""
)

$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-DatabaseConnection {
    # Load from .env if available
    if (Test-Path ".env") {
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

    if ([string]::IsNullOrEmpty($SupabaseUrl)) {
        $SupabaseUrl = Read-Host "Enter your Supabase URL"
    }

    if ([string]::IsNullOrEmpty($SupabasePassword)) {
        $SupabasePassword = Read-Host "Enter your database password" -AsSecureString
        $SupabasePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SupabasePassword))
    }

    if ($SupabaseUrl -match "https://([^.]+)\.supabase\.co") {
        $ProjectId = $matches[1]
        $Host = "aws-0-ap-southeast-1.pooler.supabase.com"
    } else {
        Write-ColorOutput "❌ Invalid Supabase URL format" $Red
        exit 1
    }

    return @{
        Host = $Host
        Port = 6543
        Database = "postgres"
        Username = "postgres.$ProjectId"
        Password = $SupabasePassword
    }
}

function Execute-Query {
    param(
        [string]$Query,
        [hashtable]$Connection
    )
    
    $env:PGPASSWORD = $Connection.Password
    $result = psql -h $Connection.Host -p $Connection.Port -U $Connection.Username -d $Connection.Database -t -c $Query 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        return $result
    } else {
        return $null
    }
}

function Test-TablesExist {
    param([hashtable]$Connection)
    
    Write-ColorOutput "🔍 Checking tables..." $Blue
    
    $expectedTables = @(
        'suppliers',
        'supplier_invoices', 
        'supplier_invoice_items',
        'supplier_payments',
        'chart_of_accounts',
        'journal_entries',
        'journal_entry_lines',
        'report_definitions',
        'scheduled_reports',
        'supplier_performance_metrics',
        'report_execution_history',
        'stock_alerts',
        'auto_purchase_orders',
        'auto_purchase_order_items',
        'supplier_products',
        'integration_sync_log',
        'notification_templates',
        'scheduled_notifications',
        'notification_history',
        'supplier_communication_preferences'
    )
    
    $query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    $result = Execute-Query $query $Connection
    
    if ($result) {
        $existingTables = $result -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
        $missingTables = @()
        
        foreach ($table in $expectedTables) {
            if ($existingTables -notcontains $table) {
                $missingTables += $table
            }
        }
        
        if ($missingTables.Count -eq 0) {
            Write-ColorOutput "✅ All $($expectedTables.Count) expected tables exist" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Missing tables:" $Red
            foreach ($table in $missingTables) {
                Write-ColorOutput "  - $table" $Red
            }
            return $false
        }
    } else {
        Write-ColorOutput "❌ Failed to query tables" $Red
        return $false
    }
}

function Test-ViewsExist {
    param([hashtable]$Connection)
    
    Write-ColorOutput "🔍 Checking views..." $Blue
    
    $expectedViews = @(
        'supplier_billing_summary',
        'supplier_performance_dashboard',
        'stock_alerts_summary',
        'notification_performance'
    )
    
    $query = "SELECT table_name FROM information_schema.views WHERE table_schema = 'public';"
    $result = Execute-Query $query $Connection
    
    if ($result) {
        $existingViews = $result -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
        $missingViews = @()
        
        foreach ($view in $expectedViews) {
            if ($existingViews -notcontains $view) {
                $missingViews += $view
            }
        }
        
        if ($missingViews.Count -eq 0) {
            Write-ColorOutput "✅ All $($expectedViews.Count) expected views exist" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Missing views:" $Red
            foreach ($view in $missingViews) {
                Write-ColorOutput "  - $view" $Red
            }
            return $false
        }
    } else {
        Write-ColorOutput "❌ Failed to query views" $Red
        return $false
    }
}

function Test-FunctionsExist {
    param([hashtable]$Connection)
    
    Write-ColorOutput "🔍 Checking functions..." $Blue
    
    $testFunctions = @(
        'generate_supplier_code',
        'generate_invoice_number',
        'generate_auto_purchase_order_number'
    )
    
    $allWorking = $true
    
    foreach ($func in $testFunctions) {
        $query = "SELECT $func();"
        $result = Execute-Query $query $Connection
        
        if ($result) {
            Write-ColorOutput "  ✅ $func() - Working" $Green
        } else {
            Write-ColorOutput "  ❌ $func() - Failed" $Red
            $allWorking = $false
        }
    }
    
    return $allWorking
}

function Test-SampleData {
    param([hashtable]$Connection)
    
    Write-ColorOutput "🔍 Checking sample data..." $Blue
    
    # Check notification templates
    $query = "SELECT COUNT(*) FROM notification_templates;"
    $result = Execute-Query $query $Connection
    
    if ($result -and $result.Trim() -gt 0) {
        Write-ColorOutput "  ✅ Notification templates: $($result.Trim()) records" $Green
    } else {
        Write-ColorOutput "  ⚠️  No notification templates found" $Yellow
    }
    
    # Check report definitions
    $query = "SELECT COUNT(*) FROM report_definitions;"
    $result = Execute-Query $query $Connection
    
    if ($result -and $result.Trim() -gt 0) {
        Write-ColorOutput "  ✅ Report definitions: $($result.Trim()) records" $Green
    } else {
        Write-ColorOutput "  ⚠️  No report definitions found" $Yellow
    }
    
    # Check chart of accounts
    $query = "SELECT COUNT(*) FROM chart_of_accounts;"
    $result = Execute-Query $query $Connection
    
    if ($result -and $result.Trim() -gt 0) {
        Write-ColorOutput "  ✅ Chart of accounts: $($result.Trim()) records" $Green
        return $true
    } else {
        Write-ColorOutput "  ⚠️  No chart of accounts found" $Yellow
        return $false
    }
}

function Test-Constraints {
    param([hashtable]$Connection)
    
    Write-ColorOutput "🔍 Testing constraints..." $Blue
    
    # Test check constraint on stock_alerts
    $query = "INSERT INTO stock_alerts (product_id, product_name, current_stock, reorder_point, reorder_quantity) VALUES ('00000000-0000-0000-0000-000000000000', 'Test Product', -1, 10, 20);"
    $result = Execute-Query $query $Connection
    
    if ($result) {
        Write-ColorOutput "  ❌ Check constraints not working (negative stock allowed)" $Red
        # Clean up the test record
        Execute-Query "DELETE FROM stock_alerts WHERE product_name = 'Test Product';" $Connection
        return $false
    } else {
        Write-ColorOutput "  ✅ Check constraints working (negative stock rejected)" $Green
        return $true
    }
}

function Main {
    Write-ColorOutput "🧪 Supplier Billing Advanced Features Migration Verification" $Blue
    Write-ColorOutput "=========================================================" $Blue
    
    $connection = Get-DatabaseConnection
    
    Write-ColorOutput "📋 Connection Details:" $Blue
    Write-ColorOutput "  Host: $($connection.Host)" $Blue
    Write-ColorOutput "  Database: $($connection.Database)" $Blue
    Write-ColorOutput "  Username: $($connection.Username)" $Blue
    
    # Test connection
    $env:PGPASSWORD = $connection.Password
    $testResult = psql -h $connection.Host -p $connection.Port -U $connection.Username -d $connection.Database -c "SELECT 'Connected successfully!' as status;" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Database connection failed:" $Red
        Write-ColorOutput $testResult $Red
        exit 1
    }
    
    Write-ColorOutput "✅ Database connection successful!" $Green
    Write-ColorOutput "" $Blue
    
    # Run verification tests
    $tests = @(
        @{ Name = "Tables"; Test = { Test-TablesExist $connection } },
        @{ Name = "Views"; Test = { Test-ViewsExist $connection } },
        @{ Name = "Functions"; Test = { Test-FunctionsExist $connection } },
        @{ Name = "Sample Data"; Test = { Test-SampleData $connection } },
        @{ Name = "Constraints"; Test = { Test-Constraints $connection } }
    )
    
    $passedTests = 0
    $totalTests = $tests.Count
    
    foreach ($test in $tests) {
        try {
            if (& $test.Test) {
                $passedTests++
            }
        } catch {
            Write-ColorOutput "❌ $($test.Name) test failed: $($_.Exception.Message)" $Red
        }
        Write-ColorOutput "" $Blue
    }
    
    # Summary
    Write-ColorOutput "📊 Verification Results:" $Blue
    Write-ColorOutput "========================" $Blue
    Write-ColorOutput "Tests passed: $passedTests/$totalTests" $Blue
    
    if ($passedTests -eq $totalTests) {
        Write-ColorOutput "🎉 All tests passed! Migration was successful!" $Green
        Write-ColorOutput "" $Green
        Write-ColorOutput "✅ Your database is ready for advanced supplier billing features!" $Green
        Write-ColorOutput "" $Blue
        Write-ColorOutput "📋 Next steps:" $Blue
        Write-ColorOutput "  1. Update your application code to use the new tables" $Blue
        Write-ColorOutput "  2. Configure integrations (POS, accounting, email)" $Blue
        Write-ColorOutput "  3. Set up notification templates and schedules" $Blue
        Write-ColorOutput "  4. Create custom reports using the report definitions" $Blue
    } else {
        Write-ColorOutput "❌ Some tests failed. Please check the migration." $Red
        Write-ColorOutput "💡 You may need to re-run the migration or check for errors." $Yellow
        exit 1
    }
}

# Run the main function
Main