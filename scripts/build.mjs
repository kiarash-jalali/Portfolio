import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of ["index.html", "src", "public", "CNAME", "robots.txt", "sitemap.xml"]) {
  await cp(resolve(root, entry), resolve(dist, entry), { recursive: true });
}

await mkdir(resolve(dist, "vendor"), { recursive: true });
await cp(
  resolve(root, "node_modules/@dimforge/rapier2d"),
  resolve(dist, "vendor/rapier2d"),
  { recursive: true }
);

await writeFile(resolve(dist, ".nojekyll"), "", "utf8");
console.log("Built static site to ./dist");
