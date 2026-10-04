// 網站上會變動的內容都集中在這個檔案。
// 新增合作夥伴或案例：照格式加一行，圖片放進對應的 img/ 資料夾即可。

window.SITE_CONTENT = {
  // 合作單位跑馬燈（img/partners/）
  // 企業與政府單位交錯排列，避免政府機關連續出現
  partners: [
    { name: '屈臣氏', logo: 'watsons.png' },
    { name: '台北市政府', logo: 'taipei-city-government.png' },
    { name: '國際扶輪 Rotary', logo: 'rotary.png' },
    { name: '新北市議會', logo: 'new-taipei-city-council.png' },
    { name: '台北市警察局', logo: 'taipei-police.png' },
    { name: '全家便利商店', logo: 'familymart.png' },
    { name: '新北市政府', logo: 'new-taipei-city-government.png' },
    { name: 'CoCo都可', logo: 'coco-tea.png' },
    { name: '台北市議會', logo: 'taipei-city-council.png' },
    { name: '新北市警察之友會', logo: 'ntpc-police-friends-assoc.png' },
    { name: '國際獅子會', logo: 'lions-club.png' },
    { name: '新北市警察局', logo: 'new-taipei-police.png' },
  ],

  // 合作案例（img/cases/），全部用同一種卡片呈現
  // 首頁只顯示有 featured 的案例（數字是排列順序），合作案例頁顯示全部
  // title 裡的「|」是不顯示的換行點，名稱很長時用來指定在哪裡斷行
  cases: [
    { title: '精品名片夾禮盒', client: '臺北市議會', category: '禮盒', img: 'taipei-city-council-gift-set.webp', featured: 2 },
    { title: '青花瓷文化紀念禮組', client: '臺北市議會', category: '禮盒', img: 'case-tpcc-porcelain-set.webp' },
    { title: '台灣意象領巾', client: '臺北市議會', category: '織品', img: 'case-tpcc-scarf.webp' },
    { title: '台灣意象領帶', client: '臺北市議會', category: '織品', img: 'case-tpcc-tie.webp' },
    { title: '警察熊制服玩偶', category: '公仔玩偶', img: 'police-bear-uniform.webp', featured: 4 },
    { title: '「輔弼警政」水晶紀念牌', category: '獎牌獎座', img: 'police-advisor-crystal-award.webp' },
    { title: '扶輪 D3350 紀念馬克杯', category: '杯瓶', img: 'rotary-d3350-mug.webp', featured: 6 },
    { title: '「功在大橋」水晶感謝牌', category: '獎牌獎座', img: 'dachiao-crystal-award.webp' },
    { title: '預防詐騙宣導卡套', category: '宣導品', img: 'anti-fraud-cardholder.webp' },
    { title: 'BNI 雙金質獎章', category: '獎牌獎座', img: 'bni-gold-plaque.webp', featured: 5 },
    { title: '國立臺灣|戲曲學院 摺疊扇', category: '宣導品', img: 'opera-fan-pouch.webp' },
    { title: '刑警熊玩偶', category: '公仔玩偶', img: 'detective-bear.webp' },
    { title: '扶輪基金會|百年紀念|馬克杯', category: '杯瓶', img: 'rotary-centennial-mug.webp' },
    { title: '臺中市|性別平等|國際論壇 雷雕木牌', category: '獎牌獎座', img: 'taichung-forum-plaque.webp' },
    { title: '台北世大運 熊讚公仔', category: '公仔玩偶', img: 'taipei-2017-bear-figure.webp' },
    { title: 'APHaH 2026 帆布袋', category: '袋類', img: 'aphah-2026-tote.webp' },
    { title: '老天祿 不織布提袋', category: '袋類', img: 'laotianlu-tote.webp' },
    { title: '鑫岳石材 品牌提袋', category: '袋類', img: 'stoneking-tote.webp', featured: 3 },
    { title: 'NCC 國家通訊|傳播委員會 水晶紀念牌', category: '獎牌獎座', img: 'ncc-crystal-plaque.webp' },
    { title: '貓咪花朵保溫瓶', category: '杯瓶', img: 'cat-flower-thermos.webp' },
    { title: '造型矽膠杯蓋', category: '生活用品', img: 'silicone-cup-lids.webp' },
    { title: 'Google Pixel 原子筆', category: '文具', img: 'google-pixel-pen.webp', featured: 1 },
    { title: '招財造型廣告筆', category: '文具', img: 'lucky-mascot-pen.webp' },
    { title: '雲朵造型|壓克力|發光應援牌', category: '宣導品', img: 'cloud-acrylic-sign.webp' },
    { title: '稅務代理人節 水晶獎牌', category: '獎牌獎座', img: 'tax-agent-crystal-award.webp' },
    { title: '琥珀龍水晶賀牌', category: '獎牌獎座', img: 'amber-dragon-plaque.webp' },
  ],
};
