import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'ckeditor4-react': path.resolve(__dirname, './node_modules/ckeditor4-react/dist/index.esm.js'),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true
  }
})
