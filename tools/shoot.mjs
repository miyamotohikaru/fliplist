// 見た目を目で確かめるためのスクリーンショット。
//
//   node tools/shoot.mjs <出力名> [パス] [オプション]
//     --w 1440 --h 2400        ビューポート
//     --dpr 2                  デバイスピクセル比
//     --full                   ページ全体
//     --clip x,y,w,h           範囲を切り出す
//     --sel "#id"              その要素だけ
//     --hover "#id"            撮る前にホバー
//     --wait 1200              追加の待ち時間(ms)
//     --zoom 4                 撮ったあと最近傍で整数倍に拡大（ドットの検分用）
//
// 拡張機能経由のタブは背景扱いになって rAF が止まるので、必ずこれで撮る。
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.resolve("shots");
fs.mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2);
const name = argv[0] ?? "page";
const route = argv[1]?.startsWith("--") ? "/" : (argv[1] ?? "/");
const flag = (k, d = null) => {
  const i = argv.indexOf(`--${k}`);
  if (i < 0) return d;
  const v = argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};

const W = Number(flag("w", 1440));
const H = Number(flag("h", 1400));
const DPR = Number(flag("dpr", 2));
const full = !!flag("full");
const wait = Number(flag("wait", 900));
const clip = flag("clip");
const sel = flag("sel");
const hover = flag("hover");
const zoom = Number(flag("zoom", 0));
const base = process.env.FLIP_URL ?? "http://localhost:3020";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: [
    "--headless=new",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--font-render-hinting=none",
  ],
  defaultViewport: { width: W, height: H, deviceScaleFactor: DPR },
});

const page = await browser.newPage();
const problems = [];
page.on("console", (m) => {
  if (/error/i.test(m.type())) problems.push(`[console] ${m.text().slice(0, 300)}`);
});
page.on("pageerror", (e) => problems.push(`[pageerror] ${String(e).slice(0, 300)}`));

await page.goto(base + route, { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await sleep(wait);

if (hover) {
  const el = await page.$(hover);
  if (el) {
    await el.hover();
    await sleep(700);
  } else {
    problems.push(`[hover] ${hover} が見つからない`);
  }
}

const file = path.join(OUT, `${name}.png`);
const opts = { path: file };
if (sel) {
  const el = await page.$(sel);
  if (!el) throw new Error(`${sel} が見つからない`);
  await el.screenshot({ path: file });
} else {
  if (full) opts.fullPage = true;
  if (clip && typeof clip === "string") {
    const [x, y, w, h] = clip.split(",").map(Number);
    opts.clip = { x, y, width: w, height: h };
  }
  await page.screenshot(opts);
}

await browser.close();

if (zoom > 1) {
  // ドットの検分用に、余計な補間なしで拡大したものも残す
  const { execFileSync } = await import("node:child_process");
  const big = path.join(OUT, `${name}@${zoom}x.png`);
  try {
    execFileSync("python3", [
      "-c",
      `from PIL import Image;im=Image.open(${JSON.stringify(file)});im=im.resize((im.width*${zoom},im.height*${zoom}),Image.NEAREST);im.save(${JSON.stringify(big)})`,
    ]);
    console.log(big);
  } catch {
    /* PIL がなければ等倍だけ残す */
  }
}

console.log(file);
if (problems.length) {
  console.log("--- ページ内のエラー ---");
  for (const p of problems) console.log(p);
}
