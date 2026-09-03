import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { rng } from "../gfx";

// 数式の絶景 / MATHSCAPE。
//
// 実物は、画像も3Dモデルも音源も1つも持っていない。山も湖も夕焼けも、
// ぜんぶ1本の数式から毎フレーム計算されたもので、その中を歩いて回れる。
//
// だからこの1枚は、水際を境にして上下で描き方を変える。
//   ・水の上は、ふつうに描いた絶景。夕空の帯、雪をかぶった連峰、沈む日。
//   ・水に映っているほうは、その絵ではなく **式のまま**。稜線は1本の線、
//     山の中身は塗らずに縦の母線だけ、空だったところは方眼、
//     そして日は —— 上では塗ってあるのに —— 中心と半径だけの円に戻っている。
//     この「同じ日が、上では物で、下では円」がこの絵の核。
//   ・映り込みには、手前の尾根に隠れて見えないはずの稜線まで薄く出ている。
//     式は、見えていない面のことも知っているから。
//
// 覗きこむと風景が数式に化けている、という1枚。ふりっぷの「ひっくり返す」を
// 湖という風景そのものの部品でやるので、絵に無理がない。
//
// 題字は欧文。この枚は絵が主役で、和文の題字に上の25行を明け渡すと
// 上下2つの世界を作る丈が残らない。しかも MATHSCAPE という綴りは
// MATH（数式）と SCAPE（風景）でちょうど割れるので、
// **前半を水の中の色、後半を水の上の色で刷る**。題字が絵と同じことを言う。
//
// 動くもの: 映り込みが横に揺れる。行ごとに位相をずらした正弦1本なので、
// t=0 と t=1 で必ず同じ形に戻る。水面はこれだけで水になる。

// ── 版面の約束 ──────────────────────────────────────────
/** 水際。ここから上が描かれた風景、下が式のままの映り込み */
const HORIZON = 24;

// ── 色 ──────────────────────────────────────────────────
// 夕空。上から6段。段を増やすと「絵」になってドット絵でなくなる。
const SKY: Array<[number, string]> = [
  [0, "#211a4e"],
  [5, "#3a2260"],
  [10, "#6b3060"],
  [14, "#a44a52"],
  [18, "#d4703c"],
  [21, "#f0a34a"],
];
/** 水際のいちばん明るい1行 */
const SKY_EDGE = "#fbd08a";

// 奥の連峰。遠いので明るく、霞んでいる。
const FAR_LIT = "#6d76c2";
const FAR_MID = "#5c63ac";
const FAR_SHA = "#4b5096";
const FAR_RIDGE = "#a9b1e6";
const SNOW = "#eef0ff";
const SNOW_SH = "#c3c8ee";

// 手前の尾根。近いので暗い。
const NEAR_LIT = "#31376e";
const NEAR_MID = "#262b5a";
const NEAR_SHA = "#1b1f46";
const NEAR_RIDGE = "#525a9c";

// 沈む日
const SUN_C = "#fff2c8";
const SUN_M = "#ffc054";
const SUN_E = "#ee7c34";

// 式の色。水の中はこれだけで描く。
const CYAN = "#6fe4f2";
const CYAN_M = "#2f9db4";
const CYAN_D = "#1b6478";
const CYAN_F = "#103848";
/** 空だったところに残る方眼 */
const GRAPH = "#1d2652";

// 水の地。ほとんど黒だが、水際だけ夕空の色をわずかに拾う。
const WATER = ["#2a1c44", "#170f2e", "#0d0b26"];

const INK = "#0a0820";

// 沈む日。大きく取って、下半分は尾根に埋める。16枚に並べたとき、この枚には
// 「一目でそれと分かる大きな形」が1つ要る（連峰は横に反復するので核にならない）。
const SUN_X = 54;
const SUN_Y = 18;
const SUN_R = 7;

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 題字の活字 ──────────────────────────────────────────
// この1枚のためだけの太字。既定の 3x5 も、線が1pxの細字も、16枚に並べると
// この枚だけ題字が痩せて見えた（実測: /labels?scale=8 で他の15枚は題字が
// 2〜3px幅の太い画で組まれている）。縦画を2pxにした 6x8 を彫り直す。
// M だけは 6px だと中の V が入らないので 7px。字送りは字幅＋1。
// 「MATHSCAPE」で 63px、ラベルの幅 68 にちょうど収まる。
const GLYPH: Record<string, string[]> = {
  M: ["##...##", "###.###", "##.#.##", "##...##", "##...##", "##...##", "##...##", "##...##"],
  A: [".####.", "##..##", "##..##", "######", "##..##", "##..##", "##..##", "##..##"],
  T: ["######", "..##..", "..##..", "..##..", "..##..", "..##..", "..##..", "..##.."],
  H: ["##..##", "##..##", "##..##", "######", "##..##", "##..##", "##..##", "##..##"],
  S: [".#####", "##....", "##....", ".####.", "....##", "....##", "....##", "#####."],
  C: [".####.", "##..##", "##....", "##....", "##....", "##....", "##..##", ".####."],
  P: ["#####.", "##..##", "##..##", "##..##", "#####.", "##....", "##....", "##...."],
  E: ["######", "##....", "##....", "#####.", "##....", "##....", "##....", "######"],
};
const TITLE = "MATHSCAPE";
const T_X = 2;
const T_Y = 2;
/** MATH＝水の中（式）の色、SCAPE＝水の上（風景）の色。 */
const T_SPLIT = 4;

// ── 稜線 ────────────────────────────────────────────────
// 乱数で刻んだ地形ではなく、決まった数の峰を足した関数にする。
// 実物が式1本で風景を出しているのだから、ここも式から出ていないと嘘になる。
// 指数を1より大きくすると、頂の近くが急で裾の広がる山らしい形になる。
type Peak = [number, number, number]; // 中心x, 水際からの高さ, 裾の半幅
// 主峰は1つだけ。同じ丈の峰を並べると横に反復して核が消える。
const FAR: Peak[] = [
  [20, 13, 21],
  [46, 8, 16],
  [6, 7, 12],
  [64, 7, 13],
];
// 手前の尾根は低く。奥の連峰と同じくらいの丈にすると、稜線の山が5つも6つも
// 並んで「同じ大きさのぎざぎざ」になり、水に映したときに何も読めなくなった。
// 谷のところだけ顔を出す低い前山にすると、映り込みが奥の連峰の形をそのまま写す。
const NEAR: Peak[] = [
  [12, 5, 18],
  [34, 5, 16],
  [56, 4, 16],
];

function heightOf(peaks: Peak[], x: number, floor: number): number {
  let h = floor;
  for (const [cx, ph, w] of peaks) {
    const d = Math.abs(x - cx) / w;
    if (d >= 1) continue;
    const v = ph * Math.pow(1 - d, 1.4);
    if (v > h) h = v;
  }
  return h;
}
const farH = (x: number) => heightOf(FAR, x, 1.4);
const nearH = (x: number) => heightOf(NEAR, x, 1.5);
const farTop = (x: number) => HORIZON - Math.round(farH(x));
const nearTop = (x: number) => HORIZON - Math.round(nearH(x));

/** 夕空の色。帯の境目は市松で繋ぐので、段ごとの色を引くだけにする。 */
function skyAt(y: number): string {
  let c = SKY[0][1];
  for (const [from, col] of SKY) if (y >= from) c = col;
  return c;
}

export const art: LabelArt = {
  slug: "mathscape",

  swatch: [SKY[2][1], SKY[5][1], FAR_LIT, CYAN, WATER[2]],

  draw: (g, t) => {
    // ── 夕空 ──────────────────────────────────────────────
    for (let y = 0; y < HORIZON; y++) g.hline(0, y, 68, skyAt(y));
    // 段の境を1行だけ市松でほどく
    for (const [from] of SKY.slice(1)) g.hline(0, from - 1, 68, skyAt(from), "half");
    g.hline(0, HORIZON - 1, 68, SKY_EDGE);

    // 星。日の沈む側にはもう出ていない。
    const sr = rng(20260903);
    for (let i = 0; i < 26; i++) {
      const x = 1 + Math.floor(sr() * 65);
      const y = 1 + Math.floor(sr() * 11);
      if (x > 40 && y > 7) continue;
      g.px(x, y, sr() < 0.35 ? "#e4ecff" : "#8b8ec4");
    }

    // 雲。夕空を横に切る帯を2本。下端に日の色がのる。
    const cloud = (x: number, y: number, w: number, c: string, lit: string) => {
      g.hline(x + 2, y - 1, w - 5, c);
      g.hline(x, y, w, c);
      g.hline(x, y + 1, w, lit);
      g.px(x - 1, y, c);
      g.px(x + w, y, lit);
    };
    cloud(5, 13, 24, "#7a3c66", "#c2624e");
    cloud(40, 10, 19, "#5c2e62", "#9a4658");

    // ── 沈む日 ────────────────────────────────────────────
    g.ellipse(SUN_X, SUN_Y, 12, 8, "#f8a84a", "eighth");
    g.ellipse(SUN_X, SUN_Y, 9, 6, "#ffb85a", "quarter");
    g.disc(SUN_X, SUN_Y, SUN_R, SUN_E);
    g.disc(SUN_X, SUN_Y, SUN_R - 1, SUN_M);
    g.disc(SUN_X, SUN_Y, 3, SUN_C);

    // ── 奥の連峰。遠いので明るく、頂に雪がある ────────────
    for (let x = 0; x < 68; x++) {
      const top = farTop(x);
      // 日は右にある。右へ下る面が光を受ける。
      const slope = farH(x + 1) - farH(x - 1);
      const c = slope < -0.4 ? FAR_LIT : slope > 0.4 ? FAR_SHA : FAR_MID;
      for (let y = top; y < HORIZON; y++) g.px(x, y, c);
      g.px(x, top, FAR_RIDGE);
      // 雪。高いところの稜線から2行だけ。
      const h = farH(x);
      if (h >= 9.6) {
        g.px(x, top, SNOW);
        if (h >= 11) g.px(x, top + 1, slope > 0 ? SNOW_SH : SNOW);
      }
    }

    // ── 手前の尾根。近いので暗い ─────────────────────────
    for (let x = 0; x < 68; x++) {
      const top = nearTop(x);
      const slope = nearH(x + 1) - nearH(x - 1);
      const c = slope < -0.35 ? NEAR_LIT : slope > 0.35 ? NEAR_SHA : NEAR_MID;
      for (let y = top; y < HORIZON; y++) g.px(x, y, c);
      g.px(x, top, NEAR_RIDGE);
    }

    // ── 水際 ──────────────────────────────────────────────
    g.hline(0, HORIZON, 68, "#403f7c");
    g.hline(0, HORIZON, 68, "#7472ac", "half");

    // ── 映り込み。ここだけ、まだ式のまま ─────────────────
    // 行ごとに位相をずらした正弦で横に揺らす。隣り合う行のずれは1pxまでに
    // 抑える（1.35 まで振ると稜線が千切れて、ただの塊になった）。
    const wob = (y: number) =>
      Math.round(Math.sin((y - HORIZON) * 0.45 + t * Math.PI * 2) * 1.05);
    // 目に見えている稜線（奥と手前の高いほう）と、その裏に隠れている稜線。
    // 鏡なので、見えている稜線の映りのほうが深く、隠れている尾根は浅い。
    const vis = (sx: number) => 2 * HORIZON - Math.min(farTop(sx), nearTop(sx));
    const hid = (sx: number) => 2 * HORIZON - Math.max(farTop(sx), nearTop(sx));

    for (let y = HORIZON + 1; y <= 38; y++) {
      const d = y - HORIZON; // 水際からの深さ
      g.hline(0, y, 68, WATER[d <= 2 ? 0 : d <= 5 ? 1 : 2]);
      const sh = wob(y);
      // 線として繋ぐ判定。列ごとに1点だけ置くと、急な斜面で y が飛んで
      // 破線になる（実測でそうなった）。隣の列とのあいだを縦に埋める。
      const on = (f: (sx: number) => number, x: number) => {
        const a = f(Math.max(0, Math.min(67, x - sh)));
        const b = f(Math.max(0, Math.min(67, x - 1 - sh)));
        return y === a || (y > Math.min(a, b) && y < Math.max(a, b));
      };
      for (let x = 0; x < 68; x++) {
        const sx = Math.max(0, Math.min(67, x - sh));
        if (on(vis, x)) {
          g.px(x, y, CYAN); // 稜線＝関数そのもの
        } else if (on(hid, x) && (x & 1) === 0) {
          // 手前の尾根に隠れているはずの稜線。式は見えない面のことも知っている。
          // ただし主役の稜線と同じ明るさで引くと、水の中がただの二重の
          // ぎざぎざになって何も読めなくなった。ここまで落として、
          // 近くで見た人だけが気づく「もう1本」に留める。
          g.px(x, y, CYAN_F);
        } else if (y < vis(sx)) {
          // 山の中身。塗らないし、等高線も引かない。
          // 横線を足すと棒が並んで主役の稜線が死ぬ（実測）。
          // 面の存在は、8列おきの縦の母線1本ぶんだけで足りる。
          // 実線で通すと簾のように見えるので、こちらは破線。
          // 方眼（下の実線）と区別がついて、稜線を境に組が変わって見える。
          if (x % 8 === 3 && (y & 1) === 0) g.px(x, y, CYAN_F);
        } else if (x % 8 === 3 || d % 5 === 4) {
          // 空だったところ。方眼だけが残る。
          // 方眼は座標そのものなので揺れない（揺れるのは映っている像だけ）。
          // ここを映り込みと一緒に揺らすと、水の中がただの点の散らばりになる。
          g.px(x, y, GRAPH);
        }
      }
    }

    // 水面のかがやき。ここだけは水として読ませたいので、短い横の破線を散らす。
    const wr = rng(4457);
    for (let i = 0; i < 16; i++) {
      const x = 1 + Math.floor(wr() * 62);
      const y = HORIZON + 1 + Math.floor(wr() * 13);
      g.hline(x, y, 2 + Math.floor(wr() * 3), y - HORIZON <= 4 ? "#3a2f5e" : "#241d46");
    }

    // 日の映り。輪郭だけの円。上の日は塗ってあるのに、映ったほうは
    // 中心と半径しか無い円に戻っている —— この絵でいちばん言いたいことなので、
    // 主役の稜線と同じ明るさで、途切れさせずに引く。
    // 尾根の映りの裏に回るところだけ、隠れている稜線と同じ扱いで沈める。
    const my = 2 * HORIZON - SUN_Y;
    for (let a = 0; a < 160; a++) {
      const rad = (a / 160) * Math.PI * 2;
      const yy = Math.round(my + Math.sin(rad) * SUN_R);
      if (yy <= HORIZON || yy > 38) continue;
      const sh = wob(yy);
      const xx = SUN_X + Math.round(Math.cos(rad) * SUN_R) + sh;
      const sx = Math.max(0, Math.min(67, xx - sh));
      g.px(xx, yy, yy < vis(sx) ? CYAN_D : CYAN);
    }
    // 円の中心。式の円は中心と半径だけで決まる、というしるしを1px。
    g.px(SUN_X + wob(my), my, CYAN_M);

    // 水際の目盛り。方眼の縦罫と同じ列に打つ。水面が座標軸でもあると言う1px。
    for (let x = 3; x < 66; x += 8) g.px(x, HORIZON, CYAN_M);

    // ── 題字 ──────────────────────────────────────────────
    // MATH は水の中の色、SCAPE は水の上の色。落ち影を1px先に敷いて地から押し出す。
    let tx = T_X;
    for (let i = 0; i < TITLE.length; i++) {
      const rows = GLYPH[TITLE[i]];
      if (!rows) continue;
      g.blit(tx + 1, T_Y + 1, rows, { "#": "#17103a" });
      g.blit(tx, T_Y, rows, { "#": i < T_SPLIT ? CYAN : SKY_EDGE });
      tx += rows[0].length + 1;
    }

    // ── ふち ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, SKY_EDGE);
    mark(g, SKY_EDGE, INK);
  },
};
