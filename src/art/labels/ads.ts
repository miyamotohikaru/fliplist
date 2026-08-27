import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { JP_TH, ascent, jpRow } from "../jptitle";

// 世界一広告の多いゲーム。まだ制作中。
//
// 描くのは「ゲーム画面が広告に埋め尽くされている」その一枚。
// 先にゲームの画面をまるごと描いて、その上から広告で塗り潰す。
// 隙間の1pxから空と地面がのぞくのは、下にちゃんとゲームがあるという証拠。
// 閉じるボタンは必ず枠の外に置く。押せない。
//
// 実在の企業名・商標・ロゴは一切描かない。中身のない広告だけを描く。
// この1枚だけはわざとうるさくしてよいが、次の規律だけは崩さない:
//   - すべての面は軸に平行
//   - すべての面に同じ1pxの黒い縁
//   - 色は10色まで

const INK = "#14121c";
const WHITE = "#ffffff";
const CREAM = "#f4f0e0";
const MAGENTA = "#e02a86";
const YELLOW = "#ffd21e";
const CYAN = "#1ec8e0";
const ORANGE = "#f27a1e";
const LIME = "#8ede2a";
const RED = "#e63030";
const BLUE = "#2a52d0";
const GREEN = "#3a9e3a";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

/** 広告の面。縁と上辺のハイライトを必ず同じ作法で入れる。 */
function adBox(g: PixelGfx, x: number, y: number, w: number, h: number, bg: string) {
  g.rect(x + 1, y + 1, w, h, "#00000055");
  g.rect(x, y, w, h, bg);
  g.hline(x + 1, y + 1, w - 2, "#ffffff4d");
  g.frame(x, y, w, h, INK);
}

/** 斜めのストライプ。矩形の中だけに収める。 */
function stripes(g: PixelGfx, x: number, y: number, w: number, h: number, c: string, p = 7) {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) if ((i + j) % p < 3) g.px(x + i, y + j, c);
}

/** 閉じるボタン。いつも面の外にずれている。 */
function closeBtn(g: PixelGfx, x: number, y: number) {
  g.rect(x, y, 7, 7, WHITE);
  g.frame(x, y, 7, 7, INK);
  g.line(x + 2, y + 2, x + 4, y + 4, INK);
  g.line(x + 4, y + 2, x + 2, y + 4, INK);
}

// ── 和文の題字 ──────────────────────────────────────────
// 「世界一広告の多いゲーム」11文字。漢字はどれも画数が少ないので 11px で持つ
// （11px x 6 = 66px＝ラベルの内寸ちょうど）。6字＋5字の2行。
// 題字も広告の一枚として組む。上の看板が「世界一広告の」、
// 割り込みの全画面が「多いゲーム」。合わせて読ませる。
//
// **ふちは回さない。** 11px の字間は1pxしかないので、8方向に黒を回すと
// 字と字がくっついて帯が1枚の黒い板になる。かわりに、字が乗る面だけ
// 斜めの縞を抜いて無地にした。無地の上なら1色べたで抜ける。
const T_A = "世界一広告の";
const T_B = "多いゲーム";
const T_SIZE = 11;

/** 中身のない社章。丸・三角・四角の組み合わせだけで作る。 */
function logo(g: PixelGfx, kind: number, x: number, y: number, a: string, b: string) {
  if (kind === 0) {
    g.rect(x, y, 7, 7, a);
    g.disc(x + 3, y + 3, 2, b);
  } else if (kind === 1) {
    g.disc(x + 3, y + 3, 3, a);
    g.poly(
      [
        [x + 3, y + 1],
        [x + 6, y + 5],
        [x, y + 5],
      ],
      b,
    );
  } else {
    g.rect(x, y, 7, 7, a);
    g.rect(x, y, 4, 4, b);
    g.rect(x + 4, y + 4, 3, 3, b);
  }
  g.frame(x, y, 7, 7, INK);
}

export const art: LabelArt = {
  slug: "ads",
  swatch: ["#e02a86", "#ffd21e", "#1ec8e0", "#8ede2a", "#14121c"],
  draw: (g, t) => {
    // ── 下にあるゲーム本体 ─────────────────────────────────
    // ほとんど見えなくなるが、隙間からのぞくので手は抜かない。
    g.rect(0, 0, 68, 40, "#1a2a5c");
    g.rect(0, 0, 68, 14, "#263f7e");
    g.rect(6, 5, 9, 3, "#5a7cc4");
    g.rect(40, 3, 11, 3, "#5a7cc4");
    g.rect(0, 27, 68, 13, GREEN);
    g.hline(0, 27, 68, "#63c455");
    g.rect(0, 30, 68, 10, "#7a4a20");
    g.rect(0, 30, 68, 10, "#5c3416", "quarter");
    for (let i = 0; i < 68; i += 9) g.rect(i, 20, 5, 3, "#c88a3a");
    // 草。広告の隙間からのぞくのはここだけなので、この2列に手を入れておく。
    for (let i = 2; i < 68; i += 5) {
      g.px(i, 28, "#2a7a2a");
      g.px(i + 2, 29, "#2a7a2a");
      g.px(i + 1, 28, "#8ede2a");
    }
    g.rect(24, 28, 3, 2, YELLOW);
    g.px(25, 27, YELLOW);
    g.rect(38, 26, 5, 4, "#2a7a2a");
    g.hline(38, 26, 5, "#63c455");
    // 主人公。1体だけ、はっきり描いておく。
    g.rect(30, 21, 5, 6, "#f2e0c0");
    g.rect(30, 21, 5, 2, RED);
    g.px(31, 24, INK);
    g.px(33, 24, INK);
    g.rect(29, 25, 2, 2, BLUE);
    g.rect(34, 25, 2, 2, BLUE);
    g.disc(47, 16, 2, YELLOW);

    // ── 広告 ───────────────────────────────────────────────
    // 題字が11文字になったので、看板は2枚とも幅いっぱいの帯に組み直した。
    // 下のゲームが見えるのは、帯と帯のあいだの1行と、右の細い窓、
    // そして下の帯だけ。

    // 上の看板。ここに和文の題字の1行目。字が乗る10行は縞を抜いて無地にする。
    adBox(g, 0, 0, 68, 13, MAGENTA);
    stripes(g, 1, 11, 66, 1, YELLOW, 4);
    const asc = ascent(T_A + T_B, T_SIZE, JP_TH);
    jpRow(g, 1, T_A, YELLOW, { size: T_SIZE, ascent: asc });

    // 割り込みの全画面広告。ここが題字の2行目。
    adBox(g, 0, 14, 61, 12, CREAM);
    jpRow(g, 15, T_B, INK, { size: T_SIZE, ascent: asc, width: 60 });
    g.hline(1, 24, 59, RED);

    // 右の細い窓。押しのけられたゲームがここから覗いている。
    g.rect(62, 15, 5, 10, "#1a2a5c");
    g.rect(62, 20, 5, 5, GREEN);
    g.hline(62, 20, 5, "#63c455");
    g.rect(62, 22, 5, 3, "#7a4a20");
    g.px(64, 17, YELLOW);
    g.px(63, 18, WHITE);
    g.frame(62, 15, 5, 10, WHITE);
    g.frame(61, 14, 7, 12, INK);

    // ── 下の帯。追いやられたゲーム本体 ─────────────────────
    g.rect(0, 27, 68, 13, "#1a2a5c");
    g.rect(0, 32, 68, 8, GREEN);
    g.hline(0, 32, 68, "#63c455");
    g.rect(0, 34, 68, 6, "#7a4a20");
    g.rect(0, 34, 68, 6, "#5c3416", "quarter");
    for (let i = 2; i < 68; i += 5) {
      g.px(i, 33, "#2a7a2a");
      g.px(i + 1, 33, "#8ede2a");
    }
    // 主人公。ここだけはっきり描いておく。
    g.rect(7, 27, 5, 5, "#f2e0c0");
    g.rect(7, 27, 5, 2, RED);
    g.px(8, 30, INK);
    g.px(10, 30, INK);
    g.rect(6, 31, 2, 2, BLUE);
    g.rect(11, 31, 2, 2, BLUE);
    g.disc(20, 29, 2, YELLOW);
    // 帯の縁。ここも同じ1pxの黒
    g.hline(0, 26, 68, INK);
    // たたき売りの札。ゲームの上にそのまま貼ってある。
    g.rect(25, 28, 19, 7, WHITE);
    g.frame(25, 28, 19, 7, INK);
    g.text3x5(27, 29, "SALE", RED, 1);
    g.hline(27, 33, 15, RED);
    logo(g, 2, 45, 28, WHITE, CYAN);
    g.rect(53, 28, 13, 6, YELLOW);
    g.frame(53, 28, 13, 6, INK);
    g.text3x5(54, 29, "NEW", INK);

    // ── 動き: バナーが1枚重なる ────────────────────────────
    if (t > 0.5) {
      adBox(g, 15, 30, 39, 9, BLUE);
      stripes(g, 16, 31, 37, 7, "#5c7ce8", 9);
      g.rect(17, 31, 26, 7, YELLOW);
      g.frame(17, 31, 26, 7, INK);
      g.text3x5(19, 32, "50%OFF", INK);
      g.text3x5(45, 32, "NO", WHITE);
      g.text3x5(45, 36, "AD", WHITE);
      closeBtn(g, 9, 31);
    }

    // ── 迷子の閉じるボタンたち ─────────────────────────────
    // どれも面の外にずれている。押せない。
    // 置き場所は題字の字面を避けてある。読めない題字は広告にもならない。
    closeBtn(g, 61, 8);
    closeBtn(g, 3, 22);
    closeBtn(g, 16, 25);
    // 押せない読み込みの棒。1周で0まで減る（＝終わらない広告）
    const left = Math.max(0, Math.round(10 * (1 - Math.min(1, t * 2))));
    g.rect(48, 35, 12, 4, WHITE);
    g.frame(48, 35, 12, 4, INK);
    g.rect(49, 36, left, 2, GREEN);

    // ── 画面の縁 ───────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, INK);
    mark(g, WHITE, INK);
  },
};
