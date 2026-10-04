// 首頁與合作案例頁：合作單位跑馬燈、合作案例卡片（點圖放大）
(function () {
  var content = window.SITE_CONTENT;
  var S = window.Site;

  // 合作單位跑馬燈：同一組內容排兩次，CSS 位移 -50% 就能無縫循環
  var track = document.getElementById('marquee-track');
  if (track) {
    var items = content.partners.map(function (p) {
      return '<div class="client"><img src="img/partners/' + p.logo + '" alt="" loading="lazy"><span>' + S.esc(p.name) + '</span></div>';
    }).join('');
    track.innerHTML = '<div class="marquee-set">' + items + '</div><div class="marquee-set" aria-hidden="true">' + items + '</div>';
    track.style.setProperty('--duration', content.partners.length * 4 + 's');
  }

  // 合作案例：首頁（data-featured）只放代表作，案例頁放全部
  var grid = document.getElementById('case-grid');
  if (!grid) return;
  var list = content.cases;
  if (grid.hasAttribute('data-featured')) {
    list = list.filter(function (c) { return c.featured; })
      .sort(function (a, b) { return a.featured - b.featured; });
  }
  grid.innerHTML = list.map(function (c, i) {
    var meta = c.client ? c.client + ' ・ ' + c.category : c.category;
    return '<button type="button" class="case" data-index="' + i + '">' +
      '<span class="case-frame"><img src="img/cases/' + c.img + '" alt="' + S.esc(S.plain(c.title)) + '" loading="lazy" width="900" height="900"></span>' +
      '<span class="case-meta">' + S.esc(meta) + '</span>' +
      '<span class="case-title">' + S.phrases(c.title) + '</span></button>';
  }).join('');
  S.zhWrap(grid);

  grid.addEventListener('click', function (e) {
    var item = e.target.closest('.case');
    if (!item) return;
    var c = list[item.dataset.index];
    S.Lightbox.open('img/cases/' + c.img, (c.client ? c.client + '｜' : '') + S.plain(c.title));
  });
})();
