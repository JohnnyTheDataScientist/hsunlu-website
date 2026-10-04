// 全站共用：手機選單、詢價籃、提示訊息、圖片燈箱、中文斷詞換行
(function () {
  var root = document.body.getAttribute('data-root') || '';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 標題斷行：詞組不拆開，只在詞組之間換行。
  // 空白照常顯示；「|」是不顯示的斷點，給沒有空白的長中文名稱用
  function phrases(text) {
    return text.split(' ').map(function (word) {
      return word.split('|').map(function (t) { return '<span class="ph">' + esc(t) + '</span>'; }).join('');
    }).join(' ');
  }
  function plain(text) { return text.replace(/\|/g, ''); }

  // ---------- 手機版選單 ----------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    nav.classList.toggle('open', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    }
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- 提示訊息 ----------
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3200);
  }

  // ---------- 詢價籃（存在瀏覽器裡，只有這位訪客看得到） ----------
  var KEY = 'kl-inquiry-v1';
  var memory = [];
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return memory; }
  }
  function save(items) {
    memory = items;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* 私密模式等情況：只存在這一頁 */ }
    updateBadge();
    listeners.forEach(function (fn) { fn(items); });
  }
  var listeners = [];
  var Inquiry = {
    items: load,
    has: function (id) { return load().some(function (x) { return x.id === id; }); },
    add: function (item) {
      var items = load();
      if (!items.some(function (x) { return x.id === item.id; })) items.push({ id: item.id, title: item.title, qty: '' });
      save(items);
    },
    remove: function (id) { save(load().filter(function (x) { return x.id !== id; })); },
    setQty: function (id, qty) {
      save(load().map(function (x) { if (x.id === id) x.qty = qty; return x; }));
    },
    clear: function () { save([]); },
    onChange: function (fn) { listeners.push(fn); },
    thumb: function (id) { return root + 'img/products/' + encodeURIComponent(id) + '/thumb.webp'; },
    url: function (id) { return root + 'product/' + encodeURIComponent(id) + '.html'; }
  };
  function updateBadge() {
    var n = load().length;
    [].forEach.call(document.querySelectorAll('[data-basket-count]'), function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }
  updateBadge();
  // 其他分頁改了詢價籃時同步數字
  window.addEventListener('storage', function (e) { if (e.key === KEY) updateBadge(); });

  function addToBasket(item) {
    var existed = Inquiry.has(item.id);
    Inquiry.add(item);
    toast((existed ? '已在詢價籃中' : '已加入詢價籃') +
      '　<a href="' + root + 'inquiry.html">前往詢價（' + load().length + '）</a>');
  }

  // ---------- 圖片燈箱 ----------
  var lightbox = document.getElementById('lightbox');
  var Lightbox = { open: function () {} };
  if (lightbox) {
    var lbImg = lightbox.querySelector('img');
    var lbCap = lightbox.querySelector('figcaption');
    var close = function () { lightbox.hidden = true; document.body.style.overflow = ''; };
    Lightbox.open = function (src, caption) {
      lbImg.src = src;
      lbImg.alt = caption;
      lbCap.textContent = caption;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    };
    lightbox.addEventListener('click', function (e) { if (e.target !== lbImg) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lightbox.hidden) close(); });
  }

  // ---------- 中文以「詞」為單位換行 ----------
  // 用瀏覽器內建的斷詞（Intl.Segmenter）在詞與詞之間插入 <wbr>，
  // 再配合 CSS 的 word-break: keep-all，就不會出現「使｜用」這種從詞中間斷開的情況。
  // 不支援的瀏覽器維持一般換行。動態產生的內容由各頁呼叫 zhWrap(容器)。
  var seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('zh-Hant', { granularity: 'word' }) : null;
  var noLineStart = /^[，。、；：！？」』）〉》・…）]/;
  var noLineEnd = /[「『（〈《]$/;
  var SELECTOR = 'p, h1, h2, h3, h4, dd, li, .case-title, .pcard-title';
  function wrapNode(node) {
    if (!/[一-鿿]/.test(node.data) || node.parentNode.closest('.nw')) return;
    var parts = Array.from(seg.segment(node.data), function (s) { return s.segment; });
    if (parts.length < 2) return;
    var frag = document.createDocumentFragment();
    parts.forEach(function (part, i) {
      frag.appendChild(document.createTextNode(part));
      var next = parts[i + 1];
      // 中文排版規則：句讀與右括號不能出現在行首，左括號不能留在行尾
      if (next && !noLineStart.test(next) && !noLineEnd.test(part)) frag.appendChild(document.createElement('wbr'));
    });
    node.parentNode.replaceChild(frag, node);
  }
  function zhWrap(container) {
    if (!seg) return;
    var els = container.matches && container.matches(SELECTOR) ? [container] : [];
    els = els.concat([].slice.call(container.querySelectorAll(SELECTOR)));
    els.forEach(function (el) {
      if (el.dataset.zh) return;
      el.dataset.zh = '1';
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(wrapNode);
    });
  }
  if (seg) document.documentElement.classList.add('word-wrap-zh');
  zhWrap(document.querySelector('main'));
  zhWrap(document.querySelector('footer'));

  // ---------- 表單送出（詢價、聯絡共用） ----------
  // 透過 FormSubmit（免費表單轉寄服務）寄到公司信箱；第一次使用需要到信箱點「Activate Form」啟用。
  var EMAIL = 'costin1025@gmail.com';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + EMAIL;
  function sendForm(form, opts) {
    var btn = form.querySelector('button[type="submit"]');
    var statusEl = form.querySelector('.form-status');
    var label = btn.textContent;
    var status = function (html, kind) {
      statusEl.innerHTML = html;
      statusEl.className = 'form-status ' + kind;
      statusEl.hidden = false;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.elements._honey && form.elements._honey.value) return; // 機器人填了隱藏欄位

      var data = {};
      [].forEach.call(form.elements, function (el) {
        if (el.name && el.name !== '_honey') data[el.name] = el.value.trim();
      });
      if (opts.extend) opts.extend(data);
      data._subject = opts.subject(data);
      data._template = 'table';

      btn.disabled = true;
      btn.textContent = '送出中…';
      statusEl.hidden = true;
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) {
          if (res.success !== true && res.success !== 'true') throw new Error(res.message || 'send failed');
          form.reset();
          if (opts.onSuccess) opts.onSuccess();
          status('<strong>已收到您的訊息，謝謝！</strong><br>我們會盡快以 Email 或電話與您聯繫。', 'is-ok');
        })
        .catch(function () {
          var body = Object.keys(data).filter(function (k) { return k.charAt(0) !== '_'; })
            .map(function (k) { return k + '：' + data[k]; }).join('\n');
          var mailto = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(data._subject) + '&body=' + encodeURIComponent(body);
          status('送出失敗，可能是網路問題。您可以 <a href="' + mailto + '">改用 Email 寄出</a>，或直接來電 0966-578-635。', 'is-error');
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = label;
        });
    });
  }

  window.Site = {
    root: root, esc: esc, phrases: phrases, plain: plain, toast: toast, zhWrap: zhWrap,
    Inquiry: Inquiry, addToBasket: addToBasket, Lightbox: Lightbox, sendForm: sendForm
  };
})();
