import BgPicker from "@/components/retro/BgPicker";
import BreakText from "@/components/retro/BreakText";
import FlipTable from "@/components/retro/FlipTable";
import Heading from "@/components/retro/Heading";
import Marquee from "@/components/retro/Marquee";
import MobileBreak from "@/components/retro/MobileBreak";
import NoRightClick from "@/components/retro/NoRightClick";
import Tricks from "@/components/retro/Tricks";
import { CLOSED_COUNT, HISTORY, jpDate, OPENED, PAGE_MADE } from "@/components/retro/util";
import { FLIP_DEFINITION } from "@/data/flips";

const HOME = "https://kosukuma.com/home.html";
const CONTACT = "https://kosukuma.com/contact/";

/**
 * ふりっぷ一覧。
 *
 * 株式会社こす.くまのホームページの中の1ページ。ただしトップページではなく、
 * 「もくじ／リンク集」の役のページ。当時この役のページに置かれていたものでできている。
 *
 *   掲示板    電光掲示板。紺地に黄。ページのいちばん上
 *   天        ロゴ（会社のどのページにも同じものが乗っている）＋どこにいるかの1行
 *   ページ名  ふりっぷ一覧。下に朱の罫（会社HPの下位ページの題の作り）
 *   もくじ    このページの中の行き先。トップページには無い節
 *   一覧表    このページの用。だから他より先に置く
 *   更新履歴  日付＋一行。<dl> を float でくずしてならべる
 *   ふりっぷとは  用語のせつめい。表を1マスだけ使って囲う
 *   背景をかえる  小さな壁紙の見本を4つ
 *   奥付      カウンター・リンクフリー・もどり道
 *
 * トップページと同じにしていないところ:
 *   ・青空と飛行機の帯は無い。写真のスライダーも無い。事業モデルの図も無い
 *   ・帯（掲示板）は天より上。トップが青空の帯を置いている高さは空けてある
 *   ・カウンターは天ではなく奥付にある（当時の個人ページはたいていそこ）
 *   ・節の順が違う。表がいちばん最後ではなく先に来る
 *   ・節の見出しは金・水色の大見出しを使わず、深緑の一種で大小だけ変えている
 */
export default function Page() {
  return (
    <>
      <NoRightClick />
      {/*
        隠してある仕掛け3つ。どれも「ひっくり返す」で通してある。
        ページ名を1字ずつ押す／flip と打つ／電光掲示板を掴んで引っぱる。
        版面には何も出さない（この部品は何も描かない）。
      */}
      <Tricks />

      {/* ── 電光掲示板 ─────────────────────────────
          ページのいちばん上。当時は <body> を開けてすぐ流れる字を置くページが多かった。
          会社トップは同じ高さのところに青空の帯があるので、こちらはそこを空けて、
          帯そのものを天のさらに上へ持ってきてある。 */}
      <Marquee />

      {/* ── 天 ───────────────────────────────────
          会社のロゴ（ttl.gif）はここに置かない。
          このページはトップから降りてきた先で、題は「ふりっぷ一覧」のほうだから。
          代わりに「いまどこを見ているか」の1行だけを置く。 */}
      <header className="header" id="top">
        <p className="crumb">
          <a href={HOME}>トップページ</a>　＞　ふりっぷ一覧
        </p>
      </header>

      <main>
        {/*
          ページ名。会社HPの下位ページ（/contact/）は本文の頭に題を1つ置いて、
          その下に朱の3pxの罫を引いている（本物 style.css の #contact #container h1）。
          同じ作りにして、字だけ見出し画像の組み（WordArt）で出す。

          ★「ふりっぷ」の4字には data-flip-index を付けてある。
            querySelectorAll("[data-flip-index]") でちょうど4つ。
            「一覧」の2字には付けないので、仕掛けに巻き込まれない。
        */}
        {/* ロゴを外したので、このページで一番上の見出しはここ。h1 にする */}
        <h1 className="pagettl">
          {"ふりっぷ".split("").map((c, i) => (
            <span className="ttl-c" data-flip-index={i} key={i}>
              <Heading variant="lime" size={72} weight={500}>
                {c}
              </Heading>
            </span>
          ))}
          {"一覧".split("").map((c) => (
            <span className="ttl-c" key={c}>
              <Heading variant="lime" size={72} weight={500}>
                {c}
              </Heading>
            </span>
          ))}
        </h1>

        <p className="lead">
          {/* 何の仲間なのかを先に言う1行。「ふりっぷとは」の節の見出しに使っている
              のと同じ文言を持ってきている。二か所で言い方がずれないように、
              文字を打ち直さず FLIP_DEFINITION.lead をそのまま出す。 */}
          {FLIP_DEFINITION.lead}
          <br />
          <BreakText text="こす.くまがつくった、◆小さなあそびと実験のもくじです。" />
          <br />
          <span className="blink">★ふりっぷは随時ふえていきます★</span>
        </p>
        <p className="lastmod">最終更新：{jpDate(PAGE_MADE)}</p>

        {/* ── もくじ ───────────────────────────────
            当時のこの役のページには、たいてい頭に「もくじ」があった。
            箱の罫は会社HPの表と同じ組み（solid 2px yellowgreen ＋ inset）。 */}
        <nav className="moku">
          <p className="moku-h">― も く じ ―</p>
          <ul>
            <li>
              <a href="#list">ふりっぷ一覧表</a>（ぜんぶ）
            </li>
            <li>
              <a href="#rireki">更新履歴</a>
            </li>
            <li>
              <a href="#toha">ふりっぷとは</a>
            </li>
            <li>
              <a href="#bg">背景をかえる</a>（10色）
            </li>
            <li>
              <a href="#okuduke">このページについて</a>
            </li>
          </ul>
        </nav>

        {/* ── 一覧表 ───────────────────────────────
            このページの用はこれなので、いちばん先に置く。 */}
        <section id="list">
          {/* このページの用なので、節の見出しはここだけ大きい。
              色は他の節と同じ深緑（白い縁が付いているので、壁紙を10色どれにかえても読める）。
              金と水色は薄い壁紙の上で弱くなるので、このページでは使わない */}
          <h3 className="sec sec--main">
            <Heading variant="green" size={50}>
              ふりっぷ一覧表
            </Heading>
          </h3>

          <p className="note">
            <BreakText
              text={`※いまあそべるのは${OPENED.length}本です。◆　これからできるものも、できた順にならべてあります。`}
            />
            <br />
            <BreakText text="※ふりっぷは随時ふえていきますので、◆　番号も下へふえていきます。" />
          </p>
          {/* ならび順のしるし。表がひっくり返ると▼が▲になって、
              言い方のほうも入れかわる（どちらもここに書いてあって、CSSで出し入れする）。
              初見では「ふるい順」だけが出ている。 */}
          <p className="order">
            ならび<span className="yarrow">▼</span>
            <span className="order-a">公開日のふるい順</span>
            <span className="order-b">公開日のあたらしい順</span>
          </p>

          {/* 表そのもの。cont02 という名前は会社HPの表と同じ役だから合わせてある */}
          <div className="cont02">
            <FlipTable />
          </div>

          <p className="note note--foot">
            ※<span className="kouji">工事中</span>
            のふりっぷは、まだできていません。
            <MobileBreak />
            　公開までしばらくお待ちください。
            <br />
            ※<span className="kouji">工事中</span>のふりっぷは押せません（{CLOSED_COUNT}本あります）。
            <br />
            ※あそべるふりっぷは、押すとあたらしい窓でひらきます。
          </p>
          {/* 表が長いので、当時の作法どおり節の終わりにもどり道を1つ置く */}
          <p className="uphere">
            <a href="#top">▲先頭へ</a>
          </p>
        </section>

        {/* ── 更新履歴 ─────────────────────────────
            日付＋一行。会社HPの最新情報は <ul> だが、こちらは <dl> でならべる。
            日付の頭の点は会社HPと同じ矢印のGIF。 */}
        <section id="rireki">
          <h3 className="sec">
            <Heading variant="green" size={36}>
              更新履歴
            </Heading>
          </h3>

          <dl className="rireki">
            {HISTORY.map((log, i) => (
              <div className="rireki-row" key={`${log.date}-${i}`}>
                <dt>{jpDate(log.date)}</dt>
                <dd>
                  {log.text}
                  {i < 2 ? (
                    <>
                      {/* WORD JOINER(幅ゼロ、U+2060)。無いと携帯の狭い版面で
                          NEW札だけ次の行へ落ちることがあった */}
                      {"⁠"}
                      <span className="new">
                        <img src="/hp/new.gif" alt="new" width={24} height={14} />
                      </span>
                    </>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
          <p className="note">※あたらしいものが上です。古い分もぜんぶ残しています。</p>
        </section>

        {/* ── ふりっぷとは ───────────────────────────
            用語のせつめい。当時は表を1マスだけ使って本文を囲うのがふつうだった。
            中の4行はこす.くまの言葉なので一字も変えない。 */}
        <section id="toha">
          <h3 className="sec">
            <Heading variant="green" size={36}>
              ふりっぷとは
            </Heading>
          </h3>

          <table className="def">
            <tbody>
              <tr>
                <td>
                  {/* 見出し語の前に置く1行。何の仲間なのかを先に言う */}
                  <p className="def-lead">{FLIP_DEFINITION.lead}</p>
                  <p className="def-word">
                    {FLIP_DEFINITION.word}
                    <span className="def-pos">{FLIP_DEFINITION.pos}</span>
                  </p>
                  <p className="def-gloss">{FLIP_DEFINITION.gloss}</p>
                  {FLIP_DEFINITION.body.map((line) => (
                    <p className="def-body" key={line}>
                      {line}
                    </p>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── 背景をかえる ───────────────────────── */}
        <section id="bg">
          <h3 className="sec">
            <Heading variant="green" size={36}>
              背景をかえる
            </Heading>
          </h3>
          <BgPicker />
        </section>

        {/* ── 奥付 ─────────────────────────────── */}
        <div className="okuduke" id="okuduke">
          <p className="okuduke-h">― このページについて ―</p>

          <p>
            <BreakText text="このページはリンクフリーです。◆ご自由にはってください。" />
            <br />
            ご感想は
            <a href={CONTACT}>お問い合わせ</a>
            からどうぞ。
          </p>

          <p className="back">
            <a href="#top">▲このページの先頭へもどる</a>
          </p>
          <p className="back">
            <a href={HOME}>▲株式会社こす.くま トップページへもどる</a>
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
