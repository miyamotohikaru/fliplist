import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow, misakiWidth } from "../misaki";

// なかよしケーキシミュレーター — ケーキを好きに飾って、
// みんなで「公平に」切り分ける。
//
// 図の手本は、実物で飾り終えたケーキ（2026-10-18 ユーザー提供）。
//   白いホールケーキを斜め上から。上面のふちはうすいピンクのクリーム。
//   ふちに沿って苺がぐるりと並び、あいだに青いブルーベリーと
//   ピンクのラズベリー。上面のまんなかには、チョコの線で
//   寝そべったこすくまくん。お皿にも苺とブルーベリーがこぼれている。
// 動くもの: 上面のアラザン（銀の粒）がちかちか光る。
//
// 題字は正式名「なかよしケーキシミュレーター」を全部入れる（2026-10-18 ユーザー指示）。
// 「なかよしケーキ」「シミュレーター」の2行に割る。DotGothic16 は9pxまで縮めると
// 字が化けるので、8x8設計の美咲フォント（src/art/misaki.ts）で組む。

const TABLE = "#f1e7d6";
const INK = "#4a2f1e";
const INK_SH = "#fbf5ea";

const PLATE = "#fbf8f2";
const PLATE_D = "#d9d2c4";
const CREAM = "#fffdf8";
const CREAM_D = "#ebe5da";
const PINK = "#f3d6dc";
const SIDE = "#f4f0e8";
const SIDE_D = "#ddd6ca";
const BERRY = "#e3343e";
const BERRY_L = "#ff8a86";
const BERRY_D = "#a81c28";
const BLUE = "#6c78c8";
const BLUE_D = "#454f96";
const RASP = "#ec6a86";
const LEAF = "#6aa84a";
const CHOCO = "#4a2a18";
const SILVER = "#c9ccd6";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// 寝そべったこすくまくん（チョコの線、17x7）。
// 背中の山、右に耳2つと目、左下に小さな手。
const BEAR = [
  "...####....##.##.",
  "..#....####..#..#",
  ".#..............#",
  "#...........#...#",
  "#...............#",
  "#.#.#...........#",
  ".###############.",
];

const T_A = "なかよしケーキ";
const T_B = "シミュレーター";
const CX = 34;
const CY = 29;
const RX = 25;
const RY = 7;
const H = 3;

export const art: LabelArt = {
  slug: "nakayoshi",
  swatch: [CREAM, BERRY, BLUE, PINK, CHOCO],
  draw: (g, t) => {
    // ── 卓 ───────────────────────────────────────────────
    g.rect(0, 0, 68, 40, TABLE);

    // ── 題字 ─────────────────────────────────────────────
    // 7字 x 8px。2行とも中央に。
    const tx = Math.round((68 - misakiWidth(T_A)) / 2);
    misakiRow(g, tx, 4, T_A, INK, INK_SH);
    misakiRow(g, tx, 13, T_B, INK, INK_SH);

    // ── お皿。左右の端だけ見える ──────────────────────────
    g.ellipse(CX, CY + H + 1, RX + 6, RY + 3, PLATE_D);
    g.ellipse(CX, CY + H, RX + 6, RY + 3, PLATE);
    // こぼれた苺とブルーベリー
    g.rect(5, 31, 2, 2, BERRY);
    g.px(5, 31, BERRY_L);
    g.rect(62, 27, 2, 2, BLUE);
    g.rect(8, 34, 2, 1, BLUE_D);

    // ── 側面 ─────────────────────────────────────────────
    g.ellipse(CX, CY + H, RX, RY, SIDE_D);
    g.rect(CX - RX, CY, RX * 2 + 1, H, SIDE);

    // ── 上面 ─────────────────────────────────────────────
    g.ellipse(CX, CY, RX, RY, PINK);
    g.ellipse(CX, CY + 1, RX - 3, RY - 2, CREAM_D);
    g.ellipse(CX, CY, RX - 3, RY - 2, CREAM);

    // ── まんなかのチョコの絵 ─────────────────────────────
    g.blit(CX - 8, CY - 4, BEAR, { "#": CHOCO });

    // ── ふちの飾り ───────────────────────────────────────
    // 苺を14個、ぐるりと。あいだにブルーベリーとラズベリー。
    const N = 14;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const bx = CX + Math.round(Math.cos(a) * (RX - 2));
      const by = CY + Math.round(Math.sin(a) * (RY - 1)) - 1;
      // 間の粒
      const am = a + Math.PI / N;
      const mx = CX + Math.round(Math.cos(am) * (RX - 1));
      const my = CY + Math.round(Math.sin(am) * (RY - 1));
      g.px(mx, my, i % 3 === 0 ? RASP : BLUE);
      g.px(mx, my + 1, i % 3 === 0 ? "#b84462" : BLUE_D);
      // 苺
      g.rect(bx - 1, by, 3, 2, BERRY);
      g.px(bx, by + 2, BERRY_D);
      g.px(bx - 1, by, BERRY_L);
    }
    // 奥のミントの葉
    g.px(CX - 3, CY - RY, LEAF);
    g.px(CX + 6, CY - RY + 1, LEAF);

    // ── アラザン。上面の内側でちかちか光る ──────────────
    const on = t < 0.5;
    for (const [x, y, k] of [
      [CX - 13, CY + 2, 0],
      [CX + 12, CY + 3, 1],
      [CX - 4, CY + 5, 1],
      [CX + 5, CY + 5, 0],
    ] as Array<[number, number, number]>) {
      g.px(x, y, (k === 0) === on ? "#ffffff" : SILVER);
    }

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。苺の赤に合わせる。
    g.frame(0, 0, 68, 40, BERRY);
    mark(g, BERRY, PLATE);
  },
};
