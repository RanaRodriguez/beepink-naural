import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  css: {
    // Prevent Vite from trying to use PostCSS to process tailwind imports
    // The tailwindcss() plugin handles this.
    postcss: {} 
  }
})
