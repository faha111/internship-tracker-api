import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Forward API calls to the Express server so the browser has no CORS problems.
const api = { target: 'http://localhost:3000', changeOrigin: true };
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/auth': api, '/applications': api, '/stats': api } },
});
