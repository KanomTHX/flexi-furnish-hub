import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Maximize2,
  RefreshCw
} from "lucide-react";
import { cn } from '@/lib/utils';
import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { SimpleBarChart, SimpleLineChart, SimplePieChart, SimpleAreaChart } from '@/components/charts/SimpleCharts';

interface InteractiveChartsProps {
  branchId?: string;
}

function ChartCard({ 
  title, 
  description, 
  children, 
  onExpand, 
  onRefresh, 
  loading 
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onExpand?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            )}
            {onExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export function InteractiveCharts({ branchId }: InteractiveChartsProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('bar');
  
  const { salesData, productCategories, customerSegments, inventoryData, loading, error, refresh } = useDashboardCharts(branchId, timeRange);

  const handleRefresh = () => {
    refresh();
  };

  const handleExport = () => {
    // Create CSV data for export
    const csvData = [
      ['วันที่', 'ยอดขาย'],
      ...salesData.daily.map(item => [item.date, item.value.toString()])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-data-${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Render chart based on type
  const renderChart = (data: any, type: string, height: number = 350) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto text-gray-400 mb-2 animate-spin" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-red-500">
            <p>เกิดข้อผิดพลาด: {error}</p>
          </div>
        </div>
      );
    }

    switch (type) {
      case 'line':
        return <SimpleLineChart data={data} height={height} color="#3B82F6" />;
      case 'area':
        return <SimpleAreaChart data={data} height={height} color="#10B981" />;
      case 'bar':
      default:
        return <SimpleBarChart data={data} height={height} color="#3B82F6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">กราฟวิเคราะห์ข้อมูล</h2>
          <p className="text-gray-600 text-sm mt-1">
            แผนภูมิและกราฟแสดงข้อมูลธุรกิจแบบโต้ตอบได้
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 วัน</SelectItem>
              <SelectItem value="30d">30 วัน</SelectItem>
              <SelectItem value="6m">6 เดือน</SelectItem>
            </SelectContent>
          </Select>

          {/* Chart Type Selector */}
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-32">
              <BarChart3 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>แท่ง</span>
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center space-x-2">
                  <LineChart className="h-4 w-4" />
                  <span>เส้น</span>
                </div>
              </SelectItem>
              <SelectItem value="area">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>พื้นที่</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออก</span>
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="ยอดขายรายวัน"
            description={`ข้อมูลยอดขายใน${timeRange === '7d' ? '7 วันที่ผ่านมา' : timeRange === '30d' ? '30 วันที่ผ่านมา' : '6 เดือนที่ผ่านมา'}`}
            onRefresh={handleRefresh}
            loading={loading}
          >
            {renderChart(salesData.daily, chartType, 350)}
            
            {/* Sales Summary */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(salesData.totalSales)}
                </div>
                <div className="text-sm text-gray-600">ยอดขายรวม</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesData.averageSales)}
                </div>
                <div className="text-sm text-gray-600">ยอดขายเฉลี่ย</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 flex items-center justify-center">
                  {salesData.growth >= 0 ? (
                    <TrendingUp className="h-5 w-5 mr-1" />
                  ) : (
                    <TrendingDown className="h-5 w-5 mr-1" />
                  )}
                  {salesData.growth.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">เติบโต</div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Product Categories */}
        <ChartCard
          title="หมวดหมู่สินค้า"
          description="สัดส่วนการขายตามหมวดหมู่"
          onRefresh={handleRefresh}
          loading={loading}
        >
          <SimplePieChart data={productCategories} height={250} showLegend={true} />
        </ChartCard>

        {/* Customer Segments */}
        <ChartCard
          title="กลุ่มลูกค้า"
          description="การแบ่งกลุ่มลูกค้าตามประเภท"
          onRefresh={handleRefresh}
          loading={loading}
        >
          <SimpleBarChart 
            data={customerSegments.map(segment => ({
              date: segment.segment,
              value: segment.count,
              label: segment.segment
            }))}
            height={250}
            color="#10B981"
          />
        </ChartCard>
      </div>

      {/* Inventory Overview */}
      <ChartCard
        title="ภาพรวมสินค้าคงคลัง"
        description="มูลค่าสินค้าคงคลังแยกตามคลังสินค้า"
        onRefresh={handleRefresh}
        loading={loading}
      >
        <SimpleBarChart 
          data={inventoryData.map(item => ({
            date: item.warehouse,
            value: item.value,
            label: item.warehouse
          }))}
          height={300}
          color="#F59E0B"
        />
      </ChartCard>
    </div>
  );
}

export default InteractiveCharts;