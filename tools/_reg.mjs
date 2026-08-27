// 縁の層と字の層がずれていないかを測る（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
await p.goto(process.env.FLIP_URL ?? "http://localhost:3020/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
console.log(await p.evaluate(() => [...document.querySelectorAll(".wa")].slice(0, 10).map((wa) => {
  const f = wa.querySelector(".wa__face").getBoundingClientRect();
  const i = wa.querySelector(".wa__ink").getBoundingClientRect();
  const w = wa.getBoundingClientRect();
  return {
    字: wa.textContent.trim().slice(0, 6),
    要素幅: +w.width.toFixed(1),
    字の層: `${f.left.toFixed(1)}〜${f.right.toFixed(1)}`,
    縁の層: `${i.left.toFixed(1)}〜${i.right.toFixed(1)}`,
    左のずれ: +(f.left - i.left).toFixed(2),
    右のずれ: +(f.right - i.right).toFixed(2),
  };
})));
await b.close();
