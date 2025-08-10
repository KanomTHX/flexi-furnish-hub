import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface EmployeeProfile {
  id: string;
  employee_code: string;
  full_name: string;
  role: string;
  branch_id: string | null;
  phone: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: EmployeeProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<EmployeeProfile>) => Promise<{ error: any }>;
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile using RPC function to avoid RLS issues
  const fetchProfile = async (userId: string) => {
    try {
      // First try using RPC function
      // Direct query since RPC doesn't exist
      const { data: profileData, error: profileError } = await supabase
        .from('employee_profiles')
        .select('id, employee_code, full_name, role, branch_id, phone, is_active')
        .eq('user_id', userId)
        .single();

      if (!profileError && profileData) {
        return profileData as EmployeeProfile;
      }
      if (profileError) {
        console.warn('Error fetching profile, creating fallback:', profileError.message);
        
        // Return fallback profile data
        return {
          id: userId,
          employee_code: 'TEMP001',
          full_name: 'ผู้ใช้ระบบ',
          role: 'staff',
          branch_id: null,
          phone: null,
          is_active: true
        } as EmployeeProfile;
      }

      return profileData as EmployeeProfile;
    } catch (error) {
      console.warn('Profile fetch error, using fallback:', error);
      
      // Return fallback profile data
      return {
        id: userId,
        employee_code: 'TEMP001',
        full_name: 'ผู้ใช้ระบบ',
        role: 'employee',
        branch_id: null,
        phone: null,
        is_active: true
      } as EmployeeProfile;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log('Auth state changed:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      // Auth ready immediately; don't block UI on profile fetching
      setLoading(false);

      if (session?.user) {
        // Defer to avoid potential deadlocks and fetch profile in background
        setTimeout(async () => {
          if (!mounted) return;
          try {
            const userProfile = await fetchProfile(session.user!.id);
            if (mounted) setProfile(userProfile);
          } catch (e) {
            // ignore profile fetch errors here
          }
        }, 0);
      } else {
        setProfile(null);
        // Clear all cached data on sign out
        queryClient.clear();
      }
    });

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          // Mark auth ready immediately to avoid blocking UI
          setLoading(false);

          if (session?.user) {
            // Fetch profile in background
            setTimeout(async () => {
              if (!mounted) return;
              try {
                const userProfile = await fetchProfile(session.user!.id);
                if (mounted) setProfile(userProfile);
              } catch (e) {
                // ignore profile fetch errors here
              }
            }, 0);
          } else {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "เข้าสู่ระบบไม่สำเร็จ",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: "ยินดีต้อนรับเข้าสู่ระบบ",
        });
      }

      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        toast({
          title: "สมัครสมาชิกไม่สำเร็จ",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.user) {
        // Create employee profile
        const { error: profileError } = await supabase
          .from('employee_profiles')
          .insert({
            user_id: data.user.id,
            employee_code: `EMP${Date.now().toString().slice(-6)}`,
            full_name: userData.full_name || email.split('@')[0],
            role: userData.role || 'employee',
            phone: userData.phone,
            is_active: true
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        toast({
          title: "สมัครสมาชิกสำเร็จ",
          description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี",
        });
      }

      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      // Clear all cached data
      queryClient.clear();
      
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "ขอบคุณที่ใช้บริการ",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<EmployeeProfile>) => {
    if (!user || !profile) {
      return { error: new Error('No user or profile found') };
    }

    try {
      // Direct update without RPC
      const { data, error } = await supabase
        .from('employee_profiles')
        .update({
          full_name: updates.full_name,
          phone: updates.phone
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "อัปเดตโปรไฟล์ไม่สำเร็จ",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      setProfile(data as EmployeeProfile);
      
      toast({
        title: "อัปเดตโปรไฟล์สำเร็จ",
        description: "ข้อมูลของคุณได้รับการอัปเดตแล้ว",
      });

      return { error: null };
    } catch (error) {
      console.error('Profile update error:', error);
      return { error };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}