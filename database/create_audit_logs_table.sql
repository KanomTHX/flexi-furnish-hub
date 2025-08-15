-- Create audit_logs table for tracking all warehouse operations
-- This table will store comprehensive audit trail information

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  employee_id VARCHAR(50),
  operation_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB,
  record_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  user_name VARCHAR(100),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_type ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_employee_id ON audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_name ON audit_logs(user_name);

-- Create composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_timestamp ON audit_logs(operation_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_timestamp ON audit_logs(table_name, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all warehouse operations';
COMMENT ON COLUMN audit_logs.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (INSERT, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN audit_logs.employee_id IS 'ID of the employee who performed the action';
COMMENT ON COLUMN audit_logs.operation_type IS 'High-level operation type (STOCK_RECEIVE, STOCK_WITHDRAW, etc.)';
COMMENT ON COLUMN audit_logs.timestamp IS 'When the operation occurred';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values before the change (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values after the change (JSON)';
COMMENT ON COLUMN audit_logs.record_id IS 'ID of the specific record that was modified';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/client information';
COMMENT ON COLUMN audit_logs.user_name IS 'Display name of the user';
COMMENT ON COLUMN audit_logs.description IS 'Human-readable description of the operation';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context information (JSON)';

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy for read access (adjust as needed for your security requirements)
-- CREATE POLICY "Allow read access to audit logs" ON audit_logs
--   FOR SELECT USING (true);

-- Create a policy for insert access (only system can insert)
-- CREATE POLICY "Allow system insert to audit logs" ON audit_logs
--   FOR INSERT WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_audit_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_logs_updated_at();

-- Insert some sample data for testing (optional)
-- INSERT INTO audit_logs (
--   table_name, action, employee_id, operation_type, 
--   record_id, user_name, description, metadata
-- ) VALUES 
-- (
--   'product_serial_numbers', 'UPDATE', 'system', 'STOCK_WITHDRAW',
--   'test_record_1', 'System User', 'Test audit log entry',
--   '{"source": "warehouse_system", "version": "1.0.0"}'::jsonb
-- );

-- Grant necessary permissions (adjust as needed)
-- GRANT SELECT ON audit_logs TO authenticated;
-- GRANT INSERT ON audit_logs TO service_role;

-- Create a view for common audit queries
CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT 
  operation_type,
  COUNT(*) as total_operations,
  COUNT(DISTINCT user_name) as unique_users,
  COUNT(DISTINCT table_name) as affected_tables,
  MIN(timestamp) as first_operation,
  MAX(timestamp) as last_operation
FROM audit_logs
GROUP BY operation_type
ORDER BY total_operations DESC;

COMMENT ON VIEW audit_logs_summary IS 'Summary view of audit log operations for reporting';

-- Create a function to clean up old audit logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs 
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Function to clean up audit logs older than specified days (default: 365 days)';

-- Example usage of cleanup function:
-- SELECT cleanup_old_audit_logs(90); -- Keep only last 90 days