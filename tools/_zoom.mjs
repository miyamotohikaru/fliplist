// 「更新履歴」の右端を、層ごとに大きく撮る（一時）
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.env.FLIP_URL ?? "http://localhost:3020/";
const tag = process.env.TAG ?? "live";
const DPR = 4;
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: DPR });
await p.goto(url, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 900));
await p.evaluate(() => {
  document.documentElement.style.scrollBehavior = "auto";
  document.querySelector("#rireki h3.sec .wa").scrollIntoView({ block: "center", behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 500));
const shot = async (name, css) => {
  await p.evaluate((c) => {
    let el = document.getElementById("probe");
    if (!el) { el = document.createElement("style"); el.id = "probe"; document.head.appendChild(el); }
    el.textContent = c;
  }, css);
  await new Promise((x) => setTimeout(x, 250));
  await p.screenshot({ path: `shots/zm-${tag}-${name}.png` });
};
const W = "#home{background:#fff !important}";
await shot("both", W);
await shot("face", W + " .wa__ink{visibility:hidden !important}");
const r = await p.evaluate(() => {
  const e = document.querySelector("#rireki h3.sec .wa");
  const b = e.getBoundingClientRect();
  const cs = getComputedStyle(e.querySelector(".wa__face"));
  return { x: b.left, y: b.top, w: b.width, h: b.height, ow: e.offsetWidth, oh: e.offsetHeight,
           bg: cs.backgroundSize, pos: cs.backgroundPosition, clip: cs.webkitBackgroundClip || cs.backgroundClip,
           tr: getComputedStyle(e).transform };
});
fs.writeFileSync(`shots/zm-${tag}.json`, JSON.stringify({ ...r, dpr: DPR }));
console.log(JSON.stringify(r, null, 1));
await b.close();
