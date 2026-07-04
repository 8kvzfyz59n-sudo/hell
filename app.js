/* =========================================================
 * 新文化式原型(文化服裝學院 2000年版 成人女子原型)
 * 單位:cm。座標系:x 向右、y 向下,後中心頂點 A = (0,0)
 * 公式來源:文化ファッション大系 服飾造形講座①/
 * https://maisondeas.com/pattern-block-new-bunka/
 * ========================================================= */

const DEG = d => d * Math.PI / 180;

/* ---------- 幾何工具 ---------- */
// Catmull-Rom 轉三次貝茲,回傳各段 [p1,c1,c2,p2]
function crSegs(pts) {
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i],
          p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    segs.push([p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2]);
  }
  return segs;
}
function crPathD(pts) {
  const segs = crSegs(pts);
  if (!segs.length) return '';
  const f = n => +n.toFixed(3);
  let d = `M ${f(segs[0][0][0])} ${f(segs[0][0][1])}`;
  for (const [, c1, c2, p2] of segs)
    d += ` C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(p2[0])} ${f(p2[1])}`;
  return d;
}
function bezPoint(p1, c1, c2, p2, t) {
  const u = 1 - t;
  return [
    u*u*u*p1[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p2[0],
    u*u*u*p1[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p2[1]
  ];
}
// 曲線長(數值積分)
function crLen(pts, n = 80) {
  let L = 0;
  for (const [p1, c1, c2, p2] of crSegs(pts)) {
    let prev = p1;
    for (let i = 1; i <= n; i++) {
      const q = bezPoint(p1, c1, c2, p2, i / n);
      L += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      prev = q;
    }
  }
  return L;
}
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/* ---------- 身片製圖 ---------- */
function draftBodice(B, W, backLen) {
  const bw       = B / 2 + 6;          // 身幅
  const blY      = B / 12 + 13.7;      // A~BL
  const backW    = B / 8 + 7.4;        // 背幅
  const chestW   = B / 8 + 6.2;        // 胸幅
  const frontTopY= blY - (B / 5 + 8.3);// 前身片上端(B點)
  const wlY      = backLen;            // WL
  const neckW    = B / 24 + 3.4;       // ◎ 前領口幅
  const fNeckD   = neckW + 0.5;        // 前領口深
  const bNeckW   = neckW + 0.2;        // 後領口幅
  const shDart   = B / 32 - 0.8;       // 後肩省
  const chDartDeg= B / 4 - 2.5;        // 胸省角度
  const b32      = B / 32;

  const A  = [0, 0];
  const C  = [backW, blY];
  const E  = [backW / 2 + 1, 8];                 // A下8cm水平線中點往背幅側1cm
  const fChestX = bw - chestW;                   // 胸幅線 x
  const F  = [fChestX - b32, blY];
  const gY = (8 + blY) / 2 + 0.5;
  const G  = [F[0], gY];
  const sideX = (F[0] + backW) / 2;              // 脇線
  const BP = [bw - (chestW / 2 + 0.7), blY];

  // 前領口・前肩
  const SNPf = [bw - neckW, frontTopY];
  const FNP  = [bw, frontTopY + fNeckD];
  const a22  = DEG(22);
  const shLenF = (chestW - neckW) / Math.cos(a22) + 1.8; // □
  const SPf  = [SNPf[0] - shLenF * Math.cos(a22), SNPf[1] + shLenF * Math.sin(a22)];

  // 後領口・後肩
  const SNPb = [bNeckW, -bNeckW / 3];
  const a18  = DEG(18);
  const shLenB = shLenF + shDart;
  const SPb  = [SNPb[0] + shLenB * Math.cos(a18), SNPb[1] + shLenB * Math.sin(a18)];

  // 後肩省(E 直上與肩線交點沿肩線移 1.5cm)
  const tE = (E[0] - SNPb[0]) / Math.cos(a18);
  const sd1 = [SNPb[0] + (tE + 1.5) * Math.cos(a18), SNPb[1] + (tE + 1.5) * Math.sin(a18)];
  const sd2 = [sd1[0] + shDart * Math.cos(a18), sd1[1] + shDart * Math.sin(a18)];

  // 胸省:G-BP 線往肩側旋轉 (B/4-2.5)°
  const vx = G[0] - BP[0], vy = G[1] - BP[1];
  const r = Math.hypot(vx, vy), phi = Math.atan2(vy, vx), th = DEG(chDartDeg);
  const G2 = [BP[0] + r * Math.cos(phi + th), BP[1] + r * Math.sin(phi + th)];

  // 袖窿導引點(45°)
  const tri = (F[0] - sideX) / 3;                 // ▲
  const s2 = Math.SQRT1_2;
  const gdF = [F[0] - (tri + 0.5) * s2, blY - (tri + 0.5) * s2];
  const gdB = [backW + (tri + 0.8) * s2, blY - (tri + 0.8) * s2];
  const UA  = [sideX, blY];                       // 袖窿底

  // 袖窿曲線
  const ahBackPts   = [SPb, [backW, (SPb[1] + gY) / 2 + 1], [backW, gY], gdB, UA];
  const ahFrontUp   = [SPf, [fChestX, SPf[1] + (G2[1] - SPf[1]) * 0.5], G2];
  const ahFrontLow  = [G, gdF, UA];
  const ahF = crLen(ahFrontUp) + crLen(ahFrontLow);   // 前AH(胸省閉合)
  const ahB = crLen(ahBackPts);                       // 後AH

  // 腰省(a~f)
  const totalDart = bw - (W / 2 + 3);
  const pct = { a: .14, b: .15, c: .11, d: .35, e: .18, f: .07 };
  const dartW = {};
  for (const k in pct) dartW[k] = totalDart * pct[k];
  const darts = [
    { name: 'a', cx: BP[0],       apexY: blY + 2.5, w: dartW.a },
    { name: 'b', cx: F[0] + 1.5,  apexY: blY,       w: dartW.b },
    { name: 'c', cx: sideX,       apexY: blY,       w: dartW.c },
    { name: 'd', cx: backW - 1,   apexY: gY,        w: dartW.d },
    { name: 'e', cx: E[0] - 0.5,  apexY: blY - 2,   w: dartW.e }
  ];
  // f:後中心縮份

  return {
    B, W, backLen,
    bw, blY, backW, chestW, frontTopY, wlY, neckW, fNeckD, bNeckW,
    shDart, chDartDeg, b32, totalDart, dartW, darts,
    A, C, E, F, G, G2, BP, sideX, fChestX,
    SNPf, FNP, SPf, SNPb, SPb, sd1, sd2,
    gdF, gdB, UA, gY,
    ahBackPts, ahFrontUp, ahFrontLow, ahF, ahB
  };
}

/* ---------- 袖製圖 ---------- */
function draftSleeve(bod, sleeveLen) {
  const { blY, SPf, SPb, ahF, ahB, B } = bod;
  const capH = (blY - (SPf[1] + SPb[1]) / 2) * 5 / 6;   // 袖山高
  const star = B >= 95 ? 0.3 : B >= 90 ? 0.2 : B >= 85 ? 0.1 : 0;
  const slantF = ahF, slantB = ahB + 1 + star;
  const wf = Math.sqrt(Math.max(slantF * slantF - capH * capH, 1)); // 前袖幅
  const wb = Math.sqrt(Math.max(slantB * slantB - capH * capH, 1)); // 後袖幅

  const top = [0, 0];
  const fEnd = [-wf, capH], bEnd = [wb, capH];

  // 斜線上導引點(垂直斜線之外/內偏移,依教材標準值)
  function off(a, b, t, d) {
    const p = lerp(a, b, t);
    const ux = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
    const uy = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
    let nx = uy, ny = -ux;                 // 取向上之法線
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
  const ease = capLen - (ahF + ahB);      // 縮縫份(いせ)
  const elY = sleeveLen / 2 + 2.5;        // 肘線 EL

  return { capH, wf, wb, slantF, slantB, star, top, fEnd, bEnd, capPts, capLen, ease, sleeveLen, elY };
}

/* ---------- SVG 產生 ---------- */
const fmt = n => +n.toFixed(2);

function svgOpen(minX, minY, w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(w)}cm" height="${fmt(h)}cm" viewBox="${fmt(minX)} ${fmt(minY)} ${fmt(w)} ${fmt(h)}" font-family="Helvetica, Arial, sans-serif">`;
}
const S = {
  outline: 'fill="none" stroke="#111111" stroke-width="0.1"',
  guide:   'fill="none" stroke="#999999" stroke-width="0.03" stroke-dasharray="0.4 0.25"',
  dart:    'fill="none" stroke="#c0392b" stroke-width="0.07"',
  label:   'fill="#333333" font-size="0.75"',
  small:   'fill="#777777" font-size="0.6"'
};
const line = (a, b, st) => `<line x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" ${st}/>`;
const path = (d, st) => `<path d="${d}" ${st}/>`;
const text = (p, s, st = S.label, anchor = 'start') =>
  `<text x="${fmt(p[0])}" y="${fmt(p[1])}" ${st} text-anchor="${anchor}">${s}</text>`;
const dot = p => `<circle cx="${fmt(p[0])}" cy="${fmt(p[1])}" r="0.12" fill="#111111"/>`;

function bodiceSVG(b) {
  const m = 2.5;
  const minX = -m, minY = Math.min(b.SNPb[1], b.frontTopY) - m;
  const w = b.bw + 2 * m, h = b.wlY - minY + m;
  let s = svgOpen(minX, minY, w, h);

  // 導引線
  s += line([0, 0], [0, b.blY], S.guide);                       // 後中心上段
  s += line([b.bw, b.frontTopY], [b.bw, b.blY], S.guide);       // 前中心上段
  s += line([0, b.blY], [b.bw, b.blY], S.guide);                // BL
  s += line([0, b.wlY], [b.bw, b.wlY], S.guide);                // WL
  s += line([b.backW, 8], [b.backW, b.blY], S.guide);           // 背幅線
  s += line([b.fChestX, b.frontTopY], [b.fChestX, b.blY], S.guide); // 胸幅線
  s += line([b.sideX, b.blY], [b.sideX, b.wlY], S.guide);       // 脇線
  s += line([0, 8], [b.backW, 8], S.guide);                     // A下8cm(E)
  s += line([b.A[0], 0], [b.backW, 0], S.guide);
  s += line([b.bw - b.chestW, b.frontTopY], [b.bw, b.frontTopY], S.guide);

  // 後片輪廓
  const fW = b.dartW.f;
  s += path(crPathD([b.SNPb, [b.bNeckW * 0.45, -0.05], b.A]), S.outline);   // 後領口
  s += line(b.A, [0, b.blY], S.outline);                                     // 後中心
  s += line([0, b.blY], [fW, b.wlY], S.outline);                             // 後中心縮份 f
  s += line([fW, b.wlY], [b.sideX, b.wlY], S.outline);                       // 後腰線
  s += line(b.SNPb, b.SPb, S.outline);                                       // 後肩
  s += path(crPathD(b.ahBackPts), S.outline);                                // 後袖窿

  // 前片輪廓
  s += path(crPathD([b.SNPf, [b.SNPf[0] + b.neckW * 0.25, b.frontTopY + b.fNeckD * 0.55], b.FNP]), S.outline); // 前領口
  s += line(b.FNP, [b.bw, b.wlY], S.outline);                                // 前中心
  s += line([b.bw, b.wlY], [b.sideX, b.wlY], S.outline);                     // 前腰線
  s += line(b.SNPf, b.SPf, S.outline);                                       // 前肩
  s += path(crPathD(b.ahFrontUp), S.outline);                                // 前袖窿(上)
  s += path(crPathD(b.ahFrontLow), S.outline);                               // 前袖窿(下)
  s += line([b.sideX, b.blY], [b.sideX, b.wlY], S.outline);                  // 脇線

  // 胸省
  s += line(b.BP, b.G, S.dart);
  s += line(b.BP, b.G2, S.dart);
  // 後肩省
  s += line(b.sd1, b.E, S.dart);
  s += line(b.sd2, b.E, S.dart);
  // 腰省 a~e
  for (const d of b.darts) {
    const apex = [d.cx, d.apexY];
    s += line(apex, [d.cx - d.w / 2, b.wlY], S.dart);
    s += line(apex, [d.cx + d.w / 2, b.wlY], S.dart);
    s += text([d.cx, b.wlY + 0.9], d.name, S.small, 'middle');
  }
  s += text([fW / 2, b.wlY + 0.9], 'f', S.small, 'middle');

  // 記號
  s += dot(b.BP) + text([b.BP[0] + 0.3, b.BP[1] - 0.3], 'BP');
  s += dot(b.SPf) + text([b.SPf[0] - 1.4, b.SPf[1] - 0.3], 'SP');
  s += dot(b.SPb) + text([b.SPb[0] + 0.3, b.SPb[1] - 0.3], 'SP');
  s += dot(b.G) + text([b.G[0] + 0.25, b.G[1]], 'G');
  s += dot(b.E) + text([b.E[0] + 0.2, b.E[1] - 0.3], 'E');
  s += text([-1.9, 0.2], 'A') + text([-1.9, b.blY + 0.2], 'BL') + text([-1.9, b.wlY + 0.2], 'WL');
  s += text([b.bw + 0.4, b.blY + 0.2], 'BL') + text([b.bw + 0.4, b.wlY + 0.2], 'WL');
  s += text([b.backW / 2, b.blY + 2.2], 'BACK', S.small, 'middle');
  s += text([b.bw - b.chestW / 2, b.blY + 2.2], 'FRONT', S.small, 'middle');
  s += `</svg>`;
  return s;
}

function sleeveSVG(sl) {
  const m = 2.5;
  const capTop = Math.min(...sl.capPts.map(p => p[1]));
  const minX = -sl.wf - m, minY = capTop - m;
  const w = sl.wf + sl.wb + 2 * m, h = sl.sleeveLen - minY + m;
  let s = svgOpen(minX, minY, w, h);

  // 導引線
  s += line([-sl.wf, sl.capH], [sl.wb, sl.capH], S.guide);          // 袖幅線
  s += line([0, 0], [0, sl.sleeveLen], S.guide);                    // 袖中心
  s += line([-sl.wf, sl.elY], [sl.wb, sl.elY], S.guide);            // EL
  s += line(sl.top, sl.fEnd, S.guide);                              // 前斜線
  s += line(sl.top, sl.bEnd, S.guide);                              // 後斜線
  s += line([-sl.wf / 2, sl.capH], [-sl.wf / 2, sl.sleeveLen], S.guide); // 前折線
  s += line([sl.wb / 2, sl.capH], [sl.wb / 2, sl.sleeveLen], S.guide);   // 後折線

  // 輪廓
  s += path(crPathD(sl.capPts), S.outline);                         // 袖山
  s += line(sl.fEnd, [-sl.wf, sl.sleeveLen], S.outline);            // 前袖下
  s += line(sl.bEnd, [sl.wb, sl.sleeveLen], S.outline);             // 後袖下
  s += line([-sl.wf, sl.sleeveLen], [sl.wb, sl.sleeveLen], S.outline); // 袖口

  // 記號
  s += dot(sl.top) + text([0.25, -0.5], 'SP');
  s += text([-sl.wf / 2, sl.capH - 0.5], 'FRONT', S.small, 'middle');
  s += text([sl.wb / 2, sl.capH - 0.5], 'BACK', S.small, 'middle');
  s += text([sl.wb + 0.3, sl.capH + 0.2], 'SBL', S.small);
  s += text([sl.wb + 0.3, sl.elY + 0.2], 'EL', S.small);
  s += `</svg>`;
  return s;
}

/* =========================================================
 * 極簡向量 PDF 產生器(免外部函式庫,離線可用)
 * 直接把本站產生的 SVG 轉為 PDF 繪圖指令,1cm = 28.3465pt
 * ========================================================= */
const PT = 28.3465;

function hexRGB(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
    .map(v => v.toFixed(3));
}

function svgToPdfPage(svgStr) {
  const vb = svgStr.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
  const minX = +vb[1], minY = +vb[2], w = +vb[3], h = +vb[4];
  const X = x => ((x - minX) * PT).toFixed(2);
  const Y = y => ((h - (y - minY)) * PT).toFixed(2);
  const ops = [];

  function strokeStyle(attrs) {
    const sw = attrs.match(/stroke-width="([\d.]+)"/);
    const st = attrs.match(/stroke="#([0-9a-fA-F]+)"/);
    const da = attrs.match(/stroke-dasharray="([\d. ]+)"/);
    let s = `${((sw ? +sw[1] : 0.05) * PT).toFixed(2)} w `;
    if (st) { const [r, g, bl] = hexRGB(st[1]); s += `${r} ${g} ${bl} RG `; }
    s += da
      ? `[${da[1].trim().split(/\s+/).map(n => (+n * PT).toFixed(2)).join(' ')}] 0 d `
      : '[] 0 d ';
    return s;
  }

  for (const m of svgStr.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)" ([^/]*)\/>/g)) {
    ops.push(strokeStyle(m[5]) + `${X(+m[1])} ${Y(+m[2])} m ${X(+m[3])} ${Y(+m[4])} l S`);
  }

  for (const m of svgStr.matchAll(/<path d="([^"]+)" ([^/]*)\/>/g)) {
    const nums = m[1].replace(/[MC,]/g, ' ').trim().split(/\s+/).map(Number);
    let s = strokeStyle(m[2]) + `${X(nums[0])} ${Y(nums[1])} m `;
    for (let i = 2; i + 5 < nums.length; i += 6)
      s += `${X(nums[i])} ${Y(nums[i + 1])} ${X(nums[i + 2])} ${Y(nums[i + 3])} ${X(nums[i + 4])} ${Y(nums[i + 5])} c `;
    ops.push(s + 'S');
  }

  for (const m of svgStr.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)"[^/]*\/>/g)) {
    const px = (+m[1] - minX) * PT, py = (h - (+m[2] - minY)) * PT, r = +m[3] * PT, k = 0.5523 * r;
    const f = n => n.toFixed(2);
    ops.push(
      `0 0 0 rg ${f(px + r)} ${f(py)} m ` +
      `${f(px + r)} ${f(py + k)} ${f(px + k)} ${f(py + r)} ${f(px)} ${f(py + r)} c ` +
      `${f(px - k)} ${f(py + r)} ${f(px - r)} ${f(py + k)} ${f(px - r)} ${f(py)} c ` +
      `${f(px - r)} ${f(py - k)} ${f(px - k)} ${f(py - r)} ${f(px)} ${f(py - r)} c ` +
      `${f(px + k)} ${f(py - r)} ${f(px + r)} ${f(py - k)} ${f(px + r)} ${f(py)} c f`
    );
  }

  for (const m of svgStr.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" ([^>]*)>([^<]*)<\/text>/g)) {
    const attrs = m[3], str = m[4].replace(/[()\\]/g, '');
    const fs = attrs.match(/font-size="([\d.]+)"/);
    const size = (fs ? +fs[1] : 0.75) * PT;
    const fill = attrs.match(/fill="#([0-9a-fA-F]+)"/);
    let px = (+m[1] - minX) * PT, py = (h - (+m[2] - minY)) * PT;
    if (/text-anchor="middle"/.test(attrs)) px -= str.length * size * 0.28;
    let colorOp = '0 0 0 rg';
    if (fill) { const [r, g, bl] = hexRGB(fill[1]); colorOp = `${r} ${g} ${bl} rg`; }
    ops.push(`BT /F1 ${size.toFixed(2)} Tf ${colorOp} ${px.toFixed(2)} ${py.toFixed(2)} Td (${str}) Tj ET`);
  }

  return { stream: ops.join('\n'), w: w * PT, h: h * PT };
}

function buildPdf(pages) {
  const objs = [];
  const pageRefs = pages.map((_, i) => 4 + i * 2);
  objs[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objs[2] = `<< /Type /Pages /Kids [${pageRefs.map(r => r + ' 0 R').join(' ')}] /Count ${pages.length} >>`;
  objs[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  pages.forEach((p, i) => {
    const po = 4 + i * 2, co = po + 1;
    objs[po] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.w.toFixed(2)} ${p.h.toFixed(2)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${co} 0 R >>`;
    objs[co] = `<< /Length ${p.stream.length} >>\nstream\n${p.stream}\nendstream`;
  });
  let out = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = out.length;
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++)
    out += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return out;
}

/* ---------- UI ---------- */
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let cur = null;

  function r1(n) { return Math.round(n * 10) / 10; }

  function renderValues(b, sl) {
    const rows = [
      ['身幅 B/2+6', b.bw], ['A~BL B/12+13.7', b.blY], ['背幅 B/8+7.4', b.backW],
      ['胸幅 B/8+6.2', b.chestW], ['BL~B點 B/5+8.3', b.blY - b.frontTopY],
      ['前領口幅 ◎=B/24+3.4', b.neckW], ['前領口深 ◎+0.5', b.fNeckD],
      ['後領口幅 ◎+0.2', b.bNeckW], ['胸省 (B/4-2.5)°', b.chDartDeg + '°'],
      ['後肩省 B/32-0.8', b.shDart], ['總腰省量 身幅-(W/2+3)', b.totalDart],
      ['腰省 a(14%)', b.dartW.a], ['腰省 b(15%)', b.dartW.b], ['腰省 c(11%)', b.dartW.c],
      ['腰省 d(35%)', b.dartW.d], ['腰省 e(18%)', b.dartW.e], ['腰省 f(7%)', b.dartW.f],
      ['前AH(實測)', b.ahF], ['後AH(實測)', b.ahB],
      ['袖山高 (SP平均高~BL)×5/6', sl.capH], ['前袖幅斜線 前AH', sl.slantF],
      ['後袖幅斜線 後AH+1+★', sl.slantB], ['袖幅', sl.wf + sl.wb],
      ['袖山縮縫份(いせ)', sl.ease]
    ];
    $('values').innerHTML = '<table><tbody>' +
      rows.map(([k, v]) => `<tr><th>${k}</th><td>${typeof v === 'number' ? r1(v) + ' cm' : v}</td></tr>`).join('') +
      '</tbody></table>';
  }

  function draw() {
    const B = +$('bust').value, W = +$('waist').value,
          L = +$('backlen').value, SL = +$('sleevelen').value;
    const msg = $('msg');
    msg.textContent = '';
    if (!(B >= 70 && B <= 110) || !(W >= 50 && W <= 105) || !(L >= 30 && L <= 46)) {
      msg.textContent = '請確認輸入範圍:B 70–110、W 50–105、背長 30–46 cm。';
      return;
    }
    const b = draftBodice(B, W, L);
    const sl = draftSleeve(b, SL);
    cur = { b, sl };
    $('bodiceBox').innerHTML = bodiceSVG(b);
    $('sleeveBox').innerHTML = sleeveSVG(sl);
    renderValues(b, sl);
    if (B >= 90) msg.textContent = '注意:B≥90 時胸省閉合後前袖窿易出角,教材建議手動修順袖窿線。';
    ['btnSvgBodice', 'btnSvgSleeve', 'btnPdf'].forEach(id => $(id).disabled = false);
  }

  function dlBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function dlSVG(boxId, name) {
    const el = $(boxId).querySelector('svg');
    if (!el) return;
    dlBlob(new Blob([el.outerHTML], { type: 'image/svg+xml' }), name);
  }

  function dlPDF() {
    if (!cur) return;
    const pages = ['bodiceBox', 'sleeveBox'].map(id =>
      svgToPdfPage($(id).querySelector('svg').outerHTML));
    const pdf = buildPdf(pages);
    dlBlob(new Blob([pdf], { type: 'application/pdf' }),
      `bunka_pattern_B${cur.b.B}_W${cur.b.W}.pdf`);
  }

  $('btnDraw').addEventListener('click', draw);
  $('btnSvgBodice').addEventListener('click', () => dlSVG('bodiceBox', `bunka_bodice_B${cur.b.B}.svg`));
  $('btnSvgSleeve').addEventListener('click', () => dlSVG('sleeveBox', `bunka_sleeve_B${cur.b.B}.svg`));
  $('btnPdf').addEventListener('click', () => {
    try { dlPDF(); } catch (e) { $('msg').textContent = 'PDF 產生失敗:' + e.message; }
  });
  draw();
}

/* Node 測試用 */
if (typeof module !== 'undefined')
  module.exports = { draftBodice, draftSleeve, crLen, bodiceSVG, sleeveSVG, svgToPdfPage, buildPdf };
