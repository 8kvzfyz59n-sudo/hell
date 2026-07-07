# 男裝原型功能實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在打版網站新增文化式男子上衣原型(身片+袖,v11)與男裝西裝褲(v12)兩個分頁,首頁加第二座男性人台,並移除網頁上的資料來源區塊。

**Architecture:** 仿 pants.js/pleat.js 模式新增獨立模組 men.js、menpants.js(純計算+SVG 字串,不碰 DOM,在 app.js 之前載入);app.js 只加接線層;PDF 沿用現有自製產生器。

**Tech Stack:** 純前端(vanilla JS + SVG + 自製 PDF)。無建置工具、無外部函式庫(首頁 Three.js 走 CDN)。

## Global Constraints(每個任務都適用)

- 座標系:cm 為單位、x 向右、y 向下;SVG viewBox 直接用 cm,width/height 帶 cm(實寸)。
- SVG path **只能用 M + C 指令**:直線用 `lineC()`、圓弧用 `arcC()`;絕不能用 L/A/Q。
- **會進 PDF 的 SVG 圖面文字只能用 ASCII**(Helvetica);中文說明一律放 tool.html 頁面文字。
- 下載一律用原始 SVG 字串(`cur.xxxSvg`),不要從 DOM outerHTML 取。
- 每次改版:script 的 `?v=N` 遞增,並同步改 tool.html 的 `<span id="ver">` 標記(本計畫 v10→v11→v12)。
- 模組載入順序:pants.js → pleat.js → men.js → menpants.js → app.js。
- **本資料夾不是 git repo,沒有 commit 步驟**;每個任務以「預覽伺服器驗證通過」為完成標準。
- **本機沒有 Node**;所有 JS 驗證用 Claude Preview 工具在 http://localhost:4173/tool.html 頁面內 eval(preview_start 設定已在 `.claude/launch.json`,name: `site`)。驗證前先重新整理頁面(preview_eval `location.reload()` 後等 1 秒)。
- 教學區塊文字風格:條列 `<ol><li>`,放在 `<details><summary>` 摺疊內,參考現有分頁。

## 檔案結構

| 檔案 | 動作 | 職責 |
|---|---|---|
| tool.html | 修改 | 移除來源區塊;加 2 分頁(輸入欄/預覽/下載/教學);script 標籤 |
| men.js | 新增 | `draftMenBodice`/`draftMenSleeve`/`menBodiceSVG`(袖 SVG 重用 app.js 的 `sleeveSVG`) |
| menpants.js | 新增 | `draftMenPants`/`menPantsSVG` |
| app.js | 修改 | draw() 接線、cur 擴充、下載按鈕、hashMap、計算結果表 |
| index.html | 修改 | 第二座男性人台、hover 判定、CTA 文案 |
| README.md / STATUS.md / HANDOFF.md | 修改 | 收尾文件(Task 7) |

---

### Task 1: 移除 tool.html 資料來源區塊

**Files:**
- Modify: `tool.html:318-331`

**Interfaces:** 無(純刪除,不影響其他任務)。

- [ ] **Step 1: 刪除「製圖法來源」整個 section**

刪除 tool.html 中這整段(318~331 行,`<section class="panel refs">` 開頭到 `</section>` 結尾):

```html
  <section class="panel refs">
    <h2>製圖法來源</h2>
    <ul>
      ...(全部 li)...
    </ul>
    <p class="note">弧線之導引點依教材標準值繪製;實際縫製前建議先做胚布(トワル)確認並補正。</p>
  </section>
```

注意:`<p class="note">胚布確認…</p>` 這行是製作建議不是來源,搬到 `<footer>` 內既有 `<p>` 的句尾(加「建議先做胚布(トワル)確認並補正。」),不要一起刪丟。

- [ ] **Step 2: 驗證**

用 Grep 確認 tool.html 已無 `maisondeas`、`kknews`、`bunka-koubai`、`製圖法來源` 字串;瀏覽器重新整理 http://localhost:4173/tool.html 確認頁尾無來源區塊、版面正常。

---

### Task 2: 建立 men.js(男子身片+袖計算與身片 SVG)

**Files:**
- Create: `men.js`

**Interfaces:**
- Consumes(呼叫時期才解析,app.js 稍後載入即可):`DEG`, `crPathD`, `crLen`, `line`, `path`, `text`, `dot`, `S`, `svgOpen`, `lerp`(皆為 app.js 全域)。
- Produces:
  - `draftMenBodice(C, W, backLen)` → 物件含 `{ C, W, backLen, bw, blY, backW, chestW, wlY, neckW, fNeckD, bNeckW, shDart, totalDart, dartW, darts, A, Cp, Dx, sideX, E, Ix, SNPf, FNP, SPf, SNPb, SPb, sd1, sd2, sdApex, gdF, gdB, UA, gY, ahBackPts, ahFrontPts, ahF, ahB }`
  - `draftMenSleeve(bod, sleeveLen)` → 與 app.js `draftSleeve` 回傳同形狀:`{ capH, wf, wb, slantF, slantB, top, fEnd, bEnd, capPts, capLen, ease, sleeveLen, elY }`(**無 `star` 欄位**,男子後斜線固定 +1)→ 因此袖 SVG 直接用現有 `sleeveSVG(msl)`,不另寫。
  - `menBodiceSVG(b)` → SVG 字串。

- [ ] **Step 1: 公式查證(寫碼前)**

WebFetch `https://ipatterning.com/menprototype/`,把回覆的公式跟下方程式碼中的常數逐條比對(衣寬 C/2+6.7、袖窿深 C/6+8.5、背幅 C/6+5.8、胸幅 C/6+2.9、領口 C/16+1.9 系列、肩斜 22°/21°、肩褶 C/32、總腰省 (C/2+6.7)−(W/2+4)、比例 16/16/36/24/8、袖山 5/6、後斜線 BAH+1、肘線 袖長/2+2.5)。若有不一致,以來源為準修改 Step 2 程式碼中對應常數後再寫入。查證不到的細節(腰省確切位置、前身上端高度)維持程式碼中的假設,並在 Task 7 的 README 註記為「本站近似」。

- [ ] **Step 2: 寫入 men.js 完整內容**

```js
/* =========================================================
 * 文化式成人男子原型(胸度式)身片+袖
 * 單位 cm,x 向右、y 向下,後中心頂點 A=(0,0)
 * 輸入:胸圍 C、腰圍 W、背長、袖長
 * 男子原型無胸省;後肩褶 C/32;腰省 a~d + 後中心縮份 e
 * 註:腰省位置與前身上端為本站近似(公開資料不足),見 README
 * ========================================================= */

function draftMenBodice(C, W, backLen) {
  const bw     = C / 2 + 6.7;          // 衣寬
  const blY    = C / 6 + 8.5;          // A~BL(袖窿深)
  const backW  = C / 6 + 5.8;          // 背幅
  const chestW = C / 6 + 2.9;          // 胸幅
  const wlY    = backLen + 0.5;        // 後中心長 = 背長+0.5
  const neckW  = C / 16 + 1.9;         // 前領寬
  const fNeckD = neckW + 0.5;          // 前領深
  const bNeckW = neckW + 0.3;          // 後領寬
  const bNeckD = bNeckW / 3 - 0.3;     // 後領深
  const shDart = C / 32;               // 後肩褶

  const A  = [0, 0];
  const Cp = [backW, blY];             // 背幅×BL
  const Dx = bw - chestW;              // 胸幅線 x
  const sideX = (backW + Dx) / 2;      // 脇線(背幅、胸幅中點)
  const E  = [0, blY / 2];             // 後中心 A~BL 中點
  const Ix = backW / 2 + 0.5;          // 肩褶導引(E~背幅線中點右移0.5)

  // 前領口・前肩(前身上端與 A 同水平線;男子原型無前身上抬)
  const frontTopY = 0;
  const SNPf = [bw - neckW, frontTopY];
  const FNP  = [bw, frontTopY + fNeckD];
  const a22  = DEG(22);
  const shLenF = (chestW - neckW) / Math.cos(a22) + 1.8;
  const SPf  = [SNPf[0] - shLenF * Math.cos(a22), SNPf[1] + shLenF * Math.sin(a22)];

  // 後領口・後肩(21°),後肩線長=前肩+褶份
  const SNPb = [bNeckW, -bNeckD];
  const a21  = DEG(21);
  const shLenB = shLenF + shDart;
  const SPb  = [SNPb[0] + shLenB * Math.cos(a21), SNPb[1] + shLenB * Math.sin(a21)];

  // 後肩褶:I 直上與肩線交點起,褶寬 C/32,褶尖在 I 上方 1.5
  const tI  = (Ix - SNPb[0]) / Math.cos(a21);
  const sd1 = [SNPb[0] + tI * Math.cos(a21), SNPb[1] + tI * Math.sin(a21)];
  const sd2 = [sd1[0] + shDart * Math.cos(a21), sd1[1] + shDart * Math.sin(a21)];
  const sdApex = [Ix, blY / 2 - 1.5];

  // 袖窿導引點(45°)與曲線
  const tri = (Dx - sideX) / 3;
  const s2 = Math.SQRT1_2;
  const gdF = [Dx - (tri + 0.5) * s2, blY - (tri + 0.5) * s2];
  const gdB = [backW + (tri + 0.8) * s2, blY - (tri + 0.8) * s2];
  const UA  = [sideX, blY];
  const gY  = blY * 3 / 4;             // 幅線中段導引高度
  const ahBackPts  = [SPb, [backW, (SPb[1] + gY) / 2 + 1], [backW, gY], gdB, UA];
  const ahFrontPts = [SPf, [Dx, (SPf[1] + gY) / 2 + 1], [Dx, gY], gdF, UA];
  const ahF = crLen(ahFrontPts);
  const ahB = crLen(ahBackPts);

  // 腰省:總量=(C/2+6.7)−(W/2+4),a16/b16/c36/d24/e8(%)
  // a:前(胸幅線內0.8) b:脇 c:背幅線外1 d:肩褶下(I左1) e:後中心縮份
  const totalDart = bw - (W / 2 + 4);
  const pct = { a: .16, b: .16, c: .36, d: .24, e: .08 };
  const dartW = {};
  for (const k in pct) dartW[k] = totalDart * pct[k];
  const darts = [
    { name: 'a', cx: Dx - 0.8,  apexY: blY + 2.5, w: dartW.a },
    { name: 'b', cx: sideX,     apexY: blY,       w: dartW.b },
    { name: 'c', cx: backW + 1, apexY: blY - 2.5, w: dartW.c },
    { name: 'd', cx: Ix - 1,    apexY: blY - 2.5, w: dartW.d }
  ];
  // e:後中心縮份(畫在輪廓,不進 darts)

  return { C, W, backLen,
    bw, blY, backW, chestW, wlY, neckW, fNeckD, bNeckW, shDart,
    totalDart, dartW, darts,
    A, Cp, Dx, sideX, E, Ix,
    SNPf, FNP, SPf, SNPb, SPb, sd1, sd2, sdApex,
    gdF, gdB, UA, gY, ahBackPts, ahFrontPts, ahF, ahB };
}

/* 袖:結構同女子袖,後斜線固定 BAH+1(無★加碼) */
function draftMenSleeve(bod, sleeveLen) {
  const { blY, SPf, SPb, ahF, ahB } = bod;
  const capH = (blY - (SPf[1] + SPb[1]) / 2) * 5 / 6;
  const slantF = ahF, slantB = ahB + 1;
  const wf = Math.sqrt(Math.max(slantF * slantF - capH * capH, 1));
  const wb = Math.sqrt(Math.max(slantB * slantB - capH * capH, 1));
  const top = [0, 0];
  const fEnd = [-wf, capH], bEnd = [wb, capH];
  function off(a, b, t, d) {
    const p = lerp(a, b, t);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    let nx = uy, ny = -ux;
    if (ny > 0) { nx = -nx; ny = -ny; }
    return [p[0] + nx * d, p[1] + ny * d];
  }
  const capPts = [
    fEnd,
    off(top, fEnd, 0.8, -1.3),
    off(top, fEnd, 0.55, 0),
    off(top, fEnd, 0.25, 1.8),
    top,
    off(top, bEnd, 0.25, 1.9),
    off(top, bEnd, 0.6, 0),
    off(top, bEnd, 0.85, -0.7),
    bEnd
  ];
  const capLen = crLen(capPts);
  const ease = capLen - (ahF + ahB);
  const elY = sleeveLen / 2 + 2.5;
  return { capH, wf, wb, slantF, slantB, top, fEnd, bEnd, capPts, capLen, ease, sleeveLen, elY };
}

function menBodiceSVG(b) {
  const m = 2.5;
  const minX = -m, minY = Math.min(b.SNPb[1], b.SNPf[1]) - m;
  const w = b.bw + 2 * m, h = b.wlY - minY + m;
  let s = svgOpen(minX, minY, w, h);

  // 導引線
  s += line([0, 0], [0, b.blY], S.guide);                            // 後中心上段
  s += line([b.bw, 0], [b.bw, b.blY], S.guide);                      // 前中心上段
  s += line([0, b.blY], [b.bw, b.blY], S.guide);                     // BL
  s += line([0, b.wlY], [b.bw, b.wlY], S.guide);                     // WL
  s += line([b.backW, b.blY / 2], [b.backW, b.blY], S.guide);        // 背幅線
  s += line([b.Dx, 0], [b.Dx, b.blY], S.guide);                      // 胸幅線
  s += line([b.sideX, b.blY], [b.sideX, b.wlY], S.guide);            // 脇線
  s += line([0, b.blY / 2], [b.backW, b.blY / 2], S.guide);          // E 水平線
  s += line([0, 0], [b.bw, 0], S.guide);                             // 上平線

  // 後片輪廓
  const eW = b.dartW.e;
  s += path(crPathD([b.SNPb, [b.bNeckW * 0.45, -0.05], b.A]), S.outline); // 後領口
  s += line(b.A, [0, b.blY], S.outline);                                  // 後中心
  s += line([0, b.blY], [eW, b.wlY], S.outline);                          // 後中心縮份 e
  s += line([eW, b.wlY], [b.sideX, b.wlY], S.outline);                    // 後腰線
  s += line(b.SNPb, b.SPb, S.outline);                                    // 後肩
  s += path(crPathD(b.ahBackPts), S.outline);                             // 後袖窿

  // 前片輪廓
  s += path(crPathD([b.SNPf, [b.SNPf[0] + b.neckW * 0.25, b.SNPf[1] + b.fNeckD * 0.55], b.FNP]), S.outline); // 前領口
  s += line(b.FNP, [b.bw, b.wlY], S.outline);                             // 前中心
  s += line([b.bw, b.wlY], [b.sideX, b.wlY], S.outline);                  // 前腰線
  s += line(b.SNPf, b.SPf, S.outline);                                    // 前肩
  s += path(crPathD(b.ahFrontPts), S.outline);                            // 前袖窿
  s += line([b.sideX, b.blY], [b.sideX, b.wlY], S.outline);               // 脇線

  // 後肩褶
  s += line(b.sd1, b.sdApex, S.dart);
  s += line(b.sd2, b.sdApex, S.dart);
  // 腰省 a~d
  for (const d of b.darts) {
    const apex = [d.cx, d.apexY];
    s += line(apex, [d.cx - d.w / 2, b.wlY], S.dart);
    s += line(apex, [d.cx + d.w / 2, b.wlY], S.dart);
    s += text([d.cx, b.wlY + 0.9], d.name, S.small, 'middle');
  }
  s += text([eW / 2, b.wlY + 0.9], 'e', S.small, 'middle');

  // 記號(ASCII only)
  s += dot(b.SPf) + text([b.SPf[0] - 1.4, b.SPf[1] - 0.3], 'SP');
  s += dot(b.SPb) + text([b.SPb[0] + 0.3, b.SPb[1] - 0.3], 'SP');
  s += dot(b.E) + text([0.25, b.blY / 2 - 0.3], 'E');
  s += text([-1.9, 0.2], 'A') + text([-1.9, b.blY + 0.2], 'BL') + text([-1.9, b.wlY + 0.2], 'WL');
  s += text([b.bw + 0.4, b.blY + 0.2], 'BL') + text([b.bw + 0.4, b.wlY + 0.2], 'WL');
  s += text([b.backW / 2, b.blY + 2.2], 'BACK', S.small, 'middle');
  s += text([b.bw - b.chestW / 2, b.blY + 2.2], 'FRONT', S.small, 'middle');
  s += `</svg>`;
  return s;
}

/* Node 測試用 */
if (typeof module !== 'undefined')
  module.exports = { draftMenBodice, draftMenSleeve, menBodiceSVG };
```

- [ ] **Step 3: 驗證(檔案層)**

用 Read 工具讀回 men.js 確認內容完整(HANDOFF 記載過 Write 後 bash 讀取 stale 的坑——一律用 Read 核對)。此時尚未接進頁面,瀏覽器行為不變;數值驗證在 Task 3 Step 4 一併做。

---

### Task 3: tool.html + app.js 接線男裝上衣分頁(v11)

**Files:**
- Modify: `tool.html`(輸入欄、分頁鈕、分頁內容、script 標籤、ver 標記)
- Modify: `app.js`(draw()、renderValues、下載、hashMap)

**Interfaces:**
- Consumes: `draftMenBodice(C,W,backLen)`、`draftMenSleeve(bod,sleeveLen)`、`menBodiceSVG(b)`(Task 2);`sleeveSVG(sl)`(app.js 既有)。
- Produces: DOM id — 輸入 `mC` `mW` `mBackLen` `mSleeveLen`;容器 `menBodiceBox` `menSleeveBox` `valuesMenTop`;按鈕 `btnSvgMenBodice` `btnPdfMenBodice` `btnSvgMenSleeve` `btnPdfMenSleeve`;分頁 `tabMenTop`;錨點 `#mtop`。`cur` 增加 `mb, msl, menBodSvg, menSlvSvg`。

- [ ] **Step 1: tool.html 加輸入欄**

在 `<div class="field" data-tabs="tabPleat">…布幅寬…</div>` 之後、`<button id="btnDraw">` 之前插入:

```html
    <div class="field" data-tabs="tabMenTop">
      <label for="mC">男・胸圍 C</label>
      <input type="number" id="mC" value="92" min="76" max="120" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenTop">
      <label for="mW">男・腰圍 W</label>
      <input type="number" id="mW" value="74" min="56" max="110" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenTop">
      <label for="mBackLen">男・背長</label>
      <input type="number" id="mBackLen" value="45" min="38" max="52" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenTop">
      <label for="mSleeveLen">男・袖長</label>
      <input type="number" id="mSleeveLen" value="60" min="40" max="70" step="0.5">
    </div>
```

- [ ] **Step 2: 分頁鈕與分頁內容**

`<nav class="tabs">` 內 tabPleat 按鈕後加:

```html
    <button class="tabbtn" data-tab="tabMenTop">6|男裝上衣</button>
```

`</main>` 前(tabPleat 的 `</div>` 之後)加分頁內容:

```html
  <div class="tab" id="tabMenTop">
    <section class="panel">
      <h2>男裝上衣原型(身片)</h2>
      <div id="menBodiceBox" class="svgbox"></div>
      <div class="dl-group">
        <button id="btnSvgMenBodice" disabled>下載 SVG</button>
        <button id="btnPdfMenBodice" disabled>下載 PDF(1:1)</button>
      </div>
    </section>

    <section class="panel">
      <h2>男裝袖原型</h2>
      <div id="menSleeveBox" class="svgbox"></div>
      <div class="dl-group">
        <button id="btnSvgMenSleeve" disabled>下載 SVG</button>
        <button id="btnPdfMenSleeve" disabled>下載 PDF(1:1)</button>
      </div>
    </section>

    <section class="panel">
      <h2>計算結果</h2>
      <div id="valuesMenTop" class="values"></div>
    </section>

    <section class="panel">
      <h2>教學</h2>
      <details>
        <summary>男裝上衣原型:製圖邏輯</summary>
        <ol>
          <li>男子原型採「胸度式」:大部分尺寸由胸圍 C 與背長兩個數字決定;後中心長=背長+0.5。</li>
          <li>基礎長方形:寬=衣寬(C/2+6.7);從上端 A 往下 C/6+8.5 畫胸圍線 BL。</li>
          <li>BL 上取背幅(C/6+5.8)與胸幅(C/6+2.9),兩幅線中點垂直向下為脇線。</li>
          <li>領口:前領寬=C/16+1.9、前領深=領寬+0.5、後領寬=前領寬+0.3;肩斜前 22°、後 21°。</li>
          <li>男子原型無胸省;後肩褶=C/32,指向背幅中段的 I 點。</li>
          <li>總腰省=(C/2+6.7)−(W/2+4),按 a16%/b16%/c36%/d24%/e8% 分配(e 為後中心縮份)。</li>
          <li>製作前先以胚布試穿,依體型補正後再作為打版母型。</li>
        </ol>
      </details>
      <details>
        <summary>男裝袖原型:製圖邏輯</summary>
        <ol>
          <li>袖山高=(前後肩點平均高度到 BL 距離)×5/6。</li>
          <li>前袖斜線=前AH、後袖斜線=後AH+1,由此定出袖幅;肘線=袖長/2+2.5。</li>
          <li>袖山縮縫份(いせ)縫製時用兩道疏縫抽縮、以熨斗歸攏。</li>
        </ol>
      </details>
    </section>
  </div>
```

- [ ] **Step 3: script 標籤與版號**

tool.html 底部 script 區改為(men.js 在 app.js 前;全部 v11):

```html
<script src="pants.js?v=11"></script>
<script src="pleat.js?v=11"></script>
<script src="men.js?v=11"></script>
<script src="app.js?v=11"></script>
```

`<span id="ver">v10</span>` 改 `<span id="ver">v11</span>`。
`<button id="btnPdf" disabled>下載全部 PDF(4頁,1:1)</button>` 文字改 `下載全部 PDF(1:1)`(頁數已非 4,不再寫死)。

- [ ] **Step 4: app.js 接線**

(a) `draw()` 內,`const pl = draftPleatSkirt(...)` 之後加:

```js
    const mC = +$('mC').value, mW = +$('mW').value,
          mBL = +$('mBackLen').value, mSL = +$('mSleeveLen').value;
    if (!(mC >= 76 && mC <= 120) || !(mW >= 56 && mW <= 110) || !(mBL >= 38 && mBL <= 52)) {
      msg.textContent = '請確認男裝輸入範圍:C 76–120、W 56–110、背長 38–52 cm。';
      return;
    }
    const mb = draftMenBodice(mC, mW, mBL);
    const msl = draftMenSleeve(mb, mSL);
```

(b) 同函式中 SVG 產生與 cur 改為:

```js
    const bodSvg = bodiceSVG(b), slvSvg = sleeveSVG(sl),
          tgtSvg = tightSkirtSVG(t), sktSvg = skirtSVG(sk),
          pntSvg = pantsSVG(pt), plSvg = pleatSVG(pl),
          menBodSvg = menBodiceSVG(mb), menSlvSvg = sleeveSVG(msl);
    cur = { b, sl, t, sk, pt, pl, mb, msl,
            bodSvg, slvSvg, tgtSvg, sktSvg, pntSvg, plSvg, menBodSvg, menSlvSvg };
```

並加容器塞入與按鈕啟用(塞入區加兩行、啟用清單加四個 id):

```js
    $('menBodiceBox').innerHTML = menBodSvg;
    $('menSleeveBox').innerHTML = menSlvSvg;
```

啟用清單改為既有陣列尾端追加 `'btnSvgMenBodice', 'btnPdfMenBodice', 'btnSvgMenSleeve', 'btnPdfMenSleeve'`。

(c) `renderValues(...)` 內尾端呼叫前(或 renderValues0 之後)加 `renderValuesMenTop(mb, msl)`——實作上最簡單:`draw()` 內 `renderValuesPleat(pl);` 之後直接呼叫 `renderValuesMenTop(mb, msl);`,並新增函式:

```js
  function renderValuesMenTop(b, sl) {
    $('valuesMenTop').innerHTML = rowsTable([
      ['衣寬 C/2+6.7', b.bw], ['A~BL C/6+8.5', b.blY],
      ['背幅 C/6+5.8', b.backW], ['胸幅 C/6+2.9', b.chestW],
      ['後中心長 背長+0.5', b.wlY],
      ['前領寬 C/16+1.9', b.neckW], ['前領深 領寬+0.5', b.fNeckD],
      ['後領寬 前領寬+0.3', b.bNeckW],
      ['後肩褶 C/32', b.shDart],
      ['總腰省 (C/2+6.7)-(W/2+4)', b.totalDart],
      ['腰省 a(16%)', b.dartW.a], ['腰省 b(16%)', b.dartW.b],
      ['腰省 c(36%)', b.dartW.c], ['腰省 d(24%)', b.dartW.d], ['腰省 e(8%)', b.dartW.e],
      ['前AH(實測)', b.ahF], ['後AH(實測)', b.ahB],
      ['袖山高 (SP平均高~BL)×5/6', sl.capH],
      ['前袖斜線 前AH', sl.slantF], ['後袖斜線 後AH+1', sl.slantB],
      ['袖幅', sl.wf + sl.wb], ['袖山縮縫份(いせ)', sl.ease]
    ]);
  }
```

(d) 下載按鈕(既有綁定區之後加):

```js
  $('btnSvgMenBodice').addEventListener('click', () => dlSVG(cur.menBodSvg, `men_bodice_C${cur.mb.C}.svg`));
  $('btnPdfMenBodice').addEventListener('click', () => dlOnePdf(cur.menBodSvg, `men_bodice_C${cur.mb.C}.pdf`));
  $('btnSvgMenSleeve').addEventListener('click', () => dlSVG(cur.menSlvSvg, `men_sleeve_C${cur.mb.C}.svg`));
  $('btnPdfMenSleeve').addEventListener('click', () => dlOnePdf(cur.menSlvSvg, `men_sleeve_C${cur.mb.C}.pdf`));
```

(e) `dlPDF()` 的 pages 陣列改為:

```js
    const pages = [cur.bodSvg, cur.slvSvg, cur.tgtSvg, cur.sktSvg, cur.pntSvg, cur.plSvg,
                   cur.menBodSvg, cur.menSlvSvg].map(svgToPdfPage);
```

(f) hashMap 加 `'#mtop': 'tabMenTop'`:

```js
  const hashMap = { '#top': 'tabTop', '#tight': 'tabTight', '#circle': 'tabCircle',
                    '#pants': 'tabPants', '#pleat': 'tabPleat', '#mtop': 'tabMenTop' };
```

(g) app.js 尾端 `module.exports` 不用加 men 函式(men.js 自己有 exports)。

- [ ] **Step 5: 驗證(數值+畫面+PDF)**

重新整理 http://localhost:4173/tool.html 後:

1. preview_console_logs level=error → 應無錯誤。
2. preview_eval 逐項核對(C=92,W=74,背長45):

```js
(() => { const b = draftMenBodice(92, 74, 45);
  return { bw: b.bw, blY: +b.blY.toFixed(2), backW: +b.backW.toFixed(2),
           chestW: +b.chestW.toFixed(2), neckW: +b.neckW.toFixed(3),
           totalDart: b.totalDart, wlY: b.wlY, ahOK: b.ahF > 20 && b.ahB > 20 }; })()
```

預期:`bw=52.7`、`blY=23.83`、`backW=21.13`、`chestW=18.23`、`neckW=7.65`、`totalDart=7.7`、`wlY=45.5`、`ahOK=true`。

3. preview_eval `document.querySelector('#menBodiceBox svg') !== null && document.querySelector('#menSleeveBox svg') !== null` → true。
4. preview_eval 檢查 SVG 內無中文與非法指令:

```js
(() => { const s = document.getElementById('menBodiceBox').innerHTML;
  return { ascii: !/[^\x00-\x7F]/.test(s.replace(/<[^>]+>/g, m => m)), noLAQ: !/ d="[^"]*[LAQ]/.test(s) }; })()
```

預期兩者皆 true(若 ascii false,找出非 ASCII 標籤改掉)。

5. preview_eval `buildPdf([svgToPdfPage(cur.menBodSvg), svgToPdfPage(cur.menSlvSvg)]).slice(0,8)` → `"%PDF-1.4"`。
6. preview_click 切到「6|男裝上衣」分頁,preview_screenshot 目視:輪廓完整、省道紅線、標籤不重疊、風格與女裝一致。
7. preview_eval `location.hash='#mtop'` 後 snapshot 確認分頁自動切換。

---

### Task 4: 建立 menpants.js(男裝西裝褲)

**Files:**
- Create: `menpants.js`

**Interfaces:**
- Consumes: 同 men.js(app.js 全域工具)。
- Produces:
  - `draftMenPants(W, H, pantsLen, riseIn, cuffIn)` — `riseIn`/`cuffIn` 傳 0 表自動。回傳 `{ W, H, pantsLen, We, He, rise, cuff, fw, bwp, cf, cb, hipY, KLy, creaseF, creaseB, hwF, hwB, kwF, kwB, pleatW, dartB2, sideInF, sideInB, ctrInB, backRise, dropB, flyLen }`
  - `menPantsSVG(p)` → SVG 字串(前片+後片並排)。

- [ ] **Step 1: 公式定案(待定值收斂)**

依 spec「待定值」決議並寫死於程式:股上自動式=褲長/10+18;后翘=2.5;落裆=1;褲口預設=He/5+2(He=H+10);腰鬆份+2、臀鬆份+10;前腰=We/4(脇收2+單褶吃剩餘);後腰=We/4(後中心斜收2.5+脇收2+省2支)。若 WebSearch 交叉查證(至少再看一個西裝褲製圖來源)與此明顯衝突,以來源修正常數。

- [ ] **Step 2: 寫入 menpants.js 完整內容**

```js
/* =========================================================
 * 男裝西裝褲(直筒)製圖
 * 輸入:淨腰圍 W、淨臀圍 H、褲長;股上/褲口可自動
 * 成品鬆份:腰+2、臀+10
 * 股上自動=褲長/10+18;落裆1、后翘2.5;中裆=(褲長-股上)×0.4
 * 前片=He/4-1(單褶+脇收2)、後片=He/4+1(省2支+脇收2+後中心收2.5)
 * 小裆宽=He/20-1、後裆宽=He/10;褲口預設=He/5+2
 * ========================================================= */

function draftMenPants(W, H, pantsLen, riseIn, cuffIn) {
  const We = W + 2, He = H + 10;                 // 成品腰/臀
  const rise = riseIn > 0 ? riseIn : pantsLen / 10 + 18;
  const cuff = cuffIn > 0 ? cuffIn : He / 5 + 2; // 褲口(全寬)
  const fw = He / 4 - 1;                         // 前片臀圍寬
  const bwp = He / 4 + 1;                        // 後片臀圍寬
  const cf = He / 20 - 1;                        // 小裆宽
  const cb = He / 10;                            // 後裆宽
  const hipY = rise * 2 / 3;                     // HL
  const dropB = 1;                               // 落裆
  const backRise = 2.5;                          // 后翘
  const creaseF = (fw + cf) / 2;                 // 前燙跡線(自脇)
  const creaseB = (bwp + cb) / 2;                // 後燙跡線
  const KLy = rise + (pantsLen - rise) * 0.4;    // 中裆(膝線)
  const hwF = cuff / 2 - 1;                      // 前褲口半寬
  const hwB = cuff / 2 + 1;                      // 後褲口半寬
  const kwF = hwF + 1;                           // 前中裆半寬
  const kwB = hwB + 1;                           // 後中裆半寬
  const sideInF = 2, sideInB = 2, ctrInB = 2.5;  // 腰口收量
  const pleatW = Math.max(fw - sideInF - We / 4, 0);   // 前單褶寬
  const dartB2 = Math.max(bwp - sideInB - ctrInB - We / 4, 0); // 後省總量(2支)
  const flyLen = hipY + 3;                       // 前開門襟長
  return { W, H, pantsLen, We, He, rise, cuff, fw, bwp, cf, cb, hipY, KLy,
           creaseF, creaseB, hwF, hwB, kwF, kwB,
           pleatW, dartB2, sideInF, sideInB, ctrInB, backRise, dropB, flyLen };
}

function menPantsSVG(p) {
  const m = 2.5, gap = 6;
  const ox = p.fw + p.cf + gap;              // 後片水平偏移
  const totalW = ox + p.bwp + p.cb;
  const minX = -m, minY = -m - p.backRise - 1.5;
  const w = totalW + 2 * m, h = p.pantsLen + m + 1.5 - minY;
  let s = svgOpen(minX, minY, w, h);
  const yH = p.hipY, yR = p.rise, yK = p.KLy, yL = p.pantsLen;

  // ---- 前片(左)----
  {
    const o = 0, tip = [p.fw + p.cf, yR];
    const crX = o + p.creaseF;
    const sTop = [o + p.sideInF, 0];
    const sideKL = crX - p.kwF, inKL = crX + p.kwF;
    const sideHem = crX - p.hwF, inHem = crX + p.hwF;
    // 導引線
    s += line([o, 0], [o + p.fw, 0], S.guide);                 // WL
    s += line([o, yH], [o + p.fw, yH], S.guide);               // HL
    s += line([o, yR], [tip[0], yR], S.guide);                 // 股線
    s += line([sideKL, yK], [inKL, yK], S.guide);              // KL
    s += line([crX, yR - 3], [crX, yL - 2], S.guide);          // 燙跡線
    // 脇線:腰→HL→股線→KL→褲口
    s += path(crPathD([sTop, [o + 0.5, yH * 0.55], [o, yH], [o, yR]]), S.outline);
    s += path(crPathD([[o, yR], [(o + sideKL) / 2 + 0.3, (yR + yK) / 2], [sideKL, yK]]), S.outline);
    s += line([sideKL, yK], [sideHem, yL], S.outline);
    // 前中心+小裆彎
    s += line([o + p.fw, 0], [o + p.fw, yH], S.outline);
    s += path(crPathD([[o + p.fw, yH], [o + p.fw + p.cf * 0.3, yR - 1.2], tip]), S.outline);
    // 股下線
    s += path(crPathD([tip, [(tip[0] + inKL) / 2 - 0.8, (yR + yK) / 2], [inKL, yK]]), S.outline);
    s += line([inKL, yK], [inHem, yL], S.outline);
    // 褲口・腰線
    s += line([sideHem, yL], [inHem, yL], S.outline);
    s += line(sTop, [o + p.fw, 0], S.outline);
    // 單褶(燙跡線位置,往 HL 摺入)
    if (p.pleatW > 0.3) {
      s += line([crX - p.pleatW / 2, 0], [crX, yH * 0.6], S.dart);
      s += line([crX + p.pleatW / 2, 0], [crX, yH * 0.6], S.dart);
      s += text([crX, -0.6], 'PLEAT', S.small, 'middle');
    }
    // 門襟拉鍊
    s += line([o + p.fw - 0.5, 0.5], [o + p.fw - 0.5, p.flyLen], S.dart);
    s += text([o + p.fw - 4.2, p.flyLen + 1], 'FLY', S.small);
    s += text([crX, yL + 1.2], 'FRONT', S.small, 'middle');
    s += text([crX, (yR + yL) / 2], 'GRAIN', S.small, 'middle');
  }

  // ---- 後片(右,落裆+后翘)----
  {
    const o = ox, tip = [o + p.bwp + p.cb, yR + p.dropB];
    const crX = o + p.creaseB;
    const ctrTop = [o + p.bwp - p.ctrInB, -p.backRise];        // 后翘頂點
    const sTop = [o + p.sideInB, 0];
    const sideKL = crX - p.kwB, inKL = crX + p.kwB;
    const sideHem = crX - p.hwB, inHem = crX + p.hwB;
    // 導引線
    s += line([o, 0], [o + p.bwp, 0], S.guide);
    s += line([o, yH], [o + p.bwp, yH], S.guide);
    s += line([o, yR], [tip[0], yR + p.dropB], S.guide);
    s += line([sideKL, yK], [inKL, yK], S.guide);
    s += line([crX, yR - 3], [crX, yL - 2], S.guide);
    // 脇線
    s += path(crPathD([sTop, [o + 0.5, yH * 0.55], [o, yH], [o, yR]]), S.outline);
    s += path(crPathD([[o, yR], [(o + sideKL) / 2 + 0.3, (yR + yK) / 2], [sideKL, yK]]), S.outline);
    s += line([sideKL, yK], [sideHem, yL], S.outline);
    // 後中心斜線+後裆彎(落裆)
    s += line(ctrTop, [o + p.bwp, yH], S.outline);
    s += path(crPathD([[o + p.bwp, yH], [o + p.bwp + p.cb * 0.35, yR + p.dropB - 0.8], tip]), S.outline);
    // 股下線
    s += path(crPathD([tip, [(tip[0] + inKL) / 2 - 0.8, (yR + yK) / 2], [inKL, yK]]), S.outline);
    s += line([inKL, yK], [inHem, yL], S.outline);
    // 褲口・腰線
    s += line([sideHem, yL], [inHem, yL], S.outline);
    s += line(sTop, ctrTop, S.outline);
    // 後省 2 支(腰線三等分)
    if (p.dartB2 > 0.3) {
      const dw = p.dartB2 / 2;
      for (let i = 1; i <= 2; i++) {
        const cx = sTop[0] + (ctrTop[0] - sTop[0]) * i / 3;
        const yTop = sTop[1] + (ctrTop[1] - sTop[1]) * i / 3 + 0.3;
        const ln = i === 1 ? 9 : 10;
        s += line([cx - dw / 2, yTop], [cx, yTop + ln], S.dart);
        s += line([cx + dw / 2, yTop], [cx, yTop + ln], S.dart);
      }
    }
    s += text([crX, yL + 1.2], 'BACK', S.small, 'middle');
    s += text([crX, (yR + yL) / 2], 'GRAIN', S.small, 'middle');
  }

  // 共用記號
  s += text([-1.9, 0.3], 'WL') + text([-1.9, yH + 0.3], 'HL') + text([-1.9, yR + 0.3], 'CR');
  s += text([-1.9, yK + 0.3], 'KL') + text([-1.9, yL + 0.3], 'HEM');
  s += `</svg>`;
  return s;
}

/* Node 測試用 */
if (typeof module !== 'undefined') module.exports = { draftMenPants, menPantsSVG };
```

- [ ] **Step 3: 驗證(檔案層)**

Read 讀回 menpants.js 全文核對;數值與畫面驗證在 Task 5 Step 3。

---

### Task 5: tool.html + app.js 接線男褲分頁(v12)

**Files:**
- Modify: `tool.html`
- Modify: `app.js`

**Interfaces:**
- Consumes: `draftMenPants(W,H,pantsLen,riseIn,cuffIn)`、`menPantsSVG(p)`(Task 4)。
- Produces: DOM id — `mpW` `mpH` `mpLen` `mpRise` `mpCuff`;`menPantsBox` `valuesMenPants`;`btnSvgMenPants` `btnPdfMenPants`;分頁 `tabMenPants`;錨點 `#mpants`。`cur` 增加 `mp, menPntSvg`。

- [ ] **Step 1: tool.html 輸入欄(男上衣欄位後)**

```html
    <div class="field" data-tabs="tabMenPants">
      <label for="mpW">男・腰圍 W</label>
      <input type="number" id="mpW" value="80" min="60" max="120" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenPants">
      <label for="mpH">男・臀圍 H</label>
      <input type="number" id="mpH" value="94" min="80" max="130" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenPants">
      <label for="mpLen">男・褲長</label>
      <input type="number" id="mpLen" value="100" min="60" max="120" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenPants">
      <label for="mpRise">男・股上(0=自動)</label>
      <input type="number" id="mpRise" value="0" min="0" max="35" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenPants">
      <label for="mpCuff">男・褲口寬(0=自動)</label>
      <input type="number" id="mpCuff" value="0" min="0" max="40" step="0.5">
    </div>
```

- [ ] **Step 2: 分頁鈕+分頁內容+版號**

tabs nav 加 `<button class="tabbtn" data-tab="tabMenPants">7|男裝褲子</button>`。

tabMenTop 的 `</div>` 後加:

```html
  <div class="tab" id="tabMenPants">
    <section class="panel">
      <h2>男裝西裝褲(前片+後片)</h2>
      <div id="menPantsBox" class="svgbox"></div>
      <div class="dl-group">
        <button id="btnSvgMenPants" disabled>下載 SVG</button>
        <button id="btnPdfMenPants" disabled>下載 PDF(1:1)</button>
      </div>
    </section>

    <section class="panel">
      <h2>計算結果</h2>
      <div id="valuesMenPants" class="values"></div>
    </section>

    <section class="panel">
      <h2>教學</h2>
      <details>
        <summary>男裝西裝褲:製圖邏輯</summary>
        <ol>
          <li>成品鬆份:腰+2、臀+10(西裝褲需坐姿活動量,鬆份比女裝直筒褲大)。</li>
          <li>股上可自動推算=褲長/10+18;股上 2/3 處為臀圍線 HL;中裆(膝線)=股上+(褲長−股上)×0.4。</li>
          <li>前片寬=成品臀/4−1、後片寬=成品臀/4+1;小裆宽=成品臀/20−1、後裆宽=成品臀/10。</li>
          <li>燙跡線=(片寬+裆宽)中點垂直線,前後褲口與中裆均以它左右對稱;後片 KL/褲口每側比前片大1。</li>
          <li>後片落裆1cm(後股線比前低)、后翘2.5cm(後中心腰點上抬),兩者都是給後裆縫合與坐姿的活動量。</li>
          <li>收腰:前=脇收2+燙跡線位置單褶;後=後中心斜收2.5+脇收2+2支腰省。</li>
          <li>前中心開門襟拉鍊(長度過 HL 約3cm);腰頭做法同直筒裙分頁(W+3×3cm 對摺)。</li>
          <li>縫合後前後裆必須成一條連續順滑曲線,拿曲線尺對圖確認;胚布試穿後補正。</li>
        </ol>
      </details>
    </section>
  </div>
```

script 標籤改為全部 `?v=12` 並插入 menpants.js:

```html
<script src="pants.js?v=12"></script>
<script src="pleat.js?v=12"></script>
<script src="men.js?v=12"></script>
<script src="menpants.js?v=12"></script>
<script src="app.js?v=12"></script>
```

ver 標記改 `v12`。

- [ ] **Step 3: app.js 接線**

(a) `draw()` 內 men bodice 區塊後加:

```js
    const mpW = +$('mpW').value, mpH = +$('mpH').value, mpLen = +$('mpLen').value,
          mpRise = +$('mpRise').value, mpCuff = +$('mpCuff').value;
    if (!(mpW >= 60 && mpW <= 120) || !(mpH >= 80 && mpH <= 130) || !(mpLen >= 60 && mpLen <= 120)) {
      msg.textContent = '請確認男褲輸入範圍:W 60–120、H 80–130、褲長 60–120 cm。';
      return;
    }
    const mp = draftMenPants(mpW, mpH, mpLen, mpRise, mpCuff);
```

(b) SVG 與 cur:`menPntSvg = menPantsSVG(mp)` 併入宣告;cur 加 `mp, menPntSvg`;`$('menPantsBox').innerHTML = menPntSvg;`;按鈕啟用清單追加 `'btnSvgMenPants', 'btnPdfMenPants'`。

(c) 計算結果表:

```js
  function renderValuesMenPants(p) {
    $('valuesMenPants').innerHTML = rowsTable([
      ['成品腰/臀(+2/+10)', r1(p.We) + ' / ' + r1(p.He) + ' cm'],
      ['股上' + (p.rise === p.pantsLen / 10 + 18 ? '(自動 褲長/10+18)' : '(手動)'), p.rise],
      ['前片寬 He/4-1 / 後片寬 He/4+1', r1(p.fw) + ' / ' + r1(p.bwp) + ' cm'],
      ['小裆宽 He/20-1 / 後裆宽 He/10', r1(p.cf) + ' / ' + r1(p.cb) + ' cm'],
      ['落裆 / 后翘', p.dropB + ' / ' + p.backRise + ' cm'],
      ['中裆位置(股上+(褲長-股上)×0.4)', p.KLy],
      ['褲口寬' + (p.cuff === p.He / 5 + 2 ? '(自動 He/5+2)' : '(手動)'), p.cuff],
      ['前單褶寬', p.pleatW], ['後省總量(2支)', p.dartB2],
      ['門襟開口長', p.flyLen]
    ]);
  }
```

`draw()` 內呼叫 `renderValuesMenPants(mp);`。

(d) 下載按鈕:

```js
  $('btnSvgMenPants').addEventListener('click', () => dlSVG(cur.menPntSvg, `men_pants_W${cur.mp.W}_H${cur.mp.H}.svg`));
  $('btnPdfMenPants').addEventListener('click', () => dlOnePdf(cur.menPntSvg, `men_pants_W${cur.mp.W}_H${cur.mp.H}.pdf`));
```

(e) `dlPDF()` pages 追加 `cur.menPntSvg`;hashMap 加 `'#mpants': 'tabMenPants'`。

- [ ] **Step 4: 驗證**

重新整理後:

1. preview_console_logs level=error → 無錯誤。
2. preview_eval(W=80,H=94,褲長100,自動股上/褲口):

```js
(() => { const p = draftMenPants(80, 94, 100, 0, 0);
  return { rise: p.rise, cuff: p.cuff, fw: p.fw, bwp: p.bwp,
           cf: +p.cf.toFixed(2), cb: +p.cb.toFixed(2), KLy: p.KLy,
           pleatW: +p.pleatW.toFixed(2), dartB2: +p.dartB2.toFixed(2) }; })()
```

預期:`rise=28`、`cuff=22.8`、`fw=25`、`bwp=27`、`cf=4.2`、`cb=10.4`、`KLy=56.8`、`pleatW=2.5`、`dartB2=2`。
3. ASCII/無 LAQ 檢查(同 Task 3 寫法,對 `menPantsBox`)→ 皆 true。
4. `buildPdf([svgToPdfPage(cur.menPntSvg)]).slice(0,8)` → `"%PDF-1.4"`。
5. 切分頁截圖目視:前後片並排、後片有后翘斜線與落裆、燙跡線居中、褶/省紅線、風格一致。
6. `location.hash='#mpants'` 分頁自動切換;手動股上(如 26)與手動褲口(如 20)重畫各一次確認不噴錯。

---

### Task 6: 首頁第二座男性人台(index.html)

**Files:**
- Modify: `index.html`(Three.js 場景、picker 邏輯、CTA 文案)

**Interfaces:** 無對外;錨點 `tool.html#mtop`、`tool.html#mpants` 來自 Task 3/5。

- [ ] **Step 1: 幾何建構函式化 + male rows**

把現有 `rows` 至 `figure.add(base)` 的軀幹建構段落改成參數化函式,並定義兩組斷面(female 用現值;male 肩寬、腰粗、臀窄):

```js
  const FEMALE_ROWS = [ /* 原 rows 內容原樣搬入 */ ];
  const MALE_ROWS = [
    [1.55, 0.125, 0.125, 0.125],
    [1.46, 0.150, 0.135, 0.135],
    [1.30, 0.430, 0.220, 0.220],
    [1.16, 0.440, 0.245, 0.260],
    [1.04, 0.420, 0.240, 0.265],
    [0.94, 0.370, 0.230, 0.240],
    [0.78, 0.330, 0.215, 0.215],
    [0.62, 0.345, 0.235, 0.220],
    [0.44, 0.375, 0.270, 0.235],
    [0.26, 0.360, 0.260, 0.230],
    [0.06, 0.310, 0.235, 0.210],
    [0.00, 0.290, 0.220, 0.200]
  ];

  function buildFigure(rows, knobY) {
    // cr()、col 取樣、pos/idx、geo 與 ceramic/knob/cap/pole/base 的建構
    // 全部照原程式碼,只把 rows 與 knob.position.y 改成參數
    // 回傳 { group, torso, knob }
  }
```

`cr()` 函式與 `ceramic`/`metal` 材質提到 buildFigure 外共用。兩座人台:

```js
  const female = buildFigure(FEMALE_ROWS, 1.54);
  female.group.position.set(-0.62, -0.28, 0);
  const male = buildFigure(MALE_ROWS, 1.57);
  male.group.position.set(0.62, -0.28, 0);
  scene.add(female.group, male.group);
```

鏡頭 `camera.position.set(0, 1.05, 3.6)` 改 `(0, 1.05, 4.4)`;地面柔影 PlaneGeometry `(1.6,1.6)` 改 `(3.0,1.8)`,位置不變。動畫迴圈兩座同速旋轉:`female.group.rotation.y += 0.0045; male.group.rotation.y += 0.0045;`。

- [ ] **Step 2: hover 判定與選單**

OPTIONS 擴充為四區,raycast 依命中物件屬於哪座人台+腰線上下決定 zone:

```js
  const OPTIONS = {
    upper:  { title: '女裝・上半身', links: [['上半身原型(身片+袖)', 'tool.html#top']] },
    lower:  { title: '女裝・下半身', links: [
      ['直筒裙', 'tool.html#tight'], ['圓裙', 'tool.html#circle'],
      ['褲子', 'tool.html#pants'], ['百褶裙用布量', 'tool.html#pleat']
    ] },
    upperM: { title: '男裝・上半身', links: [['男裝上衣原型(身片+袖)', 'tool.html#mtop']] },
    lowerM: { title: '男裝・下半身', links: [['男裝西裝褲', 'tool.html#mpants']] }
  };
```

(注意:順手把原本 lower 選單缺的「百褶裙用布量」補上,首頁入口才完整。)

```js
  const bodyMeshes = [female.torso, female.knob, male.torso, male.knob];
  renderer.domElement.addEventListener('pointermove', e => {
    // …mouse 換算與 raycaster.setFromCamera 同原碼…
    const hit = raycaster.intersectObjects(bodyMeshes, false)[0];
    if (hit) {
      const isMale = hit.object === male.torso || hit.object === male.knob;
      const grp = isMale ? male.group : female.group;
      const localY = hit.point.y - grp.position.y;
      const zone = (localY >= WAIST_LOCAL_Y ? 'upper' : 'lower') + (isMale ? 'M' : '');
      showZone(zone);
      renderer.domElement.style.cursor = 'pointer';
    } else { renderer.domElement.style.cursor = ''; scheduleHide(); }
  });
```

點擊行為:`if (curZone === 'upper') location.href='tool.html#top'; else if (curZone === 'upperM') location.href='tool.html#mtop';`。

- [ ] **Step 3: CTA 文案**

`.cta p` 改:`<p>女裝・男裝原型|上半身・袖・裙・褲|SVG / 1:1 PDF</p>`。

- [ ] **Step 4: 驗證**

1. 重新整理 http://localhost:4173/ ,preview_console_logs 無錯誤。
2. preview_screenshot:兩座人台並排、同材質同風格、無穿模、佈局居中。
3. preview_eval 模擬 pointermove 較繁瑣,改以目視+實際 hover 由使用者驗收;程式面驗證 OPTIONS 與 zone 字串:`typeof OPTIONS === 'undefined'`(IIFE 內)即可略過,改抓 picker DOM:hover 無法自動化就 preview_click 人台中央看 click 導向(upper zone 時應跳 tool.html#top)。
4. preview_resize mobile(375×812)截圖:人台不重疊、picker 定位規則正常。
5. 斷網降級不需實測(邏輯未動,仍以 `typeof THREE === 'undefined'` 保護)。

---

### Task 7: 文件收尾(README / STATUS / HANDOFF)

**Files:**
- Modify: `README.md`
- Modify: `STATUS.md`
- Modify: `HANDOFF.md`(整篇覆寫)

- [ ] **Step 1: README.md**

- 「功能」段補男裝上衣原型與男裝西裝褲。
- 「檔案結構」表加 men.js、menpants.js 兩列(標注「必須在 app.js 之前載入」)。
- 新增「男裝上衣原型公式(文化式男子原型)」表(照 men.js 常數)與「男裝西裝褲公式」段(照 menpants.js 常數),並註記:「腰省位置與前身上端為本站近似;e 省按後中心縮份處理」。
- 「已知限制」補一條:男子原型公開資料較少,省道位置屬本站近似,需胚布試穿補正。
- 「來源」段補:愛打版 iPatterning 男子原型 https://ipatterning.com/menprototype/ 、男褲公式為中文西裝褲打版通行慣例彙整(README 保留來源;網頁上的來源區塊已依使用者要求移除)。
- 「架構要點」補:網頁不顯示資料來源(使用者要求,2026-07-08),新增分頁時不要再放來源連結。

- [ ] **Step 2: STATUS.md**

- 功能完成度:男裝那條改為 `- [x] 男裝上衣原型+男裝西裝褲(v11/v12,使用者 2026-07-07 主動恢復要求)`。
- 加 `- [x] 首頁第二座男性人台`、`- [x] 移除網頁資料來源區塊`。
- 版本記錄表加:`| v11 | 2026-07-08 | 男裝上衣原型(men.js)、移除網頁來源區塊 |`、`| v12 | 2026-07-08 | 男裝西裝褲(menpants.js)、首頁男人台 |`。

- [ ] **Step 3: HANDOFF.md 整篇覆寫**

只留本次摘要:做了什麼(v11/v12 內容)、驗證方式(preview 伺服器+頁面內 eval,本機無 Node)、學到的坑(若有)、下一步建議(STATUS 待辦任選)。

- [ ] **Step 4: 最終驗證**

- 重新整理 tool.html:7 分頁全部切換一輪、「產生版型」、下載全部 PDF 按鈕不噴錯(console 無 error)。
- 首頁截圖存證。
- 告知使用者測試連結 http://localhost:4173/ 與 http://localhost:4173/tool.html 驗收。

---

## Self-Review 記錄

- Spec 覆蓋:來源移除(T1)、men.js(T2/T3)、menpants.js(T4/T5)、首頁雙人台(T6)、文件與測試(各 task Step + T7)——spec 第 1~6 節全數對應。
- 佔位符:無 TBD;spec 待定值已在 T4 Step 1 定案(股上+18、后翘2.5、落裆1、褲口 He/5+2)。
- 型別/命名一致性:`draftMenSleeve` 回傳形狀與 `sleeveSVG` 輸入相容(無 star 欄位,sleeveSVG 未使用 star);`cur.mb/msl/mp/menBodSvg/menSlvSvg/menPntSvg` 在 T3(b)(d)(e)、T5(b)(d)(e) 命名一致;DOM id 在 tool.html 與 app.js 兩側一致。
- 環境注意:無 git(無 commit 步驟)、無 Node(驗證走 preview_eval)、Write 後一律用 Read 核對(stale 坑)。
