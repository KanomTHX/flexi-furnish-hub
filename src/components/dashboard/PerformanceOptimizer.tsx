import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  Activity,
  Clock,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Monitor,
  Gauge
} from "lucide-react";
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  databaseQueries: number;
  cacheHitRate: number;
  errorRate: number;
  fps: number;
}

interface OptimizationSettings {
  enableLazyLoading: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
  enableVirtualization: boolean;
  enablePreloading: boolean;
  enableServiceWorker: boolean;
  batchSize: number;
  refreshInterval: number;
}

interface PerformanceStatus {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  recommendations: string[];
}

function MetricCard({ 
  title, 
  value, 
  unit, 
  status, 
  icon, 
  trend 
}: {
  title: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  icon: React.ReactNode;
  trend?: number;
}) {
  const statusColors = {
    good: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100'
  };

  const statusIcons = {
    good: <CheckCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              {icon}
            </div>
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          
          <div className={cn("flex items-center space-x-1 px-2 py-1 rounded-full text-xs", statusColors[status])}>
            {statusIcons[status]}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-sm text-gray-500 ml-1">{unit}</span>
          </div>
          
          {trend !== undefined && (
            <div className={cn(
              "flex items-center space-x-1 text-sm",
              trend >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OptimizationToggle({ 
  label, 
  description, 
  enabled, 
  onToggle, 
  impact 
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  impact: 'high' | 'medium' | 'low';
}) {
  const impactColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  };

  const impactLabels = {
    high: 'ผลกระทบสูง',
    medium: 'ผลกระทบปานกลาง',
    low: 'ผลกระทบต่ำ'
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-1">
          <h4 className="font-medium">{label}</h4>
          <Badge className={cn("text-xs", impactColors[impact])}>
            {impactLabels[impact]}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="ml-4"
      />
    </div>
  );
}

export function PerformanceOptimizer() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 1.2,
    renderTime: 16.7,
    memoryUsage: 45.2,
    networkLatency: 120,
    databaseQueries: 8,
    cacheHitRate: 85.5,
    errorRate: 0.2,
    fps: 58
  });

  const [settings, setSettings] = useState<OptimizationSettings>({
    enableLazyLoading: true,
    enableCaching: true,
    enableCompression: false,
    enableVirtualization: true,
    enablePreloading: false,
    enableServiceWorker: false,
    batchSize: 50,
    refreshInterval: 5000
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimized, setLastOptimized] = useState<Date | null>(null);

  // Calculate performance status
  const performanceStatus = useMemo((): PerformanceStatus => {
    let score = 0;
    const recommendations: string[] = [];

    // Load time scoring (0-25 points)
    if (metrics.loadTime <= 1) score += 25;
    else if (metrics.loadTime <= 2) score += 20;
    else if (metrics.loadTime <= 3) score += 15;
    else {
      score += 10;
      recommendations.push('ปรับปรุงเวลาโหลดหน้าเว็บ');
    }

    // Memory usage scoring (0-25 points)
    if (metrics.memoryUsage <= 30) score += 25;
    else if (metrics.memoryUsage <= 50) score += 20;
    else if (metrics.memoryUsage <= 70) score += 15;
    else {
      score += 10;
      recommendations.push('ลดการใช้หน่วยความจำ');
    }

    // Network latency scoring (0-25 points)
    if (metrics.networkLatency <= 100) score += 25;
    else if (metrics.networkLatency <= 200) score += 20;
    else if (metrics.networkLatency <= 300) score += 15;
    else {
      score += 10;
      recommendations.push('ปรับปรุงความเร็วเครือข่าย');
    }

    // Cache hit rate scoring (0-25 points)
    if (metrics.cacheHitRate >= 90) score += 25;
    else if (metrics.cacheHitRate >= 80) score += 20;
    else if (metrics.cacheHitRate >= 70) score += 15;
    else {
      score += 10;
      recommendations.push('เพิ่มประสิทธิภาพ Cache');
    }

    let overall: PerformanceStatus['overall'];
    if (score >= 90) overall = 'excellent';
    else if (score >= 75) overall = 'good';
    else if (score >= 60) overall = 'fair';
    else overall = 'poor';

    return { overall, score, recommendations };
  }, [metrics]);

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        loadTime: prev.loadTime + (Math.random() - 0.5) * 0.1,
        renderTime: Math.max(10, prev.renderTime + (Math.random() - 0.5) * 2),
        memoryUsage: Math.max(20, Math.min(80, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        networkLatency: Math.max(50, prev.networkLatency + (Math.random() - 0.5) * 20),
        fps: Math.max(30, Math.min(60, prev.fps + (Math.random() - 0.5) * 5))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleOptimize = useCallback(async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Apply optimizations based on settings
    setMetrics(prev => ({
      ...prev,
      loadTime: settings.enableCaching ? prev.loadTime * 0.8 : prev.loadTime,
      memoryUsage: settings.enableLazyLoading ? prev.memoryUsage * 0.9 : prev.memoryUsage,
      networkLatency: settings.enableCompression ? prev.networkLatency * 0.85 : prev.networkLatency,
      cacheHitRate: settings.enableCaching ? Math.min(95, prev.cacheHitRate + 5) : prev.cacheHitRate
    }));
    
    setLastOptimized(new Date());
    setIsOptimizing(false);
  }, [settings]);

  const handleSettingChange = useCallback((key: keyof OptimizationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const getStatusColor = (status: PerformanceStatus['overall']) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
    }
  };

  const getStatusLabel = (status: PerformanceStatus['overall']) => {
    switch (status) {
      case 'excellent': return 'ยอดเยี่ยม';
      case 'good': return 'ดี';
      case 'fair': return 'พอใช้';
      case 'poor': return 'ต้องปรับปรุง';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ตัวปรับปรุงประสิทธิภาพ</h2>
          <p className="text-gray-600">ตรวจสอบและปรับปรุงประสิทธิภาพของระบบ</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className={cn("text-lg font-bold", getStatusColor(performanceStatus.overall))}>
              {performanceStatus.score}/100
            </div>
            <div className={cn("text-sm", getStatusColor(performanceStatus.overall))}>
              {getStatusLabel(performanceStatus.overall)}
            </div>
          </div>
          
          <Button 
            onClick={handleOptimize} 
            disabled={isOptimizing}
            className="flex items-center space-x-2"
          >
            <Zap className={cn("h-4 w-4", isOptimizing && "animate-spin")} />
            <span>{isOptimizing ? 'กำลังปรับปรุง...' : 'ปรับปรุงทันที'}</span>
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gauge className="h-5 w-5" />
            <span>คะแนนประสิทธิภาพ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>คะแนนรวม</span>
              <span className={cn("font-bold", getStatusColor(performanceStatus.overall))}>
                {performanceStatus.score}/100
              </span>
            </div>
            
            <Progress value={performanceStatus.score} className="h-3" />
            
            {performanceStatus.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">คำแนะนำการปรับปรุง:</h4>
                <ul className="space-y-1">
                  {performanceStatus.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="เวลาโหลด"
          value={parseFloat(metrics.loadTime.toFixed(1))}
          unit="วินาที"
          status={metrics.loadTime <= 2 ? 'good' : metrics.loadTime <= 3 ? 'warning' : 'error'}
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          trend={-5.2}
        />
        
        <MetricCard
          title="การใช้หน่วยความจำ"
          value={parseFloat(metrics.memoryUsage.toFixed(1))}
          unit="MB"
          status={metrics.memoryUsage <= 50 ? 'good' : metrics.memoryUsage <= 70 ? 'warning' : 'error'}
          icon={<MemoryStick className="h-4 w-4 text-green-600" />}
          trend={-2.1}
        />
        
        <MetricCard
          title="ความหน่วงเครือข่าย"
          value={Math.round(metrics.networkLatency)}
          unit="ms"
          status={metrics.networkLatency <= 200 ? 'good' : metrics.networkLatency <= 400 ? 'warning' : 'error'}
          icon={<Wifi className="h-4 w-4 text-purple-600" />}
          trend={8.3}
        />
        
        <MetricCard
          title="อัตรา Cache Hit"
          value={parseFloat(metrics.cacheHitRate.toFixed(1))}
          unit="%"
          status={metrics.cacheHitRate >= 80 ? 'good' : metrics.cacheHitRate >= 60 ? 'warning' : 'error'}
          icon={<Database className="h-4 w-4 text-orange-600" />}
          trend={12.5}
        />
      </div>

      {/* Optimization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>การตั้งค่าการปรับปรุง</span>
          </CardTitle>
          <CardDescription>
            เปิด/ปิดฟีเจอร์การปรับปรุงประสิทธิภาพต่างๆ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <OptimizationToggle
              label="Lazy Loading"
              description="โหลดข้อมูลเมื่อจำเป็นเท่านั้น"
              enabled={settings.enableLazyLoading}
              onToggle={(enabled) => handleSettingChange('enableLazyLoading', enabled)}
              impact="high"
            />
            
            <OptimizationToggle
              label="Caching"
              description="เก็บข้อมูลในแคชเพื่อเพิ่มความเร็ว"
              enabled={settings.enableCaching}
              onToggle={(enabled) => handleSettingChange('enableCaching', enabled)}
              impact="high"
            />
            
            <OptimizationToggle
              label="Data Compression"
              description="บีบอัดข้อมูลเพื่อลดขนาดการส่งผ่าน"
              enabled={settings.enableCompression}
              onToggle={(enabled) => handleSettingChange('enableCompression', enabled)}
              impact="medium"
            />
            
            <OptimizationToggle
              label="Virtualization"
              description="แสดงผลเฉพาะรายการที่มองเห็น"
              enabled={settings.enableVirtualization}
              onToggle={(enabled) => handleSettingChange('enableVirtualization', enabled)}
              impact="medium"
            />
            
            <OptimizationToggle
              label="Preloading"
              description="โหลดข้อมูลล่วงหน้าสำหรับหน้าที่อาจเข้าชม"
              enabled={settings.enablePreloading}
              onToggle={(enabled) => handleSettingChange('enablePreloading', enabled)}
              impact="low"
            />
            
            <OptimizationToggle
              label="Service Worker"
              description="ใช้ Service Worker สำหรับแคชและการทำงานออฟไลน์"
              enabled={settings.enableServiceWorker}
              onToggle={(enabled) => handleSettingChange('enableServiceWorker', enabled)}
              impact="medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>ทรัพยากรระบบ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span>CPU Usage</span>
                </div>
                <span className="font-semibold">23%</span>
              </div>
              <Progress value={23} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-green-600" />
                  <span>RAM Usage</span>
                </div>
                <span className="font-semibold">{metrics.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  <span>Disk Usage</span>
                </div>
                <span className="font-semibold">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>สถิติการทำงาน</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <span>FPS เฉลี่ย</span>
                <span className="font-semibold">{Math.round(metrics.fps)} fps</span>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Database Queries</span>
                <span className="font-semibold">{metrics.databaseQueries}/วินาที</span>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Error Rate</span>
                <span className="font-semibold">{metrics.errorRate}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Render Time</span>
                <span className="font-semibold">{metrics.renderTime.toFixed(1)} ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Optimized */}
      {lastOptimized && (
        <div className="flex items-center justify-center text-sm text-gray-500">
          <RefreshCw className="h-4 w-4 mr-2" />
          ปรับปรุงล่าสุด: {lastOptimized.toLocaleString('th-TH')}
        </div>
      )}
    </div>
  );
}

export default PerformanceOptimizer;