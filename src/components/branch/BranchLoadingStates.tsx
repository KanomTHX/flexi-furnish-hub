// Branch-aware Loading States - Phase 1
// Component สำหรับแสดงสถานะการโหลดที่เกี่ยวข้องกับสาขา

import React from 'react';
import { Building2, Users, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';

interface BranchLoadingStatesProps {
  type: 'switching' | 'loading' | 'syncing' | 'error';
  branchName?: string;
  progress?: number;
  message?: string;
  className?: string;
}

export function BranchLoadingStates({ 
  type, 
  branchName, 
  progress, 
  message,
  className = '' 
}: BranchLoadingStatesProps) {
  
  if (type === 'switching') {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="relative">
            <Building2 className="h-12 w-12 mx-auto text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1">
              <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              กำลังเปลี่ยนสาขา
            </h3>
            {branchName && (
              <p className="text-sm text-muted-foreground">
                เปลี่ยนไปยัง: <span className="font-medium text-foreground">{branchName}</span>
              </p>
            )}
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'syncing') {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4 max-w-md">
          <div className="relative">
            <Building2 className="h-12 w-12 mx-auto text-primary" />
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              กำลังซิงค์ข้อมูลสาขา
            </h3>
            {branchName && (
              <p className="text-sm text-muted-foreground">
                กำลังซิงค์ข้อมูลสำหรับ: <span className="font-medium text-foreground">{branchName}</span>
              </p>
            )}
            {progress !== undefined && (
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress}% เสร็จสิ้น
                </p>
              </div>
            )}
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4 max-w-md">
          <div className="relative">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              เกิดข้อผิดพลาด
            </h3>
            <p className="text-sm text-muted-foreground">
              {message || 'ไม่สามารถโหลดข้อมูลสาขาได้ กรุณาลองใหม่อีกครั้ง'}
            </p>
            {branchName && (
              <p className="text-xs text-muted-foreground">
                สาขา: {branchName}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default loading state
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      <div className="text-center space-y-2">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Loading component สำหรับ Branch Stats
export function BranchStatsLoading({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-4 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Loading component สำหรับ Branch List
export function BranchListLoading({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Loading component สำหรับ Branch Dashboard
export function BranchDashboardLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards */}
      <BranchStatsLoading count={4} />

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        
        <Card className="animate-pulse">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Indicator component สำหรับแสดงสถานะ Branch
export function BranchStatusIndicator({ 
  status, 
  size = 'sm',
  showText = true 
}: { 
  status: 'active' | 'inactive' | 'maintenance' | 'syncing' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusConfig = {
    active: { color: 'bg-success', text: 'เปิดใช้งาน', animate: false },
    inactive: { color: 'bg-muted-foreground', text: 'ปิดใช้งาน', animate: false },
    maintenance: { color: 'bg-warning', text: 'ปรับปรุง', animate: true },
    syncing: { color: 'bg-primary', text: 'กำลังซิงค์', animate: true },
    error: { color: 'bg-destructive', text: 'ข้อผิดพลาด', animate: true }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={`
          rounded-full ${config.color} ${sizeClasses[size]}
          ${config.animate ? 'animate-pulse' : ''}
        `}
      />
      {showText && (
        <span className="text-sm text-muted-foreground">
          {config.text}
        </span>
      )}
    </div>
  );
}