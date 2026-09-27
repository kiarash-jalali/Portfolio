import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const required = [
  "index.html",
  "src/js/main.js",
  "src/js/content.js",
  "src/js/i18n.js",
  "src/js/effects.js",
  "src/styles/app.css",
  "public/images/kiarash.webp"
];

for (const file of required) await access(resolve(root, file));

const index = await readFile(resolve(root, "index.html"), "utf8");
if (!index.includes('type="module"')) throw new Error("index.html is missing module script");
if (!index.includes('id="projects"')) throw new Error("Projects section is missing");
if (!index.includes('id="ai"')) throw new Error("AI section is missing");

const content = await readFile(resolve(root, "src/js/content.js"), "utf8");
if (!content.includes("rootine")) throw new Error("Rootine project data is missing");
if (!content.includes("fa:")) throw new Error("Persian content is missing");

const build = spawnSync(process.execPath, ["scripts/build.mjs"], { cwd: root, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log("Verification passed: required files, bilingual content, Rootine data, and static build are present.");
