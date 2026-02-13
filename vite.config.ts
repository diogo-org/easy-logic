import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Generic Vite configuration for TypeScript React projects
export default defineConfig({
  plugins: [react()],
  base: process.env.CI ? '/easy-logic/' : '/',
})
