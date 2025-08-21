import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Search, Plus, X, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  productName: string;
  productCode: string;
  category?: string;
  unit?: string;
  description?: string;
  imageUrl?: string;
  status: string;
}

interface ReceiveItem {
  id: string;
  product: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
  serialNumbers: string[];
}

interface ProductSelectionProps {
  products: Product[];
  filteredProducts: Product[];
  productSearchTerm: string;
  onProductSearchChange: (term: string) => void;
  showProductSearch: boolean;
  onToggleProductSearch: () => void;
  items: ReceiveItem[];
  onAddItem: (product: Product) => void;
  onAddProduct: () => void;
  error?: string;
}

export function ProductSelection({
  products,
  filteredProducts,
  productSearchTerm,
  onProductSearchChange,
  showProductSearch,
  onToggleProductSearch,
  items,
  onAddItem,
  onAddProduct,
  error
}: ProductSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">เลือกสินค้าที่รับเข้า</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>รายการสินค้า</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleProductSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                {showProductSearch ? 'ซ่อนการค้นหา' : 'ค้นหาสินค้า'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddProduct}
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มสินค้าใหม่
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showProductSearch && (
            <div>
              <Label htmlFor="productSearch">ค้นหาสินค้า</Label>
              <Input
                id="productSearch"
                value={productSearchTerm}
                onChange={(e) => onProductSearchChange(e.target.value)}
                placeholder="ค้นหาด้วยชื่อสินค้า หรือรหัสสินค้า..."
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => {
              const isSelected = items.some(item => item.product.id === product.id);
              
              return (
                <div
                  key={product.id}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-colors
                    ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => !isSelected && onAddItem(product)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {product.imageUrl && (
                        <div className="flex-shrink-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.productName}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{product.productName}</h4>
                        <p className="text-xs text-gray-500 mt-1">{product.productCode}</p>
                        {product.category && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {product.category}
                          </Badge>
                        )}
                        {product.unit && (
                          <p className="text-xs text-gray-500 mt-1">หน่วย: {product.unit}</p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-2">
                        <Badge variant="default" className="bg-green-500">
                          <Package className="w-3 h-3 mr-1" />
                          เลือกแล้ว
                        </Badge>
                      </div>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && productSearchTerm && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบสินค้าที่ตรงกับการค้นหา "{productSearchTerm}"</p>
            </div>
          )}

          {products.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ไม่พบสินค้าในระบบ กรุณาเพิ่มสินค้าใหม่ก่อน
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Selected Products Preview */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สินค้าที่เลือก ({items.length} รายการ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    {item.product.imageUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.productName}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="font-medium">{item.product.productName}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.product.productCode})</span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {item.product.unit || 'ชิ้น'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}