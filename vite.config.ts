import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/GeoPulse/',
  server: {
    port: 3000,
    open: true,
    host: true
  }
});
