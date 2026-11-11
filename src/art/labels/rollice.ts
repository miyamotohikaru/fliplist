import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// なんでもロールアイスシミュレーター — 冷たい鉄板にベースを流して、
// へらで巻いて、好きなように盛りつける。
//
// 図の骨組み: 一面が冷たい鉄板（実物の画面どおり、ヘアラインの銀）。
//   題字は鉄板に直接刻むように3行（「なんでも」「ロールアイス」「シミュレーター」）。
//   まんなかの帯は鉄板を真横から見た断面で、薄く広げたいちごのベースがのっている。
//   右上には、巻き終えたロールを立てて盛ったカップ（実物の完成写真どおり、
//   白い紙カップにロールが並び、チョコの棒が1本ささっている）。
//
// 動くもの（1周3秒・12コマ）: へらが左から右へ進み、ベースをはがしながら
//   巻いていく。巻いたロールは進むほど太くなり、渦が転がって回る。
//   へらが通ったあとは、はがした跡の筋が残った素の鉄板になる。

const STEEL = "#c4cad1";
const STEEL_L = "#d3d8de";
const STEEL_D = "#9ea6b0";
const STEEL_DD = "#7c8590";
const FROST = "#eef2f6";
const INK = "#26313f";
const BASE = "#f6c4cd";
const BASE_L = "#fde2e6";
const BASE_D = "#e397a8";
const BIT = "#d42c48";
const CREAM = "#f8eedc";
const CREAM_D = "#e2cfae";
const CUP = "#fbfbf9";
const CUP_D = "#dcdcd6";
const CUP_LINE = "#8e959e";
const CHOCO = "#4a2616";
const CHOCO_L = "#7a4426";
const BLADE = "#eef1f4";
const BLADE_D = "#8a929c";
const HANDLE = "#2a2a2e";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

const SURFACE = 29; // 鉄板の面（断面）
const SHEET_END = 62; // 広げたベースの右端
// へらの位置（刃先のx）とロールの半径。コマごと
const SPATULA = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48];
const RADIUS = [2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6];

/** カップに立てたロール1本（4x6）。上の面に渦が見える */
function standingRoll(g: PixelGfx, x: number, y: number, body: string, dark: string) {
  g.rect(x, y + 1, 4, 5, body);
  g.vline(x + 3, y + 1, 5, dark);
  g.hline(x, y, 4, dark);
  g.px(x + 1, y + 1, dark);
  g.px(x + 2, y + 2, dark);
}

export const art: LabelArt = {
  slug: "rollice",
  swatch: [STEEL, BASE, BIT, CREAM, CHOCO],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;

    // ── 鉄板（ヘアライン） ────────────────────────────────
    g.rect(0, 0, 68, 40, STEEL);
    for (let y = 1; y < 40; y += 2) g.hline(0, y, 68, STEEL_L, "half");
    for (let y = 3; y < 40; y += 6) g.hline(4 + (y % 5), y, 20, STEEL_D, "quarter");

    // ── 題字。鉄板に刻む ─────────────────────────────────
    misakiRow(g, 3, 2, "なんでも", INK, FROST);
    misakiRow(g, 3, 10, "ロールアイス", INK, FROST);
    misakiRow(g, 4, 32, "シミュレーター", INK, FROST);

    // ── 盛りつけたカップ（右上） ──────────────────────────
    // チョコの棒（カップの奥）
    g.line(60, 8, 65, 1, CHOCO);
    g.line(61, 8, 66, 1, CHOCO_L);
    standingRoll(g, 52, 2, CREAM, CREAM_D);
    standingRoll(g, 56, 1, BASE, BASE_D);
    standingRoll(g, 60, 3, CREAM, CREAM_D);
    g.px(54, 6, BIT); // いちご
    g.px(55, 6, BIT);
    for (let y = 8; y <= 15; y++) {
      const hw = 6 - Math.floor((y - 8) / 3);
      g.hline(58 - hw, y, hw * 2 + 1, CUP);
      g.hline(58 + hw - 2, y, 2, CUP_D);
      g.px(58 - hw, y, CUP_LINE);
      g.px(58 + hw, y, CUP_LINE);
    }
    g.hline(52, 8, 13, CUP_LINE);
    g.hline(55, 15, 7, CUP_LINE);

    // ── まんなか: 鉄板の断面 ──────────────────────────────
    g.hline(1, SURFACE + 1, 66, STEEL_DD);
    g.hline(1, SURFACE + 2, 66, STEEL_D);

    const xs = SPATULA[f];
    const r = RADIUS[f];
    const cx = xs + r + 1;
    const cy = SURFACE - r;

    // へらが通ったあと: はがした筋だけ残る
    for (let x = 2; x < xs; x++) if (x % 3 !== 0) g.px(x, SURFACE, FROST);

    // まだ広がっているベース（3行の厚み）
    const sx = cx + Math.max(1, r - 1);
    if (sx <= SHEET_END) {
      const w = SHEET_END - sx + 1;
      g.hline(sx, SURFACE - 2, w, BASE_L);
      g.hline(sx, SURFACE - 1, w, BASE);
      g.hline(sx, SURFACE, w, BASE_D);
      for (let x = sx; x <= SHEET_END; x++) {
        if (x % 7 === 2) g.px(x, SURFACE - 1, BIT);
        if (x % 7 === 5) g.px(x, SURFACE - 2, BIT);
      }
    }

    // 巻いたロール（断面に渦）。転がるので渦の照りが回る
    g.hline(cx - r, SURFACE + 1, r * 2 + 1, STEEL_DD); // 影
    g.disc(cx, cy, r, BASE);
    g.ring(cx, cy, r, BASE_D);
    if (r >= 3) g.ring(cx, cy, r - 2, BASE_D);
    g.px(cx, cy, BIT);
    const a = (-f * Math.PI) / 3;
    g.px(cx + Math.round(Math.cos(a) * (r - 1)), cy + Math.round(Math.sin(a) * (r - 1)), BASE_L);
    if (r >= 4) {
      const b = a + Math.PI;
      g.px(cx + Math.round(Math.cos(b) * (r - 1)), cy + Math.round(Math.sin(b) * (r - 1)), BIT);
    }

    // へら。刃先をロールの左の根元に差しこむ
    g.line(xs, SURFACE, xs - 3, SURFACE - 7, BLADE);
    g.line(xs + 1, SURFACE, xs - 2, SURFACE - 7, BLADE_D);
    g.line(xs - 3, SURFACE - 8, xs - 5, SURFACE - 12, HANDLE);
    g.line(xs - 2, SURFACE - 8, xs - 4, SURFACE - 12, HANDLE);

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。題字の墨に合わせる。
    g.frame(0, 0, 68, 40, INK);
    mark(g, INK, FROST);
  },
};
