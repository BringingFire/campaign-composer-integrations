import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: "src/module.ts",
      output: {
        dir: null,
        file: "dist/scripts/module.js",
        format: "es",
      },
    },
  },
  plugins: [
    copy({
      targets: [
        { src: "module.json", dest: "dist" },
        { src: "assets", dest: "dist" },
      ],
      hook: "writeBundle",
    }),
  ],
});
