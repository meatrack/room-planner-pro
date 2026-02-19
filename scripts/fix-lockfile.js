import { execSync } from "child_process";
import { unlinkSync, existsSync } from "fs";
import { resolve } from "path";

const projectDir = resolve(import.meta.dirname, "..");

// Remove all existing lock files
const lockFiles = ["pnpm-lock.yaml", "bun.lockb", "package-lock.json", "yarn.lock"];
for (const file of lockFiles) {
  const fullPath = resolve(projectDir, file);
  if (existsSync(fullPath)) {
    console.log(`Removing ${file}...`);
    unlinkSync(fullPath);
  }
}

// Run npm install to generate a fresh package-lock.json
console.log("Running npm install to generate fresh package-lock.json...");
try {
  const output = execSync("npm install", {
    cwd: projectDir,
    encoding: "utf-8",
    stdio: "pipe",
    timeout: 120000,
  });
  console.log(output);
  console.log("Successfully generated package-lock.json!");
} catch (err) {
  console.error("npm install stderr:", err.stderr);
  console.error("npm install stdout:", err.stdout);
  throw err;
}
