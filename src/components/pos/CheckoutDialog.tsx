import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, CreditCard, Receipt, Check } from 'lucide-react';
import { POSState, Customer, PaymentMethod } from '@/types/pos';
import { paymentMethods } from '@/data/constants';
import { CustomerSelector } from './CustomerSelector';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: POSState;
  onSetCustomer: (customer: Customer) => void;
  onSetPaymentMethod: (method: PaymentMethod) => void;
  onCompleteSale: () => void;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  state,
  onSetCustomer,
  onSetPaymentMethod,
  onCompleteSale
}: CheckoutDialogProps) {

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    onSetCustomer(customer);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    onSetPaymentMethod(method);
  };

  const canCompleteSale = state.paymentMethod && state.cart.length > 0;

  const handleCompleteSale = () => {
    if (canCompleteSale) {
      onCompleteSale();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Customer & Payment */}
          <div className="space-y-6">
            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customer" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customer" className="space-y-4">
                <CustomerSelector
                  selectedCustomer={state.customer}
                  onSelectCustomer={handleCustomerSelect}
                />
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {paymentMethods.map((method) => (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-colors ${
                        state.paymentMethod?.id === method.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handlePaymentMethodSelect(method)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{method.icon}</span>
                            <div>
                              <p className="font-medium">{method.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {method.type} payment
                              </p>
                            </div>
                          </div>
                          {state.paymentMethod?.id === method.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>


              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Order Summary</h3>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {state.cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-sm">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(state.subtotal)}</span>
                  </div>
                  
                  {state.discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount:</span>
                      <span>-{formatPrice(state.discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Tax (7%):</span>
                    <span>{formatPrice(state.tax)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(state.total)}</span>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {state.customer ? (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        <Check className="w-3 h-3 mr-1" />
                        Customer Set
                      </Badge>
                    ) : (
                      <Badge variant="outline">Customer Optional</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {state.paymentMethod ? (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        <Check className="w-3 h-3 mr-1" />
                        Payment Method Selected
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Payment Method Required</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complete Sale Button */}
            <Button
              onClick={handleCompleteSale}
              disabled={!canCompleteSale}
              className="w-full"
              size="lg"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Complete Sale - {formatPrice(state.total)}
            </Button>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}