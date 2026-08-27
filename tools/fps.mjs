// カセット16本が常時動く状態で、実際に何コマ出ているかを測る。
// 「たぶん大丈夫」で済ませないための道具。
//   node tools/fps.mjs
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = process.env.FLIP_URL ?? "http://localhost:3020";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ["--headless=new", "--force-device-scale-factor=1"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.goto(base, { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 1500));

const r = await page.evaluate(
  () =>
    new Promise((resolve) => {
      let frames = 0;
      const t0 = performance.now();
      const tick = () => {
        frames++;
        if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
        else resolve({ fps: (frames / ((performance.now() - t0) / 1000)).toFixed(1) });
      };
      requestAnimationFrame(tick);
    }),
);
const canvases = await page.evaluate(() => document.querySelectorAll("canvas.pixel").length);
console.log(`canvas ${canvases}枚 / 画面内で ${r.fps} fps`);

// 画面外のカセットが描画を止めているかも見る（IntersectionObserver が効いているか）
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 500));
const cpu = await page.metrics();
console.log(`JSヒープ ${(cpu.JSHeapUsedSize / 1048576).toFixed(1)}MB / Nodes ${cpu.Nodes}`);
await browser.close();
