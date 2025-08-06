import { supabase } from '@/lib/supabase'

export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('branches')
      .select('count', { count: 'exact', head: true })
    
    if (healthError) {
      console.error('❌ Basic connection failed:', healthError)
      return {
        success: false,
        error: `Connection failed: ${healthError.message}`,
        details: healthError
      }
    }
    
    console.log('✅ Basic connection successful')
    
    // Test 2: Check if tables exist
    console.log('📋 Checking if tables exist...')
    const tableTests = [
      'branches',
      'employees', 
      'customers',
      'products',
      'accounting_transactions'
    ]
    
    const tableResults = []
    for (const tableName of tableTests) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ Table '${tableName}' not found:`, error.message)
          tableResults.push({ table: tableName, exists: false, error: error.message })
        } else {
          console.log(`✅ Table '${tableName}' exists`)
          tableResults.push({ table: tableName, exists: true })
        }
      } catch (err) {
        console.log(`❌ Error checking table '${tableName}':`, err)
        tableResults.push({ table: tableName, exists: false, error: String(err) })
      }
    }
    
    const existingTables = tableResults.filter(t => t.exists).length
    console.log(`📊 Found ${existingTables}/${tableTests.length} tables`)
    
    // Test 3: Try to read some data
    console.log('📖 Testing data access...')
    try {
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .limit(5)
      
      if (branchError) {
        console.log('⚠️ Could not read branches data:', branchError.message)
      } else {
        console.log(`✅ Successfully read ${branches?.length || 0} branches`)
      }
    } catch (err) {
      console.log('⚠️ Data access test failed:', err)
    }
    
    return {
      success: true,
      tablesFound: existingTables,
      totalTables: tableTests.length,
      tableResults,
      message: existingTables > 0 
        ? `Connection successful! Found ${existingTables} tables.`
        : 'Connection successful but no tables found. Please run the SQL setup script.'
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

export async function testEnvironmentVariables() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  const useServiceRole = import.meta.env.VITE_USE_SERVICE_ROLE === 'true'
  
  console.log('🔧 Environment Variables Check:')
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅ Set' : '❌ Missing')
  console.log('USE_SERVICE_ROLE:', useServiceRole ? '✅ Enabled (Admin Mode)' : '❌ Disabled (Client Mode)')
  
  const selectedKey = useServiceRole ? supabaseServiceRoleKey : supabaseAnonKey
  const keyType = useServiceRole ? 'Service Role Key' : 'Anon Key'
  
  console.log(`🔑 Using: ${keyType}`)
  
  if (!supabaseUrl || !selectedKey) {
    return {
      success: false,
      error: `Missing environment variables. Please check your .env.local file. Missing: ${!supabaseUrl ? 'URL' : keyType}`,
      missing: {
        url: !supabaseUrl,
        key: !selectedKey,
        keyType
      }
    }
  }
  
  return {
    success: true,
    message: `Environment variables are properly configured. Using ${keyType} for database access.`,
    keyType,
    useServiceRole
  }
}