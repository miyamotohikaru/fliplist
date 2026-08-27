import type { LabelArt } from "./types";
import { shade, type PixelGfx } from "../gfx";
import { drawKosukuma, KUMA, KUMA_SIZE } from "../kosukuma";

// 元も子もないこすくまくん ── チャットでこすくまくんが身も蓋もないことを言う。
//
// 実物のサイトは、クラフト紙の地に切り絵の渦が縁取りされていて、
// 真ん中に薄い黄色のこすくまくん、下に吹き出し。その配置をそのままラベルに畳む。
// 左にこすくまくん、右に会話。こすくまくんは笑いも怒りもしない顔のままでいる。
//
// このラベルではくまが主役なので 26x34 の大きい版（drawKosukuma）を使う。
// 丈 34 はラベルの 40 をほとんど食うので、周りは次のとおり詰めた:
//   ・切り絵の帯 4〜5px → 2px。渦と小花もその2pxの上に載る大きさに落とす。
//   ・台紙は「丸」→「色紙（四隅を落とした八角）」。丸だと 26x34 の矩形が収まらず
//     頭と足がはみ出して、貼り忘れのように見えた。色紙なら全身の背を取れる。
//   ・会話は右の1列（x 35..66）に畳んで、行間を1pxずつ詰めた。

const PAPER = "#cfb98f"; // クラフト紙
const PAPER_DK = "#b8a074";
const PAPER_LT = "#dfcda6";
const OUTLINE = "#2b2119";
const BUBBLE = "#fbf6e8";
const BUBBLE_SH = "#ded2b6";
const TAG = "#e58aae";
const TAG_DK = "#b8577f";
const STAGE = "#e8bcca"; // くまの背にした色紙
const STAGE_DK = "#c0879c";

// 切り絵の縁。色紙を順に重ねて層に見せる
const CRAFT = ["#e8709c", "#f2a44a", "#4fb8a2", "#5f9fd8", "#a880d8", "#f0cf5e"];

// ── くまの置き場所 ──────────────────────────────────────
// 台紙はくまの実寸から起こす。左右に2px、上下に1pxずつの余白。
const BEAR_X = 5;
const BEAR_Y = 3;
const SX = BEAR_X - 2;
const SY = BEAR_Y - 1;
const SW = KUMA_SIZE.w + 5; // 耳と手が 26 より1pxずつ外に出るので、その分も見る
const SH = KUMA_SIZE.h + 3;

/** 四隅を落とした八角形。切り絵の色紙はハサミで角を落としてある。 */
function octa(x: number, y: number, w: number, h: number, k: number): Array<[number, number]> {
  return [
    [x + k, y],
    [x + w - k, y],
    [x + w, y + k],
    [x + w, y + h - k],
    [x + w - k, y + h],
    [x + k, y + h],
    [x, y + h - k],
    [x, y + k],
  ];
}

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

export const art: LabelArt = {
  slug: "osyaberi",
  swatch: [PAPER, KUMA.fill, STAGE, TAG, OUTLINE],
  draw: (g, t) => {
    // ── 地。クラフト紙 ────────────────────────────────────
    g.rect(0, 0, 68, 40, PAPER);
    // 印刷された細かい市松。地が平らに見えないように
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 68; x++) {
        if ((x + y * 2) % 6 === 0 && (y + 1) % 3 === 0) g.px(x, y, PAPER_DK);
        else if ((x * 2 + y) % 7 === 0 && x % 3 === 0) g.px(x, y, PAPER_LT);
      }
    g.noise(0, 0, 68, 40, PAPER_DK, 0.08, 21);
    g.noise(0, 0, 68, 40, PAPER_LT, 0.05, 88);
    // 四隅を少し落として奥行きを出す
    for (const [cx0, cy0] of [
      [8, 8],
      [60, 8],
      [8, 32],
      [60, 32],
    ])
      g.ellipse(cx0, cy0, 14, 12, "#00000012", "half");

    // ── 切り絵の縁 ───────────────────────────────────────
    // 周に沿って色紙を長く貼る。くまが 34 丈あるので帯は2pxまで。
    // 2pxでも「明るい面／暗い面」の2段は取れるので、紙が重なって見える。
    const RUN = 13;
    const W = 2;
    /** 周に沿った位置 p と深さ d を1ドットに落とす */
    const layer = (x: number, y: number, d: number, p: number) => {
      const idx = Math.floor(p / RUN);
      const c = CRAFT[((idx % CRAFT.length) + CRAFT.length) % CRAFT.length];
      if (p % RUN === 0) {
        g.px(x, y, "#fdf6e6"); // 継ぎ目の切り口
        return;
      }
      g.px(x, y, d === 0 ? shade(c, 0.22) : shade(c, -0.3));
    };
    for (let x = 1; x < 67; x++) {
      for (let d = 0; d < W; d++) layer(x, 1 + d, d, x);
      for (let d = 0; d < W; d++) layer(x, 38 - d, d, 170 + (67 - x));
    }
    for (let y = 3; y < 37; y++) {
      for (let d = 0; d < W; d++) layer(1 + d, y, d, 280 + (39 - y));
      for (let d = 0; d < W; d++) layer(66 - d, y, d, 66 + y);
    }
    // 帯の内側に落ちる影。紙が浮いて見える
    g.hline(1, 3, 66, "#0000002e");
    g.hline(1, 36, 66, "#0000002e");
    g.vline(3, 3, 34, "#0000002e");
    g.vline(64, 3, 34, "#0000002e");

    // 渦。切り絵の帯の上でくるりと巻く。2pxの帯に載る大きさに縮めた
    for (const [cx0, cy0, dir] of [
      [12, 2, 1],
      [64, 20, -1],
      [26, 37, 1],
      [3, 22, -1],
    ]) {
      for (let i = 0; i < 9; i++) {
        const a = i * 0.72 * dir;
        const r = 0.4 + i * 0.14;
        g.px(
          Math.round(cx0 + Math.cos(a) * r),
          Math.round(cy0 + Math.sin(a) * r),
          i < 4 ? "#fdf6e6" : "#00000038",
        );
      }
    }
    // 縁に散る小花
    const flower = (x: number, y: number, c: string, core: string) => {
      g.px(x, y - 1, c);
      g.px(x - 1, y, c);
      g.px(x + 1, y, c);
      g.px(x, y + 1, c);
      g.px(x, y, core);
    };
    flower(19, 2, "#fdf6e6", "#f0cf5e");
    flower(61, 2, "#fdf6e6", "#e8709c");
    flower(2, 30, "#fdf6e6", "#5f9fd8");
    flower(65, 30, "#fdf6e6", "#f0cf5e");
    flower(41, 37, "#fdf6e6", "#a880d8");
    flower(53, 2, "#fdf6e6", "#4fb8a2");
    // 紙のパンチ屑
    for (const [x, y, c] of [
      [33, 2, "#e8709c"],
      [15, 37, "#5f9fd8"],
      [58, 37, "#f2a44a"],
      [2, 12, "#f0cf5e"],
      [65, 12, "#e8709c"],
      [46, 2, "#5f9fd8"],
      [50, 37, "#a880d8"],
    ] as Array<[number, number, string]>) {
      g.px(x, y, c);
      g.px(x + 1, y, c);
    }

    // ── 色紙の台。こすくまくんの背 ───────────────────────
    g.poly(octa(SX + 1, SY + 2, SW, SH, 4), "#00000020");
    g.poly(octa(SX, SY, SW, SH, 4), STAGE_DK);
    g.poly(octa(SX + 1, SY + 1, SW - 2, SH - 2, 4), STAGE);
    g.poly(octa(SX + 3, SY + 3, SW - 6, SH - 12, 3), "#f2d4de", "half");
    g.noise(SX, SY, SW, SH, "#f4dde6", 0.06, 55);
    // 台紙の縁に打った穴。切り絵らしさはここで出す
    for (let i = 0; i < 8; i++) {
      const y = SY + 4 + i * 4;
      g.px(SX + 1, y, STAGE_DK);
      g.px(SX + SW - 2, y, STAGE_DK);
    }
    for (let i = 0; i < 6; i++) {
      const x = SX + 4 + i * 5;
      g.px(x, SY + 1, STAGE_DK);
      g.px(x, SY + SH - 2, STAGE_DK);
    }

    // ── こすくまくん ─────────────────────────────────────
    // 姿は kosukuma.ts が正解。ここでは置くだけ。目や口を足さない。
    g.ellipse(BEAR_X + 13, BEAR_Y + 34, 11, 1, "#00000026");
    drawKosukuma(g, BEAR_X, BEAR_Y, { blink: t > 0.62 && t < 0.7 });

    // ── 会話。右の1列に畳む ──────────────────────────────
    /** 吹き出し。tail が left なら左向きの尻尾がつく */
    const bubble = (
      x: number,
      y: number,
      w: number,
      h: number,
      fill: string,
      lines: number[],
      tail: "left" | "right" | null,
      lineC: string,
    ) => {
      g.rect(x, y, w, h, OUTLINE);
      g.rect(x + 1, y + 1, w - 2, h - 2, fill);
      g.hline(x + 1, y + h - 2, w - 2, BUBBLE_SH);
      if (tail === "left") {
        g.px(x - 1, y + h - 4, OUTLINE);
        g.px(x - 2, y + h - 3, OUTLINE);
        g.px(x - 1, y + h - 3, fill);
        g.px(x - 1, y + h - 2, OUTLINE);
      } else if (tail === "right") {
        g.px(x + w, y + h - 4, OUTLINE);
        g.px(x + w + 1, y + h - 3, OUTLINE);
        g.px(x + w, y + h - 3, fill);
        g.px(x + w, y + h - 2, OUTLINE);
      }
      // 中の文字。長さをばらして本文らしく見せる
      lines.forEach((len, i) => {
        g.hline(x + 3, y + 3 + i * 2, len, lineC);
        for (let k = 3; k < len; k += 5) g.px(x + 3 + k, y + 3 + i * 2, fill);
      });
    };

    // 相手（人間）の問いかけ。右寄せの小さいの。彩度を上げて紙から離す
    bubble(43, 10, 20, 7, "#f2b0ca", [13, 7], "right", "#8f3f60");
    // 問いかけの左に貼った切り絵の欠片。ここを空けると craft 紙が抜けて見える
    flower(38, 12, "#fdf6e6", "#f0cf5e");
    g.px(37, 15, "#e8709c");
    g.px(38, 15, "#e8709c");
    g.px(40, 16, "#5f9fd8");
    g.px(41, 16, "#5f9fd8");
    // 名札の右に時刻の紙片。ここを空けるとクラフト紙が大きく抜けて見える
    g.rect(50, 18, 13, 3, "#e6d6b2");
    g.hline(50, 18, 13, "#f2e6c8");
    for (const x of [52, 54, 56, 59, 61]) g.px(x, 19, "#8a7658");

    // こすくまくんの名札つきの返事
    g.rect(36, 17, 13, 5, TAG_DK);
    g.rect(36, 17, 13, 4, TAG);
    g.hline(37, 17, 11, "#f4b3c9");
    for (let i = 0; i < 4; i++) g.vline(38 + i * 3, 18, 2, "#ffffff");
    bubble(36, 22, 28, 9, BUBBLE, [22, 23, 16], "left", "#4a3c2e");
    // 吹き出しの上端に色紙を1枚はさむ。白い長方形に見せない。
    g.hline(37, 23, 26, "#f2dde6");
    g.hline(37, 29, 16, "#e6d8c0");
    // 身も蓋もない一節にだけ朱が引いてある
    g.hline(40, 27, 13, "#c8506e");
    g.px(39, 27, "#c8506e");
    // 吹き出しの角にはられた切り絵の花
    flower(63, 22, "#fdf6e6", "#4fb8a2");
    flower(35, 21, "#fdf6e6", "#f2a44a");

    // 動き2: とどめの一言。打っている途中の点が増えていって、「……」に変わる。
    // 途中も完成後も同じ吹き出しの形で出す。形が入れ替わると、点滅して見える。
    if (t > 0.45) {
      bubble(37, 32, 16, 6, BUBBLE, [], "left", "#4a3c2e");
      for (let i = 0; i < 3; i++) g.rect(40 + i * 4, 34, 2, 2, "#3b2f24");
    } else {
      bubble(37, 32, 16, 6, "#e0d2b4", [], "left", "#6b5a4a");
      // PixelCanvas は1周を12コマに割る。12で刻めば点が 1→2→3 と等間隔に増える。
      const n = 1 + (Math.floor(t * 12) % 3);
      for (let i = 0; i < n; i++) g.rect(40 + i * 4, 34, 2, 2, "#8a7658");
    }
    // 返事についた反応。色紙で作ったボタンという体。
    // 右下 (61,33) の発行元の印にかからない x53..59 にだけ置く。
    g.disc(57, 34, 2, OUTLINE);
    g.rect(56, 33, 3, 3, "#e8709c");
    g.px(56, 33, "#fdf6e6");
    g.rect(53, 32, 2, 2, "#5f9fd8");
    g.rect(53, 36, 2, 2, "#f0cf5e");

    // ── 名札。題字を兼ねる ────────────────────────────────
    g.rect(36, 2, 24, 7, TAG_DK);
    g.rect(36, 2, 24, 6, TAG);
    g.hline(37, 2, 22, "#f4b3c9");
    g.text3x5(38, 3, "BLUNT", "#ffffff");
    // 名札を留めるピン
    g.px(61, 5, TAG_DK);
    g.px(62, 4, TAG_DK);
    g.px(62, 6, TAG_DK);
    g.px(63, 5, TAG_DK);

    // ── 枠 ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。切り絵の帯はその内側の絵。
    g.frame(0, 0, 68, 40, OUTLINE);
    mark(g, OUTLINE, KUMA.fill);
  },
};
