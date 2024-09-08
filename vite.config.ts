import { resolve } from "path";
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import monkey from 'vite-plugin-monkey';
import { buildInfo } from "./package-info";

import info from "./package.json" with { type: "json" };

const githubRepo = info.repository.url;
const addonsFileName = "maps_addons.user.js";
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
      alias: [
          { find: "@", replacement: resolve(__dirname, '.') },
          { find: "@addons", replacement: resolve(__dirname, './src') },
          { find: "@t.addons", replacement: resolve(__dirname, './@types') },
      ],
  },
  plugins: [
    svelte(),
    monkey({
      entry: buildInfo.entryPoint,
      userscript: buildInfo.userscriptConfig,
      build: {
        fileName: buildInfo.fileName
      }
    }),
  ],
  build: {
    minify: 'terser',
    terserOptions: {}
  }
});
