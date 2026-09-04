import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { rng } from "../gfx";
import { JP_TH, ascent, jpRow } from "../jptitle";

// 飛んで火に入る虫 ── 実物は MOTH & FLAME / DRAW A CIRCLE。
// 暗闇のなかで円を描くゲームで、描かれた円が細い線になって画面に何重にも残る。
// その「灯りのまわりを回った軌跡」をそのままラベルにする。
// 中心に蝋燭の火、まわりに何重もの円、その上を蛾が一匹。16枚でいちばん暗い1枚。

const NIGHT = "#0b0a16";
const NIGHT2 = "#141327";
const GLOW1 = "#2a1c1c";
const GLOW2 = "#4a2c14";
const GLOW3 = "#7a4a12";
const FLAME_O = "#e8760e";
const FLAME_M = "#f5b028";
const FLAME_I = "#fce89a";
const WAX = "#d2c39c";
const WAX_SH = "#9a8b68";
const WAX_DK = "#5f5540";
const MOTH_B = "#b89468";
const MOTH_D = "#7a6044";
const MOTH_L = "#f2e0bc";
const AMBER = "#c98a2a";

// 軌跡の線。実物の画面に残る細い円と同じ色味
const TRACE = ["#4a6b46", "#6b3a2c", "#5c5230", "#2f5a5c", "#5c3a52"];

// ── 和文の題字 ──────────────────────────────────────────
// 「飛んで火に入る虫」8文字。16px は1行4字が限界（5字で80px）なので2行に割る。
// 13px で 3字=39px / 5字=65px。判の幅は68pxなので5字でも収まる。
// 割る場所は「飛んで／火に入る虫」。ことわざの切れ目がここなので、
// 「飛んで火／に入る虫」と割ると助詞から行が始まって読みにくい。
// **11px には落とせない** ——「飛」の左半分の横画が3本とも繋がって、
// ただの黒い縦棒になる。13px でようやく数えられる。
// 上下あわせて25行を題字に明け渡し、蝋燭と蛾は下の13行に組み直した。
const T_A = "飛んで";
const T_B = "火に入る虫";
const T_SIZE = 13;

// 蛾。d=縁 D=翅 L=鱗粉 b=胴。羽ばたきの2コマ。
const MOTH_UP = [
  "..d.............d..",
  "...d...........d...",
  "....d....b....d....",
  ".....d...b...d.....",
  ".dddd...dbd...dddd.",
  "ddDDDdd.dbd.ddDDDdd",
  "dDLLLDDddbdddDLLLDd",
  "dDLLLDDDDbDDDDLLLDd",
  ".dDDDDDDDbDDDDDDDd.",
  "..dDDDDDDbDDDDDDd..",
  "...dDDLDDbDDLDDd...",
  "....dDDDDbDDDDd....",
  "......dDDbDDd......",
  ".......ddbdd.......",
];
const MOTH_DOWN = [
  "..d.............d..",
  "...d...........d...",
  "....d....b....d....",
  ".....d...b...d.....",
  "........dbd........",
  "...dddd.dbd.dddd...",
  "..dDDLDdDbDdDLDDd..",
  ".dDDLLLDDbDDLLLDDd.",
  ".dDDDDDDDbDDDDDDDd.",
  "..dDDDDDDbDDDDDDd..",
  "...dDDLDDbDDLDDd...",
  "....dDDDDbDDDDd....",
  "......dDDbDDd......",
  ".......ddbdd.......",
];
/** 遠くを回っているもの。小さい影 */
const MOTH_FAR = ["#...#", ".###.", "..#..", ".#.#."];

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

/** 楕円の輪郭を1ドットずつ。実物の「描かれた円」に倣ってわずかに歪ませる */
function traceRing(g: PixelGfx, cx: number, cy: number, rx: number, ry: number, c: string, wobble: number, seed: number) {
  const r = rng(seed);
  const jitter: number[] = [];
  for (let i = 0; i < 24; i++) jitter.push((r() - 0.5) * wobble);
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2;
    const j = jitter[Math.floor((i / 180) * 24) % 24];
    const x = Math.round(cx + Math.cos(a) * (rx + j));
    const y = Math.round(cy + Math.sin(a) * (ry + j));
    g.px(x, y, c);
  }
}

export const art: LabelArt = {
  slug: "moth",
  swatch: [NIGHT, FLAME_O, FLAME_I, "#4a6b46", MOTH_B],
  draw: (g, t) => {
    const FX = 33; // 火の位置
    // 題字に上の25行をゆずったので、蝋燭は下の13行に組み直した。
    // 炎7行・蝋4行・受け皿1行。3つの部分が判る最小寸。
    const FY = 31;

    // ── 闇 ──────────────────────────────────────────────
    g.rect(0, 0, 68, 40, NIGHT);
    g.rect(0, 0, 68, 40, NIGHT2, "quarter");
    g.noise(0, 0, 68, 40, "#1c1a30", 0.07, 41);

    // ── 火のまわりの明かり。外から内へ段を重ねる ────────────
    // 明かりの芯は炎の高さ（FY-2）。蝋燭が下がったぶん、かさも下げる。
    const GY = FY - 2;
    g.ellipse(FX, GY, 30, 20, GLOW1, "eighth");
    g.ellipse(FX, GY, 24, 16, GLOW1, "quarter");
    g.ellipse(FX, GY, 17, 12, GLOW1, "half");
    g.ellipse(FX, GY, 13, 9, GLOW1);
    g.ellipse(FX, GY, 11, 8, GLOW2, "half");
    g.ellipse(FX, GY, 8, 6, GLOW2);
    g.ellipse(FX, GY, 6, 5, GLOW3, "half");
    g.ellipse(FX, GY, 4, 4, GLOW3);

    // ── 軌跡。灯りのまわりを回った円が何重にも残っている ─────
    traceRing(g, FX - 1, GY + 1, 27, 17, TRACE[0], 2.2, 11);
    traceRing(g, FX + 2, GY - 1, 23, 15, TRACE[1], 2.6, 23);
    traceRing(g, FX - 2, GY, 19, 13, TRACE[2], 2.0, 37);
    traceRing(g, FX + 1, GY + 2, 15, 10, TRACE[3], 1.8, 51);
    traceRing(g, FX, GY - 2, 11, 8, TRACE[4], 1.6, 67);
    traceRing(g, FX + 3, GY + 1, 30, 19, "#3a4a3a", 2.8, 83);

    // ── 蝋燭 ────────────────────────────────────────────
    g.rect(FX - 3, FY + 3, 7, 4, WAX_SH);
    g.rect(FX - 2, FY + 3, 4, 4, WAX);
    g.vline(FX + 3, FY + 3, 4, WAX_DK);
    g.hline(FX - 3, FY + 3, 7, "#fff6e0");
    // 垂れた蝋
    g.vline(FX - 3, FY + 4, 2, "#fff6e0");
    g.px(FX - 4, FY + 5, WAX_SH);
    // 受け皿
    g.ellipse(FX, FY + 7, 8, 1, "#4a3a24");
    g.ellipse(FX, FY + 7, 6, 1, "#7a6038");
    g.hline(FX - 4, FY + 6, 9, "#a88450");
    // 芯
    g.vline(FX, FY + 1, 2, "#2a2018");

    // ── 炎。1コマ揺れる ─────────────────────────────────
    const sway = t < 0.5 ? 0 : 1;
    const fx = FX + (sway ? 1 : 0);
    g.poly(
      [
        [fx, FY - 5],
        [fx + 3, FY - 1],
        [fx + 2, FY + 2],
        [fx - 2 - sway, FY + 2],
        [fx - 3, FY - 1],
      ],
      FLAME_O,
    );
    g.poly(
      [
        [fx, FY - 4],
        [fx + 2, FY - 1],
        [fx + 1, FY + 1],
        [fx - 1 - sway, FY + 1],
        [fx - 2, FY - 1],
      ],
      FLAME_M,
    );
    g.vline(fx, FY - 3, 4, FLAME_I);
    g.px(fx, FY - 3, "#fff8d8");
    // 火の粉
    g.px(fx + 4, FY - 6 - sway, FLAME_M);
    g.px(fx - 4, FY - 4 + sway, FLAME_O);

    // ── 遠くを回っている蛾 ───────────────────────────────
    g.blit(3, 27, MOTH_FAR, { "#": "#4a3c2c" });
    g.blit(63, 29, MOTH_FAR, { "#": "#3e3226" });
    g.blit(21, 34, MOTH_FAR, { "#": "#3a3026" });

    // ── 蛾。火に向かって右から降りてくる。羽が1コマ動く ────
    const mx = 42;
    const my = 25;
    g.blit(mx, my, t < 0.5 ? MOTH_UP : MOTH_DOWN, {
      d: MOTH_D,
      D: MOTH_B,
      L: MOTH_L,
      b: "#9a7a52",
    });
    // 胴の陰。1本入れると翅が2枚に割れて見えなくなる
    g.vline(mx + 9, my + 6, 7, "#6b5238");
    // 火に向いた側だけ、うっすら暖かい
    for (const [dx, dy] of [
      [3, 11],
      [4, 10],
      [5, 12],
      [6, 9],
      [7, 12],
      [2, 9],
    ])
      g.px(mx + dx, my + dy, "#d8a860");

    // 蛾から落ちる鱗粉。丈が無くなったので、翅の下ではなく火の側へ流す。
    const r = rng(97);
    for (let i = 0; i < 10; i++) {
      const x = Math.round(mx - 8 + r() * 10);
      const y = Math.round(my + 6 + r() * 8);
      g.px(x, y, i % 3 === 0 ? "#e0c8a4" : "#7a6450");
    }

    // ── 題字と隅の文字 ───────────────────────────────────
    // 16枚でいちばん暗い地なので、題字は炎の色をそのまま借りる。
    // 闇にじかに置けば1色べたで抜ける。ふち取りは回さない（画数が潰れる）が、
    // 軌跡の円と明かりのかさの上に乗るので、1pxの影だけは敷いて地から押し出す。
    const asc = ascent(T_A + T_B, T_SIZE, JP_TH);
    const to = { size: T_SIZE, ascent: asc, shadow: "#0a0910" };
    jpRow(g, 1, T_A, FLAME_M, to);
    jpRow(g, 14, T_B, FLAME_M, to);
    const sub = (x: number, y: number, s: string, c: string) => {
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ])
        g.text3x5(x + dx, y + dy, s, "#140e04");
      g.text3x5(x, y, s, c);
    };
    // 欧文は従。受け皿にかからない左端だけ。
    sub(3, 34, "MOTH", AMBER);

    // ── 枠 ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。16枚でいちばん暗いので琥珀にする。
    g.frame(0, 0, 68, 40, AMBER);
    mark(g, AMBER, NIGHT);
  },
};
