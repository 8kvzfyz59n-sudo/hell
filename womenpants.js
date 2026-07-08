/* =========================================================
 * 褲子(基本型長褲)製圖
 * 輸入:W腰圍、H臀圍、HL腰長、BR股上、TL褲長、褲口半寬
 * 前片:寬=H/4+1;HL均分4等份,裆尖=前中角a外延一等份;
 *   折山線=b~d中點;KL=股上+股下/2−4;股下線KL內彎0.7~1(得◎);
 *   脇邊WL內縮2起翹1~1.2;前中WL內縮0.5連c;裆彎導引a1=a向bc垂線2/3處;
 *   腰目標(W+1)/4+1,餘量兩褶等寬(褶長9,褶1壓折山線、褶2在褶1左緣與
 *   脇邊腰點中點);餘量<3只打一根;口袋HL上15;拉鍊止點HL下1寬3
 * 後片(描前片鏡射、股上線以上取直線):
 *   W=前中直線WL點、W1=W外移2.5、W2=中點;
 *   後中斜線=a連W2延伸超過WL 2(後翹);H=斜線交HL、H1=H沿斜線上2;
 *   後臀寬=H/4+1 自H1垂直於後中斜線量至H2,H2上下取垂直輔助線;
 *   裆尖b1=b外移4再下落0.5~1;後裆彎=H1經a1(借前片導引點)連b1;
 *   KL與褲口各比前片外放1;脇邊WL內縮2起翹1~1.2;
 *   腰目標(W+1)/4−1,餘量=兩褶等寬●;褶自後中1/3處長11、2/3處長9~10,
 *   褶尖偏向脇邊0.5~0.7
 * 範圍常數取中值(可調):起翹1.1、KL內彎0.85、後落裆0.75、
 *   後褶尖偏0.6、後褶2長9.5
 * ========================================================= */

/* 單段貝茲(M+C,PDF 安全) */
function wpCub(p1, c1, c2, p2) {
  const f = n => +n.toFixed(3);
  return `M ${f(p1[0])} ${f(p1[1])} C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(p2[0])} ${f(p2[1])}`;
}
function wpBezPt(p1, c1, c2, p2, t) {
  const u = 1 - t;
  return [
    u*u*u*p1[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p2[0],
    u*u*u*p1[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p2[1]
  ];
}
function wpBezLen(p1, c1, c2, p2, n = 100) {
  let L = 0, prev = p1;
  for (let i = 1; i <= n; i++) {
    const q = wpBezPt(p1, c1, c2, p2, i / n);
    L += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
    prev = q;
  }
  return L;
}
function wpBezYatX(p1, c1, c2, p2, x, n = 200) {
  let best = p1[1], dmin = Infinity;
  for (let i = 0; i <= n; i++) {
    const q = wpBezPt(p1, c1, c2, p2, i / n);
    const d = Math.abs(q[0] - x);
    if (d < dmin) { dmin = d; best = q[1]; }
  }
  return best;
}
/* 沿貝茲曲線走 s 公分處的點與單位切線 */
function wpBezAtLen(p1, c1, c2, p2, s, n = 300) {
  let L = 0, prev = p1;
  for (let i = 1; i <= n; i++) {
    const q = wpBezPt(p1, c1, c2, p2, i / n);
    const d = Math.hypot(q[0] - prev[0], q[1] - prev[1]);
    if (L + d >= s) {
      const t = [(q[0] - prev[0]) / d, (q[1] - prev[1]) / d];
      return { p: q, t };
    }
    L += d; prev = q;
  }
  return { p: p2, t: [1, 0] };
}

function draftWomenPants(W, H, HL, BR, TL, hemHalf) {
  /* ---------- 前片(脇邊x=0、前中x=w、裆尖x=bX) ---------- */
  const w = H / 4 + 1;                    // 前片寬(例24)
  const q = w / 4;                        // 等份(例6)
  const bX = w + q;                       // 裆尖 b 的 x(例30)
  const crease = bX / 2;                  // 折山線(例15)
  const inseam = TL - BR;
  const klY = BR + inseam / 2 - 4;        // KL(例56.5)
  const kIn = 0.85;                       // KL內彎(0.7~1)
  const hemIn = crease + hemHalf, hemOut = crease - hemHalf;
  const xInsKL = bX + (hemIn - bX) * (klY - BR) / (TL - BR);
  const dia = xInsKL - kIn - crease;      // ◎
  const sideKLx = crease - dia;
  const sideIn = 2, sideRaise = 1.1;      // 脇邊內縮2、起翹(1~1.2)
  const cfIn = 0.5;
  const cfW = [w - cfIn, 0];
  const sideW = [sideIn, -sideRaise];
  const a = [w, BR], b = [bX, BR], c = [w, HL];
  const un = (() => { const u0 = [c[0]-b[0], c[1]-b[1]]; const l = Math.hypot(u0[0], u0[1]); return [u0[0]/l, u0[1]/l]; })();
  const t0 = (a[0]-b[0])*un[0] + (a[1]-b[1])*un[1];
  const foot = [b[0] + un[0]*t0, b[1] + un[1]*t0];
  const a1 = [a[0] + (foot[0]-a[0])*2/3, a[1] + (foot[1]-a[1])*2/3];
  const wc1 = [sideW[0] + 6 * 0.995, sideW[1] + 6 * 0.099];
  const wc2 = [cfW[0] - 6 * 0.9997, cfW[1] + 6 * 0.026];
  const waistLen = wpBezLen(sideW, wc1, wc2, cfW);
  const target = (W + 1) / 4 + 1;         // 前腰目標(例17.25)
  const pleatTotal = waistLen - target;
  const single = pleatTotal < 3;
  const pleatW = single ? pleatTotal : pleatTotal / 2;
  const pleat2x = (sideW[0] + (crease - pleatW / 2)) / 2;

  /* ---------- 後片(前片鏡射:x'=bX−x;裆尖朝左、脇邊x'=bX) ---------- */
  const w2off = 2.5;                       // W→W1
  const bkW = [q, 0];                      // W=前中直線WL點(鏡射後 x'=q)
  const bkW2 = [q + w2off / 2, 0];         // W2=中點
  const su = (() => { const d = [bkW2[0] - q, -BR]; const l = Math.hypot(d[0], d[1]); return [d[0]/l, d[1]/l]; })(); // 後中斜線向上單位向量(a→W2)
  const bkWt = [bkW2[0] + 2 * su[0], bkW2[1] + 2 * su[1]];   // 後翹頂點(超過WL 2)
  const bkH = [q + (w2off / 2) * (BR - HL) / BR, HL];        // 斜線交HL
  const bkH1 = [bkH[0] + 2 * su[0], bkH[1] + 2 * su[1]];     // H1=H沿斜線上2
  const nrm = [-su[1], su[0]];                                // 垂直斜線、指向脇邊
  const bkH2 = [bkH1[0] + w * nrm[0], bkH1[1] + w * nrm[1]]; // 後臀寬H/4+1至H2
  const drop = 0.75;                       // 後落裆(0.5~1)
  const bkB1 = [-4, BR + drop];            // 裆尖b1(b外移4再下落)
  const bkA1 = [bX - a1[0], a1[1]];        // 借前片裆彎導引點(鏡射)
  const insKLm = bX - (xInsKL - kIn);      // 前股下KL點(鏡射)
  const bkInsKL = [insKLm - 1, klY];       // 後股下KL(外放1)
  const bkHemIn = [bX - hemIn - 1, TL];    // 後褲口內側(外放1)
  const sideKLm = bX - sideKLx;            // 前脇邊KL點(鏡射)
  const bkSideKL = [sideKLm + 1, klY];     // 後脇邊KL(外放1)
  const bkHemOut = [bX - hemOut + 1, TL];  // 後褲口外側(外放1)
  const bkSideW = [bX - sideIn, -sideRaise];  // 脇邊腰點(內縮2、起翹)
  const bwc1 = [bkWt[0] + 5 * nrm[0], bkWt[1] + 5 * nrm[1]];
  const bwc2 = [bkSideW[0] - 5 * 0.992, bkSideW[1] + 5 * 0.124];
  const waistLenB = wpBezLen(bkWt, bwc1, bwc2, bkSideW);
  const targetB = (W + 1) / 4 - 1;         // 後腰目標(例15.25)
  const dartTotal = waistLenB - targetB;
  const dartW = dartTotal / 2;             // 褶寬●(兩褶等寬)
  const dartLen1 = 11, dartLen2 = 9.5;     // 褶長(11、9~10)
  const dartTip = 0.6;                     // 褶尖偏向脇邊(0.5~0.7)

  return { W, H, HL, BR, TL, hemHalf,
    w, q, bX, crease, inseam, klY, kIn, hemIn, hemOut, xInsKL, dia, sideKLx,
    sideIn, sideRaise, cfIn, cfW, sideW, a, b, c, a1,
    wc1, wc2, waistLen, target, pleatTotal, single, pleatW, pleat2x,
    w2off, bkW, bkW2, bkWt, bkH, bkH1, bkH2, drop, bkB1, bkA1,
    bkInsKL, bkHemIn, bkSideKL, bkHemOut, bkSideW, bwc1, bwc2,
    waistLenB, targetB, dartTotal, dartW, dartLen1, dartLen2, dartTip };
}

function womenPantsSVG(p) {
  const m = 2.5, gap = 6;
  const OB = 4.5;                                   // 後片位移(容納b1的−4)
  const B = pt => [pt[0] + OB, pt[1]];              // 後片→畫布
  const oxF = OB + p.bkH2[0] + 2 + gap;             // 前片畫布起點
  const F = pt => [pt[0] + oxF, pt[1]];             // 前片→畫布
  const minX = -m, minY = -m - 2.2;
  const wTot = oxF + p.bX + 2 * m, hTot = p.TL + 1.5 + m - minY;
  let s = svgOpen(minX, minY, wTot, hTot);
  const yH = p.HL, yB = p.BR, yK = p.klY, yL = p.TL;

  /* ================= 後片(B,左;後中/裆尖朝左) ================= */
  {
    // 導引線:前片描線(股上線以上直線)+ 折山線 + H2垂直線 + 斜線
    s += line(B([p.q, 0]), B([p.bX, 0]), S.guide);            // WL
    s += line(B([p.q, yH]), B([p.bX, yH]), S.guide);          // HL
    s += line(B([-4, yB]), B([p.bX, yB]), S.guide);           // 股上線
    s += line(B([p.bkInsKL[0] - 1, yK]), B([p.bkSideKL[0] + 1, yK]), S.guide); // KL
    s += line(B([p.q, 0]), B([p.q, yB]), S.guide);            // 前中直線(描線)
    s += line(B([p.bX, 0]), B([p.bX, yB]), S.guide);          // 脇邊直線(描線)
    s += line(B([p.bX - p.crease, 0]), B([p.bX - p.crease, yL]), S.guide);  // 折山線
    s += line(B([p.bkH2[0], p.bkH2[1] - 14]), B([p.bkH2[0], p.bkH2[1] + 10]), S.guide); // H2垂直輔助線
    s += line(B(p.bkH1), B(p.bkH2), S.guide);                 // H1-H2(後臀寬24)
    // 後中斜線(後翹頂點→H1)+ 後裆彎 H1→a1→b1
    s += line(B(p.bkWt), B(p.bkH1), S.outline);
    s += path(wpCub(B(p.bkH1), B([p.bkH1[0] - 0.15, p.bkH1[1] + 3]), B([p.bkA1[0] + 0.98, p.bkA1[1] - 1.14]), B(p.bkA1)), S.outline);
    s += path(wpCub(B(p.bkA1), B([p.bkA1[0] - 0.98, p.bkA1[1] + 1.14]), B([p.bkB1[0] + 2.2, p.bkB1[1] - 0.35]), B(p.bkB1)), S.outline);
    // 股下線:b1→KL(弧)→褲口內側
    s += path(wpCub(B(p.bkB1), B([p.bkB1[0] + 0.8, p.bkB1[1] + 9]), B([p.bkInsKL[0] - 0.4, yK - 8]), B(p.bkInsKL)), S.outline);
    s += line(B(p.bkInsKL), B(p.bkHemIn), S.outline);
    // 脇邊:腰點→H2(弧)→KL(弧)→褲口外側
    s += path(wpCub(B(p.bkSideW), B([p.bkSideW[0] + 0.4, p.bkSideW[1] + 5]), B([p.bkH2[0], p.bkH2[1] - 6]), B(p.bkH2)), S.outline);
    s += path(wpCub(B(p.bkH2), B([p.bkH2[0], p.bkH2[1] + 7]), B([p.bkSideKL[0] + 0.4, yK - 8]), B(p.bkSideKL)), S.outline);
    s += line(B(p.bkSideKL), B(p.bkHemOut), S.outline);
    // 褲口
    s += line(B(p.bkHemIn), B(p.bkHemOut), S.outline);
    // 腰線
    s += path(wpCub(B(p.bkWt), B(p.bwc1), B(p.bwc2), B(p.bkSideW)), S.outline);
    // 兩褶(自後中1/3、2/3,垂直WL,褶尖偏脇邊)
    if (p.dartW > 0.2) {
      const fr = [[1 / 3, p.dartLen1], [2 / 3, p.dartLen2]];
      for (const [f, len] of fr) {
        const at = wpBezAtLen(p.bkWt, p.bwc1, p.bwc2, p.bkSideW, p.waistLenB * f);
        const tw = at.t, nn = [-tw[1], tw[0]];       // 切線、垂直向下
        const c0 = at.p;
        const l1 = [c0[0] - tw[0] * p.dartW / 2, c0[1] - tw[1] * p.dartW / 2];
        const l2 = [c0[0] + tw[0] * p.dartW / 2, c0[1] + tw[1] * p.dartW / 2];
        const tip = [c0[0] + nn[0] * len + tw[0] * p.dartTip, c0[1] + nn[1] * len + tw[1] * p.dartTip];
        s += line(B(l1), B(tip), S.dart) + line(B(l2), B(tip), S.dart);
      }
      s += text(B([p.bX - p.crease, minY + 1.2]), 'DART x2', S.small, 'middle');
    }
    s += text(B([p.bX - p.crease, yL + 1.2]), 'B', S.small, 'middle');
    s += text(B([p.bX - p.crease + 0.3, (yB + yL) / 2]), 'CREASE', S.small);
  }

  /* ================= 前片(F,右;前中/裆尖朝右) ================= */
  {
    s += line(F([0, 0]), F([p.w, 0]), S.guide);
    s += line(F([0, yH]), F([p.w, yH]), S.guide);
    s += line(F([0, yB]), F([p.bX, yB]), S.guide);
    s += line(F([p.sideKLx - 1, yK]), F([p.xInsKL + 1, yK]), S.guide);
    s += line(F([0, 0]), F([0, yB]), S.guide);
    s += line(F([p.w, 0]), F([p.w, yB]), S.guide);
    s += line(F([p.crease, 0]), F([p.crease, yL]), S.guide);
    s += line(F(p.b), F(p.c), S.guide);
    s += line(F(p.a), F(p.a1), S.guide);
    for (let i = 1; i <= 3; i++) s += line(F([p.q * i, yH - 0.4]), F([p.q * i, yH + 0.4]), S.guide);
    // 前中 + 裆彎(c→a1→b)
    s += line(F(p.cfW), F(p.c), S.outline);
    s += path(wpCub(F(p.c), F([p.c[0] + 0.15, p.c[1] + 2.2]), F([p.a1[0] - 1.0, p.a1[1] - 1.1]), F(p.a1)), S.outline);
    s += path(wpCub(F(p.a1), F([p.a1[0] + 1.0, p.a1[1] + 1.1]), F([p.b[0] - 1.8, p.b[1] - 0.45]), F(p.b)), S.outline);
    // 股下線
    s += path(wpCub(F(p.b), F([p.b[0] - 0.7, p.b[1] + 9]), F([p.xInsKL - p.kIn + 0.4, yK - 8]), F([p.xInsKL - p.kIn, yK])), S.outline);
    s += line(F([p.xInsKL - p.kIn, yK]), F([p.hemIn, yL]), S.outline);
    // 脇邊
    s += path(wpCub(F(p.sideW), F([p.sideW[0] - 1.2, p.sideW[1] + 5]), F([0, yH - 6]), F([0, yH])), S.outline);
    s += path(wpCub(F([0, yH]), F([0, yH + 8]), F([p.sideKLx - 0.4, yK - 8]), F([p.sideKLx, yK])), S.outline);
    s += line(F([p.sideKLx, yK]), F([p.hemOut, yL]), S.outline);
    // 褲口 + 腰線
    s += line(F([p.hemOut, yL]), F([p.hemIn, yL]), S.outline);
    s += path(wpCub(F(p.sideW), F(p.wc1), F(p.wc2), F(p.cfW)), S.outline);
    // 褶
    if (p.pleatW > 0.2) {
      const centers = p.single ? [p.crease] : [p.crease, p.pleat2x];
      const yTop = x => wpBezYatX(p.sideW, p.wc1, p.wc2, p.cfW, x);
      for (const cx of centers) {
        s += line(F([cx - p.pleatW / 2, yTop(cx - p.pleatW / 2)]), F([cx, yTop(cx) + 9]), S.dart);
        s += line(F([cx + p.pleatW / 2, yTop(cx + p.pleatW / 2)]), F([cx, yTop(cx) + 9]), S.dart);
      }
      s += text(F([p.crease, minY + 1.2]), p.single ? 'PLEAT x1' : 'PLEAT x2', S.small, 'middle');
    }
    // 口袋(HL上15、裝飾0.5)、拉鍊(止點HL下1、寬3)
    const yPk = yH - 15;
    s += path(wpCub(F([0.5, yPk + 0.3]), F([0.35, yPk + 5]), F([0.55, yH - 5]), F([0.6, yH])), S.dart);
    s += text(F([1.0, yPk + 2]), 'POCKET', S.small);
    const fx = p.cfW[0] - 3;
    s += line(F([fx, 0.35]), F([fx, yH - 2.5]), S.dart);
    s += path(wpCub(F([fx, yH - 2.5]), F([fx, yH + 0.2]), F([p.w - 1.2, yH + 1]), F([p.w - 0.1, yH + 1])), S.dart);
    s += text(F([fx - 3.4, 3]), 'FLY', S.small);
    s += text(F([p.crease, yL + 1.2]), 'F', S.small, 'middle');
    s += text(F([p.crease + 0.3, (yB + yL) / 2]), 'CREASE', S.small);
  }

  // 共用記號(左緣)
  s += text([-1.9, 0.3], 'WL') + text([-1.9, yH + 0.3], 'HL') + text([-1.9, yB + 0.3], 'BR');
  s += text([-1.9, yK + 0.3], 'KL') + text([-1.9, yL + 0.3], 'HEM');
  s += `</svg>`;
  return s;
}

/* Node 測試用 */
if (typeof module !== 'undefined') module.exports = { draftWomenPants, womenPantsSVG };
