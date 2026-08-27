// 見出しの最後の字の右上・最初の字の左下に、塗りが届いているかを画素で数える（一時）
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: 3 });
await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 900));
const els = await p.$$(".sec .wa");
const names = await p.evaluate(() => [...document.querySelectorAll(".sec .wa")].map((e) => e.textContent.trim().slice(0, 6)));
for (let i = 0; i < els.length; i++) {
  await els[i].scrollIntoView();
  await new Promise((r) => setTimeout(r, 250));
  await els[i].screenshot({ path: `shots/wa-${i}.png` });
}
console.log(names.join(" / "));
await b.close();
