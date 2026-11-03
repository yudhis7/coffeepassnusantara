import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' agar aset bisa dimuat dari file:// (Electron) dan WebView (Capacitor Android)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
