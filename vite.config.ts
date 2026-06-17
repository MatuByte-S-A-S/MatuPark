import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { billingApiPlugin } from './server/vite-plugin-billing-api.mjs'

export default defineConfig({
  plugins: [vue(), tailwindcss(), billingApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['@lucide/vue', 'vue', 'vue-router', 'pinia', 'chart.js', 'vue-chartjs'],
  },
})
