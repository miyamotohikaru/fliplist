import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// なんでもロールアイスシミュレーター — 冷たい鉄板にベースを流して、
// へらで巻いて、好きなように盛りつける。
//
// 図の骨組み: ラベル一面が冷たい鉄板で、真上から見下ろす。
//   題字は鉄板に刻むように3行（「なんでも」「ロールアイス」「シミュレーター」）。
//   まんなかの帯に、できあがったカップが10個、2列の互い違いに並ぶ
//   （2026-11-13 ユーザー指示「いろんなロールアイスが完成していく様子。10種類ぐらい並ぶ」。
//   その前の版は、くぼみでベースを巻くところと、完成品1つだった）。
//   どのカップも真上から見ると、立てて詰めたロール4本の渦と、てっぺんの具。
//   味もカップも実物の選択肢から10通り（いちご・チョコ・マンゴー・バタフライピー…）。
//   右上の空きには、2本のへらを置く。
//
// 動くもの（1周3秒・12コマ）: 0〜1コマ目は10個ぜんぶ完成した姿（止まっているときの絵）。
//   2コマ目でカップが空になり、そこから左から順に1コマ1個ずつ、
//   ロールが詰まって具がのり、きらっと光って完成していく。

const STEEL = "#c4cad1";
const STEEL_L = "#d3d8de";
const STEEL_D = "#9ea6b0";
const FROST = "#eef2f6";
const INK = "#26313f";
const CUP_IN = "#e6e2da"; // 空のカップの底
const CUP_IN_D = "#cdc7bc"; // 空のカップの内側の影
const SHADOW = "#9aa2ad";
const SPARK = "#ffffff";
const SPARK_Y = "#fff3a0";
const BLADE = "#eef1f4";
const BLADE_D = "#7c8590";
const HANDLE = "#2a2a2e";
const HANDLE_L = "#4a4a52";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

/** 具（3x3）。てっぺん、4本のロールのまんなかに置く */
type Topping = { rows: string[]; pal: Record<string, string> };
const T_STRAWBERRY: Topping = { rows: [".g.", "RRR", ".R."], pal: { R: "#d42c48", g: "#4a9a3a" } };
const T_MARSH: Topping = { rows: ["ww.", "wWw", ".ww"], pal: { w: "#ffffff", W: "#f4d8e4" } };
const T_KIWI: Topping = { rows: ["kkk", "kdk", "kkk"], pal: { k: "#8ac83a", d: "#2a2a1a" } };
const T_STAR: Topping = { rows: [".y.", "yyy", "y.y"], pal: { y: "#ffe04a" } };
const T_CHERRY: Topping = { rows: ["..s", ".s.", "RR."], pal: { R: "#c81830", s: "#5a3a1a" } };
const T_CREAM: Topping = { rows: [".c.", "ccc", ".c."], pal: { c: "#fffaf0" } };
const T_STICK: Topping = { rows: ["s..", ".s.", "..s"], pal: { s: "#4a2616" } };
const T_GUMMY: Topping = { rows: ["o.o", "ooo", "o.o"], pal: { o: "#ff8a2a" } };
const T_COOKIE: Topping = { rows: ["kkk", "kwk", "kkk"], pal: { k: "#2a2420", w: "#f4f0e8" } };
const T_CHIP: Topping = { rows: ["c.c", ".c.", "c.c"], pal: { c: "#4a2616" } };

/** 1杯ぶん。ロールの色（照り・地・芯と影）、カップのふちの色、具 */
type Cup = { L: string; b: string; d: string; rim: string; rim2: string; top: Topping };
const CUPS: Cup[] = [
  // いちご × ピンクのカップ
  { L: "#ffd6e0", b: "#f4a6b8", d: "#c45a78", rim: "#ff8fb0", rim2: "#ff8fb0", top: T_STRAWBERRY },
  // チョコ × しまのカップ
  { L: "#b07a52", b: "#8a5232", d: "#4a2616", rim: "#ffffff", rim2: "#e8404a", top: T_MARSH },
  // マンゴー × レモン色のカップ
  { L: "#ffe08a", b: "#ffc23a", d: "#c8801a", rim: "#fff06a", rim2: "#fff06a", top: T_KIWI },
  // バタフライピー × 白いカップ
  { L: "#9ab0ff", b: "#5a7ae0", d: "#2a3a9a", rim: "#ffffff", rim2: "#ffffff", top: T_STAR },
  // ピスタチオ × クラフトのカップ
  { L: "#d0e8a0", b: "#a8c86a", d: "#5a7a2a", rim: "#c89a62", rim2: "#c89a62", top: T_CHERRY },
  // タロイモ × ミントのカップ
  { L: "#dccaf4", b: "#b89ae0", d: "#6a4aa0", rim: "#7ee0c4", rim2: "#7ee0c4", top: T_CREAM },
  // ミント × 白いカップ
  { L: "#d0fff0", b: "#9ae8cc", d: "#3a9a7a", rim: "#ffffff", rim2: "#ffffff", top: T_STICK },
  // バニラ × しまのカップ
  { L: "#ffffff", b: "#f8eedc", d: "#b89a6a", rim: "#ffffff", rim2: "#4a7ae0", top: T_GUMMY },
  // レッドベルベット × ピンクのカップ
  { L: "#e86a78", b: "#c8384a", d: "#7a1a2a", rim: "#ff8fb0", rim2: "#ff8fb0", top: T_CREAM },
  // ココアクッキー × クラフトのカップ
  { L: "#ffffff", b: "#ece8e0", d: "#4a4038", rim: "#c89a62", rim2: "#c89a62", top: T_COOKIE },
];
// ミントにはチョコチップを散らす
const CHIPS_ON = 6;

/** 真上から見たカップ（9x9）。ふちの輪。r と q が交互で「しま」になる */
const RIM = ["..rqrqr..", ".q.....q.", "r.......r", "q.......q", "r.......r", "q.......q", "r.......r", ".q.....q.", "..rqrqr.."];
/** 立てたロール1本（3x3）。角を影の色で落として丸く。左上に照り、まんなかに巻きの芯 */
const ROLL = ["oLb", "Ldb", "bbo"];

// 2列の互い違い。左上の角（x, y）。完成する順に左から並べる
const SLOTS: [number, number][] = [
  [2, 17],
  [8, 23],
  [15, 17],
  [21, 23],
  [27, 17],
  [33, 23],
  [40, 17],
  [46, 23],
  [52, 17],
  [58, 23],
];

function drawCup(g: PixelGfx, x: number, y: number, c: Cup, full: boolean, chips: boolean) {
  // 鉄板に落ちる影（右下へ1px）
  g.disc(x + 5, y + 5, 4, SHADOW);
  // カップの中（空の底）
  g.rect(x + 2, y + 1, 5, 7, CUP_IN);
  g.rect(x + 1, y + 2, 7, 5, CUP_IN);
  g.hline(x + 2, y + 1, 5, CUP_IN_D);
  g.vline(x + 1, y + 2, 5, CUP_IN_D);
  g.blit(x, y, RIM, { r: c.rim, q: c.rim2 });
  if (!full) return;
  // ロール4本（2x2）。すきまはロールの影の色で、1本ずつ丸く浮かせる
  g.rect(x + 1, y + 4, 7, 1, c.d);
  g.rect(x + 4, y + 1, 1, 7, c.d);
  for (const [dx, dy] of [
    [1, 1],
    [5, 1],
    [1, 5],
    [5, 5],
  ])
    g.blit(x + dx, y + dy, ROLL, { L: c.L, b: c.b, d: c.d, o: c.d });
  // ふちで欠ける角を戻す
  g.px(x + 1, y + 1, c.rim2);
  g.px(x + 7, y + 1, c.rim2);
  g.px(x + 1, y + 7, c.rim2);
  g.px(x + 7, y + 7, c.rim2);
  if (chips) {
    g.px(x + 3, y + 2, "#4a2616");
    g.px(x + 6, y + 6, "#4a2616");
  }
  // 具はまんなか
  g.blit(x + 3, y + 3, c.top.rows, c.top.pal);
}

/** へら（真上から）。四角い刃と、まっすぐ下へのびる黒い柄 */
function spatula(g: PixelGfx, x: number, y: number) {
  g.rect(x, y, 5, 5, BLADE);
  g.vline(x + 4, y, 5, BLADE_D);
  g.hline(x, y + 4, 5, BLADE_D);
  g.rect(x + 2, y + 5, 1, 2, BLADE_D);
  g.rect(x + 1, y + 7, 3, 6, HANDLE);
  g.vline(x + 1, y + 7, 6, HANDLE_L);
}

export const art: LabelArt = {
  slug: "rollice",
  swatch: [STEEL, "#f4a6b8", "#8a5232", "#ffc23a", "#5a7ae0"],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    // いま何個できているか。0〜1コマ目は全部、2コマ目から1個ずつ
    const doneCount = f < 2 ? SLOTS.length : f - 1;

    // ── 鉄板（ヘアライン） ────────────────────────────────
    g.rect(0, 0, 68, 40, STEEL);
    for (let y = 1; y < 40; y += 2) g.hline(0, y, 68, STEEL_L, "half");
    for (let y = 3; y < 40; y += 6) g.hline(4 + (y % 5), y, 20, STEEL_D, "quarter");

    // ── 題字。鉄板に刻む ─────────────────────────────────
    misakiRow(g, 3, 2, "なんでも", INK, FROST);
    misakiRow(g, 3, 10, "ロールアイス", INK, FROST);
    misakiRow(g, 4, 32, "シミュレーター", INK, FROST);

    // ── 右上の空きに、へら2本 ────────────────────────────
    spatula(g, 54, 2);
    spatula(g, 60, 3);

    // ── カップ10個 ───────────────────────────────────────
    SLOTS.forEach(([x, y], i) => {
      const full = i < doneCount;
      drawCup(g, x, y, CUPS[i], full, i === CHIPS_ON);
    });

    // いま完成した1個が光る
    if (f >= 2) {
      const [x, y] = SLOTS[f - 2];
      const cx = x + 4;
      const cy = y + 4;
      for (const [dx, dy, c] of [
        [-6, 0, SPARK],
        [6, 0, SPARK],
        [0, -6, SPARK_Y],
        [-5, -4, SPARK_Y],
        [5, -4, SPARK],
        [5, 4, SPARK_Y],
        [-5, 4, SPARK],
      ] as [number, number, string][])
        g.px(cx + dx, cy + dy, c);
    }

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。題字の墨に合わせる。
    g.frame(0, 0, 68, 40, INK);
    mark(g, INK, FROST);
  },
};
