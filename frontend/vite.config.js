import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages deploy path is preserved: teton/1.6
// This repo is published under /<repo>/ in Pages, so we use a relative base.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173
  }
})
