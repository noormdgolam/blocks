/* ==========================================================================
   BONGSHAI CONCRETE BLOCK — main.js
   Vanilla, dependency-free. Progressive enhancement only.
   ========================================================================== */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---- NAV: scroll state + mobile menu ---------------------------------- */
  var navBar     = $('#nav-bar');
  var hamburger  = $('#hamburger');
  var mobileMenu = $('#mobile-menu');

  if (navBar) {
    var onScroll = function () { navBar.classList.toggle('scrolled', window.scrollY > 32); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function setMenu(open) {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      setMenu(mobileMenu.hidden);
    });
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); hamburger.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (mobileMenu.hidden) return;
      if (!e.target.closest('#mobile-menu') && !e.target.closest('#hamburger')) setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 720 && !mobileMenu.hidden) setMenu(false);
    });
  }

  /* ---- COUNTER ANIMATION ---------------------------------------------- */
  var counters = $$('.stat-number[data-target]');
  function renderCount(el, value) {
    var target = parseFloat(el.dataset.target);
    el.textContent = target % 1 === 0 ? Math.floor(value).toString() : value.toFixed(1);
  }
  if (counters.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { renderCount(el, parseFloat(el.dataset.target)); });
    } else {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseFloat(el.dataset.target);
          var start = performance.now();
          var duration = 1500;
          (function tick(now) {
            var p = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            renderCount(el, target * eased);
            if (p < 1) requestAnimationFrame(tick);
          })(start);
          countObserver.unobserve(el);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* ---- BLOCK CALCULATOR --------------------------------------------- */
  var calcForm   = $('#calc-form');
  var calcResult = $('#calc-result');
  var calcError  = $('#calc-error');
  var BLOCK_FACE_SQFT = (16 / 12) * (8 / 12); // 16in x 8in face
  var WASTAGE = 1.05;

  function num(id) { return parseFloat($('#' + id).value); }

  function calculateBlocks(e) {
    if (e) e.preventDefault();
    var lengthFt = num('wall-length');
    var heightFt = num('wall-height');
    var lenEl = $('#wall-length');
    var htEl  = $('#wall-height');

    var lenBad = !(lengthFt > 0);
    var htBad  = !(heightFt > 0);
    lenEl.setAttribute('aria-invalid', String(lenBad));
    htEl.setAttribute('aria-invalid', String(htBad));

    if (lenBad || htBad) {
      if (calcError) calcError.hidden = false;
      (lenBad ? lenEl : htEl).focus();
      return;
    }
    if (calcError) calcError.hidden = true;

    var sizeEl    = $('#block-size');
    var priceEach = parseFloat(sizeEl.options[sizeEl.selectedIndex].dataset.price);
    var wallArea  = lengthFt * heightFt;
    var totalBlocks = Math.ceil((wallArea / BLOCK_FACE_SQFT) * WASTAGE);
    var totalCost   = Math.ceil(totalBlocks * priceEach);

    $('#result-blocks').textContent = totalBlocks.toLocaleString('en-US');
    $('#result-cost').textContent   = '৳' + totalCost.toLocaleString('en-US');
    $('#result-area').textContent   = wallArea.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' sq ft';

    calcResult.hidden = false;
    calcResult.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });

    // Carry the estimate straight into checkout
    var sizeKey = { '3': '16x8x3', '4': '16x8x4', '5': '16x8x5' }[sizeEl.value] || '16x8x4';
    var link = $('#result-order-link');
    if (link) link.setAttribute('href', 'checkout.html?size=' + sizeKey + '&qty=' + totalBlocks);
  }

  if (calcForm) {
    calcForm.addEventListener('submit', calculateBlocks);
    ['wall-length', 'wall-height'].forEach(function (id) {
      var el = $('#' + id);
      if (el) el.addEventListener('input', function () { el.setAttribute('aria-invalid', 'false'); });
    });
  }

  /* ---- SCROLL REVEAL --------------------------------------------- */
  var revealEls = $$('.product-card, .feature-card, .testimonial-card, .stat-big, .faq-item, .contact-method-link, .strength-chart, .compare-table-wrap');
  if (revealEls.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('revealed');
        revealObserver.unobserve(el);
        // Drop the helper classes once shown so no leftover transform/transition
        // interferes with the element's own :hover styles.
        window.setTimeout(function () { el.classList.remove('reveal-init', 'revealed'); }, 750);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { el.classList.add('reveal-init'); revealObserver.observe(el); });
  }

  /* ---- ACTIVE NAV LINK ----------------------------------------- */
  var navLinks = $$('.nav-links a');
  var sections = $$('main section[id]');
  if (navLinks.length && sections.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          var on = l.getAttribute('href') === '#' + entry.target.id;
          l.classList.toggle('active', on);
          if (on) { l.setAttribute('aria-current', 'true'); } else { l.removeAttribute('aria-current'); }
        });
      });
    }, { threshold: 0.3, rootMargin: '-70px 0px -45% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }
})();
