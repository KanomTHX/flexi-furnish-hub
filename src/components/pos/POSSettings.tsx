import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Settings, Printer, Calculator, Receipt, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface POSSettingsData {
  // การตั้งค่าภาษี
  taxRate: number;
  taxEnabled: boolean;
  
  // การตั้งค่าส่วนลด
  maxDiscountPercent: number;
  allowManualDiscount: boolean;
  
  // การตั้งค่าการพิมพ์
  autoPrintReceipt: boolean;
  printerName: string;
  receiptTemplate: string;
  
  // การตั้งค่าทั่วไป
  defaultPaymentMethod: string;
  requireCustomerInfo: boolean;
  allowNegativeStock: boolean;
  
  // การตั้งค่าหน้าจอ
  theme: string;
  fontSize: string;
  
  // ข้อมูลร้าน
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeTaxId: string;
}

interface POSSettingsProps {
  onBack: () => void;
}

export const POSSettings: React.FC<POSSettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<POSSettingsData>({
    taxRate: 7,
    taxEnabled: true,
    maxDiscountPercent: 20,
    allowManualDiscount: true,
    autoPrintReceipt: false,
    printerName: '',
    receiptTemplate: 'standard',
    defaultPaymentMethod: 'cash',
    requireCustomerInfo: false,
    allowNegativeStock: false,
    theme: 'light',
    fontSize: 'medium',
    storeName: 'Flexi Furnish Hub',
    storeAddress: '',
    storePhone: '',
    storeTaxId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      if (!profile?.branch_id) {
        console.error('No branch_id found in profile');
        return;
      }

      const { data, error } = await supabase
        .from('pos_settings')
        .select('*')
        .eq('branch_id', profile.branch_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถโหลดการตั้งค่าได้',
          variant: 'destructive'
        });
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setSettings({
          taxRate: data.tax_rate || 7,
          taxEnabled: data.enable_tax || true,
          maxDiscountPercent: data.max_discount_percent || 20,
          allowManualDiscount: data.enable_discount || true,
          autoPrintReceipt: data.auto_print_receipt || false,
          printerName: '',
          receiptTemplate: 'standard',
          defaultPaymentMethod: data.default_payment_method || 'cash',
          requireCustomerInfo: false,
          allowNegativeStock: false,
          theme: data.theme || 'light',
          fontSize: 'medium',
          storeName: data.store_name || 'Flexi Furnish Hub',
          storeAddress: data.store_address || '',
          storePhone: data.store_phone || '',
          storeTaxId: data.store_tax_id || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      if (!profile?.branch_id || !user?.id) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่พบข้อมูลผู้ใช้หรือสาขา',
          variant: 'destructive'
        });
        return;
      }

      const settingsData = {
        branch_id: profile.branch_id,
        store_name: settings.storeName,
        store_address: settings.storeAddress,
        store_phone: settings.storePhone,
        store_tax_id: settings.storeTaxId,
        tax_rate: settings.taxRate,
        enable_tax: settings.taxEnabled,
        max_discount_percent: settings.maxDiscountPercent,
        enable_discount: settings.allowManualDiscount,
        auto_print_receipt: settings.autoPrintReceipt,
        default_payment_method: settings.defaultPaymentMethod,
        theme: settings.theme,
        created_by: user.id
      };

      let result;
      if (settingsId) {
        // Update existing settings
        result = await supabase
          .from('pos_settings')
          .update(settingsData)
          .eq('id', settingsId);
      } else {
        // Insert new settings
        result = await supabase
          .from('pos_settings')
          .insert([settingsData])
          .select()
          .single();
        
        if (result.data) {
          setSettingsId(result.data.id);
        }
      }

      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: 'บันทึกสำเร็จ',
        description: 'การตั้งค่าได้รับการบันทึกเรียบร้อยแล้ว',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการตั้งค่าได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      taxRate: 7,
      taxEnabled: true,
      maxDiscountPercent: 20,
      allowManualDiscount: true,
      autoPrintReceipt: false,
      printerName: '',
      receiptTemplate: 'standard',
      defaultPaymentMethod: 'cash',
      requireCustomerInfo: false,
      allowNegativeStock: false,
      theme: 'light',
      fontSize: 'medium',
      storeName: 'Flexi Furnish Hub',
      storeAddress: '',
      storePhone: '',
      storeTaxId: ''
    });
    
    toast({
      title: 'รีเซ็ตสำเร็จ',
      description: 'การตั้งค่าได้รับการรีเซ็ตเป็นค่าเริ่มต้นแล้ว',
    });
  };

  const updateSetting = <K extends keyof POSSettingsData>(
    key: K,
    value: POSSettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ตั้งค่าระบบ POS
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            รีเซ็ต
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* ข้อมูลร้าน */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              ข้อมูลร้าน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">ชื่อร้าน</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => updateSetting('storeName', e.target.value)}
                  placeholder="ชื่อร้านค้า"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone">เบอร์โทรศัพท์</Label>
                <Input
                  id="storePhone"
                  value={settings.storePhone}
                  onChange={(e) => updateSetting('storePhone', e.target.value)}
                  placeholder="เบอร์โทรศัพท์ร้าน"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress">ที่อยู่ร้าน</Label>
              <Textarea
                id="storeAddress"
                value={settings.storeAddress}
                onChange={(e) => updateSetting('storeAddress', e.target.value)}
                placeholder="ที่อยู่ร้านค้า"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeTaxId">เลขประจำตัวผู้เสียภาษี</Label>
              <Input
                id="storeTaxId"
                value={settings.storeTaxId}
                onChange={(e) => updateSetting('storeTaxId', e.target.value)}
                placeholder="เลขประจำตัวผู้เสียภาษี"
              />
            </div>
          </CardContent>
        </Card>

        {/* การตั้งค่าภาษี */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              การตั้งค่าภาษี
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>เปิดใช้งานภาษี</Label>
                <p className="text-sm text-muted-foreground">คำนวณภาษีในการขาย</p>
              </div>
              <Switch
                checked={settings.taxEnabled}
                onCheckedChange={(checked) => updateSetting('taxEnabled', checked)}
              />
            </div>
            {settings.taxEnabled && (
              <div className="space-y-2">
                <Label htmlFor="taxRate">อัตราภาษี (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* การตั้งค่าส่วนลด */}
        <Card>
          <CardHeader>
            <CardTitle>การตั้งค่าส่วนลด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>อนุญาตให้ใส่ส่วนลดด้วยตนเอง</Label>
                <p className="text-sm text-muted-foreground">พนักงานสามารถใส่ส่วนลดได้</p>
              </div>
              <Switch
                checked={settings.allowManualDiscount}
                onCheckedChange={(checked) => updateSetting('allowManualDiscount', checked)}
              />
            </div>
            {settings.allowManualDiscount && (
              <div className="space-y-2">
                <Label htmlFor="maxDiscountPercent">ส่วนลดสูงสุด (%)</Label>
                <Input
                  id="maxDiscountPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.maxDiscountPercent}
                  onChange={(e) => updateSetting('maxDiscountPercent', parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* การตั้งค่าการพิมพ์ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              การตั้งค่าการพิมพ์
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>พิมพ์ใบเสร็จอัตโนมัติ</Label>
                <p className="text-sm text-muted-foreground">พิมพ์ใบเสร็จทันทีหลังการขาย</p>
              </div>
              <Switch
                checked={settings.autoPrintReceipt}
                onCheckedChange={(checked) => updateSetting('autoPrintReceipt', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printerName">ชื่อเครื่องพิมพ์</Label>
              <Input
                id="printerName"
                value={settings.printerName}
                onChange={(e) => updateSetting('printerName', e.target.value)}
                placeholder="ชื่อเครื่องพิมพ์"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptTemplate">แม่แบบใบเสร็จ</Label>
              <Select
                value={settings.receiptTemplate}
                onValueChange={(value) => updateSetting('receiptTemplate', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">มาตรฐาน</SelectItem>
                  <SelectItem value="compact">แบบกะทัดรัด</SelectItem>
                  <SelectItem value="detailed">แบบละเอียด</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* การตั้งค่าทั่วไป */}
        <Card>
          <CardHeader>
            <CardTitle>การตั้งค่าทั่วไป</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentMethod">วิธีการชำระเงินเริ่มต้น</Label>
              <Select
                value={settings.defaultPaymentMethod}
                onValueChange={(value) => updateSetting('defaultPaymentMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">เงินสด</SelectItem>
                  <SelectItem value="card">บัตรเครดิต</SelectItem>
                  <SelectItem value="transfer">โอนเงิน</SelectItem>
                  <SelectItem value="credit">เครดิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>บังคับใส่ข้อมูลลูกค้า</Label>
                <p className="text-sm text-muted-foreground">ต้องใส่ข้อมูลลูกค้าทุกการขาย</p>
              </div>
              <Switch
                checked={settings.requireCustomerInfo}
                onCheckedChange={(checked) => updateSetting('requireCustomerInfo', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>อนุญาตให้ขายเกินสต็อก</Label>
                <p className="text-sm text-muted-foreground">สามารถขายสินค้าที่สต็อกติดลบได้</p>
              </div>
              <Switch
                checked={settings.allowNegativeStock}
                onCheckedChange={(checked) => updateSetting('allowNegativeStock', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* การตั้งค่าหน้าจอ */}
        <Card>
          <CardHeader>
            <CardTitle>การตั้งค่าหน้าจอ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">ธีม</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">สว่าง</SelectItem>
                    <SelectItem value="dark">มืด</SelectItem>
                    <SelectItem value="auto">อัตโนมัติ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSize">ขนาดตัวอักษร</Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value) => updateSetting('fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">เล็ก</SelectItem>
                    <SelectItem value="medium">กลาง</SelectItem>
                    <SelectItem value="large">ใหญ่</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POSSettings;