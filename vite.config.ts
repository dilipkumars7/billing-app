import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths({ root: './' })
  ],
  define: {
    // Fix for sockjs-client "global is not defined" error
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Optional: Add path aliases if needed
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['sockjs-client'],
  },
})
