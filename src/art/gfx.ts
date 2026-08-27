// ドット絵をコードで描くための最小の道具箱。
//
// 方針: ImageData に直接書く。canvas の 2D API を経由しないので
// アンチエイリアスも半端な座標も入り込まない。1ピクセルは必ず1ピクセル。
// 表示側は CSS の image-rendering: pixelated で整数倍に拡大する。

import { JP_GLYPHS } from "./jpGlyphs.generated";

export type RGBA = [number, number, number, number];

const colorCache = new Map<string, RGBA>();

/** "#rgb" / "#rgba" / "#rrggbb" / "#rrggbbaa" を RGBA に。null と "" は完全透明。 */
export function parseColor(c: string | null | undefined): RGBA {
  if (!c) return [0, 0, 0, 0];
  const hit = colorCache.get(c);
  if (hit) return hit;
  let s = c.trim();
  if (s[0] === "#") s = s.slice(1);
  let out: RGBA;
  if (s.length === 3 || s.length === 4) {
    const r = parseInt(s[0] + s[0], 16);
    const g = parseInt(s[1] + s[1], 16);
    const b = parseInt(s[2] + s[2], 16);
    const a = s.length === 4 ? parseInt(s[3] + s[3], 16) : 255;
    out = [r, g, b, a];
  } else if (s.length === 6 || s.length === 8) {
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) : 255;
    out = [r, g, b, a];
  } else {
    out = [0, 0, 0, 0];
  }
  colorCache.set(c, out);
  return out;
}

/** 決まった順で同じ値を返す乱数。見た目を再現できるようにするため必須。 */
export function rng(seed: number) {
  let s = (seed | 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/** 色を明るく／暗く。ドット絵のハイライトと影を作るのに使う。 */
export function shade(c: string, amount: number): string {
  const [r, g, b, a] = parseColor(c);
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
  const hex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${hex(f(r))}${hex(f(g))}${hex(f(b))}${a === 255 ? "" : hex(a)}`;
}

/** 2色を混ぜる。t=0 で a、t=1 で b。 */
export function mix(a: string, b: string, t: number): string {
  const A = parseColor(a);
  const B = parseColor(b);
  const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${hex(A[0] + (B[0] - A[0]) * t)}${hex(A[1] + (B[1] - A[1]) * t)}${hex(A[2] + (B[2] - A[2]) * t)}`;
}

export type Dither = "solid" | "half" | "quarter" | "eighth" | "hstripe" | "vstripe";

function ditherOn(kind: Dither, x: number, y: number): boolean {
  switch (kind) {
    case "solid":
      return true;
    case "half":
      return ((x + y) & 1) === 0;
    case "quarter":
      return (x & 1) === 0 && (y & 1) === 0;
    case "eighth":
      return (x & 3) === 0 && (y & 1) === 0;
    case "hstripe":
      return (y & 1) === 0;
    case "vstripe":
      return (x & 1) === 0;
  }
}

export class PixelGfx {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;
  /** 以降の描画にかかる原点オフセット */
  private ox = 0;
  private oy = 0;
  /** 描画を許す矩形。パーツを重ねるときのはみ出し止め */
  private clipRect: [number, number, number, number] | null = null;

  constructor(w: number, h: number, buffer?: Uint8ClampedArray) {
    this.w = w;
    this.h = h;
    this.data = buffer ?? new Uint8ClampedArray(w * h * 4);
  }

  // ── 座標系 ────────────────────────────────────────────────

  origin(x: number, y: number) {
    this.ox = x;
    this.oy = y;
  }
  pushOrigin(dx: number, dy: number): [number, number] {
    const prev: [number, number] = [this.ox, this.oy];
    this.ox += dx;
    this.oy += dy;
    return prev;
  }
  popOrigin(prev: [number, number]) {
    this.ox = prev[0];
    this.oy = prev[1];
  }
  clip(x: number, y: number, w: number, h: number) {
    this.clipRect = [x + this.ox, y + this.oy, w, h];
  }
  unclip() {
    this.clipRect = null;
  }

  // ── 基本 ──────────────────────────────────────────────────

  clear(c?: string) {
    if (!c) {
      this.data.fill(0);
      return;
    }
    const [r, g, b, a] = parseColor(c);
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }

  /** 1ピクセル置く。すべての描画はここを通る。 */
  px(x: number, y: number, c: string | null) {
    const X = (x | 0) + this.ox;
    const Y = (y | 0) + this.oy;
    if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return;
    if (this.clipRect) {
      const [cx, cy, cw, ch] = this.clipRect;
      if (X < cx || Y < cy || X >= cx + cw || Y >= cy + ch) return;
    }
    const [r, g, b, a] = parseColor(c);
    if (a === 0) return;
    const i = (Y * this.w + X) * 4;
    if (a === 255) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
      return;
    }
    // 半透明は上から重ねる
    const sa = a / 255;
    const da = this.data[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa === 0) return;
    this.data[i] = (r * sa + this.data[i] * da * (1 - sa)) / oa;
    this.data[i + 1] = (g * sa + this.data[i + 1] * da * (1 - sa)) / oa;
    this.data[i + 2] = (b * sa + this.data[i + 2] * da * (1 - sa)) / oa;
    this.data[i + 3] = oa * 255;
  }

  /** 読み出し。すでに置いた色を参照して陰影を作りたいときに。 */
  get(x: number, y: number): RGBA {
    const X = (x | 0) + this.ox;
    const Y = (y | 0) + this.oy;
    if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return [0, 0, 0, 0];
    const i = (Y * this.w + X) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }

  // ── 図形 ──────────────────────────────────────────────────

  rect(x: number, y: number, w: number, h: number, c: string | null, d: Dither = "solid") {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) if (ditherOn(d, x + i, y + j)) this.px(x + i, y + j, c);
  }

  frame(x: number, y: number, w: number, h: number, c: string | null) {
    this.hline(x, y, w, c);
    this.hline(x, y + h - 1, w, c);
    this.vline(x, y, h, c);
    this.vline(x + w - 1, y, h, c);
  }

  hline(x: number, y: number, len: number, c: string | null, d: Dither = "solid") {
    for (let i = 0; i < len; i++) if (ditherOn(d, x + i, y)) this.px(x + i, y, c);
  }

  vline(x: number, y: number, len: number, c: string | null, d: Dither = "solid") {
    for (let i = 0; i < len; i++) if (ditherOn(d, x, y + i)) this.px(x, y + i, c);
  }

  /**
   * 端点は必ず先に整数へ丸める。
   * 誤差の累積は整数の差分で回すのに、終了判定だけ切り捨てた値と比べていると、
   * 小数の端点を渡されたときに歩幅が目標を跨いで永久に一致せず、無限ループになる。
   */
  line(x0: number, y0: number, x1: number, y1: number, c: string | null) {
    const ax = Math.round(x0);
    const ay = Math.round(y0);
    const bx = Math.round(x1);
    const by = Math.round(y1);
    let x = ax;
    let y = ay;
    const dx = Math.abs(bx - ax);
    const dy = -Math.abs(by - ay);
    const sx = ax < bx ? 1 : -1;
    const sy = ay < by ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x, y, c);
      if (x === bx && y === by) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /** 塗りつぶし円。ドット絵らしく見えるよう半径は中心からの整数距離で判定する。 */
  disc(cx: number, cy: number, r: number, c: string | null, d: Dither = "solid") {
    const rr = r * r + r * 0.6;
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= rr && ditherOn(d, cx + x, cy + y)) this.px(cx + x, cy + y, c);
  }

  ring(cx: number, cy: number, r: number, c: string | null, thickness = 1) {
    const outer = r * r + r * 0.6;
    const ir = Math.max(0, r - thickness);
    const inner = ir * ir + ir * 0.6;
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const dd = x * x + y * y;
        if (dd <= outer && dd > inner) this.px(cx + x, cy + y, c);
      }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: string | null, d: Dither = "solid") {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) {
        const v = (x * x) / (rx * rx + rx * 0.5) + (y * y) / (ry * ry + ry * 0.5);
        if (v <= 1 && ditherOn(d, cx + x, cy + y)) this.px(cx + x, cy + y, c);
      }
  }

  /** 多角形の塗りつぶし。走査線方式。 */
  poly(pts: Array<[number, number]>, c: string | null, d: Dither = "solid") {
    if (pts.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        if (y0 === y1) continue;
        const yTop = Math.min(y0, y1);
        const yBot = Math.max(y0, y1);
        if (y + 0.5 < yTop || y + 0.5 >= yBot) continue;
        xs.push(x0 + ((y + 0.5 - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const from = Math.round(xs[i]);
        const to = Math.round(xs[i + 1]);
        for (let x = from; x < to; x++) if (ditherOn(d, x, y)) this.px(x, y, c);
      }
    }
  }

  /** 縦方向の段グラデーション。バンドを数えて置くので帯がくっきり出る。 */
  bandsV(x: number, y: number, w: number, h: number, colors: string[]) {
    if (colors.length === 0) return;
    for (let j = 0; j < h; j++) {
      const idx = Math.min(colors.length - 1, Math.floor((j / h) * colors.length));
      this.hline(x, y + j, w, colors[idx]);
    }
  }

  /** 2色のあいだをディザで繋ぐ。NES風のグラデーションはこれで作る。 */
  ditherV(x: number, y: number, w: number, h: number, from: string, to: string) {
    this.rect(x, y, w, h, from);
    const steps = ["eighth", "quarter", "half", "solid"] as Dither[];
    const seg = h / (steps.length + 1);
    for (let s = 0; s < steps.length; s++) {
      const y0 = Math.round(y + seg * (s + 1));
      const y1 = Math.round(y + seg * (s + 2));
      this.rect(x, y0, w, Math.min(y1, y + h) - y0, to, steps[s]);
    }
  }

  /** 文字グリッドのスプライトを置く。'.' と ' ' は透明。 */
  blit(x: number, y: number, rows: readonly string[], palette: Record<string, string | null>) {
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === "." || ch === " ") continue;
        const c = palette[ch];
        if (c === undefined) continue;
        this.px(x + i, y + j, c);
      }
    }
  }

  /** 別バッファを貼り込む。カセット本体とラベルを合成するのに使う。 */
  paste(src: PixelGfx, x: number, y: number) {
    for (let j = 0; j < src.h; j++)
      for (let i = 0; i < src.w; i++) {
        const k = (j * src.w + i) * 4;
        const a = src.data[k + 3];
        if (a === 0) continue;
        const hex = (v: number) => v.toString(16).padStart(2, "0");
        this.px(
          x + i,
          y + j,
          `#${hex(src.data[k])}${hex(src.data[k + 1])}${hex(src.data[k + 2])}${a === 255 ? "" : hex(a)}`,
        );
      }
  }

  /** ざらつき。紙の繊維やプラスチックの梨地に。 */
  noise(x: number, y: number, w: number, h: number, c: string, density: number, seed: number) {
    const r = rng(seed);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) if (r() < density) this.px(x + i, y + j, c);
  }

  // ── 極小フォント ──────────────────────────────────────────
  // ラベルの隅に入る「©1985」「MADE IN JAPAN」級の文字。3x5。

  text3x5(x: number, y: number, s: string, c: string | null, letterSpace = 1): number {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      if (ch === " ") {
        cx += 2 + letterSpace;
        continue;
      }
      const g = FONT3X5[ch];
      if (!g) {
        cx += 3 + letterSpace;
        continue;
      }
      for (let j = 0; j < 5; j++)
        for (let i = 0; i < 3; i++) if (g[j][i] === "#") this.px(cx + i, y + j, c);
      cx += 3 + letterSpace;
    }
    return cx - x - letterSpace;
  }

  text3x5Width(s: string, letterSpace = 1): number {
    let w = 0;
    for (const ch of s) w += (ch === " " ? 2 : 3) + letterSpace;
    return Math.max(0, w - letterSpace);
  }

  // ── 和文 ──────────────────────────────────────────────────

  /**
   * 仮名・漢字をドットで置く。
   *
   * 手で1文字ずつ字母を彫るのはやめて、すでに版面で使っている DotGothic16 を
   * 設計級数（16px）で描き、閾値で1bitに落としている。canvas の文字描画は
   * 必ずアンチエイリアスがかかるが、この書体は16pxグリッドで設計されているので
   * 中間調はほぼ輪郭にしか出ず、閾値を切れば元のドットがそのまま戻る。
   *
   * こうする理由: 実機のファミコンのラベルはカタカナと漢字が主役で、
   * 欧文だけで組むと「ファミコン」ではなく「欧州のレトロ」に見える。
   * 16枚のラベルが欧文だけだったのは、ここに和文を打つ道具が無かったせい。
   *
   * 戻り値は置いた幅。**size の下限は 13px。** 12px まで落とすと画数の多い漢字
   * （葉・辞・職・鑑）の横画が繋がって別字か黒い塊になる。実測して13pxが下限だった。
   */
  textJP(
    x: number,
    y: number,
    s: string,
    c: string | null,
    opts: { size?: number; letterSpace?: number; threshold?: number } = {},
  ): number {
    const size = opts.size ?? 16;
    const letterSpace = opts.letterSpace ?? 0;
    const threshold = opts.threshold ?? 128;
    let cx = x;
    for (const ch of s) {
      const g = jpGlyph(ch, size, threshold);
      if (!g) {
        cx += size / 2 + letterSpace;
        continue;
      }
      for (let j = 0; j < g.h; j++)
        for (let i = 0; i < g.w; i++) if (g.on[j * g.w + i]) this.px(cx + i, y + j, c);
      cx += g.adv + letterSpace;
    }
    return cx - x - letterSpace;
  }

  textJPWidth(s: string, opts: { size?: 16 | 32; letterSpace?: number } = {}): number {
    const size = opts.size ?? 16;
    const letterSpace = opts.letterSpace ?? 0;
    let w = 0;
    for (const ch of s) {
      const g = jpGlyph(ch, size, 128);
      w += (g ? g.adv : size / 2) + letterSpace;
    }
    return Math.max(0, w - letterSpace);
  }

  toImageData(): ImageData {
    return new ImageData(new Uint8ClampedArray(this.data), this.w, this.h);
  }
}

// ── 和文の字母を書体から起こす ────────────────────────────────

type Glyph = { w: number; h: number; adv: number; on: Uint8Array };

/**
 * いま glyphCache に載っている字母を書き出す。
 * `jpGlyphs.generated.ts`（実機に依存しない事前計算テーブル）を
 * 作り直すときに使う道具。`tools/dump-jp-glyphs.mjs` から呼ばれる。
 */
export function dumpGlyphCache(): Record<
  string,
  { w: number; h: number; adv: number; on: number[] } | null
> {
  const out: Record<string, { w: number; h: number; adv: number; on: number[] } | null> = {};
  for (const [key, g] of glyphCache) {
    out[key] = g ? { w: g.w, h: g.h, adv: g.adv, on: Array.from(g.on) } : null;
  }
  return out;
}

const glyphCache = new Map<string, Glyph | null>();
let jpCanvas: HTMLCanvasElement | null = null;
let jpCtx: CanvasRenderingContext2D | null = null;

/**
 * 書体が読み込まれるまでは字母を彫れない。描く前にこれを待つ。
 *
 * 待たずに描いた回の字母は代替書体（ゴシック体）から起こしたものになり、
 * しかも一度掘ると使い回されるので、**読込が遅れた回だけ別の書体で焼き付く**。
 * だから読み込み終わりに彫った字母を全部捨てる。捨てるのは1回だけでよい。
 */
let jpFontSettled = false;
export function jpFontReady(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts) return Promise.resolve();
  // load() 自体が失敗（タイムアウト等）しても、@font-face 経由の読み込みが
  // 裏で進んでいれば fonts.ready はいずれ解決する。ここで拾って握り潰さないと、
  // 以降 catch のぶんだけ「彫り直し」が一生走らず、最初の1回（代替書体）が
  // 焼き付いたままになる。
  return fonts
    .load('16px "DotGothic16"')
    .catch(() => {})
    .then(() => fonts.ready)
    .then(() => {
      if (!jpFontSettled) {
        jpFontSettled = true;
        glyphCache.clear();
      }
    })
    .catch(() => {});
}

function jpGlyph(ch: string, size: number, threshold: number): Glyph | null {
  const key = `${ch}|${size}|${threshold}`;
  const hit = glyphCache.get(key);
  if (hit !== undefined) return hit;

  // 事前計算テーブルにあればそれを使う。ブラウザの fillText を一切通らないので、
  // devicePixelRatio・@font-face・WebKitのアンチエイリアス差など実行時の
  // 事情に一切左右されない――今回の一連の不具合はぜんぶここが理由だった。
  // 新しいラベルで新しい字を使うとここに無いので、その場合だけ下の
  // 実行時ラスタライズにフォールバックする（node tools/dump-jp-glyphs.mjs で
  // テーブルを作り直せば、次回からはそちらも事前計算に乗る）。
  const baked = JP_GLYPHS[key];
  if (baked) {
    const g: Glyph = { w: baked.w, h: baked.h, adv: baked.adv, on: new Uint8Array(baked.on) };
    glyphCache.set(key, g);
    return g;
  }

  if (typeof document === "undefined") {
    glyphCache.set(key, null);
    return null;
  }
  if (!jpCanvas) {
    jpCanvas = document.createElement("canvas");
    jpCanvas.width = 64;
    jpCanvas.height = 64;
    // DOM に一度も繋がない canvas だと、Safari 系（WebKit）が fillText に
    // web フォントを反映しないことがある（iOS の LINE アプリ内ブラウザ等の
    // WKWebView で実機確認）。見た目には出さないまま body に繋いでおく。
    jpCanvas.style.position = "absolute";
    jpCanvas.style.left = "-9999px";
    jpCanvas.style.top = "0";
    jpCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(jpCanvas);
    jpCtx = jpCanvas.getContext("2d", { willReadFrequently: true });
  }
  const ctx = jpCtx;
  if (!ctx) {
    glyphCache.set(key, null);
    return null;
  }

  const pad = 4;
  ctx.clearRect(0, 0, jpCanvas.width, jpCanvas.height);
  ctx.font = `${size}px "DotGothic16", monospace`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  const adv = Math.round(ctx.measureText(ch).width);
  ctx.fillText(ch, pad, pad + size);

  const img = ctx.getImageData(0, 0, jpCanvas.width, jpCanvas.height).data;
  // 閾値で1bitにしてから、実際にインクの乗った範囲だけを切り出す
  let minx = 1e9;
  let maxx = -1;
  let miny = 1e9;
  let maxy = -1;
  const W = jpCanvas.width;
  const H = jpCanvas.height;
  const bits = new Uint8Array(W * H);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const k = (j * W + i) * 4;
      if (img[k + 3] < threshold) continue;
      bits[j * W + i] = 1;
      if (i < minx) minx = i;
      if (i > maxx) maxx = i;
      if (j < miny) miny = j;
      if (j > maxy) maxy = j;
    }
  if (maxx < 0) {
    // 空白など、インクの無い文字
    const g: Glyph = { w: 0, h: 0, adv: adv || size / 2, on: new Uint8Array(0) };
    glyphCache.set(key, g);
    return g;
  }
  const gw = maxx - minx + 1;
  const gh = maxy - miny + 1;
  const on = new Uint8Array(gw * gh);
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) on[j * gw + i] = bits[(miny + j) * W + (minx + i)];
  const g: Glyph = { w: gw, h: gh, adv: adv || gw + 1, on };
  glyphCache.set(key, g);
  return g;
}

// 3x5 の欧文。ファミコンのラベル隅にある小さい英数字の見た目に寄せてある。
const F = (a: string, b: string, c: string, d: string, e: string) => [a, b, c, d, e];
const FONT3X5: Record<string, string[]> = {
  A: F(".#.", "#.#", "###", "#.#", "#.#"),
  B: F("##.", "#.#", "##.", "#.#", "##."),
  C: F(".##", "#..", "#..", "#..", ".##"),
  D: F("##.", "#.#", "#.#", "#.#", "##."),
  E: F("###", "#..", "##.", "#..", "###"),
  F: F("###", "#..", "##.", "#..", "#.."),
  G: F(".##", "#..", "#.#", "#.#", ".##"),
  H: F("#.#", "#.#", "###", "#.#", "#.#"),
  I: F("###", ".#.", ".#.", ".#.", "###"),
  J: F("..#", "..#", "..#", "#.#", ".#."),
  K: F("#.#", "#.#", "##.", "#.#", "#.#"),
  L: F("#..", "#..", "#..", "#..", "###"),
  M: F("#.#", "###", "###", "#.#", "#.#"),
  N: F("#.#", "###", "###", "###", "#.#"),
  O: F(".#.", "#.#", "#.#", "#.#", ".#."),
  P: F("##.", "#.#", "##.", "#..", "#.."),
  Q: F(".#.", "#.#", "#.#", "##.", ".##"),
  R: F("##.", "#.#", "##.", "#.#", "#.#"),
  S: F(".##", "#..", ".#.", "..#", "##."),
  T: F("###", ".#.", ".#.", ".#.", ".#."),
  U: F("#.#", "#.#", "#.#", "#.#", ".##"),
  V: F("#.#", "#.#", "#.#", "#.#", ".#."),
  W: F("#.#", "#.#", "###", "###", "#.#"),
  X: F("#.#", "#.#", ".#.", "#.#", "#.#"),
  Y: F("#.#", "#.#", ".#.", ".#.", ".#."),
  Z: F("###", "..#", ".#.", "#..", "###"),
  "0": F(".#.", "#.#", "#.#", "#.#", ".#."),
  "1": F(".#.", "##.", ".#.", ".#.", "###"),
  "2": F("##.", "..#", ".#.", "#..", "###"),
  "3": F("##.", "..#", ".#.", "..#", "##."),
  "4": F("#.#", "#.#", "###", "..#", "..#"),
  "5": F("###", "#..", "##.", "..#", "##."),
  "6": F(".##", "#..", "##.", "#.#", ".#."),
  "7": F("###", "..#", ".#.", ".#.", ".#."),
  "8": F(".#.", "#.#", ".#.", "#.#", ".#."),
  "9": F(".#.", "#.#", ".##", "..#", "##."),
  ".": F("...", "...", "...", "...", ".#."),
  ",": F("...", "...", "...", ".#.", "#.."),
  "-": F("...", "...", "###", "...", "..."),
  "/": F("..#", "..#", ".#.", "#..", "#.."),
  ":": F("...", ".#.", "...", ".#.", "..."),
  "'": F(".#.", ".#.", "...", "...", "..."),
  "!": F(".#.", ".#.", ".#.", "...", ".#."),
  "?": F("##.", "..#", ".#.", "...", ".#."),
  "(": F("..#", ".#.", ".#.", ".#.", "..#"),
  ")": F("#..", ".#.", ".#.", ".#.", "#.."),
  "©": F("###", "#.#", "#.#", "#.#", "###"),
  "+": F("...", ".#.", "###", ".#.", "..."),
  "*": F("...", "#.#", ".#.", "#.#", "..."),
  "#": F("#.#", "###", "#.#", "###", "#.#"),
  "&": F(".#.", "#.#", ".#.", "#.#", ".##"),
  "%": F("#.#", "..#", ".#.", "#..", "#.#"),
  "=": F("...", "###", "...", "###", "..."),
  "<": F("..#", ".#.", "#..", ".#.", "..#"),
  ">": F("#..", ".#.", "..#", ".#.", "#.."),
};
