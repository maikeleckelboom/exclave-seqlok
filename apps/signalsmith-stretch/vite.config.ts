import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";

const seqwireSource = fileURLToPath(
  new URL("../../packages/core/src/index.ts", import.meta.url),
);

const isolationHeaders = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

export default defineConfig({
  build: {
    target: "es2022",
  },
  preview: {
    headers: isolationHeaders,
  },
  resolve: {
    alias: {
      "@exclave/seqwire": seqwireSource,
    },
  },
  server: {
    headers: isolationHeaders,
  },
});
