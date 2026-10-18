import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { rng } from "../gfx";
import { JP_SIZE, JP_TH, ascent, jpRow } from "../jptitle";
import { misakiRow } from "../misaki";

// おえかきパンケーキシミュレーター — 実物は「Pancake Canvas」。
// 温めたフライパンに生地で絵を描き、生地を流して、ひっくり返すと
// 描いた線が焦げ色になって表に出てくる。
//
// 図の骨組み: ラベル一面を1枚の焼けたパンケーキの表面にする。
//   題字そのものを「生地で描いて焼けた線」として焦げ色で載せる。
//   ＝この企画で一番うれしい瞬間（描いた線が焼き色で出てくる）を、題字で言い切る。
//   右上には、実物の「できた！」画面の、こすくまくんの笑い顔を同じ焦げ色の線で。
//   焼き色は外ほど濃く、年輪のような輪がうっすら出る（実物の焼き上がりの写真どおり）。
//
// 2026-10-18 に作り直した。前の版は「薄い地に同じ小ささの字が3行と小さな絵」で、
// 他の16枚と並べると、主役の語が無い・地が平ら・余白が多い、の3つで負けていた。
// 他の枚に倣って、主役の語「パンケーキ」だけを13pxで大きく、
// 「おえかき」「シミュレーター」は8x8（src/art/misaki.ts）で添える。
//
// 動くもの: 生地の泡がぷつぷつ出て、はじける。

const CAKE_E = "#6e3512"; // いちばん外のふち
const CAKE_1 = "#93501d";
const CAKE_2 = "#b2692c";
const CAKE_3 = "#c98340";
const CAKE_4 = "#d99a52";
const CAKE_C = "#e6b06a"; // まんなか
const RING = "#a65f26";
const LINE = "#2e1608"; // 焦げた線
const LINE_SH = "#f7d79e"; // 線の照り。焦げ色の下に明るい生地を1px覗かせて字を浮かせる
const BUBBLE = "#f2c886";
const BUBBLE_D = "#9c5a24";
const BUTTER = "#fff0a8";
const BUTTER_D = "#f0cc5a";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

const T_A = "おえかき";
const T_B = "パンケーキ";
const T_C = "シミュレーター";

/** 焼き色。ラベルの中心からの楕円の距離で段を切る。 */
function bake(x: number, y: number): string {
  const dx = (x - 33.5) / 36;
  const dy = (y - 19.5) / 22;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > 0.98) return CAKE_E;
  if (d > 0.92) return CAKE_1;
  if (d > 0.82) return CAKE_2;
  if (d > 0.64) return CAKE_3;
  if (d > 0.4) return CAKE_4;
  return CAKE_C;
}

export const art: LabelArt = {
  slug: "pancake",
  swatch: [CAKE_C, CAKE_2, CAKE_E, LINE, BUTTER],
  draw: (g, t) => {
    // ── 焼き面 ───────────────────────────────────────────
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 68; x++) g.px(x, y, bake(x, y));
    }
    // 段の境目を市松でぼかす。段がくっきりだと的に見える。
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 68; x++) {
        if ((x + y) % 2) continue;
        const c = bake(x + 1, y);
        if (c !== bake(x, y)) g.px(x, y, c);
      }
    }
    // 年輪。うっすら2本、点線で。
    for (const [rx, ry] of [
      [29, 16],
      [21, 11],
    ] as Array<[number, number]>) {
      for (let a = 0; a < 360; a += 4) {
        const r = (a * Math.PI) / 180;
        const x = Math.round(34 + Math.cos(r) * rx);
        const y = Math.round(20 + Math.sin(r) * ry);
        if ((x + y) % 3) g.px(x, y, RING);
      }
    }

    // ── バター ───────────────────────────────────────────
    // 右下寄りに、溶けかけの四角いバターをひとつ。焦げ色の中で一番明るい点。
    g.rect(52, 26, 5, 4, BUTTER_D);
    g.rect(52, 26, 4, 3, BUTTER);
    g.px(52, 26, "#ffffff");
    g.px(57, 29, BUTTER_D);
    g.px(51, 30, BUTTER_D);

    // ── 題字。生地で描いて焼けた線 ───────────────────────
    // 小さい2行は8x8。主役の「パンケーキ」だけ13px。
    // どれも右下に明るい照りを1px敷く。焼き色の中間調に焦げ色だけだと沈んで読めない。
    misakiRow(g, 4, 3, T_A, LINE, LINE_SH);
    const asc = ascent(T_B, JP_SIZE, JP_TH);
    jpRow(g, 13, T_B, LINE, { size: JP_SIZE, ascent: asc, shadow: LINE_SH });
    misakiRow(g, 4, 29, T_C, LINE, LINE_SH);

    // ── こすくまくんの笑い顔（右上・焦げ色の線） ─────────
    // 実物の「できた！」の絵: 大きな丸い輪郭、輪の耳、にっこり目、小さな鼻と口。
    const fx = 53;
    const fy = 6;
    // 耳は輪郭の肩に半分かかる位置。中は顔と同じ明るさに抜く。
    g.disc(fx, fy + 1, 4, CAKE_4); // 線で囲った中は焼けにくく、少しだけ明るい
    g.ring(fx, fy + 1, 5, LINE, 1);
    for (const ex of [fx - 5, fx + 5]) {
      g.ring(ex, fy - 3, 2, LINE, 1);
      g.px(ex, fy - 3, CAKE_4);
    }
    for (const ex of [fx - 2, fx + 2]) {
      g.px(ex - 1, fy + 1, LINE);
      g.px(ex, fy, LINE);
      g.px(ex + 1, fy + 1, LINE);
    }
    g.px(fx, fy + 2, CAKE_1);
    g.px(fx - 2, fy + 3, LINE);
    g.hline(fx - 1, fy + 4, 3, LINE);
    g.px(fx + 2, fy + 3, LINE);

    // ── 泡 ───────────────────────────────────────────────
    // 焼けていく生地にぷつぷつ出る穴。ばらばらの間合いで、出たりはじけたりする。
    const r = rng(4021);
    for (let i = 0; i < 24; i++) {
      const x = 3 + Math.floor(r() * 62);
      const y = 3 + Math.floor(r() * 34);
      const phase = r();
      // 題字と顔とバターの上には出さない
      const onText =
        (y >= 2 && y <= 11 && x < 38) || (y >= 12 && y <= 27 && x < 67) || (y >= 28 && y <= 37 && x < 61);
      const onFace = x >= 46 && y <= 12;
      const onButter = x >= 50 && x <= 58 && y >= 25 && y <= 31;
      if (onText || onFace || onButter) continue;
      if ((t + phase) % 1 < 0.5) {
        g.px(x, y, BUBBLE_D);
        g.px(x - 1, y - 1, BUBBLE);
      } else {
        g.px(x, y, BUBBLE);
      }
    }

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。いちばん濃い焼き色。
    g.frame(0, 0, 68, 40, LINE);
    mark(g, BUTTER, LINE);
  },
};
