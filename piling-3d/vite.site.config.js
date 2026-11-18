import { defineConfig } from 'vite';
import path from 'node:path';

// Serves the whole main site (the repo root) on localhost so the hero story can be tried exactly as it ships.
// It loads the built piling/embed.js, so run `npm run build` after changing the 3D.
export default defineConfig({
  root: path.resolve(__dirname, '..'),
  cacheDir: path.resolve(__dirname, 'node_modules/.vite-site'),
  server: { port: 5190, host: '127.0.0.1', strictPort: true },
});
