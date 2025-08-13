import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/', { replace: true });
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: `ยินดีต้อนรับ ${session.user.email}`,
        });
        
        // Use setTimeout to defer navigation and prevent potential deadlocks
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleSuccess = () => {
    // Navigation will be handled by auth state change listener
    console.log('Auth success, waiting for redirect...');
  };

  return (
    <AuthCard
      title={mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
      description={
        mode === 'login'
          ? 'กรอกข้อมูลเพื่อเข้าสู่ระบบ'
          : 'สร้างบัญชีใหม่เพื่อเริ่มใช้งาน'
      }
    >
      {mode === 'login' ? (
        <LoginForm onToggleMode={handleToggleMode} onSuccess={handleSuccess} />
      ) : (
        <SignUpForm onToggleMode={handleToggleMode} onSuccess={handleSuccess} />
      )}
    </AuthCard>
  );
}