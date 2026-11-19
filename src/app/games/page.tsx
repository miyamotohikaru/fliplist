import type { Metadata } from "next";
import Cartridge from "@/components/Cartridge";
import SubPage from "@/components/retro/SubPage";
import { OPENED } from "@/components/retro/util";
import { GUIDES } from "@/data/guides";

export const metadata: Metadata = {
  title: "ゲームの遊び方 | 株式会社こす.くま",
  description:
    "こす.くまがブラウザで公開している「ふりっぷ」（ゲームや小さなあそび）の、内容と遊び方の説明ページです。",
};

/** 遊び方のページがあるもの。公開日のあたらしい順（更新履歴と同じ） */
const LIST = OPENED.filter((f) => GUIDES[f.slug]);

/**
 * ゲームの遊び方の一覧。
 * 表の組みは一覧ページの表と同じ（.cont02）。列は カセット／名前／ひとことの3つ。
 * 名前とカセットは、そのゲームの説明ページへ（ゲーム本体へは説明ページから）。
 */
export default function GamesPage() {
  return (
    <SubPage title="ゲームの遊び方" crumbs={[{ label: "ゲームの遊び方" }]}>
      <section>
        <div className="doc">
          <p>
            こす.くまがブラウザで公開している「ふりっぷ」（ゲームや小さなあそび）の、内容と遊び方の説明ページです。
            <br />
            どれもスマートフォンやパソコンのブラウザから、インストールなしで遊べます
            <br />
            {
              "（Chrome の拡張機能は、Chrome ウェブストアから追加して使います）。"
            }
          </p>
          <p>
            各ページでは「どんなものか」「遊び方・操作」「つくったときのこだわり」「遊べる環境」を紹介しています。
            <br />
            {"ゲーム本体は、各ページの「あそぶ」から開けます。公開順の一覧は"}
            <a href="/">ふりっぷ一覧</a>にまとめています。
          </p>
        </div>
      </section>

      <section>
        <p className="note">
          ※いま説明があるのは{LIST.length}
          本です。公開日のあたらしいものが上です。
        </p>
        <div className="cont02">
          <table>
            <tbody>
              <tr>
                <th className="head">カセット</th>
                <th className="head">ふりっぷの名前</th>
                <th className="head">どんなもの</th>
              </tr>
              {LIST.map((f) => (
                <tr key={f.slug}>
                  <td className="t-cart">
                    <a
                      className="cartlink"
                      href={`/games/${f.slug}`}
                      tabIndex={-1}
                      aria-hidden
                    >
                      <Cartridge flip={f} scale={2} animate flat />
                    </a>
                  </td>
                  <td className="t-ttl">
                    <a href={`/games/${f.slug}`}>{f.title}</a>
                  </td>
                  <td className="t-desc">
                    {GUIDES[f.slug].lead}
                    <br />
                    <a className="more" href={`/games/${f.slug}`}>
                      ▶遊び方を読む
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note note--foot">
          ※ゲームの内容は更新により変わることがあります。ご意見・ご感想はお問い合わせからお寄せください。
        </p>
      </section>
    </SubPage>
  );
}
