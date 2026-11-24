import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// わたあめシミュレーター — 本物のわたあめ機で、好きな色のザラメから綿を巻き、
// 竹串で縁を押して花びらにする。色を足すたびに花の輪が外へ増えていく。
//
// 図の骨組み: 実物の見せ場（OGの絵）どおり、串に刺さった花の形のわたあめ。
//   まん中から外へ、黄・緑・桃・青・黄・緑の花びらの輪、いちばん外は桃色のふち。
//   左にはゲームの画面下と同じ、ザラメの色の山（白・赤・橙・黄・緑・青・紫）。
//   地はゲームの机と同じ生成り色。
//   題字は「わたあめ」が桃色、「シミュレーター」が白。どちらもこげ茶でふちどる。
//
// 動くもの（1周3秒・12コマ）: 0コマ目（止まっているときの絵）は仕上がった花。
//   1コマ目で串だけになり、2コマ目に綿が出はじめる（糸のような綿が舞う）。
//   3〜10コマ目はザラメを1杯ずつ入れ（色の山が1つ持ち上がる）、3〜8コマ目で
//   内側から花びらの輪が1つずつ増える。11コマ目は仕上がりにアラザンがきらり。

const BG = "#e6d3b6";
const BG_L = "#efe1c9";
const TABLE = "#a87a4e";
const TABLE_L = "#bd8f60";
const TABLE_D = "#8a6038";
const STICK = "#e8d3a2";
const STICK_D = "#bfa274";
const EDGE = "#5a3624";
const WHITE = "#ffffff";
const TITLE_PINK = "#ff9ec4";

// 花びらの色（淡い色＋影）
const P = {
  pink: ["#f6b3c8", "#e18aa6"],
  green: ["#b8e6b0", "#8ccb86"],
  yellow: ["#f8e79a", "#e2c862"],
  white: ["#ffffff", "#dcdce6"],
  blue: ["#a9d4f2", "#7fb2dc"],
  purple: ["#c8b2ec", "#a08ad2"],
} as const;
type Hue = keyof typeof P;

// ザラメの山の色（ゲーム画面の下の7色）
const SUGAR = [
  ["#f4f4f0", "#c9c9c2"],
  ["#e8323a", "#a81e24"],
  ["#f2862a", "#c0601a"],
  ["#f6d62a", "#c9a812"],
  ["#36b04a", "#22803a"],
  ["#2f78d8", "#1f54a8"],
  ["#8a4ed0", "#62329e"],
];

// 花の中心と輪（内側から）。R=輪の外の半径, n=花びら（ふちの山）の数
const CX = 51;
const CY = 16;
const RINGS: Array<{ R: number; n: number; hue: Hue }> = [
  { R: 2.6, n: 1, hue: "yellow" },
  { R: 4.9, n: 7, hue: "green" },
  { R: 7.1, n: 9, hue: "pink" },
  { R: 9.2, n: 11, hue: "blue" },
  { R: 11.2, n: 13, hue: "yellow" },
  { R: 13.1, n: 14, hue: "green" },
];
const RIM = 14.8; // いちばん外の桃色のふち

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
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

/**
 * 花びらの輪を1つ描く。外の輪から順に描き、内側の輪で上を覆うと、
 * 縁がぎざぎざ（花びら）の色の帯が重なって見える。spin で少し回す（巻いている途中）
 */
function ring(g: PixelGfx, k: number, spin: number) {
  const { R, n, hue } = RINGS[k];
  const [c, d] = P[hue];
  if (k === 0) {
    g.disc(CX, CY, R + 0.6, d);
    g.disc(CX, CY, R, c);
    return;
  }
  const pr = (R - RINGS[k - 1].R) * 0.95; // 花びらの大きさ＝帯の幅
  const rc = R - pr; // 花びらの中心の半径
  // 先に影の色で少し大きく描き、上から本来の色。縁にだけ影の線が残る
  for (const [col, grow] of [
    [d, 0.7],
    [c, 0],
  ] as const) {
    g.disc(CX, CY, rc + grow, col);
    for (let i = 0; i < n; i++) {
      const a = ((i + (k % 2) * 0.5) / n) * Math.PI * 2 + spin;
      g.disc(
        Math.round(CX + Math.cos(a) * rc),
        Math.round(CY + Math.sin(a) * rc),
        pr + grow,
        col,
      );
    }
  }
}

/** 花のわたあめ。rings は描く輪の数（内側から） */
function flower(g: PixelGfx, rings: number, full: boolean, spin: number) {
  if (full) {
    g.disc(CX, CY, RIM + 0.6, P.pink[1]);
    g.disc(CX, CY, RIM, P.pink[0]);
  } else if (rings > 0) {
    // 巻いている途中は、外側に白い綿のもや
    const rr = RINGS[Math.min(rings, RINGS.length) - 1].R + 2;
    g.disc(CX, CY, rr, "#fbf3f6", "half");
  }
  for (let k = Math.min(rings, RINGS.length) - 1; k >= 0; k--) ring(g, k, spin);
}

/** 舞う綿の糸 */
function floss(g: PixelGfx, f: number) {
  const c = "#fbeef4";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + f * 0.7;
    const r0 = 4;
    const r1 = 9 + (i % 2) * 3;
    g.line(
      Math.round(CX + Math.cos(a) * r0),
      Math.round(CY + Math.sin(a) * r0),
      Math.round(CX + Math.cos(a + 0.5) * r1),
      Math.round(CY + Math.sin(a + 0.5) * r1),
      c,
    );
  }
}

/** ザラメの色の山（7つ）。lift の番号の山だけ持ち上がる */
function sugarCones(g: PixelGfx, lift: number) {
  for (let i = 0; i < 7; i++) {
    const x = 2 + i * 4;
    const y = 21 - (i === lift ? 2 : 0);
    const [c, d] = SUGAR[i];
    // 台の小皿
    g.hline(x, 27, 4, WHITE);
    g.hline(x, 28, 4, "#d9cdb8");
    // 山（4x5の三角）
    g.blit(x, y, ["..#.", ".##o", ".#oo", "##oo", "#ooo", "#ooo"], {
      "#": c,
      o: d,
    });
    // ザラメのきらり
    g.px(x + 1, y + 3, WHITE);
  }
}

export const art: LabelArt = {
  slug: "wataame",
  swatch: [BG, P.pink[0], P.green[0], P.yellow[0], P.blue[0]],
  draw: (g, t) => {
    // ゆったり動かす（2026-11-25 ユーザー「最近のカセット動きが激しいので、もう少しゆったり」）。
    // 12コマのうち SEQ のコマだけを、1周3秒で順にゆっくり見せる（初めの方のカセットと同じくらいの間）。
    const SEQ = [0, 11, 0, 11];
    const f = SEQ[Math.floor(t * SEQ.length) % SEQ.length];
    // 0・11コマ目＝仕上がり。1コマ目＝串だけ。2コマ目＝綿が出はじめ。3〜10＝輪が増える
    const full = f === 0 || f === 11;
    const rings = full ? RINGS.length : f <= 1 ? 0 : f === 2 ? 1 : f - 2;
    const lift = f >= 3 && f <= 10 ? (f - 3) % 7 : -1;

    // ── 地（机）───────────────────────────────────────────
    g.rect(0, 0, 68, 40, BG);
    g.rect(0, 0, 68, 12, BG_L, "quarter");
    g.rect(0, 32, 68, 8, TABLE);
    g.hline(0, 32, 68, TABLE_L);
    g.hline(0, 35, 68, TABLE_D, "half");
    g.hline(0, 38, 68, TABLE_D, "quarter");

    // ── 串と花 ───────────────────────────────────────────
    g.rect(CX - 1, CY + 6, 2, 40 - CY - 6, STICK);
    g.vline(CX, CY + 6, 40 - CY - 6, STICK_D);
    flower(g, rings, full, full ? 0 : f * 0.35);
    if (f === 2 || (f >= 3 && f <= 10 && f % 2 === 1)) floss(g, f);

    // 仕上がりにアラザン（銀の粒）
    if (f === 11) {
      for (const [x, y] of [
        [42, 8],
        [58, 10],
        [46, 24],
        [60, 21],
        [51, 4],
      ]) {
        g.px(x, y, WHITE);
        g.px(x - 1, y, "#d8dde6");
        g.px(x + 1, y, "#d8dde6");
        g.px(x, y - 1, "#d8dde6");
        g.px(x, y + 1, "#d8dde6");
      }
    }

    // ── ザラメの山 ───────────────────────────────────────
    sugarCones(g, lift);

    // ── 題字 ─────────────────────────────────────────────
    title(g, 4, 5, "わたあめ", TITLE_PINK);
    title(g, 3, 31, "シミュレーター", WHITE);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, WHITE, EDGE);
  },
};
