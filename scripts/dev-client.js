import esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("public/build");

await fs.mkdir(outputDir, { recursive: true });

const context = await esbuild.context({
  entryPoints: ["src/entry-client.jsx"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  sourcemap: true,
  outfile: path.join(outputDir, "app.js"),
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
});

await context.watch();

console.log("Watching client bundle at public/build/app.js");
