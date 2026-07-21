import path from "node:path"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "@draftbit/iframe-element-picker",
      "@draftbit/babel-plugin-inject-jsx-source",
    ],
  },
})
