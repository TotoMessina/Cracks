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

// Writes the list of built files so the service worker can cache the whole game for offline play
const precacheManifestPlugin = () => ({
  name: 'precache-manifest',
  apply: 'build',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter(f => /\.(js|css|png|svg|woff2?)$/.test(f)).map(f => '/' + f);
    this.emitFile({
      type: 'asset',
      fileName: 'precache-manifest.json',
      source: JSON.stringify({ version: Date.now(), files }),
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    cleanStaleLocalhostPlugin(),
    react(),
    tailwindcss(),
    precacheManifestPlugin(),
  ],
  test: {
    setupFiles: ['src/game/__tests__/setup.js'],
  },
})
