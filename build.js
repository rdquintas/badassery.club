/* ==========================================================================
   Build: src/ + config/*.yaml -> dist/

   - Every config/<name>.yaml is loaded and exposed to templates as <name>
     (e.g. config/site.yaml -> {{ site.email }}).
   - Every .html file in src/ is rendered with Nunjucks (autoescape on).
   - Everything else in src/ is copied to dist/ as-is.
   ========================================================================== */

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

  // Render everything first, so a template error leaves the previous dist/ intact.
  const pages = fs
    .readdirSync(SRC, { recursive: true })
    .filter((rel) => rel.endsWith('.html'))
    .map((rel) => [rel, env.render(rel.split(path.sep).join('/'), data)]);

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.cpSync(SRC, DIST, {
    recursive: true,
    filter: (src) => !src.endsWith('.html'),
  });
  for (const [rel, html] of pages) {
    const out = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
  }

  console.log(`Built ${pages.length} page(s) into dist/ using config: ${Object.keys(data).join(', ')}`);
}

// Run when called directly (`node build.js`), not when imported by dev.js.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build();
}
