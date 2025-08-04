import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useSupabaseConnection } from '@/hooks/useSupabaseQuery';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export function ConnectionStatus({ className, showText = true }: ConnectionStatusProps) {
  const { data: connection, isLoading } = useSupabaseConnection();

  if (isLoading) {
    return (
      <Badge variant="secondary" className={cn("animate-pulse", className)}>
        <AlertCircle className="w-3 h-3 mr-1" />
        {showText && "กำลังตรวจสอบ..."}
      </Badge>
    );
  }

  const isConnected = connection?.connected ?? false;

  return (
    <Badge 
      variant={isConnected ? "default" : "destructive"} 
      className={cn(
        "transition-all duration-200",
        isConnected ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600",
        className
      )}
    >
      {isConnected ? (
        <CheckCircle className="w-3 h-3 mr-1" />
      ) : (
        <WifiOff className="w-3 h-3 mr-1" />
      )}
      {showText && (isConnected ? "เชื่อมต่อแล้ว" : "ขาดการเชื่อมต่อ")}
    </Badge>
  );
}

// Detailed connection info component
export function ConnectionDetails() {
  const { data: connection, isLoading, error } = useSupabaseConnection();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        <span>กำลังตรวจสอบการเชื่อมต่อ...</span>
      </div>
    );
  }

  const isConnected = connection?.connected ?? false;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span className={cn(
          "text-sm font-medium",
          isConnected ? "text-green-700" : "text-red-700"
        )}>
          {isConnected ? "เชื่อมต่อฐานข้อมูลสำเร็จ" : "ไม่สามารถเชื่อมต่อฐานข้อมูลได้"}
        </span>
      </div>
      
      {!isConnected && connection?.error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          <strong>ข้อผิดพลาด:</strong> {connection.error}
        </div>
      )}
      
      {isConnected && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
          ✅ ระบบพร้อมใช้งาน - ข้อมูลจะอัปเดตแบบ real-time
        </div>
      )}
    </div>
  );
}

// Hook for connection-dependent features
export function useConnectionAware() {
  const { data: connection } = useSupabaseConnection();
  const isConnected = connection?.connected ?? false;

  return {
    isConnected,
    isOffline: !isConnected,
    showOfflineMessage: () => ({
      title: "ไม่มีการเชื่อมต่อ",
      description: "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
      variant: "destructive" as const
    })
  };
}