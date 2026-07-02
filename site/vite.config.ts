import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Static SPA landing page for PageMind.
// Deploy target: pagemind.adarshweb.in (Vercel).
// Build output: dist/ — Vercel serves it as a static site.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Keep CSS in a single bundle for simplicity on a small landing page
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "assets/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
