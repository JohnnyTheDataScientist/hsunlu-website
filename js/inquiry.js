// 詢價頁：詢價籃清單（可填數量、移除）＋聯絡表單（送出邏輯在 common.js 的 Site.sendForm）
(function () {
  var S = window.Site;
  var listEl = document.getElementById('basket-list');
  var emptyEl = document.getElementById('basket-empty');
  var clearBtn = document.getElementById('basket-clear');

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

  // 詢價商品清單：名稱｜數量｜商品頁連結
  function itemsText() {
    var base = location.href.replace(/inquiry\.html.*$/, '');
    return S.Inquiry.items().map(function (x, i) {
      return (i + 1) + '. ' + x.title + '｜數量：' + (x.qty || '未填') + '｜' + base + 'product/' + encodeURIComponent(x.id) + '.html';
    }).join('\n') || '（未選擇商品）';
  }

  S.sendForm(document.getElementById('inquiry-form'), {
    extend: function (data) { data['詢價商品'] = itemsText(); },
    subject: function (data) { return '官網詢價：' + (data['公司單位'] || data['聯絡人']); },
    onSuccess: function () { S.Inquiry.clear(); renderList(); }
  });
})();
