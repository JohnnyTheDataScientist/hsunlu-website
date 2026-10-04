(function () {
  var content = window.SITE_CONTENT;

  // 合作單位跑馬燈：同一組內容排兩次，CSS 位移 -50% 就能無縫循環
  var track = document.getElementById('marquee-track');
  var items = content.partners.map(function (p) {
    return '<div class="client"><img src="img/partners/' + p.logo + '" alt="" loading="lazy"><span>' + p.name + '</span></div>';
  }).join('');
  track.innerHTML = '<div class="marquee-set">' + items + '</div><div class="marquee-set" aria-hidden="true">' + items + '</div>';
  track.style.setProperty('--duration', content.partners.length * 4 + 's');

  // 合作案例：統一卡片，先顯示 casesInitial 個
  var grid = document.getElementById('case-grid');
  var moreBtn = document.getElementById('cases-more');
  var initial = content.casesInitial || content.cases.length;

  grid.innerHTML = content.cases.map(function (c, i) {
    var meta = c.client ? c.client + ' ・ ' + c.category : c.category;
    return '<button type="button" class="case" data-index="' + i + '"' + (i >= initial ? ' hidden' : '') + '>' +
      '<span class="case-frame"><img src="img/cases/' + c.img + '" alt="' + c.title + '" loading="lazy" width="900" height="900"></span>' +
      '<span class="case-meta">' + meta + '</span>' +
      '<span class="case-title">' + c.title + '</span></button>';
  }).join('');

  if (content.cases.length > initial) {
    moreBtn.textContent = '查看全部 ' + content.cases.length + ' 個案例';
    moreBtn.hidden = false;
    moreBtn.addEventListener('click', function () {
      grid.querySelectorAll('.case[hidden]').forEach(function (el) { el.hidden = false; });
      moreBtn.hidden = true;
    });
  }

  // 燈箱
  var lightbox = document.getElementById('lightbox');
  var lbImg = lightbox.querySelector('img');
  var lbCap = lightbox.querySelector('figcaption');
  grid.addEventListener('click', function (e) {
    var item = e.target.closest('.case');
    if (!item) return;
    var c = content.cases[item.dataset.index];
    lbImg.src = 'img/cases/' + c.img;
    lbImg.alt = c.title;
    lbCap.textContent = (c.client ? c.client + '｜' : '') + c.title;
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
