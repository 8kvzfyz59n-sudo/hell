# 百褶裙 A4 試摺紙型實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 第 5 分頁支援三種摺型(刀褶/箱褶/手風琴褶)的用布計算,舊剖面圖整個刪除,換成可 1:1 列印的 A4 試摺紙型(山摺紅點劃線/谷摺藍虛線+校正尺標/摺向箭頭/寬度對照條/編號),版號 v13。

**Architecture:** pleat.js 內改寫 `draftPleatSkirt`(加 type)、刪 `pleatSVG`、新增 `pleatSheetSVG`(21×29.7cm SVG,經站內 svgToPdfPage 輸出即標準 A4);app.js/tool.html 只動第 5 分頁接線。

**Tech Stack:** 純前端 vanilla JS + SVG + 自製 PDF 產生器。

## Global Constraints

- SVG:cm 座標、只用 `<line>`/`<text>`(或 M+C path);**圖面文字全 ASCII**;樣式放元素屬性(PDF 轉換器不吃 `<g>` 繼承)。
- 山摺=紅 `#c0392b` 點劃線 `stroke-dasharray="0.6 0.25 0.08 0.25"`;谷摺=藍 `#2467a8` 虛線 `stroke-dasharray="0.5 0.3"`。
- 快取:script `?v=13` + `<span id="ver">v13</span>`。
- 無 git、無 Node:驗證用 Claude Preview 於 http://localhost:4173/tool.html?r=13 頁面內 eval(app.js 的 `cur` 是區塊作用域拿不到,用全域函式重建)。
- 摺型幾何(spec 定案):knife 單元=陽+2陰(M@陽、V@陽+陰,腰佔=陽);box 單元=陽+4陰(M@陽/2、V@陽/2+陰、V@陽/2+3陰、M@陽/2+4陰,腰佔=陽);accordion 單元=陽+陰(M@陽、V@陽+陰,腰佔=陽−陰,≤0 時警告)。

---

### Task 1: 改寫 pleat.js(type 計算 + 刪剖面圖 + pleatSheetSVG)

**Files:**
- Modify: `pleat.js`(整檔重寫)

**Interfaces:**
- Consumes: app.js 全域 `svgOpen`, `line`, `text`, `S`(呼叫時期解析)。
- Produces:
  - `draftPleatSkirt(waist, ease, yangW, yinD, skirtLen, waistbandW, hemAllow, topSeam, backOpenAllow, fabricWidth, type)` — type: `'knife'|'box'|'accordion'`(預設 knife)。回傳物件在原欄位外**新增** `type, waistPerPleat, waistOK`(waistOK=false 表 accordion 陽≤陰);`pleatUnit/numPleats/flatWidth/finishedWaist/waistDiff/totalWidth/fabricLengthM` 依摺型公式計算(waistOK=false 時 numPleats=0、這些欄位為 0)。
  - `pleatSheetSVG(p)` → A4 紙型 SVG 字串;單元寬 > 27.7cm 時回傳 `null`。
  - `pleatSVG` **刪除**(module.exports 同步更新為 `{ draftPleatSkirt, pleatSheetSVG }`)。

- [ ] **Step 1: 用 Write 整檔重寫 pleat.js**

```js
/* =========================================================
 * 百褶裙用布量計算 + A4 試摺紙型(刀褶/箱褶/手風琴褶)
 * 名詞:陽折=表面看得到的褶寬;陰折=摺疊進去、藏在下面的深度
 * 各摺型公式(摺疊幾何,以布料路徑模擬推導,可摺紙驗證):
 *   刀褶      每褶用布=陽+2陰  腰上佔寬=陽    摺線:山@陽、谷@陽+陰
 *   箱褶(工字) 每褶用布=陽+4陰  腰上佔寬=陽    摺線:山@陽/2、谷@陽/2+陰、
 *              谷@陽/2+3陰、山@陽/2+4陰(兩山摺摺後於表面相接)
 *   手風琴褶  每褶用布=陽+陰   腰上佔寬=陽−陰 摺線:山@陽、谷@陽+陰
 *              (陽≤陰 無法平面圍腰 → waistOK=false)
 *   褶數=無條件進位((淨腰圍+鬆份)/腰上佔寬);總裙寬=褶數×每褶用布+開口縫份
 * 試摺紙型:21×29.7cm SVG(=A4 直式,PDF 即 1:1),單元放不下自動轉橫式
 * 本站 PDF 產生器限制:文字 ASCII、樣式放元素屬性、線用 <line>
 * ========================================================= */

function draftPleatSkirt(waist, ease, yangW, yinD, skirtLen, waistbandW, hemAllow, topSeam, backOpenAllow, fabricWidth, type) {
  if (type !== 'box' && type !== 'accordion') type = 'knife';
  const effWaist = waist + ease;
  const pleatUnit = type === 'box' ? yangW + 4 * yinD
                  : type === 'accordion' ? yangW + yinD
                  : yangW + 2 * yinD;                    // 每褶用布
  const waistPerPleat = type === 'accordion' ? yangW - yinD : yangW; // 腰上佔寬
  const waistOK = waistPerPleat > 0.001;
  const numPleats = waistOK ? Math.ceil(effWaist / waistPerPleat) : 0;
  const flatWidth = numPleats * pleatUnit;
  const finishedWaist = numPleats * waistPerPleat;
  const waistDiff = waistOK ? finishedWaist - effWaist : 0;
  const totalWidth = waistOK ? flatWidth + backOpenAllow : 0;
  const lengthNeeded = skirtLen + waistbandW + hemAllow + topSeam;
  const fitsOneWidth = lengthNeeded <= fabricWidth;
  const fabricLengthM = +(totalWidth / 100).toFixed(2);

  return {
    waist, ease, yangW, yinD, skirtLen, waistbandW, hemAllow, topSeam, backOpenAllow, fabricWidth,
    type, waistPerPleat, waistOK,
    effWaist, pleatUnit, numPleats, flatWidth, finishedWaist, waistDiff,
    totalWidth, lengthNeeded, fitsOneWidth, fabricLengthM
  };
}

/* ---- A4 試摺紙型 ---- */
const PLEAT_ST_M = 'fill="none" stroke="#c0392b" stroke-width="0.06" stroke-dasharray="0.6 0.25 0.08 0.25"';
const PLEAT_ST_V = 'fill="none" stroke="#2467a8" stroke-width="0.06" stroke-dasharray="0.5 0.3"';
const PLEAT_ST_CUT = 'fill="none" stroke="#111111" stroke-width="0.08"';
const PLEAT_ST_THIN = 'fill="none" stroke="#555555" stroke-width="0.04"';

function pleatSheetSVG(p) {
  const U = p.pleatUnit, wpp = p.waistPerPleat;
  const yang = p.yangW, yin = p.yinD;
  let W = 21, H = 29.7;
  if (U > W - 2) { W = 29.7; H = 21; }       // 轉橫式
  if (U > W - 2) return null;                 // 連橫式都放不下
  const k = Math.max(1, Math.floor((W - 2) / U));   // 完整褶單元數
  const x0 = 1;
  const yTop = 7.2, yBot = H - 4.7;           // 摺線區(可裁下的紙條)
  const f = n => +(+n).toFixed(2);
  const ln = (x1, y1, x2, y2, st) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${st}/>`;
  const tx = (x, y, s, size, anchor, color) =>
    `<text x="${f(x)}" y="${f(y)}" fill="${color || '#333333'}" font-size="${size || 0.7}" text-anchor="${anchor || 'start'}">${s}</text>`;
  // 水平小箭頭(線段+兩撇箭頭,指向 x2)
  function arrow(x1, x2, y) {
    const d = x2 > x1 ? 1 : -1;
    return ln(x1, y, x2, y, PLEAT_ST_THIN) +
           ln(x2, y, x2 - d * 0.35, y - 0.18, PLEAT_ST_THIN) +
           ln(x2, y, x2 - d * 0.35, y + 0.18, PLEAT_ST_THIN);
  }

  const typeName = p.type === 'box' ? 'BOX (INVERTED)' : p.type === 'accordion' ? 'ACCORDION' : 'KNIFE';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${f(W)}cm" height="${f(H)}cm" viewBox="0 0 ${f(W)} ${f(H)}" font-family="Helvetica, Arial, sans-serif">`;

  // 標題與參數
  s += tx(W / 2, 1.6, 'PLEAT TEST SHEET - ' + typeName, 0.9, 'middle', '#111111');
  s += tx(W / 2, 2.6, `YANG ${yang} / YIN ${yin} / SKIRT LEN ${p.skirtLen} / UNIT ${f(U)} x ${k}`, 0.65, 'middle', '#555555');
  // 圖例
  s += ln(1, 3.6, 3.2, 3.6, PLEAT_ST_M) + tx(3.5, 3.8, 'MOUNTAIN = FOLD OUT', 0.6, 'start', '#c0392b');
  s += ln(1, 4.5, 3.2, 4.5, PLEAT_ST_V) + tx(3.5, 4.7, 'VALLEY = FOLD IN', 0.6, 'start', '#2467a8');
  // 摺完寬度對照條
  if (p.waistOK) {
    const bw = k * wpp, yB = 5.8;
    s += ln(x0, yB, x0 + bw, yB, PLEAT_ST_CUT);
    s += ln(x0, yB - 0.3, x0, yB + 0.3, PLEAT_ST_CUT) + ln(x0 + bw, yB - 0.3, x0 + bw, yB + 0.3, PLEAT_ST_CUT);
    s += tx(x0 + bw + 0.4, yB + 0.2, `FOLDED WIDTH ${f(bw)} cm`, 0.6, 'start', '#111111');
  } else {
    s += tx(x0, 6.0, 'ACCORDION WITH YANG <= YIN: FOLDS, BUT NOT FLAT AT WAIST', 0.6, 'start', '#c0392b');
  }

  // 摺線區外框(裁切線)
  s += ln(x0, yTop, x0 + k * U, yTop, PLEAT_ST_CUT) + ln(x0, yBot, x0 + k * U, yBot, PLEAT_ST_CUT);
  s += ln(x0, yTop, x0, yBot, PLEAT_ST_CUT) + ln(x0 + k * U, yTop, x0 + k * U, yBot, PLEAT_ST_CUT);
  s += tx(x0, yTop - 0.9, 'CUT ALONG FRAME, THEN FOLD', 0.55, 'start', '#555555');

  // 各褶單元
  for (let i = 0; i < k; i++) {
    const u = x0 + i * U;
    s += tx(u + U / 2, yTop - 0.25, String(i + 1), 0.6, 'middle', '#111111');   // 編號
    if (p.type === 'box') {
      const c = u + yang / 2 + 2 * yin;                    // 兩側摺份於此相會
      s += ln(u + yang / 2, yTop, u + yang / 2, yBot, PLEAT_ST_M);
      s += ln(u + yang / 2 + yin, yTop, u + yang / 2 + yin, yBot, PLEAT_ST_V);
      s += ln(u + yang / 2 + 3 * yin, yTop, u + yang / 2 + 3 * yin, yBot, PLEAT_ST_V);
      s += ln(u + yang / 2 + 4 * yin, yTop, u + yang / 2 + 4 * yin, yBot, PLEAT_ST_M);
      s += arrow(c, u + yang / 2 + 0.25, yTop + 1.1);      // 左摺份往左收
      s += arrow(c, u + yang / 2 + 4 * yin - 0.25, yTop + 1.1); // 右摺份往右收
    } else {                                               // knife / accordion
      s += ln(u + yang, yTop, u + yang, yBot, PLEAT_ST_M);
      s += ln(u + yang + yin, yTop, u + yang + yin, yBot, PLEAT_ST_V);
      s += arrow(u + U - 0.1, u + yang + 0.25, yTop + 1.1); // 摺份往左壓
    }
  }

  // 列印校正尺標(10cm)
  const yR = yBot + 1.6;
  s += ln(x0, yR, x0 + 10, yR, PLEAT_ST_CUT);
  for (let i = 0; i <= 10; i++) {
    const tall = (i % 5 === 0) ? 0.55 : 0.35;
    s += ln(x0 + i, yR, x0 + i, yR - tall, PLEAT_ST_CUT);
  }
  s += tx(x0, yR - 0.8, '0', 0.5) + tx(x0 + 5, yR - 0.8, '5', 0.5, 'middle') + tx(x0 + 10, yR - 0.8, '10', 0.5, 'middle');
  s += tx(x0, yR + 0.9, 'PRINT CHECK: THIS BAR = 10 cm (PRINT AT 100% / ACTUAL SIZE)', 0.6, 'start', '#111111');

  s += `</svg>`;
  return s;
}

if (typeof module !== 'undefined') {
  module.exports = { draftPleatSkirt, pleatSheetSVG };
}
```

- [ ] **Step 2: 檔案層驗證**

Grep pleat.js 確認:`pleatSVG` 已不存在、`pleatSheetSVG` 存在、無 ` d="` 內含 L/A/Q(本檔全用 `<line>`,應為 0 個 path)。行為驗證在 Task 2 Step 4。

---

### Task 2: tool.html + app.js 接線(v13)

**Files:**
- Modify: `tool.html`(摺型欄位、pleat panel 置換、教學、script v13)
- Modify: `app.js`(draw()、renderValuesPleat、下載、dlPDF)

**Interfaces:**
- Consumes: Task 1 的 `draftPleatSkirt(..., type)`、`pleatSheetSVG(p)`。
- Produces: DOM id — `plType`(select)、`pleatSheetBox`、`btnSvgPleatSheet`、`btnPdfPleatSheet`;`cur.plSheetSvg`(可能為 null)。**移除**:`pleatBox`、`btnSvgPleat`、`btnPdfPleat`。

- [ ] **Step 1: tool.html 加摺型欄位**

在 `plFabricW` 欄位 `</div>` 之後插入:

```html
    <div class="field" data-tabs="tabPleat">
      <label for="plType">摺型</label>
      <select id="plType">
        <option value="knife" selected>刀褶(單向褶)</option>
        <option value="box">箱褶(工字褶)</option>
        <option value="accordion">手風琴褶</option>
      </select>
    </div>
```

- [ ] **Step 2: 置換 pleat panel 與教學**

把整段:

```html
    <section class="panel">
      <h2>百褶裙摺份剖面(陽折/陰折示意)</h2>
      <div id="pleatBox" class="svgbox"></div>
      <div class="dl-group">
        <button id="btnSvgPleat" disabled>下載 SVG</button>
        <button id="btnPdfPleat" disabled>下載 PDF(1:1)</button>
      </div>
    </section>
```

換成:

```html
    <section class="panel">
      <h2>A4 試摺紙型(印出來先摺摺看)</h2>
      <div id="pleatSheetBox" class="svgbox"></div>
      <div class="dl-group">
        <button id="btnSvgPleatSheet" disabled>下載 SVG</button>
        <button id="btnPdfPleatSheet" disabled>下載 PDF(A4,1:1)</button>
      </div>
    </section>
```

教學 panel:原「百褶裙用布量:計算邏輯」`<details>` 的第 2 條(每一褶用布量)改為:

```html
          <li>每一褶用布量依摺型而異:<b>刀褶</b>=陽折+2×陰折;<b>箱褶(工字褶)</b>=陽折+4×陰折(左右各摺入一組);<b>手風琴褶</b>=陽折+陰折(山谷交替,腰上佔寬=陽折−陰折,陽折必須大於陰折才能平面圍腰)。</li>
```

並在該 `</details>` 之後新增:

```html
      <details>
        <summary>A4 試摺紙型:怎麼印、怎麼摺</summary>
        <ol>
          <li>列印時務必選「實際大小 / 100%」,不要「符合頁面」;印好先量底部尺標,確認 10cm 就是 10cm。</li>
          <li><b>紅色點劃線=山摺(凸)</b>:摺起來朝自己、摺痕在表面。<b>藍色虛線=谷摺(凹)</b>:往內摺、摺痕藏在裡面。</li>
          <li>箭頭指示摺份壓平的方向;沿外框裁下紙條,依編號順序摺完,對照頂部「FOLDED WIDTH」線段驗證寬度。</li>
          <li>箱褶紙型為工字褶(表面兩摺線相接);要一般箱褶(表面凸盒)把紙翻面摺即可。</li>
          <li>覺得褶太密/太淺,回頭調陽折/陰折數值重印,滿意後再下布。</li>
        </ol>
      </details>
```

- [ ] **Step 3: script v13 + app.js 接線**

tool.html:script 五行全改 `?v=13`;ver 標記改 `v13`。

app.js 修改:

(a) `draw()` 內 `const pl = draftPleatSkirt(...)` 一行改為:

```js
    const pl = draftPleatSkirt(plWaist, plEase, plYang, plYin, plLen, plBelt, plHem, 1, 3, plFabricW, $('plType').value);
```

(b) SVG 宣告區:`plSvg = pleatSVG(pl)` 改 `plSheetSvg = pleatSheetSVG(pl)`;cur 中 `plSvg` 改 `plSheetSvg`。塞入區 `$('pleatBox').innerHTML = plSvg;` 改:

```js
    $('pleatSheetBox').innerHTML = plSheetSvg || '<p class="note">褶單元太寬,無法放入 A4(直式19cm/橫式27.7cm),請縮小陽折或陰折。</p>';
```

(c) 警告訊息區(`if (!pl.fitsOneWidth)` 附近)加:

```js
    if (!pl.waistOK) msg.textContent += (msg.textContent ? ' ' : '') + '手風琴褶陽折需大於陰折才能平面圍腰;陽=陰為純手風琴褶,需鬆緊帶或裙襬展開。';
```

且 `if (!pl.fitsOneWidth)` 條件改為 `if (pl.waistOK && !pl.fitsOneWidth)`(waistOK=false 時 totalWidth=0,布幅訊息無意義)。

(d) 按鈕啟用清單:把 `'btnSvgPleat', 'btnPdfPleat'` 換成 `'btnSvgPleatSheet', 'btnPdfPleatSheet'`;下載綁定原兩行換成:

```js
  $('btnSvgPleatSheet').addEventListener('click', () => dlSVG(cur.plSheetSvg, `pleat_test_sheet_${cur.pl.type}.svg`));
  $('btnPdfPleatSheet').addEventListener('click', () => dlOnePdf(cur.plSheetSvg, `pleat_test_sheet_${cur.pl.type}.pdf`));
```

(`dlSVG`/`dlOnePdf` 對 null/undefined 已有 `if (!svgStr) return;` 保護,不需加判斷。)

(e) `dlPDF()` pages 陣列:`cur.plSvg` 改 `cur.plSheetSvg`,且整列改為先過濾 null:

```js
    const pages = [cur.bodSvg, cur.slvSvg, cur.tgtSvg, cur.sktSvg, cur.pntSvg, cur.plSheetSvg,
                   cur.menBodSvg, cur.menSlvSvg, cur.menPntSvg].filter(Boolean).map(svgToPdfPage);
```

(f) `renderValuesPleat(p)` 表格改為(整個函式體置換):

```js
  function renderValuesPleat(p) {
    const typeName = p.type === 'box' ? '箱褶(工字褶)' : p.type === 'accordion' ? '手風琴褶' : '刀褶';
    const unitFormula = p.type === 'box' ? '陽+4×陰' : p.type === 'accordion' ? '陽+陰' : '陽+2×陰';
    $('valuesPleat').innerHTML = rowsTable([
      ['摺型', typeName],
      ['淨腰圍+鬆份', p.effWaist],
      ['每褶用布(' + unitFormula + ')', p.pleatUnit],
      ['腰上佔寬' + (p.type === 'accordion' ? '(陽−陰)' : '(=陽折)'), p.waistPerPleat],
      ['褶數(無條件進位)', p.waistOK ? p.numPleats : '—(陽≤陰)'],
      ['攤平後總裙寬', p.flatWidth],
      ['褶疊起來的實際腰圍', p.finishedWaist],
      ['與目標腰圍差(進位多出)', r1(p.waistDiff)],
      ['+後開口/接縫份後總寬', p.totalWidth],
      ['裙長方向所需寬度(裙長+腰頭+縫份)', p.lengthNeeded],
      ['布幅是否足夠橫裁一整片', !p.waistOK ? '—' : p.fitsOneWidth ? '足夠(布幅' + p.fabricWidth + 'cm)' : '不足,需接布或直裁'],
      ['建議用布長度', p.fabricLengthM + ' m']
    ]);
  }
```

- [ ] **Step 4: 預覽驗證**

導向 `http://localhost:4173/tool.html?r=13` 後逐項:

1. `preview_console_logs level=error` → 無錯誤;`document.getElementById('ver').textContent` → `v13`。
2. 三摺型數值(preview_eval;腰64鬆2陽3陰2):

```js
(() => { const t = ty => { const p = draftPleatSkirt(64,2,3,2,45,4,3,1,3,150,ty);
  return [p.pleatUnit, p.waistPerPleat, p.numPleats, p.flatWidth, p.waistOK]; };
  return { knife: t('knife'), box: t('box'), accordion: t('accordion') }; })()
```

預期:`knife: [7, 3, 22, 154, true]`、`box: [11, 3, 22, 242, true]`、`accordion: [5, 1, 66, 330, true]`。
再測 `draftPleatSkirt(64,2,2,3,45,4,3,1,3,150,'accordion').waistOK` → `false`。

3. 紙型 SVG(preview_eval):

```js
(() => { const p = draftPleatSkirt(64,2,3,2,45,4,3,1,3,150,'box');
  const s = pleatSheetSVG(p);
  const texts = s.match(/>([^<]*)<\/text>/g) || [];
  const page = svgToPdfPage(s);
  return { vb: s.match(/viewBox="([^"]+)"/)[1],
           ascii: !/[^\x00-\x7F]/.test(texts.join('')),
           noPath: !/<path/.test(s),
           noNaN: !/NaN/.test(page.stream),
           a4pt: [Math.round(page.w), Math.round(page.h)],
           pdfHead: buildPdf([page]).slice(0,8) }; })()
```

預期:`vb="0 0 21 29.7"`、`ascii=true`、`noPath=true`、`noNaN=true`、`a4pt=[595, 842]`、`pdfHead="%PDF-1.4"`。
橫式測試:`pleatSheetSVG(draftPleatSkirt(64,2,8,4,45,4,3,1,3,150,'box'))` 的 viewBox → `0 0 29.7 21`(單元 24 > 19);
放不下測試:`pleatSheetSVG(draftPleatSkirt(64,2,12,5,45,4,3,1,3,150,'box'))` → `null`(單元 32 > 27.7)。

4. 頁面行為:`location.hash='#pleat'` 切分頁;`plType` 改 box → `btnDraw.click()` → `pleatSheetBox` 有 SVG、valuesPleat 首列顯示「箱褶(工字褶)」;改 accordion 且陽2陰3 → msg 出現手風琴警告、紙型仍有 SVG。改回 knife 3/2。
5. 舊 id 移除確認:`document.getElementById('pleatBox') === null && document.getElementById('btnSvgPleat') === null` → true;Grep app.js 無 `pleatSVG`。
6. 摺線抽查(box,陽3陰2,單元11,首褶 u=1):M 線 x=2.5、V x=4.5、V x=8.5、M x=10.5(preview_eval 檢查 `<line ... stroke="#c0392b"` x1 值集合)。

---

### Task 3: 文件收尾與迴歸

**Files:**
- Modify: `README.md`、`STATUS.md`、`HANDOFF.md`(整篇覆寫)

- [ ] **Step 1: README.md**

- 「百褶裙用布量計算(陽折/陰折)」段改寫:三摺型公式表(刀=陽+2陰/箱=陽+4陰/手風琴=陽+陰,腰佔寬與摺線位置照 Global Constraints),補「A4 試摺紙型:21×29.7 SVG 直出 PDF 即 1:1;山摺紅點劃/谷摺藍虛;箱褶採工字褶排列」。
- 「架構要點」補:pleat.js 的紙型全用 `<line>` 元素(無 path),樣式一律放元素屬性。
- 註記:原剖面圖(pleatSVG)因摺型畫法錯誤已整個移除(2026-07-08,使用者確認)。

- [ ] **Step 2: STATUS.md**

- 功能完成度:「百褶裙用布量計算機」列改為 `- [x] 百褶裙用布量計算機+三摺型+A4試摺紙型(v10 pleat.js;v13 改版:舊剖面圖錯誤已移除)`。
- 版本記錄加:`| v13 | 2026-07-08 | 百褶裙三摺型計算+A4試摺紙型,移除錯誤剖面圖 |`。

- [ ] **Step 3: HANDOFF.md 整篇覆寫**

摘要 v13 內容、驗證方式(preview eval)、下一步(使用者實印 A4 驗證縮放與摺紙手感;男裝腰省資料待使用者提供後修 men.js)。

- [ ] **Step 4: 迴歸與交付**

- 7 分頁切一輪 + `btnDraw` + console 零錯誤;「下載全部 PDF」9 頁(pages.length=9,含紙型頁)`%PDF-1.4`。
- 告知使用者 http://localhost:4173/tool.html 驗收,提醒列印用「實際大小」。

---

## Self-Review 記錄

- Spec 覆蓋:type 計算(T1)、pleatSVG 刪除(T1+T2e/d)、A4 紙型與四項輔助(T1 Step1 的 pleatSheetSVG:尺標/箭頭/對照條/編號全在)、自動橫式與放不下訊息(T1+T2b)、accordion 警告(T2c)、UI/教學(T2)、文件(T3)——spec 全數對應。
- 佔位符:無。
- 命名一致:`plSheetSvg`/`pleatSheetBox`/`btnSvgPleatSheet`/`btnPdfPleatSheet`/`plType` 在 T1/T2 兩側一致;`draftPleatSkirt` 第 11 參數 type 與呼叫端一致。
- 數學抽查:knife 66/3=22 褶×7=154 ✓;box 22×11=242 ✓;accordion 佔寬1→66褶×5=330 ✓;box 摺線 1+1.5=2.5、+2=4.5、+2×2=6.5(無線)、+3×2=8.5(V)... 修正:V@陽/2+3陰=1+1.5+6=8.5 ✓、M@1+1.5+8=10.5 ✓。
