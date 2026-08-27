// 携帯の大きさで、ラベルの字がどう出るかを1本ずつ実画素で切り出す（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 393, height: 900, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.goto(process.env.FLIP_URL ?? "http://localhost:3020/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 900));
// 和文の題が長いものを選ぶ
for (const n of [4, 12, 14, 16]) {
  const el = await p.$(`#home .cont02 tbody tr:nth-child(${n + 1}) td.t-cart canvas`);
  if (!el) { console.log(n, "見つからない"); continue; }
  await el.scrollIntoView();
  await new Promise((r) => setTimeout(r, 400));
  await el.screenshot({ path: `shots/phl-${n}.png` });
  console.log(`shots/phl-${n}.png`);
}
await b.close();
