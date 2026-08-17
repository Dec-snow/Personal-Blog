import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'react-vendor'
            }
            if (id.includes('react-router')) {
              return 'router-vendor'
            }
            if (id.includes('gsap') || id.includes('@gsap')) {
              return 'gsap-vendor'
            }
            if (id.includes('react-icons')) {
              return 'icons-vendor'
            }
            if (id.includes('react-use') || id.includes('clsx')) {
              return 'utils-vendor'
            }
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:8787",
        changeOrigin: true,
      },
      "/cos": {
        target: "https://my-blog-static-1464122491.cos.ap-guangzhou.myqcloud.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cos/, ""),
      },
    },
  },
})
