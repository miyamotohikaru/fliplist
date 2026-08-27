import WordArt, { type WordArtVariant } from "./WordArt";

/**
 * 見出しの入口。このページの見出しは全部ここを通る。
 *
 * 中身の作画は WordArt.tsx（本物の見出し画像4枚を画素で測って組んだもの）。
 *   gold  … ttl.gif            「株式会社こす.くま」金グラデ＋白縁＋灰の落ち影
 *   lime  … heading-company    「株式会社こす.くま」#00FF00 ＋黒の細い縁
 *   cyan  … heading-flip       「FLIP事業について」#00FFFF ＋ #FF0000 の縁
 *   green … ttl_news.gif       「最新情報」緑グラデ＋白縁
 *
 * 呼ぶ側は variant と size しか渡さない。
 * 作画の作法（縁の太さ・落ち影の有無・字の太さ）は WordArt が手本どおりに決める。
 * ここを1枚はさんでいるのは、作画のやり方が変わってもページ側を触らないため。
 */

export type HeadingVariant = WordArtVariant;

export type HeadingProps = {
  /** 縁取りと塗りの組み合わせ。本物の見出し画像4種に対応する */
  variant?: HeadingVariant;
  /** 字の高さ(px) */
  size?: number;
  /**
   * 字の太さ。省略すると手本の画像どおり。
   * 手本の cyan は 300（heading-flip.png の実測）で、あれは 75px の大きな見出し用。
   * それより小さく出すと線が細くて弱いので、このページでは太さを渡して使う。
   */
  weight?: number;
  children: string;
  className?: string;
};

export default function Heading({
  variant = "gold",
  size = 56,
  weight,
  children,
  className,
}: HeadingProps) {
  return (
    <WordArt variant={variant} size={size} weight={weight} className={className}>
      {children}
    </WordArt>
  );
}
