import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Store, 
  Receipt, 
  Keyboard, 
  Monitor,
  Volume2,
  Save,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  
  // Store Settings
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Furniture Store',
    address: '123 Main Street, City',
    phone: '02-123-4567',
    taxId: '1234567890123',
    vatRate: 7,
  });

  // Receipt Settings
  const [receiptSettings, setReceiptSettings] = useState({
    showLogo: true,
    showCustomerInfo: true,
    showTaxBreakdown: true,
    printAutomatically: false,
    receiptFooter: 'Thank you for your business!',
  });

  // Display Settings
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
    fontSize: 'medium',
    showProductImages: true,
    gridColumns: 4,
    enableAnimations: true,
  });

  // Sound Settings
  const [soundSettings, setSoundSettings] = useState({
    enableSounds: true,
    scanSound: true,
    errorSound: true,
    successSound: true,
    volume: 50,
  });

  // Keyboard Shortcuts
  const [keyboardSettings, setKeyboardSettings] = useState({
    enableShortcuts: true,
    newSale: 'Ctrl+N',
    checkout: 'F12',
    clearCart: 'Esc',
    scanner: 'F2',
  });

  const handleSaveSettings = () => {
    // In a real app, this would save to localStorage or backend
    localStorage.setItem('pos-store-settings', JSON.stringify(storeSettings));
    localStorage.setItem('pos-receipt-settings', JSON.stringify(receiptSettings));
    localStorage.setItem('pos-display-settings', JSON.stringify(displaySettings));
    localStorage.setItem('pos-sound-settings', JSON.stringify(soundSettings));
    localStorage.setItem('pos-keyboard-settings', JSON.stringify(keyboardSettings));
    
    toast({
      title: "Settings Saved",
      description: "Your POS settings have been saved successfully.",
    });
  };

  const handleResetSettings = () => {
    // Reset to defaults
    setStoreSettings({
      storeName: 'Furniture Store',
      address: '123 Main Street, City',
      phone: '02-123-4567',
      taxId: '1234567890123',
      vatRate: 7,
    });
    
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            POS Settings
          </DialogTitle>
          <DialogDescription>
            Configure your point of sale system settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="store" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="store" className="text-xs">
              <Store className="w-4 h-4 mr-1" />
              Store
            </TabsTrigger>
            <TabsTrigger value="receipt" className="text-xs">
              <Receipt className="w-4 h-4 mr-1" />
              Receipt
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs">
              <Monitor className="w-4 h-4 mr-1" />
              Display
            </TabsTrigger>
            <TabsTrigger value="sound" className="text-xs">
              <Volume2 className="w-4 h-4 mr-1" />
              Sound
            </TabsTrigger>
            <TabsTrigger value="keyboard" className="text-xs">
              <Keyboard className="w-4 h-4 mr-1" />
              Shortcuts
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, storeName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={storeSettings.address}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={storeSettings.phone}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={storeSettings.taxId}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, taxId: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    value={storeSettings.vatRate}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, vatRate: Number(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt Settings */}
          <TabsContent value="receipt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Receipt Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showLogo">Show Store Logo</Label>
                  <Switch
                    id="showLogo"
                    checked={receiptSettings.showLogo}
                    onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, showLogo: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showCustomerInfo">Show Customer Information</Label>
                  <Switch
                    id="showCustomerInfo"
                    checked={receiptSettings.showCustomerInfo}
                    onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, showCustomerInfo: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showTaxBreakdown">Show Tax Breakdown</Label>
                  <Switch
                    id="showTaxBreakdown"
                    checked={receiptSettings.showTaxBreakdown}
                    onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, showTaxBreakdown: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="printAutomatically">Print Automatically</Label>
                  <Switch
                    id="printAutomatically"
                    checked={receiptSettings.printAutomatically}
                    onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, printAutomatically: checked }))}
                  />
                </div>
                <div>
                  <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
                  <Input
                    id="receiptFooter"
                    value={receiptSettings.receiptFooter}
                    onChange={(e) => setReceiptSettings(prev => ({ ...prev, receiptFooter: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Display Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showProductImages">Show Product Images</Label>
                  <Switch
                    id="showProductImages"
                    checked={displaySettings.showProductImages}
                    onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, showProductImages: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableAnimations">Enable Animations</Label>
                  <Switch
                    id="enableAnimations"
                    checked={displaySettings.enableAnimations}
                    onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, enableAnimations: checked }))}
                  />
                </div>
                <div>
                  <Label htmlFor="gridColumns">Product Grid Columns</Label>
                  <Input
                    id="gridColumns"
                    type="number"
                    min="2"
                    max="6"
                    value={displaySettings.gridColumns}
                    onChange={(e) => setDisplaySettings(prev => ({ ...prev, gridColumns: Number(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sound Settings */}
          <TabsContent value="sound" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sound Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableSounds">Enable Sounds</Label>
                  <Switch
                    id="enableSounds"
                    checked={soundSettings.enableSounds}
                    onCheckedChange={(checked) => setSoundSettings(prev => ({ ...prev, enableSounds: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="scanSound">Barcode Scan Sound</Label>
                  <Switch
                    id="scanSound"
                    checked={soundSettings.scanSound}
                    onCheckedChange={(checked) => setSoundSettings(prev => ({ ...prev, scanSound: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="errorSound">Error Sound</Label>
                  <Switch
                    id="errorSound"
                    checked={soundSettings.errorSound}
                    onCheckedChange={(checked) => setSoundSettings(prev => ({ ...prev, errorSound: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="successSound">Success Sound</Label>
                  <Switch
                    id="successSound"
                    checked={soundSettings.successSound}
                    onCheckedChange={(checked) => setSoundSettings(prev => ({ ...prev, successSound: checked }))}
                  />
                </div>
                <div>
                  <Label htmlFor="volume">Volume ({soundSettings.volume}%)</Label>
                  <Input
                    id="volume"
                    type="range"
                    min="0"
                    max="100"
                    value={soundSettings.volume}
                    onChange={(e) => setSoundSettings(prev => ({ ...prev, volume: Number(e.target.value) }))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keyboard Settings */}
          <TabsContent value="keyboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableShortcuts">Enable Keyboard Shortcuts</Label>
                  <Switch
                    id="enableShortcuts"
                    checked={keyboardSettings.enableShortcuts}
                    onCheckedChange={(checked) => setKeyboardSettings(prev => ({ ...prev, enableShortcuts: checked }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>New Sale</Label>
                    <Input value={keyboardSettings.newSale} readOnly />
                  </div>
                  <div>
                    <Label>Checkout</Label>
                    <Input value={keyboardSettings.checkout} readOnly />
                  </div>
                  <div>
                    <Label>Clear Cart</Label>
                    <Input value={keyboardSettings.clearCart} readOnly />
                  </div>
                  <div>
                    <Label>Barcode Scanner</Label>
                    <Input value={keyboardSettings.scanner} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleResetSettings}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}