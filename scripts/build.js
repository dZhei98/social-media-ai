import esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const projectRoot = path.resolve(currentDir, "..");
const distRoot = path.join(projectRoot, "dist");
const distPublic = path.join(distRoot, "public");
const distServer = path.join(distRoot, "server");

async function copyPublicAssets() {
  await fs.cp(path.join(projectRoot, "public"), distPublic, {
    recursive: true,
    filter: (source) => !source.endsWith(`${path.sep}build`),
  });
}

await fs.rm(distRoot, { recursive: true, force: true });
await fs.mkdir(path.join(distPublic, "build"), { recursive: true });
await fs.mkdir(distServer, { recursive: true });
await copyPublicAssets();

await Promise.all([
  esbuild.build({
    entryPoints: [path.join(projectRoot, "src", "entry-client.jsx")],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    outfile: path.join(distPublic, "build", "app.js"),
    jsx: "automatic",
    minify: true,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  }),
  esbuild.build({
    entryPoints: [path.join(projectRoot, "server", "index.js")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: ["node18"],
    outfile: path.join(distServer, "index.js"),
    jsx: "automatic",
    sourcemap: false,
  }),
]);

console.log("Built client and server bundles in dist/");
