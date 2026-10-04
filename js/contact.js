// 聯絡我們頁：線上聯絡表單（送出邏輯在 common.js 的 Site.sendForm）
(function () {
  window.Site.sendForm(document.getElementById('contact-form'), {
    subject: function (data) { return '官網聯絡：' + (data['公司單位'] || data['姓名']); }
  });
})();
