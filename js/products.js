// 產品展示頁：分類側欄、搜尋、分頁。狀態放在網址參數（?cat=&sub=&q=&page=），可直接分享連結
(function () {
  var S = window.Site;
  var PER_PAGE = 24;
  var grid = document.getElementById('product-grid');
  var pager = document.getElementById('pager');
  var catsEl = document.getElementById('catalog-cats');
  var titleEl = document.getElementById('catalog-title');
  var countEl = document.getElementById('catalog-count');
  var form = document.getElementById('catalog-search');
  var input = document.getElementById('q');
  var catsToggle = document.getElementById('cats-toggle');
  var data;

  function state() {
    var p = new URLSearchParams(location.search);
    return { cat: p.get('cat') || '', sub: p.get('sub') || '', q: (p.get('q') || '').trim(), page: Math.max(1, parseInt(p.get('page'), 10) || 1) };
  }
  function urlFor(st) {
    var p = new URLSearchParams();
    if (st.cat) p.set('cat', st.cat);
    if (st.sub) p.set('sub', st.sub);
    if (st.q) p.set('q', st.q);
    if (st.page > 1) p.set('page', st.page);
    var qs = p.toString();
    return 'products.html' + (qs ? '?' + qs : '');
  }
  function go(st, scroll) {
    history.pushState(null, '', urlFor(st));
    render();
    if (scroll) document.querySelector('.catalog').scrollIntoView({ block: 'start' });
  }

  var BRAND = '馴鹿品牌'; // 特別分類：馴鹿 HSUNLU 商品，同時也保留在各自原本的分類裡
  function inCat(p, cat) { return cat === BRAND ? !!p.b : p.c === cat; }

  function filtered(st) {
    var words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
    return data.products.filter(function (p) {
      if (st.cat && !inCat(p, st.cat)) return false;
      if (st.sub && p.s !== st.sub) return false;
      var t = p.t.toLowerCase();
      return words.every(function (w) { return t.indexOf(w) !== -1; });
    });
  }

  function renderCats(st) {
    var count = function (cat, sub) {
      return data.products.filter(function (p) { return p.c === cat && (!sub || p.s === sub); }).length;
    };
    var link = function (label, cat, sub, n, active, cls) {
      return '<a class="' + cls + (active ? ' is-active' : '') + '" href="' + S.esc(urlFor({ cat: cat, sub: sub, q: '', page: 1 })) +
        '" data-cat="' + S.esc(cat) + '" data-sub="' + S.esc(sub) + '"' + (active ? ' aria-current="page"' : '') +
        '><span>' + S.esc(label) + '</span><span class="n">' + n + '</span></a>';
    };
    var html = link('全部商品', '', '', data.products.length, !st.cat && !st.q, 'cat-link');
    var brandCount = data.products.filter(function (p) { return p.b; }).length;
    if (brandCount) html += link(BRAND, BRAND, '', brandCount, st.cat === BRAND, 'cat-link cat-link-brand');
    data.categories.forEach(function (c) {
      var n = count(c.name);
      if (!n) return;
      var open = st.cat === c.name;
      html += link(c.name, c.name, '', n, open && !st.sub, 'cat-link');
      if (open && c.subs.length > 1) {
        html += '<div class="sub-links">' + c.subs.map(function (s) {
          return link(s, c.name, s, count(c.name, s), st.sub === s, 'sub-link');
        }).join('') + '</div>';
      }
    });
    catsEl.innerHTML = html;
  }

  function card(p) {
    var inBasket = S.Inquiry.has(p.id);
    return '<article class="pcard">' +
      '<a class="pcard-link" href="' + S.Inquiry.url(p.id) + '">' +
      '<span class="pcard-img"><img src="' + S.Inquiry.thumb(p.id) + '" alt="" loading="lazy" width="480" height="480"></span>' +
      '<span class="pcard-cat">' + S.esc(p.s || p.c) + '</span>' +
      '<span class="pcard-title">' + S.esc(p.t) + '</span></a>' +
      '<button type="button" class="pcard-add' + (inBasket ? ' is-added' : '') + '" data-id="' + S.esc(p.id) + '" data-title="' + S.esc(p.t) + '">' +
      (inBasket ? '已在詢價籃' : '＋ 加入詢價籃') + '</button></article>';
  }

  function renderPager(st, total) {
    var pages = Math.ceil(total / PER_PAGE);
    if (pages <= 1) { pager.innerHTML = ''; return; }
    var btn = function (n, label, extra) {
      return '<a href="' + S.esc(urlFor({ cat: st.cat, sub: st.sub, q: st.q, page: n })) + '" data-page="' + n + '"' + (extra || '') + '>' + label + '</a>';
    };
    var html = st.page > 1 ? btn(st.page - 1, '上一頁', ' class="pager-step"') : '';
    for (var i = 1; i <= pages; i++) {
      // 頁數多時只顯示頭尾與目前頁附近
      if (i === 1 || i === pages || Math.abs(i - st.page) <= 2) {
        html += i === st.page ? '<span aria-current="page">' + i + '</span>' : btn(i, i);
      } else if (Math.abs(i - st.page) === 3) {
        html += '<span class="gap">…</span>';
      }
    }
    if (st.page < pages) html += btn(st.page + 1, '下一頁', ' class="pager-step"');
    pager.innerHTML = html;
  }

  function render() {
    var st = state();
    var list = filtered(st);
    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (st.page > pages) st.page = pages;
    input.value = st.q;
    renderCats(st);
    titleEl.textContent = st.q ? '搜尋「' + st.q + '」' : (st.sub || st.cat || '全部商品');
    countEl.textContent = '共 ' + list.length + ' 款';
    var slice = list.slice((st.page - 1) * PER_PAGE, st.page * PER_PAGE);
    grid.innerHTML = slice.length ? slice.map(card).join('') :
      '<p class="empty">找不到符合的商品。可以換個關鍵字，或直接 <a href="inquiry.html">告訴我們您的需求</a>。</p>';
    S.zhWrap(grid);
    renderPager(st, list.length);
    document.title = (st.sub || st.cat || '產品展示') + '｜光路國際有限公司';
  }

  // 側欄、分頁連結：不重新載入整頁
  catsEl.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    catsToggle.setAttribute('aria-expanded', 'false');
    catsEl.classList.remove('open');
    go({ cat: a.dataset.cat, sub: a.dataset.sub, q: '', page: 1 }, true);
  });
  pager.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    var st = state();
    st.page = +a.dataset.page;
    go(st, true);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    go({ cat: '', sub: '', q: input.value.trim(), page: 1 }, false);
  });
  catsToggle.addEventListener('click', function () {
    var open = catsToggle.getAttribute('aria-expanded') !== 'true';
    catsToggle.setAttribute('aria-expanded', open);
    catsEl.classList.toggle('open', open);
  });
  window.addEventListener('popstate', render);

  fetch(S.root + 'data/products-index.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { data = d; render(); })
    .catch(function () {
      grid.innerHTML = '<p class="empty">商品資料載入失敗，請重新整理頁面。</p>';
    });
})();
