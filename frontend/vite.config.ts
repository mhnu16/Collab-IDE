import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    https: {
      key: fs.readFileSync('./security/key.pem'),
      cert: fs.readFileSync('./security/cert.pem'),
      passphrase: fs.readFileSync('./security/.key', 'utf-8')
    },
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
