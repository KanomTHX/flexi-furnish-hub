import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Building2,
  Briefcase,
  Calendar,
  Award
} from 'lucide-react';
import { EmployeeAnalytics as AnalyticsType } from '@/types/employees';

interface EmployeeAnalyticsProps {
  analytics: AnalyticsType;
}

export const EmployeeAnalytics: React.FC<EmployeeAnalyticsProps> = ({ analytics }) => {
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Prepare data for department chart
  const departmentData = analytics.departmentBreakdown.map(dept => ({
    name: dept.departmentName,
    employees: dept.employeeCount,
    salary: dept.averageSalary,
    utilization: dept.utilizationRate
  }));

  // Prepare data for position chart
  const positionData = analytics.positionBreakdown.map(pos => ({
    name: pos.positionName,
    employees: pos.employeeCount,
    salary: pos.averageSalary,
    vacancies: pos.vacancies
  }));

  // Prepare data for age distribution pie chart
  const ageData = analytics.ageDistribution.map(age => ({
    name: age.range,
    value: age.count,
    percentage: age.percentage
  }));

  // Prepare data for tenure distribution
  const tenureData = analytics.tenureDistribution.map(tenure => ({
    name: tenure.range,
    value: tenure.count,
    percentage: tenure.percentage
  }));

  // Prepare data for performance distribution
  const performanceData = analytics.performanceDistribution.map(perf => ({
    name: perf.rating,
    value: perf.count,
    percentage: perf.percentage
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  พนักงานทั้งหมด
                </p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{analytics.totalEmployees}</p>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    +{analytics.newHires} ใหม่
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  อัตราการมาทำงาน
                </p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{analytics.attendanceRate}%</p>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    เดือนนี้
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-50">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  เงินเดือนเฉลี่ย
                </p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">
                    ฿{analytics.averageSalary.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  อัตราการลาออก
                </p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{analytics.turnoverRate}%</p>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    ปีนี้
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              การกระจายตามแผนก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'employees' ? `${value} คน` : 
                      name === 'salary' ? `฿${Number(value).toLocaleString()}` :
                      `${value}%`,
                      name === 'employees' ? 'จำนวนพนักงาน' :
                      name === 'salary' ? 'เงินเดือนเฉลี่ย' :
                      'อัตราการใช้งาน'
                    ]}
                  />
                  <Bar dataKey="employees" fill="#0088FE" name="employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {analytics.departmentBreakdown.map((dept, index) => (
                <div key={dept.departmentId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.departmentName}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{dept.employeeCount} คน</Badge>
                    <span className="text-muted-foreground">
                      ฿{dept.averageSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              การกระจายตามอายุ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} คน`, 'จำนวน']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {analytics.ageDistribution.map((age, index) => (
                <div key={age.range} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{age.range} ปี</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{age.count} คน</span>
                    <Badge variant="secondary">{age.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Position Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              การกระจายตามตำแหน่ง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.positionBreakdown.map((pos, index) => (
                <div key={pos.positionId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{pos.positionName}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{pos.employeeCount} คน</Badge>
                      {pos.vacancies > 0 && (
                        <Badge variant="destructive">{pos.vacancies} ตำแหน่งว่าง</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>เงินเดือนเฉลี่ย: ฿{pos.averageSalary.toLocaleString()}</span>
                    <Progress 
                      value={(pos.employeeCount / (pos.employeeCount + pos.vacancies)) * 100} 
                      className="w-20 h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tenure Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              การกระจายตามอายุงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.tenureDistribution.map((tenure, index) => (
                <div key={tenure.range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tenure.range}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{tenure.count} คน</span>
                      <Badge variant="secondary">{tenure.percentage}%</Badge>
                    </div>
                  </div>
                  <Progress value={tenure.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            การกระจายตามผลการปฏิบัติงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {analytics.performanceDistribution.map((perf, index) => (
              <div key={perf.rating} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">{perf.count}</div>
                <div className="text-sm text-muted-foreground mb-2">{perf.rating}</div>
                <Progress value={perf.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">{perf.percentage}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปข้อมูลสำคัญ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalEmployees}
              </div>
              <div className="text-sm text-muted-foreground">พนักงานทั้งหมด</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.activeEmployees}
              </div>
              <div className="text-sm text-muted-foreground">พนักงานที่ทำงาน</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ฿{analytics.totalPayroll.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">เงินเดือนรวม/เดือน</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.attendanceRate}%
              </div>
              <div className="text-sm text-muted-foreground">อัตราการมาทำงาน</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};