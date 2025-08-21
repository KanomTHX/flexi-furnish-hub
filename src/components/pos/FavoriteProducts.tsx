import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Star, StarOff, Plus, Search, Package } from 'lucide-react';
import { Product } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';
import { useBranchData } from '@/hooks/useBranchData';

interface FavoriteProductsProps {
  onAddToCart: (product: Product) => void;
}

interface FavoriteProduct {
  id: string;
  product: Product;
  addedAt: Date;
  usageCount: number;
}

export function FavoriteProducts({ onAddToCart }: FavoriteProductsProps) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentBranch } = useBranchData();

  // โหลดรายการสินค้าโปรดจาก localStorage
  useEffect(() => {
    const loadFavorites = () => {
      try {
        if (!currentBranch?.id) {
          setLoading(false);
          return;
        }
        
        const stored = localStorage.getItem(`pos_favorites_${currentBranch.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setFavorites(parsed.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          })));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [currentBranch?.id]);

  // บันทึกรายการสินค้าโปรดลง localStorage
  const saveFavorites = (newFavorites: FavoriteProduct[]) => {
    try {
      if (!currentBranch?.id) return;
      
      localStorage.setItem(
        `pos_favorites_${currentBranch.id}`,
        JSON.stringify(newFavorites)
      );
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // เพิ่มสินค้าเข้ารายการโปรด
  const addToFavorites = (product: Product) => {
    const existingIndex = favorites.findIndex(fav => fav.product.id === product.id);
    
    if (existingIndex >= 0) {
      toast({
        title: "สินค้านี้อยู่ในรายการโปรดแล้ว",
        description: `${product.name} อยู่ในรายการโปรดของคุณแล้ว`,
        variant: "default"
      });
      return;
    }

    const newFavorite: FavoriteProduct = {
      id: `fav_${Date.now()}_${product.id}`,
      product,
      addedAt: new Date(),
      usageCount: 0
    };

    const newFavorites = [...favorites, newFavorite];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);

    toast({
      title: "เพิ่มในรายการโปรดแล้ว",
      description: `${product.name} ถูกเพิ่มในรายการโปรดแล้ว`,
      variant: "default"
    });
  };

  // ลบสินค้าออกจากรายการโปรด
  const removeFromFavorites = (favoriteId: string) => {
    const favorite = favorites.find(fav => fav.id === favoriteId);
    const newFavorites = favorites.filter(fav => fav.id !== favoriteId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);

    if (favorite) {
      toast({
        title: "ลบออกจากรายการโปรดแล้ว",
        description: `${favorite.product.name} ถูกลบออกจากรายการโปรดแล้ว`,
        variant: "default"
      });
    }
  };

  // เพิ่มสินค้าลงตะกร้าและอัปเดตจำนวนการใช้งาน
  const handleAddToCart = (favorite: FavoriteProduct) => {
    // อัปเดตจำนวนการใช้งาน
    const updatedFavorites = favorites.map(fav => 
      fav.id === favorite.id 
        ? { ...fav, usageCount: fav.usageCount + 1 }
        : fav
    );
    setFavorites(updatedFavorites);
    saveFavorites(updatedFavorites);

    // เพิ่มลงตะกร้า
    onAddToCart(favorite.product);
  };

  // กรองสินค้าตามคำค้นหา
  const filteredFavorites = favorites.filter(favorite =>
    favorite.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    favorite.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    favorite.product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // เรียงลำดับตามจำนวนการใช้งานและวันที่เพิ่ม
  const sortedFavorites = filteredFavorites.sort((a, b) => {
    if (a.usageCount !== b.usageCount) {
      return b.usageCount - a.usageCount; // เรียงจากมากไปน้อย
    }
    return b.addedAt.getTime() - a.addedAt.getTime(); // เรียงจากใหม่ไปเก่า
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>กำลังโหลดรายการโปรด...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              รายการสินค้าโปรด
            </CardTitle>
            <Badge variant="secondary">
              {favorites.length} รายการ
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ค้นหาสินค้าโปรด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Favorites List */}
      {sortedFavorites.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
              {searchTerm ? (
                <>
                  <p>ไม่พบสินค้าโปรดที่ค้นหา</p>
                  <p className="text-sm">ลองใช้คำค้นหาอื่น</p>
                </>
              ) : (
                <>
                  <p>ยังไม่มีสินค้าโปรด</p>
                  <p className="text-sm">เพิ่มสินค้าที่ใช้บ่อยเข้ารายการโปรดเพื่อเข้าถึงได้ง่ายขึ้น</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFavorites.map((favorite) => (
            <Card key={favorite.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Product Info */}
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2">
                      {favorite.product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      SKU: {favorite.product.sku}
                    </p>
                  </div>

                  {/* Category and Stock */}
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className="text-xs">
                      {favorite.product.category}
                    </Badge>
                    <span className={`font-medium ${
                      favorite.product.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      คงเหลือ: {favorite.product.stock}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-lg font-bold text-primary">
                    ฿{favorite.product.price.toLocaleString()}
                  </div>

                  {/* Usage Stats */}
                  <div className="text-xs text-muted-foreground">
                    ใช้งาน: {favorite.usageCount} ครั้ง
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(favorite)}
                      disabled={favorite.product.stock === 0}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      เพิ่มลงตะกร้า
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromFavorites(favorite.id)}
                    >
                      <StarOff className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Export function สำหรับเพิ่มสินค้าเข้ารายการโปรดจากหน้าอื่น
export const addProductToFavorites = (product: Product, branchId: string) => {
  try {
    const stored = localStorage.getItem(`pos_favorites_${branchId}`);
    const favorites: FavoriteProduct[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = favorites.findIndex(fav => fav.product.id === product.id);
    if (existingIndex >= 0) {
      return false; // สินค้าอยู่ในรายการโปรดแล้ว
    }

    const newFavorite: FavoriteProduct = {
      id: `fav_${Date.now()}_${product.id}`,
      product,
      addedAt: new Date(),
      usageCount: 0
    };

    favorites.push(newFavorite);
    localStorage.setItem(`pos_favorites_${branchId}`, JSON.stringify(favorites));
    return true; // เพิ่มสำเร็จ
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};