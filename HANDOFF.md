# 專案交接文件(給下一個 AI 助手/開發者)

## 專案概要

「新文化式原型產生器」— 靜態網站,輸入身體尺寸即時產生服裝版型(SVG 縮圖 + 1:1 向量 PDF 下載)。純前端、無框架、無建置流程;除首頁 3D 外完全離線可用。

- 已部署:https://8kvzfyz59n-sudo.github.io/hell/ (GitHub repo: 8kvzfyz59n-sudo/hell, GitHub Pages, main branch root)
- 目前版本:v9(tool.html 標記)

## 檔案結構(只有這些檔案需要部署)

| 檔案 | 用途 |
|---|---|
| index.html | 首頁:Three.js 旋轉白瓷人台,hover 上/下半身出現選項,連到 tool.html 錨點 |
| tool.html | 打版工具主頁(4分頁:上半身/直筒裙/圓裙/褲子) |
| app.js | 製圖計算+SVG繪製+自製PDF產生器+UI(分頁/錨點/欄位綁定) |
| pants.js | 褲子模組(必須在 app.js 之前載入) |
| style.css | 樣式(含分頁與教學摺疊區) |
| README.md | 公式與來源 |
| css/、js/ 子資料夾 | **廢棄舊結構,勿部署勿編輯** |

## 版型與公式來源

1. 上半身原型+袖:新文化式(文化服裝學院2000年版)。線性尺寸已對照官方速查表(B82~88)驗證一致。https://maisondeas.com/pattern-block-new-bunka/
2. 直筒裙:簡化文化式。https://maisondeas.com/pencil-skirt-pattern/
3. 圓裙:圓周率法 r=2W/(nπ),n=1~4。https://maisondeas.com/circle-skirt-pattern/
4. 褲子:ストレートパンツ法,長褲/5分/3分熱褲+鬆緊帶版。https://maisondeas.com/straight-pants-pattern/

## 架構要點(改код前必讀)

1. **座標系**:cm 為單位,y 向下。SVG 直接用 cm 作 viewBox 單位,width/height 屬性帶 cm → SVG 本身就是實寸。
2. **PDF 是自製產生器**(app.js 內 svgToPdfPage/buildPdf),不用任何函式庫。限制:
   - path 只支援 M + C(貝茲)指令——畫直線用 lineC()、圓弧用 arcC() 轉成退化/近似貝茲,**絕不能在 SVG path 用 L/A/Q 指令**
   - 文字只支援 ASCII(Helvetica),圖面標籤禁用中文
   - 解析同時支援 `<line/>` 與 `<line></line>` 兩種序列化(歷史bug:瀏覽器 outerHTML 會改寫自閉合標籤,曾導致 PDF 只有文字沒線條)
3. **下載一律用原始 SVG 字串**(cur.xxxSvg),不要從 DOM outerHTML 取。
4. **分頁錨點**:#top/#tight/#circle/#pants,activateTab() 處理;輸入欄用 data-tabs 屬性綁定顯示。
5. **快取**:script src 帶 ?v=N,每次改版遞增並同步改 ver 標記。
6. 曲線平滑用 Catmull-Rom(crPathD),曲線長用數值積分(crLen)。

## 已知注意事項

- B≥90 前袖窿需手動修順(頁面有提示,對應教材說明)
- 袖山いせ約7%(新文化式特性,偏多是正常)
- 直筒裙省長(後13/12前9/10)與褲省長是教科書定值,特殊體型需手調
- GitHub Pages 部署偶發 "Deployment failed, try again later" → Actions 頁 Re-run failed jobs 即可
- 首頁 Three.js 走 cdnjs(r128),斷網時首頁降級為靜態(標題+按鈕仍可用)

## 待辦/擴充構想(未做)

- 縫份自動外擴、A4 分頁拼貼列印、兒童原型、袖型變化(泡泡袖等)、尺寸表存檔
