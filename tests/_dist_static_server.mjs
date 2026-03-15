import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distRoot = path.join(repoRoot, 'dist');
const host = process.env.SMOKE_HOST || '127.0.0.1';
const port = Number(process.env.SMOKE_PORT || 3011);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const resolvePath = (requestUrl = '/') => {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}:${port}`).pathname);
  const trimmed = pathname.replace(/^\/+/, '');
  const candidate = trimmed ? path.resolve(distRoot, trimmed) : path.join(distRoot, 'index.html');

  if (!candidate.startsWith(distRoot)) {
    return path.join(distRoot, 'index.html');
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  return path.join(distRoot, 'index.html');
};

const server = http.createServer((req, res) => {
  try {
    const filePath = resolvePath(req.url);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(error));
  }
});

server.listen(port, host, () => {
  console.log(`SMOKE_STATIC_SERVER_READY http://${host}:${port}`);
});
