import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // En mode build, les assets seront préfixés par /static/
  base: command === 'build' ? '/static/' : '/',
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/reservation': 'http://127.0.0.1:8000',
    },
  },
}))