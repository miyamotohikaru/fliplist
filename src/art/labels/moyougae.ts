import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";
import { drawKosukumaSmall, KUMA } from "../kosukuma";

// もようがえシミュレーター — 棚から家具を選んで部屋に置き、自分の部屋を作る。
// 「できた」を押すと、こすくまくんが点数と一言で出来ばえを言う。
// 友達に部屋を送って遊びに行ける。床を押すと梅干しが降ってきて、こすくまくんにあげられる。
//
// 図の骨組み: 実物（OGの絵）どおり、斜め上から見た箱の部屋。
//   黄色いしま模様の壁が2面、木の床。地は生成りに淡い玉ぼけ。
//   **こすくまくんを入れる**（2026-11-24 ユーザー依頼）。実物でも部屋のまん中に立っている。
//   題字（左上の「もようがえ」）と重ならないよう、くまは部屋の右手前に立たせる。
//   姿は kosukuma.ts が正解。置くだけで、目も口も足さない。
//   家具は実物の棚にあるもの: 緑のソファ、青いふとんのベッド、額の絵、
//   黄色とクリームのしまのラグ、ピンクの座ぶとん、鉢植え。
//
// 動くもの（1周3秒・12コマ）:
//   0コマ目（止まっているときの絵）は家具がそろった部屋。
//   1コマ目で家具が消えて、空っぽの部屋にこすくまくんだけ。
//   2〜7コマ目で家具が1つずつ上から落ちてきて置かれる（ゲームの置き方）。
//   8コマ目は「できた」のきらきら。
//   9〜10コマ目で梅干しが1つ降ってきて床に落ちる（ゲームの、床を押すと降る梅干し）。
//   11コマ目、梅干しは消えて、こすくまくんがひょいと跳ねる（食べるときだけ速い）。

const BG = "#f6eed6";
const BG_DOT = "#fbf6e8";
const BG_LOW = "#e6eed6";
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
const TITLE_Y = "#ffd84a";

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

// 部屋の箱。奥の角 (CX, TOP)、壁の高さ H、床の半分の幅 W（傾き 1/2）
const CX = 36;
const TOP = 2;
const H = 12;
const W = 30;
const FY = TOP + H; // 奥の角の床の高さ
// 床のひし形: 奥 (CX,FY) / 左 (CX-W, FY+W/2) / 右 (CX+W, FY+W/2) / 手前 (CX, FY+W)

// くまの立つ位置（部屋の右手前）
const KX = 46;
const KY = 4;

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
  ])
    misakiRow(g, x + dx, y + dy, text, EDGE);
  misakiRow(g, x, y, text, c);
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
      const u = x - CX + 2 * (y - FY); // 左の壁ぞいの座標
      const v = CX - x + 2 * (y - FY); // 右の壁ぞいの座標
      if (u < 0 || v < 0 || u > 2 * W || v > 2 * W) continue;
      if (u % 6 === 0) g.px(x, y, FLOOR_D);
      else if (u % 6 === 3 && v % 16 < 5) g.px(x, y, FLOOR_L);
    }
  }
  // 左の壁
  g.poly(
    [
      [L, LY - H],
      [CX, TOP],
      [CX, FY],
      [L, LY],
    ],
    WALL,
  );
  // 右の壁
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
  // 壁の上の縁と、奥の角の線
  g.line(L, LY - H, CX, TOP, WALL_CAP);
  g.line(CX, TOP, R, LY - H, WALL_CAP);
  g.line(L, LY - H + 1, CX, TOP + 1, WALL_EDGE);
  g.line(CX, TOP + 1, R, LY - H + 1, WALL_EDGE);
  g.vline(CX, TOP + 1, H, WALL_EDGE);
  g.vline(L, LY - H, H + 1, WALL_EDGE);
  g.vline(R, LY - H, H + 1, WALL_EDGE);
}

// ── 家具。dy は落ちてくる途中の持ち上がり ─────────────────
type Piece = (g: PixelGfx, dy: number) => void;

/** 左の壁の額の絵（空と丘） */
const picture: Piece = (g, dy) => {
  const x = 18;
  const y = 16 + dy;
  // 壁に沿って右上がりの平行四辺形（6x5）
  for (let i = 0; i < 6; i++) {
    const yy = y - Math.floor(i / 2);
    g.vline(x + i, yy, 5, FRAME);
    if (i > 0 && i < 5) {
      g.vline(x + i, yy + 1, 2, PIC_SKY);
      g.px(x + i, yy + 3, PIC_HILL);
    }
  }
  g.px(x + 3, y - 1 + 1, "#fff2a0"); // お日さま
};

/** 黄色とクリームのしまのラグ（床のまん中） */
const rug: Piece = (g, dy) => {
  const cx = 32;
  const cy = 25 + dy;
  for (let y = -4; y <= 4; y++) {
    const half = (4 - Math.abs(y)) * 2 + 1;
    for (let x = -half; x <= half; x++) {
      const band = Math.floor((x + 2 * y + 40) / 3) % 2;
      g.px(cx + x, cy + y, band ? RUG_A : RUG_B);
    }
  }
};

/** 緑のソファ（左の壁ぞい） */
const sofa: Piece = (g, dy) => {
  g.blit(13, 19 + dy, [
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

/** 青いふとんのベッド（奥の角のそば、右の壁ぞい） */
const bed: Piece = (g, dy) => {
  g.blit(34, 12 + dy, [
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

/** ピンクの座ぶとん（ラグの上） */
const cushion: Piece = (g, dy) => {
  g.blit(26, 23 + dy, [
    "..ccc..",
    "ccccccc",
    "cccDccc",
    ".ddddd.",
  ], { c: CUSHION, D: CUSHION_D, d: CUSHION_D });
};

/** 鉢植え（左手前） */
const plant: Piece = (g, dy) => {
  g.blit(5, 22 + dy, [
    ".l..l.",
    "lLl.Ll",
    ".lLLl.",
    "..lL..",
    ".pppp.",
    ".pPpp.",
    "..pp..",
  ], { l: LEAF, L: LEAF_D, p: POT, P: "#e89058" });
};

// 落ちてくる順（奥から手前へ。手前の物が奥の物を隠すので、描く順もこのまま）
const PIECES: Piece[] = [picture, bed, rug, sofa, cushion, plant];

export const art: LabelArt = {
  slug: "moyougae",
  swatch: [WALL_STRIPE, FLOOR, SOFA, BED, KUMA.fill],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    // 置いてある家具の数と、いま落ちてくる家具
    const placed = f === 1 ? 0 : f >= 2 && f <= 7 ? f - 2 : PIECES.length;
    const falling = f >= 2 && f <= 7 ? f - 2 : -1;

    // ── 地（生成りに玉ぼけ。下は少し若草色）─────────────
    g.rect(0, 0, 68, 40, BG);
    g.rect(0, 28, 68, 12, BG_LOW, "half");
    for (const [x, y, r] of [
      [6, 20, 5],
      [62, 4, 4],
      [3, 36, 3],
      [22, 2, 3],
    ])
      g.disc(x, y, r, BG_DOT);

    // ── 部屋 ─────────────────────────────────────────────
    room(g);

    // ── 家具 ─────────────────────────────────────────────
    for (let i = 0; i < PIECES.length; i++) {
      if (i < placed) PIECES[i](g, 0);
      else if (i === falling) PIECES[i](g, -3);
    }
    // 落ちてくる家具の下に、着地の影
    if (falling >= 0) {
      const at = [
        [20, 21],
        [40, 20],
        [32, 25],
        [18, 27],
        [29, 26],
        [8, 29],
      ][falling];
      g.hline(at[0] - 2, at[1], 5, FLOOR_D, "half");
    }

    // ── こすくまくん ─────────────────────────────────────
    // 姿は kosukuma.ts が正解。ここでは置くだけ。
    // 11コマ目は梅干しを食べて、ひょいと跳ねる（食べるときだけ速い）
    const hop = f === 11 ? -2 : 0;
    g.ellipse(KX + 10, KY + 26, 8, 1, "#00000030");
    drawKosukumaSmall(g, KX, KY + hop);

    // ── 梅干し。床を押すと降ってくる ─────────────────────
    if (f === 9) g.disc(40, 12, 1.5, UME);
    if (f === 10) {
      g.disc(41, 27, 1.5, UME);
      g.px(40, 26, UME_L);
    }

    // ── できた（きらきら）───────────────────────────────
    if (f === 8) {
      for (const [x, y] of [
        [10, 17],
        [44, 15],
        [24, 25],
        [40, 23],
      ]) {
        g.hline(x - 2, y, 5, TITLE_Y);
        g.vline(x, y - 2, 5, TITLE_Y);
        g.px(x, y, WHITE);
      }
    }

    // ── 題字 ─────────────────────────────────────────────
    title(g, 3, 3, "もようがえ", TITLE_Y);
    title(g, 3, 31, "シミュレーター", WHITE);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, KUMA.fill, EDGE);
  },
};
