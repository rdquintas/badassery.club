/* ==========================================================================
   Build: src/ + config/*.yaml -> dist/

   - Every config/<name>.yaml is loaded and exposed to templates as <name>
     (e.g. config/site.yaml -> {{ site.email }}).
   - Every .html file in src/ is rendered with Nunjucks (autoescape on).
   - Everything else in src/ is copied to dist/ as-is.
   ========================================================================== */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import nunjucks from 'nunjucks';
import YAML from 'yaml';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const SRC = path.join(ROOT, 'src');
export const CONFIG = path.join(ROOT, 'config');
export const DIST = path.join(ROOT, 'dist');

function loadConfig() {
  const data = {};
  for (const file of fs.readdirSync(CONFIG).sort()) {
    if (!/\.ya?ml$/i.test(file)) continue;
    const name = file.replace(/\.ya?ml$/i, '');
    data[name] = YAML.parse(fs.readFileSync(path.join(CONFIG, file), 'utf8'));
  }
  return data;
}

export function build() {
  const data = loadConfig();

  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(SRC), {
    autoescape: true,
    throwOnUndefined: true, // a typo in a variable name fails the build
  });
  // Safe JSON for use inside <script> blocks (JSON-LD).
  env.addFilter('json', (value) =>
    new nunjucks.runtime.SafeString(JSON.stringify(value).replace(/</g, '\\u003c'))
  );

  // Shotgun-style short date: '2026-11-14' -> '14/11', '2026-12-03' -> '3/12'.
  env.addFilter('shortdate', (value) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) throw new Error(`shortdate filter: invalid date "${value}"`);
    return `${Number(m[3])}/${m[2]}`;
  });
  // Cache busting: 'css/style.css' -> 'css/style.css?v=<hash of the file>'.
  // GitHub Pages lets browsers cache files for 10 minutes, so without this a
  // visitor can get a new page with the previous CSS/JS right after a deploy.
  env.addFilter('versioned', (rel) => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(SRC, rel))).digest('hex');
    return `${rel}?v=${hash.slice(0, 10)}`;
  });
  // Euro price in Portuguese format: 12 -> '12,00 €'.
  const EUR = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  env.addFilter('eur', (value) => EUR.format(value));

  // Render everything first, so a template error leaves the previous dist/ intact.
  // Paths with a segment starting with "_" (e.g. src/_partials/) are partials:
  // used through {% include %}, never rendered or copied on their own.
  const isPartial = (rel) => rel.split(path.sep).some((seg) => seg.startsWith('_'));
  const pages = fs
    .readdirSync(SRC, { recursive: true })
    .filter((rel) => rel.endsWith('.html') && !isPartial(rel))
    .map((rel) => [rel, env.render(rel.split(path.sep).join('/'), data)]);

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.cpSync(SRC, DIST, {
    recursive: true,
    filter: (src) => !src.endsWith('.html') && !isPartial(path.relative(SRC, src)),
  });
  for (const [rel, html] of pages) {
    const out = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
  }

  writeSeoFiles(data.site.url, pages.map(([rel]) => rel));

  console.log(`Built ${pages.length} page(s) into dist/ using config: ${Object.keys(data).join(', ')}`);
}

// sitemap.xml lists every rendered page (index.html -> "/"), so new pages are
// included automatically; robots.txt allows everything and points to it.
function writeSeoFiles(siteUrl, pagePaths) {
  const base = String(siteUrl).replace(/\/+$/, '');
  const escapeXml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

  const urls = pagePaths
    .map((rel) => '/' + rel.split(path.sep).join('/').replace(/(^|\/)index\.html$/, '$1'))
    .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));

  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${escapeXml(base + u)}</loc></url>\n`).join('') +
    '</urlset>\n';
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);

  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
}

// Run when called directly (`node build.js`), not when imported by dev.js.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build();
}
