import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow, misakiWidth } from "../misaki";

// ふわふわかき氷シミュレーター — 本物のかき氷機で削って、
// 脚つきのガラスの器に、ふわふわの山を盛る。
//
// 図の骨組み: 「氷」の旗そのもの。上は白い布に赤い字（題字2行）、
//   下は青い波。波の前に、ふちの赤い脚つきガラスの器を1つ置く
//   （実物の器どおり）。かき氷機の刃は布の向こう、絵の外にある体で、
//   布の下ふちから雪が降ってくる。
//
// 動くもの（1周3秒・12コマ）: 雪が降って、まず器の中が埋まり、
//   そこから白い山がぐんぐん高くなる。山が育ちきったら、
//   いちごのシロップが頂上からかかって、山肌を流れ落ちる。

const CLOTH = "#fbfaf4";
const CLOTH_D = "#e4e0d2";
const TITLE = "#d8283a";
const SEA = "#2f62c4";
const SEA_L = "#5a8ee0";
const CREST = "#8fb6ee";
const SEA_D = "#21479a";
const GLASS = "#ffffff66";
const GLASS_L = "#ffffffcc";
const GLASS_D = "#c9d8e899";
const RIM = "#e8606a";
const ICE = "#ffffff";
const ICE_M = "#eaf1f8";
const ICE_D = "#c8d6e6";
const SNOW = "#ffffff";
const SYRUP = "#e2283c";
const SYRUP_L = "#ff6a78";
const SYRUP_D = "#a8182a";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

const T_A = "ふわふわかき氷";
const T_B = "シミュレーター";

const CX = 33;
const CLOTH_H = 18; // 布は 0..17
const RIM_Y = 31; // 器のふち
// 器の中の半幅（ふちの行から下へ）
const BOWL = [10, 9, 7, 4];
// 山の高さ。コマごと（0..11）
const PEAK = [0, 0, 0, 3, 5, 7, 9, 10, 11, 12, 12, 12];
// 器の中に積もった行数。コマごと
const FILL = [0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
// シロップが頂上から何行ぶん流れたか
const SYRUP_ROWS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 10];

/** 山の行 k（0=いちばん下）の半幅 */
function mountainHalf(k: number, h: number): number {
  const u = (k + 0.5) / h;
  return Math.max(1, Math.round(10 * Math.pow(1 - u, 0.85)));
}

export const art: LabelArt = {
  slug: "kakigori",
  swatch: [CLOTH, TITLE, SEA, ICE_D, SYRUP],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;

    // ── 氷の旗: 白い布と赤い題字 ──────────────────────────
    g.rect(0, 0, 68, CLOTH_H, CLOTH);
    g.hline(0, CLOTH_H - 1, 68, CLOTH_D);
    const tx = Math.round((68 - misakiWidth(T_A)) / 2);
    misakiRow(g, tx, 2, T_A, TITLE);
    misakiRow(g, tx, 10, T_B, TITLE);

    // ── 青い波 ───────────────────────────────────────────
    g.rect(0, CLOTH_H, 68, 40 - CLOTH_H, SEA);
    for (let b = 0; b < 4; b++) {
      const y0 = CLOTH_H + 1 + b * 6;
      for (let x = 0; x < 68; x++) {
        const p = (x + b * 4) % 8;
        const y = y0 + Math.round(Math.abs(p - 3.5) / 1.5);
        if (y >= 40) continue;
        g.px(x, y, CREST);
        g.px(x, y + 1, SEA_L);
        if (p === 3) g.px(x, y, "#ffffff");
        if (p === 0) g.px(x, y + 2, SEA_D);
      }
    }

    // ── 器（脚つきのガラス） ──────────────────────────────
    // 脚と台
    g.rect(CX - 5, 37, 11, 2, GLASS);
    g.hline(CX - 5, 37, 11, GLASS_L);
    g.hline(CX - 4, 38, 9, GLASS_D);
    g.rect(CX - 1, RIM_Y + BOWL.length, 3, 37 - RIM_Y - BOWL.length, GLASS);
    g.vline(CX - 1, RIM_Y + BOWL.length, 37 - RIM_Y - BOWL.length, GLASS_L);
    // 器の中。積もった氷は下から
    BOWL.forEach((hw, i) => {
      const y = RIM_Y + i;
      g.hline(CX - hw, y, hw * 2 + 1, GLASS);
      const filled = BOWL.length - 1 - i < FILL[f] && i > 0;
      if (filled) {
        g.hline(CX - hw + 1, y, hw * 2 - 1, ICE_M);
        g.hline(CX + Math.max(0, hw - 3), y, Math.min(3, hw), ICE_D);
      }
      g.px(CX - hw, y, GLASS_L);
      g.px(CX + hw, y, GLASS_D);
    });
    g.px(CX - 6, RIM_Y + 1, GLASS_L); // 器の照り
    g.px(CX - 5, RIM_Y + 2, GLASS_L);

    // ── 雪の山 ───────────────────────────────────────────
    const h = PEAK[f];
    const base = RIM_Y - 1;
    for (let k = 0; k < h; k++) {
      const y = base - k;
      const hw = mountainHalf(k, h);
      g.hline(CX - hw, y, hw * 2 + 1, ICE);
      // 右の陰。ふちほど濃い
      g.hline(CX + Math.ceil(hw / 2), y, hw - Math.ceil(hw / 2) + 1, ICE_M);
      g.px(CX + hw, y, ICE_D);
      g.px(CX - hw, y, ICE_M);
      // ふわふわの縁。1行おきに左右へ1px毛羽立たせる
      if ((k + f) % 2 === 0) {
        g.px(CX - hw - 1, y, ICE_M);
        g.px(CX + hw + 1, y, ICE_D);
      }
    }
    if (h > 0) {
      // 削り目の点
      for (let k = 1; k < h - 1; k += 2) g.px(CX - 2 + ((k * 3) % 5), base - k, ICE_M);
    }

    // ── シロップ ─────────────────────────────────────────
    const sr = SYRUP_ROWS[f];
    if (sr > 0 && h > 0) {
      for (let k = h - 1; k >= Math.max(0, h - sr); k--) {
        const y = base - k;
        const hw = mountainHalf(k, h);
        const depth = h - 1 - k; // 頂上からの行数
        // 上の4行は山肌を覆い、そこから下は2本の筋になって垂れる
        if (depth < 4) {
          g.hline(CX - hw, y, hw * 2 + 1, SYRUP);
          g.px(CX - hw, y, SYRUP_L);
          g.px(CX + hw, y, SYRUP_D);
        } else {
          g.px(CX - Math.round(hw * 0.5), y, SYRUP);
          if (depth < 8) g.px(CX + Math.round(hw * 0.4), y, SYRUP_D);
          if (depth < 6) g.px(CX - hw + 1, y, SYRUP);
        }
      }
      g.px(CX - 1, base - h + 1, SYRUP_L); // 頂上の照り
    }

    // ふちの赤い線は山の手前
    g.hline(CX - 10, RIM_Y, 21, RIM);
    g.px(CX - 10, RIM_Y, GLASS_L);

    // ── 降ってくる雪 ─────────────────────────────────────
    // 布の下ふちから山の頂上（なければ器の底）まで。山が育ちきったら止む。
    if (f <= 9) {
      const top = CLOTH_H;
      const bottom = h > 0 ? base - h : RIM_Y + BOWL.length - FILL[f] - 1;
      const span = Math.max(1, bottom - top);
      // 横位置と出だしの高さは固定の表。i に比例させると斜めの線に並んで見える
      const XS = [-3, 1, -1, 3, -4, 0, 2, -2, 4];
      const YS = [0, 5, 2, 7, 4, 1, 8, 3, 6];
      for (let i = 0; i < 9; i++) {
        const x = CX + XS[i];
        const y = top + ((YS[i] + f * 3) % span);
        g.px(x, y, SNOW);
        if (i % 3 === 0) g.px(x, y + 1, ICE_M);
      }
    }

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。題字の赤に合わせる。
    g.frame(0, 0, 68, 40, TITLE);
    mark(g, TITLE, CLOTH);
  },
};
