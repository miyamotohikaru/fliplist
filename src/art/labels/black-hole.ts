import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { NES } from "../palette";
import { rng } from "../gfx";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
// 丸い耳がふたつと点の目。地の色に応じて色だけ替える。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ブラウザのテキストが、渦を巻いて一点に吸い込まれていく。
//
// 図の骨組み:
//   左  = 食われかけているブラウザ窓（本文の行が右の枠を突き破って外へ流れ出す）
//   右  = 降着円盤つきのブラックホール（奥半分→事象の地平面→手前半分の順に重ねる）
//   間  = 行がほどけた粒の螺旋。粒は t に合わせて中心へ1つぶん進む。

const CX = 46; // 特異点の位置
const CY = 22;
const FLAT = 0.55; // 螺旋を見下ろす角度。1 だと真上から、0 に近いほど寝る
const TWIST = 0.115; // 1px 内側に落ちるあいだにねじれる角度

const SPACE = "#070511";
const HAZE1 = "#150c26";
const HAZE2 = "#1e1036";
const HAZE3 = "#2a1146";
const GLASS = "#dcd8e4";
const CHROME_BAR = "#585266";
const CHROME_EDGE = "#2a2438";
const INK = "#6f6a84";

/** 画面座標 → 螺旋の極座標 */
function polar(x: number, y: number): [number, number] {
  const dx = x - CX;
  const dy = (y - CY) / FLAT;
  return [Math.hypot(dx, dy), Math.atan2(dy, dx)];
}

export const art: LabelArt = {
  slug: "black-hole",
  swatch: [SPACE, HAZE3, NES.orange, NES.yellow, NES.cyanLt],

  draw: (g, t) => {
    // ── 宇宙 ──────────────────────────────────────────────
    g.rect(0, 0, 68, 40, SPACE);
    // 穴のまわりだけ紫のもやが濃い。段差を小さくして市松が目立たないようにする
    g.disc(CX, CY, 34, HAZE1, "eighth");
    g.disc(CX, CY, 26, HAZE1, "quarter");
    g.disc(CX, CY, 20, HAZE2, "quarter");
    g.disc(CX, CY, 14, HAZE2, "half");
    g.disc(CX, CY, 11, HAZE3, "half");

    const r = rng(20250811);
    for (let i = 0; i < 140; i++) {
      const x = Math.floor(r() * 68);
      const y = Math.floor(r() * 40);
      const k = r();
      if (Math.hypot(x - CX, (y - CY) / FLAT) < 20) continue;
      if (x > 1 && x < 21 && y > 6 && y < 32) continue; // 窓の中には星を置かない
      g.px(
        x,
        y,
        k < 0.09
          ? NES.cyanLt
          : k < 0.26
            ? NES.gray4
            : k < 0.58
              ? "#7d75a0"
              : "#4b4468",
      );
    }

    // ── 降着円盤 ──────────────────────────────────────────
    // 楕円の輪。奥半分(y<0)を先に、手前半分(y>=0)を事象の地平面のあとに描く。
    const RX = 19;
    const RY = 6.2;
    const IX = 8.6;
    const IY = 2.9;
    const RAMP = [
      "#fff6d2",
      NES.cream,
      NES.yellow,
      NES.gold,
      NES.orange,
      "#a83408",
      "#5e1a06",
    ];

    const disk = (front: boolean) => {
      for (let y = -7; y <= 7; y++) {
        if (front ? y < 0 : y >= 0) continue;
        for (let x = -RX; x <= RX; x++) {
          const vo = (x * x) / (RX * RX) + (y * y) / (RY * RY);
          if (vo > 1) continue;
          if ((x * x) / (IX * IX) + (y * y) / (IY * IY) <= 1) continue;
          const u = Math.sqrt(vo); // 0=内縁 1=外縁
          // 近づいてくる側（左）が明るく見える相対論的ビーミング
          const beam = x < 0 ? -1 : x > 6 ? 1 : 0;
          let idx = Math.min(6, Math.max(0, Math.round(u * 6.4) + beam));
          if (u > 0.9 && ((x + y) & 1) === 0) idx = 6; // 外縁はディザでほどく
          if (u > 0.97 && ((x + y) & 1) !== 0) continue;
          g.px(CX + x, CY + y, RAMP[idx]);
        }
      }
    };

    disk(false);

    // ── 事象の地平面 ──────────────────────────────────────
    g.disc(CX, CY, 8, "#000000");
    g.ring(CX, CY, 8, "#150a1e", 1);
    // 光子球。左が強い
    for (let a = 0; a < 360; a += 4) {
      const rad = (a * Math.PI) / 180;
      const x = Math.round(Math.cos(rad) * 8.6);
      const y = Math.round(Math.sin(rad) * 8.6);
      const hot = x < -1;
      g.px(CX + x, CY + y, hot ? "#fff8dc" : x > 3 ? "#c8781c" : NES.cream);
    }
    // 重力レンズで上に持ち上がった円盤の向こう側。両端で本体の円盤に合流する
    for (let x = -RX; x <= RX; x++) {
      const s = 1 - (x * x) / (RX * RX);
      if (s <= 0) continue;
      const y = -Math.round(Math.sqrt(s) * 12);
      if (y > -6) continue;
      const near = Math.abs(x) < 9;
      g.px(
        CX + x,
        CY + y,
        x < 0 ? (near ? NES.yellow : NES.gold) : near ? NES.gold : "#a8560e",
      );
      g.px(
        CX + x,
        CY + y + 1,
        x < 0 ? (near ? NES.gold : "#a8560e") : "#7c3c0a",
      );
    }

    disk(true);

    // ── ほどけた行の螺旋 ──────────────────────────────────
    const STREAKS: Array<[number, number]> = [
      [21, 13],
      [21, 17],
      [21, 21],
      [21, 25],
      [21, 29],
      [21, 33],
      [24, 9],
      // 窓のほかからも、ちぎれた文字が落ちてくる
      [30, 38],
      [64, 9],
    ];
    for (const [sx, sy] of STREAKS) {
      const [r0, a0] = polar(sx, sy);
      for (let k = 0; k < 40; k++) {
        const rr = r0 - k * 0.85;
        if (rr < 10.5) break;
        const a = a0 + (r0 - rr) * TWIST;
        // 明るさは中心からの実距離で決める。落ちるほど熱くなる
        const c =
          rr > 26
            ? "#4e4772"
            : rr > 20
              ? "#736c96"
              : rr > 15.5
                ? "#a8a0c8"
                : rr > 12.5
                  ? NES.cream
                  : NES.gold;
        g.px(
          Math.round(CX + Math.cos(a) * rr),
          Math.round(CY + Math.sin(a) * rr * FLAT),
          c,
        );
      }
    }

    // 引き伸ばされた活字。まだ字の形が残っているもの。
    // 題字のすぐ下には置かない。置くと題字の2行目に見えて、しかも円盤に食われる。
    for (const [lx, ly, ch, c] of [
      [22, 31, "T", "#e4dff2"],
      [29, 33, "E", "#b0a8cc"],
      [36, 31, "X", "#e4dff2"],
      [43, 33, "T", "#b0a8cc"],
    ] as Array<[number, number, string, string]>) {
      g.text3x5(lx + 1, ly + 1, ch, "#150c26");
      g.text3x5(lx, ly, ch, c);
    }

    // ── 動くもの: 粒が中心へ1つ進む ──────────────────────
    // 4コマで1周。j 番目の粒が1周ぶん進むと j+1 番目の位置に重なるので継ぎ目が出ない。
    const phase = Math.floor(t * 4) % 4;
    for (const [sx, sy] of [
      [21, 13],
      [21, 21],
      [21, 29],
    ] as Array<[number, number]>) {
      const [r0, a0] = polar(sx, sy);
      for (let j = 0; j < 6; j++) {
        const rr = r0 - j * 4 - phase;
        if (rr < 10.5) continue;
        const a = a0 + (r0 - rr) * TWIST;
        const x = Math.round(CX + Math.cos(a) * rr);
        const y = Math.round(CY + Math.sin(a) * rr * FLAT);
        g.px(x, y, rr > 18 ? NES.cyanLt : NES.white);
        g.px(x + 1, y, rr > 18 ? "#5aa8c8" : NES.cream);
      }
    }

    // ── 食われかけのブラウザ窓 ───────────────────────────
    g.rect(2, 8, 18, 29, GLASS);
    g.rect(2, 8, 18, 4, CHROME_BAR);
    g.hline(3, 8, 16, "#6f6980");
    g.rect(4, 9, 2, 2, NES.red);
    g.rect(7, 9, 2, 2, NES.gold);
    g.rect(10, 9, 2, 2, NES.greenLt);
    g.hline(14, 10, 5, "#3a3450");
    g.frame(2, 8, 18, 29, CHROME_EDGE);
    g.vline(3, 12, 24, "#f2f0f8"); // 紙の内側のハイライト
    g.hline(3, 35, 16, "#b6b0c8");

    // 本文。右の枠を突き破って外へ出ていく
    g.rect(4, 14, 11, 2, "#2a2438"); // 見出し
    g.px(15, 14, "#5a5470");
    for (const ly of [18, 21, 24, 27, 30, 33]) {
      const from = ly === 24 || ly === 27 ? 13 : 4; // 図版の右に回り込む行
      g.hline(from, ly, 20 - from, INK);
      g.px(19, ly, NES.gray4);
      g.px(20, ly, "#c4bdda");
    }
    g.hline(4, 18, 8, "#4a4560");
    g.hline(4, 21, 2, "#4a4560");
    g.hline(13, 27, 3, "#4a4560");
    g.hline(4, 33, 9, "#4a4560");
    // 本文にはさまった図版。空と山だけの小さな写真
    g.rect(4, 23, 8, 7, "#7b8fb0");
    g.rect(4, 23, 8, 3, "#a8c4e0");
    g.px(9, 24, "#f0e4a8"); // 太陽
    g.px(10, 24, "#f0e4a8");
    g.poly(
      [
        [4, 29],
        [7, 25],
        [11, 29],
      ],
      "#3f5a48",
    );
    g.hline(4, 29, 8, "#28382e");
    g.frame(4, 23, 8, 7, "#4a4560");
    // 窓そのものも右へ引かれている。中央の行ほど紙がはみ出す
    for (let y = 13; y <= 33; y++) {
      const pull = Math.round(3 * Math.exp(-(((y - 23) / 9) ** 2)));
      if (pull <= 0) continue;
      g.hline(20, y, pull, "#cdc7dc");
      g.px(20 + pull, y, CHROME_EDGE);
    }

    // ── 題字 ─────────────────────────────────────────────
    const TITLE = "BLACKHOLE";
    const HEAT = [
      NES.white,
      NES.white,
      NES.white,
      NES.white,
      NES.white,
      "#fff2c8",
      "#ffe38a",
      NES.yellow,
      NES.gold,
    ];
    for (let i = 0; i < TITLE.length; i++) {
      g.text3x5(2 + i * 4 + 1, 3, TITLE[i], "#1d0f33");
      g.text3x5(2 + i * 4, 2, TITLE[i], HEAT[i]);
    }

    // ── 隅の細字 ─────────────────────────────────────────
    // 読める字は題字だけにして、ほかは1pxの刻みで「文字があった」ことだけ残す
    for (let i = 0; i < 6; i++) g.hline(40 + i * 4, 3, 3, "#6a6288");
    for (let i = 0; i < 5; i++) g.hline(40 + i * 4, 5, 3, "#4e4770");

    // 遠い星の十字。空いたところに散らす
    for (const [sx, sy] of [
      [58, 30],
      [63, 12],
      [50, 36],
      [26, 5],
    ] as Array<[number, number]>) {
      g.px(sx, sy, NES.white);
      g.px(sx - 1, sy, "#6a6390");
      g.px(sx + 1, sy, "#6a6390");
      g.px(sx, sy - 1, "#6a6390");
      g.px(sx, sy + 1, "#6a6390");
    }

    // ── 外枠 ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。黒い外装に貼るので明るい紫にする。
    g.frame(0, 0, 68, 40, "#9a72e0");
    mark(g, "#cfc6ea", "#1d1033");
  },
};
