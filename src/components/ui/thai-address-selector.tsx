import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  PROVINCES, 
  getDistrictsByProvinceId,
  getDistrictById,
  getSubdistrictsByDistrictId,
  formatFullAddress,
  DATA_STATS
} from '@/data/thai-address-complete';

interface ThaiAddressSelectorProps {
  value?: {
    houseNumber?: string;
    province?: string;
    district?: string;
    subdistrict?: string;
    zipCode?: string;
  };
  onChange: (address: {
    houseNumber?: string;
    province?: string;
    district?: string;
    subdistrict?: string;
    zipCode?: string;
    fullAddress?: string;
  }) => void;
  label?: string;
  required?: boolean;
}

export function ThaiAddressSelector({ 
  value = {}, 
  onChange, 
  label = "ที่อยู่",
  required = false 
}: ThaiAddressSelectorProps) {
  const [selectedProvince, setSelectedProvince] = useState(value.province || '');
  const [selectedDistrict, setSelectedDistrict] = useState(value.district || '');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(value.subdistrict || '');
  const [selectedZipCode, setSelectedZipCode] = useState(value.zipCode || '');
  const [houseNumber, setHouseNumber] = useState(value.houseNumber || '');

  const availableDistricts = getDistrictsByProvinceId(selectedProvince);
  const availableSubdistricts = getSubdistrictsByDistrictId(selectedDistrict);
  const availableZipCodes = getDistrictById(selectedProvince, selectedDistrict)?.zipCodes || [];

  // อัปเดตข้อมูลเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const fullAddress = formatFullAddress(
      houseNumber,
      selectedSubdistrict,
      selectedDistrict,
      selectedProvince,
      selectedZipCode
    );

    onChange({
      houseNumber,
      province: selectedProvince,
      district: selectedDistrict,
      subdistrict: selectedSubdistrict,
      zipCode: selectedZipCode,
      fullAddress
    });
  }, [selectedProvince, selectedDistrict, selectedSubdistrict, selectedZipCode, houseNumber, onChange]);

  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvince(provinceId);
    setSelectedDistrict('');
    setSelectedSubdistrict('');
    setSelectedZipCode('');
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedSubdistrict('');
    
    // ตั้งค่า zip code อัตโนมัติถ้ามีเพียงรหัสเดียว
    const district = availableDistricts.find(d => d.id === districtId);
    if (district && district.zipCodes.length === 1) {
      setSelectedZipCode(district.zipCodes[0]);
    } else {
      setSelectedZipCode('');
    }
  };

  const handleSubdistrictChange = (subdistrictId: string) => {
    setSelectedSubdistrict(subdistrictId);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      {/* บ้านเลขที่ */}
      <div>
        <Label htmlFor="houseNumber">บ้านเลขที่ / หมู่ที่ / ซอย / ถนน</Label>
        <Input
          id="houseNumber"
          type="text"
          value={houseNumber}
          onChange={(e) => setHouseNumber(e.target.value)}
          placeholder="เช่น 123/45 หมู่ 2 ซอยลาดพร้าว 15 ถนนลาดพร้าว"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* จังหวัด */}
        <div>
          <Label htmlFor="province">จังหวัด {required && <span className="text-red-500">*</span>}</Label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกจังหวัด" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {PROVINCES.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* อำเภอ */}
        <div>
          <Label htmlFor="district">อำเภอ {required && <span className="text-red-500">*</span>}</Label>
          <Select 
            value={selectedDistrict} 
            onValueChange={handleDistrictChange}
            disabled={!selectedProvince}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedProvince ? "เลือกอำเภอ" : "เลือกจังหวัดก่อน"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {availableDistricts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ตำบล */}
        <div>
          <Label htmlFor="subdistrict">ตำบล {required && <span className="text-red-500">*</span>}</Label>
          <Select 
            value={selectedSubdistrict} 
            onValueChange={handleSubdistrictChange}
            disabled={!selectedDistrict}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedDistrict ? "เลือกตำบล" : "เลือกอำเภอก่อน"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {availableSubdistricts.map((subdistrict) => (
                <SelectItem key={subdistrict.id} value={subdistrict.id}>
                  {subdistrict.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* รหัสไปรษณีย์ */}
        <div>
          <Label htmlFor="zipCode">รหัสไปรษณีย์ {required && <span className="text-red-500">*</span>}</Label>
          {availableZipCodes.length > 1 ? (
            <Select value={selectedZipCode} onValueChange={setSelectedZipCode}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกรหัสไปรษณีย์" />
              </SelectTrigger>
              <SelectContent>
                {availableZipCodes.map((zipCode) => (
                  <SelectItem key={zipCode} value={zipCode}>
                    {zipCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="zipCode"
              type="text"
              value={selectedZipCode}
              readOnly
              placeholder={selectedDistrict ? "รหัสไปรษณีย์จะแสดงอัตโนมัติ" : "เลือกอำเภอก่อน"}
              className="bg-gray-50"
            />
          )}
        </div>
      </div>

      {/* แสดงที่อยู่เต็ม */}
      {(houseNumber || selectedProvince || selectedDistrict || selectedSubdistrict || selectedZipCode) && (
        <div className="p-3 bg-gray-50 rounded-md">
          <Label className="text-sm font-medium text-gray-700">ที่อยู่เต็ม:</Label>
          <p className="text-sm text-gray-600 mt-1">
            {formatFullAddress(
              houseNumber,
              selectedSubdistrict,
              selectedDistrict,
              selectedProvince,
              selectedZipCode
            ) || 'กรุณากรอกข้อมูลที่อยู่'}
          </p>
        </div>
      )}

      {/* ข้อมูลสถิติ */}
      <div className="text-xs text-gray-500 mt-2">
        ข้อมูลที่อยู่ไทย: {DATA_STATS.totalProvinces.toLocaleString()} จังหวัด, {DATA_STATS.totalDistricts.toLocaleString()} อำเภอ, {DATA_STATS.totalSubdistricts.toLocaleString()} ตำบล
      </div>
    </div>
  );
}