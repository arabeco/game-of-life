import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'marketing', 'ABERTURA0-10');
const host = '127.0.0.1';
const port = 4123;

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.mp4', 'video/mp4'],
  ['.svg', 'image/svg+xml'],
]);

const server = http.createServer((req, res) => {
  try {
    const parsed = new URL(req.url || '/', `http://${host}:${port}`);
    let pathname = decodeURIComponent(parsed.pathname);
    if (pathname === '/') pathname = '/abertura-03-o-primeiro-campo-reel.html';
    const filePath = path.resolve(root, `.${pathname}`);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime.get(ext) || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

server.listen(port, host, () => {
  console.log(`ABERTURA_PREVIEW=http://${host}:${port}/abertura-03-o-primeiro-campo-reel.html`);
});
