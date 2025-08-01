import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  ShoppingCart,
  CreditCard,
  Warehouse,
  Clock,
  Eye,
  ChevronRight,
  Activity
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Today's Sales",
      value: "$12,450",
      change: "+8.2%",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Active Installments",
      value: "156",
      change: "+12",
      icon: CreditCard,
      color: "text-info",
      bgColor: "bg-info/10"
    },
    {
      title: "Low Stock Items",
      value: "23",
      change: "+5",
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "Pending Claims",
      value: "8",
      change: "-2",
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    }
  ];

  const recentSales = [
    { id: "#INV-001", customer: "John Smith", amount: "$450", status: "completed", time: "2 hours ago" },
    { id: "#INV-002", customer: "Sarah Johnson", amount: "$1,200", status: "pending", time: "3 hours ago" },
    { id: "#INV-003", customer: "Mike Wilson", amount: "$750", status: "completed", time: "5 hours ago" },
    { id: "#INV-004", customer: "Lisa Brown", amount: "$980", status: "processing", time: "6 hours ago" },
  ];

  const lowStockItems = [
    { name: "Office Chair Model A", sku: "OC-001", stock: 3, min: 10 },
    { name: "Dining Table Set", sku: "DT-205", stock: 1, min: 5 },
    { name: "Bookshelf Premium", sku: "BS-108", stock: 2, min: 8 },
    { name: "Sofa 3-Seater", sku: "SF-301", stock: 0, min: 4 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "processing": return "bg-info text-info-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening at your store today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button variant="admin" size="sm">
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm ${stat.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                    {stat.change} from yesterday
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-card-header rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Sales</CardTitle>
                  <CardDescription>Latest transactions from all branches</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentSales.map((sale, index) => (
                  <div key={index} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sale.id}</p>
                        <p className="text-sm text-muted-foreground">{sale.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{sale.amount}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getStatusColor(sale.status)}>
                          {sale.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{sale.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        <div>
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-card-header rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                <div>
                  <CardTitle className="text-lg">Low Stock Alert</CardTitle>
                  <CardDescription>Items that need restocking</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground text-sm">{item.name}</p>
                      <Badge 
                        variant="outline" 
                        className={item.stock === 0 ? "border-destructive text-destructive" : "border-warning text-warning"}
                      >
                        {item.stock === 0 ? "Out of Stock" : "Low Stock"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>SKU: {item.sku}</span>
                      <span>{item.stock}/{item.min} items</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.stock === 0 ? 'bg-destructive' : 'bg-warning'}`}
                        style={{ width: `${Math.min((item.stock / item.min) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Package className="w-4 h-4 mr-2" />
                  Manage Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-card">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">New Sale</h3>
            <p className="text-sm text-muted-foreground">Create new POS transaction</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-card">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-info" />
            </div>
            <h3 className="font-semibold text-foreground">Installment</h3>
            <p className="text-sm text-muted-foreground">Setup payment plan</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-card">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Warehouse className="w-6 h-6 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Add Stock</h3>
            <p className="text-sm text-muted-foreground">Receive new inventory</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-card">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Reports</h3>
            <p className="text-sm text-muted-foreground">View analytics & insights</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}