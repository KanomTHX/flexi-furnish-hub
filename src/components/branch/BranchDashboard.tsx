import { useState } from 'react';
import { 
  Building2, 
  Users, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';
import { useBranchData } from '../../hooks/useBranchData';
import { BranchSelector } from './BranchSelector';

export function BranchDashboard() {
  const {
    currentBranch,
    branchSummary,
    selectedBranchesAnalytics,
    selectedBranchIds,
    exportBranchData,
    exportBranchComparison,
    isLoading
  } = useBranchData();

  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            แดชบอร์ดสาขา
          </h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'single' 
              ? `ข้อมูลสาขา: ${currentBranch?.name || 'ไม่ระบุ'}`
              : `เปรียบเทียบ ${selectedBranchIds.length} สาขา`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'single'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              สาขาเดียว
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'comparison'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              เปรียบเทียบ
            </button>
          </div>


          {/* Export Button */}
          <button
            onClick={() => viewMode === 'single' ? exportBranchData() : exportBranchComparison()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออก</span>
          </button>
        </div>
      </div>

      {/* Branch Selector */}
      {showBranchSelector && (
        <div className="bg-white rounded-lg shadow-lg border p-1">
          <BranchSelector
            allowMultiSelect={viewMode === 'comparison'}
            onBranchChange={() => setShowBranchSelector(false)}
            showStats={true}
          />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">สาขาทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(branchSummary.totalBranches)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                เปิดใช้งาน {branchSummary.activeBranches} สาขา
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">รายได้รวม</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(branchSummary.totalRevenue)}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                กำไร {formatPercent(branchSummary.averageProfitMargin)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">พนักงานทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(branchSummary.totalEmployees)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                ลูกค้า {formatNumber(branchSummary.totalCustomers)} คน
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">มูลค่าสต็อก</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(branchSummary.totalStockValue)}
              </p>
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                แจ้งเตือน {branchSummary.totalCriticalAlerts} รายการ
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Branch Performance */}
      {viewMode === 'comparison' && selectedBranchesAnalytics.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">เปรียบเทียบประสิทธิภาพสาขา</h3>
            <p className="text-sm text-gray-600 mt-1">
              ข้อมูลการเปรียบเทียบ {selectedBranchesAnalytics.length} สาขา
            </p>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สาขา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายได้
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      กำไรสุทธิ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % กำไร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คำสั่งซื้อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AOV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การเติบโต
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedBranchesAnalytics.map((analytics) => (
                    <tr key={analytics.branchId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {analytics.branchName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {analytics.branchCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(analytics.financial.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(analytics.financial.netProfit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          analytics.financial.netProfitMargin >= 10
                            ? 'bg-green-100 text-green-800'
                            : analytics.financial.netProfitMargin >= 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatPercent(analytics.financial.netProfitMargin)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(analytics.sales.totalOrders)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(analytics.sales.averageOrderValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {analytics.sales.growth >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            analytics.sales.growth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercent(Math.abs(analytics.sales.growth))}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Best & Worst Performing Branches */}
      {branchSummary.bestPerformingBranch && branchSummary.worstPerformingBranch && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                สาขาที่มีผลงานดีที่สุด
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {branchSummary.bestPerformingBranch?.branchName || 'ไม่มีข้อมูล'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    รหัส: {branchSummary.bestPerformingBranch?.branchCode || '-'}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">กำไรสุทธิ</p>
                      <p className="text-sm font-semibold text-green-600">
                        {branchSummary.bestPerformingBranch 
                          ? formatPercent(branchSummary.bestPerformingBranch.financial.netProfitMargin)
                          : '-'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">รายได้</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {branchSummary.bestPerformingBranch 
                          ? formatCurrency(branchSummary.bestPerformingBranch.financial.totalRevenue)
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                สาขาที่ต้องปรับปรุง
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {branchSummary.worstPerformingBranch?.branchName || 'ไม่มีข้อมูล'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    รหัส: {branchSummary.worstPerformingBranch?.branchCode || '-'}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">กำไรสุทธิ</p>
                      <p className="text-sm font-semibold text-red-600">
                        {branchSummary.worstPerformingBranch 
                          ? formatPercent(branchSummary.worstPerformingBranch.financial.netProfitMargin)
                          : '-'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">รายได้</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {branchSummary.worstPerformingBranch 
                          ? formatCurrency(branchSummary.worstPerformingBranch.financial.totalRevenue)
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Status by Branch */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">สถานะสต็อกตามสาขา</h3>
          <p className="text-sm text-gray-600 mt-1">
            ภาพรวมสต็อกสินค้าในแต่ละสาขา
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(branchSummary.totalOutOfStockItems)}
              </div>
              <div className="text-sm text-gray-600">สินค้าหมดสต็อก</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(branchSummary.totalLowStockItems)}
              </div>
              <div className="text-sm text-gray-600">สินค้าสต็อกต่ำ</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(branchSummary.totalProducts)}
              </div>
              <div className="text-sm text-gray-600">สินค้าทั้งหมด</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}