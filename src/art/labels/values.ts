import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { JP_TH, ascent, jpRow } from "../jptitle";

// 価値観一覧図鑑。まだ構想しかない企画。
//
// 中身が無いので、中身のふりはしない。描くのは「器」だけ ——
// 標本箱、仕切り、留めピン、無記名の名札、そして上に載る分類表。
// 核は「相容れないものが同じ棚に並んでいる」こと。だから左右は必ず対にして、
// 中央の背の高いマスには、半分が地で半分が図の、どちらとも決まらない標本を据える。
// 具体的な価値観の言葉はひとつも書かない（書いたら嘘になる）。

const EDGE = "#150c26";
const FELT = "#241540";
const FELT_LT = "#2e1c50";
const FELT_DK = "#190e30";
const BRASS = "#c39a45";
const BRASS_DK = "#7a5a1c";
const BRASS_LT = "#e7c473";
const CREAM = "#efe4c2";
const SHADOW = "#170e2a";

const CYAN = "#45c8d8";
const ORANGE = "#e8853a";
const GREEN = "#5cc46a";
const RED = "#e0475a";
const MAGENTA = "#d060b0";
const GOLD = "#f0c64a";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 和文の題字 ──────────────────────────────────────────
// 「価値観一覧図鑑」7文字。16px は1行4字が限界（5字で80px）なので3字＋4字に割る。
// **13px には落とせない** ——「観」の雚と見、「鑑」の金と監が繋がって
// どちらも黒い塊になる。4字なら 15px x 4 = 60px でまだ入るので、
// 上下とも 15px で組んで、標本箱を1段ぶん（丈9行）に詰めた。
const T_SIZE = 15;
const T_A = "価値観";
const T_B = "一覧図鑑";

/** 留めピン。標本は必ずこれで刺してある。 */
function pin(g: PixelGfx, x: number, top: number, len: number) {
  g.vline(x, top, len, BRASS_DK);
  g.vline(x, top, len - 1, BRASS);
  g.px(x, top, BRASS_LT);
  g.px(x + 1, top + 1, SHADOW);
}

/** 標本ひとつ。kind ごとに図形を変える。落ち影を必ず先に置く。 */
function specimen(g: PixelGfx, kind: string, cx: number, cy: number, c: string) {
  const S = (fn: (dx: number, dy: number, col: string) => void) => {
    fn(1, 1, SHADOW);
    fn(0, 0, c);
  };
  switch (kind) {
    case "disc":
      S((dx, dy, col) => g.disc(cx + dx, cy + dy, 3, col));
      g.px(cx - 1, cy - 2, "#ffffff");
      break;
    case "ring":
      S((dx, dy, col) => g.ring(cx + dx, cy + dy, 3, col, 1));
      g.px(cx - 1, cy - 3, "#ffffff");
      break;
    case "up":
      S((dx, dy, col) =>
        g.poly(
          [
            [cx + dx, cy - 3 + dy],
            [cx + 4 + dx, cy + 3 + dy],
            [cx - 4 + dx, cy + 3 + dy],
          ],
          col,
        ),
      );
      break;
    case "down":
      S((dx, dy, col) =>
        g.poly(
          [
            [cx - 4 + dx, cy - 3 + dy],
            [cx + 4 + dx, cy - 3 + dy],
            [cx + dx, cy + 3 + dy],
          ],
          col,
        ),
      );
      break;
    case "plus":
      S((dx, dy, col) => {
        g.rect(cx - 3 + dx, cy - 1 + dy, 7, 3, col);
        g.rect(cx - 1 + dx, cy - 3 + dy, 3, 7, col);
      });
      break;
    case "bar":
      S((dx, dy, col) => g.rect(cx - 3 + dx, cy - 1 + dy, 7, 3, col));
      break;
    case "square":
      S((dx, dy, col) => g.rect(cx - 3 + dx, cy - 3 + dy, 7, 7, col));
      g.hline(cx - 3, cy - 3, 7, "#ffffff");
      break;
  }
}

export const art: LabelArt = {
  slug: "values",
  swatch: ["#241540", "#c39a45", "#efe4c2", "#45c8d8", "#e8853a"],
  draw: (g, t) => {
    // ── 地 ─────────────────────────────────────────────────
    g.rect(0, 0, 68, 40, FELT);
    g.noise(2, 2, 64, 36, FELT_LT, 0.14, 5501);
    g.noise(2, 2, 64, 36, FELT_DK, 0.1, 8812);

    // ── 題字 ─────────────────────────────────────────────
    // 上の28行を題字に明け渡した。そのぶん標本箱は丈9行の1段になった。
    // 「上下で成り立たない対」は諦めて、「左右で相容れない対」だけを残す。
    // 器の話なので、段が減っても嘘にはならない。
    // 地はフェルトの粗い面なので、影を1px敷いて字を地から押し出す。
    const asc = ascent(T_A + T_B, T_SIZE, JP_TH);
    const to = { size: T_SIZE, ascent: asc, shadow: "#14092a" };
    jpRow(g, 1, T_A, CREAM, { ...to, x: 1 });
    jpRow(g, 15, T_B, CREAM, { ...to, x: 1 });

    // 分類の色玉。6つに分けたつもりが、下でひと組にまとまってしまう図。
    // 上の行が1字ぶん短いので、そのあきに縦2列で積む。
    const CHIPS = [CREAM, CYAN, ORANGE, GREEN, RED, MAGENTA];
    CHIPS.forEach((c, i) => {
      const x = 51 + (i % 2) * 7;
      const y = 1 + Math.floor(i / 2) * 4;
      g.rect(x, y, 5, 3, c);
      g.px(x, y, "#ffffff");
      g.px(x + 4, y + 2, SHADOW);
    });
    g.hline(51, 13, 12, BRASS);
    g.px(50, 13, BRASS_DK);
    g.px(63, 13, BRASS_DK);

    // ── 標本箱 ─────────────────────────────────────────────
    const CX = 3;
    const CY = 29;
    const CW = 62;
    const CH = 10;
    g.rect(CX, CY, CW, CH, FELT_DK);
    g.frame(CX, CY, CW, CH, BRASS);
    g.hline(CX + 1, CY, CW - 2, BRASS_LT);
    g.hline(CX + 1, CY + CH - 1, CW - 2, BRASS_DK);
    g.vline(CX + CW - 1, CY + 1, CH - 2, BRASS_DK);
    // 内側の落ち影。ガラスの下に一段沈んで見えるように。
    g.rect(CX + 1, CY + 1, CW - 2, CH - 2, FELT);
    g.hline(CX + 1, CY + 1, CW - 2, "#1a0f30");
    g.vline(CX + 1, CY + 1, CH - 2, "#1a0f30");
    g.hline(CX + 1, CY + CH - 2, CW - 2, "#31205c");
    g.noise(CX + 2, CY + 2, CW - 4, CH - 4, FELT_LT, 0.1, 3391);

    // 仕切り。等間隔にしない。標本箱は入るものに合わせて割るものなので。
    for (const dx of [18, 32, 48]) {
      g.vline(dx, CY + 1, CH - 2, BRASS_DK);
      g.vline(dx + 1, CY + 1, CH - 2, "#452f10");
      g.vline(dx, CY + 1, CH - 3, BRASS);
    }

    // ── 標本 ───────────────────────────────────────────────
    // 左右は必ず対。同じ棚で相容れないものを向かい合わせる。
    // 丈が7行しかないので、留めピンは標本の手前を貫かせる。上に立てる丈がない。
    // 通し番号と無記名の名札は落とした（欧文5行ぶんの丈がもう無い）。
    const SY = CY + 4; // 標本の中心
    specimen(g, "disc", 10, SY, CREAM);
    pin(g, 10, CY + 1, 4);

    // 動き: このマスだけ標本が入れ替わる。差し替えの一瞬は空になる。
    const phase = t % 1;
    if (phase < 0.44) specimen(g, "down", 25, SY, ORANGE);
    else if (phase > 0.56) specimen(g, "square", 25, SY, MAGENTA);
    else {
      // 差し替えの一瞬。空いた枠だけが破線で残る。
      g.hline(21, SY - 3, 9, "#6a5020", "vstripe");
      g.hline(21, SY + 3, 9, "#6a5020", "vstripe");
      g.vline(21, SY - 3, 7, "#6a5020", "hstripe");
      g.vline(29, SY - 3, 7, "#6a5020", "hstripe");
    }
    pin(g, 25, CY + 1, 4);

    specimen(g, "plus", 56, SY, GREEN);
    pin(g, 56, CY + 1, 4);

    // ── 中央：どちらとも決まらない標本 ─────────────────────
    // 左半分は地に図、右半分は図に地。同じものが同時に二通りある。
    // 段が1段になったので 13x13 から 7x7 に詰めた。理屈は同じ。
    const bx = 37;
    const by = CY + 1;
    for (let j = 0; j < 7; j++)
      for (let i = 0; i < 7; i++) {
        const dx = i - 3;
        const dy = j - 3;
        const inDisc = dx * dx + dy * dy <= 5;
        g.px(bx + i, by + j, inDisc !== i >= 4 ? CREAM : "#17102a");
      }
    g.frame(bx, by, 7, 7, BRASS_DK);
    g.px(bx + 3, by, BRASS);

    // 対になる矢印。噛み合わないまま背中合わせに立っている。
    // 標本の下に置く丈が無いので、中央のマスの右脇へ縦に積んだ。
    const ax = 46;
    g.vline(ax, CY + 2, 3, GOLD);
    g.px(ax - 1, CY + 3, GOLD);
    g.px(ax + 1, CY + 3, GOLD);
    g.vline(ax, CY + 5, 3, CYAN);
    g.px(ax - 1, CY + 6, CYAN);
    g.px(ax + 1, CY + 6, CYAN);

    // ── ガラス ─────────────────────────────────────────────
    // 斜めの照りを1本。標本箱がガラス越しであることだけ伝える。
    g.poly(
      [
        [8, CY + CH - 2],
        [14, CY + 1],
        [17, CY + 1],
        [11, CY + CH - 2],
      ],
      "#dbe8ff16",
    );

    // ── 枠 ─────────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。標本箱の真鍮の縁は絵の側の線。
    g.frame(0, 0, 68, 40, BRASS);
    mark(g, BRASS_LT, EDGE);
  },
};
