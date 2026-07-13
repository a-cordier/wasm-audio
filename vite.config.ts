import { defineConfig, Plugin } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, readFileSync } from "fs";

const workletFiles: Record<string, string> = {
  "synth-processor.js": "src/instruments/poly-ticks",
  "voice-kernel.wasmmodule.js": "src/instruments/poly-ticks/engine",
  "wasm-worklet-processor.js": "src/runtime",
  "worklet-drain.js": "src/midi/transport",
  "seq-processor.js": "src/instruments/sequels",
  "monolog-processor.js": "src/instruments/monolog",
  "monolog-kernel.wasmmodule.js": "src/instruments/monolog/engine",
};

const BASE = "/wasm-audio/";

function workletsPlugin(): Plugin {
  return {
    name: "worklets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        let path = req.url?.split("?")[0] ?? "";
        if (path.startsWith(BASE)) {
          path = path.slice(BASE.length);
        } else if (path.startsWith("/")) {
          path = path.slice(1);
        }
        const fileName = path;
        if (fileName && fileName in workletFiles) {
          try {
            const dir = resolve(__dirname, workletFiles[fileName]);
            const content = readFileSync(resolve(dir, fileName), "utf-8");
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
      for (const [file, srcDir] of Object.entries(workletFiles)) {
        try {
          copyFileSync(resolve(__dirname, srcDir, file), resolve(dest, file));
        } catch {
          // voice-kernel.wasmmodule.js may not exist if make hasn't run
        }
      }
    },
  };
}

export default defineConfig({
  base: "/wasm-audio/",
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
