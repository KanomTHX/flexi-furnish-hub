import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AccountingSummary } from '@/types/accounting';
import { formatCurrency } from '@/utils/accountingHelpers';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Activity,
  AlertTriangle,
  BarChart3,
  Calculator
} from 'lucide-react';

interface AccountingOverviewProps {
  summary: AccountingSummary;
}

export function AccountingOverview({ summary }: AccountingOverviewProps) {
  const equityRatio = summary.totalAssets > 0 ? (summary.totalEquity / summary.totalAssets) * 100 : 0;
  const profitMargin = summary.totalRevenues > 0 ? (summary.netIncome / summary.totalRevenues) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินทรัพย์รวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalAssets)}
            </div>
            <p className="text-xs text-muted-foreground">
              จากบัญชี {summary.accountsCount} บัญชี
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หนี้สินรวม</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalLiabilities)}
            </div>
            <p className="text-xs text-muted-foreground">
              อัตราส่วนหนี้ต่อทุน {((summary.totalLiabilities / summary.totalEquity) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ส่วนของเจ้าของ</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.totalEquity)}
            </div>
            <p className="text-xs text-muted-foreground">
              อัตราส่วนทุน {equityRatio.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              อัตรากำไร {profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              รายได้และค่าใช้จ่าย
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">รายได้รวม</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(summary.totalRevenues)}
                </span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">ค่าใช้จ่ายรวม</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(summary.totalExpenses)}
                </span>
              </div>
              <Progress 
                value={summary.totalRevenues > 0 ? (summary.totalExpenses / summary.totalRevenues) * 100 : 0} 
                className="h-2" 
              />
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">กำไรสุทธิ</span>
                <span className={`font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netIncome)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              สมการบัญชี
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">สินทรัพย์ = หนี้สิน + ส่วนของเจ้าของ</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(summary.totalAssets)} = {formatCurrency(summary.totalLiabilities)} + {formatCurrency(summary.totalEquity)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalAssets)}
                  </div>
                  <div className="text-xs text-muted-foreground">สินทรัพย์</div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold">=</span>
                </div>
                <div>
                  <div className="text-sm">
                    <div className="text-red-600 font-semibold">
                      {formatCurrency(summary.totalLiabilities)}
                    </div>
                    <div className="text-xs text-muted-foreground">หนี้สิน</div>
                    <div className="text-blue-600 font-semibold mt-1">
                      {formatCurrency(summary.totalEquity)}
                    </div>
                    <div className="text-xs text-muted-foreground">ส่วนของเจ้าของ</div>
                  </div>
                </div>
              </div>

              {/* Balance check */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-center gap-2">
                  {Math.abs(summary.totalAssets - (summary.totalLiabilities + summary.totalEquity)) < 0.01 ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">สมดุล</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 font-medium">ไม่สมดุล</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการรออนุมัติ</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.pendingEntries}
            </div>
            <p className="text-xs text-muted-foreground">
              รายการบัญชีที่รออนุมัติ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ธุรกรรมล่าสุด</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.recentTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              ธุรกรรมใน 7 วันที่ผ่านมา
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บัญชีทั้งหมด</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {summary.accountsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              บัญชีในผังบัญชี
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">สร้างรายการบัญชี</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <Calculator className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">งบทดลอง</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">งบกำไรขาดทุน</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium">งบดุล</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}