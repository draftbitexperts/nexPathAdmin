/// <reference types="vite/client" />

declare module "@draftbit/babel-plugin-inject-jsx-source" {
  import type { Plugin } from "vite";

  export function vitePlugin(): Plugin;
}
