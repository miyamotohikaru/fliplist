import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow, misakiWidth } from "../misaki";

// お花屋さんシミュレーター — 好きな花を一本ずつ整えて、
// オリジナルの花束を作って贈る。
//
// 図の骨組み: 実物の完成画面の花束そのまま。クラフト紙で包んだ花束を正面から、
//   画面の上から下まで大きく。赤いバラ・白い花・ピンクのバラ・黄色い花に
//   ユーカリの枝がのぞき、結び目に赤いリボン。
//   題字は包み紙の下の方に重ねる（白い字を焦げ茶でふちどる）。
//
// 動くもの（1周3秒・12コマ）: 0コマ目（止まっているときの絵）は完成してきらきら。
//   1コマ目で包み紙とユーカリだけになり、そこから1コマに1本ずつ、
//   花が上からすとんと差しこまれていく。最後にリボンが結ばれて、きらっと光る。

const BG = "#f3ece0";
const BG_D = "#e8dfd0";
const KRAFT = "#c48c55";
const KRAFT_L = "#d9a86e";
const KRAFT_D = "#9c6a3a";
const INSIDE = "#efe1c4";
const INSIDE_D = "#dcc8a2";
const RIBBON = "#b8202c";
const RIBBON_L = "#e04650";
const RIBBON_D = "#7e1420";
const EUCA = "#9db8a8";
const EUCA_D = "#6f8f7e";
const STEM = "#7d8f70";
const LEAF = "#3f7a3e";
const BROWN = "#4a2a14";
const WHITE = "#ffffff";
const SPARK = "#fff3a0";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

function title(g: PixelGfx, x: number, y: number, text: string) {
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
    misakiRow(g, x + dx, y + dy, text, BROWN);
  misakiRow(g, x, y, text, WHITE);
}

// ── 花 ───────────────────────────────────────────────────
type Kind = "rose" | "pink" | "white" | "yellow" | "purple";
const ROSE = [".aaaa.", "abAAba", "aAbbAa", "aAbAba", "abAAaa", ".aaaa."];
const PETAL = [".ww.w.", "wwwwww", "wwccww", "wwccww", "wwwwww", ".w.ww."];
const PAL: Record<Kind, { rows: string[]; pal: Record<string, string> }> = {
  rose: { rows: ROSE, pal: { a: "#d8283a", b: "#f0505e", A: "#8e1424" } },
  pink: { rows: ROSE, pal: { a: "#f27aa0", b: "#ffb0c8", A: "#c84a76" } },
  white: { rows: PETAL, pal: { w: "#ffffff", c: "#d8e4a0" } },
  yellow: { rows: PETAL, pal: { w: "#f6cf3a", c: "#c07a1a" } },
  purple: { rows: PETAL, pal: { w: "#a88ad8", c: "#f4eefc" } },
};
// 花の場所 (x, y)＝左上と種類。差しこむ順に並べてある（2本ずつ）
const FLOWERS: Array<[number, number, Kind]> = [
  [30, 6, "rose"],
  [37, 10, "white"],
  [23, 10, "rose"],
  [44, 6, "pink"],
  [16, 6, "white"],
  [30, 13, "yellow"],
  [37, 3, "rose"],
  [23, 3, "pink"],
  [44, 13, "rose"],
  [16, 13, "purple"],
  [51, 10, "white"],
  [9, 10, "rose"],
  [30, 0, "white"],
  [37, 16, "rose"],
  [23, 16, "white"],
  [51, 3, "yellow"],
];
// 描く順（奥＝上から）
const DRAW_ORDER = FLOWERS.map((_, i) => i).sort(
  (a, b) => FLOWERS[a][1] - FLOWERS[b][1] || FLOWERS[a][0] - FLOWERS[b][0],
);

function flower(g: PixelGfx, x: number, y: number, k: Kind) {
  // 茎と葉
  g.vline(x + 2, y + 6, 3, STEM);
  g.px(x + 4, y + 6, LEAF);
  g.px(x, y + 5, LEAF);
  const p = PAL[k];
  g.blit(x, y, p.rows, p.pal);
}

// ユーカリの枝（丸い葉が互い違いに並ぶ）
function euca(g: PixelGfx, x0: number, y0: number, x1: number, y1: number) {
  g.line(x0, y0, x1, y1, EUCA_D);
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 1; i <= n; i += 2) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n);
    const y = Math.round(y0 + ((y1 - y0) * i) / n);
    g.px(x + ((i >> 1) % 2 ? 1 : -1), y - 1, EUCA);
    g.px(x, y - 1, EUCA);
  }
}

function sparkle(g: PixelGfx, x: number, y: number, big: boolean) {
  g.px(x, y, WHITE);
  g.px(x - 1, y, SPARK);
  g.px(x + 1, y, SPARK);
  g.px(x, y - 1, SPARK);
  g.px(x, y + 1, SPARK);
  if (big) {
    g.px(x - 2, y, SPARK);
    g.px(x + 2, y, SPARK);
    g.px(x, y - 2, SPARK);
    g.px(x, y + 2, SPARK);
  }
}

export const art: LabelArt = {
  slug: "bouquet",
  swatch: [KRAFT, "#d8283a", "#f27aa0", EUCA, RIBBON],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    // 何本差しこんだか。0コマ目は完成
    const n =
      f === 0
        ? FLOWERS.length
        : f === 1
          ? 0
          : Math.min(FLOWERS.length, (f - 1) * 2);
    const tied = f === 0 || f >= 11;

    // ── お店の壁 ─────────────────────────────────────────
    g.rect(0, 0, 68, 40, BG);
    for (let x = 4; x < 68; x += 8) g.vline(x, 0, 40, BG_D);

    // ── 包み紙のうしろ（内側の白っぽい面が花の後ろにひらく） ──
    g.poly(
      [
        [7, 15],
        [10, 6],
        [17, 3],
        [24, 5],
        [34, 0],
        [44, 5],
        [51, 3],
        [58, 6],
        [61, 15],
        [40, 24],
        [28, 24],
      ],
      INSIDE,
    );
    g.line(10, 6, 7, 15, INSIDE_D);
    g.line(58, 6, 61, 15, INSIDE_D);
    g.line(24, 5, 22, 13, INSIDE_D);
    g.line(44, 5, 46, 13, INSIDE_D);

    // ── ユーカリ（いつも挿してある） ─────────────────────
    euca(g, 22, 18, 9, 4);
    euca(g, 46, 18, 59, 4);
    euca(g, 30, 16, 26, 1);

    // ── 花 ───────────────────────────────────────────────
    // 葉の土台（花のすきまを埋める緑）
    g.ellipse(34, 13, 22, 7, LEAF);
    g.ellipse(34, 14, 18, 5, "#2f6a34");
    for (let i = 0; i < 24; i++)
      g.px(14 + ((i * 17) % 41), 8 + ((i * 7) % 11), "#5f9a52");
    for (const i of DRAW_ORDER) {
      if (i >= n) continue;
      const [x, y, k] = FLOWERS[i];
      // いま差しこんだ2本は上から落ちてくる途中
      const drop = i >= n - 2 && f >= 2 && f <= 10 ? -3 : 0;
      flower(g, x, y + drop, k);
    }

    // ── 包み紙の手前 ─────────────────────────────────────
    g.poly(
      [
        [9, 15],
        [22, 19],
        [34, 17],
        [46, 19],
        [59, 15],
        [41, 25],
        [37, 39],
        [31, 39],
        [27, 25],
      ],
      KRAFT,
    );
    g.line(9, 15, 22, 19, KRAFT_L);
    g.line(22, 19, 34, 17, KRAFT_L);
    g.line(34, 17, 46, 19, KRAFT_L);
    g.line(46, 19, 59, 15, KRAFT_L);
    // 紙のひだ
    g.line(22, 19, 30, 26, KRAFT_D);
    g.line(46, 19, 38, 26, KRAFT_D);
    g.line(34, 18, 34, 38, KRAFT_D);
    g.line(28, 26, 32, 38, KRAFT_L);

    // ── リボン ───────────────────────────────────────────
    if (tied) {
      g.rect(29, 23, 11, 2, RIBBON);
      g.blit(
        25,
        20,
        [
          "aa.......aa",
          "abaa...aaba",
          "abbaaKaabba",
          "aaaaKKKaaaa",
          ".aa.aKa.aa.",
          "....a.a....",
          "...a...a...",
        ],
        {
          a: RIBBON,
          b: RIBBON_L,
          K: RIBBON_D,
        },
      );
    } else {
      g.rect(29, 23, 11, 2, KRAFT_D);
    }

    // ── 題字 ─────────────────────────────────────────────
    title(
      g,
      Math.round((68 - misakiWidth("お花屋さん")) / 2),
      26,
      "お花屋さん",
    );
    title(g, 5, 32, "シミュレーター");

    // ── きらきら（完成したとき） ─────────────────────────
    if (f === 0) {
      sparkle(g, 13, 9, true);
      sparkle(g, 54, 12, false);
      sparkle(g, 37, 2, false);
    } else if (f === 11) {
      sparkle(g, 13, 9, false);
      sparkle(g, 54, 12, true);
      sparkle(g, 48, 22, false);
    }

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, BROWN);
    mark(g, WHITE, BROWN);
  },
};
