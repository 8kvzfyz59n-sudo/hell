/* =========================================================
 * 成人男子上衣原型(身片+袖)
 * 單位 cm,x 向右、y 向下,後中心頂點 A=(0,0)
 * 輸入:胸圍 C、腰圍 W、背長、袖長
 * v23 依逐步教學重製:前身上端 C/4+2.5、胸褶(H-G)、
 * 前肩點=胸寬線外(⊗+0.5)、腰褶 a~e 位置全面修正
 * ========================================================= */

function draftMenBodice(C, W, backLen) {
  const bw     = C / 2 + 6.7;          // 衣寬
  const blY    = C / 6 + 8.5;          // A~BL(袖窿深)
  const backW  = C / 6 + 5.8;          // 背幅
  const chestW = C / 6 + 2.9;          // 胸幅
  const wlY    = backLen + 0.5;        // 後中心長 = 背長+0.5
  const frontTopY = blY - (C / 4 + 2.5); // 前身上端 B 點(自 CL 向上 C/4+2.5)
  const neckW  = C / 16 + 1.9;         // 前領寬 ◎
  const fNeckD = neckW + 0.5;          // 前領深 ◎+0.5
  const bNeckW = neckW + 0.3;          // 後領寬 ◎+0.3
  const bNeckD = bNeckW / 3 - 0.3;     // 後領深 ●−0.3(●=後領寬/3)
  const shDart = C / 32;               // 肩褶寬
  const phi    = (blY - blY / 2) / 3;  // 一等份 φ = E~C 三等分(=袖窿深/6)
  const gY     = blY / 2 + phi;        // G 線(袖子與袖襱的對合線)

  const A  = [0, 0];
  const Cp = [backW, blY];             // C 點(背幅×BL)
  const E  = [backW, blY / 2];         // E:A~CL 中點水平線交背幅線
  const E1 = [0, blY / 2];             // E1:同水平線交後中心
  const Dx = bw - chestW;              // D 點/胸幅線 x
  const Fx = Dx - 0.7;                 // F:D 向脇邊 0.7
  const G  = [Fx, gY];                 // G:F 直上交 G 線
  const sideX = (backW + Fx) / 2;      // 脇邊線 SS = C~F 中點
  const Ix = backW / 2 - 0.5;          // I:E~E1 中點向後中心 0.5

  // 前領口(對角線三等分第二點下 0.5)
  const SNPf = [bw - neckW, frontTopY];
  const FNP  = [bw, frontTopY + fNeckD];
  const fnGuide = [SNPf[0] + (FNP[0] - SNPf[0]) * 2 / 3,
                   SNPf[1] + (FNP[1] - SNPf[1]) * 2 / 3 + 0.5];

  // 前肩 22°:⊗=(側頸點~胸寬線)/4,自胸寬線外 ⊗+0.5 畫垂直線交肩線=前肩點
  const a22  = DEG(22);
  const lenToChest = (SNPf[0] - Dx) / Math.cos(a22);
  const quarter = lenToChest / 4;                       // ⊗
  const horizF = (SNPf[0] - Dx) + quarter + 0.5;        // 水平總距
  const shLenF = horizF / Math.cos(a22);                // ★ 前肩線長
  const SPf  = [SNPf[0] - horizF, SNPf[1] + horizF * Math.tan(a22)];

  // 後領口・後肩 21°,後肩線長 = ★ + C/32(肩褶份)
  const SNPb = [bNeckW, -bNeckD];
  const a21  = DEG(21);
  const shLenB = shLenF + shDart;
  const SPb  = [SNPb[0] + shLenB * Math.cos(a21), SNPb[1] + shLenB * Math.sin(a21)];

  // 肩褶:I 直上交肩線,交點往肩點方向取 C/32,褶尖=I 上 1.5
  const tI  = (Ix - SNPb[0]) / Math.cos(a21);
  const sd1 = [SNPb[0] + tI * Math.cos(a21), SNPb[1] + tI * Math.sin(a21)];
  const sd2 = [sd1[0] + shDart * Math.cos(a21), sd1[1] + shDart * Math.sin(a21)];
  const sdApex = [Ix, blY / 2 - 1.5];

  // 胸褶:H=前胸寬中點向脇邊 0.7、CL 上(φ−1);
  // 褶腳一 H-G,褶腳二=以 H 為圓心、H-G 為半徑畫弧交胸寬線於 K
  const H  = [bw - chestW / 2 - 0.7, blY - (phi - 1)];
  const rHG = Math.hypot(G[0] - H[0], G[1] - H[1]);
  const K  = [Dx, H[1] - Math.sqrt(Math.max(rHG * rHG - (H[0] - Dx) * (H[0] - Dx), 0))];

  // 袖窿:▲=(C~SS)/3,C 點與 F 點 45° 斜取皆 ▲+0.5
  const tri = (sideX - backW) / 3;
  const s2 = Math.SQRT1_2;
  const gdF = [Fx - (tri + 0.5) * s2, blY - (tri + 0.5) * s2];
  const gdB = [backW + (tri + 0.5) * s2, blY - (tri + 0.5) * s2];
  const UA  = [sideX, blY];
  const J   = [backW, gY];             // 後袖窿經背幅線與 G 線交點

  // 曲線起始沿肩線垂直方向導引
  const perpB = [SPb[0] - 3 * Math.sin(a21), SPb[1] + 3 * Math.cos(a21)];
  const perpF = [SPf[0] + 3 * Math.sin(a22), SPf[1] + 3 * Math.cos(a22)];
  const ahBackPts  = [SPb, perpB, J, gdB, UA];
  const ahFrontUp  = [SPf, perpF, K];
  const ahFrontLow = [G, gdF, UA];
  const ahF = crLen(ahFrontUp) + crLen(ahFrontLow);   // 前AH(胸褶合併量)
  const ahB = crLen(ahBackPts);                       // 後AH

  // 腰褶:總量=(C/2+6.7)−(W/2+4),a16/b16/c36/d24/e8(%)
  const totalDart = bw - (W / 2 + 4);
  const pct = { a: .16, b: .16, c: .36, d: .24, e: .08 };
  const dartW = {};
  for (const k in pct) dartW[k] = totalDart * pct[k];
  // a:D 向前中心 0.8,頂點交於胸褶 H-G 褶腳線
  const aCx = Dx + 0.8;
  const tA  = (aCx - H[0]) / (G[0] - H[0]);
  const aApexY = H[1] + tA * (G[1] - H[1]);
  const darts = [
    { name: 'a', cx: aCx,        apexY: aApexY,    w: dartW.a },
    { name: 'b', cx: sideX,      apexY: blY,       w: dartW.b },
    { name: 'c', cx: backW - 1,  apexY: blY - phi, w: dartW.c },
    { name: 'd', cx: Ix + 1,     apexY: blY - 2.5, w: dartW.d }
  ];
  // e:後中心 E1~WL 收份(畫在輪廓,不進 darts)

  return { C, W, backLen,
    bw, blY, backW, chestW, wlY, frontTopY, neckW, fNeckD, bNeckW, bNeckD,
    shDart, phi, gY, tri, quarter, shLenF, shLenB, rHG,
    totalDart, dartW, darts,
    A, Cp, E, E1, Dx, Fx, G, sideX, Ix, H, K, J,
    SNPf, FNP, fnGuide, SPf, SNPb, SPb, sd1, sd2, sdApex,
    gdF, gdB, UA, ahBackPts, ahFrontUp, ahFrontLow, ahF, ahB };
}

/* 袖:袖山高=(前後肩點平均高~CL)×5/6,斜線 前AH / 後AH+1
 * 袖山弧線:●=前AH/4,自袖山點沿前斜線 ● 處垂直外凸 2.1、後斜線 ● 處外凸 2.2;
 * G 線交前後斜線得 B、C 點,沿斜線下移 1 / 2;袖底照身片袖襱 45° 導引點複製 */
function draftMenSleeve(bod, sleeveLen) {
  const { blY, gY, SPf, SPb, ahF, ahB, sideX, gdF, gdB } = bod;
  const capH = (blY - (SPf[1] + SPb[1]) / 2) * 5 / 6;
  const slantF = ahF, slantB = ahB + 1;
  const wf = Math.sqrt(Math.max(slantF * slantF - capH * capH, 1));
  const wb = Math.sqrt(Math.max(slantB * slantB - capH * capH, 1));
  const top = [0, 0];
  const fEnd = [-wf, capH], bEnd = [wb, capH];
  const uF = [-wf / slantF, capH / slantF];   // 前斜線單位向量
  const uB = [wb / slantB, capH / slantB];    // 後斜線單位向量

  // ● = 前AH/4,前後皆用;垂直斜線向外凸 2.1 / 2.2
  const dot4 = ahF / 4;
  const pF = [uF[0] * dot4 + uF[1] * -2.1, uF[1] * dot4 + uF[0] * 2.1];
  const pB = [uB[0] * dot4 + uB[1] * 2.2,  uB[1] * dot4 - uB[0] * 2.2];

  // G 線(身片 CL 上方 blY−gY)交前後斜線得 B、C,沿斜線往袖口方向 1 / 2
  const gH = blY - gY;                        // G 線在袖幅線上方的高度
  const tG = (capH - gH) / capH;
  const Bp = [-wf * tG + uF[0], capH * tG + uF[1]];       // B 下 1
  const Cq = [wb * tG + uB[0] * 2, capH * tG + uB[1] * 2]; // C 下 2

  // 袖底:身片袖襱 45° 導引點對稱複製(以脇邊 SS↔袖幅端點對應)
  const copyF = [-wf + (gdF[0] - sideX), capH - (blY - gdF[1])];
  const copyB = [wb - (sideX - gdB[0]), capH - (blY - gdB[1])];

  const capPts = [fEnd, copyF, Bp, pF, top, pB, Cq, copyB, bEnd];
  const capLen = crLen(capPts);
  const ease = capLen - (ahF + ahB);
  const elY = sleeveLen / 2 + 2.5;
  return { capH, wf, wb, slantF, slantB, dot4, top, fEnd, bEnd, capPts, capLen, ease, sleeveLen, elY };
}

function menBodiceSVG(b) {
  const m = 2.5;
  const minX = -m, minY = Math.min(b.SNPb[1], b.SNPf[1]) - m;
  const w = b.bw + 2 * m, h = b.wlY - minY + m;
  let s = svgOpen(minX, minY, w, h);

  // 導引線
  s += line([0, 0], [0, b.blY / 2], S.guide);                        // 後中心上段
  s += line([b.bw, b.frontTopY], [b.bw, b.blY], S.guide);            // 前中心上段
  s += line([0, b.blY], [b.bw, b.blY], S.guide);                     // BL(CL)
  s += line([0, b.wlY], [b.bw, b.wlY], S.guide);                     // WL
  s += line([b.backW, b.blY / 2], [b.backW, b.blY], S.guide);        // 背幅線
  s += line([b.Dx, b.frontTopY], [b.Dx, b.blY], S.guide);            // 胸幅線
  s += line([b.Fx, b.gY], [b.Fx, b.blY], S.guide);                   // F 直上線
  s += line([b.sideX, b.blY], [b.sideX, b.wlY], S.guide);            // 脇邊線 SS
  s += line(b.E1, b.E, S.guide);                                     // E 水平線
  s += line([0, b.gY], [b.Fx, b.gY], S.guide);                       // G 線
  s += line([0, 0], [b.backW, 0], S.guide);                          // 後上平線
  s += line([b.Dx, b.frontTopY], [b.bw, b.frontTopY], S.guide);      // 前上平線

  // 後片輪廓
  const eW = b.dartW.e;
  s += path(crPathD([b.SNPb, [b.bNeckW * 0.45, -0.05], b.A]), S.outline); // 後領口
  s += line(b.A, b.E1, S.outline);                                        // 後中心
  s += line(b.E1, [eW, b.wlY], S.outline);                                // 後中心收份 e(E1~WL)
  s += line([eW, b.wlY], [b.sideX, b.wlY], S.outline);                    // 後腰線
  s += line(b.SNPb, b.SPb, S.outline);                                    // 後肩
  s += path(crPathD(b.ahBackPts), S.outline);                             // 後袖窿

  // 前片輪廓
  s += path(crPathD([b.SNPf, b.fnGuide, b.FNP]), S.outline);              // 前領口
  s += line(b.FNP, [b.bw, b.wlY], S.outline);                             // 前中心
  s += line([b.bw, b.wlY], [b.sideX, b.wlY], S.outline);                  // 前腰線
  s += line(b.SNPf, b.SPf, S.outline);                                    // 前肩
  s += path(crPathD(b.ahFrontUp), S.outline);                             // 前袖窿(上,至 K)
  s += path(crPathD(b.ahFrontLow), S.outline);                            // 前袖窿(下,G 起)
  s += line([b.sideX, b.blY], [b.sideX, b.wlY], S.outline);               // 脇線

  // 胸褶(H-G、H-K)
  s += line(b.H, b.G, S.dart);
  s += line(b.H, b.K, S.dart);
  // 肩褶
  s += line(b.sd1, b.sdApex, S.dart);
  s += line(b.sd2, b.sdApex, S.dart);
  // 腰褶 a~d
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
  s += dot(b.G) + text([b.G[0] - 1.2, b.G[1]], 'G');
  s += dot(b.H) + text([b.H[0] + 0.25, b.H[1] + 0.6], 'H');
  s += dot(b.E) + text([b.E[0] + 0.25, b.E[1] - 0.3], 'E');
  s += dot(b.E1) + text([0.25, b.blY / 2 - 0.3], 'E1');
  s += text([-1.9, 0.2], 'A') + text([-1.9, b.blY + 0.2], 'CL') + text([-1.9, b.wlY + 0.2], 'WL');
  s += text([b.bw + 0.4, b.blY + 0.2], 'CL') + text([b.bw + 0.4, b.wlY + 0.2], 'WL');
  s += text([b.sideX, b.wlY + 1.8], 'SS', S.small, 'middle');
  s += text([b.backW / 2, b.blY + 2.2], 'BACK', S.small, 'middle');
  s += text([b.bw - b.chestW / 2, b.blY + 2.2], 'FRONT', S.small, 'middle');
  s += `</svg>`;
  return s;
}

/* Node 測試用 */
if (typeof module !== 'undefined')
  module.exports = { draftMenBodice, draftMenSleeve, menBodiceSVG };
