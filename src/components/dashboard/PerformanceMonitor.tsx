import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Zap, Wifi, HardDrive } from "lucide-react";
import { usePerformance } from "@/hooks/usePerformance";

interface PerformanceMonitorProps {
  showDetails?: boolean;
}

export function PerformanceMonitor({ showDetails = false }: PerformanceMonitorProps) {
  const metrics = usePerformance('PerformanceMonitor');
  const [memoryInfo, setMemoryInfo] = React.useState<any>(null);

  React.useEffect(() => {
    // Get memory info if available
    if ((performance as any).memory) {
      setMemoryInfo((performance as any).memory);
    }
  }, []);

  if (!metrics && !showDetails) return null;

  const getPerformanceStatus = (loadTime: number) => {
    if (loadTime < 1000) return { status: 'excellent', color: 'bg-green-500', text: 'ดีเยี่ยม' };
    if (loadTime < 2000) return { status: 'good', color: 'bg-blue-500', text: 'ดี' };
    if (loadTime < 3000) return { status: 'fair', color: 'bg-yellow-500', text: 'พอใช้' };
    return { status: 'poor', color: 'bg-red-500', text: 'ช้า' };
  };

  const getMemoryUsage = () => {
    if (!memoryInfo) return 0;
    return Math.round((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100);
  };

  if (!showDetails) {
    // Compact view for development
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs font-mono">
        {metrics && (
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3" />
            <span>Load: {metrics.loadTime}ms</span>
            <span>Render: {metrics.renderTime}ms</span>
            {metrics.isSlowConnection && (
              <Badge variant="destructive" className="text-xs">Slow</Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Performance Monitor</span>
        </CardTitle>
        <CardDescription>
          ตรวจสอบประสิทธิภาพการทำงานของระบบ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics && (
          <>
            {/* Load Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">เวลาโหลด</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{metrics.loadTime}ms</span>
                  <Badge 
                    variant="secondary" 
                    className={getPerformanceStatus(metrics.loadTime).color + " text-white"}
                  >
                    {getPerformanceStatus(metrics.loadTime).text}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={Math.min((metrics.loadTime / 3000) * 100, 100)} 
                className="h-2"
              />
            </div>

            {/* Render Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">เวลา Render</span>
                </div>
                <span className="text-sm">{metrics.renderTime}ms</span>
              </div>
              <Progress 
                value={Math.min((metrics.renderTime / 100) * 100, 100)} 
                className="h-2"
              />
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">การเชื่อมต่อ</span>
              </div>
              <Badge variant={metrics.isSlowConnection ? "destructive" : "default"}>
                {metrics.isSlowConnection ? "ช้า" : "ปกติ"}
              </Badge>
            </div>

            {/* Memory Usage */}
            {memoryInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-sm font-medium">หน่วยความจำ</span>
                  </div>
                  <span className="text-sm">
                    {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / 
                    {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                <Progress 
                  value={getMemoryUsage()} 
                  className="h-2"
                />
              </div>
            )}
          </>
        )}

        {/* Performance Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 เคล็ดลับประสิทธิภาพ</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• ปิดแท็บที่ไม่ใช้เพื่อประหยัดหน่วยความจำ</li>
            <li>• รีเฟรชหน้าเว็บหากทำงานช้า</li>
            <li>• ใช้ Chrome หรือ Firefox เวอร์ชันล่าสุด</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}