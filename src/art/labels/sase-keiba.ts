import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// 差せ！競馬と音ゲー — 曲に合わせて「輪」をタップするとムチが入る。
// 最後方から追い込んで、1着をねらう。1レース30秒。
//
// 図の骨組み（2026-11-24 描き直し。ユーザー「こすくまいなくていいので馬を画面いっぱいに」
// 「競馬の感じ」、見本はゲームのレース中の画面）:
//   ゲームの画面どおり、自分の馬のすぐ後ろから前を見る。最後方なので、前は馬だらけ。
//   手前に自分の馬の後ろ姿（赤と白のしまの勝負服）を大きく。前を走る馬たちは、
//   遠くほど小さく、刈り目のしまの芝の上に散らばる。右は白い内ラチが奥へ曲がっていき、
//   その外にダートのコース。奥は低い木の並木と、白い柱のモノレール（紫から水色の帯）。
//   題字「差せ！」は Zen Kaku Gothic New Bold（OFL）を焼いたもの（2026-11-24 ユーザー「フォント太すぎる」で
//   Dela Gothic One から替えた）。白に黒の1重のふちと右下の影、「！」は実物のロゴどおり黄色。
//   「競馬と音ゲー」は空に小さく。
//
// 動くもの（1周3秒・12コマ）:
//   芝のしまが手前へ流れて、走っている速さを出す。馬はみんな2コマで駆ける（脚と上下のゆれ）。
//   前の馬たちは少しずつ手前へ下がってくる（追い込んで、差を詰めていく）。
//   自分の騎手のまわりの輪は、3コマかけて縮み、ぴったり重なったコマ（3・6・9）で
//   黄色い星がはじけてムチが入る（ゲームの「輪でタップ＝ムチ」）。

const SKY = "#bfe3f7";
const SKY_L = "#dff1fb";
const HILL = "#b9dcb4";
const RAIL_TOP = "#f4f6f8";
const RAIL_BAND = ["#8a5cd8", "#c065d8", "#5f8ae0", "#58c8f0"];
const TOWER = "#f2f5f8";
const TOWER_B = "#7fb6e8";
const TREE = "#b6e39a";
const TREE_D = "#94cc7a";
const TRUNK = "#7a5634";
const TURF = "#6cc455";
const TURF_L = "#82d468";
const RAIL = "#ffffff";
const RAIL_D = "#c9d2d8";
const DIRT = "#d6aa72";
const DIRT_D = "#c4945c";
const EDGE = "#141414";
const WHITE = "#ffffff";
const BANG = "#ffd83a";
const STAR = "#fff27a";

const COAT = "#a8582a"; // 栗毛
const COAT_L = "#c4703a";
const COAT_D = "#7a3c18";
const TAIL = "#5a2a10";
const SOCK = "#ffffff";

// ── 馬の後ろ姿（騎手つき）。大きさは4段。2つめは脚を入れかえたコマ ─────
// c 帽子 / s 勝負服 / t 勝負服の2色め / b 毛 / l 明るい毛 / k 濃い毛 / d 尾 / w 白い靴下
const BACK_S = [
  [".c.", "sss", "bdb", "b.b", "w.w"],
  [".c.", "sss", "bdb", "bb.", "w.w"],
];
const BACK_M = [
  ["..c..", ".sts.", "lbbbk", "lbdbk", ".bdb.", ".b.b.", ".w.w."],
  ["..c..", ".sts.", "lbbbk", "lbdbk", ".bdb.", ".bb..", ".w..w"],
];
const BACK_L = [
  [
    "...c...",
    "..ccc..",
    "..sts..",
    ".sstss.",
    ".lbbbk.",
    "llbbbkk",
    "lbbdbbk",
    ".bbdbb.",
    "..bdb..",
    "..b.b..",
    "..b.b..",
    "..w.w..",
  ],
  [
    "...c...",
    "..ccc..",
    "..sts..",
    ".sstss.",
    ".lbbbk.",
    "llbbbkk",
    "lbbdbbk",
    ".bbdbb.",
    "..bdb..",
    "..bb.b.",
    "..b..b.",
    "..w...w",
  ],
];
// 自分の馬（手前、いちばん大きい）。赤と白のしまの帽子と勝負服
const BACK_XL = [
  [
    "......ccc......",
    ".....ctctc.....",
    ".....ctctc.....",
    "......ccc......",
    "....sstttss....",
    "...ssstttsss...",
    "...sstttttss...",
    "....sstttss....",
    "...lllbbbbkk...",
    "..llbbbbbbbkk..",
    ".llbbbbbbbbbkk.",
    ".lbbbbbdbbbbbk.",
    ".lbbbbbdbbbbbk.",
    "..bbbbbdbbbbb..",
    "..lbbbbdbbbbk..",
    "...bbbbdbbbb...",
    "....bbbdbbb....",
    "....bb.d.bb....",
    "....bb.d.bb....",
    "....bb...bb....",
    "....ww...bb....",
    "....ww...ww....",
  ],
  [
    "......ccc......",
    ".....ctctc.....",
    ".....ctctc.....",
    "......ccc......",
    "....sstttss....",
    "...ssstttsss...",
    "...sstttttss...",
    "....sstttss....",
    "...lllbbbbkk...",
    "..llbbbbbbbkk..",
    ".llbbbbbbbbbkk.",
    ".lbbbbbdbbbbbk.",
    ".lbbbbbdbbbbbk.",
    "..bbbbbdbbbbb..",
    "..lbbbbdbbbbk..",
    "...bbbbdbbbb...",
    "....bbbdbbb....",
    "....bb.d.bb....",
    "....bb.d.bb....",
    "....bb...bb....",
    "....bb...ww....",
    "....ww...ww....",
  ],
];

type Silk = { cap: string; s: string; t: string };
const SILKS: Silk[] = [
  { cap: "#2a3a8a", s: "#2a3a8a", t: "#2a3a8a" },
  { cap: "#e85aa0", s: "#e85aa0", t: "#ffffff" },
  { cap: "#3a8ae0", s: "#3a8ae0", t: "#ffffff" },
  { cap: "#2e8a4a", s: "#2e8a4a", t: "#1c1c1c" },
  { cap: "#f0d23a", s: "#1c1c1c", t: "#f0d23a" },
  { cap: "#8a4ed0", s: "#8a4ed0", t: "#c8a8f0" },
  { cap: "#f08a2a", s: "#f08a2a", t: "#2a3a8a" },
  { cap: "#a82a3a", s: "#a82a3a", t: "#ffffff" },
];
const MY_SILK: Silk = { cap: "#e8403a", s: "#ffffff", t: "#e8403a" };

function back(g: PixelGfx, rows: readonly string[], x: number, y: number, silk: Silk) {
  g.blit(x, y, rows, {
    c: silk.cap,
    s: silk.s,
    t: silk.t,
    b: COAT,
    l: COAT_L,
    k: COAT_D,
    d: TAIL,
    w: SOCK,
  });
}

// 前を走る馬。[中心x, 足もとy, 大きさ(0=S 1=M 2=L), 勝負服, 脚の位相]
const FIELD: Array<[number, number, 0 | 1 | 2, number, number]> = [
  [30, 15, 0, 5, 0],
  [37, 15, 0, 4, 1],
  [47, 16, 0, 7, 1],
  [21, 18, 1, 6, 0],
  [33, 19, 1, 3, 1],
  [43, 19, 1, 1, 0],
  [8, 23, 2, 0, 1],
  [18, 25, 2, 2, 0],
  [57, 22, 1, 7, 0],
];

// ── 発行元の印 ──────────────────────────────────────────
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 題字（Zen Kaku Gothic New Bold を焼いたもの）─────────
const T_SASE = [
  "....##....##.......................",
  "....###..###.................##....",
  ".###############.......##....##....",
  ".##############........##....##....",
  ".......##..............##....##....",
  "..############........#############",
  ".......##..........################",
  "################...###.##....##....",
  "################.......##....##....",
  "....##.................##..####....",
  "...###########.........##...##.....",
  "...############........##..........",
  "..###...###............##..........",
  ".###.....##............#########...",
  "################........########...",
  "#..#############...................",
];
const T_BANG = [
  "##",
  "##",
  "##",
  "##",
  "##",
  "##",
  "##",
  "##",
  "##",
  "##",
  "##",
  "##",
  "..",
  "##",
  "##",
  "..",
];

function bigTitle(g: PixelGfx, x: number, y: number, rows: readonly string[], c: string) {
  // 黒の1重のふちと、右下に1ドットの影
  for (let dy = -1; dy <= 2; dy++)
    for (let dx = -1; dx <= 2; dx++) {
      if ((dx === 2 || dy === 2) && (dx < 0 || dy < 0)) continue;
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

/** 内ラチの x（奥 y=12 で x=44、手前 y=31 で右はし x=67 へ曲がっていく） */
function railX(y: number) {
  const k = (y - 12) / 19;
  return 44 + 23 * Math.pow(k, 0.7);
}

export const art: LabelArt = {
  slug: "sase-keiba",
  swatch: [TURF, SKY, COAT, MY_SILK.cap, BANG],
  draw: (g, t) => {
    // ゆったり動かす（2026-11-25 ユーザー「最近のカセット動きが激しいので、もう少しゆったり」）。
    // 12コマのうち SEQ のコマだけを、1周3秒で順にゆっくり見せる（初めの方のカセットと同じくらいの間）。
    const SEQ = [0, 1, 2, 3];
    const f = SEQ[Math.floor(t * SEQ.length) % SEQ.length];

    // ── 空・モノレール・並木 ─────────────────────────────
    g.rect(0, 0, 68, 12, SKY);
    g.rect(0, 0, 68, 3, SKY_L);
    // 遠い丘
    for (let x = 0; x < 68; x++) {
      const h = 2 + Math.round(1.5 * Math.sin(x / 7) + Math.sin(x / 3.1));
      g.vline(x, 11 - h, h + 1, HILL);
    }
    // 白い塔（青い窓の帯）
    for (const tx of [12, 50, 63]) {
      g.rect(tx, 2, 4, 9, TOWER);
      g.hline(tx, 5, 4, TOWER_B);
      g.hline(tx, 8, 4, TOWER_B);
    }
    // モノレール: 白い柱と、紫から水色の帯
    for (const px of [4, 26, 40, 58]) g.vline(px, 4, 7, TOWER);
    g.hline(0, 3, 68, RAIL_TOP);
    for (let x = 0; x < 68; x++) g.px(x, 4, RAIL_BAND[Math.floor(x / 17) % 4]);
    // 並木（低い木）
    for (const [x, r] of [
      [3, 3],
      [10, 2],
      [17, 3],
      [24, 2],
      [31, 3],
      [38, 2],
      [53, 2],
      [60, 3],
    ]) {
      g.vline(x, 10, 3, TRUNK);
      g.disc(x, 9 - r + 1, r, TREE);
      g.px(x + 1, 10 - r + 1, TREE_D);
    }

    // ── 芝（刈り目のしまが手前へ流れる）──────────────────
    g.rect(0, 12, 68, 28, TURF);
    for (let k = -1; k < 12; k++) {
      // 奥ほど細い帯。f で手前へずれていく
      // しまは流さない（ゆったり）
      const p0 = k / 10;
      const p1 = (k + 0.5) / 10;
      const y0 = 12 + Math.round(28 * Math.pow(Math.max(0, p0), 1.6));
      const y1 = 12 + Math.round(28 * Math.pow(Math.max(0, p1), 1.6));
      if (y1 > y0) g.rect(0, y0, 68, Math.min(40, y1) - y0, TURF_L);
    }

    // ── 内ラチと外のダート ───────────────────────────────
    for (let y = 12; y < 40; y++) {
      const x = Math.round(railX(y));
      if (x < 68) {
        g.hline(x + 1, y, 68 - x, y < 20 ? DIRT : DIRT_D);
        g.px(x, y, RAIL);
        g.px(x, y + 1, RAIL_D);
      }
    }
    for (let y = 13; y < 32; y += 4) {
      const yy = y;
      const x = Math.round(railX(yy));
      g.vline(x, yy, 2, RAIL);
    }

    // ── 前を走る馬たち（奥から順に）──────────────────────
    // 追い込んで差を詰めるので、少しずつ手前へ下がってくる
    const near = 0;
    for (const [cx, fy, size, silk, ph] of [...FIELD].sort((a, b) => a[1] - b[1])) {
      const stride = (f + ph) % 2;
      const yy = fy + near + (stride ? 0 : -1);
      const rows = [BACK_S, BACK_M, BACK_L][size][stride];
      back(g, rows, cx - Math.floor(rows[0].length / 2), yy - rows.length + 1, SILKS[silk]);
    }

    // ── 自分の馬（手前、まん中より右）────────────────────
    const stride = f % 2;
    const mx = 46;
    const my = 18 + (stride ? 0 : 1);
    // 輪（3コマで縮み、3・6・9コマ目でぴったり＝ムチ）
    const phase = f === 0 ? 3 : ((f - 1) % 3) + 1;
    const rx = mx + 7;
    const ry = my + 5;
    if (phase < 3) g.ring(rx, ry, phase === 1 ? 10 : 7, WHITE);
    back(g, BACK_XL[stride], mx, my, MY_SILK);
    if (phase === 3) {
      // ムチ（騎手の右手から、斜めに）
      g.line(mx + 12, my + 5, mx + 16, my + 12, "#3a2a1a");
      // ぴったり！ 黄色い星
      const sx = mx + 17;
      const sy = my + 2;
      g.hline(sx - 2, sy, 5, STAR);
      g.vline(sx, sy - 2, 5, STAR);
      g.px(sx, sy, WHITE);
    }

    // ── 題字 ─────────────────────────────────────────────
    small(g, 3, 1, "競馬と音ゲー");
    bigTitle(g, 3, 22, T_SASE, WHITE);
    bigTitle(g, 3 + T_SASE[0].length + 1, 22, T_BANG, BANG);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, WHITE, EDGE);
  },
};
