/* ==========================================================================
   Dev server: build, serve dist/, rebuild + live-reload on changes.

   - Watches src/ and config/; any change triggers a rebuild.
   - Serves dist/ at http://localhost:3000 (override with PORT=xxxx).
   - Injects a tiny live-reload script into HTML responses (dist/ itself
     is left untouched, so it stays identical to a production build).
   ========================================================================== */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build, SRC, CONFIG, DIST } from './build.js';

const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const RELOAD_SNIPPET =
  "<script>new EventSource('/__reload').onmessage=function(){location.reload()}</script>";

/* ---- Build ------------------------------------------------------------- */

function safeBuild() {
  try {
    build();
    return true;
  } catch (err) {
    console.error('\x1b[31mBuild failed:\x1b[0m', err.message);
    return false;
  }
}

/* ---- Live reload (Server-Sent Events) ---------------------------------- */

const clients = new Set();

function notifyReload() {
  for (const res of clients) res.write('data: reload\n\n');
}

/* ---- Watch ------------------------------------------------------------- */

let timer;
function scheduleRebuild(file) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`Change detected${file ? ` (${file})` : ''}, rebuilding...`);
    if (safeBuild()) notifyReload();
  }, 100);
}

for (const dir of [SRC, CONFIG]) {
  fs.watch(dir, { recursive: true }, (_event, file) => scheduleRebuild(file));
}

/* ---- HTTP server ------------------------------------------------------- */

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  let file = path.join(DIST, decodeURIComponent(url.pathname));
  if (file !== DIST && !file.startsWith(DIST + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }

  const ext = path.extname(file).toLowerCase();
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  };

  if (ext === '.html') {
    const html = fs.readFileSync(file, 'utf8');
    const out = html.includes('</body>')
      ? html.replace('</body>', `${RELOAD_SNIPPET}</body>`)
      : html + RELOAD_SNIPPET;
    res.writeHead(200, headers).end(out);
  } else {
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  }
});

safeBuild();
server.listen(PORT, () => {
  console.log(`\nDev server running at http://localhost:${PORT}`);
  console.log('Watching src/ and config/ for changes. Press Ctrl+C to stop.\n');
});
