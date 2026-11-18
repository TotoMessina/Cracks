import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Middleware to gracefully handle stale cache or service workers from previous projects on localhost:5173
const cleanStaleLocalhostPlugin = () => ({
  name: 'clean-stale-localhost',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.startsWith('/src/main.tsx')) {
        req.url = req.url.replace('/src/main.tsx', '/src/main.jsx');
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    cleanStaleLocalhostPlugin(),
    react(),
    tailwindcss()
  ],
})
