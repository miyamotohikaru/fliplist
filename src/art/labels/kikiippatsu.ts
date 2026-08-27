import type { LabelArt } from "./types";
import { rng, shade, mix, type PixelGfx } from "../gfx";
import { drawKosukumaSmall, KUMA, KUMA_SMALL_SIZE } from "../kosukuma";
import { JP_TH, ascent, jpRow } from "../jptitle";

// 超巨大こすくまくん黒髭危機一髪。
//
// 実物（kosukuma-kikiippatsu.vercel.app）は、深い宇宙にぽつんと浮かぶ巨大な月の上に
// こすくまくんが座っていて、月の全面に世界中から刺された短剣がびっしり生えている。
// その一枚絵をそのまま 68x40 に落とす。主役は「球体・剣・くま」の3つだけ。
// 星と星雲は余韻ぶんだけ。16本のなかでいちばん派手にしていい枠。

const SKY_DEEP = "#06081a";
const SKY_MID = "#0b1030";
const NEBULA = "#171d4a";

// 月の階調。底に落ちる青紫の影から、頂点が受ける光まで5段。
const MOON = ["#2f355f", "#464f7c", "#66708f", "#8b95ab", "#bdc6d3"];

const STEEL = "#e4e9f2";
const STEEL_DK = "#7b849c";
const GOLD = "#e8b23c";
const GOLD_DK = "#96690f";
// 柄の色は5つまで、しかも彩度を落とす。
// 明るい色をたくさん散らすと紙吹雪になって「刺さっている」感じが消える。
// 剣の群れは銀色に見えているのが正しい。色は柄頭の点だけでいい。
const HILTS = ["#b4335f", "#2f68b8", "#b8412e", "#c49b28", "#2f8f86"];

const CORAL = "#f2564a";

// こすくまくんの輪郭。実物は黒に近いが、この絵の地（#06081a〜#0b1030）は
// それより暗いので、黒のまま置くと輪郭が空に溶けて、ただのクリーム色の塊になる。
// 空より確実に明るく、クリームよりはるかに暗い青紫に置き換える。
// 太さ・角丸の頭・1点の目・ほくろは触らない。色だけ。
const BEAR_LINE = "#1b1830";
const BEAR_MOLE = "#33513f";

const MCX = 40;
// 題字の1行目（1..10行）が空を全幅で使うので、くまは12行目から。
// くまの丈は26なので足もとは37行。月の頂点はその18px上（MTOP=30）に来る。
//
// 半径は 25 のまま。34 まで広げて底いっぱいの弧にしてみたが、逆に悪かった ——
// 弧が寝るぶん階調の差が消えて、球ではなく灰色の帯になる。しかも剣の生えぎわが
// 底の2行に集まって、刀身が宙に浮いて見える。25 のほうが弧が立つので、
// 幅は狭くても「球の上のほう」に見える。
const MCY = 55;
const R = 25;
/** 月の頂点 */
const MTOP = MCY - R;

// こすくまくんの座り位置。
// 頂点（y=22）に足を揃えて置くと丈 26 が空にはみ出して頭が枠から出るので、
// 頂点より少し手前（下）の面に座らせた。足もとが球の手前側に来るので、
// 剣の生えぎわがくまの後ろから覗いて、かえって「刺されている球の上」に見える。
// 左の柱（x=1..27）が題字なので、くまは右へ寄せて x=40 に置く。
// 頂点（x=40）にまたがらせると、見えている10行ぶんの月がまるごとくまの
// 後ろに入って「球」が消える。頂点のすぐ右に座らせると、頂点と左の斜面が
// 出て、はじめて球の上に座っているように見える。姿には手を触れていない。
const BX = 42; // 字形が15→20px幅になったので、剣が背に隠れないよう右へ
const BY = MTOP + 8 - KUMA_SMALL_SIZE.h;

// 4x4 の整列ディザ。階調の境目をNESらしく刻む。
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// 光の向き。左上やや手前から。
const LX = -0.42;
const LY = -0.72;
const LZ = 0.55;

/**
 * 月面のどこがどの階調かを返す。0..4 の連続値。
 * クレーターもここから引く。描いた色を読み返して暗くすると、
 * 重なったところが際限なく黒くなって穴に見えてしまう。
 */
function moonLevel(x: number, y: number): number {
  const nx = (x - MCX) / R;
  const ny = (y - MCY) / R;
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  const lam = Math.max(0, nx * LX + ny * LY + nz * LZ) * 1.42 + 0.03;
  return Math.max(0, Math.min(MOON.length - 1.001, lam * (MOON.length - 1)));
}
const step = (x: number, y: number, d: number) =>
  MOON[Math.max(0, Math.min(MOON.length - 1, Math.floor(moonLevel(x, y)) + d))];

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 和文の題字 ──────────────────────────────────────────
// 「こすくまくん危機一髪」10文字。くまは丈26行あって40行の三分の二を占めるので、
// 題字は必ずくまの脇に組むことになる。全幅で流せるのはくまより上の帯だけ。
//   1行目「こすくまくん」 11px 全幅（66px＝11px x 6）… 空にじかに
//   2〜3行目「危機」「一髪」 13px 左の柱（26px）… 実機の版と同じ2字積み
// 上から下へ、題名の順に読める。
//
// 級数: 「髪」は13pxが下限。11pxにすると髟の3本の横画が繋がって黒い塊になる。
// くまは1行目の裾より下（12行目）へ下げ、月もそのぶん沈めた。
// 全部を1枚に収めるにはこれしかなく、月は「巨大な天体の地平」として出る。
const T_A = "こすくまくん";
const T_B = "危機";
const T_C = "一髪";
const T_SIZE_A = 11;
const T_SIZE_BC = 13;

/**
 * 月に刺さった短剣を1本。ang は月の中心から見た向き、base は根元の半径。
 * 手前の面に立つものは奥行きで縮んで見えるので、根元が中心に近いほど短くする。
 */
function dagger(
  g: PixelGfx,
  ang: number,
  base: number,
  len: number,
  hilt: string,
  cx = MCX,
  cy = MCY,
  stuck = true,
) {
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const nx = -uy;
  const ny = ux;
  const P = (r: number, o = 0) =>
    [Math.round(cx + ux * r + nx * o), Math.round(cy + uy * r + ny * o)] as [number, number];

  // 長さは固定。月に対する実寸で描くと 4px になって剣に見えないので、
  // 「刀身・鍔・柄」の3つが判る最小寸に決め打ちする。
  // 太さは必ず 2px。1px だと引っかき傷にしか見えない。
  const L = len;
  const guardR = base + (L >= 7 ? 4 : 2);
  const seg = (r0: number, r1: number, o: number, c: string) => {
    const a = P(r0, o);
    const b = P(r1, o);
    g.line(a[0], a[1], b[0], b[1], c);
  };
  // 刺さり口の影
  if (stuck) {
    const s = P(base - 1, 1);
    g.px(s[0], s[1], "#171b3a");
  }
  // 両側に暗い縁。月の上でも空でも輪郭が残る。
  seg(base, base + L, 1, "#171b3a");
  seg(base, base + L, -2, "#171b3a");
  // 刀身。左上側に照りを入れる。剣の群れが銀色に見えるのが正しい。
  seg(base, guardR - 1, -1, STEEL);
  seg(base, guardR - 1, 0, STEEL_DK);
  // 鍔は4px。
  for (const o of [-2, -1, 0, 1]) {
    const p = P(guardR, o);
    g.px(p[0], p[1], o === -1 || o === 0 ? GOLD : GOLD_DK);
  }
  // 柄と柄頭
  seg(guardR + 1, base + L - 1, -1, hilt);
  seg(guardR + 1, base + L - 1, 0, shade(hilt, -0.3));
  const p0 = P(base + L, -1);
  const p1 = P(base + L, 0);
  g.px(p0[0], p0[1], shade(hilt, 0.45));
  g.px(p1[0], p1[1], shade(hilt, 0.1));
}

export const art: LabelArt = {
  slug: "kikiippatsu",
  swatch: ["#0a0e28", "#68718f", "#f2564a", "#e8b23c", KUMA.fill],
  draw: (g, t) => {
    // ── 宇宙 ───────────────────────────────────────────────
    g.rect(0, 0, 68, 40, SKY_DEEP);
    g.rect(0, 12, 68, 28, SKY_MID, "half");
    g.rect(0, 20, 68, 20, SKY_MID);
    // 斜めに流れる星雲。1段だけ、うっすら。
    g.poly(
      [
        [-4, 22],
        [22, -4],
        [40, -4],
        [10, 30],
      ],
      NEBULA,
      "quarter",
    );
    g.poly(
      [
        [-2, 17],
        [20, -4],
        [30, -4],
        [4, 23],
      ],
      "#232a63",
      "eighth",
    );

    // ── 星 ─────────────────────────────────────────────────
    const rs = rng(9137);
    for (let i = 0; i < 62; i++) {
      const x = 1 + Math.floor(rs() * 66);
      const y = 1 + Math.floor(rs() * 36);
      const k = rs();
      // (22,8) だけ「す」と「く」の隙間にちょうど落ちて、題字の「.」に見えていた。
      // その1個だけ間引く（星の並び自体はそのまま、種も変えない）。
      if (x === 22 && y === 8) continue;
      if (k < 0.14) g.px(x, y, "#ffffff");
      else if (k < 0.42) g.px(x, y, "#b9c6f0");
      else g.px(x, y, "#5c68a0");
    }

    // 遠くの地球。剣を刺しているのは世界中の人なので、出どころを1つ置いておく。
    // 題字の1行目が上の10行を取ったので、その下・くまの右のあきへ下げた。
    g.disc(60, 17, 3, "#2c62c4");
    g.disc(59, 16, 2, "#3f7ce0");
    g.px(59, 18, "#3f9e52");
    g.px(60, 18, "#3f9e52");
    g.px(61, 17, "#3f9e52");
    g.px(58, 15, "#4f9e6a");
    g.px(59, 15, "#8fd6ff");
    g.px(62, 19, "#1c3f86");
    g.px(61, 19, "#1c3f86");
    // 地球から月へ、点線の航跡
    for (let i = 0; i < 4; i++) {
      const p = 0.2 + i * 0.2;
      const x = Math.round(60 - p * 14);
      const y = Math.round(17 + p * p * 12);
      g.px(x, y, i % 2 === 0 ? "#6f7cb8" : "#48538c");
    }

    // ── 月 ─────────────────────────────────────────────────
    // ランバートを5段に量子化し、境目を整列ディザで繋ぐ。
    for (let y = MTOP - 1; y < 40; y++) {
      for (let x = 1; x < 67; x++) {
        const dx = x - MCX;
        const dy = y - MCY;
        if (dx * dx + dy * dy > R * R + R * 0.6) continue;
        const f = moonLevel(x, y);
        const idx = Math.floor(f);
        const th = (BAYER[y & 3][x & 3] + 0.5) / 16;
        g.px(x, y, MOON[f - idx > th ? idx + 1 : idx]);
      }
    }
    // 輪郭。左上は照り、右下は落ち込ませて球であることを決める。
    for (let a = -Math.PI * 0.995; a < -0.005; a += 0.02) {
      const x = Math.round(MCX + Math.cos(a) * (R - 0.4));
      const y = Math.round(MCY + Math.sin(a) * (R - 0.4));
      if (y < MTOP - 1 || y > 39) continue;
      g.px(x, y, Math.cos(a) < 0.1 ? "#cfd8e4" : "#4d5578");
    }

    // クレーター。下地の色を読んで、その場の階調から掘る。
    const rc = rng(4471);
    for (let i = 0; i < 34; i++) {
      const a = -Math.PI + rc() * Math.PI;
      const rr = Math.sqrt(rc()) * (R - 3);
      const cx = Math.round(MCX + Math.cos(a) * rr);
      const cy = Math.round(MCY + Math.sin(a) * rr);
      if (cy < MTOP + 1 || cy > 38 || cx < 2 || cx > 65) continue;
      const rad = rc() < 0.6 ? 1 : 2;
      g.disc(cx, cy, rad, step(cx, cy, -1));
      g.px(cx + rad, cy + rad - 1, step(cx, cy, 1));
      g.px(cx + rad, cy, step(cx, cy, 1));
      g.px(cx, cy - rad, step(cx, cy, 1));
    }
    // 海。球の大きさを出すために2つだけ、輪郭をぼかして置く。
    // 月が沈んだぶん、2つとも見えている弧の中に移してある
    // （弧の外に置くと、空にただの灰色の染みが浮く）。
    for (const [sx, sy, rx, ry] of [
      [30, 36, 6, 3],
      [57, 37, 4, 2],
    ]) {
      g.ellipse(sx, sy, rx, ry, step(sx, sy, -1), "half");
      g.ellipse(sx, sy, rx - 2, ry - 1, step(sx, sy, -1));
    }

    // ── 短剣 ───────────────────────────────────────────────
    // 縁から外へ突き出るものと、手前の面に立っているもの。
    // 真上（くまが座っている範囲）には長い剣を置かない。角を生やさないため。
    //
    // 生やせる向きは題字とくまが決めている。見えるのは
    //   ・x=28..39（左の柱の外、くまの左）の、月が出ている行
    //   ・x=55..59（くまの右）の、月の右の斜面
    // なので、剣はこの2つに根元も刀身も収まる角度だけに絞った。
    // 月の左端（x<28）は題字の柱の下なので、生やしても1本も見えない。
    const LIMB: Array<[number, number, number]> = [
      [-1.97, 6, 3],
      [-1.84, 8, 1],
      [-1.71, 9, 4],
      [-1.62, 9, 0],
      [-0.88, 8, 2],
      [-0.74, 9, 3],
    ];
    for (const [a, len, h] of LIMB) dagger(g, a, R - 1, len, HILTS[h]);

    // 手前の面に生えたぶん。短く、間隔をあけて棘立って見せる。
    // 根元は月の半径に対する割合で持つ。月の大きさを変えても生え際が動かない。
    // 真上（こすくまくんの座っている範囲）には生やさない。剣がまるごと
    // くまの後ろに隠れて、描いても1本も見えないため。
    const FACE: Array<[number, number, number]> = [
      [-1.9, 0.8, 0],
      [-1.72, 0.72, 2],
      [-0.86, 0.95, 4],
    ];
    for (const [a, k, h] of FACE) dagger(g, a, Math.round(k * R), 6, HILTS[h]);

    // まだ届いていない剣。くまの左の宙に1本、軌跡の点を引いて飛ばす。
    const FLYING: Array<[number, number, number, number]> = [[31, 25, 1.28, 1]];
    for (const [fx, fy, a, h] of FLYING) {
      for (let i = 1; i <= 4; i++) {
        g.px(
          Math.round(fx - Math.cos(a) * (i * 2 + 3)),
          Math.round(fy - Math.sin(a) * (i * 2 + 3)),
          i < 3 ? "#4d5789" : "#2a3160",
        );
      }
      dagger(g, a, 0, 6, HILTS[h], fx, fy, false);
    }

    // 動き1: 剣が1本増える。刺さった瞬間だけ小さく火花。
    // 真上（-1.6）に刺すとくまの背に完全に隠れて、動いていないラベルになる。
    // くまの右脇、空の見えている側に刺す。
    const NEW_A = -1.66;
    if (t > 0.5) {
      dagger(g, NEW_A, R - 1, 9, HILTS[2]);
      if (t < 0.62) {
        const sx = Math.round(MCX + Math.cos(NEW_A) * (R - 1));
        const sy = Math.round(MCY + Math.sin(NEW_A) * (R - 1));
        g.px(sx - 3, sy, "#fff2b0");
        g.px(sx + 3, sy, "#fff2b0");
        g.px(sx - 2, sy - 2, "#f2564a");
        g.px(sx + 2, sy - 2, "#f2564a");
      }
    }

    // ── こすくまくん ───────────────────────────────────────
    // 姿は kosukuma.ts が正解。ここでは置くだけで、目も耳も足さない。
    drawKosukumaSmall(g, BX, BY, { line: BEAR_LINE, mole: BEAR_MOLE });
    // 月に落ちる接地影。くまの後ろに敷くと足で全部隠れるので、足のすぐ下に置く。
    // 色は月の階調から1段暗いぶんを引く。地の色で塗ると月に穴が開いて見える。
    // 丈が詰まったので、くまの真下の1行（38行目）だけ。
    for (let x = BX + 1; x < BX + 15; x++) {
      const y = BY + 26;
      const dx = x - MCX;
      const dyy = y - MCY;
      if (dx * dx + dyy * dyy > R * R) continue;
      g.px(x, y, step(x, y, -1));
    }

    // ── 瞬く星 ─────────────────────────────────────────────
    // 動き2: 4つだけ明滅する。全体は動かさない。題字とくまを避けた4点。
    const TWINK: Array<[number, number]> = [
      [30, 15],
      [66, 14],
      [34, 13],
      [64, 27],
    ];
    TWINK.forEach(([x, y], i) => {
      const b = 0.5 + 0.5 * Math.sin((t * 2 + i * 0.31) * Math.PI * 2);
      const c = mix("#3f4a80", "#ffffff", b);
      g.px(x, y, c);
      if (b > 0.74) {
        g.px(x - 1, y, mix(SKY_MID, c, 0.55));
        g.px(x + 1, y, mix(SKY_MID, c, 0.55));
        g.px(x, y - 1, mix(SKY_MID, c, 0.55));
        g.px(x, y + 1, mix(SKY_MID, c, 0.55));
      }
    });

    // ── 題字 ───────────────────────────────────────────────
    // 左の柱に名前、下の帯に題名。どちらも1色べたに1pxの影だけ。
    // **ふちは8方向に回さない。** 11px も 13px も字間が1pxしかないので、
    // ふちを回すと字と字がくっついて、柱も帯も1枚の板になる。
    // 影は右下に1pxだけ。星の上でも銀の剣の上でも月の面の上でも効く。
    jpRow(g, 1, T_A, "#ffe9a8", {
      size: T_SIZE_A,
      ascent: ascent(T_A, T_SIZE_A, JP_TH),
      shadow: "#05071a",
    });
    const ascBC = ascent(T_B + T_C, T_SIZE_BC, JP_TH);
    const oBC = { size: T_SIZE_BC, ascent: ascBC, shadow: "#05071a", x: 1 };
    jpRow(g, 13, T_B, "#ffe9a8", oBC);
    jpRow(g, 26, T_C, CORAL, oBC);

    // ── 枠 ─────────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。四隅の飾りはやめた。
    g.frame(0, 0, 68, 40, "#cdd4e4");
    mark(g, "#cdd4e4", SKY_DEEP);
  },
};
