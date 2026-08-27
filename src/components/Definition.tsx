import { FLIPS, FLIP_DEFINITION } from "@/data/flips";

const first = [...FLIPS]
  .filter((f) => f.status === "released")
  .sort((a, b) => a.date.localeCompare(b.date))[0];

/**
 * 定義のブロック。辞書の一項目として組む。
 * 左に見出し語と品詞、罫をはさんで右に語釈と本文。
 * 文言はこす.くま本人の言葉なので data から出してそのまま流す。
 */
export default function Definition() {
  return (
    <section className="defn plate" aria-labelledby="defn-word">
      <span className="plate-tab en">DEFINITION</span>
      <div className="defn-row">
        <div className="defn-key">
          <span className="defn-word" id="defn-word">
            {FLIP_DEFINITION.word}
          </span>
          <span className="defn-pos">{FLIP_DEFINITION.pos}</span>
          <span className="defn-romaji en">FLIP</span>
        </div>
        <div className="defn-val">
          <p className="defn-gloss">{FLIP_DEFINITION.gloss}</p>
          {FLIP_DEFINITION.body.map((line) => (
            <p className="defn-body" key={line}>
              {line}
            </p>
          ))}
        </div>
        <dl className="defn-notes">
          <dt className="en">ENTRIES</dt>
          <dd>{FLIPS.length}本</dd>
          <dt className="en">FIRST</dt>
          <dd>
            {first.date.replace(/-/g, ".")} {first.title}
          </dd>
          <dt className="en">FORM</dt>
          <dd>カセット1本＝ふりっぷ1本</dd>
        </dl>
      </div>
    </section>
  );
}
