import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";
import { drawKosukumaSmall, KUMA } from "../kosukuma";

// 接待オセロ — こすくまくんにわざと負けるオセロ。負けたら勝ち（接待成功）。
// 負けるたびに、こすくまくんのつよさが「ふつう」から「うんち」まで1段ずつ下がる。
//
// 図の骨組み: 盤をはさんで、こすくまくんと向かい合って座っている（接待の席）。
//   手前に緑の盤を奥行きをつけて広げ、その向こうにこすくまくんの頭が出ている。
//   実物は黒（あなた）が先手、白がこすくまくん。
//   地は実物の背景（紙を重ねた夜空のうず）を、紺の地に淡い色の星と玉で。
//   題字は実物のロゴどおり、白に黒のふち。
//   こすくまくんの姿は kosukuma.ts が正解。置くだけで、目も口も足さない。
//
// 動くもの（1周3秒・12コマ）:
//   0コマ目（止まっているときの絵）は、白がだいぶ増えた盤。接待はうまくいっている。
//   1コマ目で最初の4つに戻り、2〜9コマ目で、黒と白が1手ずつ打つ（1コマに2手）。
//   黒（あなた）は、なるべく裏返さない手（負けにいく手）を打ち、
//   白（こすくまくん）は、いちばん多く裏返す手を打つ。盤がみるみる白くなる。
//   10〜11コマ目は接待成功。盤のまわりにきらきらが散り、こすくまくんがひょいと跳ねる。

const BG = "#3e4878";
const BG_D = "#333c66";
const SWIRL = ["#e8a6c0", "#9fd8c8", "#f2d68a", "#b9a8e6"];
const EDGE = "#14141c";
const WHITE = "#ffffff";

const RIM = "#1f7a44";
const RIM_D = "#16572f";
const GREEN = "#2ea35a";
const GREEN_L = "#38b366";
const LINE = "#22864a";
const STONE_B = "#1c1c1e";
const STONE_B_L = "#4a4a50";
const STONE_W = "#fbfbf6";
const STONE_W_D = "#cfcfc8";
const SPARK = ["#ffe14a", "#ff7ad0", "#6ee8ff", "#ffffff"];

// ── 盤（真上から。枡は横4・縦3。線の内側に 3x2 の石）──────────
const BX = 3;
const BY = 13;
const CW = 4;
const CH = 3;

/** 枡 (u, v) の石の左上 */
function at(u: number, v: number): [number, number] {
  return [BX + 1 + u * CW, BY + 1 + v * CH];
}

// ── 対局（決まった手順を、ラベルを読み込んだときに1度だけ解く）──
type Cell = 0 | 1 | 2; // 0=空 1=黒 2=白
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function flipsOf(b: Cell[], x: number, y: number, me: Cell): number[] {
  if (b[y * 8 + x]) return [];
  const op = me === 1 ? 2 : 1;
  const out: number[] = [];
  for (const [dx, dy] of DIRS) {
    const run: number[] = [];
    let cx = x + dx;
    let cy = y + dy;
    while (cx >= 0 && cx < 8 && cy >= 0 && cy < 8 && b[cy * 8 + cx] === op) {
      run.push(cy * 8 + cx);
      cx += dx;
      cy += dy;
    }
    if (run.length && cx >= 0 && cx < 8 && cy >= 0 && cy < 8 && b[cy * 8 + cx] === me)
      out.push(...run);
  }
  return out;
}

const PLIES = 16;

/** 0手目〜16手目の盤。黒は裏返す数がいちばん少ない手、白はいちばん多い手 */
const STATES: Cell[][] = (() => {
  const b: Cell[] = Array(64).fill(0);
  b[27] = 2;
  b[36] = 2;
  b[28] = 1;
  b[35] = 1;
  const out: Cell[][] = [b.slice()];
  let me: Cell = 1;
  for (let ply = 0; ply < PLIES; ply++) {
    let best = -1;
    let bestFlips: number[] = [];
    for (let i = 0; i < 64; i++) {
      const fl = flipsOf(b, i % 8, Math.floor(i / 8), me);
      if (!fl.length) continue;
      const better =
        best < 0 || (me === 1 ? fl.length < bestFlips.length : fl.length > bestFlips.length);
      if (better) {
        best = i;
        bestFlips = fl;
      }
    }
    if (best >= 0) {
      b[best] = me;
      for (const i of bestFlips) b[i] = me;
    }
    out.push(b.slice());
    me = me === 1 ? 2 : 1;
  }
  return out;
})();

function board(g: PixelGfx, cells: Cell[]) {
  const w = CW * 8 + 1;
  const h = CH * 8 + 1;
  // 影とふち
  g.rect(BX + 1, BY + 2, w + 1, h, "#00000040");
  g.rect(BX - 1, BY - 1, w + 2, h + 2, RIM);
  g.hline(BX - 1, BY + h, w + 2, RIM_D);
  // 緑の面と枡の線
  g.rect(BX, BY, w, h, LINE);
  for (let v = 0; v < 8; v++)
    for (let u = 0; u < 8; u++) {
      const [x, y] = at(u, v);
      g.rect(x, y, CW - 1, CH - 1, v < 2 ? GREEN_L : GREEN);
    }
  // 星（盤の4つの点）
  for (const [u, v] of [
    [2, 2],
    [6, 2],
    [2, 6],
    [6, 6],
  ])
    g.px(BX + u * CW, BY + v * CH, RIM_D);
  // 石（3x2。黒は左上に光、白は下に影）
  for (let i = 0; i < 64; i++) {
    const c = cells[i];
    if (!c) continue;
    const [x, y] = at(i % 8, Math.floor(i / 8));
    if (c === 1) {
      g.rect(x, y, 3, 2, STONE_B);
      g.px(x, y, STONE_B_L);
    } else {
      g.hline(x, y, 3, STONE_W);
      g.hline(x, y + 1, 3, STONE_W_D);
      g.px(x + 1, y + 1, STONE_W);
    }
  }
}

// ── 発行元の印 ──────────────────────────────────────────
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

function title(g: PixelGfx, x: number, y: number, text: string, c: string) {
  for (const [dx, dy] of [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [1, 2],
    [0, 2],
    [-1, 2],
  ])
    misakiRow(g, x + dx, y + dy, text, EDGE);
  misakiRow(g, x, y, text, c);
}

export const art: LabelArt = {
  slug: "settai-othello",
  swatch: [BG, GREEN, STONE_W, STONE_B, KUMA.fill],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    // 1コマ目＝最初の4つ。2〜9コマ目＝2手ずつ（黒が打って、白が返す）。0・10・11コマ目＝16手目の盤
    const ply = f === 1 ? 0 : f >= 2 && f <= 9 ? (f - 1) * 2 : PLIES;
    const done = f === 0 || f >= 10;

    // ── 地（紺の夜空に、紙のうずの色の玉と星）─────────────
    g.rect(0, 0, 68, 40, BG);
    g.rect(0, 0, 68, 6, BG_D, "half");
    for (const [x, y, r, k] of [
      [4, 15, 3, 0],
      [62, 3, 4, 2],
      [33, 14, 2, 1],
      [52, 15, 2, 3],
    ])
      g.disc(x, y, r, SWIRL[k], "half");
    for (const [x, y, k] of [
      [46, 2, 2],
      [12, 13, 1],
      [40, 12, 0],
    ]) {
      g.px(x, y, SWIRL[k]);
      g.px(x - 1, y, SWIRL[k]);
      g.px(x + 1, y, SWIRL[k]);
      g.px(x, y - 1, SWIRL[k]);
      g.px(x, y + 1, SWIRL[k]);
    }

    // ── こすくまくん（盤の右に立って、対局している）─────────────
    // 姿は kosukuma.ts が正解。ここでは置くだけ。
    // 接待成功の11コマ目に、ひょいと跳ねる
    const hop = f === 11 ? -2 : 0;
    drawKosukumaSmall(g, 44, 7 + hop);

    // ── 盤と石 ───────────────────────────────────────────
    board(g, STATES[ply]);

    // いま打った石に、白い光の輪
    if (!done && ply > 0) {
      const prev = STATES[ply - 2];
      const cur = STATES[ply];
      for (let i = 0; i < 64; i++)
        if (!prev[i] && cur[i]) {
          const [x, y] = at(i % 8, Math.floor(i / 8));
          g.px(x - 1, y - 1, WHITE);
          g.px(x + 3, y - 1, WHITE);
          g.px(x - 1, y + 2, WHITE);
          g.px(x + 3, y + 2, WHITE);
        }
    }

    // ── 接待成功（きらきら）─────────────────────────────
    if (f >= 10) {
      const pts =
        f === 10
          ? [
              [8, 17],
              [30, 21],
              [20, 33],
              [38, 14],
              [14, 26],
            ]
          : [
              [24, 15],
              [10, 31],
              [36, 30],
              [4, 22],
              [27, 26],
            ];
      pts.forEach(([x, y], i) => {
        const c = SPARK[i % SPARK.length];
        g.hline(x - 1, y, 3, c);
        g.vline(x, y - 1, 3, c);
        g.px(x, y, WHITE);
      });
    }

    // ── 題字 ─────────────────────────────────────────────
    title(g, 3, 3, "接待オセロ", WHITE);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, KUMA.fill, EDGE);
  },
};
