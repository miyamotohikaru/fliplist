/**
 * 携帯の版面(620px以下)のときだけ効く強制改行。パソコンでは何も起きない。
 *
 * 地の文（リード文・更新履歴・「ふりっぷとは」など）専用。
 * カセットの中の文字（ラベルの絵）は携帯・パソコンで同じ画なので、
 * ここでは効かない――絵の中の改行は各ラベルの描画プログラム側で決める。
 *
 * 使い方: 改行したい場所にそのまま置く。
 *   <>こす.くまがつくった、小さなあそびと<MobileBreak />実験のもくじです。</>
 *
 * 中身は CSS 側（globals.css の .mobile-break）。
 * br に display:none を当てて消し、携帯幅のメディアクエリで戻すだけ。
 */
export default function MobileBreak() {
  return <br className="mobile-break" />;
}
