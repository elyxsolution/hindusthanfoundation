/* Hindustan Foundation & Constructions - hero story
   The hero and the three chapters (rotary boring, cage + concrete, load testing) are four full-screen "pages" over a
   pinned 3D site. One scroll gesture moves to the next page; inside a page the 3D animation loops on its own.
   After the last chapter the page scrolls normally. The 3D comes from piling/embed.js (built from piling-3d/).
   If WebGL or the module is unavailable, the photo behind the hero simply stays. */
(function () {
  'use strict';
  const root = document.getElementById('hero');
  const host = document.getElementById('story-canvas');
  if (!root || !host) return;

  const html = document.documentElement;
  const pages = Array.from(document.querySelectorAll('.story-steps [data-step]')).sort((a, b) => +a.dataset.step - +b.dataset.step);
  if (pages.length < 4) return;
  const pager = document.getElementById('pager');
  const dots = pager ? Array.from(pager.querySelectorAll('button')) : [];
  const beatSets = pages.map((c) => Array.from(c.querySelectorAll('.beats li')));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  let A = [0, 1, 2, 3]; // scroll position (px) of each page
  let END = 4; // where the story ends and the normal page begins
  let ctl = null;
  let pending = 0;
  let inView = true;
  let ticking = false;
  let animating = false;
  let lockUntil = 0;
  let touchY = null;
  let touchDone = false;
  let idleTimer = 0;

  function measure() {
    const y = window.scrollY;
    const top = (el) => el.getBoundingClientRect().top + y;
    A = pages.map(top);
    const last = pages[pages.length - 1];
    END = top(last) + last.offsetHeight;
    for (let i = 1; i < 4; i++) A[i] = Math.max(A[i], A[i - 1] + 1);
    END = Math.max(END, A[3] + 1);
  }

  // story position: 0..3 across the four pages, 3..4 while the last page scrolls away
  function progress(y) {
    for (let i = 0; i < 3; i++) if (y < A[i + 1]) return i + clamp01((y - A[i]) / (A[i + 1] - A[i]));
    return 3 + clamp01((y - A[3]) / Math.max(1, END - A[3]));
  }

  // ---------- paging ----------
  // where one scroll step in direction dir would go, or null if the page should just scroll normally
  function target(dir) {
    const y = window.scrollY;
    if (dir > 0) {
      if (y >= A[3] - 3) return null;
      for (let i = 0; i < 4; i++) if (A[i] > y + 3) return A[i];
      return null;
    }
    if (y > A[3] + 3 && y < END - 2) return A[3];
    if (y > 3 && y <= A[3] + 3) {
      for (let i = 3; i >= 0; i--) if (A[i] < y - 3) return A[i];
    }
    return null;
  }

  function animateTo(to) {
    const from = window.scrollY;
    const dist = to - from;
    if (Math.abs(dist) < 2) return;
    animating = true;
    html.style.scrollBehavior = 'auto';
    const dur = reduce ? 1 : 1000;
    const t0 = performance.now();
    const step = (now) => {
      const k = clamp01((now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, from + dist * e);
      if (k < 1) requestAnimationFrame(step);
      else {
        animating = false;
        html.style.scrollBehavior = '';
        lockUntil = performance.now() + 450; // swallow the tail of a trackpad swipe
      }
    };
    requestAnimationFrame(step);
  }

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || !e.deltaY) return;
    const now = performance.now();
    const dir = e.deltaY > 0 ? 1 : -1;
    if (animating) { e.preventDefault(); return; }
    if (now < lockUntil) {
      if (target(dir) !== null) { e.preventDefault(); lockUntil = Math.max(lockUntil, now + 130); }
      return;
    }
    const to = target(dir);
    if (to !== null) { e.preventDefault(); animateTo(to); }
  }, { passive: false });

  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; touchDone = false; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (touchY === null) return;
    if (animating) { e.preventDefault(); return; }
    const dy = touchY - e.touches[0].clientY;
    const dir = dy > 0 ? 1 : -1;
    if (target(dir) === null) return;
    e.preventDefault();
    if (!touchDone && Math.abs(dy) > 40 && performance.now() >= lockUntil) {
      touchDone = true;
      animateTo(target(dir));
    }
  }, { passive: false });
  window.addEventListener('touchend', () => { touchY = null; }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT|BUTTON|A/.test(tag) && e.key === ' ') return;
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
    if (!dir) return;
    const to = target(dir);
    if (to === null) return;
    e.preventDefault();
    if (!animating && performance.now() >= lockUntil) animateTo(to);
  });

  dots.forEach((b) => b.addEventListener('click', () => { if (!animating) animateTo(A[+b.dataset.go]); }));

  // dragging the scrollbar or following a link can land between pages: settle on the nearest one
  function settle() {
    if (animating || touchY !== null) return;
    const y = window.scrollY;
    if (y > A[3] + 3 || y < 0) return;
    let best = 0;
    for (let i = 1; i < 4; i++) if (Math.abs(A[i] - y) < Math.abs(A[best] - y)) best = i;
    if (Math.abs(A[best] - y) > 3) animateTo(A[best]);
  }

  // ---------- feed the 3D ----------
  function frame() {
    ticking = false;
    const y = window.scrollY;
    const p = progress(y);
    pending = p;
    if (ctl) ctl.setProgress(p);

    pages.forEach((el, i) => el.classList.toggle('is-active', i > 0 && Math.abs(p - i) < 0.4));
    if (pager) pager.classList.toggle('is-on', y < END - window.innerHeight * 0.5);
    dots.forEach((b, i) => b.classList.toggle('on', Math.abs(p - i) < 0.5));

    const visible = y < END + window.innerHeight * 1.3 && !document.hidden;
    if (visible !== inView) {
      inView = visible;
      if (ctl) ctl.setVisible(visible);
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(settle, 180);
  }

  // the chapter text follows the animation that is looping in the 3D
  function onState(h) {
    if (!h || h.chapter < 1) return;
    beatSets.forEach((set, i) => {
      if (i !== h.chapter) return set.forEach((li) => li.classList.remove('on'));
      set.forEach((li) => li.classList.toggle('on', h.u >= parseFloat(li.dataset.from) && h.u < parseFloat(li.dataset.to)));
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); });
  document.addEventListener('visibilitychange', onScroll);
  measure();
  frame();
  window.addEventListener('load', () => { measure(); onScroll(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(document.getElementById('story-steps'));

  // ---- load the 3D after the page has painted ----
  const conn = navigator.connection;
  if (conn && conn.saveData) return; // keep the photo for people saving data

  function start() {
    import('../piling/embed.js')
      .then((mod) => {
        ctl = mod.mount(host, {
          onReady: () => root.classList.add('is-live'),
          onFail: () => root.classList.add('no-3d'),
          onState,
        });
        if (ctl) {
          ctl.setProgress(pending);
          ctl.setVisible(inView);
        }
      })
      .catch(() => root.classList.add('no-3d'));
  }
  const kick = () => (window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 400));
  if (document.readyState === 'complete') kick(); else window.addEventListener('load', kick, { once: true });
})();
