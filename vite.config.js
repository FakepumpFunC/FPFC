import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/ave': {
        target: 'https://prod.ave-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ave/, ''),
        secure: false,
        headers: {
          'x-api-key': '0H7NicjOftzKAEUF4WeUbSUm0Jct3OFv5q6jNHOW0Gf1NAZrOazfKGY7zJR4Eaft'
        }
      },
      '/api/birdeye': {
        target: 'https://public-api.birdeye.so',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/birdeye/, ''),
        secure: true,
        headers: {
          'X-API-KEY': 'a1373453dfe44a7f9286911dcca3d763',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        configure: (proxy) => {
          // Log proxy errors for debugging
          proxy.on('error', (err) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (_, req) => {
            console.log('Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
