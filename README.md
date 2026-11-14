# badassery.club

Website for **Badassery**, a three-floor speakeasy and event venue at Rua do Sol ao Rato 71A, Lisbon.

It's a single-page static site that replaces the original Squarespace 7.1 site. It uses plain HTML, CSS and JavaScript, with no framework. A small Node build fills in venue details (email, address, booking link, Google Maps link, opening hours) from YAML config files and writes the finished site to `dist/`.

## Structure

```
config/
  site.yaml         Venue details: email, address, booking and Maps URLs, hours
  gallery.yaml      Photos on the gallery page (masonry) and how many load per scroll
src/                Site source (templates + static files)
  index.html        Home page, a Nunjucks template
  gallery.html      Gallery page, a Nunjucks template
  _partials/        Shared header, footer and SVG sprite, used via {% include %}
                    (paths starting with "_" are never rendered or copied to dist/)
  css/style.css     All styles (self-hosted fonts, design tokens, layout, animations)
  js/main.js        Fade-in-on-scroll animations + menu
  favicon.ico
  assets/
    fonts/          Self-hosted woff2 (Bebas Neue, Raleway, Poppins), latin subset
    img/            Photos in AVIF / WebP / JPG at 600w and 1200w, logo, icons, og-image
build.js            Build script (`npm run build`)
dev.js              Dev server with live reload (`npm run dev`)
dist/               Build output (generated, not committed)
```

## Building

Requires Node 20 or newer.

```sh
npm install
npm run build
```

The build:

1. Loads every `config/<name>.yaml` file. Templates can then read its contents as `<name>`, so `config/site.yaml` becomes `site`.
2. Renders every `.html` file in `src/` with [Nunjucks](https://mozilla.github.io/nunjucks/).
3. Copies everything else in `src/` to `dist/` unchanged.
4. Writes `sitemap.xml`, which lists every rendered page, and `robots.txt`, which allows all crawlers and points to the sitemap. Both use the `url` from `config/site.yaml`.

`dist/` is deleted and recreated on every build, so never edit files there.

### Changing venue details

Edit `config/site.yaml` and run `npm run build` again. For example, to change the opening hours:

```yaml
hours:
  - days: Wednesday and Thursday
    time: from 7 PM to 2 AM
  - days: Friday and Saturday
    time: from 7 PM to 3 AM
```

### Using config values in templates

```njk
{{ site.email }}                      <!-- HTML-escaped automatically -->
{{ site.address.city | upper }}       <!-- Nunjucks filters work -->
{{ site.address.street | json }}      <!-- quoted JSON string, for the JSON-LD block -->
{% for h in site.hours %}...{% endfor %}
```

If a template uses a variable that doesn't exist in the config, the build fails instead of quietly leaving the value blank.

## Previewing locally

```sh
npm run dev
```

This builds the site, serves `dist/` at http://localhost:3000 and watches `src/` and `config/`. Every time you save a file, it rebuilds and the browser reloads on its own. If a build fails, the error is printed and the last good version stays up. To use another port, set `PORT`, for example `PORT=8080 npm run dev`.

To check the production output instead, run `npm run build` and serve `dist/` with any static server (`npx serve dist`, or `python -m http.server 8000 -d dist`).

## Deploying

Every push to `main` runs [.github/workflows/pages.yml](.github/workflows/pages.yml), which runs `npm ci` and `npm run build` and then publishes `dist/` to GitHub Pages. In the repository settings, under **Pages > Build and deployment**, **Source** must be set to **GitHub Actions**. If it is set to "Deploy from a branch", GitHub runs Jekyll over the raw repository instead, and that fails on the Nunjucks syntax in this README.

## Adding or replacing images

Images go in `src/assets/img/`. Each content photo ships in three formats and two widths:

```
<name>-600.avif   <name>-600.webp   <name>-600.jpg
<name>-1200.avif  <name>-1200.webp  <name>-1200.jpg
```

Reference it with a `<picture>` element that matches the existing ones in `src/index.html`: AVIF source, then WebP source, then a JPG `<img>` with `width`/`height`, `loading="lazy"` and `decoding="async"`. The hero image above the fold is the exception and uses `fetchpriority="high"`.

## External links

- Reservations: Zenchef (`bookings.zenchef.com`, rid `372843`)
- Instagram: [@badassery____](https://www.instagram.com/badassery____/)
- Events: [Shotgun](https://shotgun.live/pt-pt/venues/badassery)
