import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow, misakiWidth } from "../misaki";

// なかよしケーキシミュレーター — ケーキを好きに飾って、
// みんなで「公平に」切り分ける。
//
// 図の骨組み: ラベル一面をホールケーキの上面にする（真上から、ふちだけが見える近さ）。
//   まんなかに、誕生日ケーキに載せるチョコのプレート。題字はそこへホワイトチョコで書く。
//   ふちはうすいピンクのクリームの絞りで、苺・ブルーベリー・ラズベリー・ミントが並ぶ
//   （実物で飾り終えたケーキの写真どおり）。プレートの上には、チョコペンで描いた
//   寝そべりこすくまくん。
//
// 2026-10-18 に作り直した。前の版は「薄い地に小さな字2行と、遠くのケーキ」で、
// 他の16枚と並べると、題字が埋もれる・地が平ら・飾りが点にしか見えない、で負けていた。
//   ・題字はチョコのプレートで囲って、白と焦げ茶の一番強い明暗差に載せる。
//   ・ケーキに寄って、果物を1粒ずつ形の分かる大きさ（苺は5x6）で描く。
//   ・字は正式名を全部入れるので8x8（src/art/misaki.ts）。
//
// 動くもの: アラザン（銀の粒）がちかちか光る。

const CREAM = "#fffaf2";
const CREAM_D = "#efe6d8";
const PINK = "#f6cfd8";
const PINK_D = "#e6a9b8";
const CHOCO = "#4a2616";
const CHOCO_L = "#6e3c22";
const CHOCO_D = "#2c140a";
const WHITE_CHOCO = "#fff3dc";
const BERRY = "#e3343e";
const BERRY_L = "#ff8a86";
const BERRY_D = "#a41c28";
const SEED = "#ffe08a";
const LEAF = "#5fae4a";
const LEAF_D = "#3c7c30";
const BLUE = "#5e6cc4";
const BLUE_L = "#9aa6ea";
const BLUE_D = "#38407e";
const RASP = "#ec5a7c";
const RASP_L = "#ff9ab2";
const SILVER = "#c4c8d4";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// 苺（5x6）。へたが上。
const STRAWBERRY = [".lLl.", "RHRRR", "RsRsR", "RRRsR", ".RsR.", "..D.."];
function strawberry(g: PixelGfx, x: number, y: number) {
  g.blit(x, y, STRAWBERRY, {
    l: LEAF,
    L: LEAF_D,
    R: BERRY,
    H: BERRY_L,
    s: SEED,
    D: BERRY_D,
  });
}
// ブルーベリー（3x3）とラズベリー（3x3）
function blueberry(g: PixelGfx, x: number, y: number) {
  g.blit(x, y, ["DBD", "BhB", "DBD"], { B: BLUE, h: BLUE_L, D: BLUE_D });
}
function raspberry(g: PixelGfx, x: number, y: number) {
  g.blit(x, y, ["RhR", "hRh", "RhR"], { R: RASP, h: RASP_L });
}
// ミントの葉（3x2）
function mint(g: PixelGfx, x: number, y: number) {
  g.blit(x, y, ["ll.", ".Ll"], { l: LEAF, L: LEAF_D });
}

// 寝そべったこすくまくん（チョコペンの線、17x7）。
// 背中の山、右に耳2つと目、左下に小さな手。
const BEAR = [
  "...####....##.##.",
  "..#....####..#..#",
  ".#..............#",
  "#...........#...#",
  "#...............#",
  "#.#.#...........#",
  ".###############.",
];

const T_A = "なかよしケーキ";
const T_B = "シミュレーター";

// チョコのプレート
const PX = 4;
const PY = 13;
const PW = 60;
const PH = 20;

export const art: LabelArt = {
  slug: "nakayoshi",
  swatch: [CREAM, PINK, BERRY, BLUE, CHOCO],
  draw: (g, t) => {
    // ── 上面のクリーム ───────────────────────────────────
    g.rect(0, 0, 68, 40, CREAM);
    g.noise(1, 1, 66, 38, CREAM_D, 0.08, 717);

    // ── ふちの絞り ───────────────────────────────────────
    // うすいピンクのクリームを、上下のふちに沿って波形に絞る。
    for (let x = 1; x < 67; x++) {
      const k = x % 4;
      const top = k === 0 || k === 3 ? 2 : 3;
      g.vline(x, 1, top, PINK);
      g.px(x, top, k === 1 ? PINK_D : PINK);
      g.vline(x, 39 - top, top, PINK);
      g.px(x, 39 - top, k === 1 ? PINK_D : PINK);
    }

    // ── 上のふちの果物 ───────────────────────────────────
    strawberry(g, 2, 3);
    blueberry(g, 8, 5);
    strawberry(g, 12, 2);
    mint(g, 18, 4);
    raspberry(g, 46, 4);
    strawberry(g, 51, 2);
    blueberry(g, 57, 5);
    strawberry(g, 61, 3);

    // ── プレートの上のくま（チョコペン） ─────────────────
    // プレートの上の余白、果物と果物のあいだに置く。
    g.blit(25, 4, BEAR, { "#": CHOCO });

    // ── チョコのプレート ─────────────────────────────────
    // 角を1px落とした板。上に光、下に厚み。
    g.rect(PX + 1, PY + 1, PW, PH, CHOCO_D); // 影
    g.rect(PX, PY, PW, PH, CHOCO);
    g.hline(PX + 1, PY, PW - 2, CHOCO_L);
    g.vline(PX, PY + 1, PH - 2, CHOCO_L);
    g.hline(PX + 1, PY + PH - 1, PW - 2, CHOCO_D);
    for (const [cx, cy] of [
      [PX, PY],
      [PX + PW - 1, PY],
      [PX, PY + PH - 1],
      [PX + PW - 1, PY + PH - 1],
    ] as Array<[number, number]>) {
      g.px(cx, cy, CREAM);
    }
    // 題字。ホワイトチョコで2行、プレートの中央に。
    const tx = PX + Math.round((PW - misakiWidth(T_A)) / 2);
    misakiRow(g, tx, PY + 2, T_A, WHITE_CHOCO, CHOCO_D);
    misakiRow(g, tx, PY + 11, T_B, WHITE_CHOCO, CHOCO_D);

    // ── 下のふちの果物 ───────────────────────────────────
    blueberry(g, 2, 34);
    strawberry(g, 6, 33);
    raspberry(g, 13, 35);
    mint(g, 19, 35);
    strawberry(g, 26, 33);
    blueberry(g, 33, 35);
    strawberry(g, 39, 33);
    raspberry(g, 46, 35);
    blueberry(g, 51, 34);

    // ── アラザン。ちかちか光る ───────────────────────────
    const on = t < 0.5;
    for (const [x, y, k] of [
      [20, 9, 0],
      [44, 9, 1],
      [3, 11, 1],
      [64, 11, 0],
      [57, 33, 0],
      [23, 35, 1],
    ] as Array<[number, number, number]>) {
      g.px(x, y, (k === 0) === on ? "#ffffff" : SILVER);
    }

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。苺の赤に合わせる。
    g.frame(0, 0, 68, 40, BERRY);
    mark(g, BERRY, CREAM);
  },
};
