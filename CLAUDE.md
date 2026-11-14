# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A static, single-page rebuild of the venue's old Squarespace 7.1 site ("black" theme) at badassery.club. It uses plain HTML, CSS and vanilla JS, with no tests. See [README.md](README.md) for the layout and how to serve it locally.

## Build

- Source lives in `src/`, config lives in `config/*.yaml`, and `npm run build` ([build.js](build.js)) writes the site to `dist/`.
- `dist/` is generated and gitignored. Never edit it; edit `src/` or `config/` and rebuild.
- `src/**/*.html` files are Nunjucks templates with autoescape and `throwOnUndefined` on. Each `config/<name>.yaml` becomes the template variable `<name>`.
- Each config file has a JSON Schema next to it (`config/<name>.schema.json`), linked from the first line of the YAML with `# yaml-language-server: $schema=./<name>.schema.json`. Without that link, the VS Code YAML extension applies the Ansible Playbook schema to `site.yaml` and flags every key as an error. When you add or rename a key, update the schema too. When you add a config file, give it a schema and that first line.
- Venue details (email, address, booking URL, hours) belong in `config/site.yaml`, never hard-coded in templates. Inside the JSON-LD `<script>`, use the `| json` filter instead of plain `{{ }}`, because HTML escaping is wrong there.
- `npm run dev` ([dev.js](dev.js)) serves `dist/` at http://localhost:3000, rebuilds on changes and live-reloads. The reload script is added only to the HTML the dev server sends and is never written to `dist/`. It has no dependencies; keep it that way.
- After a change, run `npm run build` and check that it succeeds.

## Key conventions

- **Fidelity to the original.** The goal is a pixel-faithful reproduction of the Squarespace site. Many CSS values (type scale, `--type-unit`, content width, colours) and the JS animation timing are copied from the theme. Keep them unless asked to change them.
- **Intentional typos.** Some typos are kept on purpose and marked with `<!-- TODO: typo no original (...) -->` comments (for example "COKTAIL" and "an unique"), and so is one empty `<li>`. Don't silently "fix" them. Ask first, or fix them only when the user requests it, and remove the TODO comment when you do.
- **Code comments are mixed English/Portuguese.** Write new comments in English.
- **CSS naming:** BEM-style (`block__element--modifier`). Design tokens live in `:root` in `src/css/style.css`.
- **Animations:** add `class="reveal"` to any element that should fade in. `src/js/main.js` assigns staggered delays across every `.reveal` in document order and respects `prefers-reduced-motion`.
- **JS:** ES5-style IIFE with `'use strict'` and `var`. Match that style and don't add front-end dependencies.
- **Images:** every photo needs AVIF + WebP + JPG at 600w and 1200w, used through `<picture>` with explicit `width`/`height`. Below-the-fold images get `loading="lazy" decoding="async"`.
- **Fonts** are self-hosted woff2, latin subset only. Don't add Google Fonts links.
- **SEO:** `src/index.html` holds meta, Open Graph/Twitter tags, JSON-LD structured data and a hidden SEO text block. Keep them in sync when content changes (capacities, descriptions). Values that come from `config/site.yaml` stay in sync automatically.

## Venue facts

- Address: **Rua do Sol ao Rato 71A, 1250-041 Lisboa** (confirmed by the owner), set in `config/site.yaml`.
