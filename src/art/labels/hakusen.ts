import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// 白線になる — 全身まっ白になって、コートの白線にまぎれこむ。
// 見られている間は止まって白線のふり。何秒バレずにいられるか。
//
// 図の骨組み: 実物のサムネイルどおり、オレンジのコートと青緑の外。
//   いちばん下の横いっぱいに、コートのふちの白線。そこに白い人が寝そべっている。
//   コートの上には紫のユニフォームの選手が2人。
//   題字は実物と同じく白い札に「［白線］になる」（白線だけ黒地に白抜き）。
//
// 動くもの（1周3秒・12コマ）: 前半の6コマは、白い人が白線の上を這って進む
//   （手足がばたつき、口が「o」）。後半の6コマは、右の選手がこちらを見る。
//   頭の上に赤い目が出て、視線の光線が白い人に刺さる。白い人はぴたりと止まり、
//   手足を線にそろえて「−−」の顔で白線のふりをする。

const COURT = "#f2964c";
const COURT_D = "#e8873e";
const OUT = "#3a98a4";
const OUT_D = "#2f8692";
const LINE = "#ffffff";
const BODY = "#ffffff";
const BODY_D = "#d5dbe2";
const FACE = "#2a2a2e";
const BLUSH = "#ff9a9a";
const INK = "#1e1e22";
const SHIRT = "#7a4cc8";
const SHIRT_D = "#5a34a0";
const SHORTS = "#1e2238";
const SKIN = "#e8b088";
const HAIR = "#5a3420";
const SHOE = "#2a2a2e";
const EYE_RED = "#e8303a";
const GLARE = "#ff4a4a";
const GLARE_Y = "#ffd84a";
const SHADOW = "#00000030";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

const SIDELINE = 29; // コートのふちの白線（2行: 29, 30）
const END_X = 62; // コートの右のふち（縦の白線 62, 63）

// 白い人の頭の x。前半6コマで進み、後半6コマは止まる
const HEAD_X = [12, 15, 18, 21, 24, 27, 30, 30, 30, 30, 30, 30];

/** 選手（5x11）。正面向き */
const PLAYER = [
  ".hhh.",
  ".sss.",
  "SPPPS",
  "sPPPs",
  ".PDP.",
  ".BBB.",
  ".B.B.",
  ".s.s.",
  ".s.s.",
  ".k.k.",
  "",
];
function player(g: PixelGfx, x: number, y: number) {
  g.ellipse(x + 2, y + 10, 3, 1, SHADOW);
  g.blit(x, y, PLAYER, {
    h: HAIR,
    s: SKIN,
    S: SHIRT_D,
    P: SHIRT,
    D: SHIRT_D,
    B: SHORTS,
    k: SHOE,
  });
}

/** 赤い目（7x5）。見られている合図 */
const EYE = ["..rrr..", ".r...r.", "r..R..r", ".r...r.", "..rrr.."];

export const art: LabelArt = {
  slug: "hakusen",
  swatch: [COURT, OUT, LINE, SHIRT, EYE_RED],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    const watched = f >= 6;

    // ── コートと外 ───────────────────────────────────────
    g.rect(0, 0, 68, 40, OUT);
    g.rect(0, 33, 68, 7, OUT_D, "quarter");
    g.rect(0, 0, END_X, SIDELINE, COURT);
    for (let y = 1; y < SIDELINE; y += 4) g.hline(0, y, END_X, COURT_D, "half");
    // 白線: 下のふち（横いっぱい）と右のふち、コートの中のアタックライン
    g.rect(0, SIDELINE, 68, 2, LINE);
    g.rect(END_X, 0, 2, SIDELINE, LINE);
    g.hline(0, 19, END_X, LINE);

    // ── 題字の札「［白線］になる」 ───────────────────────
    g.rect(3, 2, 48, 13, "#00000030"); // 影
    g.rect(2, 1, 48, 13, INK);
    g.rect(3, 2, 46, 11, "#fbfaf6");
    g.rect(4, 3, 19, 9, INK); // 「白線」だけ黒地に白抜き（実物は枠囲み。8pxでは枠が字に接するので）
    misakiRow(g, 6, 4, "白線", "#fbfaf6");
    misakiRow(g, 25, 4, "になる", INK);

    // ── 選手 ─────────────────────────────────────────────
    player(g, 8, 16);
    const PX = 54;
    const PY = 15;
    player(g, PX, PY);

    // ── 白い人 ───────────────────────────────────────────
    const hx = HEAD_X[f];
    const y0 = SIDELINE; // 胴は白線とぴったり重なる
    // 胴と脚。白線と同じ白なので、ふちの薄い陰だけで形が分かる
    g.hline(hx - 13, y0 - 1, 11, BODY_D);
    g.hline(hx - 13, y0 + 2, 11, BODY_D);
    g.rect(hx - 13, y0, 11, 2, BODY);
    if (!watched) {
      // 這っている: 手足が線からはみ出してばたつく
      const up = f % 2 === 0;
      g.line(hx - 13, y0, hx - 17, up ? y0 - 3 : y0 - 1, BODY); // 脚
      g.line(hx - 13, y0 + 1, hx - 17, up ? y0 + 2 : y0 + 4, BODY);
      g.line(hx - 4, y0, hx - 1, up ? y0 - 4 : y0 - 2, BODY); // 腕
      g.line(hx - 4, y0 + 1, hx - 1, up ? y0 + 4 : y0 + 2, BODY);
      // 進んだあとの擦れ
      g.px(hx - 19, y0 - 1, BODY_D);
      g.px(hx - 21, y0 + 2, BODY_D);
    } else {
      // 白線のふり: 手足をまっすぐ線にそろえる
      g.rect(hx - 19, y0, 6, 2, BODY);
      g.hline(hx - 19, y0 - 1, 6, BODY_D);
    }
    // 頭
    g.disc(hx, y0 + 0.5, 3, BODY);
    g.ring(hx, y0 + 0.5, 3, BODY_D);
    if (!watched) {
      g.px(hx - 1, y0 - 1, FACE);
      g.px(hx + 1, y0 - 1, FACE);
      g.px(hx, y0 + 1, FACE); // 口「o」
      g.px(hx, y0 + 2, FACE);
    } else {
      g.hline(hx - 2, y0, 2, FACE); // 「−−」
      g.hline(hx + 1, y0, 2, FACE);
      g.px(hx - 2, y0 + 2, BLUSH);
      g.px(hx + 2, y0 + 2, BLUSH);
    }

    // ── 見られている ─────────────────────────────────────
    if (watched) {
      // 視線の光線。選手の目から白い人の頭へ。根元は黄、先は赤
      const sx = PX + 2;
      const sy = PY + 1;
      const n = 24;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = Math.round(sx + (hx - sx) * u);
        const y = Math.round(sy + (y0 - 2 - sy) * u);
        g.px(x, y, u < 0.45 ? GLARE_Y : GLARE);
      }
      // 白い人のまわりの赤いにじみ
      for (const [dx, dy] of [
        [-4, -2],
        [4, -2],
        [-5, 1],
        [5, 1],
        [0, -4],
      ])
        g.px(hx + dx, y0 + dy, "#ff4a4a66");
      // 頭の上の赤い目。コマごとに1行ずつ開く
      const open = Math.min(5, f - 5);
      g.blit(PX - 1, 7 + Math.floor((5 - open) / 2), EYE.slice(Math.floor((5 - open) / 2), Math.floor((5 - open) / 2) + open), {
        r: EYE_RED,
        R: INK,
      });
    }

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。札の墨に合わせる。
    g.frame(0, 0, 68, 40, INK);
    mark(g, LINE, INK);
  },
};
