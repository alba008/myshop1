// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      "/api": {
        target: "http://10.0.0.47:8000",
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: "http://10.0.0.47:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ["@apollo/client", "graphql"],
  },

});
