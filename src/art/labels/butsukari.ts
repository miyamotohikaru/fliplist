import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow, misakiWidth } from "../misaki";

// ぶつかりおじさん — あのおじさんになって、街中の人に肩をぶつける3Dアクション。
//
// 図の骨組み: 実物のプレイ画面そのまま。うしろから見たおじさんが
//   商店街のまん中を歩き、向こうから人がどんどん来る。
//   商店街は一点透視（両側に色とりどりの日よけ、奥で道が1点に集まる）。
//   上の帯は実物の黄色い表示帯（「変身37回目・無敵！」の帯）にならって黄色に墨の題字。
//
// 動くもの（1周3秒・12コマ）: 0コマ目（止まっているときの絵）は、
//   向こうから来た人におじさんが肩をぶつけた瞬間（ドカッ！）。
//   ぶつかった人は横へ吹っ飛んで消え、奥から次の人が歩いてきて、
//   また肩にぶつかる。まわりの通行人も手前へ流れてくる。

const BAND = "#f7d21e";
const BAND_D = "#d9b10c";
const INK = "#1d1b19";
const SKY = "#dfe8ee";
const ROAD = "#dcd7cc";
const ROAD_L = "#e8e4da";
const ROAD_D = "#c6c0b3";
const WALLS = [
  "#e9dcc4",
  "#c9d6d2",
  "#ead0c6",
  "#d8d2e4",
  "#e6e0b8",
  "#cfdcc2",
  "#e2cfb4",
];
const AWN = [
  "#d9342b",
  "#2f8a4c",
  "#2f5fae",
  "#e58a1f",
  "#c23a7a",
  "#2f8a8a",
  "#7a4ab0",
];
const GLASS = "#8a7a66";
const INSIDE = [
  "#f3dfae",
  "#e9c9a4",
  "#d9e6c8",
  "#f2d0c0",
  "#e4dcf0",
  "#f6e6b0",
  "#cfe2e6",
];
const SKIN = "#f4c49a";
const SKIN_D = "#d39a6c";
const HAIR = "#a8a6a2";
const HAIR_D = "#86837e";
const JACKET = "#4069b0";
const JACKET_L = "#5b85c8";
const JACKET_D = "#2c4c86";
const PANTS = "#4a4d55";
const WHITE = "#ffffff";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

function outlined(
  g: PixelGfx,
  x: number,
  y: number,
  text: string,
  c: string,
  edge: string,
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
    misakiRow(g, x + dx, y + dy, text, edge);
  misakiRow(g, x, y, text, c);
}

// 消失点と道のへり
const VX = 34;
const VY = 13;
const TOP = 11; // 黄色い帯の下
/** 道のへり（左右対称）。中心からの横の距離 d での高さ */
const edgeY = (d: number) => VY + (d * 27) / 44;
/** 日よけの上下（消失点を通る直線） */
const awnTop = (d: number) => VY + d * 0.2;
const awnBot = (d: number) => VY + d * 0.33;
// 店の区切り（中心からの距離）。手前ほど1軒が広い
const SHOPS = [2, 4, 7, 11, 16, 23, 34];

function street(g: PixelGfx) {
  g.rect(0, TOP, 68, 40 - TOP, SKY);
  for (let x = 0; x < 68; x++) {
    const side = x < VX ? -1 : 1;
    const d = Math.abs(x - VX + (side > 0 ? 0 : 0.5)) + 0.5;
    const shop = SHOPS.findIndex((s) => d <= s);
    const k = (shop < 0 ? SHOPS.length - 1 : shop) + (side > 0 ? 3 : 0);
    const wall = WALLS[k % WALLS.length];
    const awn = AWN[k % AWN.length];
    const isSeam = SHOPS.includes(Math.round(d - 0.5));
    for (let y = TOP; y < 40; y++) {
      const ye = edgeY(d);
      if (y >= ye) {
        g.px(x, y, ROAD);
        continue;
      }
      if (d < 1.5) continue; // 奥の空
      if (y < VY - d * 0.15) {
        // 店の上の壁（手前ほど高い）
        g.px(x, y, isSeam ? "#b9ad98" : wall);
      } else if (y < awnTop(d)) {
        g.px(x, y, isSeam ? "#b9ad98" : wall);
      } else if (y < awnBot(d)) {
        // 日よけはしま模様
        const stripe = Math.floor(d) % 2 === 0;
        g.px(x, y, stripe ? awn : WHITE);
      } else {
        // 店先（明るい店の中に棚の段）
        const shelf = Math.round((y - awnBot(d)) % 3) === 0;
        g.px(
          x,
          y,
          isSeam ? "#8a7e6a" : shelf ? GLASS : INSIDE[k % INSIDE.length],
        );
      }
    }
  }
  // 道のタイルの目地（消失点へ集まる線）
  for (const bx of [-30, -6, 14, 34, 54, 74, 98])
    g.line(VX, VY + 1, bx, 40, ROAD_D);
  for (const z of [0.25, 0.45, 0.7]) {
    const y = Math.round(VY + z * 27);
    const half = Math.round(z * 44);
    g.hline(VX - half, y, half * 2, ROAD_L);
  }
}

// 通行人（正面向き）。(x, 足元y) と高さ h
function walker(
  g: PixelGfx,
  x: number,
  foot: number,
  h: number,
  shirt: string,
  step: number,
) {
  if (h <= 3) {
    g.vline(x, foot - h, 1, SKIN);
    g.vline(x, foot - h + 1, h - 1, shirt);
    return;
  }
  const w = h >= 9 ? 3 : 2;
  const head = h >= 9 ? 2 : 1;
  const legs = Math.max(1, Math.round(h * 0.35));
  const body = h - head - legs;
  const x0 = x - Math.floor(w / 2);
  g.rect(x0 + (w === 3 ? 1 : 0), foot - h, w === 3 ? 1 : 1, head, SKIN);
  if (w === 3) g.rect(x0, foot - h, 3, 1, "#3a2a20");
  g.rect(x0, foot - h + head, w, body, shirt);
  // 足を交互に
  if (step % 2 === 0) {
    g.vline(x0, foot - legs, legs, PANTS);
    g.vline(x0 + w - 1, foot - legs + 1, legs - 1, PANTS);
  } else {
    g.vline(x0, foot - legs + 1, legs - 1, PANTS);
    g.vline(x0 + w - 1, foot - legs, legs, PANTS);
  }
}

// 吹っ飛ぶ人（横倒し）
function flying(g: PixelGfx, x: number, y: number, shirt: string) {
  const rows = [
    "p.....s...",
    ".pp.sss..",
    "..ssssss.kk",
    "..ssssss.kk",
    ".pp.sss..",
    "p.....s...",
  ];
  // 人ごみに埋もれないよう白でふちどる
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ])
    g.blit(x + dx, y + dy, rows, { p: WHITE, s: WHITE, k: WHITE });
  g.blit(x, y, rows, { p: PANTS, s: shirt, k: SKIN });
}

// うしろから見たおじさん
function ojisan(g: PixelGfx, lean: boolean) {
  const dx = lean ? 1 : 0;
  // 足
  g.rect(29 + dx, 38, 3, 2, PANTS);
  g.rect(36 + dx, 38, 3, 2, PANTS);
  // 上着（肩をはって歩く）
  g.poly(
    [
      [25 + dx, 39],
      [25 + dx, 33],
      [27 + dx, 31],
      [41 + dx, lean ? 30 : 31],
      [43 + dx, 33],
      [43 + dx, 39],
    ],
    JACKET,
  );
  g.hline(28 + dx, 31, 6, JACKET_L);
  g.vline(25 + dx, 33, 6, JACKET_L);
  g.vline(34 + dx, 33, 6, JACKET_D);
  g.vline(43 + dx, 33, 6, JACKET_D);
  g.hline(26 + dx, 38, 17, JACKET_D);
  // 襟足
  g.rect(32 + dx, 30, 5, 1, SKIN_D);
  // 頭（うしろ姿：てっぺんははげ、まわりに白髪）
  g.disc(34 + dx, 27, 3, HAIR);
  g.disc(34 + dx, 26, 2, SKIN);
  g.px(33 + dx, 24, "#ffe0c0");
  g.hline(32 + dx, 29, 5, HAIR_D);
  g.px(30 + dx, 27, SKIN_D);
  g.px(38 + dx, 27, SKIN_D);
}

// 通行人の流れ（奥→手前）。lane は手前での中心からのずれ
const CROWD: Array<{ lane: number; phase: number; shirt: string }> = [
  { lane: -30, phase: 0.1, shirt: "#e05a3a" },
  { lane: -14, phase: 0.55, shirt: "#3a9a5a" },
  { lane: 28, phase: 0.35, shirt: "#8a5ac8" },
  { lane: -22, phase: 0.8, shirt: "#e0b02a" },
  { lane: 40, phase: 0.75, shirt: "#2a8ab0" },
  { lane: -6, phase: 0.3, shirt: "#ffffff" },
  { lane: 22, phase: 0.6, shirt: "#3a3a3a" },
  { lane: -38, phase: 0.45, shirt: "#2a8ab0" },
  { lane: 4, phase: 0.05, shirt: "#e0b02a" },
  { lane: 34, phase: 0.95, shirt: "#e05a3a" },
  { lane: -26, phase: 0.25, shirt: "#8a5ac8" },
  { lane: -10, phase: 0.85, shirt: "#3a9a5a" },
];
// ぶつかる人の色
const VICTIM = "#e0407a";

export const art: LabelArt = {
  slug: "butsukari",
  swatch: [BAND, JACKET, AWN[0], AWN[1], ROAD],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;

    street(g);

    // まわりの通行人（遠い順に描く）
    const people = CROWD.map((p) => ({ ...p, z: (p.phase + f / 12) % 1 })).sort(
      (a, b) => a.z - b.z,
    );
    for (const p of people) {
      const z = 0.15 + p.z * 0.85;
      const foot = Math.round(VY + z * 27);
      const x = Math.round(VX + p.lane * z);
      walker(g, x, foot, Math.round(2 + z * 9), p.shirt, f);
    }

    // ぶつかる人。3コマ目から奥を出て、0コマ目で肩にぶつかる
    if (f >= 3) {
      const z = 0.12 + ((f - 3) / 9) * 0.76;
      const foot = Math.round(VY + z * 27);
      walker(
        g,
        Math.round(VX + 11 * z),
        foot,
        Math.round(2 + z * 11),
        VICTIM,
        f,
      );
    }

    ojisan(g, f === 0);

    // 吹っ飛ぶ
    if (f === 0) flying(g, 44, 26, VICTIM);
    if (f === 1) flying(g, 52, 21, VICTIM);
    if (f === 2) flying(g, 59, 16, VICTIM);

    // 当たった瞬間の火花
    if (f <= 1) {
      const cx = 43;
      const cy = 30;
      const r = f === 0 ? 1 : 2;
      for (const [dx, dy] of [
        [-2, -3],
        [2, -4],
        [5, -1],
        [-3, 1],
        [4, 3],
        [0, -5],
      ])
        g.px(cx + dx * r, cy + dy * r - (f === 0 ? 0 : 1), WHITE);
      outlined(g, 34, 14, "ドカッ！", WHITE, INK);
    }

    // ── 黄色い帯と題字 ───────────────────────────────────
    g.rect(0, 0, 68, TOP, BAND);
    g.hline(0, TOP - 1, 68, BAND_D);
    misakiRow(
      g,
      Math.round((68 - misakiWidth("ぶつかりおじさん")) / 2),
      2,
      "ぶつかりおじさん",
      INK,
    );

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, INK);
    mark(g, WHITE, INK);
  },
};
