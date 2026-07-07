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
