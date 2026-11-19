import EditMode from "./EditMode";
import Heading from "./Heading";
import Marquee from "./Marquee";
import NoRightClick from "./NoRightClick";

export const HOME = "https://kosukuma.com/home.html";
export const CONTACT = "https://kosukuma.com/contact/";
export const MAIL = "kosu.kuma@kosukuma.com";

/**
 * ふりっぷ一覧の下の階のページ（遊び方・運営者情報・プライバシーポリシー）の器。
 *
 * Google AdSense の審査向けに足したページ（2026-11-19 ユーザー依頼）。
 * 「今のデザインのままで」とのことなので、一覧ページと同じ部品で組む:
 *   電光掲示板 → 天（どこにいるかの1行）→ ページ名（朱の罫）→ 本文 → 下の階への道 → 奥付
 * 本文の箱は「ふりっぷとは」と同じ、白地に黄緑の inset 罫（globals.css の .doc）。
 *
 * crumbs は「ふりっぷ一覧」より下の段。最後の1つが今いるページ（リンクなし）。
 */
export default function SubPage({
  title,
  titleSize = 56,
  crumbs,
  children,
}: {
  title: string;
  titleSize?: number;
  crumbs: Array<{ label: string; href?: string }>;
  children: React.ReactNode;
}) {
  return (
    <>
      <NoRightClick />
      {/* ?edit のときだけ出る改行の調整モード */}
      <EditMode />
      <Marquee />

      <header className="header" id="top">
        <p className="crumb">
          <a href={HOME}>トップページ</a>　＞　<a href="/">ふりっぷ一覧</a>
          {crumbs.map((c) => (
            <span key={c.label}>
              　＞　{c.href ? <a href={c.href}>{c.label}</a> : c.label}
            </span>
          ))}
        </p>
      </header>

      <main>
        <h1 className="pagettl pagettl--sub">
          <Heading variant="lime" size={titleSize} weight={500}>
            {title}
          </Heading>
        </h1>

        {children}

        <SiteLinks />

        <div className="okuduke">
          <p className="back">
            <a href="#top">▲このページの先頭へもどる</a>
          </p>
          <p className="back">
            <a href="/">▲ふりっぷ一覧へもどる</a>
          </p>
        </div>
      </main>

      <footer className="footer">
        <p className="caution">無断転載・コピー等を禁止いたします。</p>
        <span className="copy">Copyright © kosukuma, Inc.</span>
      </footer>
    </>
  );
}

/** 下の階のページへの道。一覧ページの奥付にも同じものを置く */
export function SiteLinks() {
  return (
    <p className="sitelinks">
      <a href="/">ふりっぷ一覧</a>
      <span className="bar">｜</span>
      <a href="/games">ゲームの遊び方</a>
      <span className="bar">｜</span>
      <a href="/company">運営者情報</a>
      <span className="bar">｜</span>
      <a href="/privacy">プライバシーポリシー</a>
      <span className="bar">｜</span>
      <a href={CONTACT}>お問い合わせ</a>
    </p>
  );
}
