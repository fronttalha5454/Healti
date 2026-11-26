import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import path from 'path'

/**
 * Content Security Policy for production builds (web + Capacitor APK).
 *
 * - No 'unsafe-eval': app code never uses eval()/new Function().
 * - Only injected at build time. The Vite dev server (localhost:5173) needs inline
 *   HMR/React-refresh scripts, so a strict CSP there would break development.
 * - connect-src allows https/wss so Firebase and the API servers (VITE_*_URL) work
 *   wherever they are hosted.
 */
const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss: http://localhost:* http://127.0.0.1:*",
  'frame-src https://*.firebaseapp.com https://*.google.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function healthiCsp(): Plugin {
  return {
    name: 'healthi-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- %HEALTHI_CSP% -->',
        `<meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), healthiCsp()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/zustand')) {
            return 'state';
          }
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
  },
})
