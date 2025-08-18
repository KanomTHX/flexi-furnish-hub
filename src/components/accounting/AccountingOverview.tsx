import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AccountingSummary } from '@/types/accounting';
import { formatCurrency } from '@/utils/accountingHelpers';
import { FinancialDashboard } from './FinancialDashboard';
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
      {/* Enhanced Financial Dashboard */}
      <FinancialDashboard summary={summary} />

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