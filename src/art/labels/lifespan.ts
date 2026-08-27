import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { rng } from "../gfx";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 和文の題字 ──────────────────────────────────────────
// 書体から起こした字母は「インクの外接矩形」で返ってくるので、
// 「一」のように中ほどだけに墨のある字は行の上端に貼りついてしまう。
// 16px の枡の中に据え直すための落とし幅。
const JP_DROP: Record<string, number> = { ー: 7, 一: 7, ッ: 3, ェ: 5, の: 2, る: 2 };
function jp(g: PixelGfx, x: number, y: number, s: string, c: string, sp = 0) {
  let cx = x;
  for (const ch of s) {
    g.textJP(cx, y + (JP_DROP[ch] ?? 0), ch, c);
    cx += 16 + sp;
  }
}

// 「あと何秒、生きられる？」——36の問いに答えると、残り秒数が出る。
//
// 図の骨組み: 心電計から出てきた記録紙そのもの。
//   上  = 7セグの残り秒数（消えているセグメントも薄く残す）
//   中  = 残量のバーと36問の答えのマス
//   下  = 拍がだんだん小さくなる心電図。いま の位置に赤い縦線が立つ
// 動くもの: 秒数の1の位が1つ減る。

const BASE = "#f7ded0"; // 記録紙
const FINE = "#f0cdba"; // 1mm 方眼
const BOLD = "#e0a48c"; // 5mm 方眼
const INK = "#2e1c19";
const RED = "#c8452c";
const REDDK = "#8f2b1e";
// 計測器の表示窓
const PANEL = "#1a1418";
const PANEL_DK = "#0a080a";
const PANEL_LT = "#453a40";
const LIT = "#ffc820";
const GHOST = "#3b2c14"; // 消えているセグメント

// 4x9 の7セグ数字。a=上 b=右上 c=右下 d=下 e=左下 f=左上 g=中
const SEG: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abdeg",
  "3": "abcdg",
  "4": "bcfg",
  "5": "acdfg",
  "6": "acdefg",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
};

export const art: LabelArt = {
  slug: "lifespan",
  swatch: [BASE, RED, LIT, PANEL, INK],

  draw: (g, t) => {
    // ── 記録紙 ────────────────────────────────────────────
    g.rect(0, 0, 68, 40, BASE);
    for (let x = 0; x < 68; x += 2) g.vline(x, 0, 40, FINE);
    for (let y = 0; y < 40; y += 2) g.hline(0, y, 68, FINE);
    for (let x = 2; x < 68; x += 10) g.vline(x, 0, 40, BOLD);
    for (let y = 1; y < 40; y += 10) g.hline(0, y, 68, BOLD);

    // ── 表示窓 ────────────────────────────────────────────
    // 記録紙に落ちくぼんだ計器の窓。ここだけ暗くして数字を光らせる
    g.rect(3, 3, 62, 12, PANEL);
    g.rect(3, 3, 62, 12, "#221a1e", "hstripe"); // 走査線
    g.hline(3, 3, 62, PANEL_DK);
    g.vline(3, 3, 12, PANEL_DK);
    g.hline(4, 14, 61, PANEL_LT);
    g.vline(64, 4, 11, PANEL_LT);
    g.px(3, 3, "#000000");

    // ── 残り秒数 ──────────────────────────────────────────
    const digit = (x: number, y: number, ch: string) => {
      const s = SEG[ch] ?? "";
      const c = (k: string) => (s.includes(k) ? LIT : GHOST);
      g.hline(x, y, 4, c("a"));
      g.vline(x + 3, y, 5, c("b"));
      g.vline(x + 3, y + 4, 5, c("c"));
      g.hline(x, y + 8, 4, c("d"));
      g.vline(x, y + 4, 5, c("e"));
      g.vline(x, y, 5, c("f"));
      g.hline(x, y + 4, 4, c("g"));
      // 消灯セグメントの角は落として、点いている桁だけ角ばって見えるようにする
      g.px(x, y, s.includes("a") && s.includes("f") ? LIT : GHOST);
      g.px(x + 3, y, s.includes("a") && s.includes("b") ? LIT : GHOST);
    };

    // 4コマで1の位がひとつ減る
    const last = 5 - (Math.floor(t * 4) % 4);
    const num = `982143${60 + last}`; // 9桁。約31年ぶんの秒数
    let dx = 5;
    for (let i = 0; i < num.length; i++) {
      digit(dx, 5, num[i]);
      dx += 5;
      if (i === 2 || i === 5) {
        g.px(dx - 1, 13, LIT); // 3桁ごとの区切り
        dx += 1;
      }
    }
    g.text3x5(53, 6, "SEC", "#c89418");
    // 減っていく向きの三角
    g.hline(54, 12, 5, "#c85018");
    g.hline(55, 13, 3, "#c85018");

    // ── 題字 ──────────────────────────────────────────────
    // 記録紙に打ち出された見出し、という体裁。上下を赤の罫ではさむ。
    // 残量のバーはここに場所を譲った。数字と心電図が残っていれば主題は立つ。
    g.hline(3, 15, 62, "#d99f8a");
    g.hline(3, 15, 62, RED, "vstripe");
    jp(g, 2, 16, "寿命測定", INK);
    g.hline(3, 32, 62, "#d99f8a");
    g.hline(3, 32, 30, RED, "vstripe");

    // ── 心電図 ────────────────────────────────────────────
    // 拍は右へ行くほど小さく、間隔は広がる。弱って遅くなっていく。
    const baseY = 37;
    const trace: number[] = new Array(68).fill(baseY);
    const put = (i: number, v: number) => {
      if (i >= 0 && i < 68) trace[i] = v;
    };
    const beats: Array<[number, number]> = [
      [8, 4],
      [21, 4],
      [34, 3],
      [46, 2],
    ];
    for (const [bx, a] of beats) {
      put(bx - 4, baseY - 1);
      put(bx - 3, baseY - 2);
      put(bx - 2, baseY - 1);
      put(bx, baseY + 1);
      put(bx + 1, baseY - a);
      put(bx + 2, baseY - a);
      put(bx + 3, baseY + 1);
      put(bx + 6, baseY - 1);
      put(bx + 7, baseY - 2);
      put(bx + 8, baseY - 2);
      put(bx + 9, baseY - 1);
    }
    // 拍のあいだのゆらぎ。帯が6行しかないので、粒は間引いて拍を立たせる。
    const wob = rng(4649);
    for (let x = 3; x < 54; x++)
      if (trace[x] === baseY && trace[x - 1] === baseY && wob() < 0.06)
        trace[x] -= 1;

    // 発行元の印にかからないところまでで打ち切る
    const NOW = 40;
    g.vline(NOW, 33, 6, "#eab8a6");
    for (let x = 3; x < 54; x++) {
      const c = x <= NOW ? INK : "#c08a74"; // これから来るぶんは薄い
      const y0 = trace[x];
      const y1 = trace[x + 1] ?? y0;
      const from = Math.min(y0, y1);
      const to = Math.max(y0, y1);
      g.vline(x, from, to - from + 1, c);
    }
    // いま
    g.rect(NOW - 1, trace[NOW] - 1, 3, 3, RED);
    g.px(NOW, trace[NOW], "#fff0e4");
    // 残量。バーは題字に場所を譲った。心臓ひとつだけ、波形の先に残す。
    g.blit(55, 34, [".#.#.", "#####", ".###.", "..#.."], { "#": REDDK });

    // ── 外枠 ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。
    g.frame(0, 0, 68, 40, RED);
    mark(g, "#8f2b1e", "#f7ded0");
  },
};
