import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname);
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function resolveRequestPath(rawUrl) {
  let pathname;
  try {
    pathname = new URL(rawUrl || "/", "http://localhost").pathname;
  } catch {
    return null;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^[/\\]+/, "");
  const filePath = path.resolve(rootDir, relativePath);

  if (filePath !== rootDir && !filePath.startsWith(rootDir + path.sep)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveRequestPath(req.url);
  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Shindoro prototype running at http://localhost:${port}`);
});
