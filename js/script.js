/* Hindustan Foundation & Constructions - interactions */
(function () {
  'use strict';
  const D = window.HFC;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- preloader ---------- */
  document.body.classList.add('is-loading');
  const pre = $('#preloader');
  const t0 = performance.now();
  const hidePre = () => {
    const wait = Math.max(0, 1100 - (performance.now() - t0));
    setTimeout(() => { pre.classList.add('done'); document.body.classList.remove('is-loading'); setTimeout(() => pre.remove(), 700); }, wait);
  };
  if (document.readyState === 'complete') hidePre(); else window.addEventListener('load', hidePre);
  setTimeout(() => { if (document.body.classList.contains('is-loading')) hidePre(); }, 6000);

  /* ---------- nav ---------- */
  const nav = $('#nav'), links = $('#nav-links'), btn = $('#menu-btn');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hide', y > lastY + 6 && y > 400 && !links.classList.contains('open'));
    if (y < lastY - 6) nav.classList.remove('hide');
    lastY = y;
  }, { passive: true });
  btn.addEventListener('click', () => {
    const o = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', o);
  });
  $$('a', links).forEach((a) => a.addEventListener('click', () => { links.classList.remove('open'); btn.setAttribute('aria-expanded', false); }));
  // highlight current section
  const navMap = new Map($$('a', links).map((a) => [a.getAttribute('href').slice(1), a]));
  const secObs = new IntersectionObserver((es) => es.forEach((e) => {
    const a = navMap.get(e.target.id);
    if (a && e.isIntersecting) { navMap.forEach((x) => x.classList.remove('on')); a.classList.add('on'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) secObs.observe(s); });

  /* ---------- reveal on scroll ---------- */
  const rv = $$('.rv');
  const rvObs = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); rvObs.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  rv.forEach((el) => {
    // stagger siblings inside the same list / grid
    const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains('rv')) : [];
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', (Math.min(i, 6) * 0.08) + 's');
    rvObs.observe(el);
  });

  /* ---------- hero parallax + stats count-up ---------- */
  const heroImg = $('#hero-img');
  if (heroImg && !reduce) {
    let tick = false;
    window.addEventListener('scroll', () => {
      if (tick) return; tick = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        heroImg.style.transform = `translate3d(0, ${y * 0.22}px, 0) scale(${1 + y * 0.00015})`;
        tick = false;
      });
    }, { passive: true });
  }
  const fmt = (n, sep) => sep ? n.toLocaleString('en-IN') : String(n);
  const counted = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    counted.unobserve(e.target);
    $$('[data-count]', e.target).forEach((el) => {
      const end = +el.dataset.count, sep = !!el.dataset.sep;
      if (reduce) { el.textContent = fmt(end, sep); return; }
      const dur = 1800, s = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - s) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 4)));
        el.textContent = fmt(v, sep);
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }), { threshold: 0.4 });
  counted.observe($('#hero-stats'));

  /* ---------- section 2: ongoing accordion ---------- */
  const acc = $('#acc');
  D.ongoing.forEach((p, i) => {
    const c = D.clients[p.client];
    const el = document.createElement('article');
    el.className = 'acc-item' + (i === 0 ? ' open' : '');
    el.setAttribute('role', 'listitem');
    el.tabIndex = 0;
    el.innerHTML =
      `<img src="${p.img}" alt="Site photo for ${esc(p.name)}" loading="lazy" style="object-position:${p.pos || '50% 50%'}">` +
      `<div class="acc-rest"><span class="acc-live" aria-hidden="true"></span><span class="acc-vname">${esc(p.name)}</span></div>` +
      `<div class="acc-open">` +
        `<span class="tag"><i></i>Piling in progress</span>` +
        `<h3>${esc(p.name)}</h3>` +
        `<p>${esc(p.desc)}</p>` +
        `<div class="acc-foot">` +
          `<span class="chip" style="background:${c.bg}"><img src="${c.logo}" alt="${esc(c.name)}"></span>` +
          (p.stat ? `<span class="acc-stat"><b>${p.stat.n}</b><span>${p.stat.l}</span></span>` : '') +
          `<span class="loc">${esc(c.name)} &middot; ${esc(p.loc)}</span>` +
        `</div>` +
      `</div>`;
    acc.appendChild(el);
  });
  const items = $$('.acc-item', acc);
  const open = (it) => { items.forEach((x) => x.classList.toggle('open', x === it)); };
  const mq = window.matchMedia('(max-width: 900px)');
  let accTimer;
  items.forEach((it) => {
    it.addEventListener('mouseenter', () => { if (mq.matches) return; clearTimeout(accTimer); accTimer = setTimeout(() => open(it), 90); });
    it.addEventListener('mouseleave', () => clearTimeout(accTimer));
    it.addEventListener('focus', () => open(it));
    it.addEventListener('click', () => open(it));
  });

  /* ---------- section 3: client explorer ---------- */
  const rail = $('#rail'), stage = $('#stage');
  const elName = $('#st-name'), elMeta = $('#st-meta'), rowsEl = $('#rows');
  const feature = $('#feature'), imgA = $('.f-img.a', feature), imgB = $('.f-img.b', feature);
  const fTitle = $('#f-title'), fSub = $('#f-sub'), fDots = $('#f-dots'), fOpen = $('#f-open');

  const groups = D.completed.map((g) => ({
    id: g.id, name: D.clients[g.id].name, logo: D.clients[g.id].logo, bg: D.clients[g.id].bg,
    fallback: g.fallback, projects: g.projects
  }));
  groups.push({ id: 'more', name: D.more.name, more: true, fallback: D.more.fallback, projects: D.more.projects });

  const isDark = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) < 90; };
  groups.forEach((g) => {
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'tile' + (g.more ? ' more' : ''); t.dataset.id = g.id;
    t.setAttribute('role', 'tab'); t.setAttribute('aria-label', g.name + ', ' + g.projects.length + ' projects');
    if (g.more) t.innerHTML = '<span>+ More<br>partners</span>';
    else { t.style.setProperty('--bg', g.bg); if (isDark(g.bg)) t.dataset.dark = '1'; t.innerHTML = `<img src="${g.logo}" alt="" loading="lazy">`; }
    t.insertAdjacentHTML('beforeend', `<span class="cnt">${g.projects.length}</span>`);
    rail.appendChild(t);
  });
  const tiles = $$('.tile', rail);

  let cur = null, curProj = 0, curImg = 0, showA = true, cycle = null, fLatest = 0, userTouched = false, lbList = [];
  const imgsOf = (g, p) => (p.imgs && p.imgs.length) ? p.imgs : null;
  const firstImg = (g, p) => (imgsOf(g, p) ? p.imgs[0] : g.fallback);

  function setFeature(g, p, idx) {
    const list = imgsOf(g, p);
    const src = list ? list[idx % list.length] : firstImg(g, p);
    const next = showA ? imgA : imgB, prev = showA ? imgB : imgA;
    const token = ++fLatest;
    const show = () => { if (token !== fLatest) return; next.classList.add('show'); prev.classList.remove('show'); showA = !showA; };
    next.alt = p.name;
    next.onload = show; next.src = src;
    if (next.complete && next.naturalWidth) show();
    fTitle.textContent = p.name;
    fSub.textContent = [p.loc, p.yrs].filter(Boolean).join(' · ');
    feature.classList.toggle('no-photos', !list);
    fDots.innerHTML = list && list.length > 1 ? list.map((_, i) => `<i class="${i === idx % list.length ? 'on' : ''}"></i>`).join('') : '';
    curImg = idx;
  }

  function startCycle(g, p) {
    clearInterval(cycle);
    const list = imgsOf(g, p);
    if (!list || list.length < 2 || reduce) return;
    cycle = setInterval(() => setFeature(g, p, curImg + 1), 2600);
  }

  function showProject(g, i) {
    curProj = i;
    const p = g.projects[i];
    $$('.row', rowsEl).forEach((r, k) => r.classList.toggle('on', k === i));
    setFeature(g, p, 0);
    startCycle(g, p);
  }

  function select(id, fromUser) {
    if (fromUser) userTouched = true;
    if (cur && cur.id === id) return;
    const g = groups.find((x) => x.id === id);
    cur = g;
    tiles.forEach((t) => { const on = t.dataset.id === id; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
    rail.classList.add('has-on');
    stage.classList.add('swap');
    setTimeout(() => {
      const n = g.projects.length;
      elName.textContent = g.name;
      elMeta.textContent = g.more ? `${n} more projects across defence, government and industry`
        : `${n} project${n > 1 ? 's' : ''} with HFC`;
      rowsEl.classList.toggle('one', n <= 3);
      rowsEl.scrollTop = 0;
      rowsEl.innerHTML = g.projects.map((p, i) => {
        const hasImg = imgsOf(g, p);
        const th = hasImg
          ? `<span class="th" style="background-image:url('${p.imgs[0]}')"></span>`
          : (g.more ? `<span class="th more-th"></span>` : `<span class="th logo-th" style="background-color:${g.bg}"><img src="${g.logo}" alt=""></span>`);
        return `<li><button type="button" class="row" data-i="${i}" style="animation-delay:${0.05 + i * 0.055}s">` + th +
          `<span><h4>${esc(p.name)}</h4><span class="m">${esc([p.loc, p.yrs].filter(Boolean).join(' · '))}</span><p>${esc(p.desc)}</p></span>` +
          `</button></li>`;
      }).join('');
      stage.classList.remove('swap');
      showProject(g, 0);
    }, cur && elName.textContent ? 180 : 0);
  }

  let hoverT;
  tiles.forEach((t) => {
    t.addEventListener('mouseenter', () => { clearTimeout(hoverT); hoverT = setTimeout(() => select(t.dataset.id, true), 70); });
    t.addEventListener('mouseleave', () => clearTimeout(hoverT));
    t.addEventListener('focus', () => select(t.dataset.id, true));
    t.addEventListener('click', () => select(t.dataset.id, true));
  });
  rowsEl.addEventListener('mouseover', (e) => {
    const r = e.target.closest('.row'); if (!r || !cur) return;
    const i = +r.dataset.i; if (i !== curProj) showProject(cur, i);
  });
  rowsEl.addEventListener('click', (e) => {
    const r = e.target.closest('.row'); if (!r || !cur) return;
    const i = +r.dataset.i; showProject(cur, i);
  });
  rowsEl.addEventListener('focusin', (e) => {
    const r = e.target.closest('.row'); if (r && cur && +r.dataset.i !== curProj) showProject(cur, +r.dataset.i);
  });

  /* auto-tour the first few clients until the visitor takes over */
  const tour = ['lnt', 'k2k', 'kalpataru', 'puravankara'];
  let tourI = 0, tourT = null;
  select(tour[0]);
  const explorer = $('#explorer');
  const tourObs = new IntersectionObserver((es) => es.forEach((e) => {
    clearInterval(tourT);
    if (e.isIntersecting && !userTouched && !reduce) {
      tourT = setInterval(() => { if (userTouched) return clearInterval(tourT); tourI = (tourI + 1) % tour.length; select(tour[tourI]); }, 4800);
    }
  }), { threshold: 0.5 });
  tourObs.observe(explorer);
  explorer.addEventListener('pointerdown', () => { userTouched = true; clearInterval(tourT); });
  explorer.addEventListener('mouseenter', () => { userTouched = true; clearInterval(tourT); });

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  let lbI = 0;
  const lbShow = (i) => { lbI = (i + lbList.length) % lbList.length; lbImg.src = lbList[lbI]; lbCap.textContent = `${fTitle.textContent}  (${lbI + 1} / ${lbList.length})`; };
  fOpen.addEventListener('click', () => {
    const p = cur.projects[curProj]; if (!p.imgs || !p.imgs.length) return;
    lbList = p.imgs; lb.hidden = false; document.body.style.overflow = 'hidden'; lbShow(curImg % lbList.length); $('#lb-x').focus();
  });
  feature.addEventListener('click', (e) => { if (e.target === fOpen) return; if (!feature.classList.contains('no-photos')) fOpen.click(); });
  const lbClose = () => { lb.hidden = true; document.body.style.overflow = ''; };
  $('#lb-x').addEventListener('click', lbClose);
  $('#lb-prev').addEventListener('click', () => lbShow(lbI - 1));
  $('#lb-next').addEventListener('click', () => lbShow(lbI + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbShow(lbI - 1);
    if (e.key === 'ArrowRight') lbShow(lbI + 1);
  });
})();
