import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

if (process.env['CI'] && !process.env['VITE_TURNSTILE_SITE_KEY']) {
  throw new Error('VITE_TURNSTILE_SITE_KEY is not defined')
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler']
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api/': 'http://localhost:8000/api/'
    }
  }
})
