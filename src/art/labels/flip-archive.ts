import type { LabelArt } from "./types";
import { rng } from "../gfx";
import type { PixelGfx } from "../gfx";
import { JP_TH, ascent, jpRow } from "../jptitle";

// 世界のFLIP図鑑 — 常識をひっくり返した事例の記録。
// 実物は生成りの紙に墨と朱の、たいへん静かな版面で、
// 図版が斜めのカスケードになって奥へ流れてゆく。
// だからこの1枚だけはドット絵でも「紙もの」の顔をさせる。
// 主役は活字。FLIP と、その真下でひっくり返った FLIP。

// 16枚を並べたとき、この1枚だけ明度が飛び抜けて穴が空いて見えた。
// 実物の生成りの紙に忠実であることより、図録として揃うことを取って、
// 紙の色を一段落としてある（＝すこし日に焼けた紙）。墨と朱はそのまま。
const PAPER = "#ddd3b4";
const PAPER2 = "#cfc4a1";
const PAPER3 = "#ebe2c6";
const RULE = "#a2977a";
const RULE2 = "#bdb392";
const INK = "#1b1a17";
const INK2 = "#4b463a";
const RED = "#c8402c";
const SHADOW = "#b5aa89";

const BIG: Record<string, string[]> = {
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
};

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 和文の題字 ──────────────────────────────────────────
// 「世界のFLIP図鑑」。FLIP は欧文の活字のまま、和文の行に組み込む。
//   1行目: 「世界の」(13px) ＋ FLIP
//   2行目: 「図鑑」(15px)  ＋ ひっくり返った FLIP
// 左から右へ「世界の → FLIP」、次の行が「図鑑」で、題名どおりに読める。
// 上下でひっくり返る仕掛けは、右の活字の側がそのまま持っている。
//
// 「鑑」は13pxでも15pxでも金偏と監が繋がって黒い塊になる。17pxまで上げると
// 左右のあいだに縦の余白が1本通って、はじめて2つの部品に見える。
// 2字の行なので 17px x 2 = 34px、幅はまだ半分も余る。丈が1行伸びるだけ。
const T_A = "世界の";
const T_B = "図鑑";
const T_SIZE_A = 13;
const T_SIZE_B = 17;
function rot180(rows: string[]): string[] {
  return rows
    .slice()
    .reverse()
    .map((r) => r.split("").reverse().join(""));
}

function word(g: PixelGfx, x: number, y: number, s: string, c: string, flip = false) {
  const chars = flip ? s.split("").reverse() : s.split("");
  let cx = x;
  for (const ch of chars) {
    const rows = BIG[ch];
    if (rows) g.blit(cx, y, flip ? rot180(rows) : rows, { "#": c });
    cx += 6;
  }
}

/**
 * 図版の板。奥へ流れてゆく帯の、そのひとつ。
 * 題字を全文字入れたぶん帯の丈が10行に詰まったので、板も 12x16 から 12x10 に
 * 詰めた。図版・標題の罫・目盛りという中身の順序は変えていない。
 */
function plate(g: PixelGfx, x: number, y: number, kind: number) {
  const W = 12;
  const H = 9;
  // 落ち影
  g.rect(x + 1, y + 1, W, H, SHADOW);
  g.rect(x, y, W, H, PAPER3);
  g.frame(x, y, W, H, INK2);
  // 標題の罫
  g.hline(x + 2, y + 2, 3, INK);
  g.hline(x + 6, y + 2, 3, RULE);
  if (kind === 0) {
    // 塗りつぶしの図版
    g.rect(x + 2, y + 4, 8, 3, INK);
    g.hline(x + 3, y + 5, 6, "#3c382e");
  } else {
    // 格子の図版
    for (let i = 0; i <= 1; i++) g.hline(x + 2, y + 4 + i * 2, 8, RULE);
    for (let i = 0; i <= 4; i++) g.vline(x + 2 + i * 2, y + 4, 3, RULE);
    g.rect(x + 4, y + 4, 2, 2, INK);
  }
  // 下の小さな目盛り
  g.hline(x + 2, y + 7, 4, RULE);
  g.vline(x + W - 3, y + 6, 2, RULE);
}

export const art: LabelArt = {
  slug: "flip-archive",
  swatch: [PAPER, INK, RED, RULE, PAPER3],
  draw: (g, t) => {
    // ── 生成りの紙 ────────────────────────────────────────
    g.rect(0, 0, 68, 40, PAPER);
    g.noise(0, 0, 68, 40, PAPER3, 0.1, 8821);
    g.noise(0, 0, 68, 40, PAPER2, 0.12, 4409);
    // 紙の繊維
    const fr = rng(6673);
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(fr() * 66);
      const y = Math.floor(fr() * 38);
      g.hline(x, y, 1 + Math.floor(fr() * 2), "#dcd4bd");
    }

    // ── 下の帯。図版がひとつぶん流れる。 ─────────────────
    // 板2種を交互に並べ、1周でちょうど1枚ぶん送る。継ぎ目が出ない。
    // 題字が上の27行を取ったので、斜めのカスケードは水平の帯に改めた。
    // 板ごとに1px上下させて、奥へ流れてゆく気配だけ残す。
    const slide = t * 14;
    for (let i = -1; i <= 5; i++) {
      const px = Math.round(i * 14 + slide) - 12;
      if (px > 68 || px < -13) continue;
      plate(g, px, 29 + (((i % 2) + 2) % 2), ((i % 2) + 2) % 2);
    }
    // 帯の上をうっすら紙に戻して、題字の座を作る
    g.rect(0, 0, 68, 28, PAPER);
    g.noise(0, 0, 68, 28, PAPER2, 0.1, 991);
    g.noise(0, 0, 68, 28, PAPER3, 0.1, 313);
    g.hline(0, 28, 68, RULE2);

    // ── 主役の活字。上は正しく、下はひっくり返っている。 ─
    // 白場を作って、紙に刷った活字らしく見せる。和文の右の欄がその座。
    g.rect(43, 3, 25, 24, SHADOW);
    g.rect(42, 2, 25, 24, PAPER);
    g.noise(42, 2, 25, 24, PAPER3, 0.16, 77);
    g.frame(42, 2, 25, 24, RULE);
    word(g, 43, 4, "FLIP", INK);
    g.hline(43, 13, 23, INK);
    word(g, 43, 18, "FLIP", RED, true);
    // ひっくり返る、の印。和文と活字のあいだの欄に置く
    g.px(40, 15, RED);
    g.px(39, 16, RED);
    g.px(38, 17, RED);
    g.px(39, 18, RED);
    g.px(40, 19, RED);

    // ── 和文の題字 ────────────────────────────────────────
    // 上の行「世界の」の右に FLIP、下の行が「図鑑」。
    // 左から「世界の → FLIP」、次の行が「図鑑」で、題名どおりに読める。
    jpRow(g, 1, T_A, INK, {
      size: T_SIZE_A,
      ascent: ascent(T_A, T_SIZE_A, JP_TH),
      x: 1,
    });
    jpRow(g, 13, T_B, INK, {
      size: T_SIZE_B,
      ascent: ascent(T_B, T_SIZE_B, JP_TH),
      x: 1,
    });

    // ── 欄外 ──────────────────────────────────────────────
    // 通し番号「001」は落とした。「鑑」の右に11pxしか空きがなく、
    // 3桁を置くと画数の多い鑑と繋がって、字の一部に見えてしまう。
    // かわりに、版面の作法だけを朱の点と罫で残す。
    g.rect(38, 22, 2, 2, RED);
    g.hline(37, 26, 4, RULE);

    // ── ふち ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, INK);
    mark(g, INK, PAPER);
  },
};
