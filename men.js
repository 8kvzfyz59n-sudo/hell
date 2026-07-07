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
