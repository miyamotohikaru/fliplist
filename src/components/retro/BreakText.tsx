import MobileBreak from "./MobileBreak";

/**
 * 地の文の中に埋め込める改行の目印を、実際の改行に展開して出す。
 *
 *   ◆ … 携帯の版面(620px以下)だけで改行する（パソコンでは何も起きない。中身は MobileBreak.tsx）
 *   ◇ … 携帯でもパソコンでも改行する（ふつうの br）
 *
 * どちらもこのサイトの地の文（flips.ts の「内容」など）に元から出てこない記号を
 * えらんである（"＊"や"※"は掲示板や注記の行で既に使っているので避けた）。
 *
 * flips.ts の desc のような**ただの文字列**には JSX（<MobileBreak />）を書き込めない。
 * 記号を1つ混ぜるだけで改行位置を指定できるようにするための部品。
 *
 * 使い方: <BreakText text="小さなあそびと◆実験のもくじです。" />
 */
export default function BreakText({ text }: { text: string }) {
  const parts = text.split(/([◆◇])/);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "◆") return <MobileBreak key={i} />;
        if (part === "◇") return <br key={i} />;
        return part;
      })}
    </>
  );
}
