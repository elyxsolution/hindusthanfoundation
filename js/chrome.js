/* Hindustan Foundation & Constructions - shared page chrome
   Builds the navigation (floating dock with a sliding lens, a Projects mega menu, a full-screen mobile menu)
   and, on inner pages, the contact band and footer. Set <body data-page="home|gallery|about|blogs">.
   Include this script right after <header id="site-nav"></header> so the nav appears with the first paint. */
(function () {
  'use strict';
  const host = document.getElementById('site-nav');
  if (!host) return;
  const page = document.body.dataset.page || 'home';
  const home = page === 'home';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const chev = '<svg viewBox="0 0 12 8" width="11" height="8" aria-hidden="true"><path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const arrow = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  host.className = 'hn';
  host.innerHTML =
    '<a class="hn-brand" href="index.html" aria-label="Hindustan Foundation and Constructions, home">' +
      '<img src="images/Logo/Logo.jpg" alt="" width="40" height="40">' +
      '<span><b>Hindustan</b><small>Foundation &amp; Constructions</small></span>' +
    '</a>' +
    '<nav class="hn-dock" id="nav-links" aria-label="Main">' +
      '<span class="hn-lens" aria-hidden="true"></span>' +
      '<a class="hn-link" href="index.html#what-we-do" data-k="what">What we do</a>' +
      '<div class="hn-item">' +
        '<button class="hn-link hn-pbtn" type="button" aria-haspopup="true" aria-expanded="false" data-k="projects">Projects ' + chev + '</button>' +
        '<div class="hn-mega" role="menu">' +
          '<a class="hn-tile" role="menuitem" href="index.html#ongoing"><img src="images/work/century-megacity-1.webp" alt="" loading="lazy">' +
            '<span class="hn-tile-in"><em><i class="live"></i>Piling in progress</em><b>Ongoing</b><span>Rigs boring on site right now</span></span><u>' + arrow + '</u></a>' +
          '<a class="hn-tile" role="menuitem" href="index.html#completed"><img src="images/work/tech-forest-1.webp" alt="" loading="lazy">' +
            '<span class="hn-tile-in"><em>Handed over</em><b>Completed</b><span>Built, tested and proven</span></span><u>' + arrow + '</u></a>' +
        '</div>' +
      '</div>' +
      '<a class="hn-link" href="gallery.html" data-k="gallery">Gallery</a>' +
      '<a class="hn-link" href="about.html" data-k="about">About</a>' +
      '<a class="hn-link" href="blogs.html" data-k="blogs">Blogs</a>' +
      '<a class="hn-link" href="index.html#contact" data-k="contact">Contact</a>' +
    '</nav>' +
    '<a class="hn-cta" href="tel:+919448086396"><span class="hn-cta-t"><i>Call 94480 86396</i><i aria-hidden="true">Call 94480 86396</i></span></a>' +
    '<button class="hn-burger" id="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="hn-sheet"><span></span><span></span><span></span></button>';

  const sheet = document.createElement('div');
  sheet.className = 'hn-sheet';
  sheet.id = 'hn-sheet';
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML =
    '<nav aria-label="Menu"><ol>' +
      '<li><a href="index.html#what-we-do"><i>01</i>What we do</a></li>' +
      '<li class="has-sub"><span class="hn-sheet-h"><i>02</i>Projects</span><span class="hn-sheet-sub"><a href="index.html#ongoing">Ongoing</a><a href="index.html#completed">Completed</a></span></li>' +
      '<li><a href="gallery.html"><i>03</i>Gallery</a></li>' +
      '<li><a href="about.html"><i>04</i>About</a></li>' +
      '<li><a href="blogs.html"><i>05</i>Blogs</a></li>' +
      '<li><a href="index.html#contact"><i>06</i>Contact</a></li>' +
    '</ol></nav>' +
    '<a class="hn-sheet-call" href="tel:+919448086396">Call 94480 86396 ' + arrow + '</a>';
  document.body.insertBefore(sheet, host.nextSibling);

  // ---------- current page / section ----------
  const links = $$('.hn-link', host);
  let current = home ? '' : page;
  const setCurrent = (k) => {
    current = k;
    links.forEach((a) => {
      const on = a.dataset.k === k;
      a.classList.toggle('is-current', on);
      if (on && !a.classList.contains('hn-pbtn')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  };
  setCurrent(current);

  if (home) {
    const map = { 'what-we-do': 'what', ongoing: 'projects', completed: 'projects', contact: 'contact' };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setCurrent(map[e.target.id]); }), { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    // when the hero is on screen nothing is "current"
    const hero = document.getElementById('story-stage');
    if (hero) new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && window.scrollY < 40) setCurrent(''); }), { threshold: 0.6 }).observe(hero);
  }

  // ---------- sliding lens ----------
  const dock = $('.hn-dock', host);
  const lens = $('.hn-lens', dock);
  const moveLens = (a) => {
    links.forEach((l) => l.classList.toggle('under', l === a));
    if (!a) { lens.classList.remove('on'); return; }
    lens.style.setProperty('--x', a.offsetLeft + (a.classList.contains('hn-pbtn') ? a.parentElement.offsetLeft : 0) + 'px');
    lens.style.setProperty('--w', a.offsetWidth + 'px');
    lens.classList.add('on');
  };
  const place = (a) => moveLens(a);
  links.forEach((a) => {
    a.addEventListener('mouseenter', () => place(a));
    a.addEventListener('focus', () => place(a));
  });
  dock.addEventListener('mouseleave', () => moveLens(null));
  dock.addEventListener('focusout', (e) => { if (!dock.contains(e.relatedTarget)) moveLens(null); });

  // ---------- projects mega menu ----------
  const item = $('.hn-item', host);
  const pbtn = $('.hn-pbtn', host);
  let closeT = 0;
  const open = (v) => { clearTimeout(closeT); item.classList.toggle('open', v); pbtn.setAttribute('aria-expanded', String(v)); };
  item.addEventListener('mouseenter', () => open(true));
  item.addEventListener('mouseleave', () => { closeT = setTimeout(() => open(false), 160); });
  pbtn.addEventListener('click', () => open(!item.classList.contains('open')));
  item.addEventListener('focusin', () => open(true));
  item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) open(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { open(false); closeSheet(); } });
  document.addEventListener('click', (e) => { if (!item.contains(e.target)) open(false); });

  // ---------- mobile sheet ----------
  const burger = $('#menu-btn');
  function closeSheet() {
    if (!sheet.classList.contains('open')) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('hn-lock');
  }
  burger.addEventListener('click', () => {
    const o = !sheet.classList.contains('open');
    sheet.classList.toggle('open', o);
    sheet.setAttribute('aria-hidden', String(!o));
    burger.setAttribute('aria-expanded', String(o));
    burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('hn-lock', o);
  });
  $$('a', sheet).forEach((a) => a.addEventListener('click', closeSheet));

  // ---------- scroll state ----------
  const onScroll = () => host.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // on the home page, "index.html#x" links should scroll, not reload (the site may be served from "/")
  if (home) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="index.html#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const el = document.getElementById(a.getAttribute('href').split('#')[1]);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + el.id);
    });
  }

  // ---------- inner pages: contact band + footer ----------
  const foot = document.getElementById('site-foot');
  if (foot) {
    foot.innerHTML =
      '<section class="cta-band"><div class="wrap cta-in">' +
        '<h2 class="h2">Planning a foundation? Let&rsquo;s talk.</h2>' +
        '<div class="cta-act"><a class="btn btn-solid" href="tel:+919448086396">Call 94480 86396</a>' +
        '<a class="btn btn-ghost" href="mailto:hindustan_foundation@yahoo.co.in?subject=Piling%20enquiry">Email us</a></div>' +
      '</div></section>' +
      '<footer class="foot"><div class="foot-word" aria-hidden="true">Hindustan Foundation</div>' +
        '<div class="wrap foot-bar"><p>&copy; 2025 Hindustan Foundation &amp; Constructions. All rights reserved.</p>' +
        '<p>Specialists in pile foundation, Bengaluru.</p></div></footer>';
  }
})();
