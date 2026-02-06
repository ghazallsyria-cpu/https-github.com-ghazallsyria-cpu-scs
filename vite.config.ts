import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'build', // تم التغيير من dist إلى build ليتناسب مع إعدادات Netlify الافتراضية لديك
    assetsDir: 'assets',
    emptyOutDir: true,
  }
})