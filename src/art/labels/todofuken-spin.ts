import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// 都道府県スピンバトル — 都道府県（と市町村）のシルエットをコマにして回し、
// スタジアムでぶつけ合う。形のトゲトゲ・ずんぐり・丸さが強さになる。
//
// 図の骨組み: 実物どおり、紺から紫へ沈む地に、薄いくまの印が並ぶ壁紙。
//   左上に題字「都道府県」（白）と「スピンバトル」（黄）。
//   下半分は斜め上から見た円いスタジアム（銀のふち・青白く光る輪・暗い床）。
//   その中で、北海道の形の青いコマと、東京の形のオレンジのコマが回る
//   （実物のサムネイルの YOU＝オレンジ、CPU＝青）。
//
// 動くもの（1周3秒・12コマ）: 2つのコマが自分の軸でくるくる回りながら、
//   スタジアムの中を向かい合って回り、まんなかで激突して火花が散る。
//   はじかれてまた外へ。コマの形はその場で回転させて描いている
//   （シルエットの点を、斜め上から見た分だけ縦につぶして回す）。

const BG = "#1c1f5a";
const BG_TOP = "#3a2152";
const PATTERN = "#262a6c";
const WHITE = "#ffffff";
const YELLOW = "#ffd23a";
const RIM = "#b8c0cc";
const RIM_L = "#e8ecf2";
const RIM_D = "#6a7484";
const FLOOR = "#2a3046";
const FLOOR_L = "#3a4260";
const GLOW = "#5ad8f0";
const POST = "#8a93a2";
const LAMP = "#efe6b8";
const OR = "#ee7a30";
const OR_L = "#ffc68a";
const OR_D = "#8a3a14";
const BL = "#3aa4e8";
const BL_L = "#c4ecff";
const BL_D = "#1a4a80";
const SPARK = "#fff3a0";
const INK = "#12142e";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// シルエット（上から見た形）。# が陸
const HOKKAIDO = [
  ".....##.....",
  "....###.....",
  "...####...#.",
  "...########.",
  "..#########.",
  ".##########.",
  "############",
  ".##..######.",
  ".#....###...",
];
const TOKYO = [
  "........###..",
  "....#######.#",
  "#############",
  "############.",
  ".##########..",
  "...####......",
];

// スタジアム
const CX = 38;
const CY = 27;
const RX = 27;
const RY = 10;
const SQUASH = 0.6; // 斜め上から見た分だけ縦につぶす
const SCALE = 1.4; // シルエット1点を何pxに広げるか

/** シルエットを中心 (cx, cy) に、角度 a で回して描く。厚みつき */
function spinTop(
  g: PixelGfx,
  shape: readonly string[],
  cx: number,
  cy: number,
  a: number,
  face: string,
  light: string,
  dark: string,
) {
  const h = shape.length;
  const w = shape[0].length;
  const R = Math.ceil((Math.hypot(w, h) / 2) * SCALE) + 1;
  const hit = (u: number, v: number) => {
    // 画面の点 (u, v) を、つぶしと回転を戻してシルエットの点へ
    const y0 = v / SQUASH / SCALE;
    const x0 = u / SCALE;
    const x = x0 * Math.cos(-a) - y0 * Math.sin(-a) + w / 2;
    const y = x0 * Math.sin(-a) + y0 * Math.cos(-a) + h / 2;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    return iy >= 0 && iy < h && ix >= 0 && ix < w && shape[iy][ix] === "#";
  };
  const vr = Math.ceil(R * SQUASH) + 1;
  // 影
  g.ellipse(cx, cy + 3, Math.round(R * 0.8), 1, "#00000055");
  // 側面（厚み2px）
  for (let v = -vr; v <= vr; v++)
    for (let u = -R; u <= R; u++)
      if (hit(u, v)) {
        g.px(cx + u, cy + v + 1, dark);
        g.px(cx + u, cy + v + 2, dark);
      }
  // 上の面と、ふちの明るい線
  for (let v = -vr; v <= vr; v++)
    for (let u = -R; u <= R; u++)
      if (hit(u, v)) {
        const edge = !hit(u, v - 1) || !hit(u - 1, v) || !hit(u + 1, v);
        g.px(cx + u, cy + v, edge ? light : face);
      }
  // 軸
  g.px(cx, cy, light);
}

export const art: LabelArt = {
  slug: "todofuken-spin",
  swatch: [BG, YELLOW, OR, BL, GLOW],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;

    // ── 地。紺から紫へ、薄いくまの印の壁紙 ───────────────
    g.rect(0, 0, 68, 40, BG);
    // 上ほど紫。網をかけずに横の帯で沈める
    for (let y = 0; y < 14; y++) if (y % 2 === 0 || y < 6) g.hline(0, y, 68, BG_TOP);
    for (let y = 2; y < 40; y += 9)
      for (let x = (y / 9) % 2 === 0 ? 2 : 7; x < 68; x += 10)
        g.blit(x, y, ["#.#", "###", "###"], { "#": PATTERN });

    // ── 題字 ─────────────────────────────────────────────
    misakiRow(g, 3, 2, "都道府県", WHITE, INK);
    misakiRow(g, 3, 10, "スピンバトル", YELLOW, INK);

    // ── スタジアム ───────────────────────────────────────
    // 奥の柱2本（実物のふちに立つ照明）
    for (const px of [CX - 21, CX + 19]) {
      g.rect(px, CY - 12, 3, 5, POST);
      g.hline(px, CY - 12, 3, LAMP);
    }
    g.ellipse(CX, CY + 2, RX, RY, RIM_D); // ふちの側面
    g.ellipse(CX, CY, RX, RY, RIM);
    g.ellipse(CX, CY - 1, RX, RY - 1, RIM_L, "half");
    g.ellipse(CX, CY, RX - 2, RY - 2, GLOW);
    g.ellipse(CX, CY + 0.5, RX - 3, RY - 3, FLOOR);
    g.ellipse(CX, CY + 1, RX - 12, RY - 5, FLOOR_L, "half"); // すり鉢の底
    // 放射の溝
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.px(CX + Math.round(Math.cos(a) * (RX - 5)), CY + Math.round(Math.sin(a) * (RY - 4)), FLOOR_L);
    }

    // ── コマ2つ ─────────────────────────────────────────
    // 向かい合ってスタジアムの中を回り、5〜6コマ目にまんなかで激突、はじかれる。
    const D = [12, 10, 8, 6, 4, 3, 5, 8, 11, 13, 13, 13];
    const orbit = (f / 12) * Math.PI * 2;
    const d = D[f];
    const ax = CX + Math.round(Math.cos(orbit) * d);
    const ay = CY + Math.round(Math.sin(orbit) * d * 0.4) - 1;
    const bx = CX - Math.round(Math.cos(orbit) * d);
    const by = CY - Math.round(Math.sin(orbit) * d * 0.4) - 1;
    const spin = (f / 12) * Math.PI * 4; // 1周で2回転
    const drawA = () => spinTop(g, TOKYO, ax, ay, spin, OR, OR_L, OR_D);
    const drawB = () => spinTop(g, HOKKAIDO, bx, by, -spin, BL, BL_L, BL_D);
    // 奥にあるほうを先に描く
    if (ay <= by) {
      drawA();
      drawB();
    } else {
      drawB();
      drawA();
    }

    // 激突の火花
    if (f === 5 || f === 6) {
      const sx = Math.round((ax + bx) / 2);
      const sy = Math.round((ay + by) / 2) - 2;
      const r = f === 5 ? 4 : 7;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 + f;
        const x = sx + Math.round(Math.cos(a) * r);
        const y = sy + Math.round(Math.sin(a) * r * 0.6);
        g.px(x, y, SPARK);
        g.px(sx + Math.round(Math.cos(a) * (r - 2)), sy + Math.round(Math.sin(a) * (r - 2) * 0.6), WHITE);
      }
      g.px(sx, sy, WHITE);
      g.px(sx - 1, sy, SPARK);
      g.px(sx + 1, sy, SPARK);
      g.px(sx, sy - 1, SPARK);
    }

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。地の紺に合わせる。
    g.frame(0, 0, 68, 40, INK);
    mark(g, YELLOW, INK);
  },
};
