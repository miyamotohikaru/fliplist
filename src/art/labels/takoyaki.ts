import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// 大忙したこ焼き屋さんシミュレーター（もうかりまっか）— 大阪の屋台で、
// 行列のお客さんに、たこ焼きを焼きまくる。
//
// 図の骨組み: 上は夜の通り。紺の空に赤い提灯がひと連なり（実物の画面どおり）。
//   題字の「大忙し」は提灯の明かりの色、「たこ焼き屋さん」はその下に白く。
//   まんなかは、たこ焼き器の黒い鉄板を真横から見た1列。丸い穴が6つ。
//   下は屋台の木のカウンターで、ここに「シミュレーター」を焼き印のように置く。
//
// 動くもの（1周3秒・12コマ）: ピックが左の穴から順に、たこ焼きをくるっと
//   ひっくり返していく。生地のまま（黄色い面に紅しょうが・青のり・たこ）だった玉が、
//   返すと焼き色のついたまんまるになる。1玉に2コマ（差しこむ／返す）。

const NIGHT = "#1c2446";
const NIGHT_D = "#141a34";
const LANTERN = "#e8442c";
const LANTERN_L = "#ff9a52";
const LANTERN_D = "#9c2418";
const LANTERN_CAP = "#2a1a12";
const STRING = "#5a5040";
const GOLD = "#ffcf48";
const GOLD_D = "#7a3a10";
const PAPER = "#fff3d6";
const SHADOW = "#0a0e1e";
const IRON = "#2e2a28";
const IRON_L = "#4a4440";
const IRON_D = "#161412";
const HOLE = "#0e0c0b";
const BATTER = "#f2dc96";
const BATTER_D = "#d8b860";
const GINGER = "#e2384a";
const NORI = "#4a8a36";
const TAKO = "#d87a8a";
const BALL = "#c47a34";
const BALL_L = "#eab066";
const BALL_D = "#80461c";
const PICK = "#dfe3e8";
const PICK_D = "#8d949c";
const WOOD = "#9a6234";
const WOOD_L = "#b47a46";
const WOOD_D = "#6e4220";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

/** 提灯（5x7）。上下に黒い口金、まんなかに明かり */
const LANTERN_ROWS = [".ccc.", "rRRRr", "RLLRR", "RLLRR", "rRRRr", ".ddd.", ".ccc."];
function lantern(g: PixelGfx, x: number, y: number) {
  g.blit(x, y, LANTERN_ROWS, {
    c: LANTERN_CAP,
    r: LANTERN_D,
    R: LANTERN,
    L: LANTERN_L,
    d: LANTERN_D,
  });
}

// 鉄板の穴
const HOLES = [7, 17, 27, 37, 47, 57];
const HY = 25; // 穴の中心
const HR = 4;

/** 生地のままの玉。上から見える平らな面に具が散る */
function raw(g: PixelGfx, cx: number, i: number) {
  g.ellipse(cx, HY, HR - 1, 2, BATTER);
  g.hline(cx - HR + 1, HY + 2, HR * 2 - 1, BATTER_D);
  g.px(cx - 1 + (i % 2), HY - 1, GINGER);
  g.px(cx + 2, HY, NORI);
  g.px(cx - 2, HY + 1, NORI);
  g.px(cx + (i % 3) - 1, HY + 1, TAKO);
}

/** 焼けて返った玉。まんまる */
function done(g: PixelGfx, cx: number) {
  g.disc(cx, HY - 1, HR - 1, BALL);
  g.ring(cx, HY - 1, HR - 1, BALL_D);
  g.px(cx - 1, HY - 3, BALL_L);
  g.px(cx - 2, HY - 2, BALL_L);
  g.px(cx - 1, HY - 2, BALL_L);
  g.px(cx + 1, HY, BALL_D);
}

/** 返している途中。上半分はもう焼き色、下半分はまだ生地 */
function turning(g: PixelGfx, cx: number) {
  g.disc(cx, HY - 1, HR - 1, BALL);
  g.ring(cx, HY - 1, HR - 1, BALL_D);
  for (let y = HY + 1; y <= HY + 2; y++) g.hline(cx - HR + 1, y, HR * 2 - 1, HOLE);
  g.ellipse(cx, HY + 1, HR - 1, 1, BATTER);
  g.px(cx, HY + 1, GINGER);
  g.px(cx - 1, HY - 3, BALL_L);
}

export const art: LabelArt = {
  slug: "takoyaki",
  swatch: [LANTERN, NIGHT, BALL, BATTER, WOOD],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;

    // ── 夜の通りと提灯 ───────────────────────────────────
    g.rect(0, 0, 68, 19, NIGHT);
    g.rect(0, 15, 68, 4, NIGHT_D, "half");
    g.line(28, 2, 67, 1, STRING);
    for (const [i, x] of [31, 38, 45, 52, 59].entries()) lantern(g, x, 2 - (i > 2 ? 1 : 0));

    // ── 題字 ─────────────────────────────────────────────
    misakiRow(g, 3, 2, "大忙し", GOLD, GOLD_D);
    misakiRow(g, 3, 10, "たこ焼き屋さん", PAPER, SHADOW);

    // ── たこ焼き器の鉄板（真横から1列） ──────────────────
    g.rect(0, 19, 68, 12, IRON);
    g.hline(0, 19, 68, IRON_L);
    g.hline(0, 30, 68, IRON_D);
    HOLES.forEach((cx) => {
      g.disc(cx, HY, HR, HOLE);
      g.hline(cx - HR, HY - HR - 1, HR * 2 + 1, IRON);
      g.hline(cx - HR + 1, HY + HR, HR * 2 - 1, IRON_L); // 穴の下ふちの照り
    });

    // ── 玉。ピックが左から順に返していく ─────────────────
    const at = Math.floor(f / 2); // いま返している穴
    const phase = f % 2; // 0=差しこむ 1=返し終わり
    HOLES.forEach((cx, i) => {
      if (i < at || (i === at && phase === 1)) done(g, cx);
      else if (i === at) turning(g, cx);
      else raw(g, cx, i);
    });
    // 返し終わった玉から湯気
    for (let i = 0; i < at; i++) {
      const cx = HOLES[i];
      g.px(cx + ((f + i) % 3) - 1, 19 - ((f + i) % 2), "#ffffff88");
    }

    // ピック。差しこむコマは低く、返すコマは持ち上がる
    const pcx = HOLES[at];
    // 柄は寝かせて、上の題字にかからないようにする。
    const lift = phase === 1 ? 2 : 0;
    g.line(pcx + 1, HY - 1 - lift, pcx + 7, HY - 4 - lift, PICK);
    g.line(pcx + 1, HY - lift, pcx + 7, HY - 3 - lift, PICK_D);
    g.line(pcx + 8, HY - 5 - lift, pcx + 11, HY - 6 - lift, WOOD_L);
    g.line(pcx + 8, HY - 4 - lift, pcx + 11, HY - 5 - lift, WOOD_D);

    // ── 屋台のカウンター ─────────────────────────────────
    g.rect(0, 31, 68, 9, WOOD);
    g.hline(0, 31, 68, WOOD_L);
    g.hline(2, 34, 18, WOOD_D, "half");
    g.hline(30, 37, 22, WOOD_D, "half");
    misakiRow(g, 4, 32, "シミュレーター", PAPER, WOOD_D);

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。夜の紺に合わせる。
    g.frame(0, 0, 68, 40, SHADOW);
    mark(g, PAPER, WOOD_D);
  },
};
