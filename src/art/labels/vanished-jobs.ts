import type { LabelArt } from "./types";
import { rng } from "../gfx";
import type { PixelGfx } from "../gfx";
import { JP_TH, ascent, jpRow } from "../jptitle";

// 消えた職業図鑑 — 151件の、もう無い仕事の記録。
// このラベルは、その図鑑から抜いた一葉という体裁にする。
// 図版は「点灯夫」。日暮れに街灯を一つずつ点けてまわった仕事で、
// 電気が来て消えた。いちばん奥の灯りが、いま落ちるところ。

const NIGHT0 = "#181430";
const NIGHT1 = "#2c1d3e";
const NIGHT2 = "#552e4a";
const NIGHT3 = "#a85c4e";

const WALL = "#241d33";
const WALL2 = "#342a48";
const ROOF = "#100d1c";
const ROOF_L = "#4e4270";
const WINDOW = "#e09a34";
const WINDOW_L = "#ffd97e";

// 石畳。街なみの壁(#241d33)とほとんど同じ明るさだと、丈が7行に詰まったとき
// 壁と路面の境が消えて全部ひと塊の闇になる。雨あがりで濡れている体にして
// 一段明るく持ち上げ、壁より上に置く。
const ROAD = "#332942";
const STONE1 = "#453757";
const STONE2 = "#2a2238";
const STONE3 = "#584467";

const GOLD = "#ffd97e";
const GOLD2 = "#f0a838";
const GOLD3 = "#9c6420";
const IRON = "#0c0912";
const IRON_L = "#463854";

const PLATE = "#c8a25c";
const PAPER = "#ece0c4";
const BAND = "#181018";
const RUST = "#c0453a";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 和文の題字 ──────────────────────────────────────────
// 「消えた職業図鑑」7文字。上下で級数を変えてある。
//   上「消えた」11px — 修飾のことばなので小さくてよい。33px で左に寄る。
//   下「職業図鑑」15px — **13px では職・業・鑑の横画が繋がって黒い塊になる。**
//     15px まで上げると画と画のあいだが開く。4字なら 15px x 4 = 60px で入る。
// 上下あわせて25行。街は下の13行に詰め、点灯夫（丈13）がちょうど収まる。
const T_A = "消えた";
const T_B = "職業図鑑";
const T_SIZE_A = 11;
const T_SIZE_B = 15;

const MAN = [
  "..KKKK..",
  ".KKKKKK.",
  "..KDKR..",
  "..KDKR..",
  ".KKDDKR.",
  "KKDDDKR.",
  "KKDDDKR.",
  "KKDDDKR.",
  ".KDDDKR.",
  ".KDDDKR.",
  ".KK.KKR.",
  ".KK.KK..",
  "KKK.KKK.",
];

export const art: LabelArt = {
  slug: "vanished-jobs",
  swatch: ["#1b1630", "#ffd97e", "#4c2b36", "#c8a25c", "#171322"],
  draw: (g, t) => {
    // 奥のランプの寿命。3コマで、点いて／弱って／落ちる。
    const step = Math.floor(t * 3) % 3;

    // ── 夜空。日が落ちたばかりの、下だけ赤い空。 ─────────
    // 題字が上の25行を取ったので、空はその地になる。街は下の13行。
    g.rect(0, 0, 68, 33, NIGHT0);
    g.rect(0, 4, 68, 29, "#211838");
    g.rect(0, 9, 68, 24, NIGHT1);
    g.rect(0, 14, 68, 19, "#3f2646");
    g.rect(0, 18, 68, 15, NIGHT2);
    g.rect(0, 21, 68, 12, "#6b374c");
    g.rect(0, 24, 68, 9, "#8c4a4c");
    g.rect(0, 27, 68, 6, NIGHT3);

    // 星。上の行は左に寄せてあるので、その右のあきに出す。
    const sr = rng(3311);
    for (let i = 0; i < 30; i++) {
      const x = 2 + Math.floor(sr() * 64);
      const y = 1 + Math.floor(sr() * 12);
      g.px(x, y, sr() < 0.45 ? "#7f74a4" : "#d6cce8");
    }

    // 月。題字に左を明け渡したので、右上へ寄せてある。
    g.disc(58, 6, 4, "#ded2b2");
    g.disc(57, 5, 3, "#fdf6dc");
    g.px(59, 4, "#c8bb9a");
    g.px(60, 7, "#c8bb9a");
    g.px(56, 8, "#c8bb9a");
    g.ring(58, 6, 6, "#463a60", 1);

    // ── 街なみ。切妻の続く古い通り。 ─────────────────────
    // 丈が7行しかないので、棟は低く小さく、切妻の形だけで通りを言う。
    const ROADY = 33;
    const houses: Array<[number, number, number]> = [
      [-2, 27, 11],
      [8, 28, 9],
      [16, 26, 11],
      [26, 28, 7],
      [32, 27, 9],
      [40, 26, 11],
      [50, 28, 9],
      [58, 27, 11],
    ];
    for (const [hx, hy, hw] of houses) {
      const roofH = Math.ceil(hw / 2);
      const wallTop = hy + roofH;
      g.rect(hx, wallTop, hw, ROADY - wallTop, WALL);
      g.vline(hx, wallTop, ROADY - wallTop, WALL2);
      g.vline(hx + hw - 1, wallTop, ROADY - wallTop, ROOF);
      // 切妻。左の斜面に月の光がのる。
      for (let i = 0; i < roofH; i++) {
        const w = hw - i * 2;
        if (w <= 0) break;
        g.hline(hx + i, wallTop - i, w, ROOF);
        g.px(hx + i, wallTop - i, i > 0 ? ROOF_L : ROOF);
      }
      g.px(hx + roofH - 1, hy, ROOF_L);
      // 窓。ひと棟にひとつだけ。灯っている家といない家がある。
      const wx = hx + 2;
      const wy = wallTop + 1;
      if (wy < ROADY - 1 && wx + 1 < hx + hw - 1) {
        const lit = (hx * 5 + hy * 3) % 7 < 4;
        g.rect(wx, wy, 2, 2, lit ? WINDOW : "#181327");
        if (lit) g.px(wx, wy, WINDOW_L);
      }
    }

    // ── 石畳 ──────────────────────────────────────────────
    g.rect(0, ROADY, 68, 40 - ROADY, ROAD);
    const cr = rng(5501);
    for (let row = 0; row < 3; row++) {
      const y = ROADY + row * 2;
      const off = (row % 2) * 2;
      for (let x = -off; x < 68; x += 4) {
        const v = cr();
        g.rect(x, y, 3, 2, v < 0.22 ? STONE3 : v < 0.62 ? STONE1 : STONE2);
      }
    }
    g.hline(0, ROADY - 1, 68, "#7a4e5c");
    g.hline(0, ROADY, 68, "#0d0a16", "half");

    // 雨あがりの水たまり。落ちかけの灯りが1本ぶんだけ映る。
    g.ellipse(33, 37, 6, 1, "#241d30");
    g.vline(33, 36, 3, "#7a5a2e");
    g.px(33, 37, "#a87a34");

    // ── 街灯。奥へ続く列。いちばん奥から順に落ちてゆく。 ─
    // 題字に上の25行をゆずったので、笠の位置はぜんぶ下げてある。
    // すでに落ちて久しい1本。柱だけが残っている。
    lamp(g, 20, 31, 38, 1, 0);
    // いま落ちるところ
    lamp(g, 33, 29, 38, 2, step === 0 ? 1 : step === 1 ? 0.5 : 0);
    if (step === 2) {
      // 消えたあとの一筋
      g.px(33, 30, "#7d6f84");
      g.px(34, 28, "#63557a");
    }
    // 点灯夫がいま点けている1本
    lamp(g, 62, 26, 38, 3, 1);

    // ── 点灯夫 ────────────────────────────────────────────
    g.blit(49, 26, MAN, { K: IRON, D: "#251e33", R: "#c08a4a" });
    g.px(55, 28, "#e8b96e"); // 灯りを受けた頬
    g.px(56, 32, "#a67a44");
    // 長い点火棒。手から、いま点けた笠へ。
    g.line(55, 30, 60, 26, "#1c1520");
    g.line(56, 30, 61, 26, "#7d5c36");
    g.px(61, 25, GOLD);
    g.px(62, 25, "#fff6dc");
    // 足もとの照り返し
    g.hline(49, 38, 8, "#4a3040");

    // ── 図鑑の版面 ───────────────────────────────────────
    // 小札は題字に場所を譲った。消えた年だけ、石畳の左の隅に残す。
    g.rect(2, 34, 15, 5, "#130e21c0");
    g.text3x5(3, 34, "1957", PLATE);
    // 絶滅の印
    for (const [dx, dy] of [
      [0, -1],
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, 1],
    ] as const)
      g.px(65 + dx, 35 + dy, RUST);

    // 褪せた紙。よごれは控えめに。
    g.noise(1, 1, 66, 38, "#a89478", 0.012, 7717);
    g.rect(1, 1, 7, 7, "#0a0810", "eighth");
    g.rect(60, 32, 7, 7, "#0a0810", "eighth");
    g.rect(1, 32, 7, 7, "#0a0810", "eighth");

    // ── 題字 ──────────────────────────────────────────────
    // 夜空という暗い地なので、1色べたで置けば抜ける。ふち取りはしない
    // （画数の多い漢字はふちを回すと潰れる）。上は紙色、下は街灯の金色。
    jpRow(g, 1, T_A, PAPER, {
      size: T_SIZE_A,
      ascent: ascent(T_A, T_SIZE_A, JP_TH),
      x: 2,
    });
    jpRow(g, 12, T_B, GOLD, {
      size: T_SIZE_B,
      ascent: ascent(T_B, T_SIZE_B, JP_TH),
    });

    // ── ふち ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, "#7d6136");
    mark(g, PLATE, BAND);
  },
};

/**
 * ガス灯。size は笠の半幅、lit は 0..1 の明るさ。
 * 消えかけの1本を作るためだけに、明るさを外から渡せるようにしてある。
 */
function lamp(g: PixelGfx, x: number, top: number, base: number, size: number, lit: number) {
  const gy = top + size + 2; // ほやの中心
  const armY = top + size * 2 + 3;

  // 光のかさ。下の街なみを消さないよう、狭く薄く。
  if (lit > 0) {
    const bright = lit > 0.6;
    g.disc(x, gy, size + (bright ? 4 : 2), bright ? "#e8901e2a" : "#a8681e20");
    if (bright) g.disc(x, gy, size + 2, "#f0a83840");
  }

  // 笠
  for (let i = 0; i <= size; i++) g.hline(x - i, top + size - i, i * 2 + 1, IRON);
  g.px(x, top - 1, IRON);
  g.px(x - size, top + size, IRON);
  // ほや
  const gw = size * 2 - 1;
  g.rect(x - size + 1, top + size + 1, gw, size + 2, IRON);
  if (lit > 0) {
    g.rect(x - size + 2, top + size + 1, gw - 2, size + 1, lit > 0.6 ? "#ffbe44" : "#7a5426");
    if (lit > 0.6) {
      g.vline(x, gy - 1, 3, "#fff2c0");
      g.px(x, gy, "#ffffff");
      g.px(x - 1, gy, GOLD);
      g.px(x + 1, gy, GOLD);
      g.hline(x - size + 2, top + size + 1, gw - 2, GOLD2);
    } else {
      g.px(x, gy, GOLD3);
    }
  } else {
    g.rect(x - size + 2, top + size + 1, gw - 2, size + 1, "#2a2130");
  }

  // 腕木と柱
  g.hline(x - size, armY, size * 2 + 1, IRON);
  g.vline(x, armY, base - armY, IRON);
  if (size >= 3) g.vline(x - 1, armY + 2, base - armY - 2, IRON_L);
  g.hline(x - 1, base - 1, 3, IRON);
  g.hline(x - 2, base, 5, IRON);

  // 石畳に落ちるあかり
  if (lit > 0) {
    const w = size * 2 + 2;
    g.ellipse(x, base + 1, w, 2, lit > 0.6 ? "#6b4622" : "#3a2c26");
    g.ellipse(x, base + 1, w - 3, 1, lit > 0.6 ? "#9c6a2a" : "#4a382c");
  }
}
