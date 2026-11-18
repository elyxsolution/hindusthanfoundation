import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Builds to ../piling. Two entries:
//   index.html -> the standalone explorer (piling/index.html)
//   src/embed.jsx -> piling/embed.js, the module the main site imports for its scroll story
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5174 },
  build: {
    outDir: '../piling',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      input: { main: path.resolve(__dirname, 'index.html'), embed: path.resolve(__dirname, 'src/embed.jsx') },
      preserveEntrySignatures: 'exports-only',
      output: {
        entryFileNames: (chunk) => (chunk.name === 'embed' ? 'embed.js' : 'assets/[name]-[hash].js'),
        manualChunks: { three: ['three'], r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'] },
      },
    },
  },
});
