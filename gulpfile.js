/*
 * Copyright (C) 2020 Antoine CORDIER
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const clean = require("gulp-clean");
const rollup = require("rollup");
const resolve = require("rollup-plugin-node-resolve");
const typescript = require("rollup-plugin-typescript");
const babel = require("rollup-plugin-babel");
const exec = require("util").promisify(require("child_process").exec);

const isProduction = require("gulp-util").env.type === "production";

gulp.task("copy-html", () => {
  return gulp.src(["src/index.html"]).pipe(gulp.dest("dist"));
});

gulp.task("copy-worklets", () => {
  return isProduction ? Promise.resolve() : gulp.src(["src/worklets/**/*.js"]).pipe(gulp.dest("dist"));
});

gulp.task("copy-fonts", () => {
  return gulp.src(["src/fonts/**/*"]).pipe(gulp.dest("dist"));
});

gulp.task("clean", () => {
  return gulp.src("dist", { allowEmpty: true }).pipe(clean());
});

gulp.task("compile", async () => await exec("make"));

async function bundleWasmIfNeeded() {
  if (!isProduction) {
    return;
  }

  const sourcemap = !isProduction;

  const wasmBundle = await rollup.rollup({
    input: ["src/worklets/voice-processor.js"],
    output: {
      file: "dist/wasm.js",
      format: "es",
      sourcemap,
    },
    plugins: [
      resolve(),
      babel({
        presets: [
          [
            "@babel/preset-env",
            {
              modules: false,
            },
          ],
        ],
        plugins: ["@babel/plugin-proposal-class-properties"],
        sourceMaps: sourcemap,
        babelrc: false,
        exclude: "node_modules/**",
      }),
    ],
  });

  return wasmBundle.write({
    file: "./dist/voice-processor.js",
    format: "umd",
    name: "library",
    sourcemap,
  });
}

async function bundleApplication() {
  const sourcemap = !isProduction;

  const applicationBundle = await rollup.rollup({
    input: ["src/main.ts"],
    output: {
      file: "dist/index.js",
      format: "es",
      sourcemap,
    },
    plugins: [resolve(), typescript()],
  });

  return applicationBundle.write({
    file: "./dist/index.js",
    format: "umd",
    name: "library",
    sourcemap,
  });
}

gulp.task("build", async () => {
  await bundleWasmIfNeeded();
  await bundleApplication();
});

gulp.task("bundle", gulp.series(gulp.parallel("copy-html", "copy-worklets"), "build"));

gulp.task("reload", async () => browserSync.reload());

gulp.task("serve", () => {
  browserSync.init({
    browser: ["google chrome"],
    server: "./dist",
    middleware: [
      (_, res, next) => { 
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        next(); 
      },
    ]
  });

  gulp.watch("./src/**/*.cpp", gulp.series("compile"));

  return gulp.watch(["./src/**/*.ts", "./src/**/*.js", "./src/**/*.html"], gulp.series("clean", "bundle", "reload"));
});

gulp.task("build", gulp.series("clean", "compile", "bundle"));
gulp.task("default", gulp.series("clean", "bundle", "serve"));
