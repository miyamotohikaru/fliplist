import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// 学校でバレないように早弁するゲーム — 授業中、教科書の陰でこっそり早弁。
// 先生が振り向いたら手を止めて隠す。バレたら即終了。
//
// 図の骨組み: 自分の席から前を見る（一人称）。
//   上の大半は教室の黒板。題字は先生がチョークで書いたように黒板に書く。
//   実物の題字どおり「学校でバレないように」は白、「早弁するゲーム」はクリーム色に
//   赤茶の影（実物のロゴの色）。
//   黒板の右はしに先生（白いシャツ・めがね）。ふだんは黒板を向いて書いている。
//   手前は自分の机。立てた教科書の陰に、赤い弁当箱（白いごはん・梅干し・
//   卵焼き・からあげ・ブロッコリー）。右下から自分の手が箸でつまむ。
//
// 動くもの（1周3秒・12コマ）: 0〜6コマ目は先生が背を向けている間に早弁。
//   箸がおかずをつまんで口へ運ぶたびに、弁当が減っていく。
//   7コマ目で先生が振り向きかけ、8〜10コマ目はこちらを向く（頭の上に「！」）。
//   そのあいだ手は引っこめ、弁当には教科書をかぶせて隠す。
//   11コマ目で先生がまた黒板を向き、弁当は次の1箱（全30箱）。

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
const WALL = "#e9e2cf";
const DESK = "#d9b47e";
const DESK_L = "#e8c895";
const DESK_D = "#b89058";
const COVER = "#2f4a6e";
const COVER_D = "#22365a";
const PAGE = "#fbf8ee";
const PAGE_D = "#ddd8c8";
const PAGE_LINE = "#a8b0bc";
const BOX = "#c8302a";
const BOX_D = "#8f1f1c";
const RICE = "#ffffff";
const RICE_D = "#e6e2d8";
const UME = "#d4304a";
const EGG = "#f7cf3a";
const EGG_D = "#d9a91e";
const KARA = "#b8702c";
const KARA_D = "#8a4e1a";
const BROC = "#4f9a3a";
const SKIN = "#f4c9a0";
const SKIN_D = "#d69c70";
const HAIR = "#1d1b1e";
const SHIRT = "#e4ebe6";
const SHIRT_D = "#b9c6bd";
const GLASS = "#2a2a2a";
const HASHI = "#7a4a22";
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
  depth = 1,
) {
  for (let d = depth; d >= 1; d--) misakiRow(g, x + d, y + d, text, sh);
  misakiRow(g, x, y, text, c);
}

/** 先生。face=true でこちらを向く */
function teacher(g: PixelGfx, face: boolean, half: boolean) {
  const x = 61; // 頭の左はし
  // 胴（黒板の下まで）
  g.rect(x - 1, 13, 9, 15, SHIRT);
  g.vline(x - 1, 13, 15, SHIRT_D);
  g.vline(x + 3, 14, 13, SHIRT_D);
  // 頭
  g.rect(x, 6, 6, 7, face || half ? SKIN : HAIR);
  if (face) {
    g.rect(x, 6, 6, 2, HAIR);
    g.px(x, 8, HAIR);
    g.px(x + 5, 8, HAIR);
    // めがね
    g.rect(x, 9, 2, 2, GLASS);
    g.rect(x + 3, 9, 2, 2, GLASS);
    g.px(x + 2, 9, GLASS);
    g.px(x + 1, 10, WHITE);
    g.px(x + 4, 10, WHITE);
    g.hline(x + 2, 12, 2, SKIN_D);
    // 「！」
    g.rect(x + 2, 0, 2, 3, ALERT);
    g.rect(x + 2, 4, 2, 1, ALERT);
  } else if (half) {
    // 横顔（振り向きかけ）
    g.rect(x, 6, 6, 3, HAIR);
    g.rect(x + 3, 6, 3, 7, HAIR);
    g.px(x + 1, 9, GLASS);
    g.px(x, 10, SKIN_D);
  } else {
    // うしろ姿。チョークを持った手を黒板へ
    // 腕は「学校で」の右の空きへ上げる（題字にかぶせない）
    g.rect(x - 2, 9, 2, 4, SHIRT);
    g.rect(x - 4, 6, 3, 3, SHIRT);
    g.rect(x - 6, 4, 3, 2, SKIN);
    g.px(x - 7, 4, CHALK);
    g.px(x - 7, 5, CHALK);
  }
}

/** 立てた教科書（こちらから見えるのは中のページ） */
function textbook(g: PixelGfx) {
  const x = 4;
  const y = 28;
  // 表紙のふち
  g.rect(x, y, 22, 10, COVER);
  g.hline(x, y + 9, 22, COVER_D);
  // ひらいたページ（真ん中がのど）
  g.rect(x + 1, y + 1, 9, 8, PAGE);
  g.rect(x + 12, y + 1, 9, 8, PAGE);
  g.vline(x + 10, y + 1, 8, PAGE_D);
  g.vline(x + 11, y + 1, 8, PAGE_D);
  for (let i = 0; i < 3; i++) {
    g.hline(x + 2, y + 3 + i * 2, 7, PAGE_LINE);
    g.hline(x + 13, y + 3 + i * 2, 6 - (i === 2 ? 3 : 0), PAGE_LINE);
  }
}

/** 弁当。eaten はつまんだおかずの数（0〜4） */
function bento(g: PixelGfx, eaten: number, nth: number) {
  const x = 28;
  const y = 31;
  g.rect(x, y, 19, 8, BOX_D);
  g.rect(x, y, 19, 7, BOX);
  g.rect(x + 1, y + 1, 17, 5, BOX_D);
  // ごはん（左）。梅干し
  g.rect(x + 1, y + 1, 8, 5, RICE);
  g.hline(x + 1, y + 5, 8, RICE_D);
  g.rect(x + 4, y + 2, 2, 2, UME);
  // おかず（右）。食べたぶん抜けて箱の底が見える
  const okazu: Array<[number, number, string, string]> = [
    [x + 10, y + 1, EGG, EGG_D],
    [x + 14, y + 1, KARA, KARA_D],
    [x + 10, y + 4, KARA, KARA_D],
    [x + 14, y + 4, EGG, EGG_D],
  ];
  // 次の箱はおかずの並びを変える（全30箱）
  const order = nth % 2 === 0 ? [0, 1, 2, 3] : [1, 0, 3, 2];
  order.forEach((k, i) => {
    if (i < eaten) return;
    const [ox, oy, c, d] = okazu[k];
    g.rect(ox, oy, 3, 2, c);
    g.hline(ox, oy + 1, 3, d);
  });
  // ブロッコリー
  g.rect(x + 17, y + 1, 1, 3, BROC);
}

/** 自分の右手と箸。lift=0..1 でつまみ上げの高さ、hide で引っこめる */
function hand(g: PixelGfx, lift: number, hide: boolean, morsel: string | null) {
  if (hide) {
    // 机の下へ引っこめた手（ひざの上）。指先だけ見える
    g.rect(52, 38, 5, 1, SKIN);
    return;
  }
  const tipX = 44 - Math.round(lift * 4);
  const tipY = 34 - Math.round(lift * 7);
  // 箸2本
  g.line(57, 36, tipX, tipY, HASHI);
  g.line(58, 37, tipX + 1, tipY + 1, HASHI);
  if (morsel) {
    g.rect(tipX - 1, tipY - 1, 3, 2, morsel);
  }
  // 手
  g.rect(55, 35, 6, 5, SKIN);
  g.hline(55, 35, 6, SKIN_D);
  g.vline(55, 35, 5, SKIN_D);
  g.rect(53, 36, 2, 2, SKIN);
}

export const art: LabelArt = {
  slug: "hayaben",
  swatch: [BOARD, TITLE_C, BOX, EGG, SHIRT],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    const looking = f >= 8 && f <= 10;
    const turning = f === 7;
    // 0〜6コマ目: 2コマで1口（つまむ→口へ）
    //   偶数コマでつまみ上げ（0コマ目＝止まっている絵は卵焼きを持ち上げたところ）
    const bite = f <= 6 ? Math.floor(f / 2) : 0;
    const up = f <= 6 && f % 2 === 0;
    const eaten = f <= 6 ? bite + 1 : f === 7 ? 4 : 0;
    const nth = f === 11 ? 1 : 0;

    // ── 黒板 ─────────────────────────────────────────────
    g.rect(0, 0, 68, 28, BOARD_RIM);
    g.hline(0, 27, 68, BOARD_RIM_D);
    g.rect(1, 1, 66, 25, BOARD);
    g.rect(1, 1, 66, 25, BOARD_L, "eighth");
    g.hline(1, 25, 66, BOARD_D);
    // 消し残しのチョークのあと
    g.hline(30, 4, 9, BOARD_L);
    g.hline(34, 6, 6, BOARD_L);
    // チョーク受け
    g.rect(0, 27, 68, 1, TRAY);
    g.rect(14, 26, 3, 1, CHALK);
    g.rect(19, 26, 2, 1, TITLE_C);

    // ── 題字（チョーク）───────────────────────────────────
    chalk(g, 3, 2, "学校で", CHALK, CHALK_SH);
    chalk(g, 3, 10, "バレないように", CHALK, CHALK_SH);
    chalk(g, 3, 18, "早弁するゲーム", TITLE_C, TITLE_SH);

    // ── 先生 ─────────────────────────────────────────────
    teacher(g, looking, turning);

    // ── 机 ───────────────────────────────────────────────
    g.rect(0, 28, 68, 12, DESK);
    g.hline(0, 28, 68, DESK_L);
    g.hline(3, 32, 20, DESK_D, "half");
    g.hline(30, 39, 26, DESK_D, "half");
    g.rect(0, 28, 68, 1, WALL, "quarter");

    textbook(g);
    bento(g, eaten, nth);

    if (looking) {
      // 先生に見られている間は、弁当に教科書をかぶせて隠す
      g.rect(27, 30, 21, 9, COVER);
      g.rect(28, 31, 19, 7, COVER_D);
      g.hline(28, 33, 19, COVER);
      g.rect(30, 34, 8, 2, PAGE_D);
    }

    // ── 手と箸 ───────────────────────────────────────────
    const morsel = up ? (bite % 2 === 0 ? EGG : KARA) : null;
    hand(g, up ? 1 : 0, looking || turning, morsel);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, WHITE, EDGE);
  },
};
