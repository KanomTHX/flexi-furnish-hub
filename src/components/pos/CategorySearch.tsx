import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package, Plus, Eye, Search, Star } from 'lucide-react';
import { Product } from '@/types/pos';
import { SerialNumber } from '@/types/serialNumber';
import { useSupabasePOS, SupabaseProduct } from '@/hooks/useSupabasePOS';
import { useBranchData } from '@/hooks/useBranchData';
import { useToast } from '@/hooks/use-toast';
import { addProductToFavorites } from './FavoriteProducts';

interface CategorySearchProps {
  onAddToCart: (product: Product, serialNumbers?: SerialNumber[]) => void;
  onProductSelect?: (product: Product) => void;
}

interface ProductWithDetails extends SupabaseProduct {
  stock: number;
  costPrice?: number;
  serialNumbers?: SerialNumber[];
  availableSerialNumbers?: SerialNumber[];
}

interface CategoryWithProducts {
  id: string;
  name: string;
  products: ProductWithDetails[];
}

export function CategorySearch({ onAddToCart, onProductSelect }: CategorySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<string[]>([]);
  
  const { currentBranch } = useBranchData();
  const { toast } = useToast();
  const { 
    products: supabaseProducts, 
    categories, 
    loading, 
    fetchProducts, 
    getProductStock,
    getProductSerialNumbers
  } = useSupabasePOS();

  const [productsWithDetails, setProductsWithDetails] = useState<ProductWithDetails[]>([]);
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);

  // ดึงข้อมูลสินค้าเมื่อ component mount หรือเมื่อเปลี่ยนสาขา
  useEffect(() => {
    if (currentBranch) {
      fetchProducts(currentBranch.id);
    }
  }, [currentBranch, fetchProducts]);

  // อัปเดตข้อมูลสินค้าพร้อมรายละเอียด
  const updateProductsWithDetails = useCallback(async () => {
    if (!currentBranch || supabaseProducts.length === 0) return;

    const productsWithDetailsData = await Promise.all(
      supabaseProducts.map(async (product) => {
        const stockData = await getProductStock(product.id, currentBranch.id);
        const serialNumbers = await getProductSerialNumbers(product.id, currentBranch.id);
        
        return {
          ...product,
          stock: stockData.available_quantity || 0,
          costPrice: stockData.average_cost || product.cost_price,
          serialNumbers: serialNumbers || [],
          availableSerialNumbers: serialNumbers?.filter(sn => sn.status === 'available') || []
        };
      })
    );

    setProductsWithDetails(productsWithDetailsData);
  }, [supabaseProducts, currentBranch, getProductStock, getProductSerialNumbers]);

  useEffect(() => {
    updateProductsWithDetails();
  }, [updateProductsWithDetails]);

  // จัดกลุ่มสินค้าตามหมวดหมู่
  useEffect(() => {
    if (productsWithDetails.length === 0 || categories.length === 0) return;

    const grouped = categories.map(category => {
      const categoryProducts = productsWithDetails.filter(product => 
        product.category_id === category.id
      );
      
      return {
        id: category.id,
        name: category.name,
        products: categoryProducts
      };
    }).filter(category => category.products.length > 0);

    setCategoriesWithProducts(grouped);
  }, [productsWithDetails, categories]);

  // กรองหมวดหมู่ตามคำค้นหา
  const filteredCategories = categoriesWithProducts.filter(category => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return category.name.toLowerCase().includes(term) ||
           category.products.some(product => 
             product.name.toLowerCase().includes(term) ||
             product.product_code.toLowerCase().includes(term)
           );
  });

  // แปลงข้อมูลสินค้าให้เข้ากับ Product interface
  const convertToProduct = (productWithDetails: ProductWithDetails): Product => ({
    id: productWithDetails.id,
    name: productWithDetails.name,
    sku: productWithDetails.product_code,
    price: productWithDetails.selling_price,
    category: productWithDetails.category?.name || 'ไม่ระบุ',
    stock: productWithDetails.stock,
    description: productWithDetails.description,
    barcode: productWithDetails.barcode
  });

  // จัดการการเลือกสินค้า
  const handleProductSelect = (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setSelectedSerialNumbers([]);
    onProductSelect?.(convertToProduct(product));
  };

  // จัดการการเลือก Serial Number
  const handleSerialNumberToggle = (serialNumber: string) => {
    setSelectedSerialNumbers(prev => {
      if (prev.includes(serialNumber)) {
        return prev.filter(sn => sn !== serialNumber);
      } else {
        return [...prev, serialNumber];
      }
    });
  };

  // จัดการการเพิ่มลงตะกร้า
  const handleAddToCart = (product: ProductWithDetails) => {
    const convertedProduct = convertToProduct(product);
    const selectedSNs = product.availableSerialNumbers?.filter(sn => 
      selectedSerialNumbers.includes(sn.serialNumber)
    );

    if (product.serialNumbers && product.serialNumbers.length > 0 && selectedSerialNumbers.length === 0) {
      toast({
        title: "กรุณาเลือก Serial Number",
        description: "สินค้านี้ต้องระบุ Serial Number ก่อนเพิ่มลงตะกร้า",
        variant: "destructive"
      });
      return;
    }

    onAddToCart(convertedProduct, selectedSNs);
    setSelectedSerialNumbers([]);
    
    toast({
      title: "เพิ่มลงตะกร้าแล้ว",
      description: `${convertedProduct.name} ${selectedSNs?.length ? `(${selectedSNs.length} ชิ้น)` : ''} ได้ถูกเพิ่มลงในตะกร้าแล้ว`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'destructive';
    if (stock <= 5) return 'secondary';
    return 'default';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
        <p className="text-muted-foreground">กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    );
  }

  if (!currentBranch) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>กรุณาเลือกสาขาก่อนค้นหาสินค้า</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            ค้นหาตามหมวดหมู่
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ค้นหาหมวดหมู่หรือสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">หมวดหมู่สินค้า ({filteredCategories.length} หมวดหมู่)</h3>
          
          {filteredCategories.map(category => (
            <Card 
              key={category.id} 
              className={`cursor-pointer transition-colors hover:bg-muted ${
                selectedCategory === category.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <Badge variant="outline">
                    {category.products.length} รายการ
                  </Badge>
                </div>
              </CardHeader>
              
              {selectedCategory === category.id && (
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {category.products.map(product => (
                      <div
                        key={product.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                          selectedProduct?.id === product.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductSelect(product);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{product.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {product.product_code}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                              <span>ราคา: {formatPrice(product.selling_price)}</span>
                              <span>กำไร: {formatPrice(product.selling_price - (product.costPrice || 0))}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={getStockStatusColor(product.stock)} className="text-xs">
                                สต็อก: {product.stock}
                              </Badge>
                              {product.availableSerialNumbers && product.availableSerialNumbers.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  SN: {product.availableSerialNumbers.length} ชิ้น
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                const success = addProductToFavorites({
                                  id: product.id,
                                  name: product.name,
                                  sku: product.product_code,
                                  price: product.selling_price,
                                  stock: product.stock,
                                  category: product.category?.name || 'ไม่ระบุ',
                                  description: product.description || '',
                                  barcode: product.barcode || ''
                                }, currentBranch.id);
                                
                                if (success) {
                                  toast({
                                    title: "เพิ่มในรายการโปรดแล้ว",
                                    description: `${product.name} ถูกเพิ่มในรายการโปรดแล้ว`
                                  });
                                } else {
                                  toast({
                                    title: "สินค้านี้อยู่ในรายการโปรดแล้ว",
                                    description: `${product.name} อยู่ในรายการโปรดของคุณแล้ว`
                                  });
                                }
                              }}
                              title="เพิ่มเข้ารายการโปรด"
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductSelect(product);
                              }}
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (product.availableSerialNumbers && product.availableSerialNumbers.length > 0) {
                                  handleProductSelect(product);
                                } else {
                                  handleAddToCart(product);
                                }
                              }}
                              disabled={product.stock === 0}
                              title="เพิ่มลงตะกร้า"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>ไม่พบหมวดหมู่ที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </div>

        {/* Product Details */}
        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>รายละเอียดสินค้า</span>
                <Button
                  onClick={() => handleAddToCart(selectedProduct)}
                  disabled={selectedProduct.stock === 0}
                  className="ml-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มลงตะกร้า
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">รหัสสินค้า:</span>
                  <p className="font-medium">{selectedProduct.product_code}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">หมวดหมู่:</span>
                  <p className="font-medium">{selectedProduct.category?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ราคาต้นทุน:</span>
                  <p className="font-medium">{formatPrice(selectedProduct.costPrice || 0)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ราคาขาย:</span>
                  <p className="font-medium">{formatPrice(selectedProduct.selling_price)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">กำไรต่อชิ้น:</span>
                  <p className="font-medium text-green-600">
                    {formatPrice(selectedProduct.selling_price - (selectedProduct.costPrice || 0))}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">สต็อกคงเหลือ:</span>
                  <p className="font-medium">{selectedProduct.stock} ชิ้น</p>
                </div>
              </div>

              {/* Serial Numbers */}
              {selectedProduct.availableSerialNumbers && selectedProduct.availableSerialNumbers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Serial Numbers ที่พร้อมขาย</h4>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {selectedProduct.availableSerialNumbers.map(sn => (
                      <div
                        key={sn.id}
                        className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                          selectedSerialNumbers.includes(sn.serialNumber) 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleSerialNumberToggle(sn.serialNumber)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{sn.serialNumber}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sn.position && `ตำแหน่ง: ${sn.position}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedSerialNumbers.length > 0 && (
                    <div className="mt-2 p-2 bg-primary/5 rounded">
                      <p className="text-sm">
                        เลือกแล้ว: {selectedSerialNumbers.length} ชิ้น
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}