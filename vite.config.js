import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "robots.txt"],
      manifest: {
        name: "1RM 계산기",
        short_name: "1RM 계산기",
        description: "단순하고 직관적인 1RM 계산 및 운동 기록 앱.",
        theme_color: "#080808",
        background_color: "#080808",
        display: "standalone",
        icons: [
          { src: "/icon_192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon_512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
