"use client";

import PixelCanvas from "./PixelCanvas";
import type { PixelGfx } from "@/art/gfx";

/**
 * 見出しロゴ「ふりっぷ」。
 *
 * アーケード筐体の看板（PAC-MAN / DIG DUG / GALAGA）の作法に倣う。
 *   太らせた字 → 濃い縁取り → 天に光 → 版ずれのような赤い影。
 * ただし黒地に蛍光色ではやらない。紙に刷った二色印刷として組む。
 *
 * 骨格は本文と同じ DotGothic16 を 24px で写し取ったもの。写したのは
 * 骨だけで、太らせ・縁取り・光・影はここで全部つけている。
 */

// ── 骨格（DotGothic16 24px の写し。上端をそろえて21行） ────────
const G_FU = [
  "......#########......",
  "...........####......",
  "...............##....",
  "...............##....",
  ".....................",
  "........##...........",
  ".........###.........",
  ".........####........",
  "...##.......##..##...",
  "...##.......##..##...",
  "...##........##...##.",
  "..###........##...##.",
  "..#..........##...##.",
  "..#..........##....##",
  "###..........##....##",
  "##...........##....##",
  "##...#......##.....##",
  "......#######........",
  "......######.........",
  ".....................",
  ".....................",
];

const G_RI = [
  ".##....#######...",
  ".##...##.....##..",
  "##..##.......##..",
  "##..##.......##..",
  "##.##..........##",
  "##.##..........##",
  "##.##..........##",
  "###............##",
  "###............##",
  "###............##",
  "##.............##",
  "##.............##",
  "##............###",
  ".............##..",
  ".............##..",
  ".............##..",
  "............##...",
  ".......#####.....",
  "..##########.....",
  ".#######.........",
  ".................",
];

const G_TSU = [
  "..................",
  "..................",
  "..................",
  "..................",
  "..................",
  "..................",
  ".....##########...",
  "....###########...",
  "#####..........##.",
  "#####..........###",
  "................##",
  "................##",
  "................##",
  "................##",
  "...............##.",
  "..............##..",
  "............###...",
  "....########......",
  "....########......",
  "..................",
  "..................",
];

const G_PU = [
  "......#####......#####.",
  "..........#####.##...##",
  "..........#####.##...##",
  "................##...##",
  "..................###..",
  ".......##..............",
  ".........###...........",
  ".........###...........",
  "...##.......##..##.....",
  "...##.......##..##.....",
  "...##........##...##...",
  "..##.........##...##...",
  ".##..........##...##...",
  ".##..........##....##..",
  "###..........##....##..",
  "##...........##....##..",
  "##..##......##.....##..",
  ".....#######...........",
  "......######...........",
  ".......................",
  ".......................",
];

// ── ビットマスクの道具 ───────────────────────────────────────
type Mask = { w: number; h: number; on: Uint8Array };

const blank = (w: number, h: number): Mask => ({ w, h, on: new Uint8Array(w * h) });
const at = (m: Mask, x: number, y: number): number =>
  x < 0 || y < 0 || x >= m.w || y >= m.h ? 0 : m.on[y * m.w + x];

function maskFrom(rows: readonly string[]): Mask {
  const h = rows.length;
  const w = rows.reduce((a, r) => Math.max(a, r.length), 0);
  const m = blank(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < rows[y].length; x++) if (rows[y][x] === "#") m.on[y * w + x] = 1;
  return m;
}

/** src の1ドットを k×k の正方形にして dst に置く。 */
function stamp(dst: Mask, src: Mask, dx: number, dy: number, k: number) {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      if (!src.on[y * src.w + x]) continue;
      for (let j = 0; j < k; j++)
        for (let i = 0; i < k; i++) {
          const X = dx + x * k + i;
          const Y = dy + y * k + j;
          if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue;
          dst.on[Y * dst.w + X] = 1;
        }
    }
}

/** 字の外側だけを塗り広げる。内側（ぷの半濁点の穴）は潰さない。 */
function grow(m: Mask, r: number, outside: Mask): Mask {
  const out = blank(m.w, m.h);
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) {
      if (!m.on[y * m.w + x]) continue;
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          const X = x + i;
          const Y = y + j;
          if (X < 0 || Y < 0 || X >= m.w || Y >= m.h) continue;
          if (!m.on[Y * m.w + X] && !outside.on[Y * m.w + X]) continue; // 字の内側には広げない
          out.on[Y * m.w + X] = 1;
        }
    }
  return out;
}

/** 紙の側（字に囲まれていない余白）を塗り分ける。 */
function outsideOf(m: Mask): Mask {
  const o = blank(m.w, m.h);
  const q: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return;
    const i = y * m.w + x;
    if (o.on[i] || m.on[i]) return;
    o.on[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < m.w; x++) {
    push(x, 0);
    push(x, m.h - 1);
  }
  for (let y = 0; y < m.h; y++) {
    push(0, y);
    push(m.w - 1, y);
  }
  while (q.length) {
    const i = q.pop() as number;
    const x = i % m.w;
    const y = (i / m.w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  return o;
}

/**
 * ごく小さな穴を埋める。24pxで写し取ったときにできる1ドットの隙間は
 * 字の造形ではなくラスタライズの残りかすなので、埋めてから太らせる。
 * 大きな内側（ぷの半濁点）は残す。
 */
function fillPinholes(m: Mask, maxArea: number): Mask {
  const out = outsideOf(m);
  const seen = new Uint8Array(m.w * m.h);
  const res: Mask = { w: m.w, h: m.h, on: Uint8Array.from(m.on) };
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) {
      const i0 = y * m.w + x;
      if (m.on[i0] || out.on[i0] || seen[i0]) continue;
      const cell: number[] = [];
      const q = [i0];
      seen[i0] = 1;
      while (q.length) {
        const i = q.pop() as number;
        cell.push(i);
        const cx = i % m.w;
        const cy = (i / m.w) | 0;
        const near = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];
        for (const [nx, ny] of near) {
          if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
          const j = ny * m.w + nx;
          if (m.on[j] || out.on[j] || seen[j]) continue;
          seen[j] = 1;
          q.push(j);
        }
      }
      if (cell.length <= maxArea) for (const i of cell) res.on[i] = 1;
    }
  return res;
}

// ── 組み ────────────────────────────────────────────────────
const K = 3; // 骨格1ドットを3ドットに
const PAD = 12; // 縁取りと影のための余白
const PITCH = 24; // 全角送り
const ROWS = 21;
const PLACES: Array<[readonly string[], number]> = [
  [G_FU, 1],
  [G_RI, 4],
  [G_TSU, 3],
  [G_PU, 1],
];

export const WORDMARK = { W: PITCH * 4 * K + PAD * 2, H: ROWS * K + PAD * 2 };

const BASE = blank(WORDMARK.W, WORDMARK.H);
for (let i = 0; i < PLACES.length; i++) {
  const [rows, lsb] = PLACES[i];
  stamp(BASE, maskFrom(rows), PAD + (i * PITCH + lsb) * K, PAD, K);
}
const SOLID = fillPinholes(BASE, K * K * 4);
const OUT0 = outsideOf(SOLID);
const BOLD = grow(SOLID, 2, OUT0); // 太らせる
const OUT1 = outsideOf(BOLD);
const EDGE = grow(BOLD, 2, OUT1); // 縁取り
// 字の内側（ぷの半濁点の穴）。厚みが透けないよう紙の色で抜き、
// 外と同じように縁を取る
const HOLE = (() => {
  const m = blank(WORDMARK.W, WORDMARK.H);
  for (let i = 0; i < m.on.length; i++) if (!BOLD.on[i] && !OUT1.on[i]) m.on[i] = 1;
  return m;
})();
const RIM = (() => {
  const m = blank(WORDMARK.W, WORDMARK.H);
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) {
      if (!HOLE.on[y * m.w + x]) continue;
      for (let j = -2; j <= 2 && !m.on[y * m.w + x]; j++)
        for (let i = -2; i <= 2; i++)
          if (at(BOLD, x + i, y + j)) {
            m.on[y * m.w + x] = 1;
            break;
          }
    }
  return m;
})();

const INK = "#1b1a17";
const DEPTH = 5; // 看板の文字が持っている厚み
// 押し出しは真下。カセットの落ち影が右下なので、右下に出すと厚みが影に見える
const PUSH_X = 0;
const PUSH_Y = 1;
const SIDE = "#c33c27";
// 面。上から下へ。あいだはディザで繋ぐので帯が線にならない
const FACE = ["#7ea3e8", "#5480da", "#3f68c8", "#2b4ea2", "#20397a", "#182c5e"];
const LIT = "#e6eeff";
const LIT2 = "#a9c4f2";
const SHADE = "#14265a";
const PAPER = "#efeadc";

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function paint(g: PixelGfx, m: Mask, c: string, dx = 0, dy = 0) {
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) if (m.on[y * m.w + x]) g.px(x + dx, y + dy, c);
}

function drawWordmark(g: PixelGfx) {
  // 厚み。看板の文字は板から起きているので、右下に側面が出る
  for (let d = DEPTH; d >= 1; d--)
    paint(g, EDGE, d === DEPTH ? INK : SIDE, d * PUSH_X, d * PUSH_Y);
  paint(g, HOLE, PAPER); // 抜きは紙のまま
  paint(g, RIM, INK);
  paint(g, EDGE, INK); // 縁取り

  const top = PAD;
  const span = ROWS * K;
  const last = FACE.length - 1;
  for (let y = 0; y < BOLD.h; y++) {
    const f = Math.max(0, Math.min(last, ((y - top) / span) * last));
    const i = Math.min(last - 1, Math.floor(f));
    const frac = f - i;
    for (let x = 0; x < BOLD.w; x++) {
      if (!BOLD.on[y * BOLD.w + x]) continue;
      let c = FACE[BAYER[y & 3][x & 3] / 16 < frac ? i + 1 : i];
      if (!at(BOLD, x, y + 1)) c = SHADE;
      if (!at(BOLD, x, y - 2)) c = LIT2;
      if (!at(BOLD, x, y - 1)) c = LIT;
      g.px(x, y, c);
    }
  }
}

/** 実際にインクの乗る矩形。版面の左端に字面をそろえるために要る。 */
const BOX = (() => {
  let l = WORDMARK.W;
  let t = WORDMARK.H;
  let r = 0;
  let b = 0;
  for (let y = 0; y < EDGE.h; y++)
    for (let x = 0; x < EDGE.w; x++) {
      if (!EDGE.on[y * EDGE.w + x]) continue;
      if (x + Math.min(0, DEPTH * PUSH_X) < l) l = x + Math.min(0, DEPTH * PUSH_X);
      if (y < t) t = y;
      if (x + Math.max(0, DEPTH * PUSH_X) > r) r = x + Math.max(0, DEPTH * PUSH_X);
      if (y + DEPTH * PUSH_Y > b) b = y + DEPTH * PUSH_Y;
    }
  return { l, t, r, b };
})();

export default function Wordmark({ scale }: { scale: number }) {
  return (
    <div
      className="wordmark"
      style={{
        marginTop: -BOX.t * scale,
        marginLeft: -BOX.l * scale,
        marginRight: -(WORDMARK.W - 1 - BOX.r) * scale,
        marginBottom: -(WORDMARK.H - 1 - BOX.b) * scale,
      }}
    >
      <PixelCanvas
        w={WORDMARK.W}
        h={WORDMARK.H}
        scale={scale}
        draw={drawWordmark}
        ariaLabel="ふりっぷ"
      />
    </div>
  );
}
