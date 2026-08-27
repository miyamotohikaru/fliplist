import { PixelGfx } from "./gfx";

// ラベルに和文の題字を置くための道具。
//
// 実機のファミコンのラベルは題字がカタカナと漢字で、しかも大きい。
// ところがラベルは 68x40 しかないので、字数の多い題名は必ずここで詰まる。
// 「存在しない言葉辞典」で一度全部踏んだので、その結果をここにまとめてある。
//
// ── 級数 ──
// 16px（この書体の設計級数）だと 68px には **1行4文字** しか入らない。
// 5文字で80px。だから5文字以上の行は 13px に落とす（5文字=65px）。
// **13px が下限。** 12px にすると画数の多い漢字（葉・辞・職・鑑）の
// 横画が繋がって別字か黒い塊になる。
//
// ── 閾値 ──
// 13px では既定の閾値128だと言・葉・辞の横画が中間調で繋がる。
// 16px設計の書体を13pxに縮めるので、1本の横画が0.8px幅になって隣と溶ける。
// 190まで上げると中間調が落ちて画と画の間が開き、画数が数えられるようになる。
// 上げすぎ（230）ると今度は画そのものが消えるので、この辺りが底――というのが
// Chromium（開発機）での話だった。
//
// 2026-08-13、実機（iOSのLINEアプリ内ブラウザ＝WebKit）で190のまま公開したところ、
// 8方向にふちを回していないラベル（words/values/vanished-jobs/flip-archive/
// diagnosis/kikiippatsu/ads/friends など、jpRow をふちなしで使うもの）だけ
// 字が砂嵐状に崩れた。8方向にふちを回しているラベル（creature/hitodasuke）は
// 190のままでも実機で無事だった――ふちが1px分の描き直しを8回重ねるぶん、
// どれか1回が閾値ぎりぎりで欠けても他の7回が埋め合わせる。ふちを回さない
// ラベルにはその余裕が無く、WebKit側のアンチエイリアスの掛かり方が
// Chromiumよりわずかに弱いだけで、際どい画素がまるごと閾値を割ってしまう。
//
// 対策は190→130への引き下げ。130でも「言葉辞典」のような画数の多い字が
// 繋がって黒い塊になっていないことを実測で確認済み（Chromium上）。
// ふち無しラベルの安全側に寄せた値なので、ふち有りラベル（creature.ts の
// 独自 T_TH=190 など）は個別の閾値のままでよい――むしろ動かさないこと。
//
// ── 枡入れ ──
// textJP は「インクの外接矩形」の左上を (x,y) に置く。**字送りではない。**
// だから size 間隔で流すと字ごとに左右上下へずれる。
// 墨の寸法を測って枡の中央に据え直すのが jpRow の仕事。
//
// 中央に据えた位置は、実測したところ書体自身の左サイドベアリング／
// ベースラインと1pxの狂いもなく一致した（漢字は左0・仮名は左1、
// 背の低い し=1 い=2 言=1 だけ下がる）。「ー」のように宙に浮く字も
// 中央に据えれば正しい位置に来る。例外はベースラインより下に垂れる字だけ。

/** 5文字以上の行に使う級数。これ以上小さくすると漢字が潰れる。 */
export const JP_SIZE = 13;
/** 字母を1bitに落とすときの閾値。JP_SIZE のときはこれを使う。 */
export const JP_TH = 130;

type Ink = { w: number; h: number };
const inkCache = new Map<string, Ink>();

/**
 * 1文字ぶんの墨の寸法。
 * 測り方: 空の紙に1文字だけ刷って、墨の付いた範囲を数える。
 * 字母は gfx 側で使い回されるので、実費は1文字につき1回きり。
 */
export function inkBox(ch: string, size: number, threshold: number): Ink {
  const key = `${ch}|${size}|${threshold}`;
  const hit = inkCache.get(key);
  if (hit) return hit;
  const probe = new PixelGfx(size * 2, size * 2);
  probe.textJP(0, 0, ch, "#ffffff", { size, threshold });
  let w = 0;
  let h = 0;
  for (let y = 0; y < probe.h; y++)
    for (let x = 0; x < probe.w; x++)
      if (probe.data[(y * probe.w + x) * 4 + 3] > 0) {
        if (x + 1 > w) w = x + 1;
        if (y + 1 > h) h = y + 1;
      }
  const box: Ink = { w, h };
  inkCache.set(key, box);
  return box;
}

/** 題字全体でいちばん背の高い字の墨。行の高さの基準。行ごとに測ると行間がずれる。 */
export function ascent(s: string, size: number, threshold: number): number {
  let a = 0;
  for (const ch of s) a = Math.max(a, inkBox(ch, size, threshold).h);
  return a;
}

export type JpRowOptions = {
  size?: number;
  threshold?: number;
  /** 行の高さの基準。題字全体で共通の値を渡すこと（行ごとに測ると行間がずれる） */
  ascent?: number;
  /** 右下に1pxずらして先に敷く色。地が粗いとき、字を地から押し出すのに使う */
  shadow?: string;
  /** 中央合わせの基準幅。既定はラベルの幅 */
  width?: number;
  /** 中央合わせをやめて左端をここに置く */
  x?: number;
};

/**
 * 1行ぶんの題字を置く。size幅の枡を並べて、墨を枡の中央に据える。
 * 行そのものも、字送りではなく墨の左右端で中央に合わせる。
 */
export function jpRow(g: PixelGfx, y: number, s: string, c: string, o: JpRowOptions = {}) {
  const size = o.size ?? JP_SIZE;
  const th = o.threshold ?? JP_TH;
  const asc = o.ascent ?? ascent(s, size, th);
  const width = o.width ?? 68;
  const chars = [...s];
  if (chars.length === 0) return;

  const lead = (ch: string) => Math.round((size - inkBox(ch, size, th).w) / 2);
  const last = chars[chars.length - 1];
  const inkW = (chars.length - 1) * size + lead(last) + inkBox(last, size, th).w - lead(chars[0]);
  const x0 = o.x !== undefined ? o.x : Math.round((width - inkW) / 2) - lead(chars[0]);

  // 影が先、字が後。閾値を上げた字は画が1pxまで細るので、
  // 地が粗いところでは1pxの影を敷かないと沈む。
  const passes: Array<[number, string]> = o.shadow
    ? [
        [1, o.shadow],
        [0, c],
      ]
    : [[0, c]];
  for (const [off, col] of passes) {
    let cx = x0;
    for (const ch of chars) {
      const b = inkBox(ch, size, th);
      g.textJP(cx + lead(ch) + off, y + Math.round((asc - b.h) / 2) + off, ch, col, {
        size,
        threshold: th,
      });
      cx += size;
    }
  }
}
