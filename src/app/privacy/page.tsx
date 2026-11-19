import type { Metadata } from "next";
import SubPage, { CONTACT, MAIL } from "@/components/retro/SubPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 株式会社こす.くま",
  description:
    "株式会社こす.くまが運営するふりっぷ（ゲーム・小さなあそび）における、Cookie・広告配信（Google AdSense・忍者AdMax）・アクセス解析などの情報の取り扱いについて。",
};

/**
 * プライバシーポリシー。
 * 文面はユーザーが用意した参考原稿（kosukuma.com/privacy/ 用・2026-11-18制定）のまま。
 * 見た目だけ一覧ページの作りにそろえている。
 */
export default function PrivacyPage() {
  return (
    <SubPage
      title="プライバシーポリシー"
      crumbs={[{ label: "プライバシーポリシー" }]}
    >
      <section>
        <div className="doc">
          <p>
            株式会社こす.くま（以下「当社」といいます）は、当社が運営するウェブサイト「kosukuma.com」および
            <br />
            そのサブドメインで提供するゲーム・コンテンツ（以下「当サイト」といいます）における、
            <br />
            利用者の情報の取り扱いについて、以下のとおり定めます。
          </p>

          <h2>1. 取得する情報</h2>
          <p>当サイトでは、次の情報を取得することがあります。</p>
          <ul>
            <li>
              お問い合わせフォームやメールでご連絡いただいた際の、お名前・メールアドレス・お問い合わせ内容など、
              <br />
              利用者ご本人が入力した情報
            </li>
            <li>
              ゲームやコンテンツの利用時に入力されたニックネーム、作品、スコアなどの情報
            </li>
            <li>
              アクセスログ（IPアドレス、ブラウザの種類、参照元、閲覧したページ、日時など）や、Cookie等の識別子
            </li>
          </ul>

          <h2>2. 利用目的</h2>
          <ul>
            <li>お問い合わせへの回答や、必要なご連絡のため</li>
            <li>ゲーム・コンテンツの提供、ランキングや記録の表示のため</li>
            <li>当サイトの利用状況の把握、不具合の調査、内容の改善のため</li>
            <li>不正な利用の防止のため</li>
            <li>広告の配信のため（後述）</li>
          </ul>

          <h2>3. Cookie（クッキー）とブラウザへの保存について</h2>
          <p>
            当サイトでは、利便性の向上やアクセス解析、広告配信のために、Cookieや、ブラウザのローカルストレージ等の仕組みを使うことがあります。ゲームのベストスコアや作品、設定などは、利用者のブラウザ内に保存される場合があります。
          </p>
          <p>
            Cookieは、ブラウザの設定により無効にしたり削除したりできます。ただし、無効にした場合、当サイトの一部の機能が
            <br />
            正しく動かないことがあります。
          </p>

          <h2>4. 広告の配信について</h2>
          <p>
            当サイトでは、第三者配信の広告サービス「Google
            AdSense」および「忍者AdMax」を利用しています、
            <br />
            または利用する場合があります。
          </p>
          <p>
            Google などの第三者配信事業者は、Cookie
            を使用して、利用者が当サイトや他のウェブサイトに過去にアクセスした際の情報に基づいて広告を配信します。Google
            は広告 Cookie を使用することにより、利用者が当サイトや他のサイトに
            <br />
            アクセスした際の情報に基づいて、Google
            やそのパートナーが適切な広告を表示できるようにしています。
          </p>
          <p>
            利用者は、
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google の広告設定
            </a>
            で、パーソナライズ広告を無効にできます。また、
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.aboutads.info
            </a>
            に
            <br />
            アクセスすると、パーソナライズ広告に使われる第三者配信事業者の
            Cookie を無効にできます。
          </p>
          <p>
            Google による情報の取り扱いについては、
            <a
              href="https://policies.google.com/technologies/ads?hl=ja"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google の広告に関するポリシー
            </a>
            および
            <a
              href="https://policies.google.com/technologies/partner-sites?hl=ja"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google のサービスを使用するサイトやアプリから収集した情報の Google
              による使用
            </a>
            をご覧ください。
          </p>
          <p>
            忍者AdMax（忍者ツールズ株式会社）による情報の取り扱いについては、
            <a
              href="https://www.ninja.co.jp/privacy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              同社のプライバシーポリシー
            </a>
            をご覧ください。
          </p>

          <h2>5. アクセス解析について</h2>
          <p>
            当サイトでは、利用状況を把握するために、Cloudflare Web Analytics
            などのアクセス解析ツールや、
            <br />
            ゲームのプレイ時間などを記録する当社の仕組みを使うことがあります。これらは個人を特定するためのものではなく、
            <br />
            統計的な情報として扱います。
          </p>

          <h2>6. 第三者への提供</h2>
          <p>
            当社は、法令に基づく場合を除き、利用者ご本人の同意なく個人情報を第三者に提供しません。
            <br />
            なお、当サイトの運営に必要な範囲で、サーバー・配信などの業務を外部の事業者に委託することがあります。
          </p>

          <h2>7. 各サービスの個別のポリシー</h2>
          <p>
            一部のゲーム・サービス（例：
            <a
              href="https://osyaberi.kosukuma.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              こすくまくんとおしゃべり
            </a>
            ）では、
            <br />
            そのサービス固有のプライバシーポリシーや利用規約を別に定めています。その場合は、個別の定めが優先されます。
          </p>

          <h2>8. 免責事項</h2>
          <p>
            当サイトの内容は、できるかぎり正確な情報を掲載するよう努めていますが、
            <br />
            その正確性や安全性を保証するものではありません。当サイトの利用によって生じた損害について、
            <br />
            当社は責任を負いかねます。ゲームの中には、端末を動かしたり投げたりするものがあります。
            <br />
            周囲の安全を確認し、ご自身の責任でお楽しみください。
          </p>
          <p>
            当サイトからリンクしている外部サイトの内容については、当社は責任を負いません。
          </p>

          <h2>9. 著作権</h2>
          <p>
            当サイトに掲載している文章・画像・ゲームなどの著作権は、当社または正当な権利者に帰属します。
            <br />
            無断での転載・複製はご遠慮ください。
          </p>

          <h2>10. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは、
            <a href={CONTACT}>お問い合わせフォーム</a>、
            <br />
            またはメール（
            <a href={`mailto:${MAIL}`}>{MAIL}</a>）までご連絡ください。
          </p>
          <table className="doc-table">
            <tbody>
              <tr>
                <th>運営者</th>
                <td>株式会社こす.くま（kosu.kuma, Inc.）</td>
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
            </tbody>
          </table>

          <h2>11. 改定</h2>
          <p>
            本ポリシーは、必要に応じて内容を見直し、改定することがあります。
            <br />
            改定後の内容は、このページに掲載した時点から効力を持つものとします。
          </p>
          <p className="doc-date">制定日：2026年11月18日</p>
        </div>
      </section>
    </SubPage>
  );
}
