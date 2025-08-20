-- Add branch_id column to audit_logs table
-- This migration adds branch filtering capability to the audit trail system

ALTER TABLE audit_logs 
ADD COLUMN branch_id UUID REFERENCES warehouses(id);

-- Create index for branch_id filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_id ON audit_logs(branch_id);

-- Create composite index for branch and timestamp filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_timestamp ON audit_logs(branch_id, timestamp DESC);

-- Add comment for documentation
COMMENT ON COLUMN audit_logs.branch_id IS 'ID of the warehouse/branch where the operation occurred';

-- Update existing records to have a default branch_id (optional)
-- You may want to set this to a specific warehouse ID or leave as NULL
-- UPDATE audit_logs SET branch_id = 'your-default-warehouse-id' WHERE branch_id IS NULL;