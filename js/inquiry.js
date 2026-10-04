// 詢價頁：詢價籃清單（可填數量、移除）＋聯絡表單。
// 表單透過 FormSubmit（免費表單轉寄服務）寄到公司信箱；第一次使用需要到信箱點「Activate Form」啟用。
(function () {
  var S = window.Site;
  var EMAIL = 'costin1025@gmail.com';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + EMAIL;

  var listEl = document.getElementById('basket-list');
  var emptyEl = document.getElementById('basket-empty');
  var clearBtn = document.getElementById('basket-clear');
  var form = document.getElementById('inquiry-form');
  var submitBtn = document.getElementById('inquiry-submit');
  var statusEl = document.getElementById('form-status');

  function renderList() {
    var items = S.Inquiry.items();
    emptyEl.hidden = items.length > 0;
    clearBtn.hidden = items.length === 0;
    listEl.innerHTML = items.map(function (x) {
      return '<li class="basket-item" data-id="' + S.esc(x.id) + '">' +
        '<a class="basket-thumb" href="' + S.Inquiry.url(x.id) + '"><img src="' + S.Inquiry.thumb(x.id) + '" alt="" width="96" height="96" loading="lazy"></a>' +
        '<div class="basket-info"><a class="basket-title" href="' + S.Inquiry.url(x.id) + '">' + S.esc(x.title) + '</a>' +
        '<label class="basket-qty">預估數量 <input type="number" min="1" inputmode="numeric" value="' + S.esc(x.qty || '') + '" placeholder="例如 200"></label></div>' +
        '<button type="button" class="basket-remove" aria-label="從詢價籃移除 ' + S.esc(x.title) + '">移除</button></li>';
    }).join('');
    S.zhWrap(listEl);
  }
  renderList();

  listEl.addEventListener('input', function (e) {
    if (!e.target.matches('.basket-qty input')) return;
    S.Inquiry.setQty(e.target.closest('.basket-item').dataset.id, e.target.value);
  });
  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('.basket-remove');
    if (!b) return;
    S.Inquiry.remove(b.closest('.basket-item').dataset.id);
    renderList();
  });
  clearBtn.addEventListener('click', function () {
    S.Inquiry.clear();
    renderList();
  });

  function status(html, kind) {
    statusEl.innerHTML = html;
    statusEl.className = 'form-status ' + (kind || '');
    statusEl.hidden = false;
  }

  function itemsText() {
    var base = location.href.replace(/inquiry\.html.*$/, '');
    return S.Inquiry.items().map(function (x, i) {
      return (i + 1) + '. ' + x.title + '｜數量：' + (x.qty || '未填') + '｜' + base + 'product/' + encodeURIComponent(x.id) + '.html';
    }).join('\n') || '（未選擇商品）';
  }

  function mailtoFallback(data) {
    var body = Object.keys(data).filter(function (k) { return k.charAt(0) !== '_'; })
      .map(function (k) { return k + '：' + data[k]; }).join('\n');
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(data._subject) + '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    // 必填欄位檢查，用瀏覽器內建的提示
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (form.elements._honey.value) return; // 機器人填了隱藏欄位

    var data = {};
    [].forEach.call(form.elements, function (el) {
      if (el.name && el.name !== '_honey') data[el.name] = el.value.trim();
    });
    var who = data['公司單位'] || data['聯絡人'];
    data['詢價商品'] = itemsText();
    data._subject = '官網詢價：' + who;
    data._template = 'table';

    submitBtn.disabled = true;
    submitBtn.textContent = '送出中…';
    status('', '');
    statusEl.hidden = true;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (res) {
        if (res.success === true || res.success === 'true') {
          S.Inquiry.clear();
          renderList();
          form.reset();
          status('<strong>已收到您的詢價，謝謝！</strong><br>我們會盡快以 Email 或電話與您聯繫。', 'is-ok');
        } else {
          throw new Error(res.message || 'send failed');
        }
      })
      .catch(function () {
        status('送出失敗，可能是網路問題。您可以 <a href="' + mailtoFallback(data) +
          '">改用 Email 寄出這份詢價</a>，或直接來電 0966-578-635。', 'is-error');
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = '送出詢價';
      });
  });
})();
