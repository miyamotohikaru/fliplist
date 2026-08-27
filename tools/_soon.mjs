// 工事中のカセットを実画素で切り出して、ラベルの名前が読めるか見る（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2 });
await p.goto(process.env.FLIP_URL ?? "http://localhost:3020/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1200));
const n = Number(process.env.N ?? 16);
for (let i = 1; i <= n; i++) {
  const el = await p.$(`#home .cont02 tbody tr:nth-child(${i + 1}) td.t-cart canvas`);
  if (!el) continue;
  await el.scrollIntoView();
  await new Promise((r) => setTimeout(r, 250));
  await el.screenshot({ path: `shots/sn-${String(i).padStart(2, "0")}.png` });
}
console.log("撮った");
await b.close();
