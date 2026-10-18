import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { JP_SIZE, JP_TH, ascent, jpRow } from "../jptitle";

// なかよしケーキシミュレーター — ケーキを好きに飾って、
// みんなで「公平に」切り分ける。飾りが偏っていても、取り分が揃うように切る。
//
// 図の骨組み: 上の帯がベージュの卓で、題字「なかよしケーキ」を
//   13pxで2行（なかよし／ケーキ）。下はお皿にのった丸いホールケーキ（斜め上から）。
//   上面に苺が散らしてあり、ふちには絞りの粒がぐるりと並ぶ。
// 動くもの: 前半は放射に6等分の切り目が入り、それぞれのピースに
//   苺がひとつずつ載る＝「なかよし」に分けた状態。後半は切る前のホール。
//   止め絵（t=0）で切り分けた姿が見える順にしてある。

const TABLE = "#e6d3b6";
const TABLE_G = "#d9c3a0";
const INK = "#4a2f1e";
const INK_SH = "#f4e8d4";

const PLATE = "#fbf8f2";
const PLATE_D = "#d8d0c2";
const PLATE_GOLD = "#e3c98e";
const CREAM = "#fffdf7";
const CREAM_D = "#ece6da";
const SIDE = "#f3eee4";
const SIDE_D = "#ddd5c6";
const BERRY = "#e0384a";
const BERRY_D = "#a81e30";
const LEAF = "#6aa84a";
const CUT = "#c9bfae";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

const T_A = "なかよし";
const T_B = "ケーキ";

// 題字は左上に2行（上の行 x=2..54、下の行 x=2..41）。
// ケーキは右下に据え、題字の下の行と縦に半分ずつ重ねて丈を稼ぐ。
const CX = 50;
const CY = 27;
const RX = 14;
const RY = 5;
const H = 4;

export const art: LabelArt = {
  slug: "nakayoshi",
  swatch: [TABLE, CREAM, BERRY, PLATE_GOLD, INK],
  draw: (g, t) => {
    // ── 卓 ───────────────────────────────────────────────
    g.rect(0, 0, 68, 40, TABLE);
    // 木目は題字にかからない左下だけ。
    g.hline(3, 32, 16, TABLE_G);
    g.hline(12, 35, 14, TABLE_G);

    // ── お皿 ─────────────────────────────────────────────
    g.ellipse(CX, CY + H + 2, RX + 3, RY + 2, PLATE_D);
    g.ellipse(CX, CY + H + 1, RX + 3, RY + 2, PLATE);
    g.ellipse(CX, CY + H + 1, RX + 2, RY + 1, PLATE_GOLD);
    g.ellipse(CX, CY + H + 1, RX + 1, RY, PLATE);

    // ── 側面 ─────────────────────────────────────────────
    g.ellipse(CX, CY + H, RX, RY, SIDE_D);
    g.rect(CX - RX, CY, RX * 2 + 1, H, SIDE);
    g.vline(CX - RX, CY, H, SIDE_D);
    g.vline(CX + RX, CY, H, SIDE_D);
    // 下のふちの絞り。手前の弧だけ見える。
    for (let a = 10; a <= 170; a += 13) {
      const r = (a * Math.PI) / 180;
      const x = CX + Math.round(Math.cos(r) * RX);
      const y = CY + H + Math.round(Math.sin(r) * RY);
      g.px(x, y - 1, CREAM);
      g.px(x, y, CREAM_D);
    }

    // ── 上面 ─────────────────────────────────────────────
    g.ellipse(CX, CY, RX, RY, CREAM_D);
    g.ellipse(CX, CY - 1, RX - 1, RY - 1, CREAM);

    // ── 切り目と苺 ───────────────────────────────────────
    const cut = t < 0.5;
    const N = 6;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2 + Math.PI / N;
      if (cut) {
        // 中心からふちへ、まっすぐの切り目。側面にも1本降ろす。
        const ex = CX + Math.round(Math.cos(a0) * RX);
        const ey = CY + Math.round(Math.sin(a0) * RY);
        g.line(CX, CY, ex, ey, CUT);
        if (Math.sin(a0) > 0) g.vline(ex, ey, H, CUT);
      }
      // 苺は各ピースの真ん中に1つずつ。切る前から6つ載っている。
      const am = a0 + Math.PI / N;
      const bx = CX + Math.round(Math.cos(am) * RX * 0.6);
      const by = CY + Math.round(Math.sin(am) * RY * 0.6) - 1;
      g.rect(bx - 1, by, 3, 2, BERRY);
      g.px(bx, by + 2, BERRY_D);
      g.px(bx, by - 1, LEAF);
    }

    // ── 題字 ─────────────────────────────────────────────
    // 卓の左上に2行。13px。ケーキより後に刷って、重なりでは字を勝たせる。
    const asc = ascent(T_A + T_B, JP_SIZE, JP_TH);
    jpRow(g, 2, T_A, INK, { size: JP_SIZE, ascent: asc, shadow: INK_SH, x: 2 });
    jpRow(g, 15, T_B, INK, { size: JP_SIZE, ascent: asc, shadow: INK_SH, x: 2 });

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。苺の赤に合わせる。
    g.frame(0, 0, 68, 40, BERRY);
    mark(g, BERRY, PLATE);
  },
};
