import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAddressSelector } from '@/hooks/useThaiAddress';
import { AlertCircle, MapPin } from 'lucide-react';

interface ThaiAddressSelectorProps {
  onAddressChange: (address: {
    province: string;
    amphure: string;
    tambon: string;
    zipCode: string;
    fullAddress: string;
  } | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export function ThaiAddressSelector({ onAddressChange, disabled = false, required = false }: ThaiAddressSelectorProps) {
  const {
    provinces,
    loading,
    error,
    selectedProvince,
    selectedAmphure,
    selectedTambon,
    handleProvinceChange,
    handleAmphureChange,
    handleTambonChange,
    getFullAddress
  } = useAddressSelector();

  const handleProvinceSelect = (value: string) => {
    handleProvinceChange(value);
    onAddressChange(null);
  };

  const handleAmphureSelect = (value: string) => {
    handleAmphureChange(value);
    onAddressChange(null);
  };

  const handleTambonSelect = (value: string) => {
    handleTambonChange(value);
    // Get full address after tambon selection
    setTimeout(() => {
      const address = getFullAddress();
      if (address) {
        onAddressChange(address);
      }
    }, 0);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">กำลังโหลดข้อมูลที่อยู่...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>จังหวัด</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Label>อำเภอ/เขต</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Label>ตำบล/แขวง</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Label>รหัสไปรษณีย์</Label>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          ไม่สามารถโหลดข้อมูลที่อยู่ได้: {error}
          <br />
          กรุณาลองใหม่อีกครั้งหรือกรอกที่อยู่ด้วยตนเอง
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">เลือกที่อยู่</span>
        {required && <span className="text-red-500">*</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* จังหวัด */}
        <div className="space-y-2">
          <Label htmlFor="province">
            จังหวัด {required && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={selectedProvince?.id.toString() || ''}
            onValueChange={handleProvinceSelect}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกจังหวัด" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id.toString()}>
                  {province.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* อำเภอ/เขต */}
        <div className="space-y-2">
          <Label htmlFor="amphure">
            อำเภอ/เขต {required && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={selectedAmphure?.id.toString() || ''}
            onValueChange={handleAmphureSelect}
            disabled={disabled || !selectedProvince}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedProvince ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"} />
            </SelectTrigger>
            <SelectContent>
              {selectedProvince?.amphure.map((amphure) => (
                <SelectItem key={amphure.id} value={amphure.id.toString()}>
                  {amphure.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ตำบล/แขวง */}
        <div className="space-y-2">
          <Label htmlFor="tambon">
            ตำบล/แขวง {required && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={selectedTambon?.id.toString() || ''}
            onValueChange={handleTambonSelect}
            disabled={disabled || !selectedAmphure}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedAmphure ? "เลือกตำบล/แขวง" : "เลือกอำเภอ/เขตก่อน"} />
            </SelectTrigger>
            <SelectContent>
              {selectedAmphure?.tambon.map((tambon) => (
                <SelectItem key={tambon.id} value={tambon.id.toString()}>
                  {tambon.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* รหัสไปรษณีย์ */}
        <div className="space-y-2">
          <Label htmlFor="zipcode">รหัสไปรษณีย์</Label>
          <div className="h-10 px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
            {selectedTambon ? selectedTambon.zip_code : 'เลือกตำบล/แขวงก่อน'}
          </div>
        </div>
      </div>

      {/* แสดงที่อยู่เต็ม */}
      {selectedProvince && selectedAmphure && selectedTambon && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium text-muted-foreground">ที่อยู่เต็ม:</Label>
          <p className="text-sm mt-1">
            {getFullAddress()?.fullAddress}
          </p>
        </div>
      )}
    </div>
  );
}