import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAccounting } from '@/hooks/useAccounting';
import { AccountingOverview } from '@/components/accounting/AccountingOverview';
import { ChartOfAccounts } from '@/components/accounting/ChartOfAccounts';
import { JournalEntries } from '@/components/accounting/JournalEntries';
import { exportAccountsToCSV, exportJournalEntriesToCSV, exportTransactionsToCSV } from '@/utils/accountingHelpers';
import { 
  Calculator, 
  FileText, 
  BarChart3, 
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  AlertTriangle,
  Activity
} from 'lucide-react';

export default function Accounting() {
  const {
    accounts,
    journalEntries,
    transactions,
    summary,
    accountFilter,
    journalEntryFilter,
    transactionFilter,
    setAccountFilter,
    setJournalEntryFilter,
    setTransactionFilter,
    clearAccountFilter,
    clearJournalEntryFilter,
    clearTransactionFilter,
    createAccount,
    updateAccount,
    deactivateAccount,
    createJournalEntry,
    updateJournalEntry,
    approveJournalEntry,
    rejectJournalEntry,
    createTransaction,
    updateTransactionStatus,
    getPendingJournalEntries,
    getRecentTransactions
  } = useAccounting();

  const { toast } = useToast();

  const handleExportAccounts = () => {
    const csv = exportAccountsToCSV(accounts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `chart-of-accounts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์ผังบัญชีถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportJournalEntries = () => {
    const csv = exportJournalEntriesToCSV(journalEntries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `journal-entries-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายการบัญชีถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportTransactions = () => {
    const csv = exportTransactionsToCSV(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์ธุรกรรมถูกดาวน์โหลดแล้ว",
    });
  };

  const handleApproveJournalEntry = (entryId: string, approvedBy: string) => {
    approveJournalEntry(entryId, approvedBy);
    toast({
      title: "อนุมัติรายการแล้ว",
      description: "รายการบัญชีได้รับการอนุมัติและมีผลแล้ว",
    });
  };

  const handleRejectJournalEntry = (entryId: string) => {
    rejectJournalEntry(entryId);
    toast({
      title: "ปฏิเสธรายการแล้ว",
      description: "รายการบัญชีถูกปฏิเสธ",
      variant: "destructive"
    });
  };

  const handleCreateAccount = (accountData: any) => {
    createAccount(accountData);
    toast({
      title: "สร้างบัญชีสำเร็จ",
      description: "บัญชีใหม่ถูกเพิ่มในผังบัญชีแล้ว",
    });
  };

  const handleCreateJournalEntry = () => {
    toast({
      title: "สร้างรายการบัญชี",
      description: "ฟีเจอร์สร้างรายการบัญชีจะพัฒนาในเวอร์ชันถัดไป",
    });
  };

  const pendingEntries = getPendingJournalEntries();
  const recentTransactions = getRecentTransactions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ระบบบัญชี</h1>
          <p className="text-muted-foreground">
            จัดการบัญชี รายการบัญชี และรายงานทางการเงิน
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingEntries.length > 0 && (
            <Button 
              variant="outline" 
              className="relative"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              รออนุมัติ
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingEntries.length}
              </span>
            </Button>
          )}
          <Button onClick={() => clearAccountFilter()} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            ล้างตัวกรอง
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateJournalEntry}>
            <Plus className="w-4 h-4 mr-2" />
            สร้างรายการบัญชี
          </Button>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {pendingEntries.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">รายการรออนุมัติ ({pendingEntries.length} รายการ)</span>
          </div>
          <div className="space-y-1">
            {pendingEntries.slice(0, 3).map((entry) => (
              <div 
                key={entry.id}
                className="text-sm text-orange-600"
              >
                • {entry.entryNumber}: {entry.description}
              </div>
            ))}
            {pendingEntries.length > 3 && (
              <div className="text-sm text-orange-600">
                และอีก {pendingEntries.length - 3} รายการ
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {recentTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">
                    {recentTransactions.length}
                  </div>
                  <div className="text-sm text-blue-600">ธุรกรรมล่าสุด</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {summary.netIncome >= 0 ? '+' : ''}{(summary.netIncome / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-green-600">กำไรสุทธิ (บาท)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-700">
                    {((summary.totalEquity / summary.totalAssets) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-purple-600">อัตราส่วนทุน</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            ผังบัญชี ({accounts.length})
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            รายการบัญชี ({journalEntries.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            ธุรกรรม ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            รายงาน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AccountingOverview summary={summary} />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <ChartOfAccounts
            accounts={accounts}
            filter={accountFilter}
            onFilterChange={setAccountFilter}
            onExport={handleExportAccounts}
            onCreateAccount={handleCreateAccount}
            onUpdateAccount={updateAccount}
            onDeactivateAccount={deactivateAccount}
          />
        </TabsContent>

        <TabsContent value="journal" className="space-y-6">
          <JournalEntries
            entries={journalEntries}
            accounts={accounts}
            filter={journalEntryFilter}
            onFilterChange={setJournalEntryFilter}
            onExport={handleExportJournalEntries}
            onApprove={handleApproveJournalEntry}
            onReject={handleRejectJournalEntry}
            onCreateEntry={handleCreateJournalEntry}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                ธุรกรรมทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ระบบจัดการธุรกรรมจะพัฒนาในเวอร์ชันถัดไป</p>
                <p className="text-sm mt-2">
                  จะรวมถึงการติดตามธุรกรรม การเชื่อมโยงกับโมดูลอื่น และการรายงาน
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                รายงานทางการเงิน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-6 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-medium mb-2">งบทดลอง</h3>
                  <p className="text-sm text-muted-foreground">
                    แสดงยอดคงเหลือของบัญชีทั้งหมด
                  </p>
                </div>
                
                <div className="text-center p-6 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-medium mb-2">งบกำไรขาดทุน</h3>
                  <p className="text-sm text-muted-foreground">
                    แสดงรายได้ ค่าใช้จ่าย และกำไรสุทธิ
                  </p>
                </div>
                
                <div className="text-center p-6 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-medium mb-2">งบดุล</h3>
                  <p className="text-sm text-muted-foreground">
                    แสดงสินทรัพย์ หนี้สิน และส่วนของเจ้าของ
                  </p>
                </div>
                
                <div className="text-center p-6 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="font-medium mb-2">งบกระแสเงินสด</h3>
                  <p className="text-sm text-muted-foreground">
                    แสดงการเคลื่อนไหวของเงินสด
                  </p>
                </div>
                
                <div className="text-center p-6 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-red-600" />
                  <h3 className="font-medium mb-2">รายงานอายุหนี้</h3>
                  <p className="text-sm text-muted-foreground">
                    วิเคราะห์ลูกหนี้และเจ้าหนี้ตามอายุ
                  </p>
                </div>
                
                <div className="text-center p-6 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                  <h3 className="font-medium mb-2">รายงานกำหนดเอง</h3>
                  <p className="text-sm text-muted-foreground">
                    สร้างรายงานตามความต้องการ
                  </p>
                </div>
              </div>
              
              <div className="mt-8 text-center text-muted-foreground">
                <p>รายงานทางการเงินจะพัฒนาในเวอร์ชันถัดไป</p>
                <p className="text-sm mt-2">
                  จะรวมถึงการสร้างรายงานแบบ real-time และการส่งออกในรูปแบบต่างๆ
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}