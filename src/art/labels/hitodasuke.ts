import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { drawKosukumaSmall, KUMA, KUMA_SMALL_SIZE } from "../kosukuma";

// インスタント人助け — 半径500m・10分以内。報酬もポイントもない。
// 実物は地図アプリ。近くで上がった「助けて」に、となりさんが駆けつける。
// 絵にするのは駆けつける瞬間。夕方の町、赤いピン、地面に落ちた 500m の輪、
// その輪の内側を走ってくるこすくま。

const INK = "#2a1710";
const INK2 = "#5a3218";

const SKY0 = "#fdf1cc";
const SKY1 = "#fce3a4";
const SKY2 = "#f9c874";
const SKY3 = "#f4a54c";
const SKY4 = "#ee8a3a";
const SUN = "#ffe07a";
const SUN2 = "#fff8d2";

const BLD = "#a94d28";
const BLD_D = "#77341a";
const BLD_L = "#c56438";
const WIN = "#ffdc82";
const WIN_D = "#a2591f";

const GND = "#ac8f6d";
const GND_D = "#8a7053";
const GND_L = "#cdb591";
const CURB = "#6a533a";

const RED = "#d92c14";
const RED_D = "#8f1408";
const RED_L = "#f2705a";
const CREAM = "#f6e9c8";

// ── 和文の題字 ──────────────────────────────────────────
// 書体から起こした字母は「インクの外接矩形」で返ってくるので、
// 「ー」のように中ほどだけに墨のある字は行の上端に貼りついてしまう。
// 16px の枡の中に据え直すための落とし幅。
const JP_DROP: Record<string, number> = { ー: 7, 一: 7, ッ: 3, ェ: 5, の: 2, る: 2 };
function jp(g: PixelGfx, x: number, y: number, s: string, c: string, size: number, sp = 0) {
  let cx = x;
  for (const ch of s) {
    g.textJP(cx, y + Math.round(((JP_DROP[ch] ?? 0) * size) / 16), ch, c, { size });
    cx += size + sp;
  }
}
/** 8方向にふちを回してから塗る。夕空の上でも字が沈まない。 */
function jpEdge(
  g: PixelGfx,
  x: number,
  y: number,
  s: string,
  fill: string,
  edge: string,
  size = 16,
  sp = 0,
) {
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
    jp(g, x + dx, y + dy, s, edge, size, sp);
  jp(g, x, y, s, fill, size, sp);
}

// ── こすくまくんの置き場所 ──────────────────────────────
// 正しいこすくまくんは小さい版でも丈 26。夕空の題字（16px＝丈16）と縦に
// 並べると 26+16=42 でラベルの 40 を超えるので、両方を上下に積むことはできない。
// そこで題字を横へどかし、こすくまくんは左端に丸ごと立たせた。
// 題字は 13px（textJP の下限）まで落として、くまと赤ピンのあいだに収めてある。
const BX = 3; // 外周の枠から1pxあける。20px幅の字形は2だと枠に触る
const BY = 31 - KUMA_SMALL_SIZE.h;

// 助けを求めている人。片手を挙げている。
const PERSON = [
  "...KKK...",
  "..KSSSK..",
  "..KSNSK..",
  "..KSSSK..",
  "...KKK...",
  "KK..KCK..",
  "KSKKCCCK.",
  ".KKCCCCK.",
  "..KCCCDK.",
  "..KCDDDK.",
  "..KTTTK..",
  "..KTK.KTK",
  "..KKK.KKK",
];
const CASE = [".KKKK.", "KLLLLK", "KMMMMK", "KBBBBK", "KBBBBK", "KKKKKK"];

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

export const art: LabelArt = {
  slug: "hitodasuke",
  swatch: ["#f4a54c", "#d92c14", KUMA.fill, "#2a1710", "#c8b298"],
  draw: (g, t) => {
    // ── 空 ────────────────────────────────────────────────
    g.rect(0, 0, 68, 22, SKY0);
    g.rect(0, 5, 68, 17, SKY1);
    g.rect(0, 5, 68, 3, SKY0, "half");
    g.rect(0, 11, 68, 11, SKY2);
    g.rect(0, 11, 68, 3, SKY1, "half");
    g.rect(0, 16, 68, 6, SKY3);
    g.rect(0, 16, 68, 2, SKY2, "half");
    g.rect(0, 20, 68, 2, SKY4);
    g.rect(0, 20, 68, 1, SKY3, "half");

    // 夕方の太陽。こすくまくんが左端いっぱいに立つので、その頭の上へ逃がした。
    // 耳の後ろから半分だけ覗く。
    g.disc(7, 2, 5, SUN);
    g.disc(6, 1, 3, SUN2);
    g.hline(13, 1, 2, SUN);
    g.hline(14, 5, 3, SUN);
    g.px(1, 8, SUN);
    g.px(2, 8, SUN);
    g.px(12, 8, SUN);

    // 鳥
    g.px(46, 3, INK2);
    g.px(47, 2, INK2);
    g.px(48, 3, INK2);
    g.px(41, 6, INK2);
    g.px(42, 5, INK2);
    g.px(43, 6, INK2);

    // ── 町なみ ────────────────────────────────────────────
    const blds: Array<[number, number, number]> = [
      [0, 15, 7],
      [6, 12, 8],
      [13, 16, 6],
      [18, 13, 9],
      [26, 17, 7],
      [32, 14, 8],
      [39, 16, 6],
      [44, 12, 9],
      [52, 15, 7],
      [58, 13, 10],
    ];
    for (const [bx, by, bw] of blds) {
      const h = 22 - by;
      g.rect(bx, by, bw, h, BLD);
      g.vline(bx, by, h, BLD_L);
      g.vline(bx + bw - 1, by, h, BLD_D);
      g.hline(bx, by, bw, BLD_D);
      g.hline(bx + 1, by + 1, bw - 2, BLD_L);
      for (let wy = by + 3; wy < 21; wy += 3)
        for (let wx = bx + 2; wx < bx + bw - 1; wx += 2)
          g.px(wx, wy, (wx * 7 + wy * 3) % 5 === 0 ? WIN_D : WIN);
    }
    // 電柱と電線
    g.vline(30, 10, 12, INK2);
    g.hline(28, 12, 5, INK2);
    g.line(31, 13, 67, 10, INK2);
    g.line(0, 11, 29, 13, INK2);

    // ── 地面 ──────────────────────────────────────────────
    g.rect(0, 22, 68, 11, GND);
    g.hline(0, 22, 68, CURB);
    g.hline(0, 23, 68, GND_L);
    g.hline(0, 24, 68, "#bda07c");
    g.rect(0, 28, 68, 5, GND_D);
    g.hline(0, 28, 68, CURB);
    g.hline(0, 29, 68, "#9c8265");
    // 舗石の目地
    for (let x = 1; x < 68; x += 7) g.vline(x, 25, 3, "#96795a");
    for (let x = 4; x < 68; x += 9) g.vline(x, 30, 3, "#755c40");
    // マンホール
    g.ellipse(30, 26, 3, 1, "#6a533a");
    g.px(29, 26, GND_L);
    g.px(31, 26, GND_L);

    // 半径 500m の輪。この内側にいるふたりが、つながる。
    groundRing(g, 33, 27, 34, 4, "#fff6dc", "#5c4630");

    // 走ってきた足あと。こすくまから、助けを求めた人へ続く。
    // 動き2: 先頭の1歩だけが明るく点る。経路が引かれていく地図の見え方。
    for (let i = 0; i < 6; i++) {
      const x = 22 + i * 4;
      const y = 31 - (i % 2) * 2;
      const lit = Math.floor(t * 6) === i;
      const c = lit ? "#fff1c4" : "#6a533a";
      g.px(x, y, c);
      g.px(x + 1, y, c);
      g.px(x, y - 1, c);
      g.px(x + 1, y + 1, lit ? "#e8c98a" : "#8a7053");
    }

    // 街かどの案内標識。地図アプリの絵なので、方角の板を立てる。
    g.vline(36, 22, 11, "#4a3a2a");
    g.vline(37, 22, 11, "#7a6448");
    g.hline(34, 32, 5, "#4a3a2a");
    g.rect(29, 15, 14, 7, "#2a1710");
    g.rect(30, 16, 12, 5, "#2f5a9e");
    g.hline(30, 16, 12, "#4a7cc4");
    g.hline(31, 20, 10, "#1e3c70");
    g.rect(31, 18, 4, 1, CREAM);
    g.px(31, 17, "#a8c4e8");
    g.px(33, 17, "#a8c4e8");
    // 右をさす矢印
    g.hline(36, 18, 4, CREAM);
    g.px(38, 17, CREAM);
    g.px(38, 19, CREAM);
    g.px(39, 18, CREAM);

    // 消火栓
    g.rect(25, 27, 4, 6, "#8f1408");
    g.rect(26, 28, 2, 5, RED);
    g.px(26, 28, RED_L);
    g.hline(24, 29, 6, "#8f1408");
    g.hline(25, 26, 2, "#8f1408");
    g.hline(24, 33, 6, "#5a2510");

    // ── 助けを求める人と荷物 ─────────────────────────────
    // ピンの真下に頭が来るよう、人は右へ、荷物は左へ入れ替えた。
    g.ellipse(60, 32, 5, 1, "#00000038");
    g.ellipse(50, 32, 3, 1, "#00000038");
    g.blit(56, 20, PERSON, {
      K: INK,
      S: "#f2b98a",
      N: "#c98a5e",
      C: "#3f74b8",
      D: "#2b4f86",
      T: "#3a3a4a",
    });
    g.blit(48, 27, CASE, { K: INK, B: "#a8641f", L: "#d59a4a", M: "#f0c070" });
    g.px(50, 26, INK);
    g.px(51, 26, INK);

    // ── 赤いピン ──────────────────────────────────────────
    // 題字を左へ通すために、もとの位置から3px右・1px下へずらしてある。
    // 合図は輪になって外へ広がる（この絵で動くのはここだけ）
    // 半径を1つ落として右上へ寄せた。もとの大きさ・位置だと題字の「け」と
    // 赤どうしが重なって、風船と字が1つの赤い塊に見えたため。
    const PX0 = 59;
    const PY0 = 8;
    for (let k = 0; k < 3; k++) {
      const p = (t + k / 3) % 1;
      const r = 8 + Math.floor(p * 4);
      const c = p < 0.4 ? RED : p < 0.75 ? RED_L : "#f9c2b2";
      for (let a = -55; a <= 55; a += 7) {
        const rad = (a * Math.PI) / 180;
        g.px(PX0 + Math.round(Math.sin(rad) * r), PY0 - Math.round(Math.cos(rad) * r), c);
      }
    }

    g.poly(
      [
        [PX0 - 6, PY0 + 2],
        [PX0 + 6, PY0 + 2],
        [PX0, PY0 + 10],
      ],
      INK,
    );
    g.disc(PX0, PY0, 5, INK);
    g.poly(
      [
        [PX0 - 5, PY0 + 2],
        [PX0 + 5, PY0 + 2],
        [PX0, PY0 + 8],
      ],
      RED,
    );
    g.disc(PX0, PY0, 4, RED);
    g.disc(PX0 - 2, PY0 - 2, 1, RED_L);
    g.px(PX0 - 3, PY0 - 3, "#ffc8b8");
    g.rect(PX0 - 4, PY0 + 3, 9, 3, RED_D, "half");
    // ピンの中の「!」
    g.vline(PX0, PY0 - 3, 3, CREAM);
    g.px(PX0, PY0 + 1, CREAM);

    // ── 題字 ──────────────────────────────────────────────
    // 赤にクリームのふちを回す。夕焼けのどの段の上でも字が沈まない組み合わせ。
    // こすくまくん（x1..18）と赤ピン（x54..）のあいだ、x17..55 に納める。
    jpEdge(g, 17, 2, "人助け", RED, CREAM, 13);

    // ── こすくまくん。駆けつける。 ───────────────────────
    // 姿は kosukuma.ts が正解。ここでは置くだけ。ほお紅も口も足さない。
    // 題字より手前に置く。夕空の題字がくまの背に回るのは実機の作法どおり。
    g.ellipse(BX + 8, 32, 8, 1, "#00000040");
    drawKosukumaSmall(g, BX, BY);
    // 駆けつけてきた砂ぼこり。左足の後ろから
    g.px(1, 31, "#ffffff");
    g.px(0, 30, GND_L);
    g.px(20, 31, GND_L);
    g.px(21, 30, "#ffffff");

    // ── 下の帯 ────────────────────────────────────────────
    // 型番は外装の下帯に刻印されているので、ラベルには入れない。
    // 性能の表記だけを、右端まで詰めずに置く。
    g.rect(0, 33, 68, 7, INK);
    g.hline(0, 33, 68, INK2);
    g.hline(0, 34, 68, "#6b3c1c", "half");
    g.text3x5(2, 34, "500M 10MIN", CREAM);

    // ── ふち ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, INK);
    mark(g, CREAM, INK);
  },
};

/** 地面に置いた輪。透視で潰れた楕円を破線で。 */
function groundRing(
  g: PixelGfx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  c: string,
  cs: string,
) {
  for (let x = -rx; x <= rx; x++) {
    const k = 1 - (x * x) / (rx * rx);
    if (k < 0) continue;
    const dy = Math.round(ry * Math.sqrt(k));
    if ((((x + 100) / 2) | 0) % 2 === 0) {
      g.px(cx + x, cy + dy, c);
      g.px(cx + x, cy + dy + 1, cs);
      g.px(cx + x, cy - dy, c);
      g.px(cx + x, cy - dy + 1, cs);
    }
  }
}
