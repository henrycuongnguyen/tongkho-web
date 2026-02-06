// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
import { loadEnv } from "vite";

import tailwindcss from "@tailwindcss/vite";

// Load environment variables for build-time database access
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  site: "https://tongkhobds.com",
  integrations: [react(), sitemap()],
  output: "server",
  adapter: node({ mode: "standalone" }),
  build: {
    inlineStylesheets: "auto",
  },
  image: {
    // Use sharp for high-quality image processing
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
    // Prepared for future CDN integration
    // domains: ['api.tongkhobds.com'],
    // remotePatterns: [{
    //   protocol: 'https',
    //   hostname: '*.tongkhobds.com',
    //   pathname: '/images/**'
    // }]
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client"],
    },
    // Note: DATABASE_URL is automatically available at build time via import.meta.env
    // No need to expose it to client bundle for security reasons
  },
});