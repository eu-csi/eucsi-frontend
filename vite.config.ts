import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    proxy: {
      "/api": {
        target: "http://187.127.164.121:8002",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://187.127.164.121:8002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});