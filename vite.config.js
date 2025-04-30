// Template from Vite Documentaiton and Deep Seek

import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'home.html') 
      }
    },
    outDir: 'dist' 
  },
  server: {
    open: '/home.html' 
  }
})