/* ==========================================================================
   BADASSERY — main.js
   1. Fade-in animations (replicates Squarespace "Global animations": fade)
   2. Mobile menu
   3. Image glitch hover
   4. Random photo tilt
   5. Photo lightbox
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
     2. Mobile menu
     ------------------------------------------------------------------------ */
  function initMenu() {
    var burger = document.querySelector('.burger');
    var menu = document.getElementById('mobile-menu');
    if (!burger || !menu) return;

    var desktop = window.matchMedia('(min-width: 768px)');
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

    // Close if the viewport grows to desktop size
    desktop.addEventListener('change', function (e) {
      if (e.matches && isOpen()) close();
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

  function initLightbox() {
    var dialog = document.getElementById('lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;

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

    var figures = document.querySelectorAll('.glitch');
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

  initReveal();
  initMenu();
  initImageGlitch();
  initTilt();
  initLightbox();
})();
