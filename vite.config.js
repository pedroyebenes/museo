import { defineConfig } from 'vite';

const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  // Rutas relativas para poder servir el museo desde un subdirectorio (py-labs/museo/).
  base: './',
  server: {
    host: '0.0.0.0',
    port,
    strictPort: false,
    open: true,
  },
  preview: {
    host: '0.0.0.0',
    port,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
});
