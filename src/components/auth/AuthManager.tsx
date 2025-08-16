// Auth Manager Component - จัดการการยืนยันตัวตนและ JWT
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Key,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AuthManager } from '@/utils/authManager';

export function AuthManagerComponent() {
  const [loading, setLoading] = useState(false);
  const [jwtStatus, setJwtStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ตรวจสอบสถานะ JWT
  const checkJWTStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const status = await AuthManager.checkJWTStatus();
      setJwtStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบ JWT');
    } finally {
      setLoading(false);
    }
  };

  // Refresh token
  const refreshToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthManager.refreshToken();
      
      if (result.success) {
        setLastRefresh(new Date());
        await checkJWTStatus();
      } else {
        setError(result.error || 'ไม่สามารถ refresh token ได้');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการ refresh token');
    } finally {
      setLoading(false);
    }
  };

  // ลงชื่อเข้าใช้แบบ Anonymous
  const signInAnonymously = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthManager.signInAnonymously();
      
      if (result.success) {
        await checkJWTStatus();
      } else {
        setError(result.error || 'ไม่สามารถลงชื่อเข้าใช้ได้');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้');
    } finally {
      setLoading(false);
    }
  };

  // ลงชื่อออก
  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthManager.signOut();
      
      if (result.success) {
        setJwtStatus(null);
        setLastRefresh(null);
      } else {
        setError(result.error || 'ไม่สามารถลงชื่อออกได้');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลงชื่อออก');
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh setup
  useEffect(() => {
    const cleanup = AuthManager.setupAutoRefresh();
    checkJWTStatus();
    
    return cleanup;
  }, []);

  // Format time
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Format duration
  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} วัน ${hours % 24} ชั่วโมง`;
    if (hours > 0) return `${hours} ชั่วโมง ${minutes % 60} นาที`;
    if (minutes > 0) return `${minutes} นาที`;
    return 'น้อยกว่า 1 นาที';
  };

  // Get status color
  const getStatusColor = () => {
    if (!jwtStatus) return 'text-gray-500';
    if (!jwtStatus.isValid) return 'text-red-600';
    if (jwtStatus.needsRefresh) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!jwtStatus) return <Shield className="h-5 w-5 text-gray-500" />;
    if (!jwtStatus.isValid) return <XCircle className="h-5 w-5 text-red-600" />;
    if (jwtStatus.needsRefresh) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  // Get status text
  const getStatusText = () => {
    if (!jwtStatus) return 'ไม่ทราบสถานะ';
    if (!jwtStatus.isValid) return 'Token หมดอายุ';
    if (jwtStatus.needsRefresh) return 'ต้องการ Refresh';
    return 'Token ใช้งานได้';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Authentication Manager</h2>
          <p className="text-muted-foreground">จัดการ JWT Token และการยืนยันตัวตน</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={checkJWTStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            ตรวจสอบ
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* JWT Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            JWT Token Status
          </CardTitle>
          <CardDescription>สถานะปัจจุบันของ JWT Token</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>กำลังตรวจสอบ...</p>
            </div>
          ) : jwtStatus ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge variant={jwtStatus.isValid ? (jwtStatus.needsRefresh ? 'secondary' : 'default') : 'destructive'}>
                  {getStatusText()}
                </Badge>
                {jwtStatus.isValid && (
                  <span className={`text-sm ${getStatusColor()}`}>
                    ใช้งานได้
                  </span>
                )}
              </div>

              {/* Token Details */}
              {jwtStatus.expiresAt && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">หมดอายุ:</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {formatTime(jwtStatus.expiresAt)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">เวลาที่เหลือ:</span>
                    </div>
                    <p className={`text-sm ml-6 ${getStatusColor()}`}>
                      {jwtStatus.timeUntilExpiry > 0 
                        ? formatDuration(jwtStatus.timeUntilExpiry)
                        : 'หมดอายุแล้ว'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {jwtStatus.timeUntilExpiry && jwtStatus.timeUntilExpiry > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Token Validity</span>
                    <span>{Math.max(0, Math.min(100, (jwtStatus.timeUntilExpiry / (24 * 60 * 60 * 1000)) * 100)).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.max(0, Math.min(100, (jwtStatus.timeUntilExpiry / (24 * 60 * 60 * 1000)) * 100))}
                    className="h-2"
                  />
                </div>
              )}

              {/* Last Refresh */}
              {lastRefresh && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh ล่าสุด: {formatTime(lastRefresh)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่มีข้อมูล JWT Token</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Refresh Token</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              ต่ออายุ JWT Token ที่มีอยู่
            </p>
            <Button 
              onClick={refreshToken} 
              disabled={loading || !jwtStatus?.isValid}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-green-600" />
                <span className="font-medium">Anonymous Login</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              ลงชื่อเข้าใช้แบบไม่ระบุตัวตน
            </p>
            <Button 
              onClick={signInAnonymously} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-red-600" />
                <span className="font-medium">Sign Out</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              ลงชื่อออกจากระบบ
            </p>
            <Button 
              onClick={signOut} 
              disabled={loading || !jwtStatus?.isValid}
              className="w-full"
              variant="outline"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* JWT Expired Help */}
      {jwtStatus && !jwtStatus.isValid && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              JWT Token หมดอายุ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                JWT Token ของคุณหมดอายุแล้ว ซึ่งอาจเป็นสาเหตุของ Error: jwt expired
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium">วิธีแก้ไข:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>คลิก "Refresh" เพื่อต่ออายุ Token</li>
                  <li>หากไม่สำเร็จ ให้คลิก "Sign In" เพื่อลงชื่อเข้าใช้ใหม่</li>
                  <li>ตรวจสอบการตั้งค่า Supabase ใน .env.local</li>
                  <li>ลองรัน SQL อีกครั้งหลังจากแก้ไข Token</li>
                </ol>
              </div>

              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  ระบบจะทำการ Auto Refresh Token ทุก 4 นาทีเพื่อป้องกันปัญหานี้
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}