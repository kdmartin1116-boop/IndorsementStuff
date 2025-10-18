import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/pdfjs-dist/build/pdf.worker.mjs',
            dest: '.'
          }
        ]
      })
    ],
    define: {
      // Make environment variables available in client code
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/uploads': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/scan-contract': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/endorse-bill': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/stamp_endorsement': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/generate-tender-letter': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/generate-ptp-letter': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/get-bill-data': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/scan-for-terms': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002',
        '/generate-remedy': env.VITE_API_BASE_URL || 'http://127.0.0.1:8002'
      }
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: 'src/index.html',
        output: {
          entryFileNames: mode === 'production' ? 'assets/[name].[hash].js' : 'main.js',
          chunkFileNames: mode === 'production' ? 'assets/[name].[hash].js' : 'chunks/[name].js',
          assetFileNames: mode === 'production' ? 'assets/[name].[hash].[ext]' : 'assets/[name].[ext]',
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-pdf': ['pdfjs-dist'],
            'vendor-charts': ['recharts'],
            'vendor-ui': ['lucide-react'],
            'vendor-utils': ['react-dropzone']
          }
        }
      },
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'pdfjs-dist', 'recharts', 'lucide-react']
    },
    preview: {
      port: 4173,
      host: true
    }
  };
});