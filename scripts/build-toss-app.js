/**
 * Build Toss SPA for .ait packaging.
 *
 * granite runs: npx <build command>
 * So we need a single Node script that:
 * 1. Runs `npm install` in toss-app/
 * 2. Runs `vite build` in toss-app/
 * 3. Copies output to the outdir granite expects
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const tossDir = path.join(__dirname, "..", "toss-app");
const outDir = path.join(tossDir, "dist");

console.log("📦 Building Toss SPA...");

// Install deps if needed
if (!fs.existsSync(path.join(tossDir, "node_modules"))) {
  console.log("  → npm install...");
  execSync("npm install", { cwd: tossDir, stdio: "inherit" });
}

// Build
console.log("  → vite build...");
execSync("npx vite build", { cwd: tossDir, stdio: "inherit" });

// Verify output
const indexHtml = path.join(outDir, "index.html");
if (!fs.existsSync(indexHtml)) {
  console.error("❌ Build failed: dist/index.html not found");
  process.exit(1);
}

console.log("✅ Toss SPA built → toss-app/dist/");
