import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    solid(),
  ],
  
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    },
  },
  
  server: {
    port: 1420,
    strictPort: false,
    host: "0.0.0.0",
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 1421
    },
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
