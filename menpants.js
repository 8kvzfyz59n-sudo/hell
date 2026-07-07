/* =========================================================
 * 男裝西裝褲(H 型單褶)— 依使用者提供教材圖 6-10 重製
 * 輸入:淨腰圍 W、淨臀圍 H、股上長(含腰頭3)、股下長
 * 公式自帶鬆量(如 H/4+2.5 的 2.5)
 * ☆=H/12;身片股上=股上長−3;HL=橫檔上方☆;KL=股下/2再上提5
 * 前片:寬△=H/4+2.5;小裆=☆×2/3;前中收0.7、側收1.5抬0.5;
 *       褶量□=△−0.7−1.5−W/4(單褶壓挺縫線);門襟3.5
 * 後片:後中斜線=連(腰線上「後中輔助線與挺縫線的中點」、橫檔線上
 *       「輔助線內縮1」)兩點;腰點沿斜線上抬☆/2(后翘);
 *       後裆總伸出=前小裆+☆/2、落裆1;
 *       省量▲=後腰斜線長−W/4,兩省=▲/2±0.3、省長8、尖朝後口袋
 * 脚口:前=△−3.5、後=前+1;中檔=脚口+2;腰頭3×(W/2+3、W/2+6含搭份)
 * ========================================================= */

function draftMenPants(W, H, riseLen, inseam) {
  const star = H / 12;
  const riseB = riseLen - 3;
  const hlY = riseB - star;
  const klY = riseB + inseam / 2 - 5;
  const hemY = riseB + inseam;
  const delta = H / 4 + 2.5;
  const extF = 2 * star / 3;
  const extB = 2 * star / 3 + star / 2;   // 後裆總伸出=前小裆再多☆/2
  const backRise = star / 2;              // 后翘高(垂直,沿斜線上抬)
  const dropB = 1;
  const hemF = delta - 3.5, hemB = hemF + 1;
  const kneeF = hemF + 2, kneeB = hemB + 2;
  const creaseF = (delta - extF) / 2;
  const creaseB = (delta + extB) / 2;
  const pleatW = delta - 0.7 - 1.5 - W / 4;
  // 後中斜線:腰線上=(後中輔助線+挺縫線)/2,橫檔線上=輔助線−1
  const slantTopX = (delta + creaseB) / 2;
  const slantBotX = delta - 1;
  const slantK = (slantBotX - slantTopX) / riseB;    // 每下行1cm的x變化
  const ctrWx = slantTopX - slantK * backRise;       // 后翘頂點x(y=−backRise)
  const dartTotal = Math.hypot(ctrWx, backRise - 0.5) - W / 4;  // 後腰斜線長−W/4
  const dart1 = dartTotal / 2 + 0.3, dart2 = dartTotal / 2 - 0.3;
  const beltW = 3, beltLL = W / 2 + 3, beltLR = W / 2 + 6;
  return { W, H, riseLen, inseam, pantsLen: riseLen + inseam,
    star, riseB, hlY, klY, hemY, delta, extF, extB, backRise, dropB,
    slantTopX, slantBotX, slantK, ctrWx,
    hemF, hemB, kneeF, kneeB, creaseF, creaseB,
    pleatW, dartTotal, dart1, dart2, beltW, beltLL, beltLR };
}

function menPantsSVG(p) {
  const m = 2.5, gap = 6;
  const F = x => x + p.extF;                       // 前片座標(小裆尖=0)
  const oxB = p.extF + p.delta + gap;
  const B = x => oxB + x;                          // 後片座標(側縫=oxB)
  const totalW = p.extF + p.delta + gap + p.delta + p.extB;
  const beltY = p.hemY + 3;
  const minX = -m, minY = -m - 1.5;
  const w = totalW + 2 * m, h = beltY + 2 * p.beltW + 1.5 + m - minY;
  let s = svgOpen(minX, minY, w, h);
  const yH = p.hlY, yR = p.riseB, yK = p.klY, yL = p.hemY;

  // ---- 前片(前中心在左、小裆尖朝左)----
  {
    const d = p.delta, cx = p.creaseF;
    const Pc = [F(0.7), 0], Ps = [F(d - 1.5), -0.5];
    const yWaist = x => Pc[1] + (Ps[1] - Pc[1]) * (x - Pc[0]) / (Ps[0] - Pc[0]);
    const kIn = F(cx - p.kneeF / 2), kOut = F(cx + p.kneeF / 2);
    const hIn = F(cx - p.hemF / 2), hOut = F(cx + p.hemF / 2);
    const tip = [F(-p.extF), yR];
    // 導引線
    s += line([F(0), 0], [F(d), 0], S.guide);
    s += line([F(0), yH], [F(d), yH], S.guide);
    s += line([F(-p.extF), yR], [F(d), yR], S.guide);
    s += line([kIn, yK], [kOut, yK], S.guide);
    s += line([F(cx), yR - 3], [F(cx), yL - 2], S.guide);
    // 前中心+小裆彎(沿前中心下行,近裆底才勾出)
    s += line(Pc, [F(0), yH], S.outline);
    s += line([F(0), yH], [F(0), yR - 6], S.outline);
    s += path(crPathD([[F(0), yR - 6], [F(-p.extF * 0.3), yR - 1.2], tip]), S.outline);
    // 腰線
    s += line(Pc, Ps, S.outline);
    // 側縫
    s += path(crPathD([Ps, [F(d), yH], [F(d), yR]]), S.outline);
    s += path(crPathD([[F(d), yR], [(F(d) + kOut) / 2 + 0.3, (yR + yK) / 2], [kOut, yK]]), S.outline);
    s += line([kOut, yK], [hOut, yL], S.outline);
    // 內縫(股下)
    s += path(crPathD([tip, [(tip[0] + kIn) / 2 - 0.8, (yR + yK) / 2], [kIn, yK]]), S.outline);
    s += line([kIn, yK], [hIn, yL], S.outline);
    // 褲腳
    s += line([hIn, yL], [hOut, yL], S.outline);
    // 褶(有剩才畫)
    if (p.pleatW > 0.3) {
      s += line([F(cx - p.pleatW / 2), yWaist(F(cx - p.pleatW / 2))], [F(cx), 7], S.dart);
      s += line([F(cx + p.pleatW / 2), yWaist(F(cx + p.pleatW / 2))], [F(cx), 7], S.dart);
      s += text([F(cx), -1.2], 'PLEAT', S.small, 'middle');
    }
    // 門襟
    s += line([F(3.5), 0.4], [F(3.5), yH], S.dart);
    s += text([F(3.8), yH - 0.5], 'FLY', S.small);
    // 斜插袋
    s += line([F(d - 5), yWaist(F(d - 5)) + 0.3], [F(d - 0.3), 14], S.dart);
    s += text([F(d - 5.2), 6], 'POCKET', S.small);
    s += text([F(cx), yL + 1.2], 'FRONT', S.small, 'middle');
    s += text([F(cx) + 0.3, (yR + yL) / 2], 'CREASE', S.small);
  }

  // ---- 後片(側縫在左、後中心+後裆朝右)----
  {
    const d = p.delta, cx = p.creaseB;
    const Pw = [B(p.ctrWx), -p.backRise], Ps = [B(0), -0.5];
    const kIn = B(cx + p.kneeB / 2), kOut = B(cx - p.kneeB / 2);
    const hIn = B(cx + p.hemB / 2), hOut = B(cx - p.hemB / 2);
    const tip = [B(d + p.extB), yR + p.dropB];
    // 導引線
    s += line([B(0), 0], [B(d), 0], S.guide);
    s += line([B(0), yH], [B(d), yH], S.guide);
    s += line([B(0), yR], [B(d + p.extB), yR], S.guide);
    s += line([kOut, yK], [kIn, yK], S.guide);
    s += line([B(cx), yR - 3], [B(cx), yL - 2], S.guide);
    // 後中斜線(腰=中線與後中線的中點、橫檔內縮1)+後裆彎(近裆底勾出、含落裆)
    const sx6 = p.slantTopX + p.slantK * (yR - 6);   // 斜線在 yR−6 處的 x
    s += line(Pw, [B(sx6), yR - 6], S.outline);
    s += path(crPathD([[B(sx6), yR - 6], [B(d + p.extB * 0.3), yR + p.dropB - 0.9], tip]), S.outline);
    // 腰線
    s += line(Ps, Pw, S.outline);
    // 側縫
    s += path(crPathD([Ps, [B(0), yH], [B(0), yR]]), S.outline);
    s += path(crPathD([[B(0), yR], [(B(0) + kOut) / 2 - 0.3, (yR + yK) / 2], [kOut, yK]]), S.outline);
    s += line([kOut, yK], [hOut, yL], S.outline);
    // 內縫
    s += path(crPathD([tip, [(tip[0] + kIn) / 2 + 0.8, (yR + yK) / 2], [kIn, yK]]), S.outline);
    s += line([kIn, yK], [hIn, yL], S.outline);
    // 褲腳
    s += line([hOut, yL], [hIn, yL], S.outline);
    // 兩省(靠後中的較大)
    if (p.dart2 > 0.1) {
      const dws = [p.dart2, p.dart1];              // 1/3 處小省、2/3 處大省
      for (let i = 1; i <= 2; i++) {
        const cxD = Ps[0] + (Pw[0] - Ps[0]) * i / 3;
        const yTop = Ps[1] + (Pw[1] - Ps[1]) * i / 3 + 0.2;
        const dw = dws[i - 1];
        s += line([cxD - dw / 2, yTop], [cxD, yTop + 8], S.dart);
        s += line([cxD + dw / 2, yTop], [cxD, yTop + 8], S.dart);
      }
      s += text([B(cx), -1.6], 'DART x2', S.small, 'middle');
    }
    // 後口袋
    s += line([B(cx - 6.75), 8.3], [B(cx + 6.75), 8.1], S.dart);
    s += text([B(cx), 9.5], 'POCKET', S.small, 'middle');
    s += text([B(cx), yL + 1.2], 'BACK', S.small, 'middle');
    s += text([B(cx) + 0.3, (yR + yL) / 2], 'CREASE', S.small);
  }

  // ---- 腰頭版片(左/右)----
  {
    const x0 = p.extF;
    const rect = (y0, len) =>
      line([x0, y0], [x0 + len, y0], S.outline) + line([x0 + len, y0], [x0 + len, y0 + p.beltW], S.outline) +
      line([x0 + len, y0 + p.beltW], [x0, y0 + p.beltW], S.outline) + line([x0, y0 + p.beltW], [x0, y0], S.outline);
    s += rect(beltY, p.beltLL);
    s += text([x0 + p.beltLL + 0.5, beltY + 2], 'L-BELT W/2+3', S.small);
    s += rect(beltY + p.beltW + 1.5, p.beltLR);
    s += text([x0 + p.beltLR + 0.5, beltY + p.beltW + 3.5], 'R-BELT W/2+6 (LAP 3)', S.small);
  }

  // 共用記號
  s += text([-1.9, 0.3], 'WL') + text([-1.9, yH + 0.3], 'HL') + text([-1.9, yR + 0.3], 'CR');
  s += text([-1.9, yK + 0.3], 'KL') + text([-1.9, yL + 0.3], 'HEM');
  s += `</svg>`;
  return s;
}

/* Node 測試用 */
if (typeof module !== 'undefined') module.exports = { draftMenPants, menPantsSVG };
