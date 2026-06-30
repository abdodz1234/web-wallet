// Simple dev server — node serve.mjs
// Serves test-dapp/ at http://localhost:8787 so the extension content script activates.
import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR  = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8787;

const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.wasm': 'application/wasm',
};

http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];
  let filePath = path.join(DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext  = path.extname(filePath);
  const mime = MIME[ext] ?? 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`Test dApp → http://localhost:${PORT}`);
});
