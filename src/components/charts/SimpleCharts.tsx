import React, { memo, useMemo } from 'react';
import { ChartDataPoint, ProductCategoryData, CustomerSegmentData, InventoryData } from '@/hooks/useDashboardCharts';
import { cn } from '@/lib/utils';

interface SimpleBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}

export const SimpleBarChart = memo(function SimpleBarChart({ data, height = 300, color = '#3B82F6', showLabels = true }: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <p>ไม่มีข้อมูลแสดงผล</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = height - 60; // Reserve space for labels

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-center space-x-1 px-4" style={{ height: chartHeight }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (chartHeight - 20) : 0;
          return (
            <div key={index} className="flex flex-col items-center flex-1 max-w-16">
              <div className="relative group">
                <div 
                  className="rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{ 
                    height: `${barHeight}px`,
                    backgroundColor: color,
                    minHeight: item.value > 0 ? '2px' : '0px',
                    width: '100%'
                  }}
                  title={`${item.label || item.date}: ${item.value.toLocaleString('th-TH')}`}
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {item.value.toLocaleString('th-TH')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex justify-center space-x-1 px-4 mt-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 max-w-16 text-center">
              <span className="text-xs text-gray-600 transform -rotate-45 origin-center inline-block">
                {item.label || new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}

export const SimpleLineChart = memo(function SimpleLineChart({ data, height = 300, color = '#3B82F6', showLabels = true }: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <p>ไม่มีข้อมูลแสดงผล</p>
        </div>
      </div>
    );
  }

  const { maxValue, minValue, chartHeight, chartWidth, points, pathData } = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.value));
    const minVal = Math.min(...data.map(d => d.value));
    const cHeight = height - 60;
    const cWidth = 100; // percentage

    const pts = data.map((item, index) => {
      const x = (index / (data.length - 1)) * cWidth;
      const y = maxVal > minVal ? ((maxVal - item.value) / (maxVal - minVal)) * (cHeight - 40) + 20 : cHeight / 2;
      return { x, y, value: item.value, label: item.label || item.date };
    });

    const path = pts.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return {
      maxValue: maxVal,
      minValue: minVal,
      chartHeight: cHeight,
      chartWidth: cWidth,
      points: pts,
      pathData: path
    };
  }, [data, height]);

  return (
    <div className="w-full" style={{ height }}>
      <div className="relative" style={{ height: chartHeight }}>
        <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y * (chartHeight - 40) / 100 + 20}
              x2={chartWidth}
              y2={y * (chartHeight - 40) / 100 + 20}
              stroke="#f3f4f6"
              strokeWidth="0.5"
            />
          ))}
          
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill={color}
                className="hover:r-4 transition-all duration-200 cursor-pointer"
              />
              <title>{`${point.label}: ${point.value.toLocaleString('th-TH')}`}</title>
            </g>
          ))}
        </svg>
      </div>
      {showLabels && (
        <div className="flex justify-between px-4 mt-2">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <span className="text-xs text-gray-600">
                {item.label || new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

interface SimplePieChartProps {
  data: (ProductCategoryData | CustomerSegmentData | InventoryData)[];
  height?: number;
  showLegend?: boolean;
}

export const SimplePieChart = memo(function SimplePieChart({ data, height = 300, showLegend = true }: SimplePieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <p>ไม่มีข้อมูลแสดงผล</p>
        </div>
      </div>
    );
  }

  const { total, radius, centerX, centerY, segments } = useMemo(() => {
    const totalValue = data.reduce((sum, item) => {
      if ('sales' in item) return sum + item.sales;
      if ('count' in item) return sum + item.count;
      if ('value' in item) return sum + item.value;
      return sum;
    }, 0);

    let currentAngle = 0;
    const r = Math.min(height * 0.3, 120);
    const cX = height / 2;
    const cY = height / 2;

    const segs = data.map(item => {
      const value = 'sales' in item ? item.sales : 'count' in item ? item.count : item.value;
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      const angle = (percentage / 100) * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = cX + r * Math.cos(startAngleRad);
      const y1 = cY + r * Math.sin(startAngleRad);
      const x2 = cX + r * Math.cos(endAngleRad);
      const y2 = cY + r * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${cX} ${cY}`,
        `L ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      return {
        ...item,
        value,
        percentage,
        pathData,
        color: item.color
      };
    });

    return {
      total: totalValue,
      radius: r,
      centerX: cX,
      centerY: cY,
      segments: segs
    };
  }, [data, height]);

  return (
    <div className="w-full" style={{ height }}>
      <div className={cn("flex", showLegend ? "space-x-6" : "justify-center")}>
        <div className="flex-shrink-0">
          <svg width={height} height={height} className="overflow-visible">
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                  stroke="white"
                  strokeWidth="2"
                >
                  <title>
                    {('category' in segment ? segment.category : 
                      'segment' in segment ? segment.segment : 
                      'warehouse' in segment ? segment.warehouse : 'ไม่ระบุ')}: {segment.percentage.toFixed(1)}%
                  </title>
                </path>
              </g>
            ))}
          </svg>
        </div>
        
        {showLegend && (
          <div className="flex-1 space-y-2">
            <h4 className="font-medium text-gray-900 mb-3">รายละเอียด</h4>
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {'category' in segment ? segment.category : 
                     'segment' in segment ? segment.segment : 
                     'warehouse' in segment ? segment.warehouse : 'ไม่ระบุ'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {segment.value.toLocaleString('th-TH')} ({segment.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

interface SimpleAreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}

export const SimpleAreaChart = memo(function SimpleAreaChart({ data, height = 300, color = '#3B82F6', showLabels = true }: SimpleAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <p>ไม่มีข้อมูลแสดงผล</p>
        </div>
      </div>
    );
  }

  const { maxValue, minValue, chartHeight, chartWidth, points, pathData, areaPath } = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.value));
    const minVal = Math.min(...data.map(d => d.value));
    const cHeight = height - 60;
    const cWidth = 100;

    const pts = data.map((item, index) => {
      const x = (index / (data.length - 1)) * cWidth;
      const y = maxVal > minVal ? ((maxVal - item.value) / (maxVal - minVal)) * (cHeight - 40) + 20 : cHeight / 2;
      return { x, y, value: item.value, label: item.label || item.date };
    });

    const path = pts.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    const area = `${path} L ${cWidth} ${cHeight - 20} L 0 ${cHeight - 20} Z`;

    return {
      maxValue: maxVal,
      minValue: minVal,
      chartHeight: cHeight,
      chartWidth: cWidth,
      points: pts,
      pathData: path,
      areaPath: area
    };
  }, [data, height]);

  return (
    <div className="w-full" style={{ height }}>
      <div className="relative" style={{ height: chartHeight }}>
        <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y * (chartHeight - 40) / 100 + 20}
              x2={chartWidth}
              y2={y * (chartHeight - 40) / 100 + 20}
              stroke="#f3f4f6"
              strokeWidth="0.5"
            />
          ))}
          
          <path
            d={areaPath}
            fill={`${color}20`}
            className="transition-all duration-300"
          />
          
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill={color}
                className="hover:r-4 transition-all duration-200 cursor-pointer"
              />
              <title>{`${point.label}: ${point.value.toLocaleString('th-TH')}`}</title>
            </g>
          ))}
        </svg>
      </div>
      {showLabels && (
        <div className="flex justify-between px-4 mt-2">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <span className="text-xs text-gray-600">
                {item.label || new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});