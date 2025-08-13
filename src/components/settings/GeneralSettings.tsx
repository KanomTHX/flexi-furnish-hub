import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Save,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { GeneralSettings as GeneralSettingsType } from '@/types/settings';
import { validateGeneralSettings, getLanguages, getTimezones, getCurrencies } from '@/utils/settingsHelpers';

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onSave: (settings: GeneralSettingsType) => Promise<void>;
  loading: boolean;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  onSave,
  loading
}) => {
  const [formData, setFormData] = useState<GeneralSettingsType>(settings);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const languages = getLanguages();
  const timezones = getTimezones();
  const currencies = getCurrencies();

  const handleInputChange = (field: keyof GeneralSettingsType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSave = async () => {
    const validationErrors = validateGeneralSettings(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSave(formData);
      setIsDirty(false);
      setErrors([]);
    } catch (error) {
      setErrors(['เกิดข้อผิดพลาดในการบันทึกข้อมูล']);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    setIsDirty(false);
    setErrors([]);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server
      // For now, we'll just create a local URL
      const logoUrl = URL.createObjectURL(file);
      handleInputChange('companyLogo', logoUrl);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">การตั้งค่าทั่วไป</h2>
          <p className="text-muted-foreground">
            จัดการข้อมูลบริษัทและการตั้งค่าพื้นฐาน
          </p>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <Button onClick={handleReset} variant="outline" size="sm">
              ยกเลิก
            </Button>
          )}
          <Button onClick={handleSave} size="sm" disabled={loading || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-800">
              <p className="font-medium mb-2">กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              ข้อมูลบริษัท
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">ชื่อบริษัท *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="ชื่อบริษัท"
              />
            </div>

            <div>
              <Label htmlFor="companyAddress">ที่อยู่บริษัท</Label>
              <Textarea
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                placeholder="ที่อยู่บริษัท"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyPhone">เบอร์โทรศัพท์ *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyPhone"
                    value={formData.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    placeholder="02-123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyEmail">อีเมล *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    placeholder="info@company.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="companyWebsite">เว็บไซต์</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  placeholder="https://company.com"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Company Logo */}
            <div>
              <Label>โลโก้บริษัท</Label>
              <div className="mt-2 flex items-center gap-4">
                {formData.companyLogo ? (
                  <div className="w-16 h-16 border rounded-lg overflow-hidden">
                    <img 
                      src={formData.companyLogo} 
                      alt="Company Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-gray-50">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    อัปโหลดโลโก้
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 2MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              การตั้งค่าภาษาและภูมิภาค
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language">ภาษา</Label>
              <Select 
                value={formData.language} 
                onValueChange={(value) => handleInputChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกภาษา" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">เขตเวลา</Label>
              <Select 
                value={formData.timezone} 
                onValueChange={(value) => handleInputChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเขตเวลา" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.id} value={tz.id}>
                      <div className="flex flex-col">
                        <span>{tz.name}</span>
                        <span className="text-xs text-muted-foreground">{tz.offset}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency">สกุลเงิน</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสกุลเงิน" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      <div className="flex items-center gap-2">
                        <span>{currency.symbol}</span>
                        <span>{currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFormat">รูปแบบวันที่</Label>
                <Select 
                  value={formData.dateFormat} 
                  onValueChange={(value) => handleInputChange('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกรูปแบบวันที่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeFormat">รูปแบบเวลา</Label>
                <Select 
                  value={formData.timeFormat} 
                  onValueChange={(value) => handleInputChange('timeFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกรูปแบบเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 ชั่วโมง (AM/PM)</SelectItem>
                    <SelectItem value="24h">24 ชั่วโมง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="numberFormat">รูปแบบตัวเลข</Label>
              <Select 
                value={formData.numberFormat} 
                onValueChange={(value) => handleInputChange('numberFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรูปแบบตัวเลข" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="th-TH">ไทย (1,234.56)</SelectItem>
                  <SelectItem value="en-US">อเมริกัน (1,234.56)</SelectItem>
                  <SelectItem value="en-GB">อังกฤษ (1,234.56)</SelectItem>
                  <SelectItem value="de-DE">เยอรมัน (1.234,56)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวอย่างการแสดงผล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">วันที่</p>
              <p className="font-medium">
                {new Date().toLocaleDateString('th-TH', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">เวลา</p>
              <p className="font-medium">
                {new Date().toLocaleTimeString('th-TH', {
                  hour12: formData.timeFormat === '12h'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ตัวเลข</p>
              <p className="font-medium">
                {(1234.56).toLocaleString(formData.numberFormat)} {currencies.find(c => c.id === formData.currency)?.symbol}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};