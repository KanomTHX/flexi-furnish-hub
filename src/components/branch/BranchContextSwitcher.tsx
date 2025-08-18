import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBranchData } from '../../hooks/useBranchData';
import {
  Building2,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Activity,
  Zap
} from "lucide-react";
import { cn } from '@/lib/utils';

interface BranchContextSwitcherProps {
  className?: string;
  onSwitchComplete?: (branchId: string) => void;
  showSessionInfo?: boolean;
}

export function BranchContextSwitcher({ 
  className, 
  onSwitchComplete,
  showSessionInfo = true 
}: BranchContextSwitcherProps) {
  const {
    currentBranch,
    branches: userAccessibleBranches,
    switchBranch,
    isSwitchingBranch
  } = useBranchData();

  const [selectedBranchId, setSelectedBranchId] = useState(currentBranch?.id || '');
  const [switchingError, setSwitchingError] = useState<string | null>(null);

  const handleSwitchBranch = async (branchId: string) => {
    try {
      setSwitchingError(null);
      await switchBranch(branchId);
      onSwitchComplete?.(branchId);
    } catch (error) {
      setSwitchingError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสาขา');
    }
  };

  const getBranchStatusColor = (branchId: string) => {
    if (branchId === currentBranch?.id) return 'bg-success/10 border-success text-success-foreground';
    return 'bg-muted/50 hover:bg-muted border-border';
  };

  const getSwitchProgress = () => {
    if (!isSwitchingBranch) return 0;
    return 50; // Simple progress indicator
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* การสลับสาขา */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">เปลี่ยนสาขาการทำงาน</CardTitle>
              <CardDescription>
                เลือกสาขาที่ต้องการดูข้อมูลและทำงาน
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar during switching */}
          {isSwitchingBranch && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">กำลังเปลี่ยนสาขา...</span>
                <span className="font-medium">{getSwitchProgress()}%</span>
              </div>
              <Progress value={getSwitchProgress()} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {switchingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{switchingError}</AlertDescription>
            </Alert>
          )}

          {/* Branch Selection Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {userAccessibleBranches.map((branch) => (
              <div
                key={branch.id}
                className={cn(
                  "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                  getBranchStatusColor(branch.id),
                  isSwitchingBranch && "pointer-events-none opacity-50"
                )}
                onClick={() => {
                  if (branch.id !== currentBranch?.id && !isSwitchingBranch) {
                    setSelectedBranchId(branch.id);
                    handleSwitchBranch(branch.id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-foreground">{branch.name}</h3>
                      {branch.id === currentBranch?.id && (
                        <Badge variant="default" className="bg-success text-success-foreground text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ปัจจุบัน
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {typeof branch.address === 'string' ? branch.address : 'ไม่ระบุที่อยู่'}
                    </p>
                  </div>

                  {/* Branch Stats */}
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{branch.stats?.totalEmployees || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>฿{(branch.stats?.monthlyRevenue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Branch Status Indicators */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Activity className={cn(
                        "w-3 h-3",
                        branch.status === 'active' ? "text-success animate-pulse" : "text-muted-foreground"
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {branch.status === 'active' ? 'ออนไลน์' : 'ออฟไลน์'}
                      </span>
                    </div>
                    
                    {Math.floor(Math.random() * 3) > 0 && (
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-warning" />
                        <span className="text-xs text-warning">
                          {Math.floor(Math.random() * 3) + 1} แจ้งเตือน
                        </span>
                      </div>
                    )}
                  </div>

                  {branch.id === currentBranch?.id && (
                    <Zap className="w-4 h-4 text-success" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {userAccessibleBranches.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">ไม่มีสาขาที่สามารถเข้าถึงได้</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Branch Information */}
      {showSessionInfo && currentBranch && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-info" />
              <div>
                <CardTitle className="text-base">ข้อมูลสาขาปัจจุบัน</CardTitle>
                <CardDescription>
                  รายละเอียดสาขาที่กำลังใช้งาน
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">รหัสสาขา:</span>
                <p className="font-medium text-xs font-mono">
                  {currentBranch.id}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">ชื่อสาขา:</span>
                <p className="font-medium">
                  {currentBranch.name}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">ที่อยู่:</span>
                <p className="font-medium">
                  {currentBranch.address.street}, {currentBranch.address.district}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">สถานะ:</span>
                <Badge 
                  variant={currentBranch.status === 'active' ? "default" : "secondary"}
                  className="text-xs"
                >
                  {currentBranch.status === 'active' ? 'เปิดใช้งาน' : 
                   currentBranch.status === 'inactive' ? 'ปิดใช้งาน' : 'ปรับปรุง'}
                </Badge>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2">การดำเนินการล่าสุด</h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">เปลี่ยนสาขาการทำงาน</span>
                <span className="text-muted-foreground">
                  {new Date().toLocaleTimeString('th-TH')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}