import type { LabelArt } from "./types";
import { shade, type PixelGfx } from "../gfx";
import { JP_TH, ascent, jpRow } from "../jptitle";

// 日陰ナビ ── 実物は夏の徒歩ナビ。ビルの影を計算して、
// 「日陰の多い道」と「最短の道」をくらべて出してくる。
//
// だから絵も**真上から見た街**にする。西日が右上から差していて、
// ビルが左下へ長い影を落としている。その影を拾ってうねる緑の道が日陰ルート、
// 日なたをまっすぐ突っ切る橙の破線が最短ルート。
// 2本が同じ出発点から同じ目的地へ向かっているのが、この企画の要点。
//
// 実物の色をそのまま借りる。地はアイボリー、緑は #084c3a。

const GROUND = "#eee4c8";
const GROUND_D = "#e2d6b4";
const STREET = "#f8f3e4";
const BLOCK = "#8aa88c"; // 地図の街区（実物の淡い緑）
const BLOCK_T = "#a2bda2"; // 屋上の当たり
const DEEP = "#084c3a"; // 実物の主色
const SHADOW = "#7e9a90"; // 影。地より暗く、青みのある灰緑
const SHADOW_D = "#6b8880";
const SUN = "#f5c542";
const SUN_E = "#e0a020";
const HOT = "#c8761c"; // 最短ルート（日なた）
const IVORY = "#f6efd8";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];

// 目的地のピン。丸で描くと輪や団子に見えたので、5x6 を手で彫った。
// **中を1px抜かないこと。** この大きさだと抜いた1pxが穴に見えて、
// ピンではなくドーナツになる。べた塗りの頭＋下へ尖る尾で読ませる。
const PIN = [".###.", "#####", "#####", "#####", ".###.", "..#.."];

// ── 和文の題字 ──────────────────────────────────────────
// 「日陰ナビ」4文字。13px で 52px、判の幅68pxの中に収まる。
// **12px には落とせない** ——「陰」の中の横画が繋がって黒い塊になる。
// 地図の上にじかに置くので、8方向にアイボリーのふちを回してから濃緑で塗る。
// 実物の題字も、地図の上に濃緑＋淡いふちで乗っている。
const T_SIZE = 13;
function title(g: PixelGfx, y: number, s: string) {
  const o = { size: T_SIZE, threshold: JP_TH, ascent: ascent(s, T_SIZE, JP_TH) };
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const prev = g.pushOrigin(dx, dy);
    jpRow(g, y, s, IVORY, o);
    g.popOrigin(prev);
  }
  jpRow(g, y, s, DEEP, o);
}

/** 街区（真上から見たビル）。x,y は左上、w,h は大きさ */
type Block = { x: number; y: number; w: number; h: number };
const BLOCKS: Block[] = [
  { x: 9, y: 19, w: 9, h: 6 },
  { x: 26, y: 17, w: 8, h: 6 },
  { x: 43, y: 21, w: 10, h: 7 },
  { x: 19, y: 28, w: 7, h: 5 },
  { x: 36, y: 32, w: 9, h: 5 },
];

// 影の向き。太陽が右上にあるので、影は左下へ伸びる。
const SH_X = -7;
const SH_Y = 4;

export const art: LabelArt = {
  slug: "hiyakeitai",
  swatch: [GROUND, DEEP, BLOCK, SHADOW, HOT],
  draw: (g, t) => {
    // ── 地 ──────────────────────────────────────────────
    g.rect(0, 0, 68, 40, GROUND);
    g.noise(0, 0, 68, 40, GROUND_D, 0.04, 71);

    // ── 道路。真上から見た碁盤の目 ─────────────────────────
    for (const y of [17, 27, 37]) g.hline(0, y, 68, STREET);
    for (const x of [9, 20, 34, 50, 62]) g.vline(x, 15, 25, STREET);

    // ── ビルの影 ───────────────────────────────────────
    // 建物の四角を影の向きへ少しずつずらして重ね、掃いた一枚の形にする。
    // 上辺と下辺から別々に平行四辺形を出すと、段が付いて2つの塊に見えた。
    const STEPS = 10;
    for (const b of BLOCKS) {
      for (let k = STEPS; k >= 1; k--) {
        const u = k / STEPS;
        g.rect(
          Math.round(b.x + SH_X * u),
          Math.round(b.y + SH_Y * u),
          b.w,
          b.h,
          k > STEPS / 2 ? SHADOW : SHADOW_D,
        );
      }
    }

    // ── ビル本体 ───────────────────────────────────────
    for (const b of BLOCKS) {
      g.rect(b.x, b.y, b.w, b.h, BLOCK);
      // 右上から日が当たるので、上と右の1pxが明るい
      g.hline(b.x, b.y, b.w, BLOCK_T);
      g.vline(b.x + b.w - 1, b.y, b.h, BLOCK_T);
      g.frame(b.x, b.y, b.w, b.h, shade(BLOCK, -0.35));
    }

    // ── 太陽。題字の右上のあき。影の向きの根拠をここに置く ──────
    // 地図の中に置くと目的地のピンとぶつかったので、題字の脇へ出した。
    const sx = 63;
    const sy = 6;
    g.disc(sx, sy, 3, SUN_E);
    g.disc(sx, sy, 2, SUN);
    for (const [dx, dy] of [
      [-5, 0],
      [0, 5],
      [-4, 4],
      [-4, -4],
      [0, -5],
    ] as const)
      g.px(sx + dx, sy + dy, SUN_E);

    // ── 最短の道。日なたをまっすぐ突っ切る橙の破線 ──────────────
    // 実物が「日陰の多い道と最短の道をくらべて案内します」なので、
    // 2本を必ず対で見せる。こちらは負けるほうの道。
    const A: [number, number] = [16, 32];
    const B: [number, number] = [58, 20];
    // 1マスだと街区の緑に紛れるので、2マスひと組の破線にする。
    // 3x3を地色で抜く手も、1pxの濃い影を添える手も試したが、
    // 前者は判のまんなかに白い帯ができ、後者は茶色い点が散って汚れて見えた。
    for (let i = 0; i <= 34; i++) {
      if (i % 3 === 2) continue; // 破線
      const u = i / 34;
      const px = Math.round(A[0] + (B[0] - A[0]) * u);
      const py = Math.round(A[1] + (B[1] - A[1]) * u);
      g.px(px, py, HOT);
      g.px(px + 1, py, HOT);
    }

    // ── 日陰の道。影から影へ、うねって伸びる濃緑の道 ─────────────
    // 影から影へ渡っていく。まっすぐな最短ルートから離れるほど、
    // 「遠回りしてでも日陰を選ぶ」という企画の要点が出る。
    const PATH: Array<[number, number]> = [
      [16, 32],
      [13, 28],
      [18, 25],
      [25, 24],
      [30, 28],
      [37, 31],
      [44, 30],
      [51, 25],
      [58, 20],
    ];
    // 影の上を通るので、まわりを地色で抜いてから濃緑を引く。
    for (const [off, col] of [
      [1, IVORY],
      [0, DEEP],
    ] as const)
      for (let i = 0; i < PATH.length - 1; i++)
        g.line(PATH[i][0], PATH[i][1] + off, PATH[i + 1][0], PATH[i + 1][1] + off, col);

    // ── 出発点と目的地 ──────────────────────────────────
    g.disc(A[0], A[1], 2, IVORY);
    g.disc(A[0], A[1], 1, DEEP);
    // 目的地のピン。地図の柄に紛れないよう、8方向に地色のふちを回してから置く。
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const)
      g.blit(B[0] - 2 + dx, B[1] - 5 + dy, PIN, { "#": IVORY });
    g.blit(B[0] - 2, B[1] - 5, PIN, { "#": DEEP });

    // ── 「いま歩いているところ」。影の中を進む点 ────────────────
    // t で道の上を往復する。ウルトラ日陰モードで誘導される様子。
    const u = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    const fi = u * (PATH.length - 1);
    const i0 = Math.min(PATH.length - 2, Math.floor(fi));
    const f = fi - i0;
    const wx = Math.round(PATH[i0][0] + (PATH[i0 + 1][0] - PATH[i0][0]) * f);
    const wy = Math.round(PATH[i0][1] + (PATH[i0 + 1][1] - PATH[i0][1]) * f);
    g.disc(wx, wy, 2, IVORY);
    g.disc(wx, wy, 1, HOT);

    // ── 題字 ────────────────────────────────────────────
    // 地図の上にじかに。上の15行は街区を置かずに空けてある。
    title(g, 2, "日陰ナビ");

    // ── 欧文。従。左下のあき ──────────────────────────────
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const)
      g.text3x5(2 + dx, 34 + dy, "SHADE", IVORY);
    g.text3x5(2, 34, "SHADE", DEEP);

    // ── 枠 ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, "#1a3a2e");
    g.blit(61, 33, MARK, { "#": DEEP, o: IVORY });
  },
};
