import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow, misakiWidth } from "../misaki";

// なかよしケーキシミュレーター — ケーキを好きに飾って、
// みんなで「公平に」切り分ける。
//
// 図の骨組み: 丸いホールケーキを斜め上から、まるごと1台（上面・側面・お皿）。
//   上面のふちはうすいピンクのクリームで、苺とブルーベリーがぐるりと並ぶ
//   （実物で飾り終えたケーキの写真どおり）。側面の下には絞りの粒。
//   上面のまんなかには、チョコペンで描いた寝そべりこすくまくん。
//   題字はケーキの奥に立てたチョコのプレートに、ホワイトチョコで書く。
//   プレートはケーキに一切かぶせない。ケーキの輪郭（上面の楕円・側面・お皿）が
//   丸ごと見えることを優先する。
//   地は赤いギンガムチェックのテーブルクロス。白いケーキが一番明るく浮く。
//
// 動くもの（1周3秒・12コマ）: ケーキが回転台の上でゆっくり回り、
//   右側でナイフが下りて、6等分の切り目を1本ずつ入れていく（2026-10-20 ユーザー指示）。
//   ふちの果物と側面の粒が、奥から手前へ、左から右へ流れる。
//   果物は「苺・ブルーベリー」の2個で1組なので、1周でちょうど1組ぶん回すと
//   最初のコマと同じ絵に戻り、継ぎ目なく回り続けて見える。
//
// 2026-10-20 に作り直した。前の版はケーキの上面だけを寄りで描いていて、
// 何の形か分からなかった（ユーザー指摘）。

const CLOTH_A = "#f2b8c4";
const CLOTH_B = "#fbe4e9";
const CLOTH_C = "#e795a8"; // 2色が重なる目
const PLATE = "#fbf8f2";
const PLATE_D = "#d6cec0";
const CREAM = "#fffaf2";
const CREAM_D = "#ece2d2";
const SIDE = "#fbf5ec";
const SIDE_M = "#f1e8da";
const SIDE_D = "#ddd0bc";
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
const CUT = "#a8937a";
const CUT_SIDE = "#d6c8b2";
const BLADE = "#d9dde4";
const BLADE_L = "#ffffff";
const BLADE_D = "#8d939e";
const KNIFE_HANDLE = "#5a3420";
const KNIFE_HANDLE_D = "#3a1f12";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// 苺（5x6）。へたが上。
const STRAWBERRY = [".lLl.", "RHRRR", "RsRsR", "RRRsR", ".RsR.", "..D.."];
function strawberry(g: PixelGfx, x: number, y: number) {
  g.blit(x, y, STRAWBERRY, { l: LEAF, L: LEAF_D, R: BERRY, H: BERRY_L, s: SEED, D: BERRY_D });
}
// ブルーベリー2粒（5x3）
function blueberries(g: PixelGfx, x: number, y: number) {
  g.blit(x, y, ["DBD..", "BhBBD", "DBhBD"], { B: BLUE, h: BLUE_L, D: BLUE_D });
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

// ケーキ
const CX = 34;
const TOP_Y = 26; // 上面の楕円の中心
const RX = 25;
const RY = 5;
const H = 7; // 側面の高さ

// チョコのプレート（ケーキの奥に立てる）
const PX = 5;
const PY = 1;
const PW = 58;
const PH = 16;

/** 回転台の上の果物。角度は手前が +90° */
type Item = { a: number; kind: "berry" | "blue" };

export const art: LabelArt = {
  slug: "nakayoshi",
  swatch: [CREAM, PINK, BERRY, BLUE, CHOCO],
  draw: (g, t) => {
    const TAU = Math.PI * 2;

    // ── テーブルクロス（ギンガムチェック） ───────────────
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 68; x++) {
        const a = Math.floor(x / 4) % 2 === 0;
        const b = Math.floor(y / 4) % 2 === 0;
        g.px(x, y, a && b ? CLOTH_C : a || b ? CLOTH_A : CLOTH_B);
      }
    }

    // ── チョコのプレート ─────────────────────────────────
    g.rect(PX + 1, PY + 1, PW, PH, CHOCO_D); // 影
    g.rect(PX, PY, PW, PH, CHOCO);
    g.hline(PX + 1, PY, PW - 2, CHOCO_L);
    g.vline(PX, PY + 1, PH - 2, CHOCO_L);
    g.hline(PX + 1, PY + PH - 1, PW - 2, CHOCO_D);
    const tx = PX + Math.round((PW - misakiWidth(T_A)) / 2);
    misakiRow(g, tx, PY + 1, T_A, WHITE_CHOCO, CHOCO_D);
    misakiRow(g, tx, PY + 8, T_B, WHITE_CHOCO, CHOCO_D);

    // ── お皿 ─────────────────────────────────────────────
    g.ellipse(CX, TOP_Y + H + 3, RX + 4, RY + 2, PLATE_D);
    g.ellipse(CX, TOP_Y + H + 2, RX + 4, RY + 2, PLATE);

    // ── 側面 ─────────────────────────────────────────────
    // 左右の端を影にして、円柱に見せる。
    g.ellipse(CX, TOP_Y + H, RX, RY, SIDE);
    g.rect(CX - RX, TOP_Y, RX * 2 + 1, H, SIDE);
    // 側面は手前の弧に沿って塗る。左右の端ほど暗く、まんなかに1本ピンクの帯。
    for (let x = CX - RX; x <= CX + RX; x++) {
      const d = Math.abs(x - CX) / RX;
      const fy = TOP_Y + Math.round(RY * Math.sqrt(Math.max(0, 1 - d * d)));
      const c = d > 0.85 ? SIDE_D : d > 0.6 ? SIDE_M : SIDE;
      g.vline(x, TOP_Y, fy - TOP_Y + H + 1, c);
      g.px(x, fy + 3, d > 0.85 ? PINK_D : PINK);
      g.px(x, fy + H, SIDE_D); // 底の影
    }

    // ── 側面の下の絞り。回る ─────────────────────────────
    const M = 22;
    for (let j = 0; j < M; j++) {
      const a = ((j + t) / M) * TAU;
      const s = Math.sin(a);
      if (s < 0.05) continue;
      const x = CX + Math.round(Math.cos(a) * RX);
      const y = TOP_Y + H + Math.round(s * RY) - 1;
      g.px(x, y, CREAM);
      g.px(x, y + 1, SIDE_D);
    }

    // ── 上面 ─────────────────────────────────────────────
    g.ellipse(CX, TOP_Y, RX, RY, PINK);
    // ピンクの絞りの影（手前のふち）
    for (let x = CX - RX + 1; x < CX + RX; x++) {
      const d = (x - CX) / RX;
      const fy = TOP_Y + Math.round(RY * Math.sqrt(Math.max(0, 1 - d * d)));
      g.px(x, fy, PINK_D);
    }
    g.ellipse(CX, TOP_Y, RX - 4, RY - 2, CREAM_D);
    g.ellipse(CX, TOP_Y - 1, RX - 4, RY - 2, CREAM);

    // ── 切り目。6等分 ─────────────────────────────────────
    // 果物と同じ速さで回る（1周で60°）ので、6本の切り目も1周で元の絵に戻る。
    // 右（0°）でナイフが下りる。0°の手前60°に来ている1本だけは、まだ切っていない。
    // 9コマ目にナイフが上面に届き、その1本が0°に来て切り目になる。
    const cutAt = (j: number) => ((j * 60 + t * 60 + 15) * Math.PI) / 180;
    for (let j = 0; j < 6; j++) {
      const a = cutAt(j);
      const deg = (((((a * 180) / Math.PI + 180) % 360) + 360) % 360) - 180;
      if (deg >= -60 && deg < 0) continue; // これから切る1本
      const ex = CX + Math.round(Math.cos(a) * (RX - 1));
      const ey = TOP_Y + Math.round(Math.sin(a) * (RY - 1));
      g.line(CX, TOP_Y, ex, ey, CUT);
      if (Math.sin(a) > 0.15) g.vline(ex, ey + 1, H, CUT_SIDE); // 手前は側面にも切り口
    }

    // ── ふちの果物。回る ─────────────────────────────────
    // 苺とブルーベリーが交互に12個。1周で2個ぶん（＝1組）進む。
    const N = 12;
    const items: Item[] = [];
    for (let i = 0; i < N; i++) {
      items.push({ a: ((i + t * 2) / N) * TAU, kind: i % 2 === 0 ? "berry" : "blue" });
    }
    const put = (it: Item) => {
      const x = CX + Math.round(Math.cos(it.a) * (RX - 3));
      const y = TOP_Y + Math.round(Math.sin(it.a) * (RY - 1));
      if (it.kind === "berry") strawberry(g, x - 2, y - 5);
      else blueberries(g, x - 2, y - 2);
    };
    // まんなかのチョコペンの絵。奥の果物より手前、手前の果物より奥。
    const back = items.filter((it) => Math.sin(it.a) < 0);
    const front = items.filter((it) => Math.sin(it.a) >= 0).sort((p, q) => Math.sin(p.a) - Math.sin(q.a));
    back.forEach(put);
    g.blit(CX - 8, TOP_Y - 4, BEAR, { "#": CHOCO });

    // 手前の果物
    front.forEach(put);

    // ── ナイフ ───────────────────────────────────────────
    // 右側で、切り目の線に沿って刃を寝かせたまま上下する。9コマ目で上面に届く。
    const KNIFE_Y = [-7, -7, -7, -7, -7, -6, -4, -2, -1, 0, 0, -3];
    const ky = TOP_Y + KNIFE_Y[Math.round(t * 12) % 12];
    const kx0 = CX + 3;
    const kx1 = CX + RX - 2;
    g.rect(kx0 + 1, ky - 3, kx1 - kx0, 3, BLADE);
    g.hline(kx0 + 1, ky - 3, kx1 - kx0, BLADE_L); // 背の光
    g.hline(kx0, ky - 1, kx1 - kx0 + 1, BLADE_D); // 刃先
    g.px(kx0, ky - 2, BLADE_D); // 切っ先
    g.rect(kx1 + 1, ky - 3, 2, 3, BLADE_D); // つば
    g.rect(kx1 + 3, ky - 3, 10, 3, KNIFE_HANDLE);
    g.hline(kx1 + 3, ky - 1, 10, KNIFE_HANDLE_D);
    g.px(kx1 + 6, ky - 2, BLADE_L); // 鋲
    g.px(kx1 + 9, ky - 2, BLADE_L);

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。苺の赤に合わせる。
    g.frame(0, 0, 68, 40, BERRY);
    mark(g, BERRY, CREAM);
  },
};
