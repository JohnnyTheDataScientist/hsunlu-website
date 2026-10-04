// 商品頁：切換商品圖、加入詢價籃、立即詢價
(function () {
  var S = window.Site;
  var box = document.querySelector('[data-product]');
  var product = JSON.parse(box.getAttribute('data-product'));
  var main = document.getElementById('pd-main-img');

  document.querySelector('.pd-thumbs').addEventListener('click', function (e) {
    var b = e.target.closest('.pd-thumb');
    if (!b) return;
    main.src = b.dataset.src;
    [].forEach.call(document.querySelectorAll('.pd-thumb'), function (t) { t.removeAttribute('aria-current'); });
    b.setAttribute('aria-current', 'true');
  });

  var addBtn = document.querySelector('[data-add-basket]');
  function syncButton() {
    if (S.Inquiry.has(product.id)) addBtn.textContent = '已在詢價籃';
  }
  syncButton();
  addBtn.addEventListener('click', function () {
    S.addToBasket(product);
    syncButton();
  });
  document.querySelector('[data-inquire-now]').addEventListener('click', function () {
    S.Inquiry.add(product);
    location.href = S.root + 'inquiry.html';
  });
})();
