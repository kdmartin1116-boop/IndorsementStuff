import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Bundle analyzer plugin
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      // Bundle analyzer - only in build mode
      command === 'build' && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    
    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@types': resolve(__dirname, 'src/types'),
        '@assets': resolve(__dirname, 'src/assets'),
      },
    },
    
    // Development server configuration
    server: {
      port: 3000,
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    // Build optimization
    build: {
      target: 'es2020',
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'terser',
      
      // Terser options for better compression
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      
      // Rollup options for bundle optimization
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // React and related libraries
            'react-vendor': ['react', 'react-dom'],
            
            // UI components library
            'ui-components': [
              '@/components/UI/UIComponents',
              '@/components/Form/FormComponents',
              '@/components/Layout/LayoutComponents',
            ],
            
            // Utilities and hooks
            'utils': [
              '@/utils/errorHandler',
              '@/utils/performance',
              '@/hooks/useForm',
              '@/hooks/useEndorsement',
            ],
            
            // Large third-party libraries
            'lodash': ['lodash-es'],
            'date-utils': ['date-fns'],
          },
          
          // Consistent naming for chunks
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
        
        // External dependencies (if any)
        external: [],
      },
      
      // Bundle size warnings
      chunkSizeWarningLimit: 1000, // 1MB warning threshold
    },
    
    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: mode === 'production' 
          ? '[hash:base64:5]' 
          : '[name]__[local]__[hash:base64:5]',
      },
      
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
    
    // Environment variables
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    
    // Optimization settings
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
      ],
      exclude: [
        // Heavy dependencies to lazy load
      ],
    },
    
    // Preview configuration (for production builds)
    preview: {
      port: 3000,
      open: true,
      cors: true,
    },
    
    // ESBuild configuration
    esbuild: {
      target: 'es2020',
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
  };
});