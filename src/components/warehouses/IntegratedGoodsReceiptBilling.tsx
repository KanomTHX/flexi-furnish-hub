import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useBranchData } from '@/hooks/useBranchData';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { useGoodsReceiptBilling } from '@/hooks/useGoodsReceiptBilling';
import { WorkflowSteps } from './WorkflowSteps';
import { SupplierSelection } from './SupplierSelection';
import { ProductSelection } from './ProductSelection';
import { ReceiptItemsManagement } from './ReceiptItemsManagement';
import { AddNewProduct } from './AddNewProduct';
import { AddSupplierModal } from './SupplierModals';
import {
  AlertCircle,
  FileText,
  Download,
  RotateCcw,
  Hash,
  DollarSign,
  Package,
  Plus
} from 'lucide-react';

// Types
interface Product {
  id: string;
  productName: string;
  productCode: string;
  category?: string;
  unit?: string;
  description?: string;
  status: string;
}

interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
}

interface IntegratedGoodsReceiptBillingProps {
  onClose?: () => void;
  branchId?: string;
}

export function IntegratedGoodsReceiptBilling({ onClose, branchId: propBranchId }: IntegratedGoodsReceiptBillingProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentBranch } = useBranchData();
  const { branches } = useBranches();

  // Get branch_id from props, currentBranch, or user data
  const branchId = propBranchId || currentBranch?.id || user?.user_metadata?.branch_id;

  // Use the custom hook for all state management and business logic
  const {
    // State
    products,
    suppliers,
    filteredProducts,
    currentStep,
    workflowSteps,
    selectedSupplierId,
    invoiceNumber,
    deliveryDate,
    notes,
    items,
    isLoading,
    isProcessing,
    productSearchTerm,
    showProductSearch,
    errors,
    receiptData,
    
    // Actions
    setSelectedSupplierId,
    setInvoiceNumber,
    setDeliveryDate,
    setNotes,
    setProductSearchTerm,
    setShowProductSearch,
    loadInitialData,
    addItem,
    updateItemQuantity,
    updateItemUnitCost,
    removeItem,
    nextStep,
    prevStep,
    generateAllSerialNumbers,
    completeWorkflow,
    resetForm
  } = useGoodsReceiptBilling({ branchId });

  // Modal states
  const [showAddSupplierModal, setShowAddSupplierModal] = React.useState(false);
  const [showAddProduct, setShowAddProduct] = React.useState(false);

  // Load initial data when component mounts or branchId changes
  useEffect(() => {
    if (branchId) {
      loadInitialData();
    }
  }, [branchId, loadInitialData]);

  // Handle supplier added
  const handleSupplierAdded = () => {
    loadInitialData();
    setShowAddSupplierModal(false);
    toast({
      title: 'เพิ่มซัพพลายเออร์สำเร็จ',
      description: 'ซัพพลายเออร์ใหม่ถูกเพิ่มลงในระบบแล้ว'
    });
  };

  // Handle product added
  const handleProductAdded = () => {
    loadInitialData();
    setShowAddProduct(false);
    toast({
      title: 'เพิ่มสินค้าสำเร็จ',
      description: 'สินค้าใหม่ถูกเพิ่มลงในระบบแล้ว'
    });
  };

  // Handle step 4 - generate serial numbers
  const handleGenerateSerialNumbers = () => {
    generateAllSerialNumbers();
    toast({
      title: 'สร้าง Serial Number สำเร็จ',
      description: 'สร้าง Serial Number สำหรับสินค้าทั้งหมดแล้ว'
    });
  };

  // Handle workflow completion
  const handleCompleteWorkflow = async () => {
    await completeWorkflow();
  };

  // Handle reset
  const handleReset = () => {
    resetForm();
    toast({
      title: 'รีเซ็ตสำเร็จ',
      description: 'ล้างข้อมูลทั้งหมดแล้ว'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // No branch selected
  if (!branchId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          ไม่พบข้อมูลสาขา กรุณาเลือกสาขาก่อนดำเนินการ
        </AlertDescription>
      </Alert>
    );
  }

  // Receipt completed view
  if (receiptData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
              <FileText className="w-6 h-6" />
              ใบรับสินค้าสำเร็จ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold">หมายเลขใบรับ: {receiptData.receiptNumber}</div>
              <div className="text-sm text-gray-500">วันที่สร้าง: {new Date(receiptData.createdAt).toLocaleDateString('th-TH')}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">ซัพพลายเออร์:</span>
                <div className="text-sm text-gray-600">
                  {suppliers.find(s => s.id === receiptData.supplierId)?.supplierName}
                </div>
              </div>
              <div>
                <span className="font-medium">เลขที่ใบวางบิล:</span>
                <div className="text-sm text-gray-600">{receiptData.invoiceNumber || '-'}</div>
              </div>
              <div>
                <span className="font-medium">วันที่ส่งมอบ:</span>
                <div className="text-sm text-gray-600">
                  {receiptData.deliveryDate ? new Date(receiptData.deliveryDate).toLocaleDateString('th-TH') : '-'}
                </div>
              </div>
              <div>
                <span className="font-medium">มูลค่ารวม:</span>
                <div className="text-sm text-gray-600 font-semibold">
                  ฿{receiptData.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">รายการสินค้า ({receiptData.items.length} รายการ)</h4>
              <div className="space-y-2">
                {receiptData.items.map((item: any, index: number) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white border rounded">
                    <div>
                      <span className="font-medium">{item.product.productName}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.product.productCode})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{item.quantity} {item.product.unit || 'ชิ้น'}</div>
                      <div className="text-sm font-medium">
                        ฿{item.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                สร้างใบรับใหม่
              </Button>
              <Button onClick={onClose} variant="default">
                ปิด
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">รับสินค้าเข้าคลัง (แบบรวม)</h2>
          <p className="text-gray-500 mt-1">จัดการการรับสินค้าเข้าคลังพร้อมสร้างใบวางบิล</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            รีเซ็ต
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline" size="sm">
              ปิด
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Steps */}
      <WorkflowSteps steps={workflowSteps} currentStep={currentStep} />

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <SupplierSelection
            suppliers={suppliers}
            selectedSupplierId={selectedSupplierId}
            onSupplierChange={setSelectedSupplierId}
            invoiceNumber={invoiceNumber}
            onInvoiceNumberChange={setInvoiceNumber}
            deliveryDate={deliveryDate}
            onDeliveryDateChange={setDeliveryDate}
            notes={notes}
            onNotesChange={setNotes}
            onAddSupplier={() => setShowAddSupplierModal(true)}
            error={errors.supplier}
          />
        )}

        {currentStep === 2 && (
          <ProductSelection
            products={products}
            filteredProducts={filteredProducts}
            productSearchTerm={productSearchTerm}
            onProductSearchChange={setProductSearchTerm}
            showProductSearch={showProductSearch}
            onToggleProductSearch={setShowProductSearch}
            items={items}
            onAddItem={addItem}
            onAddProduct={() => setShowAddProduct(true)}
            error={errors.items}
          />
        )}

        {currentStep === 3 && (
          <ReceiptItemsManagement
            items={items}
            onUpdateQuantity={updateItemQuantity}
            onUpdateUnitCost={updateItemUnitCost}
            onRemoveItem={removeItem}
            errors={errors}
          />
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold">สร้าง Serial Number อัตโนมัติ</h3>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Serial Numbers สำหรับสินค้า</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      ไม่มีสินค้าในรายการ
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        จำนวนสินค้าทั้งหมด: {items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น
                      </span>
                      <Button onClick={handleGenerateSerialNumbers} size="sm">
                        <Hash className="w-4 h-4 mr-2" />
                        สร้าง Serial Number
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{item.product.productName}</h4>
                              <p className="text-sm text-gray-500">{item.product.productCode}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">จำนวน: {item.quantity} {item.product.unit || 'ชิ้น'}</div>
                              <div className="text-sm font-medium">
                                ฿{item.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                          
                          {item.serialNumbers.length > 0 ? (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Serial Numbers:</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {item.serialNumbers.map((serial, index) => (
                                  <div key={index} className="text-xs bg-gray-100 p-2 rounded font-mono">
                                    {serial}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              ยังไม่ได้สร้าง Serial Number
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          onClick={prevStep}
          variant="outline"
          disabled={currentStep === 1}
        >
          ย้อนกลับ
        </Button>

        <div className="flex gap-2">
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              ถัดไป
            </Button>
          ) : (
            <Button
              onClick={handleCompleteWorkflow}
              disabled={isProcessing || items.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  สร้างใบรับสินค้า
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <Dialog open={showAddSupplierModal} onOpenChange={setShowAddSupplierModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>เพิ่มซัพพลายเออร์ใหม่</DialogTitle>
          </DialogHeader>
          <AddSupplierModal
            branchId={branchId}
            onSupplierAdded={handleSupplierAdded}
            onClose={() => setShowAddSupplierModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
          </DialogHeader>
          <AddNewProduct
            branchId={branchId}
            onProductAdded={handleProductAdded}
            onClose={() => setShowAddProduct(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}