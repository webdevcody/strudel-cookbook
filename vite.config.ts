import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
    },
    plugins: [
      tsConfigPaths(),
      tailwindcss(),
      tanstackStart({ target: "node-server", customViteReactPlugin: true }),
    ],
  };
});
