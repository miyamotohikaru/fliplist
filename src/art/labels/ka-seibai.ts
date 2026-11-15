import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// オフィスに侵入した蚊を成敗する。— オフィスに入った蚊1匹を、
// 一人称で、自分の手ではじいてパチンと仕留める。
//
// 図の骨組み: 実物の見せ場の一枚（OGの絵）そのまま。
//   クリーム色のオフィスの壁、手前に深緑のデスクマット、
//   奥の席に部長（はげ頭・丸めがね・紺の背広・赤いネクタイ）。
//   手前の下ふちから、こちらの両手がのぞく（一人称）。
//   題字は実物の題字どおり、上2行が墨・最後の1行が赤、白でふちどる。
//
// 動くもの（1周3秒・12コマ）: 0コマ目（止まっているときの絵）は、
//   右手が部長の頭をパチン！と叩いた瞬間。蚊はその手の下から逃げ出して、
//   オフィスをぶんぶん飛び回り、また部長の頭にとまる。
//   右手が振りかぶって、もう一度パチン。

const WALL = "#efe8da";
const WALL_D = "#e1d8c6";
const SEAM = "#e6dece";
const DESK = "#6e4529";
const DESK_L = "#8f5d37";
const MAT = "#2f5541";
const MAT_L = "#3d6b53";
const SKIN = "#f6cba2";
const SKIN_L = "#ffe4c8";
const SKIN_D = "#d9a176";
const HAIR = "#b7b3ab";
const HAIR_D = "#8e8a83";
const GLASS = "#2b2724";
const SUIT = "#22305e";
const SUIT_L = "#33467f";
const SUIT_D = "#18213f";
const SHIRT = "#ffffff";
const TIE = "#d8302c";
const TIE_D = "#a51f1c";
const INK = "#2a2622";
const RED = "#e0322c";
const WHITE = "#ffffff";
const BURST = "#ffd93a";
const BUMP = "#f08a7a";
const MOS = "#2b2724";
const MOS_W = "#ffffff";
const WING = "#cfd8e2";
const TRAIL = "#b9b0a0";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

/** 白い縁どりの題字。8方向に白を刷ってから本体の色 */
function title(
  g: PixelGfx,
  x: number,
  y: number,
  text: string,
  c: string,
  edge = WHITE,
) {
  for (const [dx, dy] of [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ])
    misakiRow(g, x + dx, y + dy, text, edge);
  misakiRow(g, x, y, text, c);
}

// 部長の頭の中心と半径
const HX = 50;
const HY = 13;
const HR = 8;

// 手の甲（指を上に向けた手）。左手の形。右手は左右を返す。
const HAND = [
  ".s.s.s..",
  ".sdsdsd.",
  ".sdsdsd.",
  "ssssssd.",
  "sssssss.ss",
  "ssssssssd.",
  ".sssssssd.",
  ".ssssssd..",
  "..sssssd..",
];
function hand(g: PixelGfx, x: number, y: number, flip: boolean) {
  const rows = flip
    ? HAND.map((r) => [...r.padEnd(10, ".")].reverse().join(""))
    : HAND;
  g.blit(x, y, rows, { s: SKIN, d: SKIN_D });
}

// 叩いた手（頭の上にかぶさる手のひら。指は左向き）。腕は右のふちから。
function slapHand(g: PixelGfx) {
  // 腕: 右のふちから頭の上へ。袖口は白いシャツ
  g.rect(57, 1, 11, 5, SKIN);
  g.hline(57, 5, 11, SKIN_D);
  g.rect(62, 0, 6, 7, SHIRT);
  g.vline(62, 0, 7, "#d9dde3");
  g.rect(65, 0, 3, 7, SUIT);
  // 手のひら
  g.blit(
    42,
    0,
    [
      "...ssssssssssssss",
      "sssssssssssssssss",
      ".dddddsssssssssss",
      "sssssssssssssssss",
      ".ddddssssssssssss",
      "...sssssssssssssd",
      "......sssssssssd.",
    ],
    { s: SKIN, d: SKIN_D },
  );
  g.hline(47, 0, 8, SKIN_L);
}

// 蚊（左向き）。羽はコマごとにぱたぱた。(x, y) は胴の左はし
function mosquito(
  g: PixelGfx,
  x: number,
  y: number,
  flap: boolean,
  sit = false,
) {
  const wing = sit
    ? ["...ww...", "....ww.."]
    : flap
      ? ["..www...", "...ww..."]
      : ["........", "..wwww.."];
  g.blit(x, y - 2, wing, { w: WING });
  g.blit(x - 2, y, ["kkkkkwkwk", "..k.k.k.."], { k: MOS, w: MOS_W });
  if (!sit) g.blit(x, y + 2, [".k...k"], { k: MOS });
}

// 蚊のいる場所（コマごと）。null は手の下に隠れている
const FLY: Array<[number, number] | null> = [
  null,
  null,
  [56, 2],
  [59, 9],
  [58, 18],
  [45, 2],
  [36, 14],
  [57, 3],
  [52, 1],
  [48, 4],
  [48, 4],
  [48, 4],
];

function boss(g: PixelGfx, f: number) {
  // 背広の肩と胴
  g.poly(
    [
      [35, 31],
      [36, 26],
      [41, 22],
      [59, 22],
      [64, 26],
      [65, 31],
    ],
    SUIT,
  );
  g.line(41, 23, 37, 26, SUIT_L);
  g.vline(36, 27, 4, SUIT_L);
  g.vline(64, 27, 4, SUIT_D);
  // シャツとネクタイ
  g.poly(
    [
      [46, 22],
      [54, 22],
      [50, 29],
    ],
    SHIRT,
  );
  g.vline(50, 23, 8, TIE);
  g.hline(49, 23, 3, TIE);
  g.vline(51, 25, 6, TIE_D);
  // 襟
  g.line(45, 22, 49, 28, SUIT_D);
  g.line(55, 22, 51, 28, SUIT_D);

  // 首と頭
  g.rect(47, 21, 7, 2, SKIN_D);
  g.disc(HX, HY, HR, SKIN);
  g.hline(HX - 4, HY + HR, 9, SKIN_D);
  // 耳
  g.rect(HX - HR - 1, HY - 1, 1, 4, SKIN_D);
  g.rect(HX + HR + 1, HY - 1, 1, 4, SKIN_D);
  // 横の白髪
  g.rect(HX - HR, HY - 3, 2, 6, HAIR);
  g.rect(HX + HR - 1, HY - 3, 2, 6, HAIR);
  g.px(HX - HR + 2, HY - 3, HAIR);
  g.px(HX + HR - 2, HY - 3, HAIR);
  g.vline(HX - HR, HY + 1, 2, HAIR_D);
  g.vline(HX + HR, HY + 1, 2, HAIR_D);
  // 頭のてかり
  g.hline(HX - 4, HY - 6, 3, SKIN_L);
  g.px(HX - 5, HY - 5, SKIN_L);
  // 丸めがね（中は肌が透ける）
  g.frame(HX - 6, HY - 1, 5, 4, GLASS);
  g.frame(HX + 2, HY - 1, 5, 4, GLASS);
  g.hline(HX - 1, HY, 3, GLASS);
  for (const x of [HX - 6, HX - 2, HX + 2, HX + 6]) {
    g.px(x, HY - 1, null);
    g.px(x, HY + 2, null);
  }
  // 目。叩かれた瞬間は ><
  if (f <= 1) {
    g.blit(
      HX - 5,
      HY,
      ["#..", ".##", "#.."].map((r) => r),
      { "#": GLASS },
    );
    g.blit(HX + 3, HY, ["..#", "##.", "..#"], { "#": GLASS });
  } else {
    g.rect(HX - 4, HY, 1, 2, GLASS);
    g.rect(HX + 4, HY, 1, 2, GLASS);
  }
  // 眉
  g.hline(HX - 5, HY - 3, 3, HAIR_D);
  g.hline(HX + 3, HY - 3, 3, HAIR_D);
  // 口
  if (f <= 1) {
    g.rect(HX - 1, HY + 4, 3, 2, "#8a3a2a");
  } else {
    g.hline(HX - 1, HY + 5, 3, SKIN_D);
  }
  // 叩かれたあとのたんこぶ（赤み）
  if (f >= 2 && f <= 4) {
    g.hline(HX - 1, HY - 8, 4, BUMP);
    g.hline(HX - 2, HY - 7, 6, BUMP);
  }
  // 机に置いた手
  g.rect(39, 29, 6, 2, SKIN);
  g.rect(56, 29, 6, 2, SKIN);
}

// 叩いた瞬間の放射線
function burst(g: PixelGfx, f: number) {
  const cx = 50;
  const cy = 5;
  const len = f === 0 ? 1 : 0.6;
  const rays: Array<[number, number]> = [
    [-1, -0.3],
    [-1, 0.5],
    [-0.6, 1],
    [0.7, 1],
    [1, 0.45],
    [-0.3, -1],
    [0.4, -1],
  ];
  for (const [dx, dy] of rays) {
    const x0 = Math.round(cx + dx * 10);
    const y0 = Math.round(cy + dy * 6);
    const x1 = Math.round(cx + dx * (10 + 6 * len));
    const y1 = Math.round(cy + dy * (6 + 4 * len));
    g.line(x0, y0, x1, y1, BURST);
  }
}

export const art: LabelArt = {
  slug: "ka-seibai",
  swatch: [WALL, MAT, SUIT, TIE, SKIN],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;

    // ── オフィスの壁 ─────────────────────────────────────
    g.rect(0, 0, 68, 40, WALL);
    for (const x of [17, 34]) g.vline(x, 0, 25, SEAM);
    g.rect(0, 25, 68, 6, WALL_D);
    g.hline(0, 25, 68, "#d3c8b3");

    // ── 部長 ─────────────────────────────────────────────
    boss(g, f);

    // ── デスク ───────────────────────────────────────────
    g.rect(0, 31, 68, 9, MAT);
    g.hline(0, 31, 68, DESK_L);
    g.hline(0, 32, 68, DESK);
    g.hline(0, 33, 68, MAT_L);

    // ── 蚊 ───────────────────────────────────────────────
    const p = FLY[f];
    const prev = FLY[(f + 11) % 12];
    if (p) {
      // 飛んできた跡を点線で
      if (prev && (prev[0] !== p[0] || prev[1] !== p[1])) {
        const n = 6;
        for (let i = 1; i < n; i += 1) {
          const x = Math.round(prev[0] + ((p[0] - prev[0]) * i) / n + 2);
          const y = Math.round(prev[1] + ((p[1] - prev[1]) * i) / n);
          if (i % 2 === 1) g.px(x, y, TRAIL);
        }
      }
      mosquito(g, p[0], p[1], f % 2 === 0, f >= 9);
    }

    // ── こちらの手 ───────────────────────────────────────
    hand(g, 5, 32, false);
    if (f <= 1) {
      slapHand(g);
      burst(g, f);
    } else if (f === 10) {
      // 振りかぶる
      hand(g, 56, 22, true);
    } else if (f === 11) {
      // 振り下ろす途中。速さの線
      hand(g, 52, 6, true);
      g.line(58, 16, 62, 26, WHITE);
      g.line(61, 15, 65, 24, WHITE);
    } else {
      hand(g, 22, 32, true);
    }

    // ── 題字 ─────────────────────────────────────────────
    title(g, 2, 2, "オフィスに", INK);
    title(g, 2, 11, "侵入した", INK);
    title(g, 2, 21, "蚊を成敗する。", RED);

    // 叩いた音
    if (f <= 1) title(g, 34, 32, "パチン", WHITE, RED);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, INK);
    mark(g, WHITE, INK);
  },
};
