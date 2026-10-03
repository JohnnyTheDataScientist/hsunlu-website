(function () {
  var content = window.SITE_CONTENT;

  // 合作夥伴跑馬燈：內容複製一份接在後面，CSS 位移 -50% 就能無縫循環
  var track = document.getElementById('marquee-track');
  var items = content.partners.map(function (p) {
    return '<div class="partner"><img src="img/partners/' + p.logo + '" alt="" loading="lazy"><span>' + p.name + '</span></div>';
  }).join('');
  track.innerHTML = items + '<div class="marquee-dup" aria-hidden="true">' + items + '</div>';
  track.style.setProperty('--duration', content.partners.length * 3 + 's');

  // 合作案例：類別篩選 + 圖片網格
  var grid = document.getElementById('case-grid');
  var filters = document.getElementById('case-filters');
  var categories = ['全部'].concat(content.cases.map(function (c) { return c.category; })
    .filter(function (c, i, all) { return all.indexOf(c) === i; }));

  filters.innerHTML = categories.map(function (c, i) {
    return '<button type="button" data-cat="' + c + '" aria-pressed="' + (i === 0) + '">' + c + '</button>';
  }).join('');

  grid.innerHTML = content.cases.map(function (c, i) {
    return '<button type="button" class="case-item" data-cat="' + c.category + '" data-index="' + i + '">' +
      '<img src="img/cases/' + c.img + '" alt="' + c.title + '" loading="lazy" width="900" height="900">' +
      '<span class="case-title">' + c.title + '</span><span class="case-cat">' + c.category + '</span></button>';
  }).join('');

  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var cat = btn.dataset.cat;
    filters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
    grid.querySelectorAll('.case-item').forEach(function (item) {
      item.hidden = cat !== '全部' && item.dataset.cat !== cat;
    });
  });

  // 燈箱
  var lightbox = document.getElementById('lightbox');
  var lbImg = lightbox.querySelector('img');
  var lbCap = lightbox.querySelector('figcaption');
  grid.addEventListener('click', function (e) {
    var item = e.target.closest('.case-item');
    if (!item) return;
    var c = content.cases[item.dataset.index];
    lbImg.src = 'img/cases/' + c.img;
    lbImg.alt = c.title;
    lbCap.textContent = c.title;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  });
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
  lightbox.addEventListener('click', function (e) {
    if (e.target !== lbImg) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  // 手機版選單
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    nav.classList.toggle('open', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    }
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
