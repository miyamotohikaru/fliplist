import { PixelGfx } from "./gfx";

// こすくまくん。こす.くまの公式キャラクター。
//
// 出典: ~/Desktop/こすくま/デザイン/ロゴ/こすくま_ポーズ02.png（正式なロゴデータ）
//
// **楕円を重ねて似せるのはやめた。** 少しでもズレると別のキャラクターになるので、
// 公式データの画素をそのまま面積で数えて、1ドットずつ振り分けたものを字形にしてある。
// 顔の点（目・鼻）とほくろだけは面積が小さすぎて平均に埋もれるので、
// 実測した割合の位置に打ち直している:
//   目 = 左42% / 右58%、高さ42%（間隔は図の幅の16%しかない）
//   鼻 = 50% / 46%（口は無い）
//   ほくろ = 75% / 82%（黒ではなく濃い緑）
//
// 字形を作り直すときは scratchpad の bake.py を使うこと。手で描き直さない。
//
// ── 実物の特徴（ここを外すと別のくまになる）──
//  1. 輪郭が非常に太い（図の幅の3.5%）。中の面より輪郭が主役。
//  2. 頭が体より大きく、側面がほぼ直線＝円ではなく角丸の四角。
//  3. 耳は頭の後ろから覗く円。図の最大幅を決めるのは耳。
//  4. 顔が極端に小さく、低い位置にある。
//  5. 口が無い。
//  6. お腹の右下に濃い緑のほくろが1つ。

export const KUMA = {
  fill: "#f7f7d8",
  line: "#141210",
  /** お腹のほくろ。黒ではなく濃い緑 */
  mole: "#28382c",
};

export type KumaOptions = {
  fill?: string;
  line?: string;
  mole?: string;
  /** 目を閉じる（まばたき） */
  blink?: boolean;
  /** ほくろを描かない。ごく小さく出すときだけ */
  noMole?: boolean;
};

/** 主役として出すとき。実物の縦横比 0.760 に対して 26/34 = 0.765。 */
export const KUMA_SIZE = { w: 26, h: 34 };
/** 風景の一部として置くとき。20/26 = 0.769。 */
export const KUMA_SMALL_SIZE = { w: 20, h: 26 };

const BIG = [
  "..######..#######..####...",
  ".##oooo####ooooo#####o###.",
  "##oooo##ooooooooooo##ooo##",
  "#ooo##oooooooooooooo##ooo#",
  "#ooo#oooooooooooooooo##oo#",
  "#oo##ooooooooooooooooo#oo#",
  "##o#oooooooooooooooooo##o#",
  ".###oooooooooooooooooo####",
  "..##ooooooooooooooooooo##.",
  "..#oooooooooooooooooooo#..",
  "..#oooooooooooooooooooo##.",
  "..#ooooooooooooooooooooo#.",
  "..#ooooooooooooooooooooo#.",
  ".#oooooooooooooooooooooo#.",
  ".#oooooooo#oooo#oooooooo#.",
  ".#oooooooooo#ooooooooooo#.",
  "..#oooooooooooooooooooo#..",
  "..#oooooooooooooooooooo#..",
  "..##oooooooooooooooooo#...",
  "..###ooooooooooooooo####..",
  ".#ooo###oooooooooo###ooo##",
  "#ooo#oooo##oooooooooooooo#",
  "#oo##oooooooooooooooo#ooo#",
  "##o#oooooooooooooooooo####",
  ".###oooooooooooooooooo##..",
  "..#ooooooooooooooooooo##..",
  "..#oooooooooooooooooooo#..",
  "..#oooooooooooooooomooo#..",
  "..#ooooooooooooooooooo##..",
  "..##oooooooooooooooooo#...",
  "...##oooooooooooooooo###..",
  "..#o##oooooooooooooo##o#..",
  "..##oo###oooooooo####oo#..",
  "...####..#########..###...",
];

const SMALL = [
  "..####.###########..",
  ".#ooo##ooooooo##oo#.",
  "#ooo#oooooooooo##oo#",
  "#oo#oooooooooooo##o#",
  "#o#oooooooooooooo#o#",
  "###oooooooooooooo###",
  ".##oooooooooooooo##.",
  ".##ooooooooooooooo#.",
  ".#oooooooooooooooo#.",
  ".#oooooooooooooooo#.",
  ".#oooooo#oo#oooooo#.",
  ".#oooooooo#ooooooo#.",
  ".#oooooooooooooooo#.",
  ".#ooooooooooooooo#..",
  "..#ooooooooooooo##..",
  ".#####oooooooo###o##",
  "#oo#oooooooooooo#oo#",
  "#o#ooooooooooooo##o#",
  ".##oooooooooooooo##.",
  "..#oooooooooooooo#..",
  ".##oooooooooooooo#..",
  ".##ooooooooooomoo#..",
  "..#oooooooooooooo#..",
  "..##oooooooooooo##..",
  "..#o##oooooooo##o##.",
  "..###.########.###..",
];

/** 目の位置。まばたきのときここを横線に置き換える。 */
const EYES = {
  big: [[10, 14], [15, 14]],
  small: [[8, 11], [11, 11]],
} as const;

function draw(
  g: PixelGfx,
  rows: readonly string[],
  eyes: readonly (readonly [number, number])[] | ReadonlyArray<ReadonlyArray<number>>,
  x: number,
  y: number,
  o: KumaOptions,
) {
  const fill = o.fill ?? KUMA.fill;
  const line = o.line ?? KUMA.line;
  const mole = o.mole ?? KUMA.mole;
  g.blit(x, y, rows, { "#": line, o: fill, m: o.noMole ? fill : mole });
  if (o.blink)
    for (const [ex, ey] of eyes) {
      g.px(x + ex, y + ey, fill);
      g.hline(x + ex - 1, y + ey + 1, 3, line);
    }
}

/** 正面のこすくまくん。26 x 34。 */
export function drawKosukuma(g: PixelGfx, x: number, y: number, o: KumaOptions = {}) {
  draw(g, BIG, EYES.big, x, y, o);
}

/** 小さいこすくまくん。20 x 26。これ以上小さくすると顔の点が消える。 */
export function drawKosukumaSmall(g: PixelGfx, x: number, y: number, o: KumaOptions = {}) {
  draw(g, SMALL, EYES.small, x, y, o);
}
