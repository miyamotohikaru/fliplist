import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 会社HPは「トップページ | 株式会社こす.くま」。同じ形にそろえる
  title: "ふりっぷ一覧 | 株式会社こす.くま",
  description:
    "ふりっぷ【名】日常を、ほんの少しひっくり返すきっかけ。こす.くまがつくった小さなあそびと実験のもくじです。",
  openGraph: {
    title: "ふりっぷ一覧 | 株式会社こす.くま",
    description: "日常を、ほんの少しひっくり返すきっかけ。",
    type: "website",
  },
};

/**
 * 会社HP（kosukuma.com/home.html）にそろえて、携帯でもパソコンと同じ版面で出す。
 * 会社HPは viewport の指定を2つ持っていて、後から書いた width=1200 が勝っている。
 * ここも 1200px 固定にする（2026-11-13 ユーザー指示「携帯で見た時、パソコンと同じサイズに」）。
 *
 * 前は device-width にして、携帯では表を畳んでいた。
 * 1200px 固定にすると、globals.css の @media (max-width: 1000px / 620px / 480px) は
 * 携帯でも効かなくなる（会社HPと同じ状態）。携帯だけの改行 MobileBreak も出ない。
 */
export const viewport: Viewport = {
  width: 1200,
  // Next.js は既定で initial-scale=1 を足す。付いたままだと携帯は等倍で
  // 1200px の左端だけを映すので、会社HPと同じく外して画面幅に縮めて出させる。
  initialScale: undefined,
};

/**
 * 前に来たときにえらんだ壁紙を、描く前に貼っておく。
 * これが無いと、いちどクリーム色が出てから色がかわる（ちらつく）。
 * 実際の絵の指定は globals.css の #home[data-fl-bg] にある。
 *
 * 中身に改行を入れないこと。view-source の1行目にこす.くま宣言文を出しているので、
 * ここで折り返すと宣言文の下に読める行ができてしまう。
 */
const RESTORE_BG =
  `try{var v=localStorage.getItem('fl-bg');if(v==='mint'||v==='sky'||v==='peach'){document.body.dataset.flBg=v}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        {/* カセットのラベルは canvas の fillText で和文を描くので、
            CSS 上はどの要素にも DotGothic16 を使っていない。
            preload と、下の隠し字（body内）の2本立てで読み込みを急がせる。
            iOS の LINE アプリ内ブラウザ（WKWebView）で、canvas 側の
            document.fonts.load() 呼び出しだけでは間に合わない／
            反映されないことがあった実機確認あり。 */}
        <link
          rel="preload"
          href="/fonts/DotGothic16-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      {/* id="home" は会社HPと同じ。CSSのセレクタも本物に合わせてある */}
      <body id="home">
        <script dangerouslySetInnerHTML={{ __html: RESTORE_BG }} />
        {/* 実際に画面には出さないが、本物の文字としてこのフォントを
            使わせておく。canvas への fillText だけに頼るより、
            ブラウザ標準の「使われている書体を読み込む」経路のほうが
            実装差に振り回されにくい。 */}
        <span aria-hidden style={{ position: "absolute", left: -9999, top: 0, fontFamily: '"DotGothic16"' }}>
          存
        </span>
        {children}
      </body>
    </html>
  );
}
