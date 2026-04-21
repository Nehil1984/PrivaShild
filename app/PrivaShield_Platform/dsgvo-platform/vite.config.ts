import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8"));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "./",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react_vendor: ["react", "react-dom", "wouter"],
          query_vendor: ["@tanstack/react-query"],
          ui_vendor: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs", "lucide-react"],
          chart_vendor: ["recharts"],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
