# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A static, single-page rebuild of the venue's old Squarespace 7.1 site ("black" theme) at badassery.club. It uses plain HTML, CSS and vanilla JS. There is no build step, no package manager and no tests. See [README.md](README.md) for the layout and how to serve it locally.

## Key conventions

- **Fidelity to the original.** The goal is a pixel-faithful reproduction of the Squarespace site. Many CSS values (type scale, `--type-unit`, content width, colours) and the JS animation timing are copied from the theme. Keep them unless asked to change them.
- **Intentional typos.** Some typos are kept on purpose and marked with `<!-- TODO: typo no original (...) -->` comments (for example "COKTAIL" and "an unique"), and so is one empty `<li>`. Don't silently "fix" them. Ask first, or fix them only when the user requests it, and remove the TODO comment when you do.
- **Code comments are mixed English/Portuguese.** Write new comments in English.
- **CSS naming:** BEM-style (`block__element--modifier`). Design tokens live in `:root` in `css/style.css`.
- **Animations:** add `class="reveal"` to any element that should fade in. `js/main.js` assigns staggered delays across every `.reveal` in document order and respects `prefers-reduced-motion`.
- **JS:** ES5-style IIFE with `'use strict'` and `var`. Match that style and don't add dependencies.
- **Images:** every photo needs AVIF + WebP + JPG at 600w and 1200w, used through `<picture>` with explicit `width`/`height`. Below-the-fold images get `loading="lazy" decoding="async"`.
- **Fonts** are self-hosted woff2, latin subset only. Don't add Google Fonts links.
- **SEO:** `index.html` holds meta, Open Graph/Twitter tags, JSON-LD structured data and a hidden SEO text block. Keep them in sync when content changes (address, hours, capacities).

## Venue facts

- Address: **Rua do Sol ao Rato 71A, 1250-041 Lisboa** (confirmed by the owner). Use it everywhere.
