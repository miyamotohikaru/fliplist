import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";
import { drawKosukumaSmall, KUMA } from "../kosukuma";

// 差せ！競馬と音ゲー — 曲に合わせて「輪」をタップするとムチが入る。
// 最後方から追い込んで、1着をねらう。1レース30秒。
//
// 図の骨組み: 競馬場を真横から見たレースの場面（ほかのラベルと構図をかぶらせない）。
//   上は青空とスタンドの観客、白い内ラチ、緑の芝。下の段を馬が駆ける。
//   左の手前に、こすくまくん。**姿は公式の絵（kosukuma.ts の小さい版）そのまま**で、
//   実物（OGの絵）の騎手の帽子だけをかぶせる（黄色に赤いすじ、てっぺんに赤い玉）。
//   体と顔は描き直さない（2026-11-24 ユーザー「少し違うキャラクターになっている」）。
//   題字「差せ！」は Dela Gothic One（OFL）を焼いたもの。白に黒の太いふち、「！」は実物のロゴどおり黄色。
//   「競馬と音ゲー」は題字の上に小さく。
//
// 動くもの（1周3秒・12コマ）:
//   芝のしまと内ラチの柱が左へ流れて、走っている速さを出す。馬の脚は2コマで駆ける。
//   黄色い帽子の騎手の栗毛が、1コマ目の最後方から追い込んで、先頭の葦毛に並び、
//   11コマ目で前に出る（差した）。0コマ目（止まっているときの絵）は差し切ったところ。
//   栗毛のまわりの輪は、3コマかけて縮み、ぴったり重なったコマ（3・6・9）で
//   黄色い星がはじけてムチが入る（ゲームの「輪でタップ＝ムチ」）。

const SKY = "#a6d8f6";
const SKY_L = "#c9e9fb";
const ROOF = "#34407a";
const STAND = "#4e5c9e";
const CROWD = ["#ffd23f", "#ff7a7a", "#ffffff", "#7fd6ff", "#ff9ed2", "#b0f07a"];
const RAIL = "#ffffff";
const RAIL_D = "#c9d2d8";
const TURF = "#4fb446";
const TURF_L = "#62c454";
const TURF_D = "#3f9a3a";
const EDGE = "#141414";
const WHITE = "#ffffff";
const BANG = "#ffd83a";
const STAR = "#fff27a";

// 馬（右向き、16x10）。b 毛 / d たてがみ・尾・ひづめ / l 明るい毛
const HORSE_A = [
  "............bb..",
  "...........bbbb.",
  "..........dbbbbb",
  "d..lllbbbbbb..b.",
  "ddbbbbbbbbbbb...",
  "d.bbbbbbbbbb....",
  "...bbbbbbbbb....",
  "..bb......bb....",
  ".bb........bb...",
  "dd..........dd..",
];
const HORSE_B = [
  "............bb..",
  "...........bbbb.",
  "..........dbbbbb",
  "...lllbbbbbb..b.",
  "ddbbbbbbbbbbb...",
  "ddbbbbbbbbbb....",
  "d..bbbbbbbbb....",
  "....bb..bbb.....",
  "....b.bb..b.....",
  "...dd.dd..dd....",
];

/** 馬と騎手。x, y は馬の左上。silk は勝負服、cap は帽子の色 */
function horse(
  g: PixelGfx,
  x: number,
  y: number,
  stride: boolean,
  coat: [string, string, string],
) {
  const [b, d, l] = coat;
  g.blit(x, y, stride ? HORSE_A : HORSE_B, { b, d, l });
}

function jockey(g: PixelGfx, x: number, y: number, silk: string, cap: string) {
  // 前かがみの騎手（6x5）。馬の背（x+4..9, y+3）にのる
  g.blit(x + 5, y - 2, ["...cc.", "..ccc.", "sssss.", ".ssss.", "..s..."], {
    c: cap,
    s: silk,
  });
}

/** 公式のこすくまくん（小さい版）にかぶせる騎手の帽子。耳は隠さない */
const CAP = [
  "......r......",
  ".....#r#.....",
  "...##yRy##...",
  "..#yyyRyyy#..",
  ".#yyyyRyyyy#.",
  ".#yyyyRyyyy#.",
  "..#########..",
];
function kumaJockey(g: PixelGfx, x: number, y: number) {
  drawKosukumaSmall(g, x, y);
  g.blit(x + 4, y - 4, CAP, { "#": EDGE, y: "#ffd23f", R: "#e8403a", r: "#e8403a" });
}

// ── 発行元の印 ──────────────────────────────────────────
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 題字（Dela Gothic One を焼いたもの）──────────────────
const T_SASE = [
  "....####.####..................###...",
  "#################.....####.....####..",
  "#################.....###############",
  "......#####.........#################",
  "#################...#################",
  "#################...########...####..",
  "#################.....####.....####..",
  "#################.....####..#######..",
  "...####...............####..#######..",
  "...#############......####..######...",
  ".###############......####...........",
  "######..#####.........##############.",
  "#################.....##############.",
  "###.#############......############..",
  ".#..#############.......###########..",
];
const T_BANG = [
  "####",
  "####",
  "####",
  "####",
  "####",
  "####",
  "####",
  "####",
  "####",
  "####",
  "....",
  "....",
  "####",
  "####",
  "####",
];

function bigTitle(g: PixelGfx, x: number, y: number, rows: readonly string[], c: string) {
  // 黒のふちを2重（実物のロゴの太いふち）
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > 3) continue;
      g.blit(x + dx, y + dy, rows, { "#": EDGE });
    }
  g.blit(x, y, rows, { "#": c });
}

function small(g: PixelGfx, x: number, y: number, text: string) {
  for (const [dx, dy] of [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ])
    misakiRow(g, x + dx, y + dy, text, EDGE);
  misakiRow(g, x, y, text, WHITE);
}

// 黄色い帽子の栗毛の左のはし（コマごと）。0コマ目は差し切ったところ
const CX = [47, 21, 23, 25, 28, 31, 34, 37, 40, 42, 44, 47];
// 先頭の葦毛
const LEAD_X = 44;
// 馬の段（左上の y）
const LANE = 27;

export const art: LabelArt = {
  slug: "sase-keiba",
  swatch: [TURF, SKY, "#ffd23f", "#c46a2c", BANG],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    const run = f; // 流れる量

    // ── 空とスタンド ─────────────────────────────────────
    g.rect(0, 0, 68, 6, SKY);
    g.rect(0, 0, 68, 2, SKY_L);
    g.rect(0, 4, 68, 6, STAND);
    g.hline(0, 4, 68, ROOF);
    for (let x = 1; x < 68; x += 2)
      for (let y = 6; y < 10; y += 2) {
        const k = (x * 7 + y * 13) % 11;
        if (k < CROWD.length) g.px(x + ((y / 2) % 2), y, CROWD[k]);
      }

    // ── 芝（刈り目のしまが左へ流れる）────────────────────
    g.rect(0, 10, 68, 30, TURF);
    for (let x = -8; x < 68; x += 8) {
      const xx = x - ((run * 3) % 8);
      g.rect(xx, 11, 4, 29, TURF_L);
    }
    g.hline(0, 11, 68, TURF_D);
    // 内ラチ（柱が左へ流れる）
    g.hline(0, 10, 68, RAIL);
    for (let x = 0; x < 72; x += 6) {
      const xx = x - ((run * 4) % 6);
      g.vline(xx, 10, 3, RAIL);
      g.px(xx, 13, RAIL_D);
    }

    // ── 先頭の葦毛 ───────────────────────────────────────
    const bob = f % 2;
    horse(g, LEAD_X, LANE + bob, f % 2 === 0, ["#9a9aa6", "#5a5a66", "#c4c4cc"]);
    jockey(g, LEAD_X, LANE + bob, "#3d7fd8", "#ffffff");

    // ── 追い込む栗毛（黄色い帽子）─────────────────────────
    const cx0 = CX[f];
    const cy0 = LANE + 2 + ((f + 1) % 2); // 手前の列
    // 輪（3コマで縮み、3・6・9コマ目でぴったり＝ムチ）
    const phase = f === 0 ? 3 : ((f - 1) % 3) + 1; // 1,2,3
    const rx = cx0 + 9;
    const ry = cy0 + 3;
    if (phase < 3) g.ring(rx, ry, phase === 1 ? 8 : 6, WHITE);
    const hit = phase === 3;
    if (hit) for (const dy of [1, 4, 7]) g.hline(cx0 - 7, cy0 + dy, 5, WHITE, "half");
    horse(g, cx0, cy0, f % 2 === 1, ["#c46a2c", "#6e3410", "#e08a48"]);
    jockey(g, cx0, cy0, "#e8403a", "#ffd23f");
    if (hit) {
      // ぴったり！ 黄色い星
      const sx = rx + 6;
      const sy = cy0 - 3;
      g.hline(sx - 2, sy, 5, STAR);
      g.vline(sx, sy - 2, 5, STAR);
      g.px(sx, sy, WHITE);
    }

    // ── こすくまくん（左の手前。騎手の帽子をかぶって応援）──
    // 姿は kosukuma.ts が正解。ここでは置くだけ。ムチが入ったコマで、ひょいと跳ねる
    kumaJockey(g, 1, 13 - (hit && f !== 0 ? 1 : 0));

    // ── 題字 ─────────────────────────────────────────────
    // 「競馬と音ゲー」はスタンドの屋根の紺の帯に（観客の色に字が溶けないように）
    g.rect(18, 0, 50, 10, ROOF);
    small(g, 20, 1, "競馬と音ゲー");
    bigTitle(g, 23, 11, T_SASE, WHITE);
    bigTitle(g, 23 + T_SASE[0].length + 2, 11, T_BANG, BANG);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, KUMA.fill, EDGE);
  },
};
