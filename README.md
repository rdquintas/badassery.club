# badassery.club

Website for **Badassery**, a three-floor speakeasy and event venue at Rua do Sol ao Rato 71A, Lisbon.

It's a single-page static site that replaces the original Squarespace 7.1 site. It uses plain HTML, CSS and JavaScript, with no framework, no build step and no dependencies.

## Structure

```
index.html          The whole site (one page) + SEO meta + JSON-LD structured data
css/style.css       All styles (self-hosted fonts, design tokens, layout, animations)
js/main.js          Fade-in-on-scroll animations + mobile menu
favicon.ico
assets/
  fonts/            Self-hosted woff2 (Bebas Neue, Raleway, Poppins), latin subset
  img/              Photos in AVIF / WebP / JPG at 600w and 1200w, logo, icons, og-image
```

## Running locally

Any static file server works. Serve from the repo root, because some links use `/`:

```sh
npx serve .
# or
python -m http.server 8000
```

Then open http://localhost:8000 (or whichever port the server reports).

## Adding or replacing images

Each content photo ships in three formats and two widths:

```
<name>-600.avif   <name>-600.webp   <name>-600.jpg
<name>-1200.avif  <name>-1200.webp  <name>-1200.jpg
```

Reference it with a `<picture>` element that matches the existing ones in `index.html`: AVIF source, then WebP source, then a JPG `<img>` with `width`/`height`, `loading="lazy"` and `decoding="async"`. The hero image above the fold is the exception and uses `fetchpriority="high"`.

## External links

- Reservations: Zenchef (`bookings.zenchef.com`, rid `372843`)
- Instagram: [@badassery____](https://www.instagram.com/badassery____/)
- Events: [Shotgun](https://shotgun.live/pt-pt/venues/badassery)
