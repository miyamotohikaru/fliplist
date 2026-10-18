import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

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
//
// 題字は正式名「おえかきパンケーキシミュレーター」を全部入れる（2026-10-18 ユーザー指示）。
// 16字は1行に入らないので、左に「おえかき」「パンケーキ」、下に「シミュレーター」の3行。
// DotGothic16 は9pxまで縮めると字が化けるので、8x8設計の美咲フォント（src/art/misaki.ts）で組む。
// パンケーキの絵は右上に寄せる。

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

const T_A = "おえかき";
const T_B = "パンケーキ";
const T_C = "シミュレーター";
const CX = 57;
const CY = 13;

export const art: LabelArt = {
  slug: "pancake",
  swatch: [BOARD, PLATE, CAKE_2, CAKE_E, LINE],
  draw: (g, t) => {
    // ── 木の板 ───────────────────────────────────────────
    g.rect(0, 0, 68, 40, BOARD);
    g.hline(1, 36, 66, BOARD_G);

    // ── お皿 ─────────────────────────────────────────────
    g.disc(CX + 1, CY + 1, 11, PLATE_D);
    g.disc(CX, CY, 11, PLATE);
    for (let a = -20; a <= 130; a += 12) {
      const r = (a * Math.PI) / 180;
      g.px(CX + Math.round(Math.cos(r) * 10), CY + Math.round(Math.sin(r) * 10), PLATE_RIB);
    }

    // ── パンケーキ ───────────────────────────────────────
    // 外ほど濃い焼き色。輪を重ねて年輪のように見せる。
    g.disc(CX, CY, 9, CAKE_E);
    g.disc(CX, CY, 8, CAKE_1);
    g.disc(CX, CY, 7, CAKE_2);
    g.disc(CX, CY, 5, CAKE_3);
    g.disc(CX, CY + 1, 3, CAKE_C);

    // ── こすくまくんの笑い顔（焦げ色の線） ──────────────
    // 手本どおり、大きな丸い輪郭に、輪の耳が左右の肩に重なる。
    g.ring(CX, CY + 1, 6, LINE, 1); // 輪郭
    for (const ex of [CX - 5, CX + 5]) {
      g.disc(ex, CY - 4, 1, CAKE_2);
      g.ring(ex, CY - 4, 2, LINE, 1); // 耳
    }
    // にっこり閉じた目（^ ^）
    for (const ex of [CX - 3, CX + 3]) {
      g.px(ex - 1, CY, LINE);
      g.px(ex, CY - 1, LINE);
      g.px(ex + 1, CY, LINE);
    }
    // 鼻と口
    g.px(CX, CY + 2, CAKE_E);
    g.px(CX - 2, CY + 3, LINE);
    g.hline(CX - 1, CY + 4, 3, LINE);
    g.px(CX + 2, CY + 3, LINE);

    // ── つや ─────────────────────────────────────────────
    if (t < 0.5) {
      g.px(CX - 6, CY - 1, CAKE_C);
      g.px(CX - 5, CY - 2, CAKE_C);
    }

    // ── 題字 ─────────────────────────────────────────────
    // 3行とも8x8。左寄せで、上2行はお皿の左に収める。
    misakiRow(g, 4, 6, T_A, INK, INK_SH);
    misakiRow(g, 4, 16, T_B, INK, INK_SH);
    misakiRow(g, 4, 26, T_C, INK, INK_SH);

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。焼き色に合わせる。
    g.frame(0, 0, 68, 40, CAKE_1);
    mark(g, CAKE_3, LINE);
  },
};
