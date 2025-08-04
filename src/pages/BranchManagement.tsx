import { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Eye,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';
import { BranchDashboard } from '../components/branch/BranchDashboard';
import { Branch } from '../types/branch';

function BranchManagement() {
  const {
    branches,
    currentBranch,
    branchSummary,
    branchFilter,
    setBranchFilter,
    updateBranch,
    exportBranchData,
    isLoading,
    isUpdating
  } = useBranchData();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'branches' | 'comparison'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);


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

  const getBranchStatusColor = (status: Branch['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBranchTypeColor = (type: Branch['type']) => {
    switch (type) {
      case 'main':
        return 'bg-blue-100 text-blue-800';
      case 'branch':
        return 'bg-green-100 text-green-800';
      case 'outlet':
        return 'bg-orange-100 text-orange-800';
      case 'warehouse':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBranches = branches.filter(branch => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return branch.name.toLowerCase().includes(searchLower) ||
             branch.code.toLowerCase().includes(searchLower) ||
             branch.address.province.toLowerCase().includes(searchLower);
    }
    return true;
  });

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
            จัดการสาขา
          </h1>
          <p className="text-gray-600 mt-1">
            ระบบจัดการข้อมูลสาขาทั้ง 4 สาขา และแยกข้อมูลตามสาขา
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportBranchData()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออกข้อมูล</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>เพิ่มสาขาใหม่</span>
          </button>
        </div>
      </div>

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
                กำไร {branchSummary.averageProfitMargin.toFixed(1)}%
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
              <p className="text-sm font-medium text-gray-600">แจ้งเตือนสำคัญ</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(branchSummary.totalCriticalAlerts)}
              </p>
              <p className="text-xs text-red-600 mt-1">
                ต้องดำเนินการ
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              แดชบอร์ด
            </button>
            <button
              onClick={() => setActiveTab('branches')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'branches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              รายการสาขา
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'comparison'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              เปรียบเทียบสาขา
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <BranchDashboard />
          )}

          {activeTab === 'branches' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="ค้นหาสาขา..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span>ตัวกรอง</span>
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  แสดง {filteredBranches.length} จาก {branches.length} สาขา
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ประเภทสาขา
                      </label>
                      <select
                        value={branchFilter.type || ''}
                        onChange={(e) => setBranchFilter({ ...branchFilter, type: e.target.value as Branch['type'] || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="main">สาขาหลัก</option>
                        <option value="branch">สาขา</option>
                        <option value="outlet">ร้านค้า</option>
                        <option value="warehouse">คลังสินค้า</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        สถานะ
                      </label>
                      <select
                        value={branchFilter.status || ''}
                        onChange={(e) => setBranchFilter({ ...branchFilter, status: e.target.value as Branch['status'] || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="active">เปิดใช้งาน</option>
                        <option value="inactive">ปิดใช้งาน</option>
                        <option value="maintenance">ปรับปรุง</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        จังหวัด
                      </label>
                      <select
                        value={branchFilter.province || ''}
                        onChange={(e) => setBranchFilter({ ...branchFilter, province: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="ไผ่ท่าโพ">ไผ่ท่าโพ</option>
                        <option value="บางมูลนาก">บางมูลนาก</option>
                        <option value="ทับคล้อ">ทับคล้อ</option>
                        <option value="อุตรดิตถ์">อุตรดิตถ์</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Branch List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredBranches.map((branch) => (
                  <div key={branch.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {branch.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              รหัส: {branch.code}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBranchTypeColor(branch.type)}`}>
                                {branch.type === 'main' ? 'สาขาหลัก' : 
                                 branch.type === 'branch' ? 'สาขา' : 
                                 branch.type === 'outlet' ? 'ร้านค้า' : 'คลังสินค้า'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBranchStatusColor(branch.status)}`}>
                                {branch.status === 'active' ? 'เปิดใช้งาน' : 
                                 branch.status === 'inactive' ? 'ปิดใช้งาน' : 'ปรับปรุง'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{branch.address.district}, {branch.address.province}</span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <strong>ผู้จัดการ:</strong> {branch.contact.manager}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                          <div>
                            <div className="text-xs text-gray-500">พนักงาน</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatNumber(branch.stats.totalEmployees)} คน
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">ลูกค้า</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatNumber(branch.stats.totalCustomers)} คน
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">รายได้/เดือน</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(branch.stats.monthlyRevenue)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">สินค้า</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatNumber(branch.stats.totalProducts)} รายการ
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  เปรียบเทียบประสิทธิภาพสาขา
                </h3>
                <p className="text-gray-600 mb-6">
                  เลือกสาขาที่ต้องการเปรียบเทียบเพื่อดูข้อมูลการวิเคราะห์
                </p>
                
                <BranchSelector
                  allowMultiSelect={true}
                  showStats={true}
                  className="max-w-4xl mx-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BranchManagement;