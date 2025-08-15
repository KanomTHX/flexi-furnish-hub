// Auth Manager - จัดการ JWT และการ refresh token
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import { AuthenticationError, handleError } from './errorHandler';

export class AuthManager {
  private static refreshPromise: Promise<any> | null = null;

  /**
   * ตรวจสอบสถานะ JWT
   */
  static async checkJWTStatus(): Promise<{
    isValid: boolean;
    expiresAt?: Date;
    timeUntilExpiry?: number;
    needsRefresh: boolean;
  }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return {
          isValid: false,
          needsRefresh: true
        };
      }

      const token = session.access_token;
      if (!token) {
        return {
          isValid: false,
          needsRefresh: true
        };
      }

      // Decode JWT to check expiry
      const payload = this.decodeJWT(token);
      if (!payload || !payload.exp) {
        return {
          isValid: false,
          needsRefresh: true
        };
      }

      const expiresAt = new Date(payload.exp * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      // ถือว่า token หมดอายุถ้าเหลือเวลาน้อยกว่า 5 นาที
      const needsRefresh = timeUntilExpiry < 5 * 60 * 1000;
      const isValid = timeUntilExpiry > 0;

      return {
        isValid,
        expiresAt,
        timeUntilExpiry,
        needsRefresh
      };
    } catch (error) {
      logger.error('Error checking JWT status', error instanceof Error ? error : new Error(String(error)));
      return {
        isValid: false,
        needsRefresh: true
      };
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(): Promise<{
    success: boolean;
    error?: string;
    session?: any;
  }> {
    try {
      // ป้องกันการ refresh หลายครั้งพร้อมกัน
      if (this.refreshPromise) {
        return await this.refreshPromise;
      }

      this.refreshPromise = this.performRefresh();
      const result = await this.refreshPromise;
      this.refreshPromise = null;
      
      return result;
    } catch (error) {
      this.refreshPromise = null;
      const authError = error instanceof Error ? error : new Error(String(error));
      logger.error('Error refreshing token', authError);
      return {
        success: false,
        error: authError.message
      };
    }
  }

  /**
   * ทำการ refresh token จริง
   */
  private static async performRefresh(): Promise<{
    success: boolean;
    error?: string;
    session?: any;
  }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('No session returned after refresh');
      }

      return {
        success: true,
        session: data.session
      };
    } catch (error) {
      console.error('Error performing token refresh:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh token'
      };
    }
  }

  /**
   * ลงชื่อเข้าใช้ด้วย Service Role (สำหรับ admin operations)
   */
  static async signInWithServiceRole(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // ใช้ service role key สำหรับการดำเนินการที่ต้องการสิทธิ์สูง
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (!serviceRoleKey) {
        throw new Error('Service role key not configured');
      }

      // สร้าง client ใหม่ด้วย service role
      const { createClient } = await import('@supabase/supabase-js');
      const serviceClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        serviceRoleKey
      );

      // ทดสอบการเชื่อมต่อ
      const { error } = await serviceClient
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing in with service role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Service role authentication failed'
      };
    }
  }

  /**
   * ลงชื่อเข้าใช้แบบ Anonymous
   */
  static async signInAnonymously(): Promise<{
    success: boolean;
    error?: string;
    session?: any;
  }> {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        throw error;
      }

      return {
        success: true,
        session: data.session
      };
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Anonymous sign in failed'
      };
    }
  }

  /**
   * ลงชื่อออก
   */
  static async signOut(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  }

  /**
   * ตรวจสอบและ refresh token อัตโนมัติ
   */
  static async ensureValidToken(): Promise<{
    success: boolean;
    error?: string;
    refreshed?: boolean;
  }> {
    try {
      const status = await this.checkJWTStatus();
      
      if (!status.isValid) {
        // Token หมดอายุแล้ว ลองทำการ refresh
        const refreshResult = await this.refreshToken();
        
        if (!refreshResult.success) {
          // Refresh ไม่สำเร็จ ลองลงชื่อเข้าใช้ใหม่
          const anonResult = await this.signInAnonymously();
          
          if (!anonResult.success) {
            return {
              success: false,
              error: 'Failed to refresh token and anonymous sign in failed'
            };
          }
          
          return {
            success: true,
            refreshed: true
          };
        }
        
        return {
          success: true,
          refreshed: true
        };
      }
      
      if (status.needsRefresh) {
        // Token ใกล้หมดอายุ ทำการ refresh เพื่อป้องกัน
        const refreshResult = await this.refreshToken();
        
        return {
          success: true,
          refreshed: refreshResult.success
        };
      }
      
      return {
        success: true,
        refreshed: false
      };
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  /**
   * Decode JWT token (แบบง่าย)
   */
  private static decodeJWT(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * ตั้งค่า Auto Refresh
   */
  static setupAutoRefresh(): () => void {
    let intervalId: NodeJS.Timeout;

    const checkAndRefresh = async () => {
      try {
        const status = await this.checkJWTStatus();
        
        if (status.needsRefresh && status.isValid) {
          console.log('Auto refreshing token...');
          await this.refreshToken();
        }
      } catch (error) {
        console.error('Error in auto refresh:', error);
      }
    };

    // ตรวจสอบทุก 4 นาที
    intervalId = setInterval(checkAndRefresh, 4 * 60 * 1000);

    // ตรวจสอบทันทีเมื่อเริ่มต้น
    checkAndRefresh();

    // Return cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }

  /**
   * สร้าง Supabase client ที่มี auto refresh
   */
  static async createAuthenticatedClient() {
    await this.ensureValidToken();
    return supabase;
  }

  /**
   * Wrapper สำหรับ database operations ที่จัดการ JWT อัตโนมัติ
   */
  static async withAuth<T>(operation: () => Promise<T>): Promise<T> {
    try {
      // ตรวจสอบและ refresh token ก่อน
      const tokenResult = await this.ensureValidToken();
      
      if (!tokenResult.success) {
        throw new Error(`Authentication failed: ${tokenResult.error}`);
      }

      // ทำการ operation
      return await operation();
    } catch (error) {
      // ถ้าเกิด JWT expired error ลองทำการ refresh และลองใหม่
      if (error instanceof Error && error.message.includes('jwt expired')) {
        console.log('JWT expired during operation, attempting refresh...');
        
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          // ลองทำ operation อีกครั้ง
          return await operation();
        }
      }
      
      throw error;
    }
  }
}

export default AuthManager;