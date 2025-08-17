import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ScanResult {
  id: string;
  barcode: string;
  serialNumberId?: string;
  productName?: string;
  warehouseName?: string;
  status: 'found' | 'not_found' | 'error';
  scannedAt: Date;
  action?: string;
}

export interface ScanSession {
  id: string;
  warehouseId: string;
  startTime: Date;
  endTime?: Date;
  totalScans: number;
  successfulScans: number;
  results?: ScanResult[];
}

export const useScanSessions = () => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load scan sessions from database
  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, ensure tables exist
      await createTablesIfNotExist();

      // Load scan sessions with warehouse relationship
      const { data, error } = await supabase
        .from('scan_sessions')
        .select(`
          *,
          warehouse:warehouses(name, code)
        `)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const formattedSessions: ScanSession[] = (data || []).map(session => ({
        id: session.id,
        warehouseId: session.warehouse_id,
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : undefined,
        totalScans: session.total_scans,
        successfulScans: session.successful_scans
      }));

      setSessions(formattedSessions);
    } catch (err) {
      console.error('Error loading scan sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scan sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Create tables if they don't exist
  const createTablesIfNotExist = async () => {
    try {
      // Tables already exist in database, no need to create them
      console.log('Tables scan_sessions and scan_results already exist in database');
    } catch (error) {
      console.warn('Could not verify tables:', error);
    }
  };

  // Start new scan session
  const startSession = async (warehouseId: string): Promise<ScanSession | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('scan_sessions')
        .insert({
          warehouse_id: warehouseId,
          start_time: new Date().toISOString(),
          total_scans: 0,
          successful_scans: 0
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: ScanSession = {
        id: data.id,
        warehouseId: data.warehouse_id,
        startTime: new Date(data.start_time),
        totalScans: 0,
        successfulScans: 0
      };

      setCurrentSession(newSession);
      toast.success('เริ่มเซสชันการสแกนใหม่');
      return newSession;
    } catch (err) {
      console.error('Error starting scan session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start scan session');
      
      // Fallback to local session
      const fallbackSession: ScanSession = {
        id: `local-${Date.now()}`,
        warehouseId,
        startTime: new Date(),
        totalScans: 0,
        successfulScans: 0
      };
      setCurrentSession(fallbackSession);
      toast.success('เริ่มเซสชันการสแกนใหม่ (โหมดออฟไลน์)');
      return fallbackSession;
    } finally {
      setLoading(false);
    }
  };

  // End scan session
  const endSession = async (sessionId: string, results: ScanResult[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const successfulScans = results.filter(r => r.status === 'found').length;

      // Update session
      const { error: sessionError } = await supabase
        .from('scan_sessions')
        .update({
          end_time: new Date().toISOString(),
          total_scans: results.length,
          successful_scans: successfulScans
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Save scan results
      if (results.length > 0) {
        const scanResultsData = results.map(result => ({
          session_id: sessionId,
          barcode: result.barcode,
          serial_number_id: result.serialNumberId || null,
          product_name: result.productName || null,
          warehouse_name: result.warehouseName || null,
          status: result.status,
          scanned_at: result.scannedAt.toISOString(),
          action: result.action || null
        }));

        const { error: resultsError } = await supabase
          .from('scan_results')
          .insert(scanResultsData);

        if (resultsError) throw resultsError;
      }

      setCurrentSession(null);
      await loadSessions(); // Reload sessions
      toast.success(`เซสชันสิ้นสุด: สแกนสำเร็จ ${successfulScans}/${results.length} รายการ`);
    } catch (err) {
      console.error('Error ending scan session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end scan session');
      
      // Fallback: just end the local session
      setCurrentSession(null);
      toast.success(`เซสชันสิ้นสุด (โหมดออฟไลน์): สแกนสำเร็จ ${results.filter(r => r.status === 'found').length}/${results.length} รายการ`);
    } finally {
      setLoading(false);
    }
  };

  // Load scan results for a session
  const loadSessionResults = async (sessionId: string): Promise<ScanResult[]> => {
    try {
      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .eq('session_id', sessionId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(result => ({
        id: result.id,
        barcode: result.barcode,
        serialNumberId: result.serial_number_id,
        productName: result.product_name,
        warehouseName: result.warehouse_name,
        status: result.status as 'found' | 'not_found' | 'error',
        scannedAt: new Date(result.scanned_at),
        action: result.action
      }));
    } catch (err) {
      console.error('Error loading session results:', err);
      return [];
    }
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  return {
    sessions,
    currentSession,
    loading,
    error,
    startSession,
    endSession,
    loadSessions,
    loadSessionResults,
    setCurrentSession
  };
};