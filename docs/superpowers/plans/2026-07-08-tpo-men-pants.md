# TPO 男褲重做實作計畫(v15)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依使用者教材圖 6-10(H 型單褶西褲)重寫 menpants.js 製圖與 SVG,輸入淨 W/H+股上/股下,含腰頭版片,v15。

**Architecture:** menpants.js 整檔重寫(`draftMenPants(W,H,riseLen,inseam)` 新簽名 + `menPantsSVG` 佈局照書:前片左/後片右/腰頭下方);app.js 男褲接線與結果表重寫;tool.html 輸入欄與教學重寫。

**Tech Stack:** 既有純前端管線。

## Global Constraints

- SVG:cm 座標、線用 `<line>` 或 M+C path(`lineC`/`crPathD`)、圖面文字 ASCII、樣式放元素屬性。
- 頁面文案照白話標準(術語+白話括號);**頁面不提教材書名**(來源不上網頁),書名只記 README。
- 版號 v15(script 五行 + ver 標記)。
- 驗證:preview `tool.html?r=15`(HTML 用一次性參數強制重載);`cur` 拿不到,用全域函式重建。
- 公式(spec 定案):☆=H/12;riseB=股上−3;HL=riseB−☆;KL=riseB+股下/2−5;△=H/4+2.5;前小裆=2☆/3;後裆平出☆/2、落裆1;褶量=△−0.7−1.5−W/4;省量=(△−☆/2)−W/4 分兩省 ±0.3;前脚口=△−3.5、後=+1;中檔=脚口+2;腰頭 3×(W/2+3 / W/2+6)。

---

### Task 1: 重寫 menpants.js

**Files:**
- Modify: `menpants.js`(整檔重寫)

**Interfaces:**
- Consumes: app.js 全域 `svgOpen`, `line`, `path`, `text`, `crPathD`, `S`。
- Produces:
  - `draftMenPants(W, H, riseLen, inseam)` → `{ W, H, riseLen, inseam, pantsLen, star, riseB, hlY, klY, hemY, delta, extF, extB, dropB, hemF, hemB, kneeF, kneeB, creaseF, creaseB, pleatW, dartTotal, dart1, dart2, beltW, beltLL, beltLR }`
  - `menPantsSVG(p)` → SVG 字串(前片+後片+兩條腰頭)。

- [ ] **Step 1: Write 整檔**

```js
/* =========================================================
 * 男裝西裝褲(H 型單褶)— 依使用者提供教材圖 6-10 重製
 * 輸入:淨腰圍 W、淨臀圍 H、股上長(含腰頭3)、股下長
 * 公式自帶鬆量(如 H/4+2.5 的 2.5)
 * ☆=H/12;身片股上=股上長−3;HL=橫檔上方☆;KL=股下/2再上提5
 * 前片:寬△=H/4+2.5;小裆=☆×2/3;前中收0.7、側收1.5抬0.5;
 *       褶量□=△−0.7−1.5−W/4(單褶壓挺縫線);門襟3.5
 * 後片:後翘1、後中腰點收☆/2;後裆平出☆/2、落裆1;
 *       省量▲=(△−☆/2)−W/4,兩省=▲/2±0.3、省長8、尖朝後口袋
 * 脚口:前=△−3.5、後=前+1;中檔=脚口+2;腰頭3×(W/2+3、W/2+6含搭份)
 * ========================================================= */

function draftMenPants(W, H, riseLen, inseam) {
  const star = H / 12;
  const riseB = riseLen - 3;
  const hlY = riseB - star;
  const klY = riseB + inseam / 2 - 5;
  const hemY = riseB + inseam;
  const delta = H / 4 + 2.5;
  const extF = 2 * star / 3;
  const extB = star / 2;
  const dropB = 1;
  const hemF = delta - 3.5, hemB = hemF + 1;
  const kneeF = hemF + 2, kneeB = hemB + 2;
  const creaseF = (delta - extF) / 2;
  const creaseB = (delta + extB) / 2;
  const pleatW = delta - 0.7 - 1.5 - W / 4;
  const dartTotal = (delta - extB) - W / 4;
  const dart1 = dartTotal / 2 + 0.3, dart2 = dartTotal / 2 - 0.3;
  const beltW = 3, beltLL = W / 2 + 3, beltLR = W / 2 + 6;
  return { W, H, riseLen, inseam, pantsLen: riseLen + inseam,
    star, riseB, hlY, klY, hemY, delta, extF, extB, dropB,
    hemF, hemB, kneeF, kneeB, creaseF, creaseB,
    pleatW, dartTotal, dart1, dart2, beltW, beltLL, beltLR };
}

function menPantsSVG(p) {
  const m = 2.5, gap = 6;
  const F = x => x + p.extF;                       // 前片座標(小裆尖=0)
  const oxB = p.extF + p.delta + gap;
  const B = x => oxB + x;                          // 後片座標(側縫=oxB)
  const totalW = p.extF + p.delta + gap + p.delta + p.extB;
  const beltY = p.hemY + 3;
  const minX = -m, minY = -m - 1.5;
  const w = totalW + 2 * m, h = beltY + 2 * p.beltW + 1.5 + m - minY;
  let s = svgOpen(minX, minY, w, h);
  const yH = p.hlY, yR = p.riseB, yK = p.klY, yL = p.hemY;

  // ---- 前片(前中心在左、小裆尖朝左)----
  {
    const d = p.delta, cx = p.creaseF;
    const Pc = [F(0.7), 0], Ps = [F(d - 1.5), -0.5];
    const yWaist = x => Pc[1] + (Ps[1] - Pc[1]) * (x - Pc[0]) / (Ps[0] - Pc[0]);
    const kIn = F(cx - p.kneeF / 2), kOut = F(cx + p.kneeF / 2);
    const hIn = F(cx - p.hemF / 2), hOut = F(cx + p.hemF / 2);
    const tip = [F(-p.extF), yR];
    // 導引線
    s += line([F(0), 0], [F(d), 0], S.guide);
    s += line([F(0), yH], [F(d), yH], S.guide);
    s += line([F(-p.extF), yR], [F(d), yR], S.guide);
    s += line([kIn, yK], [kOut, yK], S.guide);
    s += line([F(cx), yR - 3], [F(cx), yL - 2], S.guide);
    // 前中心+小裆彎
    s += line(Pc, [F(0), yH], S.outline);
    s += path(crPathD([[F(0), yH], [F(-p.extF * 0.6), yR - 1.2], tip]), S.outline);
    // 腰線
    s += line(Pc, Ps, S.outline);
    // 側縫
    s += path(crPathD([Ps, [F(d), yH], [F(d), yR]]), S.outline);
    s += path(crPathD([[F(d), yR], [(F(d) + kOut) / 2 + 0.3, (yR + yK) / 2], [kOut, yK]]), S.outline);
    s += line([kOut, yK], [hOut, yL], S.outline);
    // 內縫(股下)
    s += path(crPathD([tip, [(tip[0] + kIn) / 2 - 0.8, (yR + yK) / 2], [kIn, yK]]), S.outline);
    s += line([kIn, yK], [hIn, yL], S.outline);
    // 褲腳
    s += line([hIn, yL], [hOut, yL], S.outline);
    // 褶(有剩才畫)
    if (p.pleatW > 0.3) {
      s += line([F(cx - p.pleatW / 2), yWaist(F(cx - p.pleatW / 2))], [F(cx), 7], S.dart);
      s += line([F(cx + p.pleatW / 2), yWaist(F(cx + p.pleatW / 2))], [F(cx), 7], S.dart);
      s += text([F(cx), -1.2], 'PLEAT', S.small, 'middle');
    }
    // 門襟
    s += line([F(3.5), 0.4], [F(3.5), yH], S.dart);
    s += text([F(3.8), yH - 0.5], 'FLY', S.small);
    // 斜插袋
    s += line([F(d - 5), yWaist(F(d - 5)) + 0.3], [F(d - 0.3), 14], S.dart);
    s += text([F(d - 5.2), 6], 'POCKET', S.small);
    s += text([F(cx), yL + 1.2], 'FRONT', S.small, 'middle');
    s += text([F(cx) + 0.3, (yR + yL) / 2], 'CREASE', S.small);
  }

  // ---- 後片(側縫在左、後中心+後裆朝右)----
  {
    const d = p.delta, cx = p.creaseB;
    const Pw = [B(d - p.extB), -1], Ps = [B(0), -0.5];
    const kIn = B(cx + p.kneeB / 2), kOut = B(cx - p.kneeB / 2);
    const hIn = B(cx + p.hemB / 2), hOut = B(cx - p.hemB / 2);
    const tip = [B(d + p.extB), yR + p.dropB];
    // 導引線
    s += line([B(0), 0], [B(d), 0], S.guide);
    s += line([B(0), yH], [B(d), yH], S.guide);
    s += line([B(0), yR], [B(d + p.extB), yR], S.guide);
    s += line([kOut, yK], [kIn, yK], S.guide);
    s += line([B(cx), yR - 3], [B(cx), yL - 2], S.guide);
    // 後中斜線+後裆彎(落裆)
    s += line(Pw, [B(d), yH], S.outline);
    s += path(crPathD([[B(d), yH], [B(d + p.extB * 0.5), yR + p.dropB - 0.8], tip]), S.outline);
    // 腰線
    s += line(Ps, Pw, S.outline);
    // 側縫
    s += path(crPathD([Ps, [B(0), yH], [B(0), yR]]), S.outline);
    s += path(crPathD([[B(0), yR], [(B(0) + kOut) / 2 - 0.3, (yR + yK) / 2], [kOut, yK]]), S.outline);
    s += line([kOut, yK], [hOut, yL], S.outline);
    // 內縫
    s += path(crPathD([tip, [(tip[0] + kIn) / 2 + 0.8, (yR + yK) / 2], [kIn, yK]]), S.outline);
    s += line([kIn, yK], [hIn, yL], S.outline);
    // 褲腳
    s += line([hOut, yL], [hIn, yL], S.outline);
    // 兩省(靠後中的較大)
    if (p.dart2 > 0.1) {
      const dws = [p.dart2, p.dart1];              // 1/3 處小省、2/3 處大省
      for (let i = 1; i <= 2; i++) {
        const cxD = Ps[0] + (Pw[0] - Ps[0]) * i / 3;
        const yTop = Ps[1] + (Pw[1] - Ps[1]) * i / 3 + 0.2;
        const dw = dws[i - 1];
        s += line([cxD - dw / 2, yTop], [cxD, yTop + 8], S.dart);
        s += line([cxD + dw / 2, yTop], [cxD, yTop + 8], S.dart);
      }
      s += text([B(cx), -1.6], 'DART x2', S.small, 'middle');
    }
    // 後口袋
    s += line([B(cx - 6.75), 8.3], [B(cx + 6.75), 8.1], S.dart);
    s += text([B(cx), 9.5], 'POCKET', S.small, 'middle');
    s += text([B(cx), yL + 1.2], 'BACK', S.small, 'middle');
    s += text([B(cx) + 0.3, (yR + yL) / 2], 'CREASE', S.small);
  }

  // ---- 腰頭版片(左/右)----
  {
    const x0 = p.extF;
    const rect = (y0, len) =>
      line([x0, y0], [x0 + len, y0], S.outline) + line([x0 + len, y0], [x0 + len, y0 + p.beltW], S.outline) +
      line([x0 + len, y0 + p.beltW], [x0, y0 + p.beltW], S.outline) + line([x0, y0 + p.beltW], [x0, y0], S.outline);
    s += rect(beltY, p.beltLL);
    s += text([x0 + p.beltLL + 0.5, beltY + 2], 'L-BELT W/2+3', S.small);
    s += rect(beltY + p.beltW + 1.5, p.beltLR);
    s += text([x0 + p.beltLR + 0.5, beltY + p.beltW + 3.5], 'R-BELT W/2+6 (LAP 3)', S.small);
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

- [ ] **Step 2: Grep 驗證**:menpants.js 無舊欄位名 `bwp|cf\b|cb\b|hipY|flyLen|ctrInB`;行為驗證在 Task 2。

---

### Task 2: tool.html + app.js 接線(v15)

**Files:**
- Modify: `tool.html`(男褲輸入欄、教學、v15)
- Modify: `app.js`(draw()、renderValuesMenPants)

**Interfaces:**
- Consumes: `draftMenPants(W,H,riseLen,inseam)`、`menPantsSVG(p)`(Task 1)。
- Produces: DOM id `mpW` `mpH` `mpRise` `mpInseam`(**mpLen、mpCuff 移除**);其餘 id 不變。

- [ ] **Step 1: tool.html 男褲輸入欄整段置換**

把 mpW 到 mpCuff 五個 field 換成:

```html
    <div class="field" data-tabs="tabMenPants">
      <label for="mpW">男・淨腰圍(實際量到的腰圍)</label>
      <input type="number" id="mpW" value="76" min="55" max="120" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenPants">
      <label for="mpH">男・淨臀圍(實際量到的臀圍)</label>
      <input type="number" id="mpH" value="94" min="75" max="130" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenPants">
      <label for="mpRise">男・股上長(腰到胯下,含腰頭3cm)</label>
      <input type="number" id="mpRise" value="27" min="22" max="35" step="0.5">
    </div>
    <div class="field" data-tabs="tabMenPants">
      <label for="mpInseam">男・股下長(胯下到褲腳)</label>
      <input type="number" id="mpInseam" value="75" min="55" max="95" step="0.5">
    </div>
```

- [ ] **Step 2: 教學區整段置換**(白話、不提書名)

原「男裝西裝褲:製圖邏輯」`<details>` 換成:

```html
      <details>
        <summary>男裝西裝褲(單褶):怎麼畫出來的(白話版)</summary>
        <ol>
          <li>輸入都填實際量到的尺寸就好:公式裡已經幫你加了活動需要的鬆量(例如臀圍那條 H/4+2.5,那個 2.5 就是鬆量)。</li>
          <li>長度:股上長=腰到胯下(含 3cm 腰頭,身片實際畫股上長−3);股下長=胯下到褲腳;褲長=兩者相加。膝蓋位置(中檔線)取股下的一半再往上 5cm。</li>
          <li>整套圖用一個基準值 ☆=臀圍÷12:臀圍線在橫檔線(胯下那條水平線)上方 ☆;前片褲襠尖端往外伸 ☆×2/3;後片再多伸 ☆/2,並往下落 1cm(坐下才有空間)。</li>
          <li>前片有一個「褶」壓在挺縫線(褲管燙出來那條直線)上:褶寬不是固定值,是腰口剩多少收多少(前片寬−前中心收 0.7−側縫收 1.5−腰圍÷4)。</li>
          <li>後片腰口多出來的量改用兩個「省」收掉(一大一小差 0.6),省尖指向後口袋;後中心腰點往上翹 1cm(后翘),彎腰坐下才不會扯。</li>
          <li>褲腳:前片=前片寬−3.5、後片比前片寬 1;膝蓋處各再寬 1,自然直筒(H 型)。</li>
          <li>腰頭另外裁:寬 3cm,左片=腰圍/2+3、右片=腰圍/2+6(多的 3cm 是扣子搭份),圖下方兩條就是。</li>
          <li>紅線是記號不是裁切線:PLEAT=褶、DART=省、POCKET=口袋位置、FLY=前門襟(拉鍊開口)、CREASE=挺縫線。</li>
        </ol>
      </details>
```

- [ ] **Step 3: v15 + app.js**

script 五行 `?v=15`、ver `v15`。

app.js draw() 男褲段換成:

```js
    const mpW = +$('mpW').value, mpH = +$('mpH').value,
          mpRise = +$('mpRise').value, mpInseam = +$('mpInseam').value;
    if (!(mpW >= 55 && mpW <= 120) || !(mpH >= 75 && mpH <= 130) ||
        !(mpRise >= 22 && mpRise <= 35) || !(mpInseam >= 55 && mpInseam <= 95)) {
      msg.textContent = '請確認男褲輸入範圍:腰 55–120、臀 75–130、股上 22–35、股下 55–95 cm。';
      return;
    }
    const mp = draftMenPants(mpW, mpH, mpRise, mpInseam);
```

警告(訊息區,B≥90 提示附近)加:

```js
    if (mp.pleatW < 0.5 || mp.dart2 < 0.1) msg.textContent += (msg.textContent ? ' ' : '') + '男褲:腰圍相對臀圍偏大,褶/省收不出來,此版型不適用(可考慮增加臀圍或改鬆緊帶款)。';
```

renderValuesMenPants 整個函式體換成:

```js
  function renderValuesMenPants(p) {
    $('valuesMenPants').innerHTML = rowsTable([
      ['褲長(股上+股下)', p.pantsLen],
      ['基準值 ☆(臀圍÷12)', p.star],
      ['前/後片基礎寬(H/4+2.5)', p.delta],
      ['前褲襠伸出(☆×2/3)', p.extF],
      ['後褲襠再伸出(☆/2,並下落1)', p.extB],
      ['前片褶寬(腰口剩多少收多少)', p.pleatW],
      ['後腰兩個省(大/小)', r1(p.dart1) + ' / ' + r1(p.dart2) + ' cm'],
      ['前褲腳寬 / 後褲腳寬(全寬)', r1(p.hemF) + ' / ' + r1(p.hemB) + ' cm'],
      ['膝蓋(中檔)寬 前/後', r1(p.kneeF) + ' / ' + r1(p.kneeB) + ' cm'],
      ['腰頭 左/右(寬3)', r1(p.beltLL) + ' / ' + r1(p.beltLR) + ' cm'],
      ['臀圍線位置(橫檔上方☆)', p.hlY],
      ['膝線位置(股下一半再上提5)', p.klY]
    ]);
  }
```

- [ ] **Step 4: 預覽驗證**

`tool.html?r=15`:

1. console 零錯誤、ver=v15。
2. 數值(W76/H94/27/75):

```js
(() => { const p = draftMenPants(76, 94, 27, 75);
  return { delta: p.delta, star: +p.star.toFixed(3), extF: +p.extF.toFixed(2), extB: +p.extB.toFixed(2),
           pleatW: +p.pleatW.toFixed(2), dart1: +p.dart1.toFixed(2), dart2: +p.dart2.toFixed(2),
           hemF: p.hemF, hemB: p.hemB, klY: p.klY, hlY: +p.hlY.toFixed(2), pantsLen: p.pantsLen }; })()
```

預期:`delta=26`、`star=7.833`、`extF=5.22`、`extB=3.92`、`pleatW=4.8`、`dart1=1.84`、`dart2=1.24`、`hemF=22.5`、`hemB=23.5`、`klY=56.5`、`hlY=16.17`、`pantsLen=102`。
3. SVG:ASCII、無 L/A/Q、svgToPdfPage 無 NaN、`%PDF-1.4`;`#mpants` 分頁渲染、下載鈕啟用;W=100/H=94 觸發「褶/省收不出來」警告;舊 id `mpLen`/`mpCuff` 為 null。
4. 7 分頁迴歸。

---

### Task 3: 文件收尾

- [ ] README:「男裝西裝褲公式」段整個換成 TPO 系統表(照 Global Constraints 公式;來源寫「使用者提供之教材《TPO品牌男装设计与制板》图6-10,2026-07-08」;照片讀值可調項:落裆1、省長8、前側腰收1.5、口袋為示意)。
- [ ] STATUS:目前版本 v15;版本記錄 `| v15 | 2026-07-08 | 男褲重做:改用使用者教材 TPO H型單褶西褲系統(含腰頭版片) |`。
- [ ] HANDOFF 整篇覆寫(v15 內容、四個已確認解讀、待核對的次要數字)。
- [ ] 迴歸+交付連結。

## Self-Review 記錄

- Spec 全對應(公式→T1、UI/文案→T2、文件→T3);無佔位符;`beltLL/beltLR/mpInseam` 命名兩側一致;`dartTotal=(delta−extB)−W/4` 與 spec `(△−☆/2)−W/4` 等價(extB=☆/2)。
- 數學抽查:26−0.7−1.5−19=4.8 ✓;(26−3.917)−19=3.083→1.842/1.242 ✓;creaseF=(26−5.22)/2=10.39、kIn=10.39−12.25=−1.86(在前中心線外側,屬正常西褲內縫過中心)✓。
