import Sitemap from "vite-plugin-sitemap";
import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

const sitemapHost = process.env.SITEMAP_HOST;

export default defineConfig({
  plugins: [
    ...(sitemapHost
      ? [Sitemap({ hostname: sitemapHost, outDir: "build/client" })]
      : []),
    reactRouter(),
  ],

  build: {
    outDir: "build/client",
  },

  server: {
    allowedHosts: ["41fe4b70d2.sandbox.draftbit.dev"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
