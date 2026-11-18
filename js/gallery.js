/* Hindustan Foundation & Constructions - gallery
   Builds the photo wall from js/data.js (project photos) plus the on-site photos in images/site.
   Filters re-flow the wall, tiles tilt and reveal their label on hover, and a lightbox opens each photo. */
(function () {
  'use strict';
  const D = window.HFC;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- the photos ----------
  const SITE = [
    'A line-up of rigs and cranes', 'Inspecting the bore', 'Rigs and a mixer under stormy skies', 'Rotary rig at work', 'Rig on a sloping site', 'The crew in front of the rigs',
    'Two rigs, side by side', 'Crane at the pile-cap excavation', 'Rig and tippers beside a tower', 'Rig, crawler crane and mixer', 'Rig beside a high-rise', 'Pile heads exposed in red soil',
    'Rigs and crane by the lake', 'Rigs and mixers in the excavation', 'Rigs at sunset', 'Crew at the exposed pile heads', 'Rig line-up, wide view', 'Basement shoring and excavation',
    'A full line-up of rigs', 'Crane lifting at the bore', 'Rigs and mixers pouring', 'Crawler crane at the pile heads',
  ];
  const INFRA = /airport|terminal|bial|aqueduct|irrigation|bus terminal|medical college|weir|bwssb|sewage|flyover|underpass|seabird|pump house/i;
  const COMM = /wipro|tech forest|techno|lake shore|landmark|indus park|infosys|plant|warehouse/i;
  const cat = (name) => (INFRA.test(name) ? 'Infrastructure' : COMM.test(name) ? 'Commercial & IT' : 'Residential');

  const items = [];
  const seen = new Set();
  const add = (o) => { if (!o.src || seen.has(o.src)) return; seen.add(o.src); items.push(o); };

  D.ongoing.forEach((p) => add({ src: p.img, title: p.name, meta: 'Ongoing · ' + p.loc, cat: cat(p.name), ongoing: true }));
  D.completed.forEach((g) => g.projects.forEach((p) => (p.imgs || []).forEach((src) =>
    add({ src, title: p.name, meta: [p.loc, p.yrs].filter(Boolean).join(' · ') || D.clients[g.id].name, cat: cat(p.name), ongoing: p.yrs === 'Ongoing' }))));
  SITE.forEach((t, i) => add({ src: `images/site/s${String(i + 1).padStart(2, '0')}.webp`, title: t, meta: 'On site', cat: 'On site' }));

  // interleave so the wall mixes categories instead of showing them in blocks
  const groups = {};
  items.forEach((it) => (groups[it.cat] = groups[it.cat] || []).push(it));
  const order = [];
  for (let i = 0; order.length < items.length; i++) Object.values(groups).forEach((g) => { if (g[i]) order.push(g[i]); });

  // ---------- chips ----------
  const cats = ['All', 'On site', 'Ongoing', 'Residential', 'Commercial & IT', 'Infrastructure'];
  const match = (it, c) => c === 'All' || (c === 'Ongoing' ? it.ongoing : it.cat === c);
  const chips = $('#g-chips');
  cats.forEach((c, i) => {
    const n = order.filter((it) => match(it, c)).length;
    if (!n) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'g-chip' + (i === 0 ? ' on' : ''); b.dataset.c = c;
    b.innerHTML = `${esc(c)} <b>${n}</b>`;
    chips.appendChild(b);
  });

  // ---------- tiles ----------
  const grid = $('#g-grid');
  const tiles = order.map((it, i) => {
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'g-tile'; t.dataset.i = i;
    t.setAttribute('aria-label', `${it.title}. ${it.meta}. Open photo`);
    t.innerHTML = `<img src="${it.src}" alt="${esc(it.title)}" loading="lazy" decoding="async">` +
      `<span class="g-cap"><em>${esc(it.ongoing ? 'Ongoing' : it.cat)}</em><b>${esc(it.title)}</b><span>${esc(it.meta)}</span></span><i class="g-plus" aria-hidden="true"></i>`;
    grid.appendChild(t);
    return t;
  });

  // wall layout: cycles that tile the 12 columns exactly, two rows each
  const A = [[6, 2], [3, 1], [3, 1], [3, 1], [3, 1]];
  const B = [[3, 1], [3, 1], [6, 2], [3, 1], [3, 1]];
  const C = [[4, 2], [4, 1], [4, 1], [4, 1], [4, 1]];
  const CYC = [A, B, C];
  const TAIL = { 1: [[12, 2]], 2: [[6, 2], [6, 2]], 3: [[4, 2], [4, 2], [4, 2]], 4: [[3, 2], [3, 2], [3, 2], [3, 2]] };
  let shown = [];

  function layout() {
    shown = tiles.filter((t) => !t.hidden);
    const full = Math.floor(shown.length / 5) * 5;
    shown.forEach((t, i) => {
      const spec = i < full ? CYC[Math.floor(i / 5) % 3][i % 5] : TAIL[shown.length - full][i - full];
      t.style.gridColumn = `span ${spec[0]}`;
      t.style.gridRow = `span ${spec[1]}`;
    });
  }

  let io;
  function reveal() {
    if (io) io.disconnect();
    io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    shown.forEach((t, i) => {
      t.classList.remove('in');
      t.style.setProperty('--d', (reduce ? 0 : (i % 5) * 0.07) + 's');
      io.observe(t);
    });
  }

  let cur = 'All';
  function filter(c) {
    cur = c;
    chips.querySelectorAll('.g-chip').forEach((b) => b.classList.toggle('on', b.dataset.c === c));
    tiles.forEach((t, i) => { if (!match(order[i], c)) t.classList.add('out'); });
    setTimeout(() => {
      tiles.forEach((t, i) => { const m = match(order[i], c); t.hidden = !m; t.classList.remove('out'); });
      layout();
      reveal();
    }, reduce ? 0 : 320);
  }
  chips.addEventListener('click', (e) => { const b = e.target.closest('.g-chip'); if (b && b.dataset.c !== cur) filter(b.dataset.c); });
  layout();
  reveal();

  // ---------- tilt and light on hover ----------
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    grid.addEventListener('pointermove', (e) => {
      const t = e.target.closest('.g-tile');
      if (!t) return;
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      t.style.setProperty('--ry', ((x - 0.5) * 5).toFixed(2) + 'deg');
      t.style.setProperty('--rx', ((0.5 - y) * 5).toFixed(2) + 'deg');
      t.style.setProperty('--mx', (x * 100).toFixed(0) + '%');
      t.style.setProperty('--my', (y * 100).toFixed(0) + '%');
    });
    grid.addEventListener('pointerout', (e) => {
      const t = e.target.closest('.g-tile');
      if (t) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); }
    });
  }

  // ---------- lightbox ----------
  const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  let li = 0;
  const lbShow = (i) => {
    li = (i + shown.length) % shown.length;
    const it = order[+shown[li].dataset.i];
    lbImg.src = it.src; lbImg.alt = it.title;
    lbCap.textContent = `${it.title} · ${it.meta}   (${li + 1} / ${shown.length})`;
  };
  const lbClose = () => { lb.hidden = true; document.body.style.overflow = ''; };
  grid.addEventListener('click', (e) => {
    const t = e.target.closest('.g-tile');
    if (!t) return;
    li = shown.indexOf(t); lb.hidden = false; document.body.style.overflow = 'hidden'; lbShow(li); $('#lb-x').focus();
  });
  $('#lb-x').addEventListener('click', lbClose);
  $('#lb-prev').addEventListener('click', () => lbShow(li - 1));
  $('#lb-next').addEventListener('click', () => lbShow(li + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbShow(li - 1);
    if (e.key === 'ArrowRight') lbShow(li + 1);
  });
})();
