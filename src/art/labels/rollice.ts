import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// なんでもロールアイスシミュレーター — 冷たい鉄板にベースを流して、
// へらで巻いて、好きなように盛りつける。
//
// 図の骨組み: ラベル一面が冷たい鉄板で、**真上から**見下ろす（2026-11-11 ユーザー指示。
//   その前の版は鉄板を真横から見た断面で、ロールの渦を見せていた）。
//   題字は鉄板に刻むように3行（「なんでも」「ロールアイス」「シミュレーター」）。
//   まんなかに、実物の画面と同じ霜のふちのついた浅いくぼみがあり、
//   そこにいちごのベースが薄く広がっている。具は「なんでも」なので色とりどり。
//   右上には完成品。白い紙カップを真上から見ると、立てて詰めたロールの
//   渦が3つ並び、いちごとチョコの棒がささっている（実物の完成写真どおり）。
//
// 動くもの（1周3秒・12コマ）: へらが左から右へ進み、ベースをはがしながら巻いていく。
//   巻いた棒（真上から見ると縦の帯）は進むほど太くなり、転がるので表面の具が流れる。
//   へらが通ったあとは、はがした筋の残る素の鉄板になる。

const STEEL = "#c4cad1";
const STEEL_L = "#d3d8de";
const STEEL_D = "#9ea6b0";
const FROST = "#eef2f6";
const FROST_D = "#dde3ea";
const INK = "#26313f";
const BASE = "#f6c4cd";
const BASE_L = "#fde2e6";
const BASE_D = "#e397a8";
const BASE_DD = "#c97488";
const BIT = "#d42c48";
const CREAM = "#f8eedc";
const CREAM_D = "#d9c4a0";
const ROLL_LINE = "#a8814e";
const CUP = "#fbfbf9";
const CUP_D = "#d6d8dc";
const CUP_SHADOW = "#a4acb6";
const CHOCO = "#4a2616";
const CHOCO_L = "#7a4426";
const BLADE = "#eef1f4";
const BLADE_D = "#7c8590";
const HANDLE = "#2a2a2e";
const HANDLE_L = "#4a4a52";

// 具（なんでも）
const TOPPINGS = ["#d42c48", "#4a5cc0", "#f2b81e", "#5a3018", "#58a83c", "#ffffff"];

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// くぼみ（霜のふち）とベースの広がり
const WELL = { x: 2, y: 18, w: 64, h: 13 };
const SHEET = { x0: 6, x1: 61, y0: 20, y1: 28 };
// へら（刃のx）と、巻いた棒の太さ。コマごと
const SPATULA = [5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49];
const LOG_W = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6];

/** 真上から見た、立てたロール1本（6x6）。外の輪と、内側に巻き込む線 */
const SWIRL = [".dddd.", "dbbbbd", "dbddbd", "dbdbbd", "dbbbbd", ".dddd."];
function swirl(g: PixelGfx, x: number, y: number, body: string, dark: string) {
  g.blit(x, y, SWIRL, { b: body, d: dark });
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

    // ── 完成品。紙カップを真上から ───────────────────────
    const CX = 58;
    const CY = 9;
    // チョコの棒。カップから左上へ突き出る（題字の右の空き）
    g.line(CX - 2, CY - 2, CX - 9, CY - 8, CHOCO);
    g.line(CX - 2, CY - 1, CX - 9, CY - 7, CHOCO_L);
    g.disc(CX + 1, CY + 1, 8, CUP_SHADOW); // 影
    g.disc(CX, CY, 8, CUP);
    g.ring(CX, CY, 8, CUP_D);
    g.disc(CX, CY, 6, CREAM_D); // カップの中
    swirl(g, CX - 6, CY - 6, CREAM, ROLL_LINE);
    swirl(g, CX, CY - 6, BASE, BASE_DD);
    swirl(g, CX - 3, CY, CREAM, ROLL_LINE);
    // いちご（半分に切った断面）。右下のすきまに
    g.blit(CX + 3, CY + 1, [".RR.", "RwwR", "RwRR", ".RR."], { R: BIT, w: BASE_L });
    // 棒の先はロールの上に出る
    g.line(CX - 1, CY - 1, CX - 3, CY - 3, CHOCO);

    // ── くぼみ（霜のふち） ───────────────────────────────
    g.rect(WELL.x, WELL.y, WELL.w, WELL.h, STEEL_L);
    g.frame(WELL.x, WELL.y, WELL.w, WELL.h, FROST);
    g.frame(WELL.x + 1, WELL.y + 1, WELL.w - 2, WELL.h - 2, FROST_D);
    for (let x = WELL.x + 1; x < WELL.x + WELL.w - 1; x += 3) {
      g.px(x, WELL.y + 1, "#ffffff");
      g.px(x + 1, WELL.y + WELL.h - 2, "#ffffff");
    }

    const xs = SPATULA[f];
    const w = LOG_W[f];
    const { x0, x1, y0, y1 } = SHEET;

    // へらが通ったあと: はがした筋だけ残る
    for (let y = y0; y <= y1; y += 2)
      for (let x = x0; x < xs; x++) if ((x + y) % 4 !== 0) g.px(x, y, FROST_D);

    // まだ広がっているベース。具が散っている
    const sx = xs + w + 1;
    if (sx <= x1) {
      g.rect(sx, y0, x1 - sx + 1, y1 - y0 + 1, BASE);
      g.vline(x1, y0, y1 - y0 + 1, BASE_D);
      g.hline(sx, y1, x1 - sx + 1, BASE_D);
      for (let x = x0; x <= x1; x++)
        for (let y = y0; y < y1; y++) {
          if (x < sx) continue;
          const k = (x * 7 + y * 13) % 23;
          if (k === 0) g.px(x, y, TOPPINGS[(x + y) % TOPPINGS.length]);
          else if (k === 11) g.px(x, y, BASE_L);
        }
    }

    // 巻いた棒。真上からは縦の帯。左右を暗く、まんなかに照り
    const lx = xs + 1;
    g.rect(lx, y0 - 1, w, y1 - y0 + 3, BASE);
    g.vline(lx, y0 - 1, y1 - y0 + 3, BASE_DD);
    g.vline(lx + w - 1, y0 - 1, y1 - y0 + 3, BASE_D);
    if (w >= 3) g.vline(lx + 1, y0 - 1, y1 - y0 + 3, BASE_L);
    // 端に巻き目
    g.hline(lx, y0 - 1, w, BASE_DD);
    g.hline(lx, y1 + 1, w, BASE_DD);
    // 転がっているので、表面の具が右から左へ流れていく
    for (let j = 0; j < 4; j++) {
      const yy = y0 + ((j * 5 + f * 2) % (y1 - y0 + 1));
      const xx = lx + ((j + f) % w);
      g.px(xx, yy, TOPPINGS[j % TOPPINGS.length]);
    }

    // へら。刃は縦に1本、柄は左へ
    g.vline(xs, y0 - 2, y1 - y0 + 5, BLADE);
    g.vline(xs - 1, y0 - 2, y1 - y0 + 5, BLADE_D);
    g.rect(xs - 9, 23, 8, 3, HANDLE);
    g.hline(xs - 9, 23, 8, HANDLE_L);

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。題字の墨に合わせる。
    g.frame(0, 0, 68, 40, INK);
    mark(g, INK, FROST);
  },
};
