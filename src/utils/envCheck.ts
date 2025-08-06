// ฟังก์ชันสำหรับตรวจสอบ Environment Variables
export function checkEnvironmentVariables() {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    VITE_USE_SERVICE_ROLE: import.meta.env.VITE_USE_SERVICE_ROLE
  }

  console.log('🔧 Environment Variables Check:')
  console.log('VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
  console.log('VITE_USE_SERVICE_ROLE:', env.VITE_USE_SERVICE_ROLE)

  // ตรวจสอบความถูกต้อง
  const checks = {
    hasUrl: env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL',
    hasAnonKey: env.VITE_SUPABASE_ANON_KEY && env.VITE_SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY',
    hasServiceKey: env.VITE_SUPABASE_SERVICE_ROLE_KEY && env.VITE_SUPABASE_SERVICE_ROLE_KEY !== 'YOUR_SERVICE_ROLE_KEY',
    useServiceRole: env.VITE_USE_SERVICE_ROLE === 'true'
  }

  console.log('📊 Validation Results:')
  console.log('URL Valid:', checks.hasUrl ? '✅' : '❌')
  console.log('Anon Key Valid:', checks.hasAnonKey ? '✅' : '❌')
  console.log('Service Key Valid:', checks.hasServiceKey ? '✅' : '❌')
  console.log('Service Role Mode:', checks.useServiceRole ? '✅ Enabled' : '❌ Disabled')

  const selectedKey = checks.useServiceRole ? env.VITE_SUPABASE_SERVICE_ROLE_KEY : env.VITE_SUPABASE_ANON_KEY
  const keyType = checks.useServiceRole ? 'Service Role Key' : 'Anon Key'
  
  console.log(`🔑 Using: ${keyType}`)
  console.log(`🔑 Key Length: ${selectedKey?.length || 0} characters`)

  return {
    env,
    checks,
    selectedKey,
    keyType,
    isValid: checks.hasUrl && (checks.useServiceRole ? checks.hasServiceKey : checks.hasAnonKey)
  }
}

// รันการตรวจสอบทันทีเมื่อ import
if (typeof window !== 'undefined') {
  checkEnvironmentVariables()
}