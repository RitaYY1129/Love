import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

function copyPwaIcons() {
  return {
    name: 'copy-pwa-icons',
    closeBundle() {
      const outputDir = resolve(__dirname, 'dist/assets/img')
      mkdirSync(outputDir, { recursive: true })
      copyFileSync(resolve(__dirname, 'assets/img/icon-192.png'), resolve(outputDir, 'icon-192.png'))
      copyFileSync(resolve(__dirname, 'assets/img/icon-512.png'), resolve(outputDir, 'icon-512.png'))
    }
  }
}

export default defineConfig({
  // GitHub Pages 项目页地址为 /Love/；如需部署到根域名，可设 VITE_APP_BASE=/
  base: process.env.VITE_APP_BASE || '/Love/',
  plugins: [vue(), copyPwaIcons()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
