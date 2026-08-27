/* 検分用。本番の導線には出さない。
   手本の画像とすぐ下に CSS 版を置いて、同じ文字・同じ字面の高さで見比べる。
   img の height は「手本の塗りの高さが 126px になる倍率」で出してある。

   node tools/shoot.mjs wa /wordart --w 1500 --h 3000 --dpr 2 --full
   node tools/shoot.mjs m_cyan /wordart --w 2600 --dpr 2 --sel "#m-cyan" */

import WordArt from "@/components/retro/WordArt";

const T = 126; // 見比べる字面（塗り）の高さ px

/* 手本の実測: [ファイル, 画像の高さ, 塗りの高さ] */
const REF = {
  gold: ["/hp/ttl.gif", 117, 71],
  lime: ["/hp/heading-company.png", 256, 242],
  cyan: ["/hp/heading-flip.png", 256, 238],
  green: ["/hp/ttl_news.gif", 40, 40],
} as const;

/* 字面の高さ÷font-size。Hiragino Sans を canvas で実測した値（和文） */
const INK_PER_EM: Record<number, number> = {
  300: 0.915,
  400: 0.917,
  500: 0.92,
  600: 0.924,
  700: 0.932,
  800: 0.941,
};

const sizeFor = (w: number) => Math.round(T / (INK_PER_EM[w] ?? 0.93));

function refH(k: keyof typeof REF) {
  const [, h, fill] = REF[k];
  return Math.round((h * T) / fill);
}

const MONO = "11px/1.5 ui-monospace,monospace";

function Sweep({
  k,
  text,
  weights,
}: {
  k: keyof typeof REF;
  text: string;
  weights: number[];
}) {
  return (
    <section style={{ marginBottom: 22 }}>
      <p style={{ font: MONO, color: "#7a6a4a", margin: "0 0 3px" }}>
        {k} — 手本 {REF[k][0]}（一番上）と weight ちがい
      </p>
      <div style={{ background: "#fff", padding: "4px 0", overflow: "hidden" }}>
        <img
          src={REF[k][0]}
          alt=""
          style={{
            height: refH(k),
            width: "auto",
            display: "block",
            marginLeft: k === "gold" ? -Math.round(refH(k) * 1.22) : 0,
          }}
        />
        {weights.map((w) => (
          <div key={w} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <span style={{ font: MONO, color: "#b9a", width: 26, flex: "0 0 26px", paddingTop: 8 }}>
              {w}
            </span>
            <WordArt variant={k} size={sizeFor(w)} weight={w}>
              {text}
            </WordArt>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function WordArtCheck() {
  return (
    <main
      style={{
        background: "#f7e7c4",
        minHeight: "100vh",
        padding: 24,
        WebkitFontSmoothing: "antialiased",
        fontFamily: "ui-sans-serif,system-ui,sans-serif",
      }}
    >
      {/* 計測用。tools/shoot.mjs --sel "#m-xxx" で 1 個ずつ撮って画素を測る */}
      <div style={{ display: "grid", gap: 6, justifyItems: "start", marginBottom: 22 }}>
        {(
          [
            ["m-gold", "gold", "株式会社こす.くま"],
            ["m-lime", "lime", "株式会社こす.くま"],
            ["m-cyan", "cyan", "FLIP事業について"],
            ["m-green", "green", "最新情報"],
          ] as const
        ).map(([id, v, s]) => (
          <div key={id} id={id} style={{ background: "#f0f", padding: "30px 320px 30px 30px" }}>
            <WordArt variant={v} size={200}>
              {s}
            </WordArt>
          </div>
        ))}
      </div>

      {/* 傾きの検証。Chrome は font-style: oblique <角度> の角度を無視して
          いつも 14.03°（dx/dy=0.25）で合成する。だから WordArt では italic のまま
          要素側で 2° 戻して手本の 12.0° に合わせている */}
      <p style={{ font: MONO, color: "#7a6a4a", margin: "0 0 3px" }}>
        傾きの検証: 上から italic / oblique 12deg / oblique 20deg / normal（上 3 つは全部 14.03°）
      </p>
      <div id="slant-test" style={{ background: "#fff", padding: 20 }}>
        {(["italic", "oblique 12deg", "oblique 20deg", "normal"] as const).map((st) => (
          <div
            key={st}
            style={{
              font: `${st} 400 160px "Hiragino Sans",sans-serif`,
              lineHeight: 1,
              color: "#000",
              whiteSpace: "pre",
            }}
          >
            llll
          </div>
        ))}
      </div>

      <Sweep k="gold" text="株式会社こす.くま" weights={[600]} />
      <Sweep k="lime" text="株式会社こす.くま" weights={[400]} />
      <Sweep k="cyan" text="FLIP事業について" weights={[300]} />
      <Sweep k="green" text="最新情報" weights={[600]} />

      <hr style={{ border: 0, borderTop: "1px dashed #c9b68c", margin: "26px 0" }} />

      <p style={{ font: MONO, color: "#7a6a4a", margin: "0 0 6px" }}>
        本物の地色（bg.gif のクリーム）の上。白縁の gold / green はここで初めて縁が見える
      </p>
      <div
        style={{
          background: "url(/hp/bg.gif)",
          padding: 16,
          display: "grid",
          gap: 10,
          justifyItems: "start",
          marginBottom: 18,
        }}
      >
        <WordArt variant="gold" size={52}>株式会社こす.くま</WordArt>
        <WordArt variant="green" size={24}>最新情報</WordArt>
        <WordArt variant="lime" size={40}>ふりっぷとは</WordArt>
        <WordArt variant="cyan" size={40}>FLIP事業について</WordArt>
      </div>

      <p style={{ font: MONO, color: "#7a6a4a", margin: "0 0 6px" }}>呼び出しの見本</p>
      <div style={{ background: "#fff", padding: 14, display: "grid", gap: 10, justifyItems: "start" }}>
        <WordArt variant="gold" size={56}>ふりっぷ一覧</WordArt>
        <WordArt variant="lime" size={48}>ふりっぷとは</WordArt>
        <WordArt variant="cyan" size={44}>FLIP LIST</WordArt>
        <WordArt variant="green" size={24}>最新情報</WordArt>
      </div>

      <p style={{ font: MONO, color: "#7a6a4a", margin: "16px 0 6px" }}>
        小さい級数（24 / 20 / 18 / 16px）で潰れないか
      </p>
      <div style={{ background: "#fff", padding: 14, display: "grid", gap: 7, justifyItems: "start" }}>
        {[24, 20, 18, 16].map((s) => (
          <div key={s} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
            <WordArt variant="gold" size={s}>最新情報 縁の潰れ</WordArt>
            <WordArt variant="lime" size={s}>最新情報 縁の潰れ</WordArt>
            <WordArt variant="cyan" size={s}>最新情報 縁の潰れ</WordArt>
            <WordArt variant="green" size={s}>最新情報 縁の潰れ</WordArt>
          </div>
        ))}
      </div>

      <p style={{ font: MONO, color: "#7a6a4a", margin: "16px 0 6px" }}>
        下に出る字（p g y）／改行／影の足し引き
      </p>
      <div style={{ background: "#fff", padding: 14, display: "grid", gap: 10, justifyItems: "start" }}>
        <WordArt variant="gold" size={40}>copyright pygmy 図鑑</WordArt>
        <WordArt variant="green" size={40}>copyright pygmy 図鑑</WordArt>
        <WordArt variant="lime" size={40} shadow>影を足した lime</WordArt>
        <WordArt variant="cyan" size={40} shadow>影を足した cyan</WordArt>
        <WordArt variant="gold" size={40} shadow={false}>影を消した gold</WordArt>
        <div style={{ width: 420, textAlign: "left" }}>
          <WordArt variant="cyan" size={30}>折り返しても縁がずれないかを見る長めの見出し</WordArt>
        </div>
      </div>

      <p style={{ font: MONO, color: "#7a6a4a", margin: "16px 0 6px" }}>
        中央揃えの箱（本物の home.css は全部まんなか寄せ）。上=origin 既定 / 下=origin center
      </p>
      <div style={{ background: "#fff", padding: 14, textAlign: "center" }}>
        <div style={{ outline: "1px dashed #ccc" }}>
          <WordArt variant="cyan" size={40}>FLIP事業について</WordArt>
        </div>
        <div style={{ outline: "1px dashed #ccc", marginTop: 8 }}>
          <WordArt variant="cyan" size={40} origin="center">FLIP事業について</WordArt>
        </div>
      </div>
    </main>
  );
}
