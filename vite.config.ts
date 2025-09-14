import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
  },
  ssr: { noExternal: ["react-dropzone"] },

  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ target: "node-server", customViteReactPlugin: true }),
    viteReact(),
  ],
});
