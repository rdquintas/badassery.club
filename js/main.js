/* ==========================================================================
   BADASSERY — main.js
   1. Fade-in animations (replicates Squarespace "Global animations": fade)
   2. Mobile menu
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

  initReveal();
  initMenu();
})();
