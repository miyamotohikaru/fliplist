import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { NES } from "../palette";
import { shade } from "../gfx";
import { JP_TH, ascent, jpRow } from "../jptitle";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ともだちジェネレーター。さみしい写真に、知らない人がどんどん足される。
//
// 図の骨組み: 現像された1枚の写真そのもの。
//   写真の中 = 空・雲・太陽・草地に、後列10人＋前列10人の集合写真。
//              顔検出のような白い鉤で囲まれた1人だけが本物で、
//              あとは生成されたともだち。
//   下の白場 = 「1 → 20」の見出しと、読ませない細字とカメラ。
// 動くもの: 右端にもう1人フレームインして、数が1つ増える。

const PRINT = "#f4f2ea"; // 印画紙
const EDGE = "#20242c";

// ── 和文の題字 ──────────────────────────────────────────
// 「ともだち」「ジェネレーター」の2語で割る（語の途中で割らない）。
// 「ジェネレーター」7字は11pxだと77px要ってラベル幅(68px)に入らないので、
// 長いほうだけ9pxへ落とす（9px x 7 = 63px）。「ともだち」4字は11pxのまま
// （9pxにそろえる必要が無い＝44px<66pxで既に余裕がある）。
// ぜんぶ仮名なので、9pxまで落としても画が繋がって潰れることは無い。
//
// 題字の裾が前列の髪にかかるので、白のふちを8方向に回してから濃紺で塗る。
// 仮名は画が開いているので、ふちを回しても中は潰れない。
const T_A = "ともだち";
const T_B = "ジェネレーター";
const T_SIZE_A = 11;
const T_SIZE_B = 9;
const RED = "#d82800";
const GRASS = "#3aa03c";
const GRASS_DK = "#1f7030";

// 7x13 の人。h=髪 f=肌 e=目 s=服 S=服の陰 p=ズボン b=靴
const BODY = [
  "..hhh..",
  ".hhhhh.",
  ".hfffh.",
  ".fefef.",
  ".fffff.",
  ".SsssS.",
  "sssssss",
  "sssssss",
  ".sssss.",
  ".ppppp.",
  ".pp.pp.",
  ".pp.pp.",
  ".bb.bb.",
];
const HEAD = BODY.slice(0, 7);

type Person = {
  h: string;
  f: string;
  s: string;
  p: string;
  /** cap=帽子 long=長い髪 wave=手を挙げている */
  acc?: "cap" | "long" | "wave";
};

const SKIN_A = NES.skin;
const SKIN_B = "#d8935c";
const SKIN_C = "#ffd9b4";

// 前列。左から4人目だけが本物
const FRONT: Person[] = [
  { h: "#2a1a18", f: SKIN_A, s: NES.red, p: "#26315c" },
  { h: "#7a4a1c", f: SKIN_B, s: NES.cyan, p: "#4d5a66", acc: "cap" },
  { h: NES.gold, f: SKIN_C, s: "#f0f0e8", p: NES.brown, acc: "long" },
  { h: "#2a1a18", f: SKIN_A, s: NES.yellow, p: NES.blue }, // 本物
  { h: "#a5a5ad", f: SKIN_A, s: NES.green, p: "#26315c", acc: "wave" },
  { h: "#7a4a1c", f: SKIN_C, s: NES.purple, p: "#5a3a1c" },
  { h: "#2a1a18", f: SKIN_B, s: NES.orange, p: "#4d5a66", acc: "cap" },
  { h: NES.pink, f: SKIN_C, s: NES.blueLt, p: "#26315c", acc: "long" },
  { h: "#7a4a1c", f: SKIN_A, s: NES.pink, p: "#3a3a44" },
  { h: "#2a1a18", f: SKIN_C, s: NES.teal, p: "#5a3a1c", acc: "cap" },
];
// 後列。頭だけ見えている
const BACK: Person[] = [
  { h: "#7a4a1c", f: SKIN_A, s: NES.magenta, p: "#000" },
  { h: "#2a1a18", f: SKIN_C, s: NES.lime, p: "#000" },
  { h: NES.gold, f: SKIN_B, s: NES.blue, p: "#000" },
  { h: "#2a1a18", f: SKIN_A, s: NES.orange, p: "#000", acc: "cap" },
  { h: "#7a4a1c", f: SKIN_C, s: NES.cyanLt, p: "#000" },
  { h: "#a5a5ad", f: SKIN_A, s: NES.red, p: "#000" },
  { h: NES.pink, f: SKIN_B, s: NES.yellow, p: "#000", acc: "long" },
  { h: "#2a1a18", f: SKIN_C, s: NES.greenLt, p: "#000" },
  { h: "#7a4a1c", f: SKIN_A, s: NES.violet, p: "#000", acc: "cap" },
  { h: NES.gold, f: SKIN_C, s: NES.red, p: "#000" },
];
const NEWCOMER: Person = {
  h: NES.gold,
  f: SKIN_B,
  s: NES.lime,
  p: NES.brown,
  acc: "wave",
};

export const art: LabelArt = {
  slug: "friends",
  swatch: [PRINT, NES.blueLt, GRASS, NES.yellow, RED],

  draw: (g, t) => {
    const person = (
      x: number,
      y: number,
      p: Person,
      rows: readonly string[],
    ) => {
      g.blit(x, y, rows, {
        h: p.h,
        f: p.f,
        e: "#2a1a18",
        s: p.s,
        S: shade(p.s, -0.3),
        p: p.p,
        b: "#241f1c",
      });
      if (p.acc === "cap") {
        g.hline(x + 1, y, 5, NES.red);
        g.hline(x, y + 1, 7, NES.redDk);
        g.px(x + 3, y - 1, NES.red);
      }
      if (p.acc === "long") {
        g.vline(x + 1, y + 2, 5, p.h);
        g.vline(x + 5, y + 2, 5, p.h);
      }
      if (p.acc === "wave" && rows.length > 7) {
        g.vline(x + 6, y + 3, 3, p.s);
        g.px(x + 6, y + 2, p.f);
        g.px(x + 5, y + 2, p.f);
      }
    };

    // ── 印画紙 ────────────────────────────────────────────
    // 題字が20行を取るので、写真は上へ広げて（1..33行）白場は下だけにした。
    g.rect(0, 0, 68, 40, PRINT);
    g.rect(1, 1, 66, 33, EDGE); // 写真のふち
    g.clip(2, 2, 64, 31); // ここから先は写真の中だけ

    // ── 空 ───────────────────────────────────────────────
    // 上の20行はまるごと題字の座。太陽も光条も雲もやめてある。
    // **題字の座はディザを敷かない。** 11px の仮名は画が1pxなので、
    // 市松のディザの上に置くと画とディザが混ざって字がぼやける。
    // 階調を付けるのは、字の裾より下（頭のすぐ上）の6行だけ。
    g.rect(2, 2, 64, 20, "#3cbcfc");
    g.ditherV(2, 22, 64, 6, "#3cbcfc", "#b4f0fc");

    // ── 草地 ─────────────────────────────────────────────
    g.rect(2, 28, 64, 5, GRASS);
    g.hline(2, 28, 64, "#5cc44c");
    g.rect(2, 30, 64, 3, GRASS_DK, "half");
    g.hline(2, 32, 64, "#175a26");
    for (let i = 0; i < 22; i++)
      g.px(3 + i * 3 - (i & 1), 29 + (i % 2), "#7ad85c");

    // ── 前列 ─────────────────────────────────────────────
    // 題字に20行ゆずったぶん、後列の頭は落とした。
    // 20人の群れは前列だけでも成り立つが、題字が無いと「ファミコン」に見えない。
    const PY = 20; // 前列の天
    const REAL_INDEX = 3; // 本物はこの1人だけ（下の鉤の位置と対応）
    // 本物以外は点滅させる。「アップロードされた写真に増える友達」が
    // 生成されたものだと絵でも伝わるように。人ごとに位相をずらして、
    // 一斉にではなくばらばらに明滅させる（0.173 は同期を避けるための半端な値）。
    const blinkVisible = (seed: number) => (t + seed) % 1 < 0.7;
    for (let i = 0; i < FRONT.length; i++) {
      if (i === REAL_INDEX || blinkVisible(i * 0.173)) person(1 + i * 6, PY, FRONT[i], BODY);
    }

    // ── 動くもの: 右端からもう1人フレームインする ───────
    // フレームインする人も「その他」の1人なので、同じく点滅させる
    const joined = t >= 0.5;
    if (joined && blinkVisible(0.7)) person(60, PY, NEWCOMER, BODY);

    // ── 本物はこの1人だけ。顔検出のような四隅の鉤で囲う ──
    // 群衆は赤い服だらけなので、鉤は白＋影にして必ず抜けるようにする
    const rx = 1 + REAL_INDEX * 6 + 3; // 前列4人目の頭の中心
    const bracket = (c: string, o: number) => {
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        // 鉤は ±5。±6 にすると天の鉤が題字の裾とぶつかる。
        const cx = rx + sx * 5 + o;
        const cy = PY + 6 + sy * 5 + o;
        g.hline(sx < 0 ? cx : cx - 3, cy, 4, c);
        g.vline(cx, sy < 0 ? cy : cy - 3, 4, c);
      }
    };
    bracket("#101418", 1);
    bracket(NES.white, 0);
    g.px(rx + 5, PY + 1, RED);
    g.px(rx - 5, PY + 11, RED);

    g.unclip();
    g.frame(2, 2, 64, 31, "#00000033");
    g.frame(1, 1, 66, 33, EDGE);

    // ── 題字 ─────────────────────────────────────────────
    // 実機の作法どおり、空にじかに大きく。写真の枠は跨いでよい。
    // 濃紺の1色べた。空の水色との差だけで抜ける。
    // **ふちも影も付けない。** 11px の仮名11文字は字間が1pxしかないので、
    // ふちを8方向に回すと字と字がくっついて、上の20行がまるごと1枚の板になる
    // （白でも濃紺でも同じ。空が消えて写真に見えなくなる）。
    // 白の影を1px敷くのも駄目で、空のディザを白が食って字が二重に見える。
    // 濃紺と水色の差だけで足りる。裾が前列の髪に1行かかるが、
    // 髪はどれも頭頂が3pxしかないので、字が切れて見えるほどにはならない。
    // T_A・T_B は級数が違う（下の題字コメント参照）ので ascent も別々に測る。
    // 混ぜて測ると、小さいほうの行の天地がずれる。
    const toA = { size: T_SIZE_A, ascent: ascent(T_A, T_SIZE_A, JP_TH) };
    const toB = { size: T_SIZE_B, ascent: ascent(T_B, T_SIZE_B, JP_TH) };
    // 濃紺のまま空に置くと、細い画が水色に沈んで「引っかき傷」に見えた。
    // 8方向のふちは駄目（字間の1pxがふちで埋まり、行が一枚の板になる）。
    // **右下の1方向だけに白を敷く。** 字間は埋まらず、画の下側だけが空から離れる。
    const halo = "#eaf6ff";
    for (const [dx, dy] of [
      [1, 1],
      [1, 0],
      [0, 1],
    ] as const) {
      const prev = g.pushOrigin(dx, dy);
      jpRow(g, 1, T_A, halo, toA);
      jpRow(g, 12, T_B, halo, toB);
      g.popOrigin(prev);
    }
    jpRow(g, 1, T_A, EDGE, toA);
    jpRow(g, 12, T_B, EDGE, toB);

    // ── 下の白場 ─────────────────────────────────────────
    // 題字が和文になったので、ここは欧文の従属表記と実数だけ。
    g.text3x5(3, 34, "FRIENDS", "#5c6472");
    g.text3x5(33, 34, "1", EDGE);
    g.hline(38, 36, 5, EDGE); // 矢印
    g.px(42, 35, EDGE);
    g.px(42, 37, EDGE);
    g.px(41, 34, EDGE);
    g.px(41, 38, EDGE);
    g.text3x5(45, 34, joined ? "21" : "20", RED);
    // 小さなカメラ。白場が5行に詰まったので、胴を1行削ってある。
    g.blit(53, 34, ["..##...", "#######", "#.###.#", "#..#..#", "#######"], {
      "#": "#585660",
    });
    g.px(56, 36, "#a8c8e8");
    g.px(55, 36, "#7098c8");

    // ── 外枠 ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, EDGE, PRINT);
  },
};
