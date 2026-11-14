/* ==========================================================================
   BADASSERY — main.js
   1. Fade-in animations (replicates Squarespace "Global animations": fade)
   2. Menu
   3. Image glitch hover
   4. Random photo tilt
   5. Photo lightbox
   6. Gallery (masonry)
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Fade-in animations
     Squarespace spreads a 0.6s delay across every animated element of the
     page, in document order (delay = index * 0.6s / total). Each element
     fades in (1.5s, ease) the first time it enters the viewport.
     ------------------------------------------------------------------------ */
  var MAX_STAGGER = 0.6; // seconds

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!items.length) return;

    var step = MAX_STAGGER / items.length;
    items.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', (i * step).toFixed(4) + 's');
    });

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });

    // Wait one frame so the initial (hidden) state is painted before fading in.
    requestAnimationFrame(function () {
      items.forEach(function (el) { observer.observe(el); });
    });
  }

  /* ------------------------------------------------------------------------
     2. Menu
     ------------------------------------------------------------------------ */
  function initMenu() {
    var burger = document.querySelector('.burger');
    var menu = document.getElementById('site-menu');
    if (!burger || !menu) return;

    var closeTimer;

    function open() {
      clearTimeout(closeTimer);
      menu.hidden = false;
      // force reflow so the opacity transition runs
      void menu.offsetWidth;
      menu.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close Menu');
      document.body.classList.add('is-menu-open');
    }

    function close() {
      menu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open Menu');
      document.body.classList.remove('is-menu-open');
      closeTimer = setTimeout(function () { menu.hidden = true; }, 400);
    }

    function isOpen() {
      return burger.getAttribute('aria-expanded') === 'true';
    }

    burger.addEventListener('click', function () {
      if (isOpen()) {
        close();
      } else {
        open();
      }
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
        burger.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. Image glitch hover
     On the first hover, add three layers that show the already-loaded photo
     (currentSrc, so nothing extra is downloaded). CSS animates them.
     ------------------------------------------------------------------------ */
  function initImageGlitch() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var figures = document.querySelectorAll('.glitch');
    Array.prototype.forEach.call(figures, function (figure) {
      figure.addEventListener('mouseenter', function build() {
        var img = figure.querySelector('img');
        if (!img || !img.currentSrc) return; // not loaded yet; retry next hover

        var layers = document.createElement('div');
        layers.className = 'glitch__layers';
        layers.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < 3; i++) {
          var layer = document.createElement('div');
          layer.className = 'glitch__layer';
          layer.style.backgroundImage = 'url("' + img.currentSrc + '")';
          layers.appendChild(layer);
        }
        figure.appendChild(layers);
        figure.removeEventListener('mouseenter', build);
      });
    });
  }

  /* ------------------------------------------------------------------------
     4. Random photo tilt
     Each photo gets its own angle on every page load: 2-5 degrees,
     randomly to the left or right.
     ------------------------------------------------------------------------ */
  var TILT_MIN = 2; // degrees
  var TILT_MAX = 5;

  function initTilt() {
    var figures = document.querySelectorAll('.feature__media');
    Array.prototype.forEach.call(figures, function (figure) {
      var angle = TILT_MIN + Math.random() * (TILT_MAX - TILT_MIN);
      if (Math.random() < 0.5) angle = -angle;
      figure.style.setProperty('--tilt', angle.toFixed(2) + 'deg');
    });
  }

  /* ------------------------------------------------------------------------
     5. Photo lightbox
     Clicking a photo (or Enter/Space when focused) shows it in the <dialog>.
     Esc closes it natively; a click outside the photo closes it too.
     ------------------------------------------------------------------------ */
  var LIGHTBOX_SIZES = '92vw';
  var openLightbox = null; // set by initLightbox, also used by the gallery

  function initLightbox() {
    var dialog = document.getElementById('lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    openLightbox = open;

    function open(figure) {
      var picture = figure.querySelector('picture');
      if (!picture) return;

      // Copy the <picture> so the browser picks the 1200w file for the
      // larger size; drop lazy loading since it is visible straight away.
      var copy = picture.cloneNode(true);
      Array.prototype.forEach.call(copy.querySelectorAll('source, img'), function (el) {
        if (el.hasAttribute('sizes')) el.setAttribute('sizes', LIGHTBOX_SIZES);
        el.removeAttribute('loading');
        el.removeAttribute('fetchpriority');
      });

      dialog.innerHTML = '';
      dialog.appendChild(copy);
      dialog.showModal();
      document.body.classList.add('is-lightbox-open');
    }

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      dialog.innerHTML = '';
      document.body.classList.remove('is-lightbox-open');
    });

    // Only the photos open the lightbox; the header logo also uses .glitch
    // for the hover effect but stays a normal link.
    var figures = document.querySelectorAll('.feature__media.glitch');
    Array.prototype.forEach.call(figures, function (figure) {
      var img = figure.querySelector('img');
      figure.setAttribute('tabindex', '0');
      figure.setAttribute('role', 'button');
      figure.setAttribute('aria-label', 'Open photo' + (img && img.alt ? ': ' + img.alt : ''));

      figure.addEventListener('click', function () { open(figure); });
      figure.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(figure);
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. Gallery (masonry)
     The photos wait in a <template> (so nothing downloads early) and are
     added in batches of data-batch whenever the end of the grid gets near.
     Each one goes into the shortest column; its height comes from the
     width/height ratio, so the layout does not wait for the images. Photos
     fade up as they enter the viewport, staggered when several arrive at
     once. A click opens the photo in the lightbox.
     ------------------------------------------------------------------------ */
  var GALLERY_COLUMNS = [[1100, 4], [800, 3], [0, 2]]; // [min viewport width, columns]
  var GALLERY_STAGGER = 100;  // ms between photos that fade in together
  var GALLERY_PRELOAD = 400;  // px below the viewport at which the next batch loads

  function initGallery() {
    var root = document.querySelector('[data-gallery]');
    if (!root) return;
    var grid = root.querySelector('[data-gallery-grid]');
    var sentinel = root.querySelector('[data-gallery-sentinel]');
    var tpl = root.querySelector('[data-gallery-items]');
    if (!grid || !sentinel || !tpl || !tpl.content) return;

    var pending = Array.prototype.slice.call(tpl.content.children);
    var placed = [];
    var batch = parseInt(root.getAttribute('data-batch'), 10) || 12;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasObserver = 'IntersectionObserver' in window;
    var lastWidth = 0;

    function columnCount() {
      var w = window.innerWidth;
      for (var i = 0; i < GALLERY_COLUMNS.length; i++) {
        if (w >= GALLERY_COLUMNS[i][0]) return GALLERY_COLUMNS[i][1];
      }
      return 1;
    }

    function layout() {
      if (!placed.length) return;
      var cols = columnCount();
      var colWidth = grid.clientWidth / cols;
      var gap = parseFloat(window.getComputedStyle(placed[0]).paddingTop) * 2 || 0;
      var heights = [];
      for (var c = 0; c < cols; c++) heights.push(0);

      placed.forEach(function (item) {
        var col = heights.indexOf(Math.min.apply(Math, heights));
        var ratio = parseFloat(item.getAttribute('data-ratio')) || 1;
        item.style.width = (100 / cols) + '%';
        item.style.left = (col * 100 / cols) + '%';
        item.style.top = heights[col] + 'px';
        heights[col] += (colWidth - gap) * ratio + gap;
      });

      grid.style.height = Math.max.apply(Math, heights) + 'px';
      lastWidth = grid.clientWidth;
    }

    var fadeObserver = (!reduceMotion && hasObserver) ? new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = (n++ * GALLERY_STAGGER) + 'ms';
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 }) : null;

    function loadBatch() {
      var next = pending.splice(0, batch);
      next.forEach(function (item) {
        grid.appendChild(item);
        placed.push(item);
      });
      layout();
      next.forEach(function (item) {
        if (fadeObserver) {
          fadeObserver.observe(item);
        } else {
          item.classList.add('is-visible');
        }
      });
      if (!pending.length) {
        if (loadObserver) loadObserver.disconnect();
        sentinel.parentNode.removeChild(sentinel);
      }
    }

    // Keep adding batches while the end of the grid is still near the
    // viewport (the observer only fires again when that changes).
    function fill() {
      if (!pending.length) return;
      if (sentinel.getBoundingClientRect().top < window.innerHeight + GALLERY_PRELOAD) {
        loadBatch();
        requestAnimationFrame(fill);
      }
    }

    var loadObserver = hasObserver ? new IntersectionObserver(function (entries) {
      if (entries[entries.length - 1].isIntersecting) fill();
    }, { rootMargin: '0px 0px ' + GALLERY_PRELOAD + 'px 0px' }) : null;

    if (loadObserver) {
      loadBatch();
      if (pending.length) loadObserver.observe(sentinel);
    } else {
      while (pending.length) loadBatch();
    }

    var resizeFrame;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(function () {
        if (grid.clientWidth !== lastWidth) layout();
      });
    });

    grid.addEventListener('click', function (e) {
      var button = e.target.closest('.gallery__open');
      if (button && openLightbox) openLightbox(button);
    });
  }

  initReveal();
  initMenu();
  initImageGlitch();
  initTilt();
  initLightbox();
  initGallery();
})();
