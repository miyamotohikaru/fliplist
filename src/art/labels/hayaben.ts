import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// 学校でバレないように早弁するゲーム — 授業中、教科書の陰でこっそり早弁。
// 先生が振り向いたら手を止めて隠す。バレたら即終了。
//
// 図の骨組み: 自分の席から前を見る（一人称）。
//   上は教室の黒板。題字は先生がチョークで書いたように黒板に書く。
//   実物の題字どおり「学校でバレないように」は白、「早弁するゲーム」はクリーム色に
//   赤茶の影（実物のロゴの色）。
//   **主役は弁当**（2026-11-20 ユーザー「もっと弁当を大きくして注目させたい」）。
//   机いっぱいの赤い弁当箱に、白いごはん（梅干し・ごま）、卵焼き、からあげ、
//   たこさんウインナー、ブロッコリー、ミニトマト。左に立てた教科書、右下から自分の手と箸。
//   黒板の右はしに先生（白いシャツ・めがね）。**見張っている様子を見せる**
//   （同「先生が見ている様子も」）: こちらを向いて腕を組み、めがねの奥の目が左右に動く。
//
// 動くもの（1周3秒・12コマ）:
//   0〜2コマ目 先生がじーっと見張る（目が左右に動く）。手はひっこめて固まる。
//               0コマ目＝止まっているときの絵は、弁当と見張る先生の両方が見える。
//   3コマ目     先生が黒板を向く。
//   4〜8コマ目  そのすきに早弁。箸でおかずをつまむたび、弁当が減っていく。
//   9コマ目     先生が振り向きかける。
//   10〜11コマ目 また見張る。頭の横に「！？」、手はさっとひっこめる。

const BOARD = "#2c5440";
const BOARD_L = "#36634c";
const BOARD_D = "#22432f";
const BOARD_RIM = "#8a6a44";
const BOARD_RIM_D = "#64492c";
const TRAY = "#a9a59c";
const CHALK = "#f4f1e6";
const CHALK_SH = "#1c3628";
const TITLE_C = "#fbe6a8";
const TITLE_SH = "#b5432c";
const DESK = "#d9b47e";
const DESK_L = "#e8c895";
const DESK_D = "#b89058";
const COVER = "#2f4a6e";
const COVER_D = "#22365a";
const PAGE = "#fbf8ee";
const PAGE_D = "#ddd8c8";
const PAGE_LINE = "#a8b0bc";
const BOX = "#d0342c";
const BOX_L = "#ec5a48";
const BOX_D = "#8f1f1c";
const BOX_IN = "#6e1614";
const RICE = "#ffffff";
const RICE_D = "#e4e0d6";
const SESAME = "#2a2420";
const UME = "#d4304a";
const UME_L = "#f06a80";
const EGG = "#f7cf3a";
const EGG_L = "#ffe680";
const EGG_D = "#d9a91e";
const KARA = "#b8702c";
const KARA_L = "#d89448";
const KARA_D = "#7e4618";
const WIENER = "#e8483a";
const WIENER_D = "#b02a22";
const BROC = "#4f9a3a";
const BROC_L = "#74c254";
const BROC_D = "#2f6a22";
const TOMATO = "#e4262a";
const LETTUCE = "#8fd05a";
const SKIN = "#f4c9a0";
const SKIN_D = "#d69c70";
const HAIR = "#1d1b1e";
const SHIRT = "#e4ebe6";
const SHIRT_D = "#b9c6bd";
const TIE = "#3a5a8a";
const GLASS = "#2a2a2a";
const LENS = "#dfeef4";
const HASHI = "#7a4a22";
const HASHI_L = "#a8703a";
const ALERT = "#ff3b2f";
const EDGE = "#1c2e24";
const WHITE = "#ffffff";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

/** チョークの字。1px 右下に影を落とす */
function chalk(
  g: PixelGfx,
  x: number,
  y: number,
  text: string,
  c: string,
  sh: string,
) {
  misakiRow(g, x + 1, y + 1, text, sh);
  misakiRow(g, x, y, text, c);
}

type Pose = "watch" | "back" | "turn";

/**
 * 先生（黒板の右はし）。
 * watch=こちらを向いて腕組み。look は目の向き（-1 左・0 正面・1 右）
 */
function teacher(g: PixelGfx, pose: Pose, look: number) {
  const x = 59; // 頭の左はし（幅8、右はしはふちで切れる）
  // 胴
  g.rect(x - 1, 11, 10, 15, SHIRT);
  g.vline(x - 1, 11, 15, SHIRT_D);
  if (pose === "back") {
    // うしろ姿。チョークを持った手を「学校で」の右の空きへ上げる
    g.rect(x, 2, 8, 9, HAIR);
    g.px(x - 1, 6, SKIN_D);
    g.rect(x - 3, 7, 3, 4, SHIRT);
    g.rect(x - 5, 4, 3, 3, SHIRT);
    g.rect(x - 7, 2, 3, 2, SKIN);
    g.px(x - 8, 2, CHALK);
    g.px(x - 8, 3, CHALK);
    g.vline(x + 3, 12, 13, SHIRT_D);
    return;
  }
  if (pose === "turn") {
    // 横顔（振り向きかけ）
    g.rect(x, 2, 8, 9, SKIN);
    g.rect(x, 2, 8, 3, HAIR);
    g.rect(x + 4, 2, 4, 9, HAIR);
    g.rect(x, 6, 2, 2, GLASS);
    g.px(x - 1, 8, SKIN_D);
    g.vline(x + 3, 12, 13, SHIRT_D);
    return;
  }
  // ── 見張る（正面・腕組み）──
  // ネクタイ
  g.vline(x + 3, 11, 5, TIE);
  g.vline(x + 4, 11, 5, TIE);
  // 頭（見張るときは1px左へ大きく。題字の「に」の右どなりまで）
  const hx = x - 1;
  g.rect(hx, 1, 9, 10, SKIN);
  g.rect(hx, 1, 9, 2, HAIR);
  g.vline(hx, 3, 2, HAIR);
  g.vline(hx + 8, 3, 2, HAIR);
  // にらむ眉（内側が下がる）
  g.hline(hx + 1, 3, 2, HAIR);
  g.px(hx + 3, 4, HAIR);
  g.px(hx + 5, 4, HAIR);
  g.hline(hx + 6, 3, 2, HAIR);
  // めがね（白目＋黒目）。黒目が左右に動いて、じーっと探す
  g.frame(hx, 4, 5, 4, GLASS);
  g.frame(hx + 4, 4, 5, 4, GLASS);
  for (const ex of [hx + 1, hx + 5]) {
    g.rect(ex, 5, 3, 2, WHITE);
    g.vline(ex + 1 + look, 5, 2, HAIR);
  }
  g.px(hx + 1, 5, LENS); // めがねの光
  // へ の字の口
  g.hline(hx + 3, 9, 3, SKIN_D);
  g.px(hx + 2, 10, SKIN_D);
  g.px(hx + 6, 10, SKIN_D);
  // 腕組み
  g.rect(x - 1, 15, 10, 4, SHIRT_D);
  g.hline(x - 1, 15, 10, SHIRT);
  g.rect(x, 16, 2, 2, SKIN);
  g.rect(x + 6, 16, 2, 2, SKIN);
}

/** 立てた教科書（こちらから見えるのは中のページ） */
function textbook(g: PixelGfx) {
  const x = 1;
  const y = 25;
  g.rect(x, y, 10, 14, COVER);
  g.vline(x + 9, y, 14, COVER_D);
  g.rect(x + 1, y + 1, 8, 12, PAGE);
  g.vline(x + 4, y + 1, 12, PAGE_D);
  for (let i = 0; i < 5; i++) {
    g.hline(x + 2, y + 3 + i * 2, 2, PAGE_LINE);
    g.hline(x + 6, y + 3 + i * 2, 2, PAGE_LINE);
  }
}

// 弁当箱の位置。机の幅いっぱい（教科書の右から手の手前まで）
const BX = 12;
const BY = 25;
const BW = 44;
const BH = 14;

/** おかず。食べる順に並べる（0 から） */
type Okazu = (g: PixelGfx) => void;
const OKAZU: Okazu[] = [
  // 卵焼き（2切れ。断面のうずまき）
  (g) => {
    for (const ox of [BX + 21, BX + 26]) {
      g.rect(ox, BY + 2, 5, 5, EGG);
      g.hline(ox, BY + 2, 5, EGG_L);
      g.vline(ox + 4, BY + 3, 4, EGG_D);
      g.hline(ox + 1, BY + 4, 2, EGG_D);
      g.px(ox + 2, BY + 5, EGG_D);
    }
  },
  // からあげ（2こ）
  (g) => {
    g.rect(BX + 32, BY + 3, 6, 4, KARA);
    g.rect(BX + 33, BY + 2, 4, 1, KARA);
    g.px(BX + 33, BY + 3, KARA_L);
    g.px(BX + 34, BY + 4, KARA_L);
    g.px(BX + 36, BY + 3, KARA_L);
    g.hline(BX + 32, BY + 6, 6, KARA_D);
    g.rect(BX + 38, BY + 4, 4, 4, KARA);
    g.px(BX + 38, BY + 4, KARA_L);
    g.px(BX + 40, BY + 5, KARA_L);
    g.hline(BX + 38, BY + 7, 4, KARA_D);
  },
  // たこさんウインナー
  (g) => {
    g.rect(BX + 21, BY + 8, 7, 3, WIENER);
    g.hline(BX + 21, BY + 8, 7, "#ff7a6a");
    for (let i = 0; i < 4; i++) g.px(BX + 21 + i * 2, BY + 11, WIENER_D);
    g.px(BX + 23, BY + 9, SESAME);
    g.px(BX + 25, BY + 9, SESAME);
  },
  // ブロッコリー
  (g) => {
    g.rect(BX + 30, BY + 8, 5, 3, BROC);
    g.px(BX + 30, BY + 8, BROC_L);
    g.px(BX + 32, BY + 8, BROC_L);
    g.px(BX + 34, BY + 9, BROC_L);
    g.hline(BX + 30, BY + 10, 5, BROC_D);
    g.vline(BX + 32, BY + 11, 1, "#a8c878");
  },
];

/** 弁当。eaten はつまんだおかずの数（0〜4） */
function bento(g: PixelGfx, eaten: number) {
  // 箱（ふち・内側）
  g.rect(BX, BY, BW, BH, BOX);
  g.hline(BX, BY, BW, BOX_L);
  g.vline(BX, BY, BH, BOX_L);
  g.hline(BX, BY + BH - 1, BW, BOX_D);
  g.rect(BX + 1, BY + 1, BW - 2, BH - 2, BOX_IN);
  // しきり
  g.vline(BX + 19, BY + 1, BH - 2, BOX_D);
  // ごはん（左）
  g.rect(BX + 1, BY + 1, 18, BH - 2, RICE);
  g.hline(BX + 1, BY + BH - 2, 18, RICE_D);
  g.rect(BX + 8, BY + 5, 4, 4, UME);
  g.rect(BX + 8, BY + 5, 2, 1, UME_L);
  g.px(BX + 8, BY + 6, UME_L);
  for (const [sx, sy] of [
    [3, 2],
    [15, 3],
    [4, 9],
    [16, 10],
    [12, 2],
    [2, 6],
  ])
    g.px(BX + sx, BY + sy, SESAME);
  // おかず（右）。レタスを敷く
  g.hline(BX + 20, BY + 1, BW - 21, LETTUCE);
  g.vline(BX + BW - 2, BY + 1, BH - 2, LETTUCE);
  // ミニトマトはいつも残る
  g.disc(BX + 39, BY + 10, 2.2, TOMATO);
  g.px(BX + 39, BY + 8, LETTUCE);
  g.px(BX + 38, BY + 9, "#ff7a6a");
  OKAZU.forEach((draw, i) => {
    if (i >= eaten) draw(g);
  });
}

/** 自分の右手と箸。lift=0..1、hide でひっこめる */
function hand(g: PixelGfx, lift: number, hide: boolean, morsel: string | null) {
  if (hide) return;
  const tipX = 48 - Math.round(lift * 6);
  const tipY = 32 - Math.round(lift * 8);
  g.line(60, 35, tipX, tipY, HASHI);
  g.line(60, 36, tipX + 1, tipY + 1, HASHI_L);
  if (morsel) {
    g.rect(tipX - 2, tipY - 2, 4, 3, morsel);
    g.hline(tipX - 2, tipY - 2, 4, WHITE);
  }
  // 手（親指と指先）
  g.rect(55, 34, 6, 6, SKIN);
  g.hline(55, 34, 6, SKIN_D);
  g.vline(55, 34, 6, SKIN_D);
  g.rect(53, 35, 2, 2, SKIN);
  g.px(53, 36, SKIN_D);
}

export const art: LabelArt = {
  slug: "hayaben",
  swatch: [BOARD, TITLE_C, BOX, EGG, SHIRT],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    const pose: Pose =
      f <= 2 || f >= 10 ? "watch" : f === 3 || f === 9 ? "turn" : "back";
    // 見張っている間、目が左右に動く（0コマ目はこちら＝左を見る）
    const look = [-1, 1, -1, 0, 0, 0, 0, 0, 0, 0, 1, -1][f];
    // 4〜8コマ目に早弁。偶数コマでつまみ上げ
    const eating = f >= 4 && f <= 8;
    const up = eating && f % 2 === 0;
    const eaten = f < 4 ? 0 : Math.min(4, Math.floor((f - 4) / 2) + 1);
    const morsel = up ? [EGG, KARA, WIENER][(f - 4) / 2] : null;

    // ── 黒板 ─────────────────────────────────────────────
    g.rect(0, 0, 68, 26, BOARD_RIM);
    g.rect(1, 1, 66, 24, BOARD);
    g.rect(1, 1, 66, 24, BOARD_L, "eighth");
    g.hline(1, 24, 66, BOARD_D);
    g.hline(30, 4, 9, BOARD_L);
    g.hline(34, 6, 6, BOARD_L);
    g.rect(0, 25, 68, 1, TRAY);
    g.hline(0, 25, 68, BOARD_RIM_D, "quarter");

    // ── 題字（チョーク）───────────────────────────────────
    chalk(g, 3, 1, "学校で", CHALK, CHALK_SH);
    chalk(g, 3, 9, "バレないように", CHALK, CHALK_SH);
    chalk(g, 3, 17, "早弁するゲーム", TITLE_C, TITLE_SH);

    // ── 先生 ─────────────────────────────────────────────
    teacher(g, pose, look);
    if (f >= 10) {
      // 「！？」
      g.rect(53, 1, 1, 3, ALERT);
      g.px(53, 5, ALERT);
      g.hline(55, 1, 2, ALERT);
      g.px(56, 2, ALERT);
      g.px(55, 3, ALERT);
      g.px(55, 5, ALERT);
    }

    // ── 机 ───────────────────────────────────────────────
    g.rect(0, 26, 68, 14, DESK);
    g.hline(0, 26, 68, DESK_L);
    g.hline(2, 39, 60, DESK_D, "half");

    textbook(g);
    bento(g, eaten);

    // 弁当のつや（注目させる光）。見張られていない間だけ
    if (pose !== "watch") {
      g.px(BX + 2, BY + 2, WHITE);
      g.px(BX + 3, BY + 2, WHITE);
      g.px(BX + 2, BY + 3, WHITE);
    }

    // ── 手と箸 ───────────────────────────────────────────
    hand(g, up ? 1 : 0, !eating, morsel);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, WHITE, EDGE);
  },
};
