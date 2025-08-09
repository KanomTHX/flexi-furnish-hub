import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { usePOSIntegration } from '@/hooks/usePOSIntegration';
import { usePOS } from '@/hooks/usePOS';
import { CheckCircle, XCircle, AlertTriangle, Package, ShoppingCart, Clock } from 'lucide-react';

interface POSIntegrationProps {
  warehouseId?: string;
}

export function POSIntegration({ warehouseId }: POSIntegrationProps) {
  const { state: posState, actions: posActions } = usePOS();
  const {
    loading,
    error,
    checkStockAvailability,
    handleSaleCompletion,
    getStockLevelsForPOS
  } = usePOSIntegration();

  const [stockLevels, setStockLevels] = useState<any[]>([]);
  const [availabilityCheck, setAvailabilityCheck] = useState<any>(null);
  const [lastSaleResult, setLastSaleResult] = useState<any>(null);

  // Load stock levels on component mount
  useEffect(() => {
    const loadStockLevels = async () => {
      const result = await getStockLevelsForPOS(warehouseId);
      if (result.success) {
        setStockLevels(result.stockLevels);
      }
    };

    loadStockLevels();
  }, [warehouseId, getStockLevelsForPOS]);

  // Check availability when cart changes
  useEffect(() => {
    if (posState.cart.length > 0) {
      const checkAvailability = async () => {
        const items = posState.cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          warehouseId
        }));

        const result = await checkStockAvailability({ items });
        setAvailabilityCheck(result);
      };

      checkAvailability();
    } else {
      setAvailabilityCheck(null);
    }
  }, [posState.cart, warehouseId, checkStockAvailability]);

  const handleCompleteSaleWithStock = async () => {
    if (!posState.paymentMethod || posState.cart.length === 0) {
      return;
    }

    try {
      // Complete the POS sale first
      const sale = await posActions.completeCashSale();
      
      if (sale) {
        // Then handle stock deduction
        const stockResult = await handleSaleCompletion(sale);
        setLastSaleResult(stockResult);
        
        if (stockResult.success) {
          // Refresh stock levels
          const result = await getStockLevelsForPOS(warehouseId);
          if (result.success) {
            setStockLevels(result.stockLevels);
          }
        }
      }
    } catch (err) {
      console.error('Error completing sale with stock integration:', err);
    }
  };

  const getStockStatusIcon = (available: number, requested: number) => {
    if (available >= requested) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (available > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStockStatusText = (available: number, requested: number) => {
    if (available >= requested) {
      return 'Available';
    } else if (available > 0) {
      return 'Partial';
    } else {
      return 'Out of Stock';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Cart Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Current Cart Stock Status
          </CardTitle>
          <CardDescription>
            Real-time stock availability for items in cart
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posState.cart.length === 0 ? (
            <p className="text-muted-foreground">No items in cart</p>
          ) : (
            <div className="space-y-3">
              {posState.cart.map((item, index) => {
                const availability = availabilityCheck?.availability.find(
                  (a: any) => a.productId === item.product.id
                );
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Requested: {item.quantity} | Available: {availability?.available || 0}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {availability && getStockStatusIcon(availability.available, availability.requested)}
                      <Badge variant={
                        availability?.isAvailable ? 'default' : 
                        availability?.available > 0 ? 'secondary' : 'destructive'
                      }>
                        {availability ? getStockStatusText(availability.available, availability.requested) : 'Checking...'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  Overall Status: {availabilityCheck?.success ? 'All Available' : 'Issues Found'}
                </div>
                <Button 
                  onClick={handleCompleteSaleWithStock}
                  disabled={loading || !availabilityCheck?.success || !posState.paymentMethod}
                  className="flex items-center gap-2"
                >
                  {loading && <Clock className="h-4 w-4 animate-spin" />}
                  Complete Sale & Update Stock
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>      {/*
 Stock Levels Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Levels for POS
          </CardTitle>
          <CardDescription>
            Current stock availability for all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockLevels.length === 0 ? (
            <p className="text-muted-foreground">No stock data available</p>
          ) : (
            <div className="space-y-2">
              {stockLevels.map((stock, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{stock.productName}</div>
                    <div className="text-sm text-muted-foreground">{stock.productCode}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-green-600">Available: {stock.availableQuantity}</div>
                    {stock.reservedQuantity > 0 && (
                      <div className="text-yellow-600">Reserved: {stock.reservedQuantity}</div>
                    )}
                    <div className="text-muted-foreground">Total: {stock.totalQuantity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Sale Result */}
      {lastSaleResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastSaleResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Last Sale Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={lastSaleResult.success ? 'border-green-200' : 'border-red-200'}>
              <AlertDescription>
                {lastSaleResult.message}
              </AlertDescription>
            </Alert>
            
            {lastSaleResult.processedItems && lastSaleResult.processedItems.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Processed Items:</h4>
                {lastSaleResult.processedItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>Product ID: {item.productId}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
                        {item.status}
                      </Badge>
                      <span>SNs: {item.serialNumbers.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}