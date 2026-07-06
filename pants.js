/* =========================================================
 * 女裝直筒褲原型(ストレートパンツ,簡化文化式)
 * 前片寬=H/4+2、前襠寬=前片寬/4−1.5、後襠寬=前襠寬+(前片寬/4−1)
 * 摺山線=(片寬+襠寬)/2、KL=股上+股下/2−7、褲口半寬=摺山−3.5(後+1.5)
 * 腰:前=W/4+1、後=W/4;脇收2.5、上抬1.2;後中心上抬2.5內收2
 * 長度:長褲=褲長 / 5分=股上+股下/2 / 3分熱褲=股上+10
 * 鬆緊帶版:無省無收腰,腰口直線,折入3.5cm穿帶,鬆緊帶長≈0.9W
 * 來源:https://maisondeas.com/straight-pants-pattern/
 *       https://maisondeas.com/an-elastic-waistband/
 * ========================================================= */

function draftPants(W, H, rise, hipLen, Lfull, lenType, elastic) {
  const fw = H / 4 + 2;                 // 前片臀圍寬
  const cf = fw / 4 - 1.5;              // 前襠寬
  const cb = cf + (fw / 4 - 1);         // 後襠寬
  const bw = fw;                        // 後片臀圍寬
  const creaseF = (fw + cf) / 2;        // 前摺山線
  const creaseB = (bw + cb) / 2;        // 後摺山線
  const inseam = Lfull - rise;          // 股下
  const KLy = rise + inseam / 2 - 7;    // 膝線
  const hwF = creaseF - 3.5;            // 前褲口半寬
  const hwB = hwF + 1.5;                // 後褲口半寬
  const hemY = lenType === 'full' ? Lfull
             : lenType === 'half' ? rise + inseam / 2
             : rise + 10;               // 3分熱褲
  const availF = fw - 1.5 - 2.5, targetF = W / 4 + 1;
  const availB = bw - 2 - 2.5,   targetB = W / 4;
  const dartF = elastic ? 0 : availF - targetF;
  const dartB = elastic ? 0 : availB - targetB;
  const zipLen = hipLen + 2;
  const elasticLen = Math.round(W * 0.9 * 10) / 10;
  return { W, H, rise, hipLen, Lfull, lenType, elastic,
           fw, cf, cb, bw, creaseF, creaseB, inseam, KLy, hwF, hwB,
           hemY, dartF, dartB, zipLen, elasticLen };
}

function pantsSVG(p) {
  const m = 2.5, gap = 6;
  const ox = p.fw + p.cf + gap;                       // 後片水平偏移
  const totalW = ox + p.bw + p.cb;
  const minX = -m, minY = -m - 2.5;
  const w = totalW + 2 * m, h = p.hemY + m + 1.5 - minY;
  let s = svgOpen(minX, minY, w, h);
  const yH = p.hipLen, yR = p.rise, yL = p.hemY, yK = p.KLy;
  const showKL = yL > p.KLy + 2;

  // x 內插:股線以下沿錐形線
  const taper = (x0, x1, y) => {
    if (y <= yR) return x0;
    const yy = Math.min(y, yK);
    let x = x0 + (x1 - x0) * (yy - yR) / (yK - yR);
    return x;
  };

  // ==== 單片繪製(fitted 前片 / 後片) ====
  function piece(o, pw, cw, crease, hw, isBack) {
    const tip = [o + pw + cw, yR];
    const sideKL = o + crease - hw, inKL = o + crease + hw;
    const ctrTop = p.elastic ? [o + pw, 0]
                 : isBack ? [o + pw - 2, -2.5] : [o + pw - 1.5, 0];
    const sTop = p.elastic ? [o, 0] : [o + 2, -1.2];
    let g = '';
    // 導引線
    g += line([o, 0], [o + pw, 0], S.guide);                       // WL
    g += line([o, yH], [o + pw, yH], S.guide);                     // HL
    g += line([o, yR], [tip[0], yR], S.guide);                     // 股線
    g += line([o + crease, yR - 3], [o + crease, yL - 2], S.guide);// 摺山
    if (showKL) g += line([taper(o, sideKL, yK), yK], [taper(tip[0], inKL, yK), yK], S.guide); // KL
    // 脇線(KL處以垂直切線接順)
    g += path(crPathD([sTop, [o, yH], [o, yR]]), S.outline);
    if (yL > yK) {
      const yv = Math.min(yK + 8, yL);
      g += path(crPathD([[o, yR], [(o + sideKL) / 2 + 0.3, (yR + yK) / 2], [sideKL, yK], [sideKL, yv]]), S.outline);
      if (yL > yv) g += line([sideKL, yv], [sideKL, yL], S.outline);
    } else {
      const ex = taper(o, sideKL, yL);
      g += path(crPathD([[o, yR], [(o + ex) / 2 + 0.2, (yR + yL) / 2], [ex, yL]]), S.outline);
    }
    // 中心線+襠彎
    if (p.elastic) g += line(ctrTop, [o + pw, yR - 6], S.outline);
    else g += path(crPathD([ctrTop, [o + pw, yH], [o + pw, yR - 6]]), S.outline);
    g += path(crPathD([[o + pw, yR - 6], [o + pw + cw * (isBack ? 0.35 : 0.3), yR - (isBack ? 0.8 : 1.2)], tip]), S.outline);
    // 股下線(內彎曲線,KL處以垂直切線接順)
    if (yL > yK) {
      const yv = Math.min(yK + 8, yL);
      g += path(crPathD([tip, [(tip[0] + inKL) / 2 - 0.8, (yR + yK) / 2], [inKL, yK], [inKL, yv]]), S.outline);
      if (yL > yv) g += line([inKL, yv], [inKL, yL], S.outline);
    } else {
      const ex = taper(tip[0], inKL, yL);
      g += path(crPathD([tip, [(tip[0] + ex) / 2 - 0.5, (yR + yL) / 2], [ex, yL]]), S.outline);
    }
    // 褲口
    g += line([taper(o, sideKL, yL), yL], [taper(tip[0], inKL, yL), yL], S.outline);
    // 腰線
    g += path(crPathD([sTop, [(sTop[0] + ctrTop[0]) / 2, (sTop[1] + ctrTop[1]) / 2 + 0.4], ctrTop]), S.outline);
    // 腰省
    const dTotal = isBack ? p.dartB : p.dartF;
    if (dTotal > 0.3) {
      const n = dTotal > 3 ? 2 : 1, dw = dTotal / n;
      const lens = isBack ? [12, 10] : [9, 7.5];
      for (let i = 1; i <= n; i++) {
        const cx = sTop[0] + (ctrTop[0] - sTop[0]) * i / (n + 1);
        const yTop = sTop[1] + (ctrTop[1] - sTop[1]) * (cx - sTop[0]) / (ctrTop[0] - sTop[0]) + 0.3;
        const ln = Math.min(lens[i - 1], yH - 2);
        g += line([cx - dw / 2, yTop], [cx, yTop + ln], S.dart);
        g += line([cx + dw / 2, yTop], [cx, yTop + ln], S.dart);
      }
    }
    // 記號
    g += text([o + crease, yL + 1.2], isBack ? 'BACK' : 'FRONT', S.small, 'middle');
    g += text([o + crease, (yR + yL) / 2], 'GRAIN', S.small, 'middle');
    return g;
  }

  s += piece(0, p.fw, p.cf, p.creaseF, p.hwF, false);
  s += piece(ox, p.bw, p.cb, p.creaseB, p.hwB, true);

  // 拉鍊記號(fitted:左脇)/ 鬆緊帶註記
  if (!p.elastic) {
    s += line([0.5, 0.5], [0.5, p.zipLen], S.dart);
    s += text([0.9, p.zipLen - 0.5], 'ZIP ' + (Math.round(p.zipLen * 10) / 10), S.small);
  } else {
    s += text([0, -1.8], 'ELASTIC WAIST: fold 3.5, elastic ' + p.elasticLen, S.small);
  }

  // 共用記號
  s += text([-1.9, 0.3], 'WL') + text([-1.9, yH + 0.3], 'HL') + text([-1.9, yR + 0.3], 'CR');
  if (showKL) s += text([-1.9, yK + 0.3], 'KL');
  s += text([-1.9, yL + 0.3], 'HEM');
  s += `</svg>`;
  return s;
}

/* Node 測試用 */
if (typeof module !== 'undefined') module.exports = { draftPants, pantsSVG };
