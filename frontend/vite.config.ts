import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import svgr from "vite-plugin-svgr";
import wailsConfig from "../wails.json";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(wailsConfig.info?.productVersion ?? "0.0.0"),
  },
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-ui": ["@base-ui/react", "clsx", "tailwind-merge", "class-variance-authority"],
          "vendor-table": ["@tanstack/react-table"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
