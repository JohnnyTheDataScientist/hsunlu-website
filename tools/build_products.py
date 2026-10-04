"""從 Shopify 匯出資料產生網站的商品資料與圖片。

    python website/tools/build_products.py

讀取 shopify-export/data/products.json（只取 ACTIVE 商品），輸出：
  website/data/products.json         商品清單（產品列表頁與詢價籃使用）
  website/img/products/<handle>/     每個商品的圖片（webp：01.webp... 與縮圖 thumb.webp）

圖片已存在就略過，重跑很快。商品的上架與分類以 Shopify 匯出為準，
之後若要增刪商品，改 products.json 的來源或在下面的 EXCLUDE 加 handle 即可。
"""

import html
import json
import os
import re
import sys

from PIL import Image

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
ROOT = os.path.dirname(SITE)
SRC_JSON = os.path.join(ROOT, "shopify-export", "data", "products.json")
SRC_COLLECTIONS = os.path.join(ROOT, "shopify-export", "data", "collections.json")
# 馴鹿 HSUNLU 自有品牌商品 = Shopify 上「馴鹿嚴選」系列裡有上架的商品
BRAND_COLLECTION = "own-brand"
SRC_IMG = os.path.join(ROOT, "shopify-export", "images", "products")
OUT_JSON = os.path.join(SITE, "data", "products.json")
OUT_IMG = os.path.join(SITE, "img", "products")

MAX_IMAGES = 6
DETAIL_PX = 900
THUMB_PX = 480

# 側欄分類：大類 → 對應的 Shopify 分類標籤（小類）
CATEGORIES = [
    ("杯瓶器皿", ["保溫杯／隨行杯", "陶瓷玻璃", "客製杯器與包裝", "保溫杯"]),
    ("包袋收納", ["包袋收納", "保溫袋"]),
    ("文具用品", ["文具用品"]),
    ("3C 科技", ["3C科技配件", "LED燈具", "電扇"]),
    ("廚房餐具", ["廚房鍋具／料理家電", "餐具／器皿"]),
    ("戶外休閒", ["戶外用品", "雨具", "防暑降溫", "露營野炊"]),
    ("居家生活", ["寢具家紡", "居家清潔", "服飾"]),
    ("健康美容", ["健康保健／按摩器材", "美容保養", "精油／香氛", "個人護理"]),
    ("食品伴手禮", ["醬料／食材", "水餃／麵食", "養生飲品"]),
]
TAG_TO_CAT = {tag: cat for cat, tags in CATEGORIES for tag in tags}

# 沒有分類標籤的商品，依名稱關鍵字歸類（依序比對，先中先用）
KEYWORD_CAT = [
    # 明確的詞先比對；「瓶」「包」這種單字很容易誤判（滾珠瓶、10 片裝一包），放在最後
    (r"一條根|精油|按摩|石墨烯|護膝|護腰|保健|乳液|面膜|體重計", "健康美容"),
    (r"洗碗|拖把|清潔|面紙|癒淨褲|枕|被|毯|靠墊|寢", "居家生活"),
    (r"鍋|砧板|刀具|料理|烤盤", "廚房餐具"),
    (r"杯|壺", "杯瓶器皿"),
    (r"筆|文具|迴紋針", "文具用品"),
    (r"充電|行動電源|耳機|喇叭|燈", "3C 科技"),
    (r"瓶", "杯瓶器皿"),
    (r"包|袋", "包袋收納"),
]
FALLBACK_CAT = "其他精選"

EXCLUDE = set()  # 不想放上網站的商品 handle


def clean_description(desc_html):
    """只保留安全的段落／清單／粗體標記，移除 Shopify 殘留的 meta、svg、樣式。"""
    d = desc_html or ""
    d = re.sub(r"<(meta|svg|script|style)\b[^>]*>.*?</\1>", "", d, flags=re.S | re.I)
    d = re.sub(r"<(meta|svg|use|img)\b[^>]*/?>", "", d, flags=re.I)
    d = re.sub(r"\s(style|class|id|data-[\w-]+)=\"[^\"]*\"", "", d)
    d = re.sub(r"</?(span|div|font)\b[^>]*>", "", d, flags=re.I)
    d = re.sub(r"<(/?)h[1-6]\b[^>]*>", r"<\1h4>", d, flags=re.I)
    d = re.sub(r"<a\b[^>]*>(.*?)</a>", r"\1", d, flags=re.S | re.I)
    d = drop_retail_lines(d)
    d = re.sub(r"<p>\s*(<br\s*/?>\s*)*</p>", "", d)
    d = re.sub(r"(<br\s*/?>\s*){2,}", "<br>", d)
    return d.strip()


# 網購用語與價格：官網只接受詢價，含這些字的整句移除
RETAIL = re.compile(
    r"下單|轉帳|匯款|付款|貨到|取貨|運費|免運|宅配|出貨|到貨|補貨|售完|購物車|結帳|"
    r"原價|售價|特價|優惠價|套組價|限定價|折扣|"
    r"\$\s?[\d,]+|NT\s?\$?\s?[\d,]+|[\d,]+\s*元"
)


def drop_retail_lines(d):
    """以 <br>、</p>、</li> 切成句，含網購用語或金額的句子整句拿掉。"""
    parts = re.split(r"(<br\s*/?>|</p>|</li>)", d)
    kept = []
    for i in range(0, len(parts), 2):
        seg = parts[i]
        sep = parts[i + 1] if i + 1 < len(parts) else ""
        text = re.sub(r"<[^>]+>", "", seg)
        if RETAIL.search(text):
            # 保留開頭的標籤（例如 <p>、<li>），只拿掉文字
            seg = "".join(re.findall(r"<[^/][^>]*>", seg))
            if sep == "<br>" or sep.startswith("<br"):
                sep = ""
        kept.append(seg + sep)
    d = "".join(kept)
    d = re.sub(r"<li>\s*</li>", "", d)
    return d


def plain_text(desc_html, limit=110):
    """商品頁上方的摘要：取第一句完整的介紹，跳過空行、「【商品特色】」標題和顏色／規格這類短句。"""
    segs = [html.unescape(re.sub(r"<[^>]+>", " ", s)).strip()
            for s in re.split(r"<br\s*/?>|</p>|</li>", desc_html or "")]
    segs = [re.sub(r"\s+", " ", s).lstrip("•・-· ") for s in segs]
    good = [s for s in segs if len(s) >= 15 and not s.startswith("【")
            and not re.match(r"(顏色|尺寸|規格|材質|容量|重量|產地|商品特色)", s)]
    t = good[0] if good else ""  # 找不到像樣的介紹句就不顯示摘要
    t = re.sub(r"\s+", " ", t).strip()
    return t[:limit] + ("…" if len(t) > limit else "")


def pick_category(p):
    subs = [t for t in p["tags"] if t in TAG_TO_CAT]
    if subs:
        return TAG_TO_CAT[subs[0]], subs[0]
    for pattern, cat in KEYWORD_CAT:
        if re.search(pattern, p["title"]):
            return cat, ""
    return FALLBACK_CAT, ""


def convert(src, dest, px):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    im = Image.open(src)
    im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.split()[3])
        im = bg
    im.thumbnail((px, px), Image.LANCZOS)
    im.save(dest, "WEBP", quality=80, method=5)


def main():
    products = json.load(open(SRC_JSON, encoding="utf-8"))
    collections = json.load(open(SRC_COLLECTIONS, encoding="utf-8"))
    brand_ids = {x["handle"] for c in collections if c["handle"] == BRAND_COLLECTION for x in c["products"]["nodes"]}
    out = []
    for p in products:
        if p["status"] != "ACTIVE" or p["handle"] in EXCLUDE:
            continue
        handle = p["handle"]
        src_dir = os.path.join(SRC_IMG, handle)
        files = sorted(f for f in os.listdir(src_dir)) if os.path.isdir(src_dir) else []
        files = [f for f in files if re.search(r"\.(jpe?g|png|webp|gif)$", f, re.I)][:MAX_IMAGES]
        if not files:
            print("  略過（沒有圖片）:", handle)
            continue
        dest_dir = os.path.join(OUT_IMG, handle)
        os.makedirs(dest_dir, exist_ok=True)
        images = []
        for i, f in enumerate(files, 1):
            name = f"{i:02d}.webp"
            convert(os.path.join(src_dir, f), os.path.join(dest_dir, name), DETAIL_PX)
            images.append(name)
        convert(os.path.join(src_dir, files[0]), os.path.join(dest_dir, "thumb.webp"), THUMB_PX)

        cat, sub = pick_category(p)
        options = [{"name": o["name"], "values": o["values"]} for o in p["options"]
                   if o["name"].lower() != "title" and o["values"] != ["Default Title"]]
        desc = clean_description(p["descriptionHtml"])
        out.append({
            "id": handle,
            "title": p["title"].strip(),
            "category": cat,
            "sub": sub,
            "images": images,
            "options": options,
            "summary": plain_text(desc),
            "description": desc,
            "brand": handle in brand_ids,
        })

    order = {c: i for i, (c, _) in enumerate(CATEGORIES)}
    out.sort(key=lambda x: (order.get(x["category"], 99), x["sub"], x["title"]))
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    cats = [{"name": c, "subs": [s for s in subs if any(x["sub"] == s for x in out)]} for c, subs in CATEGORIES]
    if any(x["category"] == FALLBACK_CAT for x in out):
        cats.append({"name": FALLBACK_CAT, "subs": []})
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"categories": cats, "products": out}, f, ensure_ascii=False, separators=(",", ":"))
    by_cat = {}
    for x in out:
        by_cat[x["category"]] = by_cat.get(x["category"], 0) + 1
    print(f"{len(out)} 個商品 →", os.path.relpath(OUT_JSON, ROOT), f"（馴鹿品牌 {sum(x['brand'] for x in out)} 個）")
    for c, n in by_cat.items():
        print(f"  {c}: {n}")


if __name__ == "__main__":
    main()
