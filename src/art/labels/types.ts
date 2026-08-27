import type { PixelGfx } from "../gfx";

/**
 * ラベル絵の描画プログラム。
 *
 * 約束事:
 * - キャンバスは 68x40。原点は左上。この外には描かない（描いても切られる）。
 * - 背景は透明で渡ってくる。地の色を敷くのも各ラベルの仕事。
 * - t は 0..1 で循環する時間。動かさないラベルは無視してよい。
 * - 乱数を直接使わない。使うなら gfx の rng に固定のseedを渡す。
 *   同じ t なら必ず同じ絵になること。
 *
 * 重要: 16枚を1つの生成器で作らないこと。1枚ごとに、その企画にしかない
 * 図像を、その企画のために書く。共通のパターンに seed 違いを並べると
 * 「量産されたプレースホルダー」に見える。
 */
export type LabelDraw = (g: PixelGfx, t: number) => void;

export type LabelArt = {
  /** flips.ts の slug と一致させる */
  slug: string;
  /** ラベルから拾った代表色。カタログの色玉に使う（3〜5色） */
  swatch: string[];
  draw: LabelDraw;
};
