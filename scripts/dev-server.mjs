import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const requestedRoot = process.argv[2] || ".";
const port = Number(process.argv[3] || process.env.PORT || 5173);
const root = resolve(process.cwd(), requestedRoot);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  return resolve(root, `.${clean}`);
}

const server = createServer(async (req, res) => {
  try {
    let filePath = safePath(req.url || "/");
    if (!filePath.startsWith(root)) throw new Error("Path outside root");

    const info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) filePath = join(filePath, "index.html");

    let data;
    try {
      data = await readFile(filePath);
    } catch {
      // SPA/static-site fallback for unknown routes.
      data = await readFile(join(root, "index.html"));
      filePath = join(root, "index.html");
    }

    res.writeHead(200, {
      "Content-Type": types[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Dev server error: ${error.message}`);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`\nKiarash Portfolio dev server`);
  console.log(`Local: http://localhost:${port}/`);
  console.log(`Root:  ${root}\n`);
});
