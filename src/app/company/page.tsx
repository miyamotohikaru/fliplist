import type { Metadata } from "next";
import PcBreak from "@/components/retro/PcBreak";
import SubPage, { CONTACT, MAIL } from "@/components/retro/SubPage";

export const metadata: Metadata = {
  title: "運営者情報 | 株式会社こす.くま",
  description:
    "ふりっぷ（ゲーム・小さなあそび）を運営する株式会社こす.くまの会社概要・所在地・連絡先・事業内容。",
};

/**
 * 運営者情報。
 * 文面はユーザーが用意した参考原稿（kosukuma.com/company/ 用）のまま。
 * 原稿で kosukuma.com/games/・/privacy/ を指していたリンクは、このサイトの中のページへ向けた。
 */
export default function CompanyPage() {
  return (
    <SubPage title="運営者情報" crumbs={[{ label: "運営者情報" }]}>
      <section>
        <div className="doc">
          <p>
            kosukuma.com
            と、そのサブドメインで公開しているゲーム・コンテンツは、株式会社こす.くまが運営しています。
          </p>

          <h2>会社概要</h2>
          <table className="doc-table">
            <tbody>
              <tr>
                <th>会社名</th>
                <td>株式会社こす.くま（英語表記：kosu.kuma, Inc.）</td>
              </tr>
              <tr>
                <th>設立</th>
                <td>2019年1月</td>
              </tr>
              <tr>
                <th>代表者</th>
                <td>春原 李貴（すのはら）、武知 勇樹（たけち）</td>
              </tr>
              <tr>
                <th>所在地</th>
                <td>東京都三鷹市下連雀1丁目7番18号</td>
              </tr>
              <tr>
                <th>メール</th>
                <td>
                  <a href={`mailto:${MAIL}`}>{MAIL}</a>
                </td>
              </tr>
              <tr>
                <th>お問い合わせ</th>
                <td>
                  <a href={CONTACT}>お問い合わせフォーム</a>
                </td>
              </tr>
              <tr>
                <th>ウェブサイト</th>
                <td>
                  <a href="https://kosukuma.com/">https://kosukuma.com/</a>
                </td>
              </tr>
            </tbody>
          </table>

          <h2>事業内容</h2>
          <p>
            当社は、各種企画の立案および実施を通じて、社会に対して新たな気づきや考えるきっかけを提供することを目的に
            <PcBreak />
            事業を行っています。展示、イベント、キャンペーン、制作物、映像、SNS発信、参加型企画など、
            <PcBreak />
            内容に応じた手法で企画をかたちにしています。
          </p>
          <p>
            中核となる「FLIP事業」では、企画テーマの設定から、構成の検討、実施方法の設計、発信、実施後の反応確認までを
            <PcBreak />
            一連の流れとして扱っています。
          </p>

          <h2>ふりっぷ（ゲーム・小さなあそび）について</h2>
          <p>
            「ふりっぷ」は、こす.くまがつくる小さなあそびや実験です。日常を、ほんの少しひっくり返すきっかけとして、
            <PcBreak />
            ブラウザで遊べるゲームやツールを公開しています。一覧は
            <a href="/">ふりっぷ一覧</a>、それぞれの内容と遊び方は
            <PcBreak />
            <a href="/games">ゲームの遊び方</a>のページで紹介しています。
          </p>

          <h2>個人情報の取り扱い</h2>
          <p>
            個人情報、Cookie、広告配信の取り扱いについては、
            <a href="/privacy">プライバシーポリシー</a>
            をご覧ください。
          </p>
        </div>
      </section>
    </SubPage>
  );
}
