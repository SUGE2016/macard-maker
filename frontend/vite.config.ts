import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        hongbao: resolve(__dirname, 'hongbao.html'),
      },
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/oss-proxy': {
        target: 'https://ecnunic-data-public.oss-cn-shanghai.aliyuncs.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/oss-proxy/, ''),
      },
    },
  },
})
