import type { LabelArt } from "./types";
import type { PixelGfx } from "../gfx";
import { misakiRow } from "../misaki";

// なんでもロールアイスシミュレーター — 冷たい鉄板にベースを流して、
// へらで巻いて、好きなように盛りつける。
//
// 図の骨組み: 地は冷たい鉄板（ヘアライン）。
//   できあがったカップ10杯を、奥と手前の2列の互い違いに、画面いっぱいに並べる
//   （2026-11-13 ユーザー指示「いろんなロールアイスが完成していく様子。10種類ぐらい並ぶ」
//   「完成された角度にしたい。上からの図ではなくて」「字に被ってもいいのでもっと画面一杯に」）。
//   カップは料理写真の「斜め45度」から見下ろす（同日「斜め45度から見てるように」）。
//   口は楕円の白いふち、中に立てたロール5本の頭の渦が並び、下に側面のしまがのぞく。
//   味もカップも実物の選択肢から10通り（いちご・チョコ・マンゴー・バタフライピー…）。
//   飾りは実物のトッピングから1杯に2〜4つ（クリーム・マカロン・ミニドーナツ・くまのグミ・
//   ぺろぺろキャンディ・わたあめ・ハートのチョコ・ソース・粒…）（同日「いろんな飾り付けが欲しい」）。
//   飾りが隠れないよう、カップは上半分に並べ、題字3行は下半分のカップの胴に重ねる。
//   読めるように白い字を墨で縁どる。
//
// 動くもの（1周3秒・12コマ）: 0〜1コマ目は10個ぜんぶ完成した姿（止まっているときの絵）。
//   2コマ目でカップが空になり、そこから左から順に1コマ1個ずつ、
//   ロールが詰まって具がのり、きらっと光って完成していく。

const STEEL = "#c4cad1";
const STEEL_L = "#d3d8de";
const STEEL_D = "#9ea6b0";
const FROST = "#eef2f6";
const INK = "#26313f";
const CUP_IN = "#8a8378"; // 空のカップの口の奥
const SHADOW = "#9aa2ad";
const SPARK = "#ffffff";
const SPARK_Y = "#fff3a0";

// ── 発行元の印 ──────────────────────────────────────────
// 16枚すべて同じ意匠・同じ位置・同じ大きさ。右下の隅に 5x5 のくまの顔。
const MARK = ["#...#", ".###.", "#####", "#o#o#", ".#o#."];
function mark(g: PixelGfx, body: string, eye: string) {
  g.blit(61, 33, MARK, { "#": body, o: eye });
}

// ── 飾り ─────────────────────────────────────────────────
// 実物のトッピングの選択肢から。1杯に2〜4つ重ねる。
// 位置はカップの左上の角から（dx, dy）。ロールの頭は 2〜7 段目、ふちは 11 段目。
type Part = {
  rows: string[];
  pal: Record<string, string>;
  dx: number;
  dy: number;
};
const part =
  (rows: string[], pal: Record<string, string>) =>
  (dx: number, dy: number): Part => ({
    rows,
    pal,
    dx,
    dy,
  });
const RED = "#d42c48";
const CHOC = "#4a2616";
const CREAM_C = { c: "#fffdf6", C: "#e8dcc8" };
const strawberry = part([".gg.", "RRRR", "RwRR", "RRwR", ".RR."], {
  R: RED,
  w: "#ff9aa8",
  g: "#4a9a3a",
});
const cream = part(["..c...", ".cCc..", "cccCcc", "cCcccC"], CREAM_C);
const marsh = part(["wwW", "wwW"], { w: "#ffffff", W: "#f4d0dc" });
const marshPink = part(["pPP", "pPP"], { p: "#ffd0e0", P: "#f4a8c0" });
const pocky = part(["....c", "...c.", "..c..", ".b...", "b...."], {
  c: CHOC,
  b: "#e8b878",
});
const kiwi = part([".kk.", "kwdk", "kdwk", ".kk."], {
  k: "#7ab830",
  w: "#e8f4a0",
  d: "#2a2a1a",
});
const orange = part([".oo.", "oyyo", "oyyo", ".oo."], {
  o: "#ff8a1a",
  y: "#ffd27a",
});
const leaf = part(["..g", ".gG", "gG."], { g: "#58b84a", G: "#2e7a2a" });
const cotton = part([".pp.bb.", "ppppbbb", "pPpbbBb", ".pPbBb."], {
  p: "#ffc4dc",
  P: "#f49ac0",
  b: "#bfe4ff",
  B: "#90c8f4",
});
const star = part(["..y..", ".yyy.", "yyyyy", ".y.y."], { y: "#ffe04a" });
const macaron = part([".ppp.", "ppppp", "ccccc", ".PPP."], {
  p: "#ffa8c4",
  P: "#e880a4",
  c: "#fffdf6",
});
const cherry = part(["..s", ".s.", "RR.", "RR."], {
  R: "#c81830",
  s: "#5a3a1a",
});
const lolly = part(
  [".rrr.", "rwrwr", "rrwrr", ".rrr.", "..s..", "..s..", "..s.."],
  { r: "#ff5a8a", w: "#ffffff", s: "#f4f0e8" },
);
const donut = part([".ppp.", "pyp.p", "p.pyp", ".bbb."], {
  p: "#ff8ab8",
  y: "#ffe04a",
  b: "#d89a52",
});
const bearR = part(["r.r", "rrr", "rRr", ".r."], {
  r: "#ff5a3a",
  R: "#c83a20",
});
const bearG = part(["g.g", "ggg", "gGg", ".g."], {
  g: "#7ad83a",
  G: "#4a9a2a",
});
const heart = part(["dd.dd", "ddddd", ".ddd.", "..d.."], { d: "#7a1a2a" });
const rasp = part([".r.", "rRr", ".r."], { r: "#e83a6a", R: "#a81a4a" });
const oreo = part([".kkk.", "kkkkk", "wwwww", "kkkkk", ".kkk."], {
  k: "#2a2420",
  w: "#f4f0e8",
});
const flag = part(["wwww", "wrrw", "wwww", "s...", "s...", "s..."], {
  w: "#ffffff",
  r: RED,
  s: "#c89a62",
});

/** 1杯ぶん。ロールの色（照り・地・芯と影）、カップの側面の色2つ（交互に塗ってしまにする）、
 *  かけるソース、散らす粒、のせる飾り（あとのものほど手前） */
type Cup = {
  L: string;
  b: string;
  d: string;
  rim: string;
  rim2: string;
  sauce?: string;
  bits?: string[];
  parts: Part[];
};
const CUPS: Cup[] = [
  // いちご × ピンクのカップ: クリーム、いちご、チョコのソース
  {
    L: "#ffd6e0",
    b: "#f4a6b8",
    d: "#c45a78",
    rim: "#ff8fb0",
    rim2: "#ff8fb0",
    sauce: CHOC,
    parts: [cream(1, -1), strawberry(6, -3)],
  },
  // チョコ × しまのカップ: マシュマロ2つ、チョコのスティック
  {
    L: "#b07a52",
    b: "#8a5232",
    d: "#4a2616",
    rim: "#ffffff",
    rim2: "#e8404a",
    parts: [pocky(6, -4), marsh(2, 1), marshPink(5, 2)],
  },
  // マンゴー × レモン色のカップ: キウイ、オレンジの輪切り、ミントの葉
  {
    L: "#ffe08a",
    b: "#ffc23a",
    d: "#c8801a",
    rim: "#fff06a",
    rim2: "#fff06a",
    parts: [orange(1, -1), kiwi(6, 0), leaf(5, -2)],
  },
  // バタフライピー × 白いカップ: わたあめ、キラキラの星、アラザン
  {
    L: "#9ab0ff",
    b: "#5a7ae0",
    d: "#2a3a9a",
    rim: "#ffffff",
    rim2: "#ffffff",
    bits: ["#ffffff", "#e8ecf2"],
    parts: [cotton(2, -2), star(7, -4)],
  },
  // ピスタチオ × クラフトのカップ: マカロン、チェリー、くだいたナッツ
  {
    L: "#d0e8a0",
    b: "#a8c86a",
    d: "#5a7a2a",
    rim: "#c89a62",
    rim2: "#c89a62",
    bits: ["#c89a62", "#7a5a2a"],
    parts: [cherry(1, -2), macaron(5, -1)],
  },
  // タロイモ × ミントのカップ: ぺろぺろキャンディ、クリーム、カラフルな粒
  {
    L: "#dccaf4",
    b: "#b89ae0",
    d: "#6a4aa0",
    rim: "#7ee0c4",
    rim2: "#7ee0c4",
    bits: ["#ff5a8a", "#ffe04a", "#5ac8f0"],
    parts: [lolly(1, -6), cream(5, 0)],
  },
  // ミント × 白いカップ: チョコチップ、ミニドーナツ、ミントの葉
  {
    L: "#d0fff0",
    b: "#9ae8cc",
    d: "#3a9a7a",
    rim: "#ffffff",
    rim2: "#ffffff",
    bits: [CHOC, CHOC],
    parts: [donut(4, -2), leaf(1, 0)],
  },
  // バニラ × しまのカップ: くまのグミ2つ、キャラメルのソース、カラフルシリアル
  {
    L: "#ffffff",
    b: "#f8eedc",
    d: "#b89a6a",
    rim: "#ffffff",
    rim2: "#4a7ae0",
    sauce: "#c8801a",
    bits: ["#ff5a8a", "#5ac8f0", "#7ad83a"],
    parts: [bearR(2, -1), bearG(7, 0)],
  },
  // レッドベルベット × ピンクのカップ: クリーム、ハートのチョコ、ラズベリー、白いソース
  {
    L: "#e86a78",
    b: "#c8384a",
    d: "#7a1a2a",
    rim: "#ff8fb0",
    rim2: "#ff8fb0",
    sauce: "#ffffff",
    parts: [cream(3, -1), heart(5, -4), rasp(1, 1)],
  },
  // ココアクッキー × クラフトのカップ: 立てたクッキー、クリーム、メッセージの札
  {
    L: "#ffffff",
    b: "#ece8e0",
    d: "#4a4038",
    rim: "#c89a62",
    rim2: "#c89a62",
    bits: ["#2a2420"],
    parts: [flag(8, -6), cream(1, 0), oreo(3, -3)],
  },
];

/** 立てたロール1本の頭（4x3）。斜め45度から見るので、まるい渦が縦につぶれて楕円に */
const ROLL_TOP = [".LL.", "Ldbb", ".bb."];

// 左から順に完成する。偶数は奥の列（6px上）、奇数は手前の列。飾りが見えるよう上半分に並べ、
// 題字は下半分のカップの胴に重ねる。
// 画面いっぱいに並べるので、右端の1杯はふちで切れる。
const SLOTS: [number, number][] = Array.from({ length: 10 }, (_, i) => [
  2 + Math.round(i * 6.5),
  i % 2 === 0 ? 5 : 11,
]);

/** 斜め上45度から見下ろしたカップ1杯（12x19。飾りはその上へはみ出す）。x, y は左上の角。
 *  口は横12・縦7の楕円。中に立てたロール5本（奥2・手前3）の頭の渦が見え、下に側面がのぞく */
// 飾りの位置（dy）はロールを高く立てていた版で決めたので、低くなった分だけ下げて置く
const DECO_DROP = 3;
const RIM_CX = 5.5; // 口の楕円の中心（カップの左上から）
const RIM_CY = 9;
const RIM_RX = 6;
const RIM_RY = 4;
function inEllipse(i: number, j: number, rx: number, ry: number) {
  const u = (i + 0.5 - (RIM_CX + 0.5)) / rx;
  const v = (j + 0.5 - (RIM_CY + 0.5)) / ry;
  return u * u + v * v <= 1;
}
function drawCup(g: PixelGfx, x: number, y: number, c: Cup, full: boolean) {
  // 鉄板に落ちる影
  g.ellipse(x + 6.5, y + 17.5, 5, 1.5, SHADOW);
  // 側面。口の楕円から、すぼまった底の楕円へ。2px幅の縦じま
  for (let j = RIM_CY; j <= 18; j++)
    for (let i = 0; i < 12; i++) {
      const t = (j - RIM_CY) / 7; // 0=口 1=底
      const half = 6 - 1.6 * t;
      if (Math.abs(i + 0.5 - 6) > half) continue;
      // 底のふち（楕円の前半分）より下は描かない
      const bu = (i + 0.5 - 6) / 4.4;
      if (j > 15 + 1.8 * Math.sqrt(Math.max(0, 1 - bu * bu))) continue;
      g.px(x + i, y + j, (i >> 1) % 2 === 0 ? c.rim : c.rim2);
      if (i + 0.5 - 6 > half - 2) g.px(x + i, y + j, "#00000024"); // 右の陰
      if (i + 0.5 - 6 < -half + 1) g.px(x + i, y + j, "#ffffff40"); // 左の照り
    }
  // 口。白いふちの輪と、その内側
  const rimPx = (front: boolean) => {
    for (let j = 5; j <= 13; j++)
      for (let i = 0; i < 12; i++) {
        if (!inEllipse(i, j, RIM_RX, RIM_RY)) continue;
        if (inEllipse(i, j, RIM_RX - 1, RIM_RY - 1)) continue;
        if (j + 0.5 > RIM_CY + 0.5 !== front) continue;
        g.px(x + i, y + j, front ? "#ffffff" : "#e4e6ea");
      }
  };
  for (let j = 5; j <= 13; j++)
    for (let i = 0; i < 12; i++)
      if (inEllipse(i, j, RIM_RX - 1, RIM_RY - 1)) g.px(x + i, y + j, CUP_IN);
  rimPx(false);
  if (!full) {
    rimPx(true);
    return;
  }
  // ロール5本。奥の2本 → 手前の3本。口の左右に白いふちが見えるよう、手前は内側へ寄せる。頭（4x3の渦）の下に胴がのびて、口の中へ沈む
  const roll = (dx: number, ry: number, bottom: number) => {
    const rx = x + dx;
    const top = y + ry;
    const h = bottom - ry - 2;
    g.rect(rx, top + 2, 4, h, c.b);
    g.vline(rx, top + 2, h, c.L);
    g.vline(rx + 3, top + 2, h, c.d);
    g.hline(rx + 1, top + 2, 2, c.d); // 頭と胴のさかい
    g.blit(rx, top, ROLL_TOP, { L: c.L, b: c.b, d: c.d });
  };
  roll(2, 4, 8);
  roll(6, 4, 8);
  roll(1, 7, 12);
  roll(7, 7, 12);
  roll(4, 8, 13);
  rimPx(true);
  // 粒（ナッツ・チップ・シリアル・アラザン）。ロールの上に散らす
  if (c.bits)
    [
      [1, 6],
      [10, 5],
      [5, 7],
      [2, 9],
      [9, 8],
      [6, 4],
      [11, 9],
    ].forEach(([dx, dy], k) =>
      g.px(x + dx, y + dy, c.bits![k % c.bits!.length]),
    );
  // ソース。ロールの頭を横切るジグザグと、ふちへ垂れる筋
  if (c.sauce) {
    for (let i = 0; i < 12; i++)
      g.px(x + i, y + 6 + [0, 1, 2, 1][i % 4], c.sauce);
    g.vline(x + 2, y + 8, 3, c.sauce);
    g.vline(x + 9, y + 7, 2, c.sauce);
  }
  // 飾り。あとのものほど手前
  for (const p of c.parts) g.blit(x + p.dx, y + p.dy + DECO_DROP, p.rows, p.pal);
}

/** 題字。カップの上に重ねるので、白い字を墨で縁どる（ゲームのロゴのように） */
function title(g: PixelGfx, x: number, y: number, text: string) {
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
    misakiRow(g, x + dx, y + dy, text, INK);
  misakiRow(g, x, y, text, "#ffffff");
}

export const art: LabelArt = {
  slug: "rollice",
  swatch: [STEEL, "#f4a6b8", "#8a5232", "#ffc23a", "#5a7ae0"],
  draw: (g, t) => {
    const f = Math.round(t * 12) % 12;
    // いま何個できているか。0〜1コマ目は全部、2コマ目から1個ずつ
    const doneCount = f < 2 ? SLOTS.length : f - 1;

    // ── 鉄板（ヘアライン） ────────────────────────────────
    g.rect(0, 0, 68, 40, STEEL);
    for (let y = 1; y < 40; y += 2) g.hline(0, y, 68, STEEL_L, "half");
    for (let y = 3; y < 40; y += 6)
      g.hline(4 + (y % 5), y, 20, STEEL_D, "quarter");

    // ── カップ10個。奥の列から ────────────────────────────
    for (const back of [true, false])
      SLOTS.forEach(([x, y], i) => {
        if ((i % 2 === 0) !== back) return;
        drawCup(g, x, y, CUPS[i], i < doneCount);
      });

    // いま完成した1個が光る
    if (f >= 2) {
      const [x, y] = SLOTS[f - 2];
      const cx = x + 6;
      const cy = y + 6;
      for (const [dx, dy, c] of [
        [-8, 0, SPARK],
        [8, 0, SPARK],
        [0, -9, SPARK_Y],
        [-7, -6, SPARK_Y],
        [7, -6, SPARK],
        [7, 5, SPARK_Y],
        [-7, 5, SPARK],
      ] as [number, number, string][]) {
        g.px(cx + dx, cy + dy, c);
        g.px(cx + dx + 1, cy + dy, c);
        g.px(cx + dx, cy + dy + 1, c);
      }
    }

    // ── 題字。カップの上に重ねる ─────────────────────────
    title(g, 3, 16, "なんでも");
    title(g, 3, 24, "ロールアイス");
    title(g, 4, 32, "シミュレーター");

    // ── ふち ─────────────────────────────────────────────
    // 16枚共通の作法。外周1pxの単色だけ。題字の縁の墨に合わせる。印は題字と同じ白。
    g.frame(0, 0, 68, 40, INK);
    mark(g, "#ffffff", INK);
  },
};
