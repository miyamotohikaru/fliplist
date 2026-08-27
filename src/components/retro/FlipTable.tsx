import { FLIPS, type Flip } from "@/data/flips";
import Cartridge from "@/components/Cartridge";
import BreakText from "./BreakText";
import { canOpen, isOpen } from "./util";

/**
 * カセットの絵の倍率。88x64 のドット絵なので、2倍で 176x128。
 * 当時のリンク集が横に並べていたバナー（88x31）とだいたい同じ幅になる。
 * 3倍にすると1行が背高くなりすぎて、16行の表が読み通せなくなる。
 */
const CART_SCALE = 2;

/**
 * 名前の携帯だけの改行位置。flip.title 自体には記号を混ぜない
 * （aria-label や更新履歴でも同じ文字列をそのまま使っているため）。
 * ここに無い slug は flip.title をそのまま出す。
 */
const TITLE_BREAKS: Record<string, string> = {
  friends: "ともだち◆ジェネレーター",
  osyaberi: "元も子もない◆こすくまくん",
  ads: "世界一◆広告の多いゲーム",
};

/**
 * ふりっぷ一覧表。
 *
 * 罫は会社HPの表と同じ（本物 home.css の #home .cont02 table）。
 *   border: solid 2px yellowgreen / border-style: inset / background: #fff
 *   th はまんなか寄せ、td は左寄せ、border-collapse は指定しない
 * ここは同じ会社のページである印なので1つも変えない。
 *
 * 中身のほうは「リンク集」の作り。まだできていないものには当時の言い方で「工事中」を出す。
 * GIFの工事中マークが手元に無いので、黄色地に黒枠の札を字と罫だけで作る。
 *
 * 名前の左に、そのふりっぷのカセットの絵を1本ずつ置く。
 * 当時のリンク集は行の頭に 88x31 のバナーGIFを並べていたので、そこと同じ役。
 * 絵は第一稿と同じ描画プログラムだが、**立体感を抜いた**ものを使う
 * （drawCartridge の flat）。動くところも第一稿と同じで、GIFのように回り続ける。
 *
 * 見出しの行を <thead> ではなく <tbody> の1行目に置いてあるのは、
 * flip と打つと表がまるごとひっくり返る仕掛け（Tricks.tsx）が
 * tBodies[0].rows を裏返すため。ここを thead にすると見出しが回らない。
 */
export default function FlipTable() {
  return (
    <table>
      <tbody>
        <tr>
          <th className="head t-no">No.</th>
          <th className="head t-cart">カセット</th>
          <th className="head t-ttl">ふりっぷの名前</th>
          <th className="head t-desc">どんなもの</th>
          <th className="head t-state">ぐあい</th>
        </tr>
        {FLIPS.map((flip, i) => (
          <Row key={flip.slug} flip={flip} n={i + 1} />
        ))}
      </tbody>
    </table>
  );
}

/**
 * 絵のほうは名前のリンクと行き先が同じなので、読み上げでは二重になる。
 * aria-hidden ＋ tabIndex=-1 で読み上げと Tab からは外し、
 * 目で見て押す人にだけ効くようにする（名前のリンクは残っている）。
 */
function cartClass(open: boolean): string {
  return open ? "cartlink" : "cartlink soon";
}

function Row({ flip, n }: { flip: Flip; n: number }) {
  const open = isOpen(flip);
  const press = canOpen(flip);
  const titleNode = <BreakText text={TITLE_BREAKS[flip.slug] ?? flip.title} />;

  return (
    <tr>
      <td className="t-no">{String(n)}</td>
      {/* カセットの絵。名前と同じ行き先へ、絵ごと押せる。
          まだ公開していないものは封の札を貼って、CSSで色を落とす（.soon）。
          押す/押さないは名前のほうと同じ判定（行き先が空の3件だけ押せない）。 */}
      <td className="t-cart">
        {press ? (
          <a
            className={cartClass(open)}
            href={flip.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            aria-hidden
          >
            <Cartridge flip={flip} scale={CART_SCALE} animate flat soon={!open} />
          </a>
        ) : (
          <span className={cartClass(open)}>
            <Cartridge flip={flip} scale={CART_SCALE} animate flat soon={!open} />
          </span>
        )}
      </td>
      <td className="t-ttl">
        {press ? (
          <a href={flip.url} target="_blank" rel="noopener noreferrer">
            {titleNode}
          </a>
        ) : (
          /* 行き先が空の3件。押せないので、字だけ置いて灰色にしておく */
          <span className="nolink">{titleNode}</span>
        )}
        {/*
          携帯のときだけ、名前の下に「どんなもの」を出す（CSSで出し入れする）。
          携帯の幅では5列を並べると「どんなもの」が1行4文字になってしまう。
          この1つを名前と同じマスに入れれば、カセットの絵を等倍のまま置ける。
          ラベルの字が読めるかどうかが要点なので、絵の大きさを譲らない。
          表の列としては消えるが、字はここに残る。
        */}
        <span className="t-sub">{flip.desc ? <BreakText text={flip.desc} /> : "―"}</span>
      </td>
      {/* 内容はシートの言葉のまま。空のものは昔の表と同じで「―」 */}
      <td className="t-desc">{flip.desc ? <BreakText text={flip.desc} /> : "―"}</td>
      <td className="t-state">
        {open ? <span className="open">公開中</span> : <span className="kouji">工事中</span>}
      </td>
    </tr>
  );
}
