import React from 'react';
import { Check, Building2, MapPin, Users, TrendingUp } from 'lucide-react';
import { Branch } from '../../types/branch';
import { useBranchData } from '../../hooks/useBranchData';

interface BranchSelectorProps {
  onBranchChange?: (branchId: string) => void;
  showStats?: boolean;
  allowMultiSelect?: boolean;
  className?: string;
}

export function BranchSelector({ 
  onBranchChange, 
  showStats = true, 
  allowMultiSelect = false,
  className = '' 
}: BranchSelectorProps) {
  const {
    branches,
    currentBranch,
    selectedBranchIds,
    setSelectedBranchIds,
    switchBranch,
    isSwitchingBranch,
    canAccessBranchData
  } = useBranchData();

  const handleBranchSelect = async (branchId: string) => {
    if (!allowMultiSelect) {
      // Single branch selection
      try {
        await switchBranch(branchId);
        onBranchChange?.(branchId);
      } catch (error) {
        console.error('Failed to switch branch:', error);
      }
    } else {
      // Multi branch selection
      setSelectedBranchIds(prev => {
        const newSelection = prev.includes(branchId)
          ? prev.filter(id => id !== branchId)
          : [...prev, branchId];
        return newSelection;
      });
    }
  };

  const getBranchStatusColor = (status: Branch['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success-foreground border-success/20';
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border';
      case 'maintenance':
        return 'bg-warning/10 text-warning-foreground border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getBranchTypeIcon = (type: Branch['type']) => {
    switch (type) {
      case 'main':
        return <Building2 className="h-5 w-5 text-primary" />;
      case 'branch':
        return <Building2 className="h-5 w-5 text-success" />;
      case 'outlet':
        return <Building2 className="h-5 w-5 text-warning" />;
      case 'warehouse':
        return <Building2 className="h-5 w-5 text-secondary" />;
      default:
        return <Building2 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!branches.length) {
    return (
      <div className={`bg-card rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>ไม่พบข้อมูลสาขา</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-foreground">
          {allowMultiSelect ? 'เลือกสาขาที่ต้องการดู' : 'เปลี่ยนสาขา'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {allowMultiSelect 
            ? `เลือกได้หลายสาขา (เลือกแล้ว ${selectedBranchIds.length} สาขา)`
            : `สาขาปัจจุบัน: ${currentBranch?.name || 'ไม่ระบุ'}`
          }
        </p>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {branches.map((branch) => {
          const isSelected = allowMultiSelect 
            ? selectedBranchIds.includes(branch.id)
            : currentBranch?.id === branch.id;
          const canAccess = canAccessBranchData(branch.id);
          
          return (
            <div
              key={branch.id}
              className={`
                relative rounded-lg border-2 transition-all duration-200 cursor-pointer
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${!canAccess ? 'opacity-50 cursor-not-allowed' : ''}
                ${isSwitchingBranch ? 'pointer-events-none opacity-75' : ''}
              `}
              onClick={() => canAccess && !isSwitchingBranch && handleBranchSelect(branch.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getBranchTypeIcon(branch.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {branch.name}
                        </h4>
                        <span className="text-xs text-gray-500">({branch.code})</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBranchStatusColor(branch.status)}`}>
                          {branch.status === 'active' ? 'เปิดใช้งาน' : 
                           branch.status === 'inactive' ? 'ปิดใช้งาน' : 'ปรับปรุง'}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">
                          {branch.address.district}, {branch.address.province}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mt-1">
                        ผู้จัดการ: {branch.contact.manager}
                      </div>

                      {showStats && (
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-xs text-gray-600">พนักงาน</div>
                              <div className="text-sm font-semibold text-gray-900">
                                {branch.stats.totalEmployees.toLocaleString()} คน
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-xs text-gray-600">รายได้/เดือน</div>
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(branch.stats.monthlyRevenue)}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-600">ลูกค้า</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {branch.stats.totalCustomers.toLocaleString()} คน
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-600">สินค้า</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {branch.stats.totalProducts.toLocaleString()} รายการ
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {!canAccess && (
                <div className="absolute inset-0 bg-gray-50 bg-opacity-75 rounded-lg flex items-center justify-center">
                  <div className="text-xs text-gray-500 text-center px-4">
                    ไม่มีสิทธิ์เข้าถึงข้อมูลสาขานี้
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allowMultiSelect && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              เลือกแล้ว {selectedBranchIds.length} จาก {branches.length} สาขา
            </span>
            <button
              onClick={() => setSelectedBranchIds([])}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={selectedBranchIds.length === 0}
            >
              ล้างการเลือก
            </button>
          </div>
        </div>
      )}

      {isSwitchingBranch && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">กำลังเปลี่ยนสาขา...</div>
          </div>
        </div>
      )}
    </div>
  );
}