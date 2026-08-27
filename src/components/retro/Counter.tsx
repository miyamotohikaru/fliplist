/**
 * ヒットカウンター。
 *
 * 会社トップは天に1つだけ置いている（黒地に白い数字・青の3px枠・5桁のCGI画像）。
 * こちらは奥付に置く。当時の個人ページのカウンターはたいてい奥付にあった。
 *
 * 体裁も本物とは変える。桁を1枚ずつの絵で返すCGI（1桁ずつ枠がつく）のほうに寄せて、
 * 白地・黒枠の小さな箱を6つならべる。桁も6桁にした。
 * 本日／昨日の数を添えるのも当時の定番。
 */

/** 累計。CGIではないので固定 */
const TOTAL = "018472";
/** 本日と昨日 */
const TODAY = "0041";
const YESTERDAY = "0067";

function Digits({ value, small }: { value: string; small?: boolean }) {
  return (
    <span className={small ? "count count--s" : "count"} role="img" aria-label={`${Number(value)}`}>
      {value.split("").map((n, i) => (
        <b key={i}>{n}</b>
      ))}
    </span>
  );
}

export default function Counter() {
  return (
    <>
      <p className="hit">
        あなたは
        <Digits value={TOTAL} />
        人目のお客さまです。
      </p>
      <p className="hit-sub">
        （本日
        <Digits value={TODAY} small />
        人／昨日
        <Digits value={YESTERDAY} small />
        人）
      </p>
    </>
  );
}
