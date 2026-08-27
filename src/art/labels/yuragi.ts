import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { rng } from "../gfx";

// ゆらぎの拡張機能 — 実物は Chrome 拡張「ゆらぎ1/f」。
// 開いているページの本文を1文字ずつ span に割って、1/f ノイズで呼吸させる。
// ろうそく／心拍／木漏れ日／川／オーロラ／こすくま の6ジャンルを重ねがけできる。
//
// 前の版は、本文を1pxの粒で敷き詰めていたせいで、本番の倍率だと
// ただの灰色のノイズにしか見えなかった。動かさないと主題が出ない絵は失格なので、
// 「何が揺れているのか」を止め絵で言い切る形に描き直してある。
//   ・題字そのものを1文字ずつ上下にずらす。ずれた字の裏に、
//     ずれていない薄い字を重ねて置く。この2つの差が「ゆらぎ」の正体になる。
//   ・そのすぐ下に、まっすぐな点線の罫を1本通す。曲がっていないものが隣にあると、
//     曲がっているものが曲がって見える。
//   ・本文は1pxの粒をやめて、2px厚の帯にした。6倍で行として読める太さ。
// 右のポップアップ（橙に光る球のダイヤル）はそのまま置く。

const BG = "#181410";
const PAGE = "#efe9da";
const PAGE2 = "#cec6b2";
const CHROME = "#5e6167";
const PANEL = "#1d1409";
const EDGE = "#55402c";
const EDGE_L = "#8a6440";

const TXT = "#403b31";
const TXT_D = "#8d8674";
const TXT_H = "#100e0a";
const HOT = "#e2650c";
const HOT_D = "#a8480a";

const ORB = "#ffb066";
const ORB_C = "#fff2e2";
const ORB_E = "#e9622b";
const TRACK = "#3d2a1b";
const TRACK_F = "#ff9a52";

const GENRE = ["#ff8a4c", "#e87b6b", "#cdb454", "#5fb6c4", "#b06ff0", "#e8ddc8"];

const CURSOR = ["K....", "KK...", "KWK..", "KWWK.", "KWWWK", "KWKKK", "KK.K."];

// ── 和文の題字 ──────────────────────────────────────────
// 書体から起こした字母は「インクの外接矩形」で返ってくるので、
// 「ー」のように中ほどだけに墨のある字は行の上端に貼りついてしまう。
// 16px の枡の中に据え直すための落とし幅。
const JP_DROP: Record<string, number> = { ー: 7, 一: 7, ッ: 3, ェ: 5, の: 2, る: 2 };
/** 1文字ずつ置く。この絵では字ごとに上下させたいので、1字ぶんの関数も要る。 */
function jp1(g: PixelGfx, x: number, y: number, ch: string, c: string) {
  g.textJP(x, y + (JP_DROP[ch] ?? 0), ch, c);
}

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

export const art: LabelArt = {
  slug: "yuragi",
  swatch: [PAGE, HOT, ORB, "#5fb6c4", PANEL],
  draw: (g, t) => {
    const TAU = Math.PI * 2;

    // 1/f。低い周波数ほど振幅が大きい正弦を3つ足す。
    // t の係数はすべて整数倍なので、t=0 と t=1 で必ず同じ形に戻る。
    const wave = (x: number, k: number) =>
      Math.sin(x * 0.09 + t * TAU + k) * 2.5 +
      Math.sin(x * 0.21 - t * TAU * 2 + k * 1.7) * 1.1 +
      Math.sin(x * 0.44 + t * TAU * 3 + k * 2.4) * 0.5;

    // ── 地 ────────────────────────────────────────────────
    g.rect(0, 0, 68, 40, BG);

    // ── 左：ゆれているページ ──────────────────────────────
    // 和文の題字は1字16px。3字で48px 要るので、ページの幅を 42→50 に広げ、
    // ポップアップはそのぶん細くした。題字が入らなければ「ファミコン」に見えない。
    g.rect(1, 1, 50, 38, PAGE);
    g.noise(1, 6, 50, 33, "#f6f1e4", 0.07, 3391);

    // 窓の上端。信号3つと、拡張機能のボタン。これだけで「ブラウザ」になる。
    g.rect(1, 1, 50, 5, CHROME);
    g.hline(1, 1, 50, "#7c8087");
    g.hline(1, 5, 50, "#3c4046");
    g.rect(3, 2, 2, 2, "#e0604a");
    g.rect(7, 2, 2, 2, "#e8b23a");
    g.rect(11, 2, 2, 2, "#63b45c");
    g.rect(16, 2, 26, 2, "#42464c"); // 見えているだけの URL 欄
    g.disc(47, 3, 2, "#2a1c10");
    g.disc(47, 3, 1, ORB);

    // ── 題字。1文字ずつ、ゆらぎのぶんだけ上下する ────────
    // 揺れていない位置に薄い字を残す。この差が、止め絵での主題になる。
    const TITLE = "ゆらぎ";
    const TY = 9;
    for (let i = 0; i < TITLE.length; i++) {
      jp1(g, 2 + i * 16, TY, TITLE[i], PAGE2); // 揺れる前の位置
    }
    for (let i = 0; i < TITLE.length; i++) {
      const cx0 = 2 + i * 16;
      const dy = Math.round(wave(cx0 * 0.64, 0) * 1.05);
      jp1(g, cx0 + 1, TY + 1 + dy, TITLE[i], "#d8cfb8"); // 落ち影
      jp1(g, cx0, TY + dy, TITLE[i], TXT_H);
    }

    // ── まっすぐな罫。曲がっていないものが隣にあると、差が見える ──
    for (let x = 3; x < 49; x += 2) g.px(x, 29, PAGE2);
    g.px(3, 28, HOT);
    g.px(3, 30, HOT);
    g.px(48, 28, HOT);
    g.px(48, 30, HOT);

    // ── 本文。1pxの粒ではなく2px厚の帯にして、行として読ませる ──
    for (let r = 0; r < 2; r++) {
      const y0 = 33 + r * 4;
      const rr = rng(9137 + r * 71);
      let x = 4;
      while (x < 48) {
        const wlen = 3 + Math.floor(rr() * 6);
        if (x + wlen > 48) break;
        // 1行だけ、ろうそく色が乗っている（ジャンルがかかっている行）
        const hot = r === 0 && x > 15 && x < 32;
        for (let k = 0; k < wlen; k++) {
          const px = x + k;
          const dy = Math.round(wave(px, r * 1.9 + 1.2) * 0.5);
          g.px(px, y0 + dy, hot ? HOT : TXT);
          g.px(px, y0 + dy + 1, hot ? HOT_D : TXT_D);
        }
        x += wlen + 2;
      }
    }

    // マウスの矢印。この周りの字がいちばんよく動く、という実物の挙動の名残り。
    g.blit(38, 25, CURSOR, { K: "#141109", W: "#fbf7ec" });
    g.px(44, 23, PAGE2);
    g.px(36, 32, PAGE2);

    // ── 右：ポップアップの板 ──────────────────────────────
    const PX0 = 52;
    const PW = 15;
    g.rect(PX0, 1, PW, 38, PANEL);
    g.frame(PX0, 1, PW, 38, EDGE);
    g.hline(PX0 + 1, 2, PW - 2, EDGE_L);
    g.hline(PX0 + 1, 3, PW - 2, "#2f2115");

    // 見出し。拡張機能の名前をそのまま出す。
    g.text3x5(PX0 + 2, 5, "1/F", ORB);
    g.px(PX0 + 12, 5, "#8a6a48");
    g.px(PX0 + 12, 7, "#8a6a48");
    g.px(PX0 + 11, 6, "#8a6a48");
    g.hline(PX0 + 2, 10, 11, "#4a3626");

    // 球のダイヤル。ゆっくり呼吸する。
    const cx = 59;
    const cy = 19;
    const breath = Math.sin(t * TAU) * 0.5 + 0.5;
    g.ring(cx, cy, 6, TRACK, 1);
    // 目盛りの弧。上から時計回りに7割ほど。
    for (let a = -145; a <= 145; a += 12) {
      const rad = (a * Math.PI) / 180;
      const on = a < 95;
      g.px(
        cx + Math.round(Math.sin(rad) * 6),
        cy - Math.round(Math.cos(rad) * 6),
        on ? TRACK_F : "#4a3524",
      );
    }
    // 球の光。まわりに薄い暈をつけて、板から浮かせる。
    g.disc(cx, cy, 4, "#2e1a0c");
    g.disc(cx, cy, 3 + (breath > 0.55 ? 1 : 0), ORB_E);
    g.disc(cx, cy, 2, ORB);
    g.px(cx - 1, cy - 1, ORB_C);
    g.px(cx - 1, cy - 2, "#ffffff");
    // つまみ
    g.rect(cx + 3, cy - 5, 2, 2, "#ffe0b8");
    g.px(cx + 4, cy - 6, "#ffffff");

    // 6つのジャンル。上の3つが点いている。
    for (let i = 0; i < 6; i++) {
      const gx = PX0 + 2 + i * 2;
      const on = i < 3;
      g.px(gx, 31, "#0e0904");
      g.rect(gx, 28, 1, 3, on ? GENRE[i] : "#4a3524");
      if (on) g.px(gx, 28, "#fff2e2");
    }

    // 静寂 ←→ 自然 の目盛り。発行元の印にかからない長さで止める。
    g.hline(PX0 + 2, 35, 7, TRACK);
    g.hline(PX0 + 2, 35, 4, TRACK_F);
    g.rect(PX0 + 4, 34, 2, 3, "#ffe0b8");
    g.px(PX0 + 2, 33, "#6e5a44");
    g.px(PX0 + 8, 33, "#6e5a44");

    // ── ふち ──────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。灰色の外装に貼るので橙にする。
    g.frame(0, 0, 68, 40, HOT);
    mark(g, ORB, PANEL);
  },
};
