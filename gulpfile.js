const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const clean = require("gulp-clean");
const rollup = require("rollup");
const resolve = require("rollup-plugin-node-resolve");
const typescript = require("rollup-plugin-typescript");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

gulp.task("copy-html", () => {
  return gulp.src(["src/index.html"]).pipe(gulp.dest("dist"));
});

gulp.task("copy-worklets", () => {
  return gulp.src(["src/worklets/**/*.js"]).pipe(gulp.dest("dist"));
});

gulp.task("clean", () => {
  return gulp.src("dist", { allowEmpty: true }).pipe(clean());
});

gulp.task("compile", async () => await exec("make"));

gulp.task("build", async () => {
  const bundle = await rollup.rollup({
    input: ["src/main.ts"],
    output: {
      file: "dist/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [resolve(), typescript()],
  });

  return bundle.write({
    file: "./dist/index.js",
    format: "umd",
    name: "library",
    sourcemap: true,
  });
});

gulp.task(
  "bundle",
  gulp.series(gulp.parallel("copy-html", "copy-worklets"), "build")
);

gulp.task("reload", async () => browserSync.reload());

gulp.task("serve", () => {
  browserSync.init({
    server: "./dist",
  });

  gulp.watch("./src/**/*.cpp", gulp.series("compile"));

  return gulp.watch(
    ["./src/**/*.ts", "./src/**/*.js", "./src/**/*.html"],
    gulp.series("clean", "bundle", "reload")
  );
});

gulp.task("default", gulp.series("clean", "bundle", "serve"));
