import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { NES } from "../palette";

// throw to win ── スマホを高く投げた人が勝つ。
//
// 見上げた構図。空を大きく取り、放物線の頂点で端末が1回転している。
// 右下に投げた本人、その手前に見上げる小さな人影。右上は高度計。
// 実物のサイトが黒地にネオングリーンなので、画面と高度計だけその色を借りる。

const SKY_TOP = "#101c56";
const SKY_1 = NES.navy;
const SKY_2 = "#2c46b4";
const SKY_3 = NES.blue;
const SKY_4 = NES.blueLt;
const SKY_5 = "#93dff8";
const HORIZON = NES.cyanLt;

const NEON = "#5cf05c";
const NEON_DK = "#1c7a2c";
const INK = "#0b1030";
const GRASS = "#2f8a48";
const GRASS_LT = "#63bd78";
const GRASS_DK = "#1d6432";
const GRASS_DK2 = "#144e26";

// 5x7 の太字。ラベルの題字用。
const GLYPH: Record<string, string[]> = {
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  R: ["####.", "#...#", "#...#", "####.", "#..#.", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
};

function word(g: PixelGfx, x: number, y: number, s: string, fill: string, edge: string, drop?: string) {
  const put = (dx: number, dy: number, c: string) => {
    let cx = x + dx;
    for (const ch of s) {
      const rows = GLYPH[ch];
      if (rows) g.blit(cx, y + dy, rows, { "#": c });
      cx += 6;
    }
  };
  if (drop) put(2, 2, drop);
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ])
    put(dx, dy, edge);
  put(0, 0, fill);
}

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

/** 群衆の1人。3x5。両手を上げて見上げている。 */
const CROWD = ["#.#", ".#.", "###", ".#.", "#.#"];

/** 投げた本人。5x9。 */
const THROWER = ["#...#", "#.#.#", "#.#.#", "#####", ".###.", ".###.", ".###.", ".#.#.", ".#.#."];

export const art: LabelArt = {
  slug: "throw",
  swatch: [SKY_1, SKY_4, NEON, "#f2d05a", GRASS_DK],
  draw: (g, t) => {
    // ── 空。天頂ほど濃い ──────────────────────────────────
    g.rect(0, 0, 68, 40, SKY_TOP);
    g.rect(0, 5, 68, 5, SKY_1);
    g.rect(0, 5, 68, 2, SKY_1, "half");
    g.rect(0, 10, 68, 6, SKY_2);
    g.rect(0, 10, 68, 2, SKY_2, "half");
    g.rect(0, 16, 68, 5, SKY_3);
    g.rect(0, 16, 68, 2, SKY_3, "half");
    g.rect(0, 21, 68, 4, SKY_4);
    g.rect(0, 21, 68, 2, SKY_4, "half");
    g.rect(0, 25, 68, 4, SKY_5);
    g.rect(0, 25, 68, 2, SKY_5, "half");

    // 昼でも見える高いところの光
    g.px(52, 4, "#8aa2ec");
    g.px(9, 7, "#8aa2ec");
    g.px(63, 12, "#a8bcf4");
    g.px(4, 14, "#6f8ae0");

    // ── 雲。低いところに水平に ────────────────────────────
    const cloud = (x: number, y: number, w: number) => {
      g.ellipse(x, y, w, 2, "#eaf6ff");
      g.ellipse(x - w + 2, y, 3, 1, "#eaf6ff");
      g.ellipse(x + w - 3, y - 1, 3, 2, "#ffffff");
      g.hline(x - w + 1, y + 2, w * 2 - 2, "#9fc4e8");
      g.hline(x - w + 3, y - 2, w, "#ffffff", "half");
    };
    cloud(12, 21, 6);
    cloud(50, 24, 7);
    cloud(64, 18, 4);

    // ── 放物線。投げた手から頂点まで点で追う ────────────────
    const apexX = 27;
    const apexY = 6;
    const k = 0.0229;
    for (let x = 1; x <= 58; x++) {
      const d = x - apexX;
      const y = apexY + k * d * d;
      if (y > 30) continue;
      if (x % 2 !== 0) continue;
      g.px(x, Math.round(y), x > apexX ? "#eaf6ff" : "#a8c8f4");
    }

    // ── 端末。頂点で1コマ回る ────────────────────────────
    const flip = t < 0.5 ? -0.58 : -0.2;
    const cx = 27;
    const cy = 14;
    const cs = Math.cos(flip);
    const sn = Math.sin(flip);
    /** 端末のローカル座標を画面に置き直す */
    const lp = (x: number, y: number): [number, number] => [cx + x * cs - y * sn, cy + x * sn + y * cs];
    const quad = (hw: number, hh: number, off = 0): Array<[number, number]> => [
      lp(-hw, -hh + off),
      lp(hw, -hh + off),
      lp(hw, hh + off),
      lp(-hw, hh + off),
    ];

    // 回転の名残り。端末の周りに散る点
    for (let i = 0; i < 5; i++) {
      const a = flip + 2.1 + i * 0.34;
      g.px(Math.round(cx + Math.cos(a) * 15), Math.round(cy + Math.sin(a) * 15), i % 2 ? "#dff0ff" : "#8fb6ea");
    }

    g.poly(quad(7, 11.5), INK);
    g.poly(quad(6, 10.5), "#43414f");
    // 筐体の光る辺（line は整数の端点でしか使わない）
    const e0 = lp(-6, -10.5).map(Math.round) as [number, number];
    const e1 = lp(6, -10.5).map(Math.round) as [number, number];
    const e3 = lp(-6, 10.5).map(Math.round) as [number, number];
    g.line(e0[0], e0[1], e1[0], e1[1], "#8f8da4");
    g.line(e0[0], e0[1], e3[0], e3[1], "#8f8da4");
    // 画面
    g.poly(quad(4.4, 8.4), "#06180b");
    g.poly(quad(3.8, 7.6), NEON);
    // 画面のなか。上に暗い帯、下に2本の行
    g.poly(quad(3.8, 0.8, -6.2), "#06180b");
    g.poly(quad(3.0, 0.5, 1.6), "#0e4a1c");
    g.poly(quad(2.2, 0.5, 3.6), "#0e4a1c");
    g.poly(quad(3.4, 1.6, -2.6), "#c9ffc9");
    // カメラと下端のバー
    const cam = lp(0, -9.6).map(Math.round) as [number, number];
    g.px(cam[0], cam[1], "#c8c8d4");
    const bar = lp(0, 9.6).map(Math.round) as [number, number];
    g.px(bar[0], bar[1], "#8f8da4");
    g.px(bar[0] + 1, bar[1], "#8f8da4");

    // きらめき
    const spark = (x: number, y: number, c: string) => {
      g.px(x, y, c);
      g.px(x - 1, y, c);
      g.px(x + 1, y, c);
      g.px(x, y - 1, c);
      g.px(x, y + 1, c);
    };
    spark(15, 5, "#ffffff");
    spark(37, 20, "#dff0ff");
    g.px(9, 20, "#ffffff");

    // 遠くの鳥
    for (const [x, y] of [
      [7, 9],
      [12, 12],
      [58, 6],
    ]) {
      g.px(x - 1, y - 1, "#cfe0f8");
      g.px(x, y, "#cfe0f8");
      g.px(x + 1, y - 1, "#cfe0f8");
      g.px(x - 2, y - 2, "#a8c0e8");
      g.px(x + 2, y - 2, "#a8c0e8");
    }

    // ── 高度計。黒地にネオン ─────────────────────────────
    g.rect(40, 2, 26, 14, INK);
    g.frame(40, 2, 26, 14, NEON_DK);
    g.hline(41, 3, 24, "#0f2a18");
    g.text3x5(42, 4, "ALT", NEON_DK);
    // 上向きの矢印
    g.px(61, 4, NEON);
    g.hline(60, 5, 3, NEON);
    g.hline(59, 6, 5, NEON);
    g.hline(60, 7, 3, NEON);
    g.hline(60, 8, 3, NEON);
    const alt = 8 + t * 7.9;
    const s = `${alt.toFixed(1)}M`;
    g.text3x5(64 - g.text3x5Width(s), 10, s, NEON);

    // ── 地平の並木。遠いので暗く低く ──────────────────────
    g.rect(30, 26, 38, 3, "#1a5730");
    for (const [x, r] of [
      [33, 2],
      [39, 1],
      [44, 2],
      [50, 1],
      [55, 2],
      [61, 1],
      [66, 2],
    ]) {
      g.ellipse(x, 26, r + 1, r, "#1a5730");
      g.px(x - r, 25, "#25743f");
      g.px(x, 25, "#25743f");
    }

    // ── 地面 ────────────────────────────────────────────
    g.hline(0, 28, 68, HORIZON);
    g.rect(0, 29, 68, 11, GRASS);
    g.hline(0, 29, 68, GRASS_LT);
    g.rect(0, 30, 68, 2, GRASS_LT, "eighth");
    g.rect(0, 34, 68, 2, GRASS_DK, "half");
    g.rect(0, 36, 68, 4, GRASS_DK);
    g.rect(0, 38, 68, 2, GRASS_DK2, "half");
    for (let x = 5; x < 68; x += 9) g.px(x, 32, "#4cdc48");
    for (let x = 40; x < 68; x += 6) g.vline(x, 37, 2, GRASS_DK2);

    // 見上げる人たちと、投げた本人
    g.blit(37, 29, CROWD, { "#": "#0d2a15" });
    g.blit(44, 30, CROWD, { "#": "#0b2312" });
    g.blit(51, 29, CROWD, { "#": "#0d2a15" });
    g.hline(37, 34, 3, GRASS_DK);
    g.hline(44, 35, 3, GRASS_DK);
    g.hline(51, 34, 3, GRASS_DK);
    // 投げた本人。右下の隅は発行元の印にあけておくので、少し内側に立たせる。
    g.blit(55, 29, THROWER, { "#": "#0b1a0f" });
    g.hline(54, 38, 7, GRASS_DK2);

    // ── 題字 ────────────────────────────────────────────
    // 下辺の枠に食われないよう、副題の箱は1px以上あけて置く。
    word(g, 3, 23, "THROW", "#ffffff", INK, "#f2d05a");
    g.rect(2, 30, 29, 8, INK);
    g.frame(2, 30, 29, 8, "#f2d05a");
    g.text3x5(5, 32, "TO WIN", "#f2d05a");

    // ── 枠 ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, INK);
    mark(g, "#f2d05a", INK);
  },
};
