// esbuild.mjs
import * as esbuild from "esbuild";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import dotenv from "dotenv";

const require = createRequire(import.meta.url);
const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const env = dotenv.config().parsed ?? {};
const envDefine = Object.fromEntries(
  Object.entries(env).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)]),
);

const copyAssets = {
  name: "copy-assets",
  setup(build) {
    build.onEnd(async () => {
      await mkdir("dist", { recursive: true });
      await copyFile(
        require.resolve("vscode-oniguruma/release/onig.wasm"),
        "dist/onig.wasm",
      );
      await mkdir("syntaxes", { recursive: true });
      await copyFile(
        require.resolve("blade-formatter/syntaxes/blade.tmLanguage.json"),
        "syntaxes/blade.tmLanguage.json",
      );
      await mkdir("dist/css", { recursive: true });
      await copyFile(
        require.resolve("tailwindcss/lib/css/preflight.css"),
        "dist/css/preflight.css",
      );
    });
  },
};

const ctx = await esbuild.context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/extension.js",
  external: ["vscode", "tailwindcss/lib/public/default-config", "tailwindcss/defaultConfig"],
  mainFields: ["module", "main"], // ESM 版を優先して tree-shaking を効かせる
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  metafile: true,
  logLevel: "info",
  define: {
    ...envDefine,
    "import.meta.url": "importMetaUrl",
  },
  banner: {
    js: 'const importMetaUrl = require("url").pathToFileURL(__filename).href;',
  },
  plugins: [copyAssets],
});

if (watch) {
  await ctx.watch();
} else {
  const result = await ctx.rebuild();
  await writeFile("meta.json", JSON.stringify(result.metafile));
  await ctx.dispose();
}
