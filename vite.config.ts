import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Separate client output from the compiled server so the Dockerfile
    // can copy them to their respective destinations independently.
    outDir: 'dist/client',
  },
  server: {
    proxy: {
      // Forward /api/users/* → Express API server at :3001 in development.
      '/api/users': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
