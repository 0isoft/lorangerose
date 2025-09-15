// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const inDocker = !!process.env.DOCKER; // we'll set DOCKER=1 in compose

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
    proxy: {
      "/api": {
        target: inDocker ? "http://backend:3000" : "http://localhost:3000",
        changeOrigin: true,
      },
      "/health": { target: inDocker ? "http://backend:3000" : "http://localhost:3000", changeOrigin: true }, 
      "/uploads": { target: inDocker ? "http://backend:3000" : "http://localhost:3000", changeOrigin: true },
    },
  },
});
