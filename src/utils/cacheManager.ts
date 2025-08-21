// Cache Manager for Local Storage
// จัดการการเก็บข้อมูลแคชใน localStorage เพื่อลดการโหลดจาก Supabase

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size in MB
  version: string; // Cache version for invalidation
}

export class CacheManager {
  private static instance: CacheManager;
  private config: CacheConfig;
  private readonly CACHE_PREFIX = 'flexi_cache_';
  private readonly CACHE_METADATA_KEY = 'flexi_cache_metadata';

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 10, // 10MB
      version: '1.0.0',
      ...config
    };
    
    this.initializeCache();
  }

  public static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  private initializeCache(): void {
    // ตรวจสอบและล้างแคชที่หมดอายุ
    this.cleanExpiredCache();
    
    // ตรวจสอบเวอร์ชันแคช
    this.validateCacheVersion();
    
    // ตรวจสอบขนาดแคช
    this.checkCacheSize();
  }

  private validateCacheVersion(): void {
    const metadata = this.getCacheMetadata();
    if (metadata.version !== this.config.version) {
      console.log('Cache version mismatch, clearing cache');
      this.clearAll();
      this.setCacheMetadata({ version: this.config.version, lastCleanup: Date.now() });
    }
  }

  private getCacheMetadata(): { version: string; lastCleanup: number } {
    try {
      const metadata = localStorage.getItem(this.CACHE_METADATA_KEY);
      return metadata ? JSON.parse(metadata) : { version: '', lastCleanup: 0 };
    } catch {
      return { version: '', lastCleanup: 0 };
    }
  }

  private setCacheMetadata(metadata: { version: string; lastCleanup: number }): void {
    localStorage.setItem(this.CACHE_METADATA_KEY, JSON.stringify(metadata));
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // ตรวจสอบทุก key ที่เป็นแคช
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        try {
          const item = this.getRawCacheItem(key);
          if (item && item.expiresAt < now) {
            keysToRemove.push(key);
          }
        } catch {
          // ถ้าไม่สามารถ parse ได้ ให้ลบออก
          keysToRemove.push(key);
        }
      }
    }

    // ลบ key ที่หมดอายุ
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`Cleaned ${keysToRemove.length} expired cache items`);
    }
  }

  private checkCacheSize(): void {
    const sizeInMB = this.getCacheSizeInMB();
    if (sizeInMB > this.config.maxSize) {
      console.warn(`Cache size (${sizeInMB}MB) exceeds limit (${this.config.maxSize}MB)`);
      this.clearOldestItems();
    }
  }

  private getCacheSizeInMB(): number {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }
    return totalSize / (1024 * 1024); // Convert to MB
  }

  private clearOldestItems(): void {
    const cacheItems: { key: string; timestamp: number }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        try {
          const item = this.getRawCacheItem(key);
          if (item) {
            cacheItems.push({ key, timestamp: item.timestamp });
          }
        } catch {
          // ถ้าไม่สามารถ parse ได้ ให้ลบออก
          localStorage.removeItem(key);
        }
      }
    }

    // เรียงตาม timestamp และลบ 25% ของรายการเก่าที่สุด
    cacheItems.sort((a, b) => a.timestamp - b.timestamp);
    const itemsToRemove = Math.ceil(cacheItems.length * 0.25);
    
    for (let i = 0; i < itemsToRemove; i++) {
      localStorage.removeItem(cacheItems[i].key);
    }
    
    console.log(`Removed ${itemsToRemove} oldest cache items`);
  }

  private getRawCacheItem(key: string): CacheItem | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private generateCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  // Public methods
  public set<T>(key: string, data: T, ttl?: number): void {
    const cacheKey = this.generateCacheKey(key);
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt,
      version: this.config.version
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to set cache item, storage might be full:', error);
      // ลองล้างแคชเก่าและลองอีกครั้ง
      this.clearOldestItems();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      } catch {
        console.error('Failed to set cache item after cleanup');
      }
    }
  }

  public get<T>(key: string): T | null {
    const cacheKey = this.generateCacheKey(key);
    const item = this.getRawCacheItem(cacheKey);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    
    // ตรวจสอบว่าหมดอายุหรือไม่
    if (item.expiresAt < now) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    // ตรวจสอบเวอร์ชัน
    if (item.version !== this.config.version) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return item.data as T;
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public remove(key: string): void {
    const cacheKey = this.generateCacheKey(key);
    localStorage.removeItem(cacheKey);
  }

  public clear(pattern?: string): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        if (!pattern || key.includes(pattern)) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  public clearAll(): void {
    this.clear();
  }

  public getStats(): {
    totalItems: number;
    sizeInMB: number;
    oldestItem: number | null;
    newestItem: number | null;
  } {
    let totalItems = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        totalItems++;
        try {
          const item = this.getRawCacheItem(key);
          if (item) {
            if (oldestTimestamp === null || item.timestamp < oldestTimestamp) {
              oldestTimestamp = item.timestamp;
            }
            if (newestTimestamp === null || item.timestamp > newestTimestamp) {
              newestTimestamp = item.timestamp;
            }
          }
        } catch {
          // Skip invalid items
        }
      }
    }

    return {
      totalItems,
      sizeInMB: this.getCacheSizeInMB(),
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp
    };
  }

  // ฟังก์ชันสำหรับแคชข้อมูลเฉพาะ
  public setBranches(branches: any[]): void {
    this.set('branches', branches);
  }

  public getBranches(): any[] | null {
    return this.get('branches');
  }

  public setProducts(products: any[]): void {
    this.set('products', products);
  }

  public getProducts(): any[] | null {
    return this.get('products');
  }

  public setCategories(categories: any[]): void {
    this.set('categories', categories);
  }

  public getCategories(): any[] | null {
    return this.get('categories');
  }

  public setEmployees(employees: any[]): void {
    this.set('employees', employees);
  }

  public getEmployees(): any[] | null {
    return this.get('employees');
  }

  public setCustomers(customers: any[]): void {
    this.set('customers', customers);
  }

  public getCustomers(): any[] | null {
    return this.get('customers');
  }

  public setUserProfile(profile: any): void {
    this.set('user_profile', profile, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  public getUserProfile(): any | null {
    return this.get('user_profile');
  }

  // ฟังก์ชันสำหรับตรวจสอบว่าควรโหลดข้อมูลใหม่หรือไม่
  public shouldRefresh(key: string, maxAge: number = 60 * 60 * 1000): boolean {
    const cacheKey = this.generateCacheKey(key);
    const item = this.getRawCacheItem(cacheKey);
    
    if (!item) {
      return true; // ไม่มีแคช ต้องโหลดใหม่
    }

    const age = Date.now() - item.timestamp;
    return age > maxAge; // ถ้าเก่าเกินกำหนด ต้องโหลดใหม่
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();