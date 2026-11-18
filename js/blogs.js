/* Hindustan Foundation & Constructions - blogs page
   Twenty placeholder cards. They are not links; replace the title / tag / excerpt / date of each entry in BLOGS
   when the articles are ready (and turn the <article> into an <a href="..."> to make it clickable). */
(function () {
  'use strict';
  const grid = document.getElementById('bl-grid');
  const BLOGS = Array.from({ length: 20 }, (_, i) => ({
    tag: 'Category',
    title: 'Blog title goes here',
    date: 'Date',
    read: '5 min read',
  }));

  BLOGS.forEach((b, i) => {
    const card = document.createElement('article');
    card.className = 'bl-card';
    card.style.setProperty('--d', (i % 4) * 0.08 + 's');
    card.innerHTML =
      '<div class="bl-img"><span class="bl-tag">' + b.tag + '</span><span class="bl-no">' + String(i + 1).padStart(2, '0') + '</span></div>' +
      '<div class="bl-body"><h3>' + b.title + '</h3>' +
      '<div class="bl-lines" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<div class="bl-meta"><span>' + b.date + ' · ' + b.read + '</span><span>Read</span></div></div>';
    grid.appendChild(card);
  });

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  grid.querySelectorAll('.bl-card').forEach((c) => io.observe(c));
})();
