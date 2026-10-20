import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// おえかきパンケーキシミュレーター — 実物は「Pancake Canvas」。
// 温めたフライパンに生地で絵を描き、生地を流して、ひっくり返すと
// 描いた線が焦げ色になって表に出てくる。
//
// 図の骨組み: 実物と同じく、黒いコンロの天板を真上から。
//   右上にフライパン。その上に焼き色のついたパンケーキがのっていて、
//   表に、実物の「できた！」画面のこすくまくんの笑い顔（焦げ色の線）。
//   フライパンのまわりから、青いガスの火がのぞく。
//   使う道具も並べる: 絵を描くソースボトル（右上から差し込む）、
//   ひっくり返すフライ返し（左のあき）、火加減のつまみ（右下）。
//   題字は左に3行。暗い天板の上なので、明るい字が一番強く立つ。
//   主役の「パンケーキ」だけ生地の黄色にする。
//
// 動くもの（1周3秒・12コマ）:
//   ・ソースボトルの口が、笑い顔を輪郭→耳→目→口の順に一筆ずつ描いていく。
//     8コマ目で描き終わり、残りの4コマは描き上がった顔を見せる。
//   ・ガスの火が、コマごとに長短を入れ替えてゆらぐ。
//
// 2026-10-20 に作り直した（ユーザー指示: フライパン・火・道具を入れ、
// フライパンの上にパンケーキがのっている絵にする）。

const TOP = "#1f1d20";
const TOP_HI = "#2c292d";
const PAN_RIM = "#9a958f";
const PAN_RIM_D = "#5c5854";
const PAN = "#18171a";
const PAN_IN = "#232125";
const HANDLE = "#b0703e";
const HANDLE_D = "#7c4a26";

const CAKE_E = "#7a3c14";
const CAKE_1 = "#a05a22";
const CAKE_2 = "#c07432";
const CAKE_3 = "#d48e46";
const CAKE_C = "#e6ad66";
const LINE = "#2e1608";

const FLAME = "#3f8cff";
const FLAME_L = "#9fd0ff";
const FLAME_D = "#2348b8";

const BOTTLE = "#fbf8f2";
const BOTTLE_D = "#cfc8bb";
const BOTTLE_TIP = "#e8a25a";
const TURNER = "#c9ccd2";
const TURNER_D = "#8b9098";
const KNOB = "#d8d6d2";
const KNOB_D = "#8a8682";

const INK = "#fff3d6";
const INK_HOT = "#ffc65a";
const INK_SH = "#000000";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

const T_A = "おえかき";
const T_B = "パンケーキ";
const T_C = "シミュレーター";

// フライパンとパンケーキ
const CX = 48;
const CY = 15;
const PAN_R = 14;
const CAKE_R = 9;

/** 円周の点を、上から時計回りに。重なりは除く。 */
function arc(cx: number, cy: number, r: number, from: number, steps: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((from + (360 * i) / steps) * Math.PI) / 180;
    const p: [number, number] = [Math.round(cx + Math.sin(a) * r), Math.round(cy - Math.cos(a) * r)];
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
}

/** 笑い顔を描く順の点列。輪郭→左耳→右耳→左目→右目→口。 */
function facePath(fx: number, fy: number): Array<[number, number]> {
  return [
    ...arc(fx, fy + 1, 6, 0, 56),
    ...arc(fx - 5, fy - 4, 2, 135, 20),
    ...arc(fx + 5, fy - 4, 2, 225, 20),
    [fx - 3, fy + 1],
    [fx - 2, fy],
    [fx - 1, fy + 1],
    [fx + 1, fy + 1],
    [fx + 2, fy],
    [fx + 3, fy + 1],
    [fx - 2, fy + 3],
    [fx - 1, fy + 4],
    [fx, fy + 4],
    [fx + 1, fy + 4],
    [fx + 2, fy + 3],
  ];
}

export const art: LabelArt = {
  slug: "pancake",
  swatch: [TOP, CAKE_2, FLAME, INK_HOT, PAN_RIM],
  draw: (g, t) => {
    const k = Math.round(t * 12) % 12; // 12コマのうち何コマ目か

    // ── 天板 ─────────────────────────────────────────────
    // 黒いガラスの天板。左下から右上へ、うっすら映り込みの帯。
    g.rect(0, 0, 68, 40, TOP);
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 68; x++) {
        const d = x - y * 1.4;
        if (d > 2 && d < 14 && (x + y) % 2 === 0) g.px(x, y, TOP_HI);
      }
    }

    // ── ガスの火 ─────────────────────────────────────────
    // フライパンのふちから外へ、青い炎の舌がのぞく。コマごとに長短を入れ替える。
    // 舌は根元が太く（2px）先が細い。根元ほど白っぽく、先ほど濃い青。
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + 0.15;
      const len = (i + k) % 3 === 0 ? 4 : (i + k) % 3 === 1 ? 3 : 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let j = 0; j < len; j++) {
        const r = PAN_R + 1 + j;
        const x = Math.round(CX + ca * r);
        const y = Math.round(CY + sa * r);
        const c = j === 0 ? FLAME_L : j === len - 1 ? FLAME_D : FLAME;
        g.px(x, y, c);
        if (j === 0) g.px(Math.round(CX + Math.cos(a + 0.07) * r), Math.round(CY + Math.sin(a + 0.07) * r), FLAME);
      }
    }

    // ── フライパン ───────────────────────────────────────
    // 柄は右へ。天板の外まで伸びる。
    g.rect(CX + PAN_R - 1, CY - 1, 4, 3, PAN_RIM_D);
    g.rect(CX + PAN_R + 3, CY - 2, 10, 4, HANDLE);
    g.hline(CX + PAN_R + 3, CY - 2, 10, "#c98a56");
    g.hline(CX + PAN_R + 3, CY + 1, 10, HANDLE_D);
    // ふちは2pxの金属。左上が光る。
    g.disc(CX, CY, PAN_R, PAN_RIM_D);
    g.disc(CX - 1, CY - 1, PAN_R - 1, PAN_RIM);
    g.disc(CX, CY, PAN_R - 2, PAN);
    g.disc(CX, CY, PAN_R - 3, PAN_IN);

    // ── パンケーキ ───────────────────────────────────────
    g.disc(CX + 1, CY + 1, CAKE_R, "#0e0d0f"); // フライパンに落ちる影
    g.disc(CX, CY, CAKE_R, CAKE_E);
    g.disc(CX, CY, CAKE_R - 1, CAKE_1);
    g.disc(CX, CY, CAKE_R - 2, CAKE_2);
    g.ring(CX, CY, CAKE_R - 3, CAKE_1, 1);
    g.disc(CX, CY, CAKE_R - 4, CAKE_3);
    g.disc(CX, CY + 1, CAKE_R - 7, CAKE_C);

    // ── こすくまくんの笑い顔を、ソースボトルで描いていく ──
    for (const ex of [CX - 5, CX + 5]) g.px(ex, CY - 4, CAKE_3);
    const pts = facePath(CX, CY);
    const n = Math.min(pts.length, Math.round((pts.length * (k + 1)) / 8));
    for (let i = 0; i < n; i++) g.px(pts[i][0], pts[i][1], LINE);
    if (n < pts.length) {
      // 口が今の点に当たる。胴は右上へ逃がす。
      const [px, py] = pts[Math.max(0, n - 1)];
      g.px(px, py, BOTTLE_TIP);
      g.px(px + 1, py - 1, BOTTLE_TIP);
      g.rect(px + 2, py - 6, 3, 5, BOTTLE);
      g.vline(px + 4, py - 6, 5, BOTTLE_D);
    } else {
      // 描き終えたボトルは右上の隅に置く。
      g.px(62, 3, BOTTLE_TIP);
      g.rect(63, 0, 3, 3, BOTTLE);
      g.vline(65, 0, 3, BOTTLE_D);
    }

    // ── フライ返し（左のあき） ───────────────────────────
    // 柄が左、へらが右。題字の2行目と3行目のあいだに横たえる。
    g.hline(3, 25, 20, HANDLE);
    g.hline(3, 26, 20, HANDLE_D);
    g.rect(23, 24, 2, 4, TURNER_D);
    g.rect(25, 22, 9, 7, TURNER);
    g.hline(25, 28, 9, TURNER_D);
    for (const x of [27, 30]) g.vline(x, 23, 4, TURNER_D); // へらのすき間

    // ── 火加減のつまみ（右下） ───────────────────────────
    g.disc(63, 27, 3, KNOB_D);
    g.disc(63, 27, 2, KNOB);
    g.line(63, 27, 61, 25, "#3a3638");
    g.px(59, 30, FLAME); // 「強」の目印

    // ── 題字 ─────────────────────────────────────────────
    // 左に3行、8x8。主役の「パンケーキ」だけ生地の黄色。影は黒で右下に1px。
    misakiRow(g, 3, 3, T_A, INK, INK_SH);
    misakiRow(g, 3, 12, T_B, INK_HOT, INK_SH);
    misakiRow(g, 3, 31, T_C, INK, INK_SH);

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。生地の黄色に合わせる。
    g.frame(0, 0, 68, 40, INK_HOT);
    mark(g, INK_HOT, TOP);
  },
};
