/* ==========================================================================
   BONGSHAI CONCRETE BLOCK — checkout.js
   Vanilla, dependency-free. Fixed-price cart -> WhatsApp order handoff.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var WA_NUMBER = '8801781636613';
  var MIN_ORDER = 100;
  var ADVANCE_RATE = 0.40;
  var STORE_KEY = 'bongshai_checkout_qty';

  var items = $$('.co-item');
  if (!items.length) return;

  var taka = function (n) { return '৳' + Math.round(n).toLocaleString('en-US'); };
  var pcs  = function (n) { return n.toLocaleString('en-US'); };

  function clampQty(v) {
    v = parseInt(v, 10);
    if (!isFinite(v) || v < 0) v = 0;
    if (v > 5000000) v = 5000000;
    return v;
  }

  /* ---- Prefill from URL (?size=16x8x4&qty=2000) or saved state ---------- */
  function prefill() {
    var params = new URLSearchParams(window.location.search);
    var size = params.get('size');
    var qty  = clampQty(params.get('qty'));

    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { saved = {}; }

    items.forEach(function (li) {
      var key = li.dataset.size;
      var input = $('.co-qty-input', li);
      if (size === key) {
        input.value = qty > 0 ? qty : MIN_ORDER;
      } else if (typeof saved[key] === 'number' && saved[key] > 0 && !size) {
        input.value = saved[key];
      }
    });
  }

  function persist() {
    var data = {};
    items.forEach(function (li) { data[li.dataset.size] = clampQty($('.co-qty-input', li).value); });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }

  /* ---- Recalculate everything ---------------------------------------- */
  var sumLines = $('#co-sum-lines');
  var elPieces = $('#co-pieces');
  var elSubtotal = $('#co-subtotal');
  var elAdvance = $('#co-advance');
  var errEl = $('#co-err');

  function currentOrder() {
    var lines = [];
    var totalPieces = 0;
    var subtotal = 0;
    items.forEach(function (li) {
      var qty = clampQty($('.co-qty-input', li).value);
      var price = parseFloat(li.dataset.price);
      var lineTotal = qty * price;
      $('#line-' + li.dataset.size).textContent = taka(lineTotal);
      li.classList.toggle('co-item--active', qty > 0);
      if (qty > 0) {
        lines.push({ label: li.dataset.label, qty: qty, price: price, total: lineTotal });
        totalPieces += qty;
        subtotal += lineTotal;
      }
    });
    return { lines: lines, totalPieces: totalPieces, subtotal: subtotal };
  }

  function render() {
    var o = currentOrder();

    sumLines.innerHTML = '';
    if (!o.lines.length) {
      var li = document.createElement('li');
      li.className = 'co-sum-empty';
      li.textContent = 'No blocks added yet — set a quantity above.';
      sumLines.appendChild(li);
    } else {
      o.lines.forEach(function (ln) {
        var li = document.createElement('li');
        li.className = 'co-sum-line';
        var a = document.createElement('span');
        a.textContent = ln.label + '  ·  ' + pcs(ln.qty) + ' pcs';
        var b = document.createElement('span');
        b.textContent = taka(ln.total);
        li.appendChild(a); li.appendChild(b);
        sumLines.appendChild(li);
      });
    }

    elPieces.textContent = pcs(o.totalPieces);
    elSubtotal.textContent = taka(o.subtotal);
    elAdvance.textContent = taka(o.subtotal * ADVANCE_RATE);

    if (errEl && !errEl.hidden) errEl.hidden = true;
    persist();
  }

  /* ---- Quantity controls ------------------------------------------- */
  items.forEach(function (li) {
    var input = $('.co-qty-input', li);
    input.addEventListener('input', function () {
      var v = clampQty(input.value);
      if (String(v) !== input.value) input.value = v;
      render();
    });
    $$('.co-qty-btn', li).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = parseInt(btn.dataset.step, 10);
        input.value = clampQty(clampQty(input.value) + step);
        render();
      });
    });
  });

  /* ---- Place order ------------------------------------------------- */
  function digitsOnly(str) { return (str.match(/\d/g) || []).length; }

  function setFieldError(id, errId, show) {
    var input = $('#' + id);
    var err = $('#' + errId);
    if (input) input.setAttribute('aria-invalid', String(show));
    if (err) err.hidden = !show;
  }

  function showError(msg) {
    errEl.textContent = msg;
    errEl.hidden = false;
    errEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  }

  $('#co-place').addEventListener('click', function () {
    var o = currentOrder();
    var name = $('#co-name').value.trim();
    var phone = $('#co-phone').value.trim();
    var address = $('#co-address').value.trim();
    var district = $('#co-district').value.trim();
    var date = $('#co-date').value.trim();
    var unload = $('#co-unload').value;
    var payment = $('#co-payment').value;
    var notes = $('#co-notes').value.trim();

    var nameBad = name === '';
    var phoneBad = digitsOnly(phone) < 6;
    var addrBad = address === '';
    setFieldError('co-name', 'co-err-name', nameBad);
    setFieldError('co-phone', 'co-err-phone', phoneBad);
    setFieldError('co-address', 'co-err-address', addrBad);

    if (!o.lines.length) { showError('Add at least one block size to your order.'); return; }
    if (o.totalPieces < MIN_ORDER) { showError('Minimum order is ' + MIN_ORDER + ' pieces total. You have ' + o.totalPieces + '.'); return; }
    if (nameBad || phoneBad || addrBad) {
      showError('Please fill in your name, phone and delivery address.');
      $('#' + (nameBad ? 'co-name' : phoneBad ? 'co-phone' : 'co-address')).focus();
      return;
    }

    var L = [];
    L.push('Hello Bongshai Concrete Block! 🧱', '', 'NEW ORDER', '--------------------');
    o.lines.forEach(function (ln) {
      L.push(ln.label + '  —  ' + pcs(ln.qty) + ' pcs x ৳' + ln.price.toFixed(2) + '  =  ' + taka(ln.total));
    });
    L.push('--------------------');
    L.push('Total: ' + pcs(o.totalPieces) + ' pcs  —  ' + taka(o.subtotal) + ' (blocks only, transport extra)');
    L.push('Advance to start (~40%): ' + taka(o.subtotal * ADVANCE_RATE));
    L.push('');
    L.push('Deliver to: ' + address + (district ? ', ' + district : ''));
    if (date) L.push('Required date: ' + date);
    if (unload) L.push('Unloading: ' + unload);
    if (payment) L.push('Payment: ' + payment);
    L.push('Name: ' + name);
    L.push('Phone: ' + phone);
    if (notes) L.push('Notes: ' + notes);

    var waUrl = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(L.join('\n'));

    var success = $('#co-success');
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    }
    window.open(waUrl, '_blank', 'noopener');
  });

  ['co-name', 'co-phone', 'co-address'].forEach(function (id) {
    var el = $('#' + id);
    if (el) el.addEventListener('input', function () { el.setAttribute('aria-invalid', 'false'); });
  });

  /* ---- Init ------------------------------------------------------- */
  prefill();
  render();
})();
