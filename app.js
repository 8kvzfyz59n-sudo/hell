/* =========================================================
 * 成人女子上半身原型製圖
 * 單位:cm。座標系:x 向右、y 向下,後中心頂點 A = (0,0)
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

  // 斜線上導引點(垂直斜線之外/內偏移,標準偏移值)
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

/* ---------- 圓裙製圖(圓周率法) ----------
 * n/4 圓裙:腰圍半徑 r = 2W/(nπ),下襬半徑 R = r + 裙長
 * 版片畫半件(前/後各一片,對摺裁或裁2片),圓心角 = n×45°  */
function draftSkirt(W, skirtLen, n, seam) {
  const r = 2 * W / (n * Math.PI);
  const R = r + skirtLen;
  const thetaDeg = n * 45;                       // 半件圓心角
  const hemFull = (n / 4) * 2 * Math.PI * R;     // 整件下襬總長
  return { W, skirtLen, n, r, R, thetaDeg, hemFull, seam: seam || 0 };
}

// 圓弧(圓心o、半徑r、起訖角rad)轉三次貝茲 C 段(y向下座標直接適用)
function arcC(o, r, a1, a2) {
  const f = v => +v.toFixed(3);
  const segs = Math.max(1, Math.ceil(Math.abs(a2 - a1) / (Math.PI / 2)));
  const d = (a2 - a1) / segs;
  let s = '';
  for (let i = 0; i < segs; i++) {
    const t1 = a1 + i * d, t2 = t1 + d;
    const k = 4 / 3 * Math.tan(d / 4);
    const p3 = [o[0] + r * Math.cos(t2), o[1] + r * Math.sin(t2)];
    const c1 = [o[0] + r * (Math.cos(t1) - k * Math.sin(t1)), o[1] + r * (Math.sin(t1) + k * Math.cos(t1))];
    const c2 = [p3[0] + r * k * Math.sin(t2), p3[1] - r * k * Math.cos(t2)];
    s += ` C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(p3[0])} ${f(p3[1])}`;
  }
  return s;
}
// 直線寫成退化貝茲(讓 PDF 轉換器只需處理 M+C)
function lineC(a, b) {
  const f = v => +v.toFixed(3);
  const c1 = [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3];
  const c2 = [a[0] + 2 * (b[0] - a[0]) / 3, a[1] + 2 * (b[1] - a[1]) / 3];
  return ` C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(b[0])} ${f(b[1])}`;
}

function skirtSVG(sk) {
  const m = 3;
  const th = sk.thetaDeg * Math.PI / 180;
  const a1 = Math.PI / 2 - th / 2, a2 = Math.PI / 2 + th / 2;  // 對稱於正下方
  const O = [0, 0];
  const pt = (rr, a) => [rr * Math.cos(a), rr * Math.sin(a)];
  const P1 = pt(sk.r, a1), P2 = pt(sk.r, a2);
  const H1 = pt(sk.R, a1), H2 = pt(sk.R, a2);
  const xmax = sk.R * Math.max(Math.abs(Math.cos(a1)), Math.sin(a1) < 0 ? 1 : 0, 0.0001);
  const w = 2 * (xmax + m), minX = -(xmax + m);
  const minY = Math.min(0, P1[1]) - m - 1.5, h = sk.R + m - minY + 1.5;
  const f = v => +v.toFixed(3);
  let s = svgOpen(minX, minY, w, h);

  // 導引線:圓心到腰線兩側
  s += line(O, P1, S.guide) + line(O, P2, S.guide);
  // 布紋線(沿中分線)
  s += line([0, sk.r + 3], [0, sk.R - 3], S.guide);
  // 輪廓:腰弧 → 側邊 → 下襬弧 → 側邊
  let d = `M ${f(P1[0])} ${f(P1[1])}`;
  d += arcC(O, sk.r, a1, a2);        // 腰線弧
  d += lineC(P2, H2);                // 側邊
  d += arcC(O, sk.R, a2, a1);        // 下襬弧(反向)
  d += lineC(H1, P1);                // 側邊
  s += path(d, S.outline);

  // 縫份外框(裁切線,外框往外平行加放;外推工具在 womenpants.js)
  if (sk.seam > 0) {
    const pts = [];
    const arcSamp = (rr, aa1, aa2) => {
      const n = Math.max(8, Math.ceil(Math.abs(aa2 - aa1) * rr / 1.2));
      for (let i = 0; i < n; i++) pts.push(pt(rr, aa1 + (aa2 - aa1) * i / n));
    };
    const lineSamp = (p1, p2) => {
      const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 1.2));
      for (let i = 0; i < n; i++) pts.push([p1[0] + (p2[0] - p1[0]) * i / n, p1[1] + (p2[1] - p1[1]) * i / n]);
    };
    arcSamp(sk.r, a1, a2);        // 腰線弧
    lineSamp(P2, H2);             // 側邊
    arcSamp(sk.R, a2, a1);        // 下襬弧
    lineSamp(H1, P1);             // 側邊
    s += path(wpLoopPath(wpOffsetLoop(pts, sk.seam), q => q), 'fill="none" stroke="#111111" stroke-width="0.05"');
    s += text([0, sk.R + sk.seam + 0.9], '+' + sk.seam + 'CM SEAM', S.small, 'middle');
  }

  // 記號
  s += dot(O) + text([0.3, -0.4], 'O');
  s += text([P1[0] * 0.5 + 0.3, P1[1] * 0.5 - 0.3], 'r=' + (Math.round(sk.r * 10) / 10));
  s += text([0.3, (sk.r + sk.R) / 2], 'L=' + sk.skirtLen);
  s += text([0.3, sk.r - 0.5], 'W/2', S.small);
  s += text([0.3, sk.R - 1], 'GRAIN', S.small);
  s += text([0, minY + m], sk.n + '/4 CIRCLE SKIRT (HALF)', S.small, 'middle');
  s += `</svg>`;
  return s;
}

/* ---------- 直筒裙(窄裙)製圖 ----------
 * 版寬 H/2+2(臀圍整圈鬆份4)、脇邊前後差1、後中心下降1(使用者定值,2026-07-08)
 * 腰目標:後 (W+1)/4−2、前 (W+1)/4+2((W+1)=鬆份、±2=前後差)
 * ○=前腰餘量/3(側縫前後各收○);後褶●=(後腰餘量−○)/2 ×2根
 * 前褶=○+0.5(靠脇)、○−0.5(靠前中);脇邊起翹1.2、H2=HL上4
 * 褶位:前後臀圍寬各三等分垂直線(後1/3處往後中移0.5)
 * 前褶尖至MHL(腰長/2);後褶尖:靠後中=HL上5右移0.5,另一根=輔助線交點右移0.5
 * 拉鍊止點=HL下1(後中普通拉鍊);腰帶=長(W+1)+3搭份、完成寬2(裁片對摺寬4)
 * 縫份:'book'=腰1/脇1.5/後中2/下擺4.5/腰帶1;數字=統一;前中一律摺雙(0)  */
function draftTightSkirt(W, H, waistLen, L, seamMode) {
  const ease = 2, fbDiff = 1, cbDrop = 1, rise = 1.2;
  const width = H / 2 + ease;
  const backHipW = width / 2 - fbDiff, frontHipW = width / 2 + fbDiff;
  const backWT = (W + 1) / 4 - 2, frontWT = (W + 1) / 4 + 2;
  const circ = (frontHipW - frontWT) / 3;             // ○
  const bDart = (backHipW - backWT - circ) / 2;       // ●
  const fDartS = circ + 0.5, fDartC = circ - 0.5;     // 前褶 靠脇/靠前中
  const hl = waistLen, mhl = waistLen / 2, h2 = waistLen - 4;
  // 後片(x 自後中心)
  const bSideTopX = backHipW - circ;
  const bd1x = backHipW / 3 - 0.5;                    // W6:褶1靠後中腳
  const bd1c = bd1x + bDart / 2;                      // 褶1中線(W15 直線)
  const bd2c = backHipW * 2 / 3;                      // W7:褶2中線
  const bd1Tip = [bd1c + 0.5, hl - 5];                // W17
  // 前片(x 自前中心)
  const fSideTopX = frontHipW - circ;
  const fd1x = frontHipW / 3;                         // W4:靠前中褶,寬○−0.5 往脇取
  const fd2x = frontHipW * 2 / 3;                     // W5:靠脇褶,寬○+0.5 往前中取
  const fd1c = fd1x + fDartC / 2;                     // W13 中線
  const fd2c = fd2x - fDartS / 2;                     // W14 中線
  // 後褶2尖:W15 連前片 W14(合併座標)之輔助線交 W7 垂直線,右移0.5(W18)
  const w14comb = backHipW + (frontHipW - fd2c);
  const tAux = (bd2c - bd1c) / (w14comb - bd1c);
  const bd2Tip = [bd2c + 0.5, (hl - 5) + tAux * (mhl - (hl - 5))];
  const zipY = hl + 1;                                // 拉鍊止點(後中)
  const beltL = (W + 1) + 3, beltW = 2;               // 搭份3、完成寬2
  const beltA = (W + 1) / 4 - 2, beltB = (W + 1) / 4 + 2; // 腰帶記號 a[後]/b[前]
  const sm = seamMode === 'book' ? 'book' : (+seamMode || 0);
  const seam = sm === 'book'
    ? { waist: 1, side: 1.5, cb: 2, hem: 4.5, belt: 1 }
    : sm > 0 ? { waist: sm, side: sm, cb: sm, hem: sm, belt: sm } : null;
  return { W, H, waistLen, L, width, ease, fbDiff, cbDrop, rise,
           backHipW, frontHipW, backWT, frontWT, circ, bDart, fDartS, fDartC,
           hl, mhl, h2, bSideTopX, fSideTopX,
           bd1x, bd1c, bd2c, bd1Tip, bd2Tip, fd1x, fd2x, fd1c, fd2c,
           zipY, beltL, beltW, beltA, beltB, seamMode: sm, seam };
}

/* 兩端水平切線的過渡曲線(腰線用) */
function tsBlend(p0, p1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const tt = i / n, e = (1 - Math.cos(Math.PI * tt)) / 2;
    pts.push([p0[0] + (p1[0] - p0[0]) * tt, p0[1] + (p1[1] - p0[1]) * e]);
  }
  return pts;
}
/* 脇邊曲線:自腰側點收於 H2(切線轉垂直) */
function tsHip(xw, yw, xh, yh, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const tt = i / n;
    pts.push([xh + (xw - xh) * Math.pow(1 - tt, 1.8), yw + (yh - yw) * tt]);
  }
  return pts;
}
/* 折線在 x 處的 y(腰線取褶腳高度用) */
function tsYatX(pts, x) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if ((x >= a[0] && x <= b[0]) || (x >= b[0] && x <= a[0])) {
      const f = (x - a[0]) / ((b[0] - a[0]) || 1);
      return a[1] + f * (b[1] - a[1]);
    }
  }
  return pts[pts.length - 1][1];
}
/* 依每邊縫份外推(順時針點列,法線=(dy,−dx)) */
function tsOffsetEdge(pts, d) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    out.push([pts[i][0] + (dy / L) * d, pts[i][1] - (dx / L) * d]);
  }
  return out;
}
function tsSeamPath(loopPts) {
  let d = `M ${(+loopPts[0][0].toFixed(3))} ${(+loopPts[0][1].toFixed(3))}`;
  for (let i = 1; i < loopPts.length; i++) d += lineC(loopPts[i - 1], loopPts[i]).replace(/^ /, ' ');
  d += lineC(loopPts[loopPts.length - 1], loopPts[0]);
  return d;
}

function tightSkirtSVG(t) {
  const m = 2.5, gap = 4;
  const hem = t.L, hl = t.hl;
  const sa = t.seam;
  const exL = sa ? sa.cb : 0, exR = sa ? sa.side : 0, exB = sa ? sa.hem : 0;
  const ox = t.backHipW + gap + (sa ? sa.side * 2 : 0);      // 前片原點(前中心在右端)
  const beltH = t.beltW * 2;
  const by = hem + exB + 4;                                   // 腰帶上緣 y
  const xmax = Math.max(ox + t.frontHipW, t.beltL + (sa ? sa.belt : 0));
  const minX = -m - exL, minY = -m - t.rise - (sa ? sa.waist : 0);
  const w = xmax + 2 * m + exL, h = by + beltH + (sa ? sa.belt : 0) + m - minY;
  let s = svgOpen(minX, minY, w, h);

  // ---- 基準曲線 ----
  const bWaist = tsBlend([0, t.cbDrop], [t.bSideTopX, -t.rise], 8);       // 後腰線
  const bSide  = tsHip(t.bSideTopX, -t.rise, t.backHipW, t.h2, 8);        // 後脇曲線
  const fx = x => ox + t.frontHipW - x;                                   // 前片座標(x自前中心)
  const fWaistL = tsBlend([0, 0], [t.fSideTopX, -t.rise], 8);             // 前腰線(local)
  const fWaist = fWaistL.map(p => [fx(p[0]), p[1]]);
  const fSideL = tsHip(t.fSideTopX, -t.rise, t.frontHipW, t.h2, 8);
  const fSide = fSideL.map(p => [fx(p[0]), p[1]]);

  // ---- 導引線 ----
  s += line([0, 0], [t.backHipW, 0], S.guide) + line([fx(t.frontHipW), 0], [fx(0), 0], S.guide);   // WL
  s += line([0, hl], [t.backHipW, hl], S.guide) + line([fx(t.frontHipW), hl], [fx(0), hl], S.guide); // HL
  s += line([fx(t.frontHipW), t.mhl], [fx(0), t.mhl], S.guide);                                    // MHL(腹圍)
  // 直布紋記號(箭頭)
  for (const gx of [t.backHipW / 2, fx(t.frontHipW / 2)]) {
    s += line([gx, hl + 4], [gx, hem - 4], S.guide);
    s += line([gx, hl + 4], [gx - 0.35, hl + 5], S.guide) + line([gx, hl + 4], [gx + 0.35, hl + 5], S.guide);
  }

  // ---- 後片輪廓 ----
  s += path(crPathD(bWaist), S.outline);                                  // 後腰線
  s += path(crPathD(bSide), S.outline);                                   // 後脇曲線
  s += line([t.backHipW, t.h2], [t.backHipW, hem], S.outline);            // 脇直段
  s += line([t.backHipW, hem], [0, hem], S.outline);                      // 下擺
  s += line([0, hem], [0, t.cbDrop], S.outline);                          // 後中心
  // ---- 前片輪廓(前中心=右端,摺雙) ----
  s += path(crPathD(fWaist), S.outline);
  s += path(crPathD(fSide), S.outline);
  s += line([fx(t.frontHipW), t.h2], [fx(t.frontHipW), hem], S.outline);
  s += line([fx(t.frontHipW), hem], [fx(0), hem], S.outline);
  s += line([fx(0), hem], [fx(0), 0], S.outline);                         // 前中心(摺雙)

  // ---- 褶子 ----
  function dart(x1, x2, tip, waistPts) {
    return line([x1, tsYatX(waistPts, x1)], tip, S.dart) +
           line([x2, tsYatX(waistPts, x2)], tip, S.dart);
  }
  s += dart(t.bd1x, t.bd1x + t.bDart, t.bd1Tip, bWaist);                              // 後褶1(靠後中)
  s += dart(t.bd2c - t.bDart / 2, t.bd2c + t.bDart / 2, t.bd2Tip, bWaist);            // 後褶2
  s += dart(fx(t.fd1x), fx(t.fd1x + t.fDartC), [fx(t.fd1c), t.mhl], fWaist);          // 前褶(靠前中)
  s += dart(fx(t.fd2x), fx(t.fd2x - t.fDartS), [fx(t.fd2c), t.mhl], fWaist);          // 前褶(靠脇)

  // ---- 拉鍊止點(後中)與對合記號(脇邊) ----
  s += line([0, t.zipY], [0.8, t.zipY], S.dart) + text([1.1, t.zipY + 0.2], 'ZIP', S.small);
  for (const ny of [t.h2, (hl + hem) / 2]) {
    s += line([t.backHipW - 0.6, ny], [t.backHipW, ny], S.dart);
    s += line([fx(t.frontHipW), ny], [fx(t.frontHipW) + 0.6, ny], S.dart);
  }

  // ---- 縫份外框(裁切線) ----
  const SEAM = 'fill="none" stroke="#111111" stroke-width="0.05"';
  if (sa) {
    // 後片(順時針):腰(上推)→脇(右推)→下擺直角外角→下擺(下推)→後中心(左推)
    const bWaistOff = tsOffsetEdge(bWaist, sa.waist);
    const bLoop = [
      [-sa.cb, bWaistOff[0][1]],
      ...bWaistOff,
      ...tsOffsetEdge(bSide, sa.side),
      [t.backHipW + sa.side, hem], [t.backHipW + sa.side, hem + sa.hem],
      [-sa.cb, hem + sa.hem]
    ];
    s += path(tsSeamPath(bLoop), SEAM);
    // 前片(順時針,自腰側點起):腰(側→前中,上推)→前中心摺雙貼淨版→下擺→脇(左推,向上)
    const fWaistOff = tsOffsetEdge(fWaist.slice().reverse(), sa.waist);   // 側→前中
    const fSideUp = [[fx(t.frontHipW), hem], [fx(t.frontHipW), t.h2], ...fSide.slice().reverse().slice(1)];
    const fLoop = [
      ...fWaistOff,
      [fx(0), fWaistOff[fWaistOff.length - 1][1]],
      [fx(0), hem + sa.hem],
      [fx(t.frontHipW) - sa.side, hem + sa.hem],
      [fx(t.frontHipW) - sa.side, hem],
      ...tsOffsetEdge(fSideUp, sa.side)
    ];
    s += path(tsSeamPath(fLoop), SEAM);
  }

  // ---- 腰帶(裁片:對摺,完成寬×2;記號 CB|a|SS|b|CF|b|SS|a|CB|+搭份3) ----
  s += line([0, by], [t.beltL, by], S.outline) + line([t.beltL, by], [t.beltL, by + beltH], S.outline);
  s += line([t.beltL, by + beltH], [0, by + beltH], S.outline) + line([0, by + beltH], [0, by], S.outline);
  s += line([0, by + beltH / 2], [t.beltL, by + beltH / 2], S.guide);     // 對摺線
  const marks = [[0, 'CB'], [t.beltA, 'SS'], [t.beltA + t.beltB, 'CF'],
                 [t.beltA + 2 * t.beltB, 'SS'], [2 * t.beltA + 2 * t.beltB, 'CB']];
  for (const [mx, ml] of marks) {
    s += line([mx, by], [mx, by + 0.6], S.dart) + line([mx, by + beltH], [mx, by + beltH - 0.6], S.dart);
    s += text([mx, by - 0.35], ml, S.small, 'middle');
  }
  if (sa) {
    const k = sa.belt;
    s += path(tsSeamPath([[-k, by - k], [t.beltL + k, by - k], [t.beltL + k, by + beltH + k], [-k, by + beltH + k]]), SEAM);
  }

  // ---- 標籤(ASCII) ----
  s += text([-1.9 - exL, 0.3], 'WL') + text([-1.9 - exL, hl + 0.3], 'HL') + text([-1.9 - exL, hem + 0.3], 'HEM');
  s += text([t.backHipW / 2, hl - 1.2], 'B x2', S.small, 'middle');
  s += text([fx(t.frontHipW / 2), hl - 1.2], 'F x1 FOLD', S.small, 'middle');
  s += text([fx(0) + 0.3, t.mhl + 0.2], 'MHL', S.small);
  s += text([t.beltL / 2, by + beltH + 1.2], 'BELT ' + (Math.round(t.beltL * 10) / 10) + ' x ' + beltH + ' (FOLD ' + t.beltW + ')', S.small, 'middle');
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

  // 屬性取值(不依賴屬性順序;同時支援 <line .../> 與瀏覽器序列化的 <line ...></line>)
  const attrNum = (attrs, name) => {
    const r = attrs.match(new RegExp(name + '="([-\\d.]+)"'));
    return r ? +r[1] : null;
  };

  for (const m of svgStr.matchAll(/<line\b([^>]*?)\/?>/g)) {
    const at = m[1];
    const x1 = attrNum(at, 'x1'), y1 = attrNum(at, 'y1'),
          x2 = attrNum(at, 'x2'), y2 = attrNum(at, 'y2');
    if (x1 === null || y1 === null || x2 === null || y2 === null) continue;
    ops.push(strokeStyle(at) + `${X(x1)} ${Y(y1)} m ${X(x2)} ${Y(y2)} l S`);
  }

  for (const m of svgStr.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const at = m[1];
    const dm = at.match(/ d="([^"]+)"/);
    if (!dm) continue;
    const nums = dm[1].replace(/[MC,]/g, ' ').trim().split(/\s+/).map(Number);
    let s = strokeStyle(at) + `${X(nums[0])} ${Y(nums[1])} m `;
    for (let i = 2; i + 5 < nums.length; i += 6)
      s += `${X(nums[i])} ${Y(nums[i + 1])} ${X(nums[i + 2])} ${Y(nums[i + 3])} ${X(nums[i + 4])} ${Y(nums[i + 5])} c `;
    ops.push(s + 'S');
  }

  for (const m of svgStr.matchAll(/<circle\b([^>]*?)\/?>/g)) {
    const at = m[1];
    const cx = attrNum(at, 'cx'), cy = attrNum(at, 'cy'), rr = attrNum(at, 'r');
    if (cx === null || cy === null || rr === null) continue;
    const px = (cx - minX) * PT, py = (h - (cy - minY)) * PT, r = rr * PT, k = 0.5523 * r;
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

  function rowsTable(rows) {
    return '<table><tbody>' +
      rows.map(([k, v]) => `<tr><th>${k}</th><td>${typeof v === 'number' ? r1(v) + ' cm' : v}</td></tr>`).join('') +
      '</tbody></table>';
  }

  function renderValuesPleat(p) {
    const typeName = p.type === 'box' ? '箱褶(工字褶)' : p.type === 'accordion' ? '手風琴褶' : '刀褶';
    const unitFormula = p.type === 'box' ? '陽+4×陰' : p.type === 'accordion' ? '陽+陰' : '陽+2×陰';
    $('valuesPleat').innerHTML = rowsTable([
      ['摺型', typeName],
      ['腰圍+鬆份(裙頭要做到的長度)', p.effWaist],
      ['做一個摺要吃掉的布寬(' + unitFormula + ')', p.pleatUnit],
      ['一個摺在腰上佔的寬度' + (p.type === 'accordion' ? '(陽−陰)' : '(=陽摺)'), p.waistPerPleat],
      ['總共要摺幾個摺(無條件進位)', p.waistOK ? p.numPleats : '—(陽≤陰,見上方提示)'],
      ['全部摺份攤平的布寬', p.flatWidth],
      ['全部摺好後的實際腰圍', p.finishedWaist],
      ['比目標腰圍多出來的(進位造成)', r1(p.waistDiff)],
      ['裙子攤平的總寬(含開口縫份)', p.totalWidth],
      ['每片布的長度(裙長+腰頭+縫份)', p.lengthNeeded],
      ['要接幾片布(總寬÷布幅,接縫每邊留1)', !p.waistOK ? '—'
        : p.fitsOneWidth ? '1 片就夠(布幅' + p.fabricWidth + 'cm)'
        : p.panels + ' 片(接縫請藏在陰摺裡)'],
      ['建議購買布長(片數×每片長度)', p.fabricLengthM + ' m']
    ]);
  }

  function renderValuesMenTop(b, sl) {
    $('valuesMenTop').innerHTML = rowsTable([
      ['衣寬 C/2+6.7', b.bw], ['袖襱深 A~CL C/6+8.5', b.blY],
      ['背寬 C/6+5.8', b.backW], ['胸寬 C/6+2.9', b.chestW],
      ['後中心長 背長+0.5', b.wlY],
      ['前身上端 CL往上 C/4+2.5', b.blY - b.frontTopY],
      ['一等份 φ(袖襱深/6)', b.phi],
      ['前領寬 ◎=C/16+1.9', b.neckW], ['前領深 ◎+0.5', b.fNeckD],
      ['後領寬 ◎+0.3', b.bNeckW], ['後領高 ●−0.3(●=後領寬/3)', b.bNeckD],
      ['前肩線 ★(22°,胸寬線外⊗+0.5)', b.shLenF],
      ['後肩線 ★+C/32(21°)', b.shLenB],
      ['肩褶寬 C/32', b.shDart],
      ['胸褶半徑 H-G(實測)', b.rHG],
      ['袖襱 ▲=(C~SS)/3,45°斜取▲+0.5', b.tri],
      ['總腰褶 (C/2+6.7)-(W/2+4)', b.totalDart],
      ['腰褶 a(16%)', b.dartW.a], ['腰褶 b(16%)', b.dartW.b],
      ['腰褶 c(36%)', b.dartW.c], ['腰褶 d(24%)', b.dartW.d], ['腰褶 e(8%)', b.dartW.e],
      ['前AH(胸褶合併實測)', b.ahF], ['後AH(實測)', b.ahB],
      ['袖山高 (肩點平均高~CL)×5/6', sl.capH],
      ['前袖斜線 前AH', sl.slantF], ['後袖斜線 後AH+1', sl.slantB],
      ['●=前AH/4(前凸2.1/後凸2.2)', sl.dot4],
      ['袖幅', sl.wf + sl.wb], ['袖山縮縫份(いせ)', sl.ease],
      ['肘線 EL 袖長/2+2.5', sl.elY]
    ]);
  }

  function renderValuesWomenPants(p) {
    $('valuesWomenPants').innerHTML = rowsTable([
      ['前片寬(H/4+1,+1為鬆份)', p.w],
      ['等份(前片寬/4)=前裆伸出', p.q],
      ['折山線位置(裆尖~脇邊的中點,自脇邊量)', p.crease],
      ['股下 / 膝線KL(股上+股下/2−4)', r1(p.inseam) + ' / ' + r1(p.klY) + ' cm'],
      ['膝寬◎(距折山線;KL內彎0.85)', p.dia],
      ['脇邊腰:內縮2、起翹1.1', '—'],
      ['前中腰:內縮0.5', '—'],
      ['前腰目標((W+1)/4+1)', p.target],
      ['前腰線長(實測)', p.waistLen],
      ['腰口剩餘量(=褶份合計)', p.pleatTotal],
      ['褶寬◎ ' + (p.single ? '×1(剩餘<3cm 打一根)' : '×2(等寬,褶長9)'), p.pleatW],
      ['褲口全寬 前/後(後片每側+1)', r1(p.hemHalf * 2) + ' / ' + r1(p.hemHalf * 2 + 2) + ' cm'],
      ['縫份(外框往外平行加放)', p.seam ? r1(p.seam) + ' cm' : '無(淨版)'],
      ['口袋(HL上15,裝飾0.5)/ 拉鍊(止點HL下1,寬3)', '—'],
      ['後中斜線(W→W1=2.5取中點W2連a,超過WL 2)', '後翹頂點高 ' + r1(-p.bkWt[1]) + ' cm'],
      ['後臀圍寬(H1垂直後中斜線量H/4+1)', p.w],
      ['後裆尖(b外移4、下落0.75)', '—'],
      ['後腰目標((W+1)/4−1)', p.targetB],
      ['後腰線長(實測)/ 剩餘量', r1(p.waistLenB) + ' / ' + r1(p.dartTotal) + ' cm'],
      ['後褶寬● ×2(1/3處長11、2/3處長' + p.dartLen2 + ',尖偏脇邊0.6)', p.dartW]
    ]);
  }

  function renderValues0(b, sl, t, sk) {
    $('valuesTop').innerHTML = rowsTable([
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
    ]);
    $('valuesTight').innerHTML = rowsTable([
      ['版寬 H/2+2(臀圍整圈鬆份4)', t.width],
      ['後片寬/前片寬(脇邊前後差1)', r1(t.backHipW) + ' / ' + r1(t.frontHipW) + ' cm'],
      ['後腰目標 (W+1)/4−2', t.backWT], ['前腰目標 (W+1)/4+2', t.frontWT],
      ['一等份○(前腰餘量/3;脇邊前後各收○)', t.circ],
      ['後褶●×2根(後腰餘量−○ 再對半)', t.bDart],
      ['前褶 靠脇○+0.5 / 靠前中○−0.5', r1(t.fDartS) + ' / ' + r1(t.fDartC) + ' cm'],
      ['脇邊起翹1.2、H2=臀圍線上4', '—'],
      ['後中心下降(WL前高後低)', t.cbDrop],
      ['腹圍線MHL(腰長/2;前褶尖到此)', t.mhl],
      ['後褶長 靠後中(HL上5) / 另一根(輔助線交點)', r1(t.bd1Tip[1]) + ' / ' + r1(t.bd2Tip[1]) + ' cm(褶尖皆右移0.5)'],
      ['拉鍊止點(後中,HL下1)', t.zipY],
      ['腰帶 長(W+1)+3搭份 × 完成寬2(裁片對摺寬4)', r1(t.beltL) + ' × ' + t.beltW + ' cm'],
      ['縫份', t.seamMode === 'book' ? '書式:腰1/脇1.5/後中2/下擺4.5/腰帶1(前中摺雙)' : t.seamMode > 0 ? t.seamMode + ' cm(前中摺雙不加)' : '無(淨版)']
    ]);
    $('valuesCircle').innerHTML = rowsTable([
      ['型式', sk.n + '/4 圓'],
      ['腰半徑 r=2W/(nπ)', sk.r], ['下襬半徑 r+裙長', sk.R],
      ['半件圓心角', sk.thetaDeg + '°'], ['整件下襬總長', sk.hemFull],
      ['縫份(外框往外平行加放)', sk.seam ? r1(sk.seam) + ' cm' : '無(淨版)']
    ]);
  }

  function draw() {
    const B = +$('bust').value, W = +$('waist').value,
          L = +$('backlen').value, SL = +$('sleevelen').value,
          Hip = +$('hip').value, WLen = +$('waistlen').value,
          TLen = +$('tightlen').value, CLen = +$('circlelen').value,
          CN = +$('circletype').value;
    const msg = $('msg');
    msg.textContent = '';
    if (!(B >= 70 && B <= 110) || !(W >= 50 && W <= 105) || !(L >= 30 && L <= 46)) {
      msg.textContent = '請確認輸入範圍:B 70–110、W 50–105、背長 30–46 cm。';
      return;
    }
    if (!(Hip >= 70 && Hip <= 130) || !(WLen >= 15 && WLen <= 25)) {
      msg.textContent = '請確認輸入範圍:臀圍 70–130、腰長 15–25 cm。';
      return;
    }
    const b = draftBodice(B, W, L);
    const sl = draftSleeve(b, SL);
    const t = draftTightSkirt(W, Hip, WLen, TLen, $('tightSeam').value);
    const sk = draftSkirt(W, CLen, CN, +$('circleSeam').value);
    const plWaist = +$('plWaist').value, plEase = +$('plEase').value,
          plYang = +$('plYang').value, plYin = +$('plYin').value,
          plLen = +$('plLen').value, plBelt = +$('plBelt').value,
          plHem = +$('plHem').value, plFabricW = +$('plFabricW').value;
    if (!(plWaist >= 50 && plWaist <= 105) || !(plYang >= 1 && plYang <= 10) || !(plYin >= 0.5 && plYin <= 10)) {
      msg.textContent = '請確認百褶裙輸入範圍:淨腰圍 50–105、陽折 1–10、陰折 0.5–10 cm。';
      return;
    }
    const pl = draftPleatSkirt(plWaist, plEase, plYang, plYin, plLen, plBelt, plHem, 1, 3, plFabricW, $('plType').value);

    const mC = +$('mC').value, mW = +$('mW').value,
          mBL = +$('mBackLen').value, mSL = +$('mSleeveLen').value;
    if (!(mC >= 76 && mC <= 120) || !(mW >= 56 && mW <= 110) || !(mBL >= 38 && mBL <= 52)) {
      msg.textContent = '請確認男裝輸入範圍:C 76–120、W 56–110、背長 38–52 cm。';
      return;
    }
    const mb = draftMenBodice(mC, mW, mBL);
    const msl = draftMenSleeve(mb, mSL);

    const wpW = +$('wpW').value, wpH = +$('wpH').value, wpHL = +$('wpHL').value,
          wpBR = +$('wpBR').value, wpTL = +$('wpTL').value, wpHem = +$('wpHem').value,
          wpSeam = +$('wpSeam').value;
    if (!(wpW >= 50 && wpW <= 105) || !(wpH >= 70 && wpH <= 130) ||
        !(wpHL >= 15 && wpHL <= 25) || !(wpBR >= 20 && wpBR <= 35) ||
        !(wpTL >= 60 && wpTL <= 120) || !(wpHem >= 7 && wpHem <= 20)) {
      msg.textContent = '請確認女裝褲子輸入範圍:腰 50–105、臀 70–130、腰長 15–25、股上 20–35、褲長 60–120、褲口半寬 7–20 cm。';
      return;
    }
    const wp = draftWomenPants(wpW, wpH, wpHL, wpBR, wpTL, wpHem, wpSeam);

    const bodSvg = bodiceSVG(b), slvSvg = sleeveSVG(sl),
          tgtSvg = tightSkirtSVG(t), sktSvg = skirtSVG(sk),
          plSheetSvg = pleatSheetSVG(pl), plFullSvg = pleatFullSVG(pl),
          menBodSvg = menBodiceSVG(mb), menSlvSvg = sleeveSVG(msl),
          wpSvg = womenPantsSVG(wp);
    cur = { b, sl, t, sk, pl, mb, msl, wp,
            bodSvg, slvSvg, tgtSvg, sktSvg, plSheetSvg, plFullSvg, menBodSvg, menSlvSvg, wpSvg };
    $('bodiceBox').innerHTML = bodSvg;
    $('sleeveBox').innerHTML = slvSvg;
    $('tightBox').innerHTML = tgtSvg;
    $('skirtBox').innerHTML = sktSvg;
    $('pleatSheetBox').innerHTML = plSheetSvg || '<p class="note">褶單元太寬,無法放入 A4(直式19cm/橫式27.7cm),請縮小陽折或陰折。</p>';
    $('pleatFullBox').innerHTML = plFullSvg || '<p class="note">此組合摺完圍不住腰(見上方提示),不產生原寸版型。</p>';
    $('menBodiceBox').innerHTML = menBodSvg;
    $('menSleeveBox').innerHTML = menSlvSvg;
    $('womenPantsBox').innerHTML = wpSvg;
    renderValues0(b, sl, t, sk);
    renderValuesPleat(pl);
    renderValuesMenTop(mb, msl);
    renderValuesWomenPants(wp);
    if (B >= 90) msg.textContent = '注意:B≥90 時胸省閉合後前袖窿易出角,建議手動修順袖窿線。';
    if (pl.waistOK && pl.panels > 1) msg.textContent += (msg.textContent ? ' ' : '') + '百褶裙:裙子總寬超過布幅,需接 ' + pl.panels + ' 片布(直布紋);接縫位置請藏在陰摺(往內摺的深度)裡面。';
    if (!pl.waistOK) msg.textContent += (msg.textContent ? ' ' : '') + '手風琴褶「表面看得到的摺寬(陽)」必須大於「藏起來的深度(陰)」,不然摺完圍不住腰;兩者一樣寬就是純手風琴褶,要靠鬆緊帶或讓裙襬自然張開。';
    if (wp.pleatTotal < 0.3) msg.textContent += (msg.textContent ? ' ' : '') + '褲子:腰圍相對臀圍偏大,腰口收不出褶,此版型不適用(可考慮增加臀圍)。';
    ['btnSvgBodice', 'btnSvgSleeve', 'btnSvgTight', 'btnSvgSkirt', 'btnSvgPleatSheet', 'btnPdf',
     'btnPdfBodice', 'btnPdfSleeve', 'btnPdfTight', 'btnPdfSkirt', 'btnPdfPleatSheet',
     'btnSvgPleatFull', 'btnPdfPleatFull',
     'btnSvgMenBodice', 'btnPdfMenBodice', 'btnSvgMenSleeve', 'btnPdfMenSleeve',
     'btnSvgWomenPants', 'btnPdfWomenPants'].forEach(id => $(id).disabled = false);
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

  function dlSVG(svgStr, name) {
    if (!svgStr) return;
    dlBlob(new Blob([svgStr], { type: 'image/svg+xml' }), name);
  }

  function dlPDF() {
    if (!cur) return;
    const pages = [cur.bodSvg, cur.slvSvg, cur.tgtSvg, cur.sktSvg, cur.wpSvg, cur.plSheetSvg,
                   cur.plFullSvg, cur.menBodSvg, cur.menSlvSvg].filter(Boolean).map(svgToPdfPage);
    const pdf = buildPdf(pages);
    dlBlob(new Blob([pdf], { type: 'application/pdf' }),
      `pattern_B${cur.b.B}_W${cur.b.W}.pdf`);
  }

  function dlOnePdf(svgStr, name) {
    if (!svgStr) return;
    const pdf = buildPdf([svgToPdfPage(svgStr)]);
    dlBlob(new Blob([pdf], { type: 'application/pdf' }), name);
  }

  $('btnDraw').addEventListener('click', draw);
  $('btnSvgBodice').addEventListener('click', () => dlSVG(cur.bodSvg, `bodice_B${cur.b.B}.svg`));
  $('btnSvgSleeve').addEventListener('click', () => dlSVG(cur.slvSvg, `sleeve_B${cur.b.B}.svg`));
  $('btnSvgTight').addEventListener('click', () => dlSVG(cur.tgtSvg, `tight_skirt_W${cur.t.W}_H${cur.t.H}.svg`));
  $('btnSvgSkirt').addEventListener('click', () => dlSVG(cur.sktSvg, `circle_skirt_${cur.sk.n}q_W${cur.sk.W}.svg`));
  $('btnPdfBodice').addEventListener('click', () => dlOnePdf(cur.bodSvg, `bodice_B${cur.b.B}.pdf`));
  $('btnPdfSleeve').addEventListener('click', () => dlOnePdf(cur.slvSvg, `sleeve_B${cur.b.B}.pdf`));
  $('btnPdfTight').addEventListener('click', () => dlOnePdf(cur.tgtSvg, `tight_skirt_W${cur.t.W}_H${cur.t.H}.pdf`));
  $('btnPdfSkirt').addEventListener('click', () => dlOnePdf(cur.sktSvg, `circle_skirt_${cur.sk.n}q_W${cur.sk.W}.pdf`));
  $('btnSvgPleatSheet').addEventListener('click', () => dlSVG(cur.plSheetSvg, `pleat_test_sheet_${cur.pl.type}.svg`));
  $('btnPdfPleatSheet').addEventListener('click', () => dlOnePdf(cur.plSheetSvg, `pleat_test_sheet_${cur.pl.type}.pdf`));
  $('btnSvgPleatFull').addEventListener('click', () => dlSVG(cur.plFullSvg, `pleat_full_${cur.pl.type}_W${cur.pl.waist}.svg`));
  $('btnPdfPleatFull').addEventListener('click', () => dlOnePdf(cur.plFullSvg, `pleat_full_${cur.pl.type}_W${cur.pl.waist}.pdf`));
  $('btnSvgMenBodice').addEventListener('click', () => dlSVG(cur.menBodSvg, `men_bodice_C${cur.mb.C}.svg`));
  $('btnPdfMenBodice').addEventListener('click', () => dlOnePdf(cur.menBodSvg, `men_bodice_C${cur.mb.C}.pdf`));
  $('btnSvgMenSleeve').addEventListener('click', () => dlSVG(cur.menSlvSvg, `men_sleeve_C${cur.mb.C}.svg`));
  $('btnPdfMenSleeve').addEventListener('click', () => dlOnePdf(cur.menSlvSvg, `men_sleeve_C${cur.mb.C}.pdf`));
  $('btnSvgWomenPants').addEventListener('click', () => dlSVG(cur.wpSvg, `pants_W${cur.wp.W}_H${cur.wp.H}.svg`));
  $('btnPdfWomenPants').addEventListener('click', () => dlOnePdf(cur.wpSvg, `pants_W${cur.wp.W}_H${cur.wp.H}.pdf`));
  $('btnPdf').addEventListener('click', () => {
    try { dlPDF(); } catch (e) { $('msg').textContent = 'PDF 產生失敗:' + e.message; }
  });

  // 依分頁顯示對應輸入欄
  function syncFields(tabId) {
    document.querySelectorAll('.inputs .field').forEach(f => {
      const tabs = (f.dataset.tabs || '').split(/\s+/);
      f.style.display = tabs.includes(tabId) ? '' : 'none';
    });
  }

  // 分頁切換(支援 #top/#tight/#circle/#pants 錨點直達)
  function activateTab(tabId) {
    document.querySelectorAll('.tabbtn').forEach(x => x.classList.toggle('active', x.dataset.tab === tabId));
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.id === tabId));
    syncFields(tabId);
  }
  document.querySelectorAll('.tabbtn').forEach(btn =>
    btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
  const hashMap = { '#top': 'tabTop', '#tight': 'tabTight', '#circle': 'tabCircle', '#pants': 'tabWPants', '#pleat': 'tabPleat', '#mtop': 'tabMenTop', '#wpants': 'tabWPants' };
  activateTab(hashMap[location.hash] || 'tabTop');
  window.addEventListener('hashchange', () => {
    if (hashMap[location.hash]) activateTab(hashMap[location.hash]);
  });

  draw();
}

/* Node 測試用 */
if (typeof module !== 'undefined')
  module.exports = { draftBodice, draftSleeve, draftTightSkirt, draftSkirt, crLen,
                     bodiceSVG, sleeveSVG, tightSkirtSVG, skirtSVG, svgToPdfPage, buildPdf };
