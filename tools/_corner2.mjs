// 見出しのまわりを余白ごと撮る。要素そのものを撮ると、はみ出したぶんが写らない。
// 画面をまるごと撮って、getBoundingClientRect（画面座標）を JSON で出す。切り出しは Python 側で。
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.env.FLIP_URL ?? "http://localhost:3020/";
const tag = process.env.TAG ?? "now";
const DPR = 3;
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: DPR });
await p.goto(url, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 900));
await p.evaluate(() => document.querySelector("#list h3.sec .wa").scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 400));
const r = await p.evaluate(() => {
  const b = document.querySelector("#list h3.sec .wa").getBoundingClientRect();
  return { x: b.left, y: b.top, w: b.width, h: b.height };
});
await p.screenshot({ path: `shots/full-${tag}.png` });
fs.writeFileSync(`shots/full-${tag}.json`, JSON.stringify({ ...r, dpr: DPR }));
console.log(tag, JSON.stringify(r));
await b.close();
