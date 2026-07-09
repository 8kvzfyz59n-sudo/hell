/* =========================================================
 * 西裝領外套(第一階段:身片,步驟一~三)
 * 單位 cm,x 向右、y 向下;以分頁1女裝上半身原型為底
 * 步驟一:後1/2肩褶轉袖襱(鬆份)、前2/3胸褶轉脇邊(留1/3當袖襱鬆份)
 * 步驟二:輪廓(後脇外放1+袖襱加深1、前脇下1、領開0.5、肩提0.5、
 *         腰收1.5~2、M1外推0.5~0.7、前肩=★-0.5)
 * 步驟三:後中拼縫、前後派內爾剪接線(臀圍△補足+下襬交叉展開)、
 *         脇褶◎合併記號、門襟(前中+0.5、持出2)、翻領線(領腰2.5)
 * 範圍值取中;輸入:B、W、H、背長、衣長(WL以下)
 * ========================================================= */

/* 點繞 c 旋轉 ang(弧度) */
function jRot(p, c, ang) {
  const s = Math.sin(ang), co = Math.cos(ang),
        dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * co - dy * s, c[1] + dx * s + dy * co];
}
const jUnit = (a, b) => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};

/* Catmull-Rom 曲線上距起點弧長 dist 的點 */
function jArcPoint(pts, dist) {
  let acc = 0, prev = null;
  for (const [p1, c1, c2, p2] of crSegs(pts)) {
    prev = p1;
    for (let i = 1; i <= 80; i++) {
      const q = bezPoint(p1, c1, c2, p2, i / 80);
      const d = Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      if (acc + d >= dist)
        return [prev[0] + (q[0] - prev[0]) * (dist - acc) / d,
                prev[1] + (q[1] - prev[1]) * (dist - acc) / d];
      acc += d; prev = q;
    }
  }
  return prev;
}
/* Catmull-Rom 第 idx 段的長度(如 B5~W6 只量第一段) */
function jSegLen(pts, idx) {
  const seg = crSegs(pts)[idx];
  let L = 0, prev = seg[0];
  for (let i = 1; i <= 80; i++) {
    const q = bezPoint(seg[0], seg[1], seg[2], seg[3], i / 80);
    L += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
    prev = q;
  }
  return L;
}
/* 曲線與水平線 y=yTarget 的交點(取第一個由上往下的穿越) */
function jCurveAtY(pts, yTarget) {
  let prev = null;
  for (const [p1, c1, c2, p2] of crSegs(pts)) {
    prev = p1;
    for (let i = 1; i <= 120; i++) {
      const q = bezPoint(p1, c1, c2, p2, i / 120);
      if ((prev[1] - yTarget) * (q[1] - yTarget) <= 0 && prev[1] !== q[1]) {
        const t = (yTarget - prev[1]) / (q[1] - prev[1]);
        return [prev[0] + (q[0] - prev[0]) * t, yTarget];
      }
      prev = q;
    }
  }
  return null;
}
/* 曲線上自「y=y0 的交點」再沿線走 dist 的點(限 y 遞增的線段,如脇邊) */
function jArcPointFrom(pts, y0, dist) {
  let passed = false, run = 0, prev = null;
  for (const [p1, c1, c2, p2] of crSegs(pts)) {
    prev = p1;
    for (let i = 1; i <= 120; i++) {
      const q = bezPoint(p1, c1, c2, p2, i / 120);
      if (passed) {
        run += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
        if (run >= dist) return q;
      } else if (q[1] >= y0) {
        passed = true;
      }
      prev = q;
    }
  }
  return prev;
}

function draftJacket(B, W, Hip, backLen, coatLen) {
  const bod = draftBodice(B, W, backLen);
  const { bw, blY, backW, gY, sideX, BP, G, G2, E, sd1, sd2,
          SNPb, SPb, SNPf, SPf, FNP, gdF, gdB, UA, chDartDeg, shDart } = bod;

  /* 常數(範圍值取中,要微調改這裡) */
  const K = {
    waistLen: 18,          // 腰長 W1~H1
    bustOutB: 1,           // 後片 B1~B2 外放
    deepenB: 1,            // 後片 B2~B3 袖襱加深
    deepenF: 1,            // 前片 B4~B5 往下(使用者確認:前片只往下,不外放)
    waistIn: 1.75,         // W3~W4 / W5~W6 腰收 1.5~2
    neckOpen: 0.5,         // N1~N2 / N3~N4 領口開寬
    shRaise: 0.5,          // A~A1 / A2~A3 肩點提高(墊肩份)
    shEase: 0.5,           // 前肩=★−0.5(後肩縮縫份)
    m2Out: 0.6,            // M1~M2 0.5~0.7
    cbWaistIn: 1,          // W1~W7 後中腰收
    hipEase: 2.25,         // 臀圍鬆份 2~2.5
    d1Arm: 12.5,           // A1~D1 沿袖襱 12~13
    d2FromCB: 8.25,        // 腰線自後中(W7)8~8.5
    wDartB: 4,             // D2~D3
    d4FromCB: 11.5,        // 胸線自後中(B6)11~12
    d45: 0.7,              // D4~D5
    d11FromCF: 9.25,       // 腰線自前中 9~9.5
    wDartF: 2.75,          // D11~D12 2.5~3
    d13FromBP: 1.75,       // BP 往脇 1.5~2
    cfOut: 0.5,            // 前中外放(布厚份)
    lapelBtnDrop: 8,       // B7 往下 8(翻領線高/第1釦)
    overlap: 2,            // 門襟持出 Q1~Q3
    eBk: 0.5, eFw: 2,      // E~E1=0.5、E~E2=2(E1~E2=2.5 前領腰)
    dartToSide: 1 / 2      // 胸褶轉脇比例:通行做法2/3;本原型胸褶較大,轉2/3會把前袖襱
                           // 吃短2~2.5(袖寬塌掉),本站取1/2(◎≈2.4,2026-07-09)
  };

  const wlY = backLen, hlY = wlY + K.waistLen, hemY = wlY + coatLen;

  /* ---------- 步驟一(轉褶) ---------- */
  // 後:1/2 肩褶轉袖襱 —— 肩點側繞褶尖(E)旋轉半個褶角
  const angSd1 = Math.atan2(sd1[1] - E[1], sd1[0] - E[0]);
  const angSd2 = Math.atan2(sd2[1] - E[1], sd2[0] - E[0]);
  const rotB = (angSd1 - angSd2) / 2;              // 合併 1/2
  const SPb1 = jRot(SPb, E, rotB);
  // 前:胸褶轉脇邊(比例=K.dartToSide)—— BL 以上脇側繞 BP 旋轉(G→G2 方向)
  const th = DEG(chDartDeg), rotF = th * K.dartToSide;
  const G1r  = jRot(G, BP, rotF);                  // 剩餘褶量當袖襱鬆份
  const gdFr = jRot(gdF, BP, rotF);
  const UAf  = jRot(UA, BP, rotF);

  /* ---------- 步驟二(輪廓) ---------- */
  // 後片
  const N  = [0, 0];
  const B6 = [0, blY];
  const B1 = UA.slice();
  const B2 = [sideX + K.bustOutB, blY];
  const B3 = [B2[0], blY + K.deepenB];
  const W1 = [0, wlY], W3 = [B2[0], wlY];
  const W4 = [W3[0] - K.waistIn, wlY];
  const H3 = [B2[0], hlY];
  const N2 = [SNPb[0] + K.neckOpen * jUnit(SNPb, SPb)[0],
              SNPb[1] + K.neckOpen * jUnit(SNPb, SPb)[1]];
  const A1 = [SPb1[0], SPb1[1] - K.shRaise];
  const star = Math.hypot(A1[0] - N2[0], A1[1] - N2[1]);   // ★ 後肩線
  const M1 = [backW, gY];                                   // 對合點(背幅線交點)
  const M2 = [backW + K.m2Out, gY];
  // 新後袖襱:A1 起垂直肩線 → M2 → 45°導引 → B3
  const uShB = jUnit(N2, A1);
  const perpB = [A1[0] - uShB[1] * 2.5, A1[1] + uShB[0] * 2.5];
  const tri = (F0 => (F0 - sideX) / 3)(bod.F[0]);
  const s2 = Math.SQRT1_2;
  const gdB2 = [backW + K.m2Out + (tri + 0.8) * s2, blY + K.deepenB - (tri + 0.8) * s2];
  const ahBackJ = [A1, perpB, M2, gdB2, B3];

  // 前片(轉褶後)
  const B4 = UAf.slice();
  const B5 = [B4[0], B4[1] + K.deepenF];
  const W5 = [B5[0], wlY];
  const W6 = [B5[0] + K.waistIn, wlY];
  const H4 = [B5[0], hlY];
  const N4 = [SNPf[0] + K.neckOpen * jUnit(SNPf, SPf)[0],
              SNPf[1] + K.neckOpen * jUnit(SNPf, SPf)[1]];
  const A3raw = [SPf[0], SPf[1] - K.shRaise];
  const uShF = jUnit(N4, A3raw);
  const shLenF = star - K.shEase;                          // 前肩=★−0.5
  const A3 = [N4[0] + uShF[0] * shLenF, N4[1] + uShF[1] * shLenF];
  // 新前袖襱:A3 → 胸褶處(G2 與 G1r 中點,1/3 褶當鬆份)→ 導引 → B5,一條順弧
  const perpF = [A3[0] + uShF[1] * 2.5, A3[1] - uShF[0] * 2.5];
  const dartMid = [(G2[0] + G1r[0]) / 2, (G2[1] + G1r[1]) / 2];
  const ahFrontJ = [A3, perpF, dartMid, gdFr, B5];

  /* ---------- 步驟三 ---------- */
  // 後中拼縫:C=N~B6 中點,W7=腰收1,以下平行
  const Cc = [0, blY / 2];
  const W7 = [K.cbWaistIn, wlY];
  const H5 = [K.cbWaistIn, hlY];
  const L5 = [K.cbWaistIn, hemY];
  const L1 = [0, hemY];
  // 後脇:B3→W4→H3 曲線,以下順 W4→H3 斜勢直線(使用者確認)
  const dB = jUnit(W4, H3);
  const L6 = [H3[0] + dB[0] * (hemY - hlY) / dB[1], hemY];
  // 下襬與脇邊垂直 → 起翹 ●(圓弧切線法)
  const L7 = [(L5[0] + L6[0]) / 2, hemY];
  const beta = Math.atan2(Math.abs(dB[0]), dB[1]);
  const riseB = (L6[0] - L7[0]) * Math.tan(beta / 2);
  const L8y = hemY - riseB;
  const L8 = [H3[0] + dB[0] * (L8y - hlY) / dB[1], L8y];
  // 後臀圍與 △
  const H6 = [K.cbWaistIn + Hip / 4 + K.hipEase - 1, hlY];
  const triB = Math.max(H6[0] - H3[0], 0);                 // △後=H3~H6
  // 後派內爾剪接線
  const D1 = jArcPoint(ahBackJ, K.d1Arm);
  const D4 = [K.d4FromCB, blY], D5 = [K.d4FromCB + K.d45, blY];
  const D2 = [K.cbWaistIn + K.d2FromCB, wlY];
  const D3 = [D2[0] + K.wDartB, wlY];
  const D6 = [(D2[0] + D3[0]) / 2, wlY];
  const D7 = [D6[0], hlY];
  const D8 = [D7[0] - triB / 2, hlY], D9 = [D7[0] + triB / 2, hlY];
  // 交叉展開:D2→D9、D3→D8 延伸至下襬(下襬處取垂直)
  const dD29 = jUnit(D2, D9), dD38 = jUnit(D3, D8);
  const L29 = [D9[0] + dD29[0] * (hemY - hlY) / dD29[1], hemY];
  const L38 = [D8[0] + dD38[0] * (hemY - hlY) / dD38[1], hemY];

  // 前脇下段與下襬(取後片同量 ●)
  const dF = jUnit(W6, H4);
  const L9 = [H4[0] + dF[0] * (hemY - hlY) / dF[1], hemY];
  const L10y = hemY - riseB;
  const L10 = [H4[0] + dF[0] * (L10y - hlY) / dF[1], L10y];
  // 前臀圍與 △
  const H2 = [bw, hlY];
  const H7 = [bw - (Hip / 4 + K.hipEase + 1), hlY];
  const triF = Math.max(H7[0] < H4[0] ? H4[0] - H7[0] : 0, 0); // △前=H4~H7(不足量)
  // 脇褶 ◎(FSS−BSS,轉褶轉入脇邊的量)
  const FSS = jSegLen([B5, W6, H4], 0);
  const BSS = jSegLen([B3, W4, H3], 0);
  const circ = Math.max(FSS - BSS, 0);
  const R1 = jCurveAtY([B5, W6, H4], blY) || [B5[0], blY];
  const R2 = jArcPointFrom([B5, W6, H4], blY, circ);
  // 前派內爾剪接線
  const D13 = [BP[0] - K.d13FromBP, blY];
  const D10 = dartMid;                                      // 袖襱上胸褶處
  const W2 = [bw, wlY];
  const D11 = [bw - K.d11FromCF, wlY];
  const D12 = [D11[0] - K.wDartF, wlY];
  const D14 = [(D11[0] + D12[0]) / 2, wlY];
  const D15 = [D14[0], hlY];
  const D16 = [D15[0] + triF / 2, hlY], D17 = [D15[0] - triF / 2, hlY];
  const dD1117 = jUnit(D11, D17), dD1216 = jUnit(D12, D16);
  const L1117 = [D17[0] + dD1117[0] * (hemY - hlY) / dD1117[1], hemY];
  const L1216 = [D16[0] + dD1216[0] * (hemY - hlY) / dD1216[1], hemY];
  // 門襟
  const B7 = [bw, blY];
  const Q1 = [bw + K.cfOut, blY + K.lapelBtnDrop];
  const Q2 = [bw + K.cfOut, hemY];
  const Q3 = [bw + K.cfOut + K.overlap, blY + K.lapelBtnDrop];
  const Q4 = [Q3[0], hemY];
  // 翻領線:E=前領圍自 N4 起 1/3,過 E 平行肩線 E1(下0.5)/E2(上2)
  const fnGuide = [N4[0] + (FNP[0] - N4[0]) * 2 / 3,
                   N4[1] + (FNP[1] - N4[1]) * 2 / 3 + 0.3];
  const neckPts = [N4, fnGuide, FNP];
  const neckLen = crLen(neckPts);
  const Ept = jArcPoint(neckPts, neckLen / 3);
  const E1 = [Ept[0] + uShF[0] * K.eBk, Ept[1] + uShF[1] * K.eBk];
  const E2 = [Ept[0] - uShF[0] * K.eFw, Ept[1] - uShF[1] * K.eFw];
  // 翻領線 Q3→E2 往上延伸
  const uRoll = jUnit(Q3, E2);
  const rollEnd = [E2[0] + uRoll[0] * 6, E2[1] + uRoll[1] * 6];

  // 後領口曲線點列(⊗ 後領圍計算與繪圖共用)
  const bNeckPts = [N, [N2[0] * 0.55, N2[1] * 0.25], N2];

  return {
    B, W, Hip, backLen, coatLen, K, bod,
    wlY, hlY, hemY, blY, bw, backW, sideX, gY,
    // 步驟一
    rotB, rotF, SPb1, G1r, gdFr, UAf,
    // 後片
    N, B6, Cc, B1, B2, B3, W1, W3, W4, H3, N2, A1, star, M1, M2,
    ahBackJ, W7, H5, L5, L1, L6, L7, L8, riseB, H6, triB,
    D1, D2, D3, D4, D5, D6, D7, D8, D9, L29, L38,
    // 前片
    B4, B5, W5, W6, H4, N4, A3, ahFrontJ, SNPf, FNP, BP,
    L9, L10, H2, H7, triF, FSS, BSS, circ, R1, R2,
    D10, D11, D12, D13, D14, D15, D16, D17, L1117, L1216,
    B7, W2, Q1, Q2, Q3, Q4, Ept, E1, E2, rollEnd, neckPts,
    uShB, uShF, bNeckPts
  };
}

/* ---------- 幾何工具(領/袖用) ---------- */
// 直線交點:p1+t·d1 = p2+s·d2
function jXsect(p1, d1, p2, d2) {
  const det = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(det) < 1e-9) return null;
  const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / det;
  return [p1[0] + t * d1[0], p1[1] + t * d1[1]];
}
// 點對「過 a、方向 u(單位)」直線鏡射
function jReflect(p, a, u) {
  const vx = p[0] - a[0], vy = p[1] - a[1];
  const d = vx * u[0] + vy * u[1];
  const ax = a[0] + d * u[0], ay = a[1] + d * u[1];   // 垂足
  return [2 * ax - p[0], 2 * ay - p[1]];
}
// Catmull-Rom 曲線取樣為折線
function jSampleCR(pts, n = 60) {
  const out = [];
  const segs = crSegs(pts);
  segs.forEach(([p1, c1, c2, p2], si) => {
    if (si === 0) out.push(p1.slice());
    for (let i = 1; i <= n; i++) out.push(bezPoint(p1, c1, c2, p2, i / n));
  });
  return out;
}
// 折線與 x=c 的交點(回傳全部)
function jPolyAtX(poly, c) {
  const hits = [];
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1], b = poly[i];
    if ((a[0] - c) * (b[0] - c) <= 0 && a[0] !== b[0]) {
      const t = (c - a[0]) / (b[0] - a[0]);
      hits.push([c, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return hits;
}
// 折線抽稀(畫圖用)
function jThin(poly, step = 8) {
  const out = [];
  for (let i = 0; i < poly.length; i += step) out.push(poly[i]);
  if (out[out.length - 1] !== poly[poly.length - 1]) out.push(poly[poly.length - 1]);
  return out;
}
// 折線平滑(移動平均,端點不動;模擬雲尺畫順)
function jSmooth(poly, win = 8, iters = 2) {
  let p = poly;
  for (let it = 0; it < iters; it++) {
    p = p.map((pt, i) => {
      if (i < win || i >= p.length - win) return pt;
      let sx = 0, sy = 0;
      for (let k = -win; k <= win; k++) { sx += p[i + k][0]; sy += p[i + k][1]; }
      return [sx / (2 * win + 1), sy / (2 * win + 1)];
    });
  }
  return p;
}
// 折線長
function jPolyLen(poly) {
  let L = 0;
  for (let i = 1; i < poly.length; i++) L += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
  return L;
}

/* =========================================================
 * 步驟四~六:西裝領、貼邊、釦、口袋(畫在身片上)
 * ========================================================= */
function draftJacketDetail(j) {
  const K2C = {
    beltHalf: 2,          // 後腰帶 V1~V2=4 之半
    e3Up: 3,              // N~E3(後領腰高@後中)
    e4Up: 2.5,            // N2~E4(側領腰高)
    e5Up: 4,              // E3~E5(後領面@後中)
    e6Len: 4.5,           // E4~E6(側領面,直線至肩線)
    standH: 3, fallH: 4,  // 領子長方形:領腰3+領面4
    q3e7: 22,             // Q3~E7(下片領位置)
    lapelW: 7,            // E7~E8 下片領寬
    e7e9: 4,              // E7~E9
    e10e11: 4.5,          // E10~E11(上片領寬)
    e8e12: 3.5,           // E8~E12
    notch: 3.5,           // 領嘴正三角形邊長
    tBk1: 3, tBk2: 6.5,   // 後貼邊:肩3、後中6~7
    tFr1: 3, tFr2: 6.25,  // 前貼邊:肩3、下襬6~6.5
    btnBottom: 21,        // Q2~Y2 20~22(最下釦距下襬)
    pkFromCF: 8, pkDown: 5, pkW: 5   // 口袋 P1/P2/P3(位置記號)
  };
  const { N, N2, N4, A1, A3, Q2, Q3, Q4, E1, E2, uShB, uShF, bNeckPts } = j;

  /* --- 後腰帶位置 V1~V4(夾縫於後中與剪接線之間) --- */
  const V1 = [j.W7[0], j.wlY - K2C.beltHalf], V2 = [j.W7[0], j.wlY + K2C.beltHalf];
  const seamD = jSampleCR([j.D1, j.D4, j.D2], 60);
  const v3h = jPolyAtX(seamD.map(p => [p[1], p[0]]), V1[1]);   // 以 y 找 x(轉置)
  const v4h = jPolyAtX(seamD.map(p => [p[1], p[0]]), V2[1]);
  const V3 = v3h.length ? [v3h[0][1], V1[1]] : [j.D2[0], V1[1]];
  const V4 = v4h.length ? [v4h[0][1], V2[1]] : [j.D2[0], V2[1]];

  /* --- 後領(畫在後片上)與 ⊗/⊙ --- */
  const nB = [uShB[1], -uShB[0]];                     // 後肩線上方法線
  const E3 = [0, N[1] - K2C.e3Up];
  const E4 = [N2[0] + nB[0] * K2C.e4Up, N2[1] + nB[1] * K2C.e4Up];
  const E5 = [0, E3[1] - K2C.e5Up];
  // E6:自 E4 取 4.5 直線至肩線(圓與肩線交點,取靠袖襱側)
  const tE6 = Math.sqrt(Math.max(K2C.e6Len * K2C.e6Len - K2C.e4Up * K2C.e4Up, 0));
  const E6 = [N2[0] + uShB[0] * tE6, N2[1] + uShB[1] * tE6];
  const standPts = [E4, [(E4[0] + E3[0]) / 2, (E4[1] + E3[1]) / 2 - 0.3], E3];
  const outPts = [E6, [(E6[0] + E5[0]) / 2, (E6[1] + E5[1]) / 2 - 0.4], E5];
  const otimes = crLen(bNeckPts);                     // ⊗ 後領圍
  const odot = crLen(outPts);                         // ⊙ 後領外圍

  /* --- 下片領(lapel)與領嘴,畫於翻領線左側(穿著位置) --- */
  const uR = jUnit(Q3, E2);                           // 翻領線方向(往上)
  const nL = [uR[1], -uR[0]];                          // 左側(衣身側)法線
  const E7 = [Q3[0] + uR[0] * K2C.q3e7, Q3[1] + uR[1] * K2C.q3e7];
  const E8 = [E7[0] + nL[0] * K2C.lapelW, E7[1] + nL[1] * K2C.lapelW];
  const E9 = [E7[0] + uR[0] * K2C.e7e9, E7[1] + uR[1] * K2C.e7e9];
  // E10=前領圍延長線(N4→E1)與翻領線交點(判讀);E11=E10 垂直翻領線往衣身側 4.5
  const gorgeU = jUnit(N4, E1);
  const E10 = jXsect(N4, gorgeU, Q3, uR) || E9;
  const E11 = [E10[0] + nL[0] * K2C.e10e11, E10[1] + nL[1] * K2C.e10e11];
  const uTop = jUnit(E8, E9);                          // 下片領上緣方向
  const E12 = [E8[0] + uTop[0] * K2C.e8e12, E8[1] + uTop[1] * K2C.e8e12];
  // E13=以 E8~E12 為底邊的正三角形頂點(取靠 E11 側)
  const cand1 = jRot(E8, E12, Math.PI / 3), cand2 = jRot(E8, E12, -Math.PI / 3);
  const E13 = (Math.hypot(cand1[0] - E11[0], cand1[1] - E11[1]) <
               Math.hypot(cand2[0] - E11[0], cand2[1] - E11[1])) ? cand1 : cand2;

  /* --- 複製至翻領線右側(版型位置)--- */
  const E8a = jReflect(E8, Q3, uR), E11a = jReflect(E11, Q3, uR),
        E12a = jReflect(E12, Q3, uR), E13a = jReflect(E13, Q3, uR);
  // E14=下片領上緣(E8a→E9)延長與前領圍延長(N4→E1)交會
  const E14 = jXsect(E8a, jUnit(E8a, E9), N4, gorgeU) || E9;

  /* --- 後領長方形倒伏:G4=N4,兩圓交點求 G3(|G4G3|=√(⊗²+7²)、|G3~E11a|=⊙) --- */
  const boxH = K2C.standH + K2C.fallH;                // 7
  const r1 = Math.hypot(otimes, boxH), r2 = odot;
  const dGE = Math.hypot(E11a[0] - N4[0], E11a[1] - N4[1]);
  let G1 = null, G2 = null, G3 = null, G5 = null, G6 = null, tiltOK = false;
  if (dGE < r1 + r2 && dGE > Math.abs(r1 - r2)) {
    const a = (r1 * r1 - r2 * r2 + dGE * dGE) / (2 * dGE);
    const h = Math.sqrt(Math.max(r1 * r1 - a * a, 0));
    const uGE = jUnit(N4, E11a);
    const foot = [N4[0] + uGE[0] * a, N4[1] + uGE[1] * a];
    // 兩解取上方(y 較小)= 領子往上攤開
    const s1 = [foot[0] - uGE[1] * h, foot[1] + uGE[0] * h];
    const s2 = [foot[0] + uGE[1] * h, foot[1] - uGE[0] * h];
    G3 = s1[1] < s2[1] ? s1 : s2;
    // 由 G3 反推長方形方向:u=底邊(G4→G1)、n=高(⊥u);兩種手性取 G6 靠近 E10 者
    const delta = Math.atan2(boxH, otimes);
    const wAng = Math.atan2(G3[1] - N4[1], G3[0] - N4[0]);
    for (const sgn of [1, -1]) {
      const phi = wAng - sgn * delta;
      const u = [Math.cos(phi), Math.sin(phi)];
      const n = [-sgn * u[1], sgn * u[0]];
      const g1 = [N4[0] + u[0] * otimes, N4[1] + u[1] * otimes];
      const g3 = [g1[0] + n[0] * boxH, g1[1] + n[1] * boxH];
      if (Math.hypot(g3[0] - G3[0], g3[1] - G3[1]) < 0.01) {
        const g6 = [N4[0] + n[0] * K2C.standH, N4[1] + n[1] * K2C.standH];
        if (!G6 || Math.hypot(g6[0] - E10[0], g6[1] - E10[1]) <
                   Math.hypot(G6[0] - E10[0], G6[1] - E10[1])) {
          G1 = g1;
          G2 = [g1[0] + n[0] * K2C.standH, g1[1] + n[1] * K2C.standH];
          G5 = [N4[0] + n[0] * boxH, N4[1] + n[1] * boxH];
          G6 = g6;
          tiltOK = true;
        }
      }
    }
  }

  /* --- 前後貼邊 --- */
  const T1 = [N2[0] + uShB[0] * K2C.tBk1, N2[1] + uShB[1] * K2C.tBk1];
  const T2 = [0, N[1] + K2C.tBk2];
  const bkFacing = [T1, [T1[0] * 0.5, (T1[1] + T2[1]) / 2 + 1.2], T2];
  const T4 = [N4[0] + uShF[0] * K2C.tFr1, N4[1] + uShF[1] * K2C.tFr1];
  const T5 = [Q4[0] - K2C.tFr2, j.hemY];
  const frFacing = [T4, [T5[0] + 1.2, j.blY + 5], T5];

  /* --- 釦(3顆,前中+0.5線上)--- */
  const Y1 = [j.Q1[0], j.Q1[1]];
  const Y2 = [j.Q1[0], j.hemY - K2C.btnBottom];
  const Y3 = [j.Q1[0], (Y1[1] + Y2[1]) / 2];

  /* --- 口袋位置記號(自W2往脇8、下5、寬5)--- */
  const P1 = [j.bw - K2C.pkFromCF, j.wlY];
  const P2 = [P1[0], j.wlY + K2C.pkDown];
  const P3 = [P2[0] - K2C.pkW, P2[1]];

  return { K2C, V1, V2, V3, V4, E3, E4, E5, E6, standPts, outPts, otimes, odot,
           E7, E8, E9, E10, E11, E12, E13, E8a, E11a, E12a, E13a, E14,
           G1, G2, G3, G5, G6, tiltOK, uR,
           T1, T2, bkFacing, T4, T5, frFacing, Y1, Y2, Y3, P1, P2, P3 };
}

/* =========================================================
 * 袖子(兩片袖,袖步驟一~六)
 * 座標:S3(袖山頂點)=(0,0),前=+x、後=−x,y 向下
 * ========================================================= */
function draftJacketSleeve(j, S) {
  const KS = {
    lenPlus: 2,          // 袖長 S+2
    elHalfPlus: 2.5,     // EL=S/2+2.5
    bahEase: 0.75,       // 後袖襱 BAH+0.5~1
    fCvx: 1.85,          // 前袖山凸 1.8~1.9
    fShift: 1,           // S10 沿斜線往上 1
    fCcv: 1.25,          // 前袖山凹 1.2~1.3
    bCvx: 1.95,          // 後袖山凸 1.9~2
    bShift: 1,           // S11 沿斜線往下 1
    bCcv: 0.6,           // 後袖山凹 0.5~0.7
    elFwd: 0.7,          // 前縫中心線 EL 前彎
    cuffFwd: 0.5,        // 前縫中心線袖口前彎
    cuffHalf: 12.5,      // S29~S30(整體袖口寬25)
    cuffUp: 1,           // S30 距袖口線 1(袖口後端上抬)
    vent: 8,             // 袖開叉
    fBorrow: 2.5,        // 前縫左右互借
    bBorrowTop: 2,       // 後縫上端左右互借
    bBorrowEl: 1.2,      // 後縫 EL 左右互借
    capDrop: 1.5         // 袖山高再降(本原型袖窿較深+墊肩提高使5/6偏高,2026-07-09)
  };
  const FAH = crLen(j.ahFrontJ);
  const BAH = crLen(j.ahBackJ);

  // 袖山高:S1=(A1、A3 水平線之中點)~袖襱底線,取 5/6
  const bottomY = Math.max(j.B3[1], j.B5[1]);
  const s1Level = (j.A1[1] + j.A3[1]) / 2;
  const capH = (bottomY - s1Level) * 5 / 6 - KS.capDrop;
  const S3 = [0, 0], S2 = [0, capH];
  const elY = S / 2 + KS.elHalfPlus;
  const cuffY = S + KS.lenPlus;

  // 斜線端點(袖寬線上)
  const wf = Math.sqrt(Math.max(FAH * FAH - capH * capH, 1));
  const wb = Math.sqrt(Math.max((BAH + KS.bahEase) ** 2 - capH * capH, 1));
  const S6 = [wf, capH], S7 = [-wb, capH];
  const S8 = [wf, cuffY], S9 = [-wb, cuffY];

  // G 線=前片胸褶的位置(取外套前片袖襱上胸褶點 D10 的高度)
  const gLineY = capH - (bottomY - j.D10[1]);
  const uF = jUnit(S3, S6), uBk = jUnit(S3, S7);
  const nFo = [uF[1], -uF[0]];   // 前斜線外側法線(凸向斜線外上方)
  const nBo = [-uBk[1], uBk[0]]; // 後斜線外側法線
  const otimesS = FAH / 4;       // ⊗

  // 前袖山:S12@⊗ 凸1.85、S14=G線交點沿斜線上移1、S16=中點凹1.25
  const S12 = [S3[0] + uF[0] * otimesS, S3[1] + uF[1] * otimesS];
  const S13 = [S12[0] + nFo[0] * KS.fCvx, S12[1] + nFo[1] * KS.fCvx];
  const S10 = [uF[0] * gLineY / uF[1], gLineY];
  const S14 = [S10[0] - uF[0] * KS.fShift, S10[1] - uF[1] * KS.fShift];
  const S15 = [(S10[0] + S6[0]) / 2, (S10[1] + S6[1]) / 2];
  const S16 = [S15[0] - nFo[0] * KS.fCcv, S15[1] - nFo[1] * KS.fCcv];
  // 後袖山:S17@⊗ 凸1.95、S19=G線交點沿斜線下移1、S21=中點凹0.6
  const S17 = [S3[0] + uBk[0] * otimesS, S3[1] + uBk[1] * otimesS];
  const S18 = [S17[0] + nBo[0] * KS.bCvx, S17[1] + nBo[1] * KS.bCvx];
  const S11 = [uBk[0] * gLineY / uBk[1], gLineY];
  const S19 = [S11[0] + uBk[0] * KS.bShift, S11[1] + uBk[1] * KS.bShift];
  const S20 = [(S19[0] + S7[0]) / 2, (S19[1] + S7[1]) / 2];
  const S21 = [S20[0] - nBo[0] * KS.bCcv, S20[1] - nBo[1] * KS.bCcv];

  // 袖山頂點呈水平狀:S3 左右加水平導引點;
  // 交點 S14/S19 前後加斜線貼合點(相切)、長段中點加小凸量,曲線才圓潤(2026-07-09 使用者挑錯)
  const blgUp = 0.8;
  const BF1 = [(S3[0] + S13[0]) / 2 + nFo[0] * blgUp, (S3[1] + S13[1]) / 2 + nFo[1] * blgUp];
  const BB1 = [(S3[0] + S18[0]) / 2 + nBo[0] * blgUp, (S3[1] + S18[1]) / 2 + nBo[1] * blgUp];
  const capPts = [S7, S21, S19, S18, BB1, [-0.35, 0.02], S3,
                  [0.35, 0.02], BF1, S13, S14, S16, S6];
  // 完成線=取樣後移動平均平滑(雲尺效果);長度/交點/反拓皆用平滑折線
  const capPoly = jSmooth(jSampleCR(capPts, 40), 6, 1);
  const capLen = jPolyLen(capPoly);
  const ease = capLen - (FAH + BAH);

  // 內外袖基礎線
  const S22 = [wf / 2, capH], S23 = [-wb / 2, capH];
  // 前縫中心線 S22→S28→S29
  const S24 = [S22[0], elY], S26 = [S22[0], cuffY];
  const S28 = [S22[0] + KS.elFwd, elY], S29 = [S22[0] + KS.cuffFwd, cuffY];
  // S30:距 S29=12.5 且距袖口線 1(袖口線後端上抬,袖口邊=斜線 S29~S30)
  const S30 = [S29[0] - Math.sqrt(KS.cuffHalf * KS.cuffHalf - KS.cuffUp * KS.cuffUp),
               cuffY - KS.cuffUp];
  // 後縫中心線 S23→S33→S32(S31=S23~S30直線交EL、S33=S25~S31中點、S32=S30上8=開叉)
  const S25 = [S23[0], elY];
  const uG = jUnit(S23, S30);
  const S31 = [S23[0] + uG[0] * (elY - capH) / uG[1], elY];
  const S33 = [(S25[0] + S31[0]) / 2, elY];
  const uV = jUnit(S30, S33);
  const S32 = [S30[0] + uV[0] * KS.vent, S30[1] + uV[1] * KS.vent];
  const backSeamC = [S23, S33, S32];

  // 袖底反拓(內袖用):K1/K2=袖山線與基礎線交點,弧線對基礎線鏡射
  const hitsK1 = jPolyAtX(capPoly, S22[0]);
  const K1 = hitsK1.length ? hitsK1[hitsK1.length - 1] : S22;
  const hitsK2 = jPolyAtX(capPoly, S23[0]);
  const K2 = hitsK2.length ? hitsK2[0] : S23;
  // 前側:cap 上 x≥S22x 的下段(K1→S6)鏡射;後側:x≤S23x 的下段(S7→K2)鏡射
  const frontLow = [];
  for (let i = capPoly.length - 1; i >= 0; i--) {         // 自 S6 往回
    frontLow.push(capPoly[i]);
    if (capPoly[i][0] < S22[0]) break;
  }
  const mirF = frontLow.map(p => [2 * S22[0] - p[0], p[1]]).reverse(); // K1側→S2側
  const backLow = [];
  for (let i = 0; i < capPoly.length; i++) {              // 自 S7 往前
    backLow.push(capPoly[i]);
    if (capPoly[i][0] > S23[0]) break;
  }
  const mirB = backLow.map(p => [2 * S23[0] - p[0], p[1]]).reverse();

  // 外袖(紅):前縫+2.5、後縫上2/EL1.2、後縫收於 S32(開叉頂)、袖口沿斜線
  const uCuff = jUnit(S30, S29);
  const K3 = [S22[0] + KS.fBorrow, capH], K7 = [S28[0] + KS.fBorrow, elY];
  const K9 = [S29[0] + uCuff[0] * KS.fBorrow, S29[1] + uCuff[1] * KS.fBorrow];
  const K12 = [S23[0] - KS.bBorrowTop, capH], K15 = [S33[0] - KS.bBorrowEl, elY];
  const hK5 = jPolyAtX(capPoly, K3[0]);
  const K5 = hK5.length ? hK5[hK5.length - 1] : K3;
  const hK13 = jPolyAtX(capPoly, K12[0]);
  const K13 = hK13.length ? hK13[0] : K12;
  // 內袖(藍):前縫−2.5、後縫上2/EL1.2(往內),頂邊=反拓弧線
  const K4 = [S22[0] - KS.fBorrow, capH], K8 = [S28[0] - KS.fBorrow, elY];
  const K10 = [S29[0] - uCuff[0] * KS.fBorrow, S29[1] - uCuff[1] * KS.fBorrow];
  const K11 = [S23[0] + KS.bBorrowTop, capH], K16 = [S33[0] + KS.bBorrowEl, elY];
  const hK6 = jPolyAtX(mirF, K4[0]);
  const K6 = hK6.length ? hK6[0] : K4;
  const hK14 = jPolyAtX(mirB, K11[0]);
  const K14 = hK14.length ? hK14[0] : K11;

  // 袖釦:S32~Y1=1.5、Y1~Y2=1.5、Y2~Y3=3(沿開叉線往袖口),釦子在 Y2、Y3
  const uDn = jUnit(S32, S30);
  const sy1 = [S32[0] + uDn[0] * 1.5, S32[1] + uDn[1] * 1.5];
  const sb1 = [sy1[0] + uDn[0] * 1.5, sy1[1] + uDn[1] * 1.5];   // Y2
  const sb2 = [sb1[0] + uDn[0] * 3, sb1[1] + uDn[1] * 3];       // Y3

  return { S, KS, FAH, BAH, capH, elY, cuffY, gLineY, otimesS,
           S2, S3, S6, S7, S8, S9, S10, S11, S12, S13, S14, S16, S17, S18, S19, S21,
           S22, S23, S24, S25, S26, S28, S29, S30, S31, S32, S33,
           capPts, capLen, ease, capPoly, K1, K2, mirF, mirB,
           K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16,
           sy1, sb1, sb2, backSeamC };
}

/* ---------- SVG(製圖底稿:後片+前片並排;d=領/貼邊/釦/口袋) ---------- */
function jacketSVG(j, d) {
  const m = 2.5;
  // 前片整體右移,和後片分開
  const backMaxX = Math.max(j.H6[0], j.B3[0]) + 3;
  const frontMinX = Math.min(j.H7[0], j.B5[0], j.A3[0]) - 1;
  const dx = backMaxX + m - frontMinX;
  const T = p => [p[0] + dx, p[1]];

  let minY = Math.min(j.N2[1], j.A1[1], j.N4[1] + 0, j.E2[1], j.bod.frontTopY) - m - 1.5;
  if (d) {
    const dTop = [d.E5, d.E8, d.E8a, d.E11, d.E11a, d.G3 || d.E5, d.G5 || d.E5]
      .reduce((mn, p) => Math.min(mn, p[1]), 1e9);
    minY = Math.min(minY, dTop - m);
  }
  const maxX = j.Q3[0] + dx + m + 2;
  const maxY = j.hemY + m + 1;
  let s = svgOpen(-m, minY, maxX + m, maxY - minY);

  const seam = 'fill="none" stroke="#c0392b" stroke-width="0.08"';
  const seamDash = 'fill="none" stroke="#c0392b" stroke-width="0.06" stroke-dasharray="0.5 0.3"';
  const lbl = S.label, sm = S.small;

  /* ===== 後片 ===== */
  // 水平基準線(BL/WL/HL/下襬)
  for (const [y, name] of [[j.blY, 'BL'], [j.wlY, 'WL'], [j.hlY, 'HL'], [j.hemY, 'HEM']]) {
    s += line([0, y], [j.H6[0] + 2, y], S.guide);
    s += text([j.H6[0] + 2.2, y + 0.25], name, sm);
  }
  // 原型參考(灰虛線):原肩線與原袖襱
  s += line(j.bod.SNPb, j.bod.SPb, S.guide);
  s += path(crPathD(j.bod.ahBackPts), S.guide);
  // 後中:N~C 直線(摺雙段)+ C→W7 →H5→L5 拼縫
  s += line(j.N, j.Cc, S.outline);
  s += line(j.Cc, j.W7, S.outline);
  s += line(j.W7, j.L5, S.outline);
  // 領口 N→N2
  s += path(crPathD([j.N, [j.N2[0] * 0.55, j.N2[1] * 0.25], j.N2]), S.outline);
  // 肩線 N2→A1、袖襱
  s += line(j.N2, j.A1, S.outline);
  s += path(crPathD(j.ahBackJ), S.outline);
  // 脇邊:B3→W4→H3 + 直線延伸至 L8
  s += path(crPathD([j.B3, j.W4, j.H3]), S.outline);
  s += line(j.H3, j.L8, S.outline);
  // 下襬:L5→L7→L8
  s += path(crPathD([j.L5, j.L7, j.L8]), S.outline);
  // 脇邊直向導引(B2 垂直線)
  s += line(j.B2, [j.B2[0], j.hemY], S.guide);
  // 派內爾剪接線(紅)
  s += path(crPathD([j.D1, j.D4, j.D2]), seam);
  s += path(crPathD([j.D1, j.D5, j.D3]), seam);
  s += line(j.D2, j.L29, seam);
  s += line(j.D3, j.L38, seam);
  s += line([j.D6[0], j.wlY], [j.D6[0], j.hlY], seamDash);
  // 對合點 M2
  s += dot(j.M2);
  // 點與標註
  const bkPts = [['N', j.N, -0.9, -0.3], ['C', j.Cc, -0.9, 0.2], ['B6', j.B6, -1.6, 0.2],
    ['W1', j.W1, -1.9, 0.2], ['L1', j.L1, -1.9, 0.6], ['L5', j.L5, -0.4, 1.2],
    ['N2', j.N2, -0.4, -0.6], ['A1', j.A1, 0.3, -0.3], ['M2', j.M2, 0.3, 0],
    ['D1', j.D1, 0.35, 0], ['B1', j.B1, -1.7, -0.35], ['B2', j.B2, 0.15, -0.35],
    ['B3', j.B3, 0.25, 0.4], ['W4', j.W4, -1.9, -0.3], ['W3', j.W3, 0.25, -0.3],
    ['H3', j.H3, 0.3, -0.3], ['H6', j.H6, 0.25, -0.3], ['H5', j.H5, -1.9, -0.3],
    ['W7', j.W7, 0.2, -0.35], ['D4', j.D4, -0.6, -0.5], ['D5', j.D5, 0.25, -0.5],
    ['D2', j.D2, -1.2, -0.3], ['D3', j.D3, 0.25, -0.3],
    ['D8', j.D8, -1.6, -0.3], ['D9', j.D9, 0.3, -0.3],
    ['L7', j.L7, -0.4, 1.2], ['L8', j.L8, 0.3, 0.2], ['L6', j.L6, 0.3, 1]];
  for (const [t0, p, ox, oy] of bkPts) { s += dot(p); s += text([p[0] + ox, p[1] + oy], t0, sm); }
  s += text([j.Cc[0] + 1, minY + m + 0.5], 'BACK', lbl);
  s += text([0.2, j.hemY + 2], 'CB', sm);

  if (d) {
    /* 後腰帶位置 V1~V4 */
    s += line(d.V1, d.V3, seamDash);
    s += line(d.V2, d.V4, seamDash);
    s += text([d.V1[0] + 0.2, d.V1[1] - 0.3], 'V1', sm);
    s += text([d.V2[0] + 0.2, d.V2[1] + 0.9], 'V2', sm);
    s += text([d.V3[0] + 0.3, d.V3[1] - 0.3], 'V3', sm);
    s += text([d.V4[0] + 0.3, d.V4[1] + 0.9], 'V4', sm);
    /* 後領(領腰/領外圍) */
    s += path(crPathD(d.standPts), seam);
    s += path(crPathD(d.outPts), seam);
    s += line(d.E3, d.E5, seam);                       // 後中段
    s += line(d.E4, d.E6, seam);                       // 側段
    for (const [t0, p, ox, oy] of [['E3', d.E3, -1.5, 0.2], ['E4', d.E4, 0.2, -0.3],
      ['E5', d.E5, -1.5, 0.2], ['E6', d.E6, 0.3, 0.3]]) { s += dot(p); s += text([p[0] + ox, p[1] + oy], t0, sm); }
    /* 後貼邊 */
    s += path(crPathD(d.bkFacing), seamDash);
    s += text([d.T1[0] + 0.3, d.T1[1] + 0.5], 'T1', sm);
    s += text([d.T2[0] + 0.2, d.T2[1] + 0.6], 'T2', sm);
  }

  /* ===== 前片 ===== */
  for (const [y] of [[j.blY], [j.wlY], [j.hlY], [j.hemY]]) {
    s += line(T([j.H7[0] - 2, y]), T([j.Q3[0] + 1, y]), S.guide);
  }
  // 原型參考:原前肩線、原袖襱(上/下)、剩餘1/3胸褶(鬆份)
  s += line(T(j.SNPf), T(j.bod.SPf), S.guide);
  s += path(crPathD(j.bod.ahFrontUp.map(T)), S.guide);
  s += path(crPathD(j.bod.ahFrontLow.map(T)), S.guide);
  s += line(T(j.BP), T(j.bod.G2), S.guide);
  s += line(T(j.BP), T(j.G1r), S.guide);
  // 領口 N4→FNP、CF
  s += path(crPathD(j.neckPts.map(T)), S.outline);
  s += line(T(j.FNP), T([j.bw, j.hemY]), S.guide);
  s += text(T([j.bw - 0.3, j.hemY + 2]), 'CF', sm);
  // 肩、袖襱
  s += line(T(j.N4), T(j.A3), S.outline);
  s += path(crPathD(j.ahFrontJ.map(T)), S.outline);
  // 脇邊 B5→W6→H4 + 延伸至 L10
  s += path(crPathD([j.B5, j.W6, j.H4].map(T)), S.outline);
  s += line(T(j.H4), T(j.L10), S.outline);
  // 門襟:前中+0.5 線、持出線、下襬
  s += line(T(j.Q1), T(j.Q2), S.outline);
  s += line(T(j.Q1), T(j.Q3), S.outline);
  s += line(T(j.Q3), T(j.Q4), S.outline);
  s += path(crPathD([j.Q4, [ (j.Q4[0] + j.L9[0]) / 2, j.hemY], j.L10].map(T)), S.outline);
  // 脇邊直向導引(B5 垂直線)
  s += line(T([j.B5[0], j.B5[1]]), T([j.B5[0], j.hemY]), S.guide);
  // 派內爾剪接線(紅):D10→D13→D11 / D12
  s += path(crPathD([j.D10, j.D13, j.D11].map(T)), seam);
  s += path(crPathD([j.D10, j.D13, j.D12].map(T)), seam);
  s += line(T(j.D11), T(j.L1117), seam);
  s += line(T(j.D12), T(j.L1216), seam);
  s += line(T([j.D14[0], j.wlY]), T([j.D14[0], j.hlY]), seamDash);
  // 脇褶 ◎ 合併記號(紅):D13→R1、D13→R2
  s += line(T(j.D13), T(j.R1), seam);
  s += line(T(j.D13), T(j.R2), seam);
  // 翻領線(紅虛線)Q3→E2→延伸
  s += line(T(j.Q3), T(j.rollEnd), seamDash);
  const frPts = [['N4', j.N4, -1.6, -0.3], ['A3', j.A3, -1.7, 0.1], ['D10', j.D10, 0.35, -0.2],
    ['B4', j.B4, -1.7, -0.2], ['B5', j.B5, -1.7, 0.5], ['BP', j.BP, 0.3, -0.3],
    ['D13', j.D13, -0.9, 1], ['R1', j.R1, -1.6, 0], ['R2', j.R2, -1.6, 0.6],
    ['W6', j.W6, -1.9, -0.3], ['W5', j.W5, -1.9, 0.9], ['H4', j.H4, -1.9, -0.3],
    ['H7', j.H7, -1.9, -0.3], ['H2', j.H2, -1.7, -0.3],
    ['D11', j.D11, 0.25, -0.3], ['D12', j.D12, -2.3, -0.3], ['D14', j.D14, -0.9, 1],
    ['D16', j.D16, 0.3, -0.3], ['D17', j.D17, -2.3, -0.3],
    ['W2', j.W2, 0.3, -0.3], ['B7', j.B7, 0.3, -0.3],
    ['Q1', j.Q1, -1.7, 0.3], ['Q3', j.Q3, 0.3, 0.3], ['Q2', j.Q2, -1.7, 1.2], ['Q4', j.Q4, 0.3, 1.2],
    ['E', j.Ept, 0.25, 0.55], ['E1', j.E1, 0.25, 0.3], ['E2', j.E2, 0.3, -0.2],
    ['L10', j.L10, -0.6, 1.4], ['L9', j.L9, -2.2, 1.4], ['FNP', j.FNP, 0.35, 0.4]];
  for (const [t0, p, ox, oy] of frPts) { const q = T(p); s += dot(q); s += text([q[0] + ox, q[1] + oy], t0, sm); }
  s += text(T([j.D14[0], minY + m + 0.5]), 'FRONT', lbl);

  if (d) {
    /* 下片領+領嘴(穿著位置=翻領線左側,虛線) */
    s += line(T(j.Q3), T(d.E8), seamDash);
    s += line(T(d.E8), T(d.E9), seamDash);
    s += line(T(d.E11), T(d.E13), seamDash);
    s += line(T(d.E13), T(d.E12), seamDash);
    /* 版型位置(右側,實線):領邊 Q3→E8a、上緣 E8a→E14、領圍 E14→N4 */
    const uLap = jUnit(j.Q3, d.E8a);
    const nLap = [-uLap[1], uLap[0]];
    const lapMid = [(j.Q3[0] + d.E8a[0]) / 2 + nLap[0] * 0.3, (j.Q3[1] + d.E8a[1]) / 2 + nLap[1] * 0.3];
    s += path(crPathD([j.Q3, lapMid, d.E8a].map(T)), seam);
    s += line(T(d.E8a), T(d.E14), seam);
    s += path(crPathD([j.N4, [(j.N4[0] + d.E14[0]) / 2 + 0.25, (j.N4[1] + d.E14[1]) / 2 - 0.25], d.E14].map(T)), seam);
    /* 領嘴(版型位置) */
    s += line(T(d.E12a), T(d.E13a), seam);
    s += line(T(d.E13a), T(d.E11a), seam);
    /* 後領長方形(倒伏後)+外圍修順 */
    if (d.tiltOK) {
      s += line(T(j.N4), T(d.G1), seam);               // 領圍縫合邊 G4~G1
      s += line(T(d.G1), T(d.G3), seam);               // 領後中心
      s += line(T(d.G6), T(d.G2), seamDash);           // 翻領摺線
      s += path(crPathD([d.G3, d.G5, d.E11a].map(T)), seam);  // 領外圍修順
      for (const [t0, p, ox, oy] of [['G1', d.G1, 0.2, -0.3], ['G2', d.G2, 0.2, -0.3],
        ['G3', d.G3, 0.2, -0.4], ['G4', j.N4, -1.6, 0.8], ['G6', d.G6, 0.3, 0.4]]) {
        const q = T(p); s += dot(q); s += text([q[0] + ox, q[1] + oy], t0, sm);
      }
    }
    for (const [t0, p, ox, oy] of [['E7', d.E7, 0.25, 0.4], ['E8', d.E8, -1.6, 0],
      ['E9', d.E9, 0.3, 0.2], ['E10', d.E10, 0.3, 0.7], ['E11', d.E11, -1.9, 0],
      ['E12', d.E12, -2.2, 0.4], ['E13', d.E13, -2.2, -0.2],
      ['E8a', d.E8a, 0.3, 0.4], ['E11a', d.E11a, 0.35, -0.2], ['E12a', d.E12a, -1, 1],
      ['E13a', d.E13a, 0.35, 0.3], ['E14', d.E14, -0.6, -0.5]]) {
      const q = T(p); s += dot(q); s += text([q[0] + ox, q[1] + oy], t0, sm);
    }
    /* 前貼邊 */
    s += path(crPathD(d.frFacing.map(T)), seamDash);
    s += text(T([d.T4[0] - 1.6, d.T4[1] + 0.9]), 'T4', sm);
    s += text(T([d.T5[0] - 0.6, d.T5[1] + 1.2]), 'T5', sm);
    /* 釦(3顆) */
    for (const [t0, p] of [['Y1', d.Y1], ['Y3', d.Y3], ['Y2', d.Y2]]) {
      const q = T(p);
      s += `<circle cx="${fmt(q[0])}" cy="${fmt(q[1])}" r="1" fill="none" stroke="#c0392b" stroke-width="0.07"/>`;
      s += dot(q);
      s += text([q[0] + 1.2, q[1] + 0.3], t0, sm);
    }
    /* 口袋位置 */
    s += line(T(d.P1), T(d.P2), seamDash);
    s += line(T(d.P2), T(d.P3), seam);
    for (const [t0, p, ox, oy] of [['P1', d.P1, 0.25, -0.3], ['P2', d.P2, 0.25, 0.7], ['P3', d.P3, -1.6, 0.7]]) {
      const q = T(p); s += dot(q); s += text([q[0] + ox, q[1] + oy], t0, sm);
    }
  }

  s += '</svg>';
  return s;
}

/* ---------- 袖 SVG(兩片袖:紅=外袖、藍=內袖) ---------- */
function jacketSleeveSVG(sl) {
  const m = 2.5;
  const x0 = sl.S7[0] - m - 2, x1 = sl.S6[0] + m + 2;
  let s = svgOpen(x0, -m - 1, x1 - x0, sl.cuffY + 2 * m + 2);

  const seam = 'fill="none" stroke="#c0392b" stroke-width="0.09"';
  const seamB = 'fill="none" stroke="#2467a8" stroke-width="0.09"';
  const sm = S.small;

  /* 基準線 */
  s += line([0, 0], [0, sl.cuffY], S.guide);                       // 袖中心
  for (const [y, name] of [[sl.capH, 'W'], [sl.elY, 'EL'], [sl.cuffY, 'CUFF'], [sl.gLineY, 'G']]) {
    s += line([sl.S7[0] - 1, y], [sl.S6[0] + 1, y], S.guide);
    s += text([sl.S6[0] + 1.2, y + 0.25], name, sm);
  }
  s += line(sl.S3, sl.S6, S.guide);                                // 前斜線
  s += line(sl.S3, sl.S7, S.guide);                                // 後斜線
  s += line(sl.S6, sl.S8, S.guide);
  s += line(sl.S7, sl.S9, S.guide);
  s += line(sl.S22, [sl.S22[0], sl.cuffY], S.guide);               // 內外袖基礎線
  s += line(sl.S23, [sl.S23[0], sl.cuffY], S.guide);
  /* 袖山弧線(黑,平滑後;K13~K5 之間為外袖完成線,紅) */
  s += path(crPathD(jThin(sl.capPoly, 10)), S.outline);
  const iS = sl.capPoly.findIndex(p => p[0] >= sl.K12[0]);
  let iE = sl.capPoly.length - 1;
  while (iE > 0 && sl.capPoly[iE][0] > sl.K3[0]) iE--;
  if (iS >= 0 && iE > iS) s += path(crPathD(jThin(sl.capPoly.slice(iS, iE + 1), 6)), seam);
  /* 袖底反拓弧線(灰虛線;K6~S2~K14 之間為內袖完成線,藍) */
  s += path(crPathD(jThin(sl.mirF, 6)), S.guide);
  s += path(crPathD(jThin(sl.mirB, 6)), S.guide);
  const blueF = sl.mirF.filter(p => p[0] <= sl.K4[0]);
  const blueB = sl.mirB.filter(p => p[0] >= sl.K11[0]);
  if (blueF.length > 2) s += path(crPathD(jThin(blueF, 4)), seamB);
  if (blueB.length > 2) s += path(crPathD(jThin(blueB, 4)), seamB);
  /* 前縫/後縫中心線(灰虛線) */
  s += path(crPathD([sl.S22, sl.S28, sl.S29]), S.guide);
  s += path(crPathD(sl.backSeamC), S.guide);
  /* 外袖(紅):K5→K3→K7→K9→袖口→S30→S32→K15→K12→K13 + 袖山 */
  s += line(sl.K5, sl.K3, seam);
  s += path(crPathD([sl.K3, sl.K7, sl.K9]), seam);
  s += line(sl.K9, sl.S30, seam);
  s += path(crPathD([sl.K12, sl.K15, sl.S32]), seam);
  s += line(sl.S32, sl.S30, seam);
  s += line(sl.K13, sl.K12, seam);
  /* 內袖(藍):K6→K4→K8→K10→袖口→S30→S32→K16→K11→K14 + 反拓弧 */
  s += line(sl.K6, sl.K4, seamB);
  s += path(crPathD([sl.K4, sl.K8, sl.K10]), seamB);
  s += line(sl.K10, sl.S30, seamB);
  s += path(crPathD([sl.K11, sl.K16, sl.S32]), seamB);
  s += line(sl.S32, sl.S30, seamB);
  s += line(sl.K14, sl.K11, seamB);
  /* 袖開叉+袖釦(Y2、Y3 兩顆) */
  s += dot(sl.S32);
  s += text([sl.S32[0] + 0.3, sl.S32[1]], 'S32', sm);
  s += dot(sl.sy1);
  for (const b of [sl.sb1, sl.sb2]) {
    s += `<circle cx="${fmt(b[0])}" cy="${fmt(b[1])}" r="0.7" fill="none" stroke="#c0392b" stroke-width="0.06"/>`;
    s += dot(b);
  }
  /* 點標註 */
  const pts = [['S3', sl.S3, 0.3, -0.4], ['S2', sl.S2, 0.25, 1], ['S6', sl.S6, 0.3, -0.3],
    ['S7', sl.S7, -1.7, -0.3], ['S22', sl.S22, 0.25, -0.4], ['S23', sl.S23, -2.4, -0.4],
    ['S28', sl.S28, 0.3, -0.3], ['S29', sl.S29, 0.3, 1.2], ['S30', sl.S30, -1, 1.4],
    ['S33', sl.S33, -2.4, -0.3], ['K1', sl.K1, 0.3, 0.6], ['K2', sl.K2, -1.5, 0.6],
    ['K3', sl.K3, 0.3, 1], ['K4', sl.K4, -1.6, 1], ['K5', sl.K5, 0.3, -0.3],
    ['K12', sl.K12, -2.4, 1], ['K11', sl.K11, 0.3, 1],
    ['S13', sl.S13, 0.3, -0.3], ['S18', sl.S18, -2.2, -0.3]];
  for (const [t0, p, ox, oy] of pts) { s += dot(p); s += text([p[0] + ox, p[1] + oy], t0, sm); }
  s += text([sl.S7[0], -m + 0.7], 'SLEEVE (RED=OUTER, BLUE=INNER)', S.label);
  s += '</svg>';
  return s;
}

/* ---------- 計算結果表 ---------- */
function jacketValuesHTML(j, d, sl) {
  const r1 = v => Math.round(v * 100) / 100;
  const rows = [
    ['衣長(WL以下)/ 腰長', j.coatLen + ' / ' + j.K.waistLen + ' cm'],
    ['轉褶:後1/2肩褶轉袖襱 / 前2/3胸褶轉脇', r1(-j.rotB * 180 / Math.PI) + '° / ' + r1(j.rotF * 180 / Math.PI) + '°'],
    ['後肩線 ★(N2~A1 實測)', r1(j.star) + ' cm'],
    ['前肩線 ★−0.5(0.5=後肩縮縫份)', r1(j.star - j.K.shEase) + ' cm'],
    ['後袖襱外推 M1~M2', j.K.m2Out + ' cm'],
    ['腰收(脇 W3~W4/W5~W6)/(後中 W1~W7)', j.K.waistIn + ' / ' + j.K.cbWaistIn + ' cm'],
    ['後臀寬 H5~H6=H/4+' + j.K.hipEase + '−1', r1(j.Hip / 4 + j.K.hipEase - 1) + ' cm'],
    ['△後(H3~H6,補入後剪接線)', r1(j.triB) + ' cm'],
    ['前臀寬 H2~H7=H/4+' + j.K.hipEase + '+1', r1(j.Hip / 4 + j.K.hipEase + 1) + ' cm'],
    ['△前(H4~H7,補入前剪接線)', r1(j.triF) + ' cm'],
    ['前脇 FSS / 後脇 BSS', r1(j.FSS) + ' / ' + r1(j.BSS) + ' cm'],
    ['◎=FSS−BSS(脇褶,車縫時轉入剪接線)', r1(j.circ) + ' cm'],
    ['下襬脇邊起翹 ●', r1(j.riseB) + ' cm'],
    ['門襟:前中外放 / 持出寬 / 第1釦高', j.K.cfOut + ' / ' + j.K.overlap + ' / BL下' + j.K.lapelBtnDrop + ' cm'],
    ['前領腰 E1~E2(E下0.5/上2)', (j.K.eBk + j.K.eFw) + ' cm'],
    ['剪接線常數:A1~D1 / 後腰起點+褶 / 胸線起點+寬', j.K.d1Arm + ' / ' + j.K.d2FromCB + '+' + j.K.wDartB + ' / ' + j.K.d4FromCB + '+' + j.K.d45 + ' cm'],
    ['前剪接常數:前腰起點+褶 / D13(BP往脇)', j.K.d11FromCF + '+' + j.K.wDartF + ' / ' + j.K.d13FromBP + ' cm']
  ];
  if (d) {
    rows.push(
      ['領:後領圍 ⊗(N2~N)', r1(d.otimes) + ' cm'],
      ['領:後領外圍 ⊙(E6~E5)', r1(d.odot) + ' cm'],
      ['領:領腰/領面(後中3+4;側2.5/4.5)', d.K2C.standH + ' / ' + d.K2C.fallH + ' cm'],
      ['領:倒伏對合 G3~E11a(應=⊙)', d.tiltOK ? r1(Math.hypot(d.G3[0] - d.E11a[0], d.G3[1] - d.E11a[1])) + ' cm' : '無解(請回報)'],
      ['下片領:Q3~E7 / 領寬E7~E8 / E7~E9', d.K2C.q3e7 + ' / ' + d.K2C.lapelW + ' / ' + d.K2C.e7e9 + ' cm'],
      ['領嘴:E10~E11 / E8~E12 / 正三角形', d.K2C.e10e11 + ' / ' + d.K2C.e8e12 + ' / ' + d.K2C.notch + ' cm'],
      ['貼邊:後(肩3/後中6.5)、前(肩3/下襬6.25)', '—'],
      ['釦:3顆(Y1=第1釦、Y2=下襬上' + d.K2C.btnBottom + '、Y3=中點)', '—'],
      ['口袋:W2往脇' + d.K2C.pkFromCF + '/下' + d.K2C.pkDown + '/寬' + d.K2C.pkW + '(位置記號,袋型可依款式)', '—']
    );
  }
  if (sl) {
    rows.push(
      ['袖:FAH / BAH(衣身實測)', r1(sl.FAH) + ' / ' + r1(sl.BAH) + ' cm'],
      ['袖:斜線 前FAH / 後BAH+' + sl.KS.bahEase, r1(sl.FAH) + ' / ' + r1(sl.BAH + sl.KS.bahEase) + ' cm'],
      ['袖山高(A1A3中點~袖襱底)×5/6', r1(sl.capH) + ' cm'],
      ['袖:⊗=FAH/4', r1(sl.otimesS) + ' cm'],
      ['袖山縮縫份(弧長−FAH−BAH;毛料一般約3~3.5)', r1(sl.ease) + ' cm'],
      ['袖長+2 / EL=袖長/2+2.5', r1(sl.cuffY) + ' / ' + r1(sl.elY) + ' cm'],
      ['袖口 S29~S30(整體25=外15+內10;S30距袖口線1) / 開叉', sl.KS.cuffHalf + ' / ' + sl.KS.vent + ' cm'],
      ['內外袖互借:前±2.5 / 後上±2、EL±1.2(後縫收於S32)', '—'],
      ['袖釦 2顆(S32下1.5=Y1、Y2=Y1+1.5、Y3=Y2+3,在Y2/Y3)', '—']
    );
  }
  let h = '<table><tbody>';
  for (const [k, v] of rows) h += `<tr><td>${k}</td><td>${v}</td></tr>`;
  return h + '</tbody></table>';
}
