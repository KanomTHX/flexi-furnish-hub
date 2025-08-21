import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cacheManager } from "@/utils/cacheManager";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  branch_id: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  initializeCache: () => Promise<void>;
  isCacheLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCacheLoading, setIsCacheLoading] = useState(false);
  const { toast } = useToast();

  const cleanupAuthState = () => {
    // Clean up all auth-related storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Clear all cache data when signing out
    cacheManager.clearAll();
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Only log error if it's not a "not found" error
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }
        setProfile(null);
        return;
      }

      setProfile(profileData);
    } catch (error) {
      // Silently handle network errors to avoid console spam
      setProfile(null);
    }
  };

  const refetchProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const initializeCache = async () => {
    if (!user?.id || !profile?.branch_id) {
      console.log('Cannot initialize cache: missing user or branch info');
      return;
    }

    setIsCacheLoading(true);
    
    try {
      console.log('Initializing cache for daily login...');
      
      // ตรวจสอบว่าควรโหลดแคชใหม่หรือไม่ (ครั้งแรกของวัน)
      const shouldLoadCache = cacheManager.shouldRefresh('branches', 24 * 60 * 60 * 1000); // 24 hours
      
      if (shouldLoadCache) {
        console.log('Loading fresh cache data...');
        
        // โหลดข้อมูลพื้นฐานที่จำเป็น
        const cachePromises = [];
        
        // 1. ข้อมูลสาขา
        cachePromises.push(
          supabase
            .from('branches')
            .select('*')
            .eq('status', 'active')
            .order('name')
            .then(({ data, error }) => {
              if (!error && data) {
                cacheManager.setBranches(data);
                console.log('Cached branches:', data.length);
              }
            })
        );
        
        // 2. ข้อมูลหมวดหมู่สินค้า
        cachePromises.push(
          supabase
            .from('product_categories')
            .select('*')
            .eq('status', 'active')
            .order('name')
            .then(({ data, error }) => {
              if (!error && data) {
                cacheManager.setCategories(data);
                console.log('Cached categories:', data.length);
              }
            })
        );
        
        // 3. ข้อมูลพนักงานในสาขา
        cachePromises.push(
          supabase
            .from('employees')
            .select(`
              *,
              department:departments(id, name),
              position:positions(id, name)
            `)
            .eq('branch_id', profile.branch_id)
            .eq('status', 'active')
            .order('first_name')
            .then(({ data, error }) => {
              if (!error && data) {
                cacheManager.setEmployees(data, profile.branch_id!);
                console.log('Cached employees:', data.length);
              }
            })
        );
        
        // 4. ข้อมูลลูกค้าในสาขา
        cachePromises.push(
          supabase
            .from('customers')
            .select('*')
            .eq('branch_id', profile.branch_id)
            .eq('status', 'active')
            .order('name')
            .then(({ data, error }) => {
              if (!error && data) {
                cacheManager.setCustomers(data, profile.branch_id!);
                console.log('Cached customers:', data.length);
              }
            })
        );
        
        // 5. ข้อมูลสินค้าในสาขา (จำกัดเฉพาะที่มีสต็อก)
        cachePromises.push(
          supabase
            .from('products')
            .select(`
              *,
              category:product_categories(id, name, code),
              inventory:product_inventory(
                branch_id,
                quantity,
                available_quantity,
                status
              )
            `)
            .eq('status', 'active')
            .order('name')
            .then(({ data, error }) => {
              if (!error && data) {
                // กรองเฉพาะสินค้าที่มีในสาขานี้
                const branchProducts = data.filter(product => 
                  product.inventory?.some((inv: any) => 
                    inv.branch_id === profile.branch_id && inv.quantity > 0
                  )
                );
                cacheManager.setProducts(branchProducts, profile.branch_id!);
                console.log('Cached products:', branchProducts.length);
              }
            })
        );
        
        // 6. ข้อมูลโปรไฟล์ผู้ใช้
        if (profile) {
          cacheManager.setUserProfile(profile);
          console.log('Cached user profile');
        }
        
        // รอให้ทุก Promise เสร็จสิ้น
        await Promise.allSettled(cachePromises);
        
        toast({
          title: "โหลดข้อมูลเสร็จสิ้น",
          description: "ข้อมูลพื้นฐานได้ถูกโหลดและเก็บไว้ในแคชแล้ว",
        });
        
        console.log('Cache initialization completed');
      } else {
        console.log('Using existing cache data');
      }
      
    } catch (error) {
      console.error('Error initializing cache:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลแคชได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsCacheLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out completed');
      }
      
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "ขอบคุณที่ใช้บริการ",
      });
      
      // Force page redirect for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile data when user signs in
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize cache when user profile is loaded
  useEffect(() => {
    if (user && profile && profile.branch_id && !isCacheLoading) {
      // เรียกใช้ initializeCache หลังจากที่ได้ข้อมูลผู้ใช้และโปรไฟล์แล้ว
      initializeCache();
    }
  }, [user, profile]);

  const value = {
    user,
    session,
    profile,
    isLoading,
    signOut,
    refetchProfile,
    initializeCache,
    isCacheLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}