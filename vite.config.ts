import { defineConfig, Plugin } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, readFileSync } from "fs";

const workletFiles = [
  "voice-processor.js",
  "wasm-audio-helper.js",
  "voice-processor-parameters.js",
  "voice-kernel.wasmmodule.js",
];

function workletsPlugin(): Plugin {
  const workletsDir = resolve(__dirname, "src/worklets");

  return {
    name: "worklets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const fileName = req.url?.split("?")[0].slice(1);
        if (fileName && workletFiles.includes(fileName)) {
          try {
            const content = readFileSync(resolve(workletsDir, fileName), "utf-8");
            res.setHeader("Content-Type", "application/javascript");
            res.end(content);
            return;
          } catch {
            // fall through to next handler
          }
        }
        next();
      });
    },
    writeBundle() {
      const dest = resolve(__dirname, "dist");
      mkdirSync(dest, { recursive: true });
      for (const file of workletFiles) {
        try {
          copyFileSync(resolve(workletsDir, file), resolve(dest, file));
        } catch {
          // voice-kernel.wasmmodule.js may not exist if make hasn't run
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [workletsPlugin()],
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
});
