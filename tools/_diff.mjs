// 「縁の層」と「字の層」を別々に撮って、縁があるのに字が塗られていない場所を探す（一時）
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.env.FLIP_URL ?? "http://localhost:3020/";
const tag = process.env.TAG ?? "now";
const DPR = 4;
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: DPR });
await p.goto(url, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 900));
await p.evaluate(() => document.querySelector("#list h3.sec .wa").scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 400));

// 地を真っ白にして、層ごとに撮る
const shot = async (name, css) => {
  await p.evaluate((c) => {
    let el = document.getElementById("probe");
    if (!el) { el = document.createElement("style"); el.id = "probe"; document.head.appendChild(el); }
    el.textContent = c;
  }, css);
  await new Promise((r) => setTimeout(r, 250));
  await p.screenshot({ path: `shots/ly-${tag}-${name}.png` });
};
const WHITE = "#home{background:#fff !important}";
await shot("both", WHITE);
await shot("face", WHITE + " .wa__ink{visibility:hidden !important}");
await shot("ink", WHITE + " .wa__face{visibility:hidden !important}");
const r = await p.evaluate(() => {
  const b = document.querySelector("#list h3.sec .wa").getBoundingClientRect();
  return { x: b.left, y: b.top, w: b.width, h: b.height };
});
fs.writeFileSync(`shots/ly-${tag}.json`, JSON.stringify({ ...r, dpr: DPR }));
console.log(tag, JSON.stringify(r));
await b.close();
