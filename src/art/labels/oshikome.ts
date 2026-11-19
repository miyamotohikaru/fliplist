import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// 押し込め！満員電車 — 満員電車に会社員を押し込む。ひたすら連打。
// 指が止まったら遅延です。
//
// 図の骨組み: 実物のプレイ画面どおり、ホームから電車のドアを正面に見る。
//   クリーム色の車体に緑の帯、窓にもぎゅうぎゅうの頭。
//   開いたドアには紺の背広の会社員がすし詰め（顔は ><）。
//   手前で青い帽子・白い手袋の押し屋さんが、うしろ姿でその背中を押している。
//   題字は実物の題字どおり「押し込め！」が黄色、「満員電車」が白。紫紺でふちどる。
//
// 動くもの（1周3秒・12コマ）: 0〜7コマ目は連打。押し屋さんが1コマおきに
//   ぐっと押しこみ、そのたびにドアの中の人がつぶれて汗が飛ぶ。
//   8コマ目でドアが閉まりはじめ、9〜10コマ目で閉まりきる
//   （ドアの窓に顔がむぎゅっと押しつけられる）。11コマ目でまた開きかける。

const BODY = "#ece0c6";
const BODY_D = "#d6c8aa";
const BODY_L = "#f6eedc";
const STRIPE = "#2f8a4c";
const STRIPE_L = "#4fb06a";
const WIN = "#34405a";
const WIN_L = "#4c5a78";
const FRAME = "#9aa0a8";
const FRAME_D = "#6e747c";
const INSIDE = "#222634";
const HAIR = "#1c1a1e";
const SKIN = "#f2c49c";
const SKIN_D = "#d49a70";
const SUIT = "#25304f";
const SUIT_L = "#36456e";
const SHIRT = "#ffffff";
const TIE = "#d8302c";
const CAP = "#2456c8";
const CAP_L = "#4a7ae6";
const CAP_D = "#173a8a";
const UNIFORM = "#1f2a4a";
const UNIFORM_L = "#2f3e68";
const GLOVE = "#ffffff";
const GLOVE_D = "#cfd6e0";
const PLAT = "#b9b4ac";
const PLAT_D = "#9e9890";
const TACTILE = "#f2c21b";
const TITLE_Y = "#ffd93a";
const EDGE = "#2a1a4a";
const SWEAT = "#9fd8ff";
const WHITE = "#ffffff";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

function title(g: PixelGfx, x: number, y: number, text: string, c: string) {
  for (const [dx, dy] of [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ])
    misakiRow(g, x + dx, y + dy, text, EDGE);
  misakiRow(g, x, y, text, c);
}

// ドアの開口部
const DX0 = 39;
const DX1 = 64; // 右はし（含まない）
const DY0 = 3;
const DY1 = 34;
const DCX = (DX0 + DX1) / 2;

// 会社員の顔（5x5）。squish で目が ><
function salaryman(g: PixelGfx, x: number, y: number, squish: boolean) {
  // 背広と胸もと
  g.rect(x - 1, y + 5, 7, 6, SUIT);
  g.vline(x - 1, y + 5, 6, SUIT_L);
  g.rect(x + 1, y + 5, 3, 3, SHIRT);
  g.vline(x + 2, y + 5, 4, TIE);
  // 頭
  g.rect(x, y, 5, 5, SKIN);
  g.rect(x, y, 5, 2, HAIR);
  g.px(x, y + 2, HAIR);
  g.px(x + 4, y + 2, SKIN_D);
  if (squish) {
    g.px(x + 1, y + 2, HAIR);
    g.px(x + 3, y + 2, HAIR);
    g.px(x + 2, y + 3, HAIR);
    g.hline(x + 1, y + 4, 3, "#8a3a2a");
  } else {
    g.px(x + 1, y + 3, HAIR);
    g.px(x + 3, y + 3, HAIR);
  }
}

// 窓の中のぎゅうぎゅうの頭（小さく）
function windowCrowd(g: PixelGfx, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h, WIN);
  g.hline(x, y, w, WIN_L);
  for (let i = 0; i * 4 < w; i++) {
    const hx = x + 1 + i * 4;
    const hy = y + 3 + (i % 2);
    g.rect(hx, hy, 3, 3, i % 3 === 1 ? SKIN_D : SKIN);
    g.hline(hx, hy, 3, HAIR);
    g.rect(hx - 1, hy + 3, 5, h - (hy - y) - 3, SUIT);
  }
  g.frame(x, y, w, h, FRAME_D);
}

// 押し屋さん（うしろ姿）。push で両手をぐっと前へ
function pusher(g: PixelGfx, push: boolean, rest: boolean) {
  const cx = 51;
  const lift = push ? 1 : 0;
  const top = 21 - lift + (rest ? 2 : 0);
  // 胴
  g.poly(
    [
      [cx - 7, 40],
      [cx - 7, top + 8],
      [cx - 5, top + 6],
      [cx + 5, top + 6],
      [cx + 7, top + 8],
      [cx + 7, 40],
    ],
    UNIFORM,
  );
  g.vline(cx - 7, top + 8, 40 - top - 8, UNIFORM_L);
  g.vline(cx, top + 8, 40 - top - 8, "#151d36");
  if (!rest) {
    // 腕を上げてドアの中を押す
    const gy = top - 1;
    g.rect(cx - 9, gy + 2, 3, top + 9 - gy - 2, UNIFORM);
    g.rect(cx + 6, gy + 2, 3, top + 9 - gy - 2, UNIFORM);
    g.vline(cx - 9, gy + 2, top + 7 - gy, UNIFORM_L);
    g.rect(cx - 10, gy, 4, 3, GLOVE);
    g.rect(cx + 6, gy, 4, 3, GLOVE);
    g.hline(cx - 10, gy + 2, 4, GLOVE_D);
    g.hline(cx + 6, gy + 2, 4, GLOVE_D);
  } else {
    g.rect(cx - 9, top + 8, 2, 8, UNIFORM);
    g.rect(cx + 7, top + 8, 2, 8, UNIFORM);
    g.rect(cx - 9, top + 16, 2, 2, GLOVE);
    g.rect(cx + 7, top + 16, 2, 2, GLOVE);
  }
  // 頭（うしろ姿）と帽子
  g.rect(cx - 3, top + 1, 7, 5, HAIR);
  g.px(cx - 4, top + 3, SKIN_D);
  g.px(cx + 4, top + 3, SKIN_D);
  g.rect(cx - 2, top + 5, 5, 1, SKIN_D);
  g.rect(cx - 4, top - 2, 9, 3, CAP);
  g.hline(cx - 3, top - 2, 7, CAP_L);
  g.hline(cx - 5, top + 1, 11, CAP_D);
}

// 閉まるドアの板（左右から）。p=0..1
function doors(g: PixelGfx, p: number, face: boolean) {
  const half = (DX1 - DX0) / 2;
  const w = Math.round(half * p);
  if (w <= 0) return;
  for (const side of [0, 1]) {
    const x = side === 0 ? DX0 : DX1 - w;
    g.rect(x, DY0, w, DY1 - DY0, BODY);
    g.vline(side === 0 ? x + w - 1 : x, DY0, DY1 - DY0, FRAME_D);
    // ドアの窓
    const wx = side === 0 ? x + Math.max(1, w - 9) : x + 2;
    const ww = Math.min(7, w - 3);
    if (ww >= 3) {
      g.rect(wx, DY0 + 4, ww, 11, WIN);
      g.frame(wx, DY0 + 4, ww, 11, FRAME_D);
    }
  }
  // 閉まりきったら、ドアの窓に顔がむぎゅっと
  if (face) {
    const fx = DX0 + half - 7;
    g.rect(fx, DY0 + 7, 5, 5, SKIN);
    g.rect(fx, DY0 + 7, 5, 1, HAIR);
    g.px(fx + 1, DY0 + 9, HAIR);
    g.px(fx + 3, DY0 + 9, HAIR);
    g.hline(fx + 1, DY0 + 11, 3, SKIN_D);
    g.rect(DX0 + half + 3, DY0 + 8, 3, 4, SKIN); // 押しつけた手
    g.vline(DX0 + half + 3, DY0 + 8, 4, SKIN_D);
  }
  g.vline(Math.round(DCX) - 1, DY0, DY1 - DY0, p >= 1 ? FRAME_D : null);
}

export const art: LabelArt = {
  slug: "oshikome",
  swatch: [BODY, STRIPE, SUIT, CAP, TITLE_Y],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    const pushing = f <= 7;
    const push = pushing && f % 2 === 0;
    const doorP = f === 8 ? 0.5 : f === 9 || f === 10 ? 1 : f === 11 ? 0.5 : 0;

    // ── 車体 ─────────────────────────────────────────────
    g.rect(0, 0, 68, 34, BODY);
    g.hline(0, 0, 68, BODY_D);
    g.hline(0, 1, 68, BODY_L);
    g.rect(0, 26, 68, 3, STRIPE);
    g.hline(0, 26, 68, STRIPE_L);
    windowCrowd(g, 2, 4, 16, 14);
    windowCrowd(g, 20, 4, 16, 14);

    // ── ドアの中 ─────────────────────────────────────────
    g.rect(DX0, DY0, DX1 - DX0, DY1 - DY0, INSIDE);
    const squeeze = push ? 1 : 0;
    // 奥から手前へ3段。押したぶん詰まる
    const rows: Array<[number, number[]]> = [
      [DY0 + 1, [41, 47, 53, 59]],
      [DY0 + 6 - squeeze, [39, 44, 50, 56, 61]],
      [DY0 + 11 - squeeze * 2, [41, 47, 54, 60]],
    ];
    rows.forEach(([y, xs], r) =>
      xs.forEach((x, i) =>
        salaryman(
          g,
          x + (r === 2 && push ? (i < 2 ? 1 : -1) : 0),
          y,
          (r + i + f) % 3 !== 0 || push,
        ),
      ),
    );
    // はみ出した腕と鞄（押しこみきれていない）
    if (pushing && !push) {
      g.rect(DX0 - 2, DY0 + 14, 3, 2, SUIT);
      g.rect(DX0 - 3, DY0 + 14, 1, 2, SKIN);
      g.rect(DX1 - 1, DY0 + 12, 3, 4, "#5a3a22");
    }

    doors(g, doorP, f === 9 || f === 10);

    // ドアの枠
    g.vline(DX0 - 1, DY0 - 1, DY1 - DY0 + 1, FRAME);
    g.vline(DX1, DY0 - 1, DY1 - DY0 + 1, FRAME);
    g.hline(DX0 - 1, DY0 - 1, DX1 - DX0 + 2, FRAME);
    g.vline(DX0 - 2, DY0 - 1, DY1 - DY0 + 1, FRAME_D);

    // ── ホーム ───────────────────────────────────────────
    g.rect(0, 34, 68, 6, PLAT);
    g.hline(0, 34, 68, PLAT_D);
    for (let x = 0; x < 68; x++) g.px(x, 36, x % 2 === 0 ? TACTILE : "#d8a810");

    // ── 押し屋さん ───────────────────────────────────────
    pusher(g, push, !pushing && f !== 11);

    // 汗と、押した瞬間の線
    if (push) {
      g.px(42, 16, SWEAT);
      g.px(41, 17, SWEAT);
      g.px(61, 15, SWEAT);
      g.px(62, 16, SWEAT);
      g.line(36, 20, 38, 19, WHITE);
      g.line(66, 19, 64, 18, WHITE);
    }

    // ── 題字 ─────────────────────────────────────────────
    title(g, 3, 20, "押し込め！", TITLE_Y);
    title(g, 3, 29, "満員電車", WHITE);

    // ── ふち ─────────────────────────────────────────────
    g.frame(0, 0, 68, 40, EDGE);
    mark(g, WHITE, EDGE);
  },
};
