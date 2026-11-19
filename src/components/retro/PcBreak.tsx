/**
 * パソコンの版面のときだけ効く強制改行（MobileBreak の逆）。携帯(620px以下)では消える。
 *
 * 下の階のページの地の文は、ユーザーが ?edit でパソコンの幅を見て改行を決めた。
 * その改行を携帯でも効かせると、自動の折り返しと重なって1〜2字だけの行ができる
 * （2026-11-19 ユーザー「携帯だと変。改行が変」）。携帯では自然な折り返しに任せる。
 *
 * 中身は CSS 側（globals.css の .pc-break）。
 */
export default function PcBreak() {
  return <br className="pc-break" />;
}
