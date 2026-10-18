import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { JP_SIZE, JP_TH, ascent, jpRow } from "../jptitle";

// おえかきパンケーキシミュレーター — 実物は「Pancake Canvas」。
// 温めたフライパンに生地で絵を描き、線が色づいてから生地を流し、
// ひっくり返すと、描いた絵が焼き色になって表に出てくる。
//
// 図の骨組み: 上の帯が木の調理台で、題字「パンケーキ」を13pxで1行。
//   その下に黒いコンロの天板、真ん中にフライパン（真上から）。
//   右から木の柄、左上から白いソースボトルの口。
// 動くもの: 前半はひっくり返したあと＝きつね色の面に、こすくまくんの顔が焼き色で出る。
//   後半は焼く前＝白い生地の上に「描いた線」だけが色づいている。
//   この裏返りが企画の芯なので、止め絵（t=0）で焼き上がりが見える順にしてある。

const WOOD = "#f1e2c6";
const WOOD_G = "#e3cfa9";
const INK = "#4a2f1e";
const INK_SH = "#d9c19a";

const TOP = "#2a2829";
const TOP_HI = "#4a4748";
const TOP_DK = "#151415";
const PAN_RIM = "#8e8a86";
const PAN = "#1b1a1b";
const PAN_IN = "#262425";

const BATTER = "#f4e4b8";
const BATTER_D = "#e2c98c";
const LINE_RAW = "#c99a52";
const GOLD = "#e0a050";
const GOLD_D = "#c47e34";
const GOLD_L = "#f0c27a";
const BURN = "#7a4520";

const HANDLE = "#b0703e";
const HANDLE_D = "#7c4a26";
const BOTTLE = "#f6f2ea";
const BOTTLE_D = "#cfc8bb";
const NOZZLE = "#e8a25a";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// こすくまくんの顔。パンケーキの上に描く線画（11x9）。
const FACE = [
  ".##.....##.",
  "#..#####..#",
  "#.........#",
  "#..#...#..#",
  "#.........#",
  "#....#....#",
  ".#..#.#..#.",
  "..#.....#..",
  "...#####...",
];

const T = "パンケーキ";
const CX = 28;
const CY = 28;

export const art: LabelArt = {
  slug: "pancake",
  swatch: [WOOD, GOLD, BURN, TOP, NOZZLE],
  draw: (g, t) => {
    // ── 調理台 ───────────────────────────────────────────
    g.rect(0, 0, 68, 40, WOOD);
    // 木目は題字にかからない、天板のすぐ上の1行だけ。
    g.hline(2, 15, 18, WOOD_G);
    g.hline(44, 15, 20, WOOD_G);

    // ── 題字 ─────────────────────────────────────────────
    // 5文字 x 13px = 65px。ラベルの内側66pxに1行で入る最大。
    const asc = ascent(T, JP_SIZE, JP_TH);
    jpRow(g, 2, T, INK, { size: JP_SIZE, ascent: asc, shadow: INK_SH });

    // ── コンロの天板 ─────────────────────────────────────
    // 実物と同じく、奥がすぼまった台形。上辺 y=16。
    g.poly(
      [
        [6, 16],
        [61, 16],
        [65, 39],
        [2, 39],
      ],
      TOP,
    );
    g.hline(6, 16, 56, TOP_HI);
    g.ditherV(3, 33, 62, 6, TOP, TOP_HI);

    // 五徳のつめ。パンの外に4本だけ見える。
    g.line(CX - 14, CY - 6, CX - 11, CY - 4, TOP_DK);
    g.line(CX + 14, CY - 6, CX + 11, CY - 4, TOP_DK);
    g.line(CX - 9, 38, CX - 7, CY + 8, TOP_DK);
    g.line(CX + 9, 38, CX + 7, CY + 8, TOP_DK);

    // ── フライパン ───────────────────────────────────────
    // 右へ伸びる木の柄。発行元の印（x>=60, y>=32）にはかからない。
    g.rect(CX + 11, CY - 1, 4, 3, "#3a3839");
    g.rect(CX + 15, CY - 2, 15, 4, HANDLE);
    g.hline(CX + 15, CY - 2, 15, "#c98a56");
    g.hline(CX + 15, CY + 1, 15, HANDLE_D);
    g.px(CX + 28, CY, HANDLE_D);

    g.ellipse(CX, CY, 12, 11, PAN_RIM);
    g.ellipse(CX, CY, 11, 10, PAN);
    g.ellipse(CX, CY, 10, 9, PAN_IN);

    // ── パンケーキ ───────────────────────────────────────
    const flipped = t < 0.5;
    if (!flipped) {
      // 焼く前: 白っぽい生地の上に、先に描いた線だけが色づいている。
      g.ellipse(CX, CY, 8, 7, BATTER_D);
      g.ellipse(CX, CY - 1, 8, 6, BATTER);
      g.blit(CX - 5, CY - 5, FACE, { "#": LINE_RAW });
      // 泡。焼けてくると表面にぷつぷつ出る
      for (const [x, y] of [
        [CX - 6, CY + 2],
        [CX + 5, CY - 3],
        [CX + 6, CY + 3],
        [CX - 3, CY + 5],
      ] as Array<[number, number]>) {
        g.px(x, y, "#fffbe8");
      }
    } else {
      // 裏返したあと: きつね色の面に、描いた絵が焦げ色で出てくる。
      g.ellipse(CX, CY, 8, 7, GOLD_D);
      g.ellipse(CX, CY - 1, 8, 6, GOLD);
      g.ellipse(CX - 2, CY - 3, 4, 2, GOLD_L);
      g.blit(CX - 5, CY - 5, FACE, { "#": BURN });
    }

    // ── ソースボトル ─────────────────────────────────────
    // 左上から斜めに差し込む白い筒。口は橙。
    g.line(6, 17, 13, 22, BOTTLE_D);
    g.line(5, 16, 13, 21, BOTTLE);
    g.line(5, 15, 12, 20, BOTTLE);
    g.line(6, 15, 12, 19, BOTTLE);
    g.rect(13, 21, 2, 2, NOZZLE);
    g.px(15, 23, "#fff2e2");

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。焼き色に合わせる。
    g.frame(0, 0, 68, 40, GOLD_D);
    mark(g, GOLD_L, TOP_DK);
  },
};
