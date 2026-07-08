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
 * 試摺紙型:A4 SVG(直式21×29.7/橫式29.7×21,PDF 即 1:1),至少湊 4 個褶單元:
 *   一條放不下就排多條紙條(編號連續,尾端相接黏起來再摺)
 * 原寸摺線版型 pleatFullSVG:整片(總裙寬×主片高)1:1,印出照著燙
 * 紙上一律只放數字,說明文字放頁面(中文)——PDF 產生器僅支援 ASCII 文字
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
  // 直布紋計算(一般人手壓/家用熨燙):總裙寬由「布幅」去湊,不夠寬就接片;
  // 每道接縫兩邊各留 1(共吃 2cm,使用者定值),買布長度 = 片數 ×(上縫份+裙長+下擺縫份+腰頭)
  // (橫布紋整匹送壓褶機是工業做法,本站不採用)
  const joinSeam = 1;
  const lengthNeeded = skirtLen + waistbandW + hemAllow + topSeam;   // 每片布長方向需求
  const panels = waistOK
    ? Math.max(1, Math.ceil((totalWidth - 2 * joinSeam) / (fabricWidth - 2 * joinSeam)))
    : 0;
  const fitsOneWidth = waistOK && panels === 1;
  const fabricLengthM = waistOK ? +((panels * lengthNeeded) / 100).toFixed(2) : 0;

  return {
    waist, ease, yangW, yinD, skirtLen, waistbandW, hemAllow, topSeam, backOpenAllow, fabricWidth,
    type, waistPerPleat, waistOK,
    effWaist, pleatUnit, numPleats, flatWidth, finishedWaist, waistDiff,
    totalWidth, lengthNeeded, fitsOneWidth, fabricLengthM,
    panels, joinSeam,
    bodyHeight: topSeam + skirtLen + hemAllow   // 主片高(腰頭另裁)
  };
}

/* ---- A4 試摺紙型 ---- */
const PLEAT_ST_M = 'fill="none" stroke="#c0392b" stroke-width="0.06" stroke-dasharray="0.6 0.25 0.08 0.25"';
const PLEAT_ST_V = 'fill="none" stroke="#2467a8" stroke-width="0.06" stroke-dasharray="0.5 0.3"';
const PLEAT_ST_CUT = 'fill="none" stroke="#111111" stroke-width="0.08"';
const PLEAT_ST_THIN = 'fill="none" stroke="#555555" stroke-width="0.04"';

/* 紙上一律只放數字(頁面用中文說明對照;PDF 產生器僅支援 ASCII 文字)
 * 至少 4 個褶單元:單條放不下就排成多條紙條,編號連續,尾端相接黏起來再摺 */
const PLEAT_F = n => +(+n).toFixed(2);
const pleatLn = (x1, y1, x2, y2, st) =>
  `<line x1="${PLEAT_F(x1)}" y1="${PLEAT_F(y1)}" x2="${PLEAT_F(x2)}" y2="${PLEAT_F(y2)}" ${st}/>`;
const pleatTx = (x, y, s, size, anchor, color) =>
  `<text x="${PLEAT_F(x)}" y="${PLEAT_F(y)}" fill="${color || '#333333'}" font-size="${size || 0.7}" text-anchor="${anchor || 'start'}">${s}</text>`;
// 水平小箭頭(線段+兩撇箭頭,指向 x2)
function pleatArrow(x1, x2, y) {
  const d = x2 > x1 ? 1 : -1;
  return pleatLn(x1, y, x2, y, PLEAT_ST_THIN) +
         pleatLn(x2, y, x2 - d * 0.35, y - 0.18, PLEAT_ST_THIN) +
         pleatLn(x2, y, x2 - d * 0.35, y + 0.18, PLEAT_ST_THIN);
}
// 一個褶單元的摺線+摺向箭頭(u=單元左緣x,含編號)
function pleatUnitLines(p, u, yTop, yBot, num) {
  const yang = p.yangW, yin = p.yinD;
  let s = pleatTx(u + p.pleatUnit / 2, yTop - 0.22, String(num), 0.55, 'middle', '#111111');
  if (p.type === 'box') {
    const c = u + yang / 2 + 2 * yin;                        // 兩側摺份於此相會
    s += pleatLn(u + yang / 2, yTop, u + yang / 2, yBot, PLEAT_ST_M);
    s += pleatLn(u + yang / 2 + yin, yTop, u + yang / 2 + yin, yBot, PLEAT_ST_V);
    s += pleatLn(u + yang / 2 + 3 * yin, yTop, u + yang / 2 + 3 * yin, yBot, PLEAT_ST_V);
    s += pleatLn(u + yang / 2 + 4 * yin, yTop, u + yang / 2 + 4 * yin, yBot, PLEAT_ST_M);
    s += pleatArrow(c, u + yang / 2 + 0.25, yTop + 1.0);     // 左摺份往左收
    s += pleatArrow(c, u + yang / 2 + 4 * yin - 0.25, yTop + 1.0); // 右摺份往右收
  } else {                                                   // knife / accordion
    s += pleatLn(u + yang, yTop, u + yang, yBot, PLEAT_ST_M);
    s += pleatLn(u + yang + yin, yTop, u + yang + yin, yBot, PLEAT_ST_V);
    s += pleatArrow(u + p.pleatUnit - 0.1, u + yang + 0.25, yTop + 1.0); // 摺份往左壓
  }
  return s;
}
// 山摺/谷摺示意小圖(免文字):線樣+尖角圖形
function pleatLegend(y1, y2) {
  let s = pleatLn(1, y1, 3.0, y1, PLEAT_ST_M);
  s += pleatLn(3.5, y1 + 0.28, 3.9, y1 - 0.3, PLEAT_ST_M) + pleatLn(3.9, y1 - 0.3, 4.3, y1 + 0.28, PLEAT_ST_M);
  s += pleatLn(1, y2, 3.0, y2, PLEAT_ST_V);
  s += pleatLn(3.5, y2 - 0.3, 3.9, y2 + 0.28, PLEAT_ST_V) + pleatLn(3.9, y2 + 0.28, 4.3, y2 - 0.3, PLEAT_ST_V);
  return s;
}
// 10cm 列印校正尺標
function pleatRuler(x0, yR) {
  let s = pleatLn(x0, yR, x0 + 10, yR, PLEAT_ST_CUT);
  for (let i = 0; i <= 10; i++) {
    const tall = (i % 5 === 0) ? 0.55 : 0.35;
    s += pleatLn(x0 + i, yR, x0 + i, yR - tall, PLEAT_ST_CUT);
  }
  s += pleatTx(x0, yR - 0.75, '0', 0.5) + pleatTx(x0 + 5, yR - 0.75, '5', 0.5, 'middle') +
       pleatTx(x0 + 10, yR - 0.75, '10', 0.5, 'middle') + pleatTx(x0 + 10.5, yR + 0.15, 'cm', 0.5);
  return s;
}

function pleatSheetSVG(p) {
  const U = p.pleatUnit, wpp = p.waistPerPleat;
  const f = PLEAT_F, x0 = 1;
  // 版面:直式/橫式都算一次,取「湊得到4摺、紙條較高」者;單條放得下4摺就一條
  function layout(W, H) {
    const k = Math.floor((W - 2) / U);            // 一條放得下的褶單元數
    if (k < 1) return null;
    const avail = H - 4.4 - 2.4;                  // 扣掉頭部(圖例+對照條)與底部尺標
    const rowsWant = Math.ceil(4 / k);
    const rows = Math.max(1, Math.min(rowsWant, Math.floor(avail / 4.9))); // 紙條最矮3.2+間距1.7
    const stripH = Math.min(6.5, avail / rows - 1.7);
    return { W, H, k, rows, stripH, units: k * rows };
  }
  const cand = [layout(21, 29.7), layout(29.7, 21)].filter(Boolean);
  if (!cand.length) return null;                  // 連橫式一條都放不下
  cand.sort((a, b) => Math.min(b.units, 4) - Math.min(a.units, 4) || b.stripH - a.stripH);
  const L = cand[0];

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${f(L.W)}cm" height="${f(L.H)}cm" viewBox="0 0 ${f(L.W)} ${f(L.H)}" font-family="Helvetica, Arial, sans-serif">`;
  // 圖例(無文字):紅一點一劃+凸角=山摺;藍虛線+凹角=谷摺
  s += pleatLegend(1.1, 2.2);
  // 摺完寬度對照條(一條紙條摺完應該要等於這個長度)
  if (p.waistOK) {
    const bw = L.k * wpp, yB = 3.4;
    s += pleatLn(x0, yB, x0 + bw, yB, PLEAT_ST_CUT);
    s += pleatLn(x0, yB - 0.3, x0, yB + 0.3, PLEAT_ST_CUT) + pleatLn(x0 + bw, yB - 0.3, x0 + bw, yB + 0.3, PLEAT_ST_CUT);
    s += pleatTx(x0 + bw + 0.4, yB + 0.2, `${f(bw)} cm`, 0.6, 'start', '#111111');
  }
  // 紙條(每條 k 個單元,編號連續;多條時依編號尾端相接)
  const y0 = 4.4;
  for (let r = 0; r < L.rows; r++) {
    const yTop = y0 + r * (L.stripH + 1.7) + 0.75;
    const yBot = yTop + L.stripH;
    s += pleatLn(x0, yTop, x0 + L.k * U, yTop, PLEAT_ST_CUT) + pleatLn(x0, yBot, x0 + L.k * U, yBot, PLEAT_ST_CUT);
    s += pleatLn(x0, yTop, x0, yBot, PLEAT_ST_CUT) + pleatLn(x0 + L.k * U, yTop, x0 + L.k * U, yBot, PLEAT_ST_CUT);
    for (let i = 0; i < L.k; i++)
      s += pleatUnitLines(p, x0 + i * U, yTop, yBot, r * L.k + i + 1);
  }
  // 列印校正尺標
  s += pleatRuler(x0, y0 + L.rows * (L.stripH + 1.7) + 1.0);
  s += `</svg>`;
  return s;
}

/* ---- 原寸摺線版型(整片,1:1 輸出照著燙) ---- */
function pleatFullSVG(p) {
  if (!p.waistOK) return null;
  const U = p.pleatUnit, n = p.numPleats;
  const wBody = p.flatWidth, wTot = p.totalWidth, hTot = p.bodyHeight;
  const f = PLEAT_F;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${f(wTot + 3)}cm" height="${f(hTot + 4)}cm" viewBox="-1.5 -2 ${f(wTot + 3)} ${f(hTot + 4)}" font-family="Helvetica, Arial, sans-serif">`;
  // 外框(裁切線)
  s += pleatLn(0, 0, wTot, 0, PLEAT_ST_CUT) + pleatLn(0, hTot, wTot, hTot, PLEAT_ST_CUT);
  s += pleatLn(0, 0, 0, hTot, PLEAT_ST_CUT) + pleatLn(wTot, 0, wTot, hTot, PLEAT_ST_CUT);
  // 腰縫線(上)與下擺摺線(下)
  s += pleatLn(0, p.topSeam, wTot, p.topSeam, PLEAT_ST_THIN);
  s += pleatLn(0, p.topSeam + p.skirtLen, wTot, p.topSeam + p.skirtLen, PLEAT_ST_THIN);
  // 開口縫份分界(右端)
  s += pleatLn(wBody, 0, wBody, hTot, PLEAT_ST_THIN);
  // 各褶摺線(直落全高,含下擺縫份一起燙)
  for (let i = 0; i < n; i++)
    s += pleatUnitLines(p, i * U, 0, hTot, i + 1);
  // 圖例+總寬/總高數字+校正尺標
  s += pleatLegend(-1.55, -0.75);
  s += pleatTx(wTot / 2, -1.0, `${f(wTot)} cm`, 0.9, 'middle', '#111111');
  s += pleatTx(wTot + 0.25, hTot / 2, `${f(hTot)}`, 0.7, 'start', '#111111');
  s += pleatRuler(6, -0.9);
  s += `</svg>`;
  return s;
}

if (typeof module !== 'undefined') {
  module.exports = { draftPleatSkirt, pleatSheetSVG, pleatFullSVG };
}
