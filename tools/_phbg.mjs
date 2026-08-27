// 携帯で見た「背景をかえる」の見本10個（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 393, height: 900, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
const el = await p.$("#bg");
await el.scrollIntoView();
await new Promise((r) => setTimeout(r, 400));
await el.screenshot({ path: "shots/ph-bg.png" });
console.log(await p.evaluate(() => {
  const de = document.documentElement;
  return { 横スクロール: de.scrollWidth - de.clientWidth,
    見本の行: [...document.querySelectorAll(".bgpick-row")].map((r) => r.querySelectorAll(".bgpick-one").length) };
}));
await b.close();
