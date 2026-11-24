import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";

// もようがえシミュレーター — 棚から家具を選んで部屋に置き、自分の部屋を作る。
// 「できた」を押すと、こすくまくんが点数とひとことで出来ばえを言う。
// 友達に部屋を送って遊びに行ける。床を押すと梅干しが降ってきて、こすくまくんにあげられる。
//
// 図の骨組み（2026-11-24 描き直し。ユーザー「同じイラストすぎる」「URLの中にあるこすくまを使って」
// 「フォントも同じすぎるので変えて」）:
//   実物（OGの絵）どおり、斜め上から見た箱の部屋。黄色いしまの壁、木の床、淡い玉ぼけの地。
//   **こすくまくんは公式の3Dデータ**（~/Desktop/こすくま/デザイン/3Dこすくまくん/3Dデータ/kosukuma_base model.blend）を
//   ゲームと同じく少し上（20度）から、輪郭線（Freestyle）つきで描き出し、面積平均で高さ18ドットに縮めたもの。
//   手で描き直さない（2026-11-24 ユーザー「3Dのこすくまくん いい感じ」「もう少し小さくて、部屋にいる感じに」）。
//   部屋の右手前、ラグの上に立つ。
//   家具は実物の棚にあるもの: 緑のソファ、青いふとんのベッド、額の絵、しまのラグ、
//   ピンクの座ぶとん、鉢植え。
//   題字「もようがえ」は Mochiy Pop One（OFL）を焼いたもの。1字ずつ色を変える。
//   「シミュレーター」は、こすくまくんの足もとに入るよう、5ドット幅に詰めて手で起こした点の字。
//
// 動くもの（1周3秒・12コマ）:
//   0コマ目（止まっているときの絵）は家具がそろった部屋。
//   1コマ目で家具が消えて、空っぽの部屋にこすくまくんだけ。
//   2〜7コマ目で家具が1つずつ上から落ちてきて置かれる（ゲームの置き方）。
//   9〜10コマ目で梅干しが1つ降ってきて床に落ちる（ゲームの、床を押すと降る梅干し）。
//   11コマ目、梅干しは消えて、こすくまくんがひょいと跳ねる（食べるときだけ速い）。

const BG = "#f7f0d4";
const BG_LOW = "#e4efd2";
const BG_DOT = "#fcf8e8";
const WALL = "#f8ecd0";
const WALL_STRIPE = "#ecc46a";
const WALL_LOW = "#f3e6c8";
const WALL_CAP = "#fff8e6";
const WALL_EDGE = "#d8c09a";
const FLOOR = "#e9a258";
const FLOOR_L = "#f2b46c";
const FLOOR_D = "#cf8640";
const BASE = "#c77a36";
const BASE_D = "#a45f26";
const EDGE = "#5c3a22";
const WHITE = "#ffffff";

// 家具の色（実物の棚の色）
const SOFA = "#7fcfa6";
const SOFA_L = "#a4e2c0";
const SOFA_D = "#4fa57c";
const WOOD = "#c98a4a";
const WOOD_D = "#9a6230";
const BED = "#78b4e6";
const BED_L = "#a2cdf2";
const SHEET = "#fbf6ee";
const RUG_A = "#ffd84a";
const RUG_B = "#fbf3dc";
const CUSHION = "#f6a8a0";
const CUSHION_D = "#e07c76";
const LEAF = "#58b04c";
const LEAF_D = "#3a8a36";
const POT = "#d0703a";
const FRAME = "#c98a4a";
const PIC_SKY = "#a8d8f0";
const PIC_HILL = "#7cc46a";
const UME = "#d4304a";
const UME_L = "#f06a80";

// 題字の字ごとの色（も・よ・う・が・え）
const TITLE_COLORS = ["#ff8fb0", "#ffb347", "#7fd6a8", "#7fb8ff", "#c79bff"];

// 部屋の箱。奥の角 (CX, TOP)、壁の高さ H、床の半分の幅 W（傾き 1/2）
const CX = 30;
const TOP = 8;
const H = 12;
const W = 30;
const FY = TOP + H; // 奥の角の床の高さ

// ── こすくまくん（公式3Dデータの描き出しを 14x18 に縮めたもの）──
// # 輪郭 / L 光 / o 地 / d 影 / e 目と鼻
const KUMA3D = [
  ".###..##..###.",
  "#oLL##LL##LLL#",
  "#oLLLLLLLLLoL#",
  "#dooLLLLLLLoo#",
  ".#ooLLLLLLLo#.",
  ".#dooooLLLLo#.",
  ".#dooooooooo#.",
  ".#ddoooooooo#.",
  ".#ddoooooooo#.",
  ".#ddoeooeooo#.",
  ".#ddooeooood#.",
  "#d#dddddddd#o#",
  ".#dd######dd#.",
  "..#dooooooo#..",
  "..#dooooooo#..",
  "..#ddoooooo#..",
  "..##ddoood##..",
  "...########...",
];
const KX = 44;
const KY = 15;

const T_MOYOU = [
  "...##........................#............##....##.....##.......",
  "...##............##..........####.........##....###....###......",
  "...##............##..........#####........##...###......##......",
  "#########........######.......####.......#####..##....#######...",
  "#########........######.....########...########.###.#########...",
  "..##.............###......###########..####.####.##..##...###...",
  "..#######.......####......####.....##...###...##.........###....",
  "#########.....#######..............##...##....##........###.....",
  "######....##..#########...........###...##....##.......#####....",
  "..###....###.##...######.........###....##...###.....#######..#.",
  "...###..###..###.###..##........###....###...##.....####..######",
  "...#######....######..........####......#...###.....###...#####.",
  "....#####......####............##............#.............##...",
];
const T_SIM = [
  "##.....###........##..........##.......",
  ".#..#....##.......##.........#####.....",
  "....#.......####..##.........#..##.....",
  "##.##..###.....#..##..#.####.##.##.####",
  ".#.#.....##....#..##.##.####...##..####",
  "..##...........#..####........##.......",
  ".##...####..#####.###........##........",
  "##......###.#####.##.........#.........",
];

// ── 発行元の印 ──────────────────────────────────────────
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

/** 題字。こげ茶のふちを回して、列 cuts で区切った字ごとに色を変える */
function title(
  g: PixelGfx,
  x: number,
  y: number,
  rows: readonly string[],
  colors: readonly string[],
  cuts: readonly number[],
) {
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
    g.blit(x + dx, y + dy, rows, { "#": EDGE });
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      if (r[i] !== "#") continue;
      let k = 0;
      while (k < cuts.length && i >= cuts[k]) k++;
      g.px(x + i, y + j, colors[k]);
    }
  });
}

/** 壁と床 */
function room(g: PixelGfx) {
  const L = CX - W;
  const R = CX + W;
  const LY = FY + W / 2; // 左右の角の床の高さ
  // 床の厚み（手前の2辺）
  g.poly(
    [
      [L, LY],
      [CX, FY + W],
      [R, LY],
      [R, LY + 2],
      [CX, FY + W + 2],
      [L, LY + 2],
    ],
    BASE,
  );
  g.line(L, LY + 2, CX, FY + W + 2, BASE_D);
  g.line(CX, FY + W + 2, R, LY + 2, BASE_D);
  // 床
  g.poly(
    [
      [CX, FY],
      [R, LY],
      [CX, FY + W],
      [L, LY],
    ],
    FLOOR,
  );
  // 板目（左の壁と平行な目地と、ところどころ明るい板）
  for (let y = FY + 1; y < FY + W; y++) {
    for (let x = L; x <= R; x++) {
      const u = x - CX + 2 * (y - FY);
      const v = CX - x + 2 * (y - FY);
      if (u < 0 || v < 0 || u > 2 * W || v > 2 * W) continue;
      if (u % 6 === 0) g.px(x, y, FLOOR_D);
      else if (u % 6 === 3 && v % 16 < 5) g.px(x, y, FLOOR_L);
    }
  }
  // 左右の壁
  g.poly(
    [
      [L, LY - H],
      [CX, TOP],
      [CX, FY],
      [L, LY],
    ],
    WALL,
  );
  g.poly(
    [
      [CX, TOP],
      [R, LY - H],
      [R, LY],
      [CX, FY],
    ],
    WALL,
  );
  // しま模様と腰板
  for (let x = L; x <= R; x++) {
    const top = TOP + Math.abs(x - CX) / 2;
    const bot = top + H;
    for (let y = Math.ceil(top) + 1; y < bot; y++) {
      if (y >= bot - 3) {
        if (x % 3 === 0) g.px(x, y, WALL_EDGE);
        else g.px(x, y, WALL_LOW);
      } else if (((x - CX) % 4 + 4) % 4 < 2) g.px(x, y, WALL_STRIPE);
    }
  }
  // 壁の上の縁と、角の線
  g.line(L, LY - H, CX, TOP, WALL_CAP);
  g.line(CX, TOP, R, LY - H, WALL_CAP);
  g.vline(CX, TOP + 1, H, WALL_EDGE);
  g.vline(L, LY - H, H + 1, WALL_EDGE);
  g.vline(R, LY - H, H + 1, WALL_EDGE);
}

// ── 家具。dy は落ちてくる途中の持ち上がり ─────────────────
type Piece = (g: PixelGfx, dy: number) => void;

/** 左の壁の額の絵（空と丘） */
const picture: Piece = (g, dy) => {
  const x = 6;
  const y = 24 + dy;
  // 壁に沿って右上がりの平行四辺形（6x5）
  for (let i = 0; i < 6; i++) {
    const yy = y - Math.floor(i / 2);
    g.vline(x + i, yy, 5, FRAME);
    if (i > 0 && i < 5) {
      g.vline(x + i, yy + 1, 2, PIC_SKY);
      g.px(x + i, yy + 3, PIC_HILL);
    }
  }
};

/** 黄色とクリームのしまのラグ（こすくまくんの足もと、右手前） */
const rug: Piece = (g, dy) => {
  const cx = 51;
  const cy = 32 + dy;
  for (let y = -3; y <= 3; y++) {
    const half = (3 - Math.abs(y)) * 2 + 2;
    for (let x = -half; x <= half; x++) {
      const band = Math.floor((x + 2 * y + 40) / 3) % 2;
      g.px(cx + x, cy + y, band ? RUG_A : RUG_B);
    }
  }
};

/** 緑のソファ（左の壁ぞい） */
const sofa: Piece = (g, dy) => {
  g.blit(10, 19 + dy, [
    "..dd.......",
    ".dllddd....",
    "dlllllldd..",
    "dlbbblllldd",
    "dbbbbbbblld",
    "dbbbbbbbbbd",
    ".ddbbbbbbbd",
    "..wddbbbddw",
    "..w..dd...w",
  ], { d: SOFA_D, l: SOFA_L, b: SOFA, w: WOOD_D });
};

/** 青いふとんのベッド（右の壁ぞい） */
const bed: Piece = (g, dy) => {
  g.blit(30, 17 + dy, [
    "ww.........",
    "wwss.......",
    "wsssbb.....",
    "w.sbbbbb...",
    "w.bbbbbbbb.",
    "wwlbbbbbbbb",
    "..wllbbbbbw",
    "....wwllbbw",
    "......wwww.",
  ], { w: WOOD, s: SHEET, b: BED, l: BED_L });
};

/** ピンクの座ぶとん（ソファの前） */
const cushion: Piece = (g, dy) => {
  g.blit(22, 25 + dy, [
    "..ccc..",
    "ccccccc",
    "cccDccc",
    ".ddddd.",
  ], { c: CUSHION, D: CUSHION_D, d: CUSHION_D });
};

/** 鉢植え（右の壁ぎわ） */
const plant: Piece = (g, dy) => {
  g.blit(58, 22 + dy, [
    ".l..l.",
    "lLl.Ll",
    ".lLLl.",
    "..lL..",
    ".pppp.",
    ".pPpp.",
    "..pp..",
  ], { l: LEAF, L: LEAF_D, p: POT, P: "#e89058" });
};

// 落ちてくる順（壁から床へ、奥から手前へ。描く順もこのまま）
const PIECES: Piece[] = [picture, bed, sofa, rug, cushion, plant];
// 落ちてくるときの、床の着地点（影を置く）
const LAND = [
  [8, 28],
  [36, 26],
  [15, 28],
  [51, 32],
  [25, 28],
  [61, 29],
];

export const art: LabelArt = {
  slug: "moyougae",
  swatch: [WALL_STRIPE, FLOOR, SOFA, BED, TITLE_COLORS[0]],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    // 置いてある家具の数と、いま落ちてくる家具（2〜7コマ目）
    const placed = f === 1 ? 0 : f >= 2 && f <= 7 ? f - 2 : PIECES.length;
    const falling = f >= 2 && f <= 7 ? f - 2 : -1;

    // ── 地（生成りから若草色へ。淡い玉ぼけ）─────────────
    g.rect(0, 0, 68, 40, BG);
    g.rect(0, 20, 68, 20, BG_LOW, "half");
    for (const [x, y, r] of [
      [3, 3, 4],
      [64, 9, 5],
      [6, 30, 3],
    ])
      g.disc(x, y, r, BG_DOT);

    // ── 部屋 ─────────────────────────────────────────────
    room(g);

    // ── 家具（こすくまくんより奥の物）────────────────────
    for (let i = 0; i < PIECES.length; i++) {
      if (i < placed) PIECES[i](g, 0);
      else if (i === falling) {
        g.hline(LAND[i][0] - 2, LAND[i][1], 5, FLOOR_D, "half");
        PIECES[i](g, -4);
      }
    }

    // ── こすくまくん（部屋の右手前）──────────────────────────
    // 11コマ目は梅干しを食べて、ひょいと跳ねる（食べるときだけ速い）
    const hop = f === 11 ? -2 : 0;
    // 姿は公式3Dデータを縮めたもの。ここでは置くだけ（目も口も足さない）
    g.ellipse(KX + 7, KY + 18, 6, 1, "#00000030");
    g.blit(KX, KY + hop, KUMA3D, {
      "#": "#3c342c",
      L: "#fffbe4",
      o: "#f4ecc4",
      d: "#decd96",
      e: "#141008",
    });

    // ── 梅干し。床を押すと降ってくる ─────────────────────
    if (f === 9) g.disc(40, 18, 1, UME);
    if (f === 10) {
      g.disc(41, 29, 1, UME);
      g.px(40, 28, UME_L);
    }

    // ── 題字 ─────────────────────────────────────────────
    // も・よ・う・が・え の切れ目（列）
    title(g, 2, 1, T_MOYOU, TITLE_COLORS, [12, 25, 38, 51]);
    title(g, 2, 31, T_SIM, [WHITE], []);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, "#f4ecc4", EDGE);
  },
};
