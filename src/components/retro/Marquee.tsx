import { OPENED } from "./util";

/**
 * 電光掲示板。
 *
 * 装置そのものは当時のホームページの定番なので置くが、
 * 会社トップの .marquee（黄色地に緑50pxの斜体）はそのまま使わない。
 * このページの掲示板は「駅の発車案内」ふうの黒地に山吹。
 * 本物からもらっているのは「帯の中を字が右から左へ流れる」ことと、
 * 「中の <span> だけ色をかえて下線を引く」という組み方だけ（本物 home.css の .marquee span）。
 *
 * 掴んで引っぱると裏返る（src/components/retro/Tricks.tsx）。
 * そのため div.marquee > p という形は変えない。
 */
export default function Marquee() {
  return (
    <div className="marquee">
      <p>
        ＊＊＊　ふりっぷ一覧へようこそ　＊＊＊　あたらしいふりっぷができたら、この
        ページにくわえていきます　＊＊＊　いまあそべるのは
        <span>{OPENED.length}本</span>
        　＊＊＊
      </p>
    </div>
  );
}
