// カセットの外装を、描かれた実画素から測る。
// 批評で指摘された「黒い外装は陰影が読めない」「金型が2種類ある」「リブの間隔が不揃い」を、
// 目算や切り出し画像ではなく canvas の中身そのもので確かめるためのもの。
//
//   node tools/measure.mjs
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = process.env.FLIP_URL ?? "http://localhost:3020";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ["--headless=new", "--force-device-scale-factor=1"],
  defaultViewport: { width: 1400, height: 3000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto(`${base}/labels?cart=1&scale=1`, { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 1200));

const rows = await page.evaluate(() => {
  const LABEL = { x: 10, y: 9, w: 68, h: 40 };
  const out = [];
  document.querySelectorAll("canvas.pixel").forEach((c) => {
    const wrap = c.closest("[id^='label-']");
    const slug = wrap ? wrap.id.replace("label-", "") : "?";
    const ctx = c.getContext("2d");
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const W = c.width;
    const H = c.height;
    const at = (x, y) => {
      const i = (y * W + x) * 4;
      return [d[i], d[i + 1], d[i + 2], d[i + 3]];
    };
    const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];

    // 樹脂の面だけを見る（ラベルの中と、影の薄い部分は除く）
    const lums = [];
    const solidRow = [];
    for (let y = 0; y < H; y++) {
      let first = -1;
      let last = -1;
      for (let x = 0; x < W; x++) {
        const p = at(x, y);
        if (p[3] < 250) continue; // 影は半透明なので落ちる
        if (first < 0) first = x;
        last = x;
        const inLabel =
          x >= LABEL.x && x < LABEL.x + LABEL.w && y >= LABEL.y && y < LABEL.y + LABEL.h;
        if (!inLabel) lums.push(lum(p));
      }
      solidRow.push([first, last]);
    }
    lums.sort((a, b) => a - b);
    // 端の1%は刻印や輪郭の1pxなので落として、面の階調だけを見る
    const lo = lums[Math.floor(lums.length * 0.02)];
    const hi = lums[Math.floor(lums.length * 0.98)];

    // 左右対称か: 各行の左端・右端が、盤面の中心線から等距離か
    let asym = 0;
    let asymRows = 0;
    for (let y = 0; y < H; y++) {
      const [a, b] = solidRow[y];
      if (a < 0) continue;
      const dl = a;
      const dr = W - 1 - b;
      // 影のぶん右下に余白があるので、その4pxを引いて比べる
      const diff = Math.abs(dl - (dr - 4));
      if (diff > 0) {
        asym += diff;
        asymRows++;
      }
    }

    // 本体の外接（不透明な画素の範囲）
    let minx = 1e9;
    let maxx = -1;
    let miny = 1e9;
    let maxy = -1;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (at(x, y)[3] < 250) continue;
        if (x < minx) minx = x;
        if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        if (y > maxy) maxy = y;
      }

    out.push({
      slug,
      span: Math.round(hi - lo),
      lo: Math.round(lo),
      hi: Math.round(hi),
      box: `${maxx - minx + 1}x${maxy - miny + 1}@${minx},${miny}`,
      asymRows,
      asym,
    });
  });
  return out;
});

await browser.close();

rows.sort((a, b) => a.span - b.span);
console.log("slug            階調幅  暗  明   本体の外接        左右差(行数/合計)");
for (const r of rows) {
  const warn = r.span < 55 ? "  ← 面が読めない" : r.span < 70 ? "  ← 弱い" : "";
  console.log(
    `${r.slug.padEnd(15)} ${String(r.span).padStart(4)} ${String(r.lo).padStart(4)}${String(r.hi).padStart(4)}   ${r.box.padEnd(16)} ${String(r.asymRows).padStart(3)}/${String(r.asym).padStart(4)}${warn}`,
  );
}
