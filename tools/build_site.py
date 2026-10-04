"""組合整個網站：共用頁首／頁尾、各頁面、583 個商品頁、網站地圖。

    python website/tools/build_site.py

來源：
  src/pages/*.html     各頁主要內容，開頭的 <!--meta {...} --> 是頁面設定
  data/products.json   由 tools/build_products.py 產生
輸出（網站根目錄）：
  index.html、products.html、cases.html、inquiry.html、404.html
  product/<id>.html、data/products-index.json、sitemap.xml、robots.txt

改了頁首、頁尾、聯絡區塊或任何頁面後，重跑這支程式即可。
CSS／JS 的快取版本號依檔案內容自動計算，不用手動改。
"""

import hashlib
import html
import json
import os
import re
import shutil
import sys
from urllib.parse import quote

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
PAGES = os.path.join(SITE, "src", "pages")
SITE_URL = "https://hsunlu.com/"

COMPANY = {
    "name": "光路國際有限公司",
    "email": "costin1025@gmail.com",
    "phone": "0966-578-635",
    "phone_intl": "+886966578635",
    "address": "台北市內湖區東湖路113巷70弄8之1號",
    "line_footer": "https://lin.ee/94eQd5o",
    "line_float": "https://lin.ee/OQbMsMr",
}

NAV = [
    ("關於我們", "index.html#about", "about"),
    ("產品展示", "products.html", "products"),
    ("合作案例", "cases.html", "cases"),
    ("馴鹿品牌", "index.html#brand", "brand"),
    ("聯絡我們", "index.html#contact", "contact"),
]

esc = html.escape


def version(path):
    with open(os.path.join(SITE, path), "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def asset(path, prefix):
    return f"{prefix}{path}?v={version(path)}"


def href(target, page, prefix):
    """首頁內的錨點在首頁上直接用 #id，避免整頁重新載入。"""
    if page == "home" and target.startswith("index.html#"):
        return target[len("index.html"):]
    return prefix + target


def header(page, prefix):
    links = "\n".join(
        f'        <a href="{href(t, page, prefix)}"{" aria-current=\"page\"" if key == page else ""}>{label}</a>'
        for label, t, key in NAV
    )
    home = "#top" if page == "home" else prefix + "index.html"
    return f"""  <header class="site-header">
    <div class="container header-inner">
      <a class="site-brand" href="{home}" aria-label="光路國際 首頁">
        <span class="brand-name">光路國際</span>
        <span class="brand-sub">禮贈品客製</span>
      </a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="開啟選單">
        <span></span><span></span><span></span>
      </button>
      <nav id="site-nav" class="site-nav">
{links}
        <a class="btn btn-dark btn-sm nav-basket" href="{prefix}inquiry.html">詢價籃<span class="basket-count" data-basket-count hidden>0</span></a>
      </nav>
    </div>
  </header>"""


def footer(page, prefix, categories):
    quick = "\n".join(f'          <a href="{href(t, page, prefix)}">{label}</a>' for label, t, _ in NAV)
    cats = "\n".join(
        f'          <a href="{prefix}products.html?cat={esc(c["name"])}">{esc(c["name"])}</a>' for c in categories
    )
    c = COMPANY
    return f"""  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-about">
        <p class="footer-name">{c["name"]}</p>
        <p><span class="ph">企業禮贈 ・ 政府機關 ・</span> <span class="ph">團體採購 ・ 專案客製</span></p>
        <p>旗下品牌：馴鹿 HSUNLU</p>
      </div>
      <nav class="footer-col" aria-label="快速連結">
        <p class="footer-col-title">快速連結</p>
{quick}
          <a href="{prefix}inquiry.html">線上詢價</a>
      </nav>
      <nav class="footer-col footer-cats" aria-label="產品分類">
        <p class="footer-col-title">產品分類</p>
{cats}
      </nav>
      <div class="footer-col">
        <p class="footer-col-title">聯絡資訊</p>
        <a href="mailto:{c["email"]}">{c["email"]}</a>
        <a href="tel:{c["phone_intl"]}">{c["phone"]}</a>
        <span><span class="ph">台北市內湖區</span><span class="ph">東湖路113巷70弄8之1號</span></span>
      </div>
      <p class="copyright">© <span id="year">2026</span> {c["name"]}</p>
    </div>
  </footer>"""


def contact_section(prefix):
    c = COMPANY
    maps = "https://www.google.com/maps/search/?api=1&query=" + c["address"]
    return f"""    <section id="contact" class="contact">
      <div class="container contact-grid">
        <div class="contact-copy">
          <p class="eyebrow eyebrow-light">聯絡我們</p>
          <h2>有禮贈需求？<br>歡迎直接與我們聯繫</h2>
          <p class="contact-lead">企業、機關採購與團體訂製，我們會盡快回覆<span class="nw">並提供建議方案。</span></p>
          <dl class="contact-list">
            <div><dt>Email</dt><dd><a href="mailto:{c["email"]}?subject=禮贈品詢價">{c["email"]}</a></dd></div>
            <div><dt>電話</dt><dd><a href="tel:{c["phone_intl"]}">{c["phone"]}</a></dd></div>
            <div><dt>地址</dt><dd><a href="{maps}" target="_blank" rel="noopener"><span class="ph">台北市內湖區</span><span class="ph">東湖路113巷70弄8之1號</span></a></dd></div>
          </dl>
          <a class="btn btn-light" href="{prefix}inquiry.html">線上詢價</a>
        </div>
        <div class="line-card">
          <img src="{prefix}img/line-qr.png" alt="LINE 官方帳號 QR Code" width="540" height="540" loading="lazy">
          <div>
            <h3>LINE 官方帳號</h3>
            <p><span class="ph">掃描 QR Code 加入好友，</span><span class="ph">直接線上諮詢。</span></p>
          </div>
        </div>
      </div>
    </section>"""


LINE_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.48 3 2 6.58 2 11c0 3.96 3.6 7.28 8.46 7.9.33.07.78.22.89.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1 .88.55 1.08-.46 5.83-3.43 7.95-5.88C21.53 14.24 22 12.68 22 11c0-4.42-4.48-8-10-8Zm-3.6 10.6H6.4a.53.53 0 0 1-.53-.53V9.07a.53.53 0 0 1 1.06 0v3.47H8.4a.53.53 0 0 1 0 1.06Zm2.07-.53a.53.53 0 0 1-1.06 0V9.07a.53.53 0 0 1 1.06 0v4Zm4.82 0a.53.53 0 0 1-.95.32l-2.04-2.78v2.46a.53.53 0 0 1-1.06 0V9.07a.53.53 0 0 1 .95-.32l2.04 2.78V9.07a.53.53 0 0 1 1.06 0v4Zm3.24-2.53a.53.53 0 0 1 0 1.06h-1.47v.94h1.47a.53.53 0 0 1 0 1.06h-2a.53.53 0 0 1-.53-.53V9.07c0-.29.24-.53.53-.53h2a.53.53 0 0 1 0 1.06h-1.47v.94h1.47Z"/></svg>')


def floating(prefix, lightbox):
    lb = """
  <div class="lightbox" id="lightbox" hidden>
    <button class="lightbox-close" aria-label="關閉">×</button>
    <figure><img alt=""><figcaption></figcaption></figure>
  </div>""" if lightbox else ""
    return f"""  <div class="line-float-wrap">
    <div class="line-pop" aria-hidden="true">
      <p>手機掃描加入 LINE 好友</p>
      <img src="{prefix}img/line-qr-float.png" alt="" width="540" height="540" loading="lazy">
    </div>
    <a class="line-float" href="{COMPANY["line_float"]}" target="_blank" rel="noopener" aria-label="LINE 線上諮詢">
      {LINE_SVG}
      <span>LINE 諮詢</span>
    </a>
  </div>
  <div class="toast" id="toast" role="status" hidden></div>{lb}"""


def org_jsonld():
    c = COMPANY
    data = {
        "@context": "https://schema.org", "@type": "Organization", "name": c["name"], "url": SITE_URL,
        "logo": SITE_URL + "img/favicon.png", "brand": {"@type": "Brand", "name": "馴鹿 HSUNLU"},
        "email": c["email"], "telephone": "+886-966-578-635",
        "address": {"@type": "PostalAddress", "streetAddress": "東湖路113巷70弄8之1號", "addressLocality": "內湖區",
                    "addressRegion": "台北市", "postalCode": "114", "addressCountry": "TW"},
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


def layout(meta, main, prefix, categories, path, extra_head=""):
    page = meta.get("page", "")
    og_image = SITE_URL + quote(meta.get("og_image", "img/cases/taipei-city-council-gift-set.webp"))
    url = SITE_URL + quote(path)  # 商品網址可能含中文，提供給搜尋引擎的網址要編碼
    robots = '\n  <meta name="robots" content="noindex">' if meta.get("noindex") else ""
    scripts = "\n".join(f'  <script src="{asset(s, prefix)}"></script>'
                        for s in ["js/common.js"] + meta.get("scripts", []))
    jsonld = org_jsonld() if page == "home" else ""
    jsonld = f'\n  <script type="application/ld+json">\n{jsonld}\n  </script>' if jsonld else ""
    return f"""<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(meta["title"])}</title>
  <meta name="description" content="{esc(meta["description"])}">{robots}
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{esc(meta["title"])}">
  <meta property="og:description" content="{esc(meta["description"])}">
  <meta property="og:image" content="{og_image}">
  <meta property="og:url" content="{url}">
  <link rel="icon" type="image/png" href="{prefix}img/favicon.png">
  <link rel="apple-touch-icon" href="{prefix}img/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{asset("css/style.css", prefix)}">{jsonld}{extra_head}
</head>
<body data-page="{page}" data-root="{prefix}">
{header(page, prefix)}

  <main id="top">
{main.rstrip()}
  </main>

{footer(page, prefix, categories)}

{floating(prefix, meta.get("lightbox"))}

{scripts}
</body>
</html>
"""


def read_page(name):
    text = open(os.path.join(PAGES, name), encoding="utf-8").read()
    m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->\s*", text, re.S)
    return json.loads(m.group(1)), text[m.end():]


def category_tiles(categories, products):
    tiles = []
    for c in categories:
        items = [p for p in products if p["category"] == c["name"]]
        if not items:
            continue
        # 代表圖：該分類中圖片最多的商品（通常是拍得最完整的）
        rep = max(items, key=lambda p: (len(p["images"]), -items.index(p)))
        tiles.append(f"""          <a class="cat-tile" href="products.html?cat={esc(c["name"])}">
            <span class="cat-img"><img src="img/products/{rep["id"]}/thumb.webp" alt="" loading="lazy" width="480" height="480"></span>
            <span class="cat-name">{esc(c["name"])}</span>
            <span class="cat-count">{len(items)} 款</span>
          </a>""")
    return "\n".join(tiles)


def product_page(p, products, categories):
    prefix = "../"
    imgs = [f'{prefix}img/products/{p["id"]}/{f}' for f in p["images"]]
    thumbs = "".join(
        f'<button type="button" class="pd-thumb" data-src="{src}" aria-label="第 {i} 張圖"{" aria-current=\"true\"" if i == 1 else ""}>'
        f'<img src="{src}" alt="" loading="lazy" width="120" height="120"></button>'
        for i, src in enumerate(imgs, 1)
    ) if len(imgs) > 1 else ""
    options = "".join(
        f'<div class="pd-option"><span>{esc(o["name"])}</span><span>{"、".join(esc(v) for v in o["values"])}</span></div>'
        for o in p["options"]
    )
    related = [x for x in products if x["category"] == p["category"] and x["id"] != p["id"]]
    same_sub = [x for x in related if p["sub"] and x["sub"] == p["sub"]]
    related = (same_sub + [x for x in related if x not in same_sub])[:4]
    related_html = "".join(product_card(x, prefix) for x in related)
    cat_link = f'{prefix}products.html?cat={esc(p["category"])}'
    item = json.dumps({"id": p["id"], "title": p["title"]}, ensure_ascii=False)
    main = f"""    <section class="section-tight pd">
      <div class="container">
        <nav class="breadcrumb" aria-label="目前位置"><a href="{prefix}index.html">首頁</a><a href="{prefix}products.html">產品展示</a><a href="{cat_link}">{esc(p["category"])}</a><span>{esc(p["title"])}</span></nav>
        <div class="pd-grid" data-product='{esc(item)}'>
          <div class="pd-gallery">
            <div class="pd-main"><img id="pd-main-img" src="{imgs[0]}" alt="{esc(p["title"])}" width="900" height="900"></div>
            <div class="pd-thumbs">{thumbs}</div>
          </div>
          <div class="pd-info">
            <p class="pd-cat"><a href="{cat_link}">{esc(p["category"])}</a>{(" ・ " + esc(p["sub"])) if p["sub"] and p["sub"] != p["category"] else ""}</p>
            <h1>{esc(p["title"])}</h1>
            {f'<p class="pd-summary">{esc(p["summary"])}</p>' if p["summary"] else ""}
            {f'<div class="pd-options">{options}</div>' if options else ""}
            <div class="pd-actions">
              <button type="button" class="btn btn-outline" data-add-basket>加入詢價籃</button>
              <button type="button" class="btn btn-dark" data-inquire-now>立即詢價</button>
            </div>
            <ul class="pd-notes">
              <li>價格依數量、客製方式與交期而定，<span class="nw">歡迎詢價</span></li>
              <li>可客製 Logo 印刷、雷射雕刻與<span class="nw">專屬包裝</span></li>
              <li>可加入多項商品後，<span class="nw">一次送出詢價</span></li>
            </ul>
          </div>
        </div>
        <div class="pd-desc">
          <h2>產品說明</h2>
          <div class="pd-desc-body">{p["description"]}</div>
        </div>
        {f'<div class="pd-related"><h2>相關商品</h2><div class="product-grid product-grid-4">{related_html}</div></div>' if related else ""}
      </div>
    </section>"""
    meta = {
        "title": f'{p["title"]}｜光路國際 禮贈品客製',
        "description": (p["summary"] or p["title"])[:150],
        "og_image": f'img/products/{p["id"]}/01.webp',
        "page": "product",
        "scripts": ["js/product.js"],
    }
    ld = {"@context": "https://schema.org", "@type": "Product", "name": p["title"],
          "image": [SITE_URL + quote(f'img/products/{p["id"]}/{f}') for f in p["images"]],
          "description": p["summary"] or p["title"], "category": p["category"],
          "brand": {"@type": "Organization", "name": COMPANY["name"]}}
    head = f'\n  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'
    return layout(meta, main, prefix, categories, f'product/{p["id"]}.html', head)


def product_card(p, prefix):
    return (f'<article class="pcard"><a class="pcard-link" href="{prefix}product/{p["id"]}.html">'
            f'<span class="pcard-img"><img src="{prefix}img/products/{p["id"]}/thumb.webp" alt="" loading="lazy" width="480" height="480"></span>'
            f'<span class="pcard-cat">{esc(p["category"])}</span>'
            f'<span class="pcard-title">{esc(p["title"])}</span></a></article>')


def not_found_page(products):
    ids = json.dumps([p["id"] for p in products], ensure_ascii=False, separators=(",", ":"))
    return f"""<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>光路國際有限公司</title>
  <meta name="robots" content="noindex">
  <script>
    // 舊 Shopify 網址導向新網站：/products/<handle> 導到對應的商品頁，其他一律回首頁。
    // 放在 github.io/專案名/ 底下時，首頁是第一層路徑，不是網域根目錄。
    (function () {{
      var ids = {ids};
      var parts = location.pathname.split('/').filter(Boolean);
      var base = location.hostname.endsWith('github.io') ? '/' + parts.shift() + '/' : '/';
      var target = base;
      if (parts[0] === 'products' && parts[1]) {{
        var handle = decodeURIComponent(parts[1]);
        if (ids.indexOf(handle) !== -1) target = base + 'product/' + encodeURIComponent(handle) + '.html';
        else target = base + 'products.html';
      }}
      location.replace(target);
    }})();
  </script>
</head>
<body>
  <p>網站已改版，正在帶您前往新頁面… <a href="/">光路國際 首頁</a></p>
</body>
</html>
"""


def main():
    data = json.load(open(os.path.join(SITE, "data", "products.json"), encoding="utf-8"))
    products, categories = data["products"], data["categories"]
    count = str(len(products))

    # 產品列表頁用的精簡清單（不含描述）
    index = [{"id": p["id"], "t": p["title"], "c": p["category"], "s": p["sub"]} for p in products]
    with open(os.path.join(SITE, "data", "products-index.json"), "w", encoding="utf-8") as f:
        json.dump({"categories": categories, "products": index}, f, ensure_ascii=False, separators=(",", ":"))

    built = []
    for name in sorted(os.listdir(PAGES)):
        meta, body = read_page(name)
        body = (body.replace("{{product_count}}", count)
                    .replace("{{category_tiles}}", category_tiles(categories, products))
                    .replace("{{contact_section}}", contact_section("")))
        meta["description"] = meta["description"].replace("{{product_count}}", count)
        path = "" if name == "index.html" else name
        with open(os.path.join(SITE, name), "w", encoding="utf-8") as f:
            f.write(layout(meta, body, "", categories, path))
        built.append(name)

    out_dir = os.path.join(SITE, "product")
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir)
    for p in products:
        with open(os.path.join(out_dir, p["id"] + ".html"), "w", encoding="utf-8") as f:
            f.write(product_page(p, products, categories))

    with open(os.path.join(SITE, "404.html"), "w", encoding="utf-8") as f:
        f.write(not_found_page(products))

    urls = [SITE_URL, SITE_URL + "products.html", SITE_URL + "cases.html"] + \
           [SITE_URL + quote("product/" + p["id"] + ".html") for p in products]
    with open(os.path.join(SITE, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        f.writelines(f"  <url><loc>{esc(u)}</loc></url>\n" for u in urls)
        f.write("</urlset>\n")
    with open(os.path.join(SITE, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}sitemap.xml\n")

    print("頁面:", ", ".join(built))
    print(f"商品頁: {len(products)} 個 → product/")
    print("另外產生: 404.html, data/products-index.json, sitemap.xml, robots.txt")


if __name__ == "__main__":
    main()
