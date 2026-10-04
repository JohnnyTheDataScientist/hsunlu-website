(function () {
  var content = window.SITE_CONTENT;

  // 合作單位跑馬燈：同一組內容排兩次，CSS 位移 -50% 就能無縫循環
  var track = document.getElementById('marquee-track');
  var items = content.partners.map(function (p) {
    return '<div class="client"><img src="img/partners/' + p.logo + '" alt="" loading="lazy"><span>' + p.name + '</span></div>';
  }).join('');
  track.innerHTML = '<div class="marquee-set">' + items + '</div><div class="marquee-set" aria-hidden="true">' + items + '</div>';
  track.style.setProperty('--duration', content.partners.length * 4 + 's');

  // 標題斷行：詞組不拆開，只在詞組之間換行。
  // 空白照常顯示；「|」是不顯示的斷點，給沒有空白的長中文名稱用
  function phrases(text) {
    return text.split(' ').map(function (word) {
      return word.split('|').map(function (t) { return '<span class="ph">' + t + '</span>'; }).join('');
    }).join(' ');
  }
  function plain(text) { return text.replace(/\|/g, ''); }

  // 合作案例：統一卡片，先顯示 casesInitial 個
  var grid = document.getElementById('case-grid');
  var moreBtn = document.getElementById('cases-more');
  var initial = content.casesInitial || content.cases.length;

  grid.innerHTML = content.cases.map(function (c, i) {
    var meta = c.client ? c.client + ' ・ ' + c.category : c.category;
    return '<button type="button" class="case" data-index="' + i + '"' + (i >= initial ? ' hidden' : '') + '>' +
      '<span class="case-frame"><img src="img/cases/' + c.img + '" alt="' + plain(c.title) + '" loading="lazy" width="900" height="900"></span>' +
      '<span class="case-meta">' + meta + '</span>' +
      '<span class="case-title">' + phrases(c.title) + '</span></button>';
  }).join('');

  if (content.cases.length > initial) {
    var extra = [].slice.call(grid.querySelectorAll('.case')).slice(initial);
    var expanded = false;
    var setLabel = function () {
      moreBtn.textContent = expanded ? '收合案例' : '查看全部 ' + content.cases.length + ' 個案例';
      moreBtn.setAttribute('aria-expanded', expanded);
    };
    setLabel();
    moreBtn.hidden = false;
    moreBtn.addEventListener('click', function () {
      expanded = !expanded;
      extra.forEach(function (el) { el.hidden = !expanded; });
      setLabel();
      // 收合後上方內容變短，把按鈕捲回畫面中，免得使用者被留在下一個區塊
      if (!expanded) moreBtn.scrollIntoView({ block: 'center' });
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
    lbImg.alt = plain(c.title);
    lbCap.textContent = (c.client ? c.client + '｜' : '') + plain(c.title);
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

  // 中文以「詞」為單位換行：用瀏覽器內建的斷詞（Intl.Segmenter）在詞與詞之間插入 <wbr>，
  // 再配合 CSS 的 word-break: keep-all，就不會出現「使｜用」這種從詞中間斷開的情況。
  // 不支援的瀏覽器維持一般換行。
  if (window.Intl && Intl.Segmenter) {
    var seg = new Intl.Segmenter('zh-Hant', { granularity: 'word' });
    var targets = document.querySelectorAll('main p, main h1, main h2, main h3, main dd, .case-title, footer p');
    [].forEach.call(targets, function (el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        // .nw \u662f\u523b\u610f\u7d81\u5728\u4e00\u8d77\u7684\u53e5\u5c3e\u77ed\u53e5\uff0c\u4e0d\u63d2\u63db\u884c\u9ede
        if (!/[\u4e00-\u9fff]/.test(node.data) || node.parentNode.closest('.nw')) return;
        var frag = document.createDocumentFragment();
        var parts = Array.from(seg.segment(node.data), function (s) { return s.segment; });
        // 中文排版規則：句讀與右括號不能出現在行首，左括號不能留在行尾
        var noLineStart = /^[，。、；：！？」』）〉》・…）]/;
        var noLineEnd = /[「『（〈《]$/;
        parts.forEach(function (part, i) {
          frag.appendChild(document.createTextNode(part));
          var next = parts[i + 1];
          if (next && !noLineStart.test(next) && !noLineEnd.test(part)) {
            frag.appendChild(document.createElement('wbr'));
          }
        });
        node.parentNode.replaceChild(frag, node);
      });
    });
    document.documentElement.classList.add('word-wrap-zh');
  }
})();
