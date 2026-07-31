import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "robots.txt"],
      manifest: {
        name: "1RM 계산기",
        short_name: "1RM 계산기",
        description: "1RM 계산, 칼로리·단백질 목표 계산과 식단 기록을 함께 제공하는 무료 운동 기록 앱.",
        theme_color: "#0d0f0e",
        background_color: "#0d0f0e",
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
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
