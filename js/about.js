/* Hindustan Foundation & Constructions - about page
   Client logo carousels (two rows, opposite directions, seamless), reveal on scroll, stat count-up. */
(function () {
  'use strict';
  const D = window.HFC;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- client carousels ----------
  const clients = Object.values(D.clients);
  const half = Math.ceil(clients.length / 2);
  const rows = [clients.slice(0, half), clients.slice(half).concat(clients.slice(0, 2))];
  ['marq-a', 'marq-b'].forEach((id, r) => {
    const host = document.getElementById(id);
    const one = rows[r].map((c) =>
      `<li><div class="logo" style="background:${c.bg}" title="${esc(c.name)}"><img src="${c.logo}" alt="${esc(c.name)}" loading="lazy"></div></li>`).join('');
    // the list is doubled so that moving by half its width loops without a seam
    host.innerHTML = `<ul style="--dur:${r ? 70 : 58}s">${one}${one}</ul>`;
  });

  // ---------- reveal on scroll ----------
  const rvObs = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); rvObs.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach((el) => {
    const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains('rv')) : [];
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 0.08 + 's');
    rvObs.observe(el);
  });

  // ---------- stats ----------
  const fmt = (n, sep) => (sep ? n.toLocaleString('en-IN') : String(n));
  const counted = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    counted.unobserve(e.target);
    $$('[data-count]', e.target).forEach((el) => {
      const end = +el.dataset.count, sep = !!el.dataset.sep;
      if (reduce) { el.textContent = fmt(end, sep); return; }
      const t0 = performance.now(), dur = 1800;
      el.textContent = '0';
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 4))), sep);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }), { threshold: 0.4 });
  counted.observe($('#ab-stats'));
})();
