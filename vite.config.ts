import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production optimizations
    target: mode === 'production' ? 'es2015' : 'esnext',
    minify: mode === 'production' ? 'terser' : 'esbuild',
    sourcemap: mode === 'production' ? 'hidden' : true,
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    } : undefined,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            return 'vendor';
          }
          
          // Warehouse system feature chunks
          if (id.includes('src/components/warehouses') || id.includes('src/lib/warehouseService') || id.includes('src/lib/serialNumberService')) {
            return 'warehouse-features';
          }
          if (id.includes('src/services/printService') || id.includes('src/services/realTimeStockService')) {
            return 'warehouse-services';
          }
          
          // Other feature chunks
          if (id.includes('src/pages/POS') || id.includes('src/components/pos') || id.includes('src/hooks/usePOS')) {
            return 'pos-features';
          }
          if (id.includes('src/pages/Employees') || id.includes('src/components/employees') || id.includes('src/hooks/useEmployees')) {
            return 'employee-features';
          }
          if (id.includes('src/pages/Accounting') || id.includes('src/components/accounting') || id.includes('src/hooks/useAccounting')) {
            return 'accounting-features';
          }
          if (id.includes('src/pages/Reports') || id.includes('src/components/reports') || id.includes('src/hooks/useReports')) {
            return 'reports-features';
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset inlining
    assetsInlineLimit: 4096,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ]
  }
}));
