-- Create scan_results table without serial_numbers dependency
CREATE TABLE IF NOT EXISTS scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
    barcode VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'found',
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_results_session_id ON scan_results(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_barcode ON scan_results(barcode);
CREATE INDEX IF NOT EXISTS idx_scan_results_status ON scan_results(status);
CREATE INDEX IF NOT EXISTS idx_scan_results_scanned_at ON scan_results(scanned_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_scan_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scan_results_updated_at
    BEFORE UPDATE ON scan_results
    FOR EACH ROW
    EXECUTE FUNCTION update_scan_results_updated_at();

-- Insert sample data
INSERT INTO scan_results (session_id, barcode, status, notes)
SELECT 
    id,
    'SAMPLE-' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
    CASE 
        WHEN ROW_NUMBER() OVER() % 3 = 0 THEN 'not_found'
        ELSE 'found'
    END,
    'Sample scan result'
FROM scan_sessions
LIMIT 5;

COMMIT;