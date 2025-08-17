import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  TransferRequestStatus, 
  TransferRequestPriority 
} from '../../types/transfer';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface TransferStats {
  total: number;
  pending: number;
  approved: number;
  inTransit: number;
  completed: number;
  cancelled: number;
  rejected: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  completionRate: number;
  avgProcessingTime: number;
}

interface TransferRequestStatsProps {
  stats: TransferStats;
  loading?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'inTransit':
      return <Truck className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'inTransit':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function TransferRequestStats({ stats, loading = false }: TransferRequestStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statusStats = [
    {
      label: 'รอดำเนินการ',
      value: stats.pending || 0,
      icon: getStatusIcon('pending'),
      color: getStatusColor('pending'),
      percentage: stats.total > 0 ? ((stats.pending || 0) / stats.total * 100).toFixed(1) : '0'
    },
    {
      label: 'อนุมัติแล้ว',
      value: stats.approved || 0,
      icon: getStatusIcon('approved'),
      color: getStatusColor('approved'),
      percentage: stats.total > 0 ? ((stats.approved || 0) / stats.total * 100).toFixed(1) : '0'
    },
    {
      label: 'กำลังขนส่ง',
      value: stats.inTransit || 0,
      icon: getStatusIcon('inTransit'),
      color: getStatusColor('inTransit'),
      percentage: stats.total > 0 ? ((stats.inTransit || 0) / stats.total * 100).toFixed(1) : '0'
    },
    {
      label: 'เสร็จสิ้น',
      value: stats.completed || 0,
      icon: getStatusIcon('completed'),
      color: getStatusColor('completed'),
      percentage: stats.total > 0 ? ((stats.completed || 0) / stats.total * 100).toFixed(1) : '0'
    }
  ];

  const priorityStats = [
    {
      label: 'ความสำคัญสูง',
      value: stats.highPriority || 0,
      color: getPriorityColor('high'),
      icon: <AlertTriangle className="h-4 w-4" />,
      percentage: stats.total > 0 ? ((stats.highPriority || 0) / stats.total * 100).toFixed(1) : '0'
    },
    {
      label: 'ความสำคัญปานกลาง',
      value: stats.mediumPriority || 0,
      color: getPriorityColor('medium'),
      icon: <Clock className="h-4 w-4" />,
      percentage: stats.total > 0 ? ((stats.mediumPriority || 0) / stats.total * 100).toFixed(1) : '0'
    },
    {
      label: 'ความสำคัญต่ำ',
      value: stats.lowPriority || 0,
      color: getPriorityColor('low'),
      icon: <CheckCircle className="h-4 w-4" />,
      percentage: stats.total > 0 ? ((stats.lowPriority || 0) / stats.total * 100).toFixed(1) : '0'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              คำขอทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.total || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              รวมคำขอโอนย้ายทั้งหมด
            </p>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {stats.completionRate >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              อัตราความสำเร็จ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.completionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              คำขอที่เสร็จสิ้นสำเร็จ
            </p>
          </CardContent>
        </Card>

        {/* Average Processing Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              เวลาดำเนินการเฉลี่ย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgProcessingTime || 0).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              วัน (เฉลี่ย)
            </p>
          </CardContent>
        </Card>

        {/* Cancelled/Rejected */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              ยกเลิก/ปฏิเสธ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((stats.cancelled || 0) + (stats.rejected || 0)).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((((stats.cancelled || 0) + (stats.rejected || 0)) / stats.total * 100).toFixed(1)) : '0'}% ของทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">สถานะคำขอ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {stat.icon}
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <Badge className={stat.color} variant="outline">
                    {stat.percentage}%
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${stat.percentage}%`,
                        backgroundColor: stat.color.includes('yellow') ? '#f59e0b' :
                                       stat.color.includes('blue') ? '#3b82f6' :
                                       stat.color.includes('purple') ? '#8b5cf6' :
                                       stat.color.includes('green') ? '#10b981' :
                                       stat.color.includes('red') ? '#ef4444' : '#6b7280'
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Priority Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">ลำดับความสำคัญ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priorityStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {stat.icon}
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <Badge className={stat.color} variant="outline">
                    {stat.percentage}%
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${stat.percentage}%`,
                        backgroundColor: stat.color.includes('red') ? '#ef4444' :
                                       stat.color.includes('yellow') ? '#f59e0b' :
                                       stat.color.includes('green') ? '#10b981' : '#6b7280'
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TransferRequestStats;