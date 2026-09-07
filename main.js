/* ==========================================
   BONGSHAI CONCRETE BLOCK — main.js
   ========================================== */

// ---- NAV: scroll effect + hamburger ----
const navBar    = document.getElementById('nav-bar');
const hamburger = document.getElementById('hamburger');
const mobileMenu= document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  navBar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

// ---- COUNTER ANIMATION ----
const counters = document.querySelectorAll('.stat-number[data-target]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el     = entry.target;
    const target = parseFloat(el.dataset.target);
    const dur    = 1800;
    const step   = 16;
    const inc    = target / (dur / step);
    let current  = 0;
    const timer  = setInterval(() => {
      current += inc;
      if (current >= target) {
        el.textContent = target % 1 === 0 ? Math.floor(target) : target.toFixed(1);
        clearInterval(timer);
      } else {
        el.textContent = target % 1 === 0 ? Math.floor(current) : current.toFixed(1);
      }
    }, step);
    observer.unobserve(el);
  });
}, { threshold: 0.4 });

counters.forEach(c => observer.observe(c));

// ---- BLOCK CALCULATOR ----
function calculateBlocks() {
  const lengthFt  = parseFloat(document.getElementById('wall-length').value);
  const heightFt  = parseFloat(document.getElementById('wall-height').value);
  const sizeEl    = document.getElementById('block-size');
  const sizeInch  = parseInt(sizeEl.value);
  const priceEach = parseFloat(sizeEl.options[sizeEl.selectedIndex].dataset.price);
  const resultBox = document.getElementById('calc-result');

  if (!lengthFt || !heightFt || lengthFt <= 0 || heightFt <= 0) {
    document.getElementById('wall-length').focus();
    document.getElementById('wall-length').style.borderColor = 'hsl(0,75%,58%)';
    setTimeout(() => { document.getElementById('wall-length').style.borderColor = ''; }, 2000);
    return;
  }

  // Block dimensions: 16"x8" face (1.333ft x 0.667ft)
  const blockFaceArea = (16 / 12) * (8 / 12); // sq ft
  const wallArea      = lengthFt * heightFt;
  const rawBlocks     = wallArea / blockFaceArea;
  const totalBlocks   = Math.ceil(rawBlocks * 1.05); // 5% wastage
  const totalCost     = totalBlocks * priceEach;

  document.getElementById('result-blocks').textContent = totalBlocks.toLocaleString('en-BD');
  document.getElementById('result-cost').textContent   = '৳' + Math.ceil(totalCost).toLocaleString('en-BD');
  document.getElementById('result-area').textContent   = wallArea.toFixed(1) + ' sq ft';

  resultBox.hidden = false;
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Animate result values
  resultBox.querySelectorAll('.result-value').forEach(v => {
    v.style.animation = 'none';
    v.offsetHeight; // reflow
    v.style.animation = 'result-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)';
  });
}

// Allow Enter key in calculator inputs
['wall-length','wall-height'].forEach(id => {
  document.getElementById(id)?.addEventListener('keypress', e => {
    if (e.key === 'Enter') calculateBlocks();
  });
});

// Block calculator style
const calcStyle = document.createElement('style');
calcStyle.textContent = `@keyframes result-pop { from { transform: scale(0.8); opacity:0; } to { transform: scale(1); opacity:1; } }`;
document.head.appendChild(calcStyle);

// ---- QUOTE FORM ----
const quoteForm = document.getElementById('quote-form');
quoteForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name    = document.getElementById('f-name').value.trim();
  const phone   = document.getElementById('f-phone').value.trim();
  const size    = document.getElementById('f-size').value;
  const qty     = document.getElementById('f-qty').value;
  const loc     = document.getElementById('f-project').value.trim();
  const msg     = document.getElementById('f-msg').value.trim();
  const success = document.getElementById('form-success');

  if (!name || !phone) {
    if (!name) document.getElementById('f-name').style.borderColor = 'hsl(0,75%,58%)';
    if (!phone) document.getElementById('f-phone').style.borderColor = 'hsl(0,75%,58%)';
    setTimeout(() => {
      document.getElementById('f-name').style.borderColor = '';
      document.getElementById('f-phone').style.borderColor = '';
    }, 2500);
    return;
  }

  // Build WhatsApp message
  let waMsg = `Hello Bongshai Concrete Block! 🧱%0A%0A`;
  waMsg += `*New Quote Request*%0A`;
  waMsg += `Name: ${encodeURIComponent(name)}%0A`;
  waMsg += `Phone: ${encodeURIComponent(phone)}%0A`;
  if (loc)  waMsg += `Location: ${encodeURIComponent(loc)}%0A`;
  if (size) waMsg += `Block Size: ${encodeURIComponent(size)}%0A`;
  if (qty)  waMsg += `Quantity: ${encodeURIComponent(qty)} pcs%0A`;
  if (msg)  waMsg += `Notes: ${encodeURIComponent(msg)}%0A`;

  const waUrl = `https://wa.me/8801781636613?text=${waMsg}`;

  // Show success, open WA
  success.hidden = false;
  success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { window.open(waUrl, '_blank', 'noopener'); }, 400);

  // Reset form after 4s
  setTimeout(() => {
    quoteForm.reset();
    success.hidden = true;
  }, 6000);
});

// Auto-select block size from product "Order Now" links
document.querySelectorAll('[data-mcp-param-product]').forEach(link => {
  link.addEventListener('click', () => {
    const p = link.dataset.mcpParamProduct;
    const fSize = document.getElementById('f-size');
    if (!fSize) return;
    if (p && p.includes('16x8x3')) fSize.value = '16x8x3';
    else if (p && p.includes('16x8x4')) fSize.value = '16x8x4';
    else if (p && p.includes('16x8x5')) fSize.value = '16x8x5';
  });
});

// ---- SMOOTH SECTION REVEAL ANIMATIONS ----
const revealEls = document.querySelectorAll(
  '.product-card, .feature-card, .testimonial-card, .stat-big, .faq-item, .contact-method-link'
);
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.animationDelay = `${i * 0.05}s`;
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => {
  el.classList.add('reveal-init');
  revealObserver.observe(el);
});

// Add CSS for reveal
const revealStyle = document.createElement('style');
revealStyle.textContent = `
  .reveal-init { opacity: 0; transform: translateY(24px); transition: opacity 0.55s ease, transform 0.55s ease; transition-delay: var(--reveal-delay, 0s); }
  .revealed { opacity: 1 !important; transform: none !important; }
`;
document.head.appendChild(revealStyle);

// ---- ACTIVE NAV HIGHLIGHT ----
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.classList.add('active');
    }
  });
}, { threshold: 0.3, rootMargin: '-60px 0px -40% 0px' });

sections.forEach(s => sectionObserver.observe(s));

// Active nav style
const navStyle = document.createElement('style');
navStyle.textContent = `.nav-links a.active { color: var(--clr-accent) !important; background: var(--clr-accent-glow) !important; }`;
document.head.appendChild(navStyle);
