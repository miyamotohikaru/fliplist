import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { JP_SIZE, JP_TH, ascent, jpRow } from "../jptitle";

// おえかきパンケーキシミュレーター — 実物は「Pancake Canvas」。
// 温めたフライパンに生地で絵を描き、生地を流して、ひっくり返すと
// 描いた線が焦げ色になって表に出てくる。
//
// 図の手本は、実物の「できた！」の画面（2026-10-18 ユーザー提供）。
//   木の板の上に白いお皿、その上にきつね色のパンケーキ。
//   焼き色は外ほど濃く、年輪のような輪が何本か出る。
//   表には、焦げ色の線でこすくまくんの笑い顔（丸い輪郭・輪の耳・
//   にっこり閉じた目・小さな鼻・口）が描いてある。
// 動くもの: 焼きたてのつやが、左上でちらっと光る。

const BOARD = "#e9dcc0";
const BOARD_L = "#f2e8d2";
const BOARD_G = "#d8c7a4";
const INK = "#4a2f1e";
const INK_SH = "#f7efe0";

const PLATE = "#fbfaf6";
const PLATE_D = "#dcd8cf";
const PLATE_RIB = "#eae6dd";

const CAKE_E = "#7e3f16"; // ふち
const CAKE_1 = "#9c5520";
const CAKE_2 = "#b86e30";
const CAKE_3 = "#cf8a44";
const CAKE_C = "#e0a65e"; // まんなか
const LINE = "#3a2010";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

const T = "パンケーキ";
const CX = 34;
const CY = 27;

export const art: LabelArt = {
  slug: "pancake",
  swatch: [BOARD, PLATE, CAKE_2, CAKE_E, LINE],
  draw: (g, t) => {
    // ── 木の板 ───────────────────────────────────────────
    // 実物と同じく、縦の板目。
    g.rect(0, 0, 68, 40, BOARD);
    for (const x of [9, 22, 47, 58]) g.vline(x, 15, 25, BOARD_G);
    g.rect(1, 1, 66, 14, BOARD_L);

    // ── 題字 ─────────────────────────────────────────────
    // 5文字 x 13px = 65px。ラベルの内側66pxに1行で入る最大。
    const asc = ascent(T, JP_SIZE, JP_TH);
    jpRow(g, 2, T, INK, { size: JP_SIZE, ascent: asc, shadow: INK_SH });

    // ── お皿 ─────────────────────────────────────────────
    // パンケーキを大きく見せたいので、お皿は外周2pxだけ覗かせる。
    g.disc(CX + 1, CY + 1, 13, PLATE_D);
    g.disc(CX, CY, 13, PLATE);
    for (let a = -20; a <= 130; a += 12) {
      const r = (a * Math.PI) / 180;
      g.px(CX + Math.round(Math.cos(r) * 12), CY + Math.round(Math.sin(r) * 12), PLATE_RIB);
    }

    // ── パンケーキ ───────────────────────────────────────
    // 外ほど濃い焼き色。輪を重ねて年輪のように見せる。
    g.disc(CX, CY, 11, CAKE_E);
    g.disc(CX, CY, 10, CAKE_1);
    g.disc(CX, CY, 9, CAKE_2);
    g.ring(CX, CY, 8, CAKE_1, 1);
    g.disc(CX, CY, 6, CAKE_3);
    g.disc(CX, CY + 1, 4, CAKE_C);

    // ── こすくまくんの笑い顔（焦げ色の線） ──────────────
    // 手本どおり、大きな丸い輪郭に、輪の耳が左右の肩に重なる。
    g.ring(CX, CY + 1, 7, LINE, 1); // 輪郭
    for (const ex of [CX - 6, CX + 6]) {
      g.disc(ex, CY - 5, 2, CAKE_2);
      g.ring(ex, CY - 5, 2, LINE, 1); // 耳
    }
    // にっこり閉じた目（^ ^）
    for (const ex of [CX - 3, CX + 3]) {
      g.px(ex - 1, CY, LINE);
      g.px(ex, CY - 1, LINE);
      g.px(ex + 1, CY, LINE);
    }
    // 鼻と口
    g.px(CX, CY + 2, CAKE_E);
    g.px(CX - 3, CY + 4, LINE);
    g.hline(CX - 2, CY + 5, 5, LINE);
    g.px(CX + 3, CY + 4, LINE);

    // ── つや ─────────────────────────────────────────────
    // 焼きたてのつやが、左上でちらっと光る。
    if (t < 0.5) {
      g.px(CX - 7, CY - 2, CAKE_C);
      g.px(CX - 6, CY - 3, CAKE_C);
    }

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。焼き色に合わせる。
    g.frame(0, 0, 68, 40, CAKE_1);
    mark(g, CAKE_3, LINE);
  },
};
