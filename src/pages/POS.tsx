import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Receipt } from "lucide-react";

export default function POS() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">POS Sales</h1>
          <p className="text-muted-foreground">Point of Sale - Cash transactions and receipt generation</p>
        </div>
        <Button variant="admin">
          <ShoppingCart className="w-4 h-4 mr-2" />
          New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Product Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>POS interface coming soon...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Receipt Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Receipt preview will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}