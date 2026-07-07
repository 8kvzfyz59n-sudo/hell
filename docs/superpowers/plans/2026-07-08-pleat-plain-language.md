# 第 5 分頁白話化實作計畫(v14)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 第 5 分頁所有中文文案白話化(給非服裝行業的人),術語保留+白話括號,版號 v14。

**Architecture:** 純文案更動:tool.html(欄位 label、摺型選單、教學區、紙型 panel 常駐對照行)+ app.js(renderValuesPleat 表、手風琴警告)。計算與紙型圖面不動。

**Tech Stack:** 無新技術。

## Global Constraints

- 只動文字,不動任何計算/DOM id/函式簽名。
- 版號:script 五行 `?v=14`、`<span id="ver">v14</span>`。
- 驗證:preview `tool.html?r=14`,console 零錯誤 + 第 5 分頁功能迴歸。
- 無 git、無 Node(同前;HANDOFF 有記)。

---

### Task 1: 全部文案更動 + 驗證(單一任務,不可分割)

**Files:**
- Modify: `tool.html`(第 5 分頁欄位/教學/panel note/script v14/ver)
- Modify: `app.js`(renderValuesPleat、警告字串)

- [ ] **Step 1: tool.html 欄位 label(逐一 Edit,old→new)**

| old(label 內文) | new |
|---|---|
| `淨腰圍` | `淨腰圍(實際量到的腰圍)` |
| `鬆份` | `鬆份(想多留的寬鬆量)` |
| `陽折寬(表面褶寬)` | `陽摺寬(表面看得到的摺寬)` |
| `陰折深(藏摺深度)` | `陰摺深(摺進去藏在下面的深度)` |
| `裙長`(plLen 那欄) | `裙長(腰下到裙襬)` |
| `腰頭寬` | `腰頭寬(腰帶那一圈的寬度)` |
| `下擺縫份` | `下擺縫份(裙襬折邊要留的布)` |
| `布幅寬` | `布幅寬(買的布本身有多寬)` |

摺型選單三個 option 文字:`刀褶(摺痕都往同一邊)`、`箱褶(兩摺相對,像禮盒摺)`、`手風琴褶(一凸一凹交錯)`。

- [ ] **Step 2: 紙型 panel 常駐對照行**

`<div id="pleatSheetBox" class="svgbox"></div>` 之前插入:

```html
      <p class="note">紙型上的線條:<b style="color:#c0392b">紅色一點一劃的線=山摺(凸起來,摺痕朝自己)</b>;<b style="color:#2467a8">藍色虛線=谷摺(凹下去,往內摺)</b>。英文對照見下方教學。</p>
```

- [ ] **Step 3: 教學區兩個 details 整段置換**

「百褶裙用布量:計算邏輯」整個 `<details>` 換成:

```html
      <details>
        <summary>這個計算機在算什麼?(白話版)</summary>
        <ol>
          <li>百摺裙就是把一塊「比腰圍寬很多」的長方形布,一摺一摺收到剛好圍住腰。這裡幫你算:那塊布到底要多寬。</li>
          <li>兩個關鍵名詞:<b>陽摺</b>=摺好後表面看得到的那一段寬度;<b>陰摺</b>=摺進去、藏在下面看不到的深度。</li>
          <li>做一個摺要吃掉的布,依摺法不同:<b>刀褶</b>(摺痕都往同一邊)=陽摺+2×陰摺;<b>箱褶</b>(兩摺相對,像禮盒包裝的摺法)=陽摺+4×陰摺;<b>手風琴褶</b>(一凸一凹交錯)=陽摺+陰摺。</li>
          <li>要摺幾個?用(腰圍+鬆份)除以「一個摺在腰上佔的寬度」,小數無條件進位——寧可多一點,不能圍不住。</li>
          <li>布的總寬=摺數×每摺吃掉的布,再加後面開口的縫份。這就是「整塊裙子布料需要多寬」的答案。</li>
          <li>上下方向:裙長+腰頭+摺邊縫份,如果小於買來的布幅寬,布橫著擺就能一整片裁完,不用接布。</li>
          <li>陽摺越窄、陰摺越深=皺摺越密越澎;陽摺越寬、陰摺越淺=越平順。拿不定主意就先印試摺紙型摺摺看。</li>
        </ol>
      </details>
```

「A4 試摺紙型:怎麼印、怎麼摺」整個 `<details>` 換成:

```html
      <details>
        <summary>A4 試摺紙型:怎麼印、怎麼摺(含英文對照)</summary>
        <ol>
          <li>按「下載 PDF」印出來。<b>列印時一定要選「實際大小」或「100%」</b>,不要選「符合頁面大小」,不然尺寸會跑掉。</li>
          <li>印好先量最下面那條尺:上面寫 PRINT CHECK 的線段應該剛好 10 公分。不是 10 公分就是印表機縮放了,回去改設定重印。</li>
          <li>紙上英文對照:<b>MOUNTAIN(紅色一點一劃線)=山摺</b>,摺起來凸向自己、摺痕在表面;<b>VALLEY(藍色虛線)=谷摺</b>,往內凹摺;<b>CUT ALONG FRAME=沿黑框剪下</b>;<b>FOLDED WIDTH=全部摺完應該剛好這麼寬</b>(拿摺好的紙對上去驗證);數字 1、2、3 是摺的順序;小箭頭是摺份要壓過去的方向。</li>
          <li>箱褶印出來是「工字褶」(兩條摺線在表面相接);想要外凸盒子那種一般箱褶,把紙翻面照摺就是了。</li>
          <li>摺完覺得太密、太淺、不夠澎——回來改「陽摺寬」「陰摺深」的數字,重印再摺,滿意了再去裁布。紙很便宜,布不便宜。</li>
        </ol>
      </details>
```

- [ ] **Step 4: app.js 文案**

renderValuesPleat 的 rowsTable 陣列整組換成:

```js
      ['摺型', typeName],
      ['腰圍+鬆份(裙頭要做到的長度)', p.effWaist],
      ['做一個摺要吃掉的布寬(' + unitFormula + ')', p.pleatUnit],
      ['一個摺在腰上佔的寬度' + (p.type === 'accordion' ? '(陽−陰)' : '(=陽摺)'), p.waistPerPleat],
      ['總共要摺幾個摺(無條件進位)', p.waistOK ? p.numPleats : '—(陽≤陰,見上方提示)'],
      ['全部摺份攤平的布寬', p.flatWidth],
      ['全部摺好後的實際腰圍', p.finishedWaist],
      ['比目標腰圍多出來的(進位造成)', r1(p.waistDiff)],
      ['整塊裙布需要的總寬(含開口縫份)', p.totalWidth],
      ['上下方向需要的布(裙長+腰頭+縫份)', p.lengthNeeded],
      ['布的寬度夠不夠一整片裁', !p.waistOK ? '—' : p.fitsOneWidth ? '夠(布幅' + p.fabricWidth + 'cm)' : '不夠,要接布或改直裁'],
      ['建議購買布長', p.fabricLengthM + ' m']
```

警告字串換成:

```js
    if (!pl.waistOK) msg.textContent += (msg.textContent ? ' ' : '') + '手風琴褶「表面看得到的摺寬(陽)」必須大於「藏起來的深度(陰)」,不然摺完圍不住腰;兩者一樣寬就是純手風琴褶,要靠鬆緊帶或讓裙襬自然張開。';
```

- [ ] **Step 5: 版號 v14**(script 五行 + ver 標記)

- [ ] **Step 6: 驗證**

`tool.html?r=14`:console 零錯誤、ver=v14;#pleat 分頁:欄位 label 抽查 3 個、values 表第一列與「整塊裙布需要的總寬」列存在、accordion 陽2陰3 觸發新警告文字、紙型仍正常產出、下載按鈕啟用;其餘 6 分頁切換迴歸。

- [ ] **Step 7: 文件**

STATUS:版本記錄加 `| v14 | 2026-07-08 | 第5分頁文案白話化(受眾:非服裝行業) |`,目前版本改 v14。HANDOFF 覆寫(白話化完成、README 不動、下一步:使用者驗收+實印)。另補一條 STATUS 待辦:`- [ ] 其他分頁文案白話化(使用者尚未要求,先不做)`——不,YAGNI,不加。

## Self-Review 記錄

Spec 六點全對應(1→Step1、2→Step4、3→Step3、4→Step2、5→Step4、6→Step5);無佔位符;id/函式名未動。
