-- Create scan_sessions table
CREATE TABLE IF NOT EXISTS scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  total_scans INTEGER NOT NULL DEFAULT 0,
  successful_scans INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scan_results table
CREATE TABLE IF NOT EXISTS scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  serial_number_id UUID REFERENCES serial_numbers(id) ON DELETE SET NULL,
  product_name TEXT,
  warehouse_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('found', 'not_found', 'error')),
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_sessions_warehouse_id ON scan_sessions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_start_time ON scan_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_session_id ON scan_results(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_barcode ON scan_results(barcode);
CREATE INDEX IF NOT EXISTS idx_scan_results_scanned_at ON scan_results(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_status ON scan_results(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scan_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scan_sessions_updated_at
  BEFORE UPDATE ON scan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_scan_sessions_updated_at();

-- Insert sample data
INSERT INTO scan_sessions (id, warehouse_id, start_time, end_time, total_scans, successful_scans)
SELECT 
  gen_random_uuid(),
  w.id,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '1 hour',
  25,
  23
FROM warehouses w
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample scan results
WITH sample_session AS (
  SELECT id as session_id FROM scan_sessions LIMIT 1
)
INSERT INTO scan_results (session_id, barcode, status, scanned_at)
SELECT 
  s.session_id,
  'SAMPLE-' || generate_series(1, 5),
  CASE 
    WHEN generate_series(1, 5) <= 4 THEN 'found'
    ELSE 'not_found'
  END,
  NOW() - INTERVAL '1 day' + (generate_series(1, 5) * INTERVAL '10 minutes')
FROM sample_session s
ON CONFLICT DO NOTHING;

COMMIT;