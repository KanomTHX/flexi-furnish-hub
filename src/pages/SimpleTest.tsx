import React, { useEffect, useState } from 'react'

export default function SimpleTest() {
  const [envStatus, setEnvStatus] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)

  useEffect(() => {
    // ตรวจสอบ environment variables
    const env = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      VITE_USE_SERVICE_ROLE: import.meta.env.VITE_USE_SERVICE_ROLE
    }

    console.log('🔧 Environment Variables:', env)

    const useServiceRole = env.VITE_USE_SERVICE_ROLE === 'true'
    const selectedKey = useServiceRole ? env.VITE_SUPABASE_SERVICE_ROLE_KEY : env.VITE_SUPABASE_ANON_KEY
    const keyType = useServiceRole ? 'Service Role Key' : 'Anon Key'

    setEnvStatus({
      env,
      useServiceRole,
      selectedKey,
      keyType,
      hasValidConfig: env.VITE_SUPABASE_URL && selectedKey
    })

    // ทดสอบการเชื่อมต่ออัตโนมัติ
    if (env.VITE_SUPABASE_URL && selectedKey) {
      testConnection(env.VITE_SUPABASE_URL, selectedKey, keyType)
    }
  }, [])

  const testConnection = async (url: string, key: string, keyType: string) => {
    try {
      setConnectionStatus({ status: 'testing', message: 'กำลังทดสอบการเชื่อมต่อ...' })

      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      const { data, error } = await supabase
        .from('branches')
        .select('count', { count: 'exact', head: true })

      if (error) {
        console.error('❌ Connection error:', error)
        setConnectionStatus({
          status: 'error',
          message: `Connection Error: ${error.message}`,
          keyType
        })
      } else {
        console.log('✅ Connection successful!')
        setConnectionStatus({
          status: 'success',
          message: `Connection successful! Using ${keyType}`,
          keyType
        })
      }
    } catch (err) {
      console.error('💥 Test failed:', err)
      setConnectionStatus({
        status: 'error',
        message: `Test Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        keyType
      })
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Simple Environment Test</h1>
      
      {/* Environment Variables Status */}
      <div style={{ marginBottom: '20px' }}>
        <h2>📊 Environment Variables</h2>
        {envStatus && (
          <div>
            {Object.entries(envStatus.env).map(([key, value]: [string, any]) => (
              <div key={key} style={{ 
                padding: '5px', 
                color: value ? 'green' : 'red',
                fontFamily: 'monospace'
              }}>
                <strong>{key}:</strong> {value ? '✅ Set' : '❌ Missing'}
                {value && value.length > 50 && (
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {' '}({value.length} chars)
                  </span>
                )}
              </div>
            ))}
            
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
              <strong>Configuration:</strong>
              <br />
              Mode: {envStatus.keyType}
              <br />
              Service Role: {envStatus.useServiceRole ? '✅ Enabled' : '❌ Disabled'}
              <br />
              Valid Config: {envStatus.hasValidConfig ? '✅ Yes' : '❌ No'}
            </div>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div style={{ marginBottom: '20px' }}>
        <h2>🔗 Database Connection</h2>
        {connectionStatus && (
          <div style={{
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: connectionStatus.status === 'success' ? '#d4edda' : 
                           connectionStatus.status === 'error' ? '#f8d7da' : '#fff3cd',
            color: connectionStatus.status === 'success' ? '#155724' : 
                   connectionStatus.status === 'error' ? '#721c24' : '#856404'
          }}>
            {connectionStatus.status === 'success' && '✅ '}
            {connectionStatus.status === 'error' && '❌ '}
            {connectionStatus.status === 'testing' && '🔄 '}
            {connectionStatus.message}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div>
        <h2>📝 Instructions</h2>
        {envStatus?.hasValidConfig ? (
          <div style={{ color: 'green' }}>
            <p>✅ Configuration is valid! You can now:</p>
            <ul>
              <li>Go to <a href="/database" target="_blank">/database</a> to manage database</li>
              <li>Go to <a href="/quick-test" target="_blank">/quick-test</a> for detailed testing</li>
              <li>Use Admin Mode to install database tables</li>
            </ul>
          </div>
        ) : (
          <div style={{ color: 'red' }}>
            <p>❌ Configuration issues found. Please:</p>
            <ol>
              <li>Check your .env.local file</li>
              <li>Make sure it uses VITE_ prefix (not NEXT_PUBLIC_)</li>
              <li>Restart the development server</li>
            </ol>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_USE_SERVICE_ROLE=true`}
            </pre>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <h3>🔍 Debug Info</h3>
        <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', fontSize: '11px' }}>
          {JSON.stringify(envStatus, null, 2)}
        </pre>
      </div>
    </div>
  )
}