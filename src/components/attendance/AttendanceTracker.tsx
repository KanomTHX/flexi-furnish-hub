import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, CheckCircle, XCircle, User } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { AttendanceRecord } from '@/types/employees';

interface AttendanceTrackerProps {
  employeeId?: string; // ถ้าไม่ระบุจะใช้พนักงานปัจจุบัน
}

export default function AttendanceTracker({ employeeId }: AttendanceTrackerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { 
    employees, 
    attendanceRecords, 
    checkIn, 
    checkOut,
    getAttendanceByEmployee,
    loading 
  } = useEmployees();
  
  // ใช้พนักงานคนแรกถ้าไม่ระบุ employeeId
  const currentEmployeeId = employeeId || employees[0]?.id;
  const employee = employees.find(emp => emp.id === currentEmployeeId);

  // ข้อมูลการเข้างานวันนี้
  const todayAttendance = attendanceRecords.find(record => 
    record.employeeId === currentEmployeeId && 
    record.date === format(new Date(), 'yyyy-MM-dd')
  );

  const isCheckedIn = todayAttendance?.checkIn;
  const isCheckedOut = todayAttendance?.checkOut;

  // อัปเดตเวลาทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ขอตำแหน่งที่ตั้ง
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('ไม่สามารถระบุตำแหน่งได้: ' + error.message);
        }
      );
    } else {
      setLocationError('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง');
    }
  }, []);

  const handleCheckIn = async () => {
    if (!location) {
      alert('กรุณาอนุญาตการเข้าถึงตำแหน่งก่อนลงเวลาเข้างาน');
      return;
    }

    try {
      await checkIn(currentEmployeeId, {
        latitude: location.lat,
        longitude: location.lng
      });
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      alert('กรุณาอนุญาตการเข้าถึงตำแหน่งก่อนลงเวลาออกงาน');
      return;
    }

    try {
      await checkOut(currentEmployeeId, {
        latitude: location.lat,
        longitude: location.lng
      });
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          ลงเวลาเข้า-ออกงาน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ข้อมูลพนักงาน */}
        <div className="text-center">
          <h3 className="font-semibold">{employee?.firstName} {employee?.lastName}</h3>
          <p className="text-sm text-muted-foreground">{employee?.position}</p>
        </div>

        {/* เวลาปัจจุบัน */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold">
            {format(currentTime, 'HH:mm:ss', { locale: th })}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(currentTime, 'EEEE, d MMMM yyyy', { locale: th })}
          </div>
        </div>

        {/* สถานะตำแหน่ง */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          {location ? (
            <span className="text-green-600">ระบุตำแหน่งแล้ว</span>
          ) : (
            <span className="text-red-600">กำลังระบุตำแหน่ง...</span>
          )}
        </div>

        {locationError && (
          <Alert variant="destructive">
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {/* สถานะการเข้างานวันนี้ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">สถานะวันนี้:</span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isCheckedIn && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      เข้างาน: {format(new Date(`${todayAttendance.date}T${todayAttendance.checkIn}`), 'HH:mm', { locale: th })}
                    </span>
                  </div>
                )}
                
                {isCheckedOut && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">
                      ออกงาน: {format(new Date(`${todayAttendance.date}T${todayAttendance.checkOut}`), 'HH:mm', { locale: th })}
                    </span>
                  </div>
                )}
                
                {!isCheckedIn && !isCheckedOut && (
                  <Badge variant="outline">ยังไม่ได้เข้างาน</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ปุ่มลงเวลา */}
        <div className="space-y-3">
          {!isCheckedIn && (
            <Button 
              onClick={handleCheckIn}
              disabled={loading || !location}
              className="w-full"
              size="lg"
            >
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'กำลังบันทึก...' : 'ลงเวลาเข้างาน'}
            </Button>
          )}
          
          {isCheckedIn && !isCheckedOut && (
            <Button 
              onClick={handleCheckOut}
              disabled={loading || !location}
              className="w-full"
              variant="destructive"
              size="lg"
            >
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'กำลังบันทึก...' : 'ลงเวลาออกงาน'}
            </Button>
          )}
          
          {isCheckedOut && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                ✅ เสร็จสิ้นการทำงานแล้ว
              </Badge>
            </div>
          )}
        </div>

        {/* ประวัติการเข้างาน 7 วันล่าสุด */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            ประวัติ 7 วันล่าสุด
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {getAttendanceByEmployee(currentEmployeeId)
              .slice(0, 7)
              .map((record) => (
                <div key={record.date} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                  <span>{format(new Date(record.date), 'dd/MM', { locale: th })}</span>
                  <div className="flex gap-2">
                    {record.checkIn && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs">
                          {format(new Date(`${record.date}T${record.checkIn}`), 'HH:mm')}
                        </span>
                      </div>
                    )}
                    
                    {record.checkOut && (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-blue-600" />
                        <span className="text-xs">
                          {format(new Date(`${record.date}T${record.checkOut}`), 'HH:mm')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {locationError && (
          <Alert variant="destructive">
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}