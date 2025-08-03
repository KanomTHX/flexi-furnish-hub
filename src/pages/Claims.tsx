import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useClaims } from '@/hooks/useClaims';
import { ClaimsOverview } from '@/components/claims/ClaimsOverview';
import { ClaimsList } from '@/components/claims/ClaimsList';
import { PendingClaimsDialog } from '@/components/claims/PendingClaimsDialog';
import { OverdueClaimsDialog } from '@/components/claims/OverdueClaimsDialog';
import { CreateClaimDialog } from '@/components/claims/CreateClaimDialog';
import { ClearClaimsFiltersDialog } from '@/components/claims/ClearClaimsFiltersDialog';
import { exportClaimsToCSV, exportCustomersToCSV, exportProductsToCSV } from '@/utils/claimsHelpers';
import { 
  Shield, 
  FileText, 
  Users, 
  Package,
  Settings,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  Star
} from 'lucide-react';

export default function Claims() {
  const {
    claims,
    customers,
    products,
    statistics,
    claimFilter,
    setClaimFilter,
    clearClaimFilter,
    createClaim,
    updateClaimStatus,
    assignClaim,
    getPendingClaims,
    getHighPriorityClaims,
    getOverdueClaims
  } = useClaims();

  const { toast } = useToast();
  const [pendingClaimsOpen, setPendingClaimsOpen] = useState(false);
  const [overdueClaimsOpen, setOverdueClaimsOpen] = useState(false);
  const [createClaimOpen, setCreateClaimOpen] = useState(false);
  const [clearFiltersOpen, setClearFiltersOpen] = useState(false);

  const handleExportClaims = () => {
    const csv = exportClaimsToCSV(claims);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `claims-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายการเคลมถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportCustomers = () => {
    const csv = exportCustomersToCSV(customers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์ข้อมูลลูกค้าถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportProducts = () => {
    const csv = exportProductsToCSV(products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์ข้อมูลสินค้าถูกดาวน์โหลดแล้ว",
    });
  };

  const handleUpdateClaimStatus = (claimId: string, status: string) => {
    updateClaimStatus(claimId, status as any);
    toast({
      title: "อัปเดตสถานะสำเร็จ",
      description: "สถานะเคลมได้รับการอัปเดตแล้ว",
    });
  };

  const handleAssignClaim = (claimId: string, assignedTo: string) => {
    assignClaim(claimId, assignedTo);
    toast({
      title: "มอบหมายงานสำเร็จ",
      description: "เคลมได้รับการมอบหมายแล้ว",
    });
  };

  const handleCreateClaim = () => {
    setCreateClaimOpen(true);
  };

  const handleShowPendingClaims = () => {
    setPendingClaimsOpen(true);
  };

  const handleShowOverdueClaims = () => {
    setOverdueClaimsOpen(true);
  };

  const handleShowClearFilters = () => {
    setClearFiltersOpen(true);
  };

  const handleClaimCreated = (claim: any) => {
    // In real app, this would add to the claims list
    console.log('New claim created:', claim);
    toast({
      title: "สร้างเคลมสำเร็จ",
      description: `เคลม ${claim.claimNumber} ถูกสร้างและรอการดำเนินการ`,
    });
  };

  const pendingClaims = getPendingClaims();
  const highPriorityClaims = getHighPriorityClaims();
  const overdueClaims = getOverdueClaims();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">การเคลมและการรับประกัน</h1>
          <p className="text-muted-foreground">
            จัดการการเคลม การรับประกัน และความพึงพอใจของลูกค้า
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingClaims.length > 0 && (
            <Button 
              variant="outline" 
              className="relative"
              onClick={handleShowPendingClaims}
            >
              <Clock className="w-4 h-4 mr-2" />
              รอดำเนินการ
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingClaims.length}
              </span>
            </Button>
          )}
          {overdueClaims.length > 0 && (
            <Button 
              variant="outline" 
              className="relative"
              onClick={handleShowOverdueClaims}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              เกินกำหนด
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {overdueClaims.length}
              </span>
            </Button>
          )}
          <Button onClick={handleShowClearFilters} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            ล้างตัวกรอง
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateClaim}>
            <Plus className="w-4 h-4 mr-2" />
            สร้างเคลมใหม่
          </Button>
        </div>
      </div>

      {/* High Priority Claims Alert */}
      {highPriorityClaims.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">เคลมความสำคัญสูง ({highPriorityClaims.length} รายการ)</span>
          </div>
          <div className="space-y-1">
            {highPriorityClaims.slice(0, 3).map((claim) => (
              <div 
                key={claim.id}
                className="text-sm text-red-600"
              >
                • {claim.claimNumber}: {claim.customer.name} - {claim.product.name}
              </div>
            ))}
            {highPriorityClaims.length > 3 && (
              <div className="text-sm text-red-600">
                และอีก {highPriorityClaims.length - 3} รายการ
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overdue Claims Alert */}
      {overdueClaims.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">เคลมเกินกำหนด ({overdueClaims.length} รายการ)</span>
          </div>
          <div className="space-y-1">
            {overdueClaims.slice(0, 3).map((claim) => (
              <div 
                key={claim.id}
                className="text-sm text-orange-600"
              >
                • {claim.claimNumber}: {claim.issueDescription.substring(0, 50)}...
              </div>
            ))}
            {overdueClaims.length > 3 && (
              <div className="text-sm text-orange-600">
                และอีก {overdueClaims.length - 3} รายการ
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {statistics.totalClaims}
                </div>
                <div className="text-sm text-blue-600">เคลมทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-700">
                  {statistics.pendingClaims}
                </div>
                <div className="text-sm text-orange-600">รอดำเนินการ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {statistics.completedClaims}
                </div>
                <div className="text-sm text-green-600">เสร็จสิ้นแล้ว</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-700">
                  {statistics.customerSatisfactionAverage.toFixed(1)}
                </div>
                <div className="text-sm text-yellow-600">ความพึงพอใจ</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="claims" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            รายการเคลม ({claims.length})
          </TabsTrigger>
          <TabsTrigger value="warranty" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            การรับประกัน
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            ลูกค้า ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            สินค้า ({products.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ClaimsOverview statistics={statistics} />
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          <ClaimsList
            claims={claims}
            customers={customers}
            products={products}
            filter={claimFilter}
            onFilterChange={setClaimFilter}
            onExport={handleExportClaims}
            onCreateClaim={handleCreateClaim}
            onUpdateStatus={handleUpdateClaimStatus}
            onAssignClaim={handleAssignClaim}
          />
        </TabsContent>

        <TabsContent value="warranty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                การจัดการรับประกัน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ระบบจัดการรับประกันจะพัฒนาในเวอร์ชันถัดไป</p>
                <p className="text-sm mt-2">
                  จะรวมถึงการตรวจสอบสถานะรับประกัน การต่ออายุ และการจัดการนโยบาย
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  ข้อมูลลูกค้า
                </CardTitle>
                <Button variant="outline" onClick={handleExportCustomers}>
                  <Package className="w-4 h-4 mr-2" />
                  ส่งออก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{customer.name}</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>อีเมล: {customer.email}</div>
                        <div>เบอร์โทร: {customer.phone}</div>
                        <div>ประเภท: {customer.customerType === 'individual' ? 'บุคคล' : 'นิติบุคคล'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {claims.filter(c => c.customerId === customer.id).length}
                      </div>
                      <div className="text-sm text-muted-foreground">เคลม</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  ข้อมูลสินค้า
                </CardTitle>
                <Button variant="outline" onClick={handleExportProducts}>
                  <Package className="w-4 h-4 mr-2" />
                  ส่งออก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>รุ่น: {product.model} | ยี่ห้อ: {product.brand}</div>
                        <div>หมวดหมู่: {product.category}</div>
                        <div>ระยะประกัน: {product.warrantyPeriod} เดือน</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        {claims.filter(c => c.productId === product.id).length}
                      </div>
                      <div className="text-sm text-muted-foreground">เคลม</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pending Claims Dialog */}
      <PendingClaimsDialog
        open={pendingClaimsOpen}
        onOpenChange={setPendingClaimsOpen}
        pendingClaims={pendingClaims}
        onUpdateStatus={handleUpdateClaimStatus}
        onAssignClaim={handleAssignClaim}
      />

      {/* Overdue Claims Dialog */}
      <OverdueClaimsDialog
        open={overdueClaimsOpen}
        onOpenChange={setOverdueClaimsOpen}
        overdueClaims={overdueClaims}
        onUpdateStatus={handleUpdateClaimStatus}
        onAssignClaim={handleAssignClaim}
      />

      {/* Create Claim Dialog */}
      <CreateClaimDialog
        open={createClaimOpen}
        onOpenChange={setCreateClaimOpen}
        customers={customers}
        products={products}
        onCreateClaim={handleClaimCreated}
      />

      {/* Clear Filters Dialog */}
      <ClearClaimsFiltersDialog
        open={clearFiltersOpen}
        onOpenChange={setClearFiltersOpen}
        currentFilter={claimFilter}
        onClearFilter={clearClaimFilter}
      />
    </div>
  );
}