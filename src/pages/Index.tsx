import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthConnectionTest } from "@/components/auth/AuthConnectionTest";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, UserPlus } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-6">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>ยินดีต้อนรับ!</CardTitle>
              <CardDescription>
                คุณได้เข้าสู่ระบบแล้ว กรุณาเลือกเมนูจากแถบด้านข้าง
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ผู้ใช้: {(user as any)?.user_metadata?.full_name || user.email}
              </p>
            </CardContent>
          </Card>
          
          <AuthConnectionTest />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">ระบบจัดการร้านค้า</h1>
          <p className="text-xl text-muted-foreground mb-8">
            เข้าสู่ระบบเพื่อเริ่มใช้งาน
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/auth">
              <LogIn className="mr-2 h-4 w-4" />
              เข้าสู่ระบบ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
