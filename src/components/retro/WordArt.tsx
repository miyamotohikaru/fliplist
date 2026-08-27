/* 会社HP（kosukuma.com）の見出し画像を、画像を使わずに組む部品。
 * 文字は本物の HTML テキストのまま。選択もコピーも検索もできる。
 *
 * ── 手本（すべて public/hp/ に実物がある。数値はこのファイルの中で実測済み）
 *   ttl.gif             773x117   「株式会社こす.くま」 金の縦グラデ＋白縁＋やわらかい灰の落ち影
 *   heading-company.png 2167x256  「株式会社こす.くま」 #00FF00 ＋ 黒の細い縁
 *   heading-flip.png    2273x256  「FLIP事業について」  #00FFFF ＋ #FF0000 の縁
 *   ttl_news.gif        150x40    「最新情報」          緑の縦グラデ＋白縁
 *
 *   落ち影は ttl.gif だけにある。heading-company / heading-flip は
 *   PNG8 の色を全部数えても灰色が 1 画素も無く、影は付いていない（<shadow> で足せる）。
 *   4 枚はそれぞれ別の WordArt なので、太さも縁の太さも横の伸びもそろっていない。
 *   variant ごとにその手本の値を既定にしてある。ページ内でそろえたいときは
 *   weight / wide を明示的に渡す。
 *
 * ── 縁のつくり
 *   -webkit-text-stroke は字の内側へ半分食い込むので使えない。手本の縁は
 *   「字の外側だけ」に付いている（塗りの高さ＋縁×2＝全体の高さ が実測で一致する）。
 *   なので text-shadow を 16 方向へ重ねて外へ太らせる。16 方向の内接多角形の
 *   誤差は cos(11.25°)=98.1% で、縁の太さのむらは 2% 未満。
 *
 * ── 傾き
 *   手本の傾きは dx/dy=0.2126（12.0°）。Chrome の合成イタリックは 0.25（14.0°）
 *   固定で、font-style: oblique 12deg を書いても効かない（実測で確認）。
 *   なので italic のまま、要素側で 2° ぶんだけ逆にせん断して 12° に合わせる。
 *   せん断が小さいので、折り返した 2 行目のずれは 1 行あたり 0.04em で目に見えない。
 *   横の伸ばし（scaleX）とせん断はどちらも要素の transform なので、
 *   縁のリングの座標をあらかじめ逆変換しておき、変換後にちょうど真円になるようにする。
 *
 * ── 注意
 *   transform はレイアウト幅を変えない。wide ≠ 1 の variant（cyan は 1.093、
 *   gold は 0.967）は、字面が要素の幅と (wide-1) ぶんずれる。基点は origin で選ぶ:
 *     origin="center"（既定） 中心が動かない。本物の home.css は全部まんなか寄せ
 *                             なので、こちらを既定にしてある
 *     origin="left"           左端が動かない。左寄せで縦の線をそろえたいとき
 *   overflow:hidden の箱に入れるときは外側に (wide-1)/2 ぶんの余白を持たせるか、
 *   wide={1} を渡して素の字面にする。
 *
 * 自己完結。globals.css には触らない。CSS は React 19 の
 * <style href precedence> で head に一度だけ上がる（同じ href は重複排除される）。 */

import type { CSSProperties, ElementType, ReactNode } from "react";

export type WordArtVariant = "gold" | "lime" | "cyan" | "green";

/* ── 実測値 ─────────────────────────────────────────────────────────────

   lineEm（縁の太さ / font-size）は
     「縁の太さ ÷ 塗りの高さ」×「塗りの高さ ÷ font-size」
   で出した。em に持たせたので、級数を落としても縁の比は崩れない。

     variant  縁÷塗りの高さ   その weight の 塗り÷em   lineEm
     gold     3.5/70  =0.0500      0.9267             0.0463
     lime     3.0/242 =0.0124      0.9167             0.0114
     cyan     7.0/238 =0.0294      0.9233             0.0272
     green    ~1.7/37 =0.046       0.9333             0.0430

   weight は「字の面積 ÷ 塗りの高さ²」を手本と canvas で突き合わせて決めた
   （アンチエイリアスの影響を受けない量。手本は PNG/GIF の色を混色ぶんまで
   ほどいて足している）。手本 → いちばん近い Hiragino Sans のウエイト:
     gold  2.515 → W5 相当 600（600 は 2.426 / 700 は 2.858）
     lime  1.852 → W3 相当 400（400 は 1.757 / 500 は 2.090）
     cyan  1.459 → W2 相当 300（scaleX 1.093 を割り戻すと 1.335）
     green 1.854 → wide 0.86 を割り戻すと 2.156 → W6 相当 700（600 は 1.906 / 700 は 2.195）

   wide は「字面の横幅 ÷ 塗りの高さ」を手本と突き合わせた比。
     gold 8.529/8.822=0.967  lime 8.901/8.875=1.003
     cyan 9.471/8.667=1.093  green 3.750/4.249=0.883・重ね合わせ探索 0.835 → 0.86 */

type Stop = readonly [pos: number, color: string];

type Shadow = {
  readonly x: number;
  readonly y: number;
  readonly blur: number;
  readonly color: string;
};

type Spec = {
  /** 塗り。1 色なら color、2 色以上なら background-clip:text の縦グラデ */
  readonly fill: string | readonly Stop[];
  /** 縁の色 */
  readonly line: string;
  /** 縁の太さ（em） */
  readonly lineEm: number;
  /** 落ち影。手本に無いものは null */
  readonly shadow: Shadow | null;
  /** 字の太さ */
  readonly weight: number;
  /** 横への伸び（scaleX） */
  readonly wide: number;
  /**
   * 傾き。手本4枚のうち **ttl_news.gif（最新情報）と ttl_overview.gif（会社概要）は直立**で、
   * 傾いているのは ttl.gif・heading-company・heading-flip の3枚だけ。
   * 直立の役を斜体で出すと、本物の隣に置いたとき別物に見える。
   */
  readonly upright?: boolean;
};

/* ttl.gif の落ち影。ほぼ真下に落ちていて（右へは 6px ほどしか出ない）、
   字の下端から字面の 25% ぶんまでだらだら伸びる、かなり拡散した影。
   字の縁からの距離ごとに黒さを測って合わせた実測値:
     手本 0.11 / 0.11 / 0.12 / 0.09 / 0.08 / 0.12 / 0.10 / 0.07 / 0.06（字面の 0.5〜20%）
     これ 0.13 / 0.13 / 0.12 / 0.12 / 0.12 / 0.11 / 0.10 / 0.07 / 0.05          */
const GOLD_SHADOW: Shadow = { x: 0.02, y: 0.075, blur: 0.09, color: "rgba(0,0,0,0.36)" };

const SPECS: Record<WordArtVariant, Spec> = {
  // ttl.gif。上が濃い山吹 → 真ん中がいちばん明るい黄 → 下でまた山吹に落ちる
  gold: {
    fill: [
      [0.0, "#fd9e03"],
      [0.11, "#fd9e03"],
      [0.2, "#febf02"],
      [0.3, "#fed902"],
      [0.4, "#feed01"],
      [0.5, "#fff701"],
      [0.7, "#fff701"],
      [0.8, "#fee401"],
      [0.9, "#fecf02"],
      [1.0, "#febf02"],
    ],
    line: "#ffffff",
    lineEm: 0.0463,
    shadow: GOLD_SHADOW,
    weight: 600,
    wide: 0.967,
  },

  // heading-company.png。純緑に黒の細い縁だけ。影は無い
  lime: {
    fill: "#00ff00",
    line: "#000000",
    lineEm: 0.0114,
    shadow: null,
    weight: 400,
    wide: 1.003,
  },

  // heading-flip.png。純シアンに純赤の縁。影は無い。4 枚でいちばん横に広い
  cyan: {
    fill: "#00ffff",
    line: "#ff0000",
    lineEm: 0.0272,
    shadow: null,
    weight: 300,
    wide: 1.093,
  },

  // ttl_news.gif。上が明るい緑 → 下へ深緑。白縁。影は無い
  green: {
    fill: [
      [0.0, "#2aaf20"],
      [0.3, "#1c9e13"],
      [0.5, "#129409"],
      [0.7, "#118d08"],
      [0.85, "#0d7006"],
      [1.0, "#0a6404"],
    ],
    line: "#ffffff",
    lineEm: 0.043,
    shadow: null,
    // ttl_news.gif は直立。傾けない
    upright: true,
    weight: 700,
    // 4 枚でいちばん縦長。手本が 150x40 に「緑の内側まで」切り詰められていて
    // 縁がどこも残っていないので、字送りから出した推定値（0.835〜0.883 の真ん中）
    wide: 0.86,
  },
};

/* ── 字面の位置 ────────────────────────────────────────────────────────
   グラデを「字面の帯」にぴったり載せるための座標。Hiragino Sans を
   canvas.measureText で実測した値（100px, italic）:
     fontBoundingBoxAscent 88 / Descent 12（em ボックス 100）
     和文の字面 actualBoundingBoxAscent 84.0 / Descent 8.6（W5〜W6）
   ベースラインは line box の上端から (LH - 1)/2 + 0.88 em。 */
const LH = 1.06;
const BASELINE = (LH - 1) / 2 + 0.88; // 0.91em
/* 手本のグラデは字面よりわずかに上にずれている（実測で 0.027em ぶん）ので、
   その分だけ帯を持ち上げて重ねる */
const INK_TOP = BASELINE - 0.867; // 0.043em
const INK_BOT = BASELINE + 0.059; // 0.969em
/* 背景ボックスは 2em ぶん確保して -0.5em からはじめる。こうすると欧文の
   下に出る部分（p, g, y）まで塗りが届き、no-repeat でも欠けない。 */
const BOX_TOP = -0.5;
const BOX_H = 2;

function buildFill(stops: readonly Stop[]): string {
  const a = (INK_TOP - BOX_TOP) / BOX_H;
  const b = (INK_BOT - BOX_TOP) / BOX_H;
  const body = stops
    .map(([p, c]) => `${c} ${((a + p * (b - a)) * 100).toFixed(2)}%`)
    .join(",");
  return `linear-gradient(180deg,${body})`;
}

/* ── 傾き ──────────────────────────────────────────────────────────── */
const FONT_SLANT = 0.25; // Chrome の合成イタリック（14.0°）。固定
const TARGET_SLANT = 0.2126; // 手本の傾き（12.0°）
/**
 * 要素の transform 行列。scaleX(sx) のあと、足りない分だけ逆せん断する。
 * 直立の役（upright）は狙いの傾きが 0 なので、合成イタリックを丸ごと打ち消す。
 */
const skewOf = (sx: number, target = TARGET_SLANT) => FONT_SLANT * sx - target;

/* ── 縁のリング ────────────────────────────────────────────────────────
   ほしいのは変換後に半径 r の真円。要素には matrix(sx,0,c,1,0,0) が
   かかるので、その逆写像 ((qx - c*qy)/sx, qy) を text-shadow に入れる。
     --wa-rx = r / sx      --wa-rc = r * c / sx      --wa-ry = r        */
const RING = Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI * 2) / 16;
  const cx = Number(Math.cos(a).toFixed(4));
  const sy = Number(Math.sin(a).toFixed(4));
  const x = `calc(var(--wa-rx) * ${cx} - var(--wa-rc) * ${sy})`;
  const y = `calc(var(--wa-ry) * ${sy})`;
  return `${x} ${y} 0 var(--wa-line)`;
}).join(",");

const FONT =
  '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","YuGothic","MS PGothic","MS Gothic",sans-serif';

const CSS = `
.wa{
  display:inline-block;
  position:relative;
  font-family:${FONT};
  font-weight:var(--wa-weight);
  font-style:italic;
  font-size:var(--wa-size);
  line-height:${LH};
  letter-spacing:var(--wa-ls);
  white-space:pre-wrap;
  transform:matrix(var(--wa-sx),0,var(--wa-skew),1,0,0);
  /* せん断の基点は 1 行目のベースライン。伸び縮みの基点は origin で選ぶ */
  transform-origin:var(--wa-origin) ${BASELINE}em;
  /* globals.css が body に font-smoothing:none を敷いているので打ち消す。
     手本はアンチエイリアスが効いていて、切ると縁がガタガタになる */
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  --wa-rx:calc(var(--wa-line-w) / var(--wa-sx));
  --wa-rc:calc(var(--wa-line-w) * var(--wa-skew) / var(--wa-sx));
  --wa-ry:var(--wa-line-w);
}
/* 縁と落ち影の層。本物の字は下の .wa__face なので、こちらは選択も読み上げもさせない。
   影は縁を描いたあとの絵にかける（手本の影も「縁まで含めた形」の影）。
   幅ちょうど(100%)の箱に対して text-shadow で縁を外側へ足すと、特に斜体の
   せん断とかけ合わさったときに、最後の字の右側だけ縁が斜めに薄く欠けた
   （はみ出す量をブラウザが正しく確保しない）。中の文字は text-align:center を
   継承しているので、左右対称に箱を広げれば見た目の位置は動かない。
   最初は縁の太さの1.5倍ぶんだけ広げたが、それでも欠けが残るとの報告があった
   ので、実害の無い(箱を広げるだけで見た目は動かない)余白なのを踏まえて
   5倍まで広げ、かなり余裕を持たせてある。 */
.wa__ink{
  position:absolute;
  left:calc(var(--wa-line-w) * -5); top:0;
  width:calc(100% + var(--wa-line-w) * 10);
  color:var(--wa-line);
  text-shadow:${RING};
  filter:var(--wa-filter);
  pointer-events:none;
  -webkit-user-select:none;
  user-select:none;
}
/* 本物の文字 */
.wa__face{
  position:relative;
  color:var(--wa-fill-color);
  /* 塗る場所を字の四方へ広げておく。**ここが無いと字が欠ける。**
     background-clip:text は「背景を字型に抜く」指定だが、抜く前の背景は
     この要素の箱の中にしか塗られない。字は italic のせん断と字面のはみ出しで
     箱の外へ数px出ているので、その外側だけ塗るものが無く、透けていた
     （最後の字の右上が斜めに切り落とされる）。
     横の padding は行の送りに効くので、同じだけ margin で戻す。
     縦の padding は行の高さに効かないので、戻さなくてよい。 */
  padding:0.6em 0.4em;
  margin-left:-0.4em;
  margin-right:-0.4em;
}
.wa__face.wa--grad{
  color:transparent;
  -webkit-text-fill-color:transparent;
  background-image:var(--wa-fill-image);
  background-repeat:no-repeat;
  /* 位置と大きさの基準は、広げる前の箱（content-box）のまま。
     既定の padding-box にすると、上で足した padding のぶんグラデが縦にずれて、
     字がグラデの外へ出てしまう */
  background-origin:content-box;
  /* 横は要素の幅より 1em ずつ広く敷く。**ここを 100% にすると字が欠ける。**
     字は italic のせん断で上が右へ、下が左へ 7〜9px ずり出していて、
     要素の外に出たぶんには塗る背景が無く、
     background-clip:text で抜いたときにそこだけ透けていた
     （最後の字の右上と、最初の字の左下が削れて見える）。
     グラデは 180deg の縦方向なので、横に広げても色の出方は1つも変わらない。 */
  background-size:calc(100% + 2em) ${BOX_H}em;
  background-position:-1em ${BOX_TOP}em;
  -webkit-background-clip:text;
  background-clip:text;
}
`;

/* view-source の1行目に「こす.くま宣言文」を出しているので、その真下に
   開発用の注釈つきCSSが何十行も続かないよう、head へ上げる前に1行へ畳む。
   読むための原文は上の CSS に残る（畳むのは配信するときだけ）。 */
function squash(css: string) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")   // 注釈を落とす
    .replace(/\s+/g, " ")                // 改行と字下げを空白1つへ
    .replace(/\s*([{}:;,])\s*/g, "$1")   // 記号のまわりの空白は要らない
    .trim();
}

const CSS_MIN = squash(CSS);

export type WordArtProps = {
  children: ReactNode;
  /** gold / lime / cyan / green。手本の 4 枚に対応 */
  variant?: WordArtVariant;
  /** font-size（px）。縁の太さと影のずれはこれに比例する */
  size?: number;
  /** 落ち影。省略すると手本どおり（gold だけ出る）。true で足す / false で消す */
  shadow?: boolean;
  /** 縁の太さの倍率。手本より太く／細くしたいときだけ */
  strokeScale?: number;
  /** 字の太さ。省略すると variant ごとの手本の太さ */
  weight?: number;
  /** 字送り（em）。詰めたいときは負の値 */
  tracking?: number;
  /** 横への伸ばし。省略すると variant ごとの手本の縦横比。1 で素の字面 */
  wide?: number;
  /** wide の伸び縮みの基点。左寄せで左端をそろえたいときは "left" */
  origin?: "left" | "center" | "right";
  /** 出力するタグ。見出しなら "h1" / "h2" を渡す */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

export default function WordArt({
  children,
  variant = "gold",
  size = 48,
  shadow,
  strokeScale = 1,
  tracking = 0,
  wide,
  weight,
  origin = "center",
  as: Tag = "span",
  className,
  style,
}: WordArtProps) {
  const spec = SPECS[variant];
  const grad = typeof spec.fill !== "string";
  const sh = (shadow ?? spec.shadow !== null) ? (spec.shadow ?? GOLD_SHADOW) : null;
  const sx = wide ?? spec.wide;
  const skew = skewOf(sx, spec.upright ? 0 : TARGET_SLANT);

  const vars = {
    "--wa-size": `${size}px`,
    "--wa-weight": weight ?? spec.weight,
    "--wa-line": spec.line,
    "--wa-line-w": `${(spec.lineEm * strokeScale).toFixed(4)}em`,
    "--wa-ls": `${tracking}em`,
    "--wa-sx": sx,
    "--wa-origin": origin === "center" ? "50%" : origin === "right" ? "100%" : "0",
    "--wa-skew": skew.toFixed(4),
    "--wa-fill-color": grad ? "transparent" : (spec.fill as string),
    "--wa-fill-image": grad ? buildFill(spec.fill as readonly Stop[]) : "none",
    // 影も transform のあとで狙った向きに出したいので、あらかじめ逆写像しておく
    "--wa-filter": sh
      ? `drop-shadow(${((sh.x - skew * sh.y) / sx).toFixed(4)}em ${sh.y}em ${sh.blur}em ${sh.color})`
      : "none",
    ...style,
  } as CSSProperties;

  return (
    <Tag className={className ? `wa ${className}` : "wa"} style={vars} data-wa={variant}>
      <style href="retro-wordart" precedence="default">
        {CSS_MIN}
      </style>
      <span className="wa__ink" aria-hidden="true">
        {children}
      </span>
      <span className={grad ? "wa__face wa--grad" : "wa__face"}>{children}</span>
    </Tag>
  );
}
