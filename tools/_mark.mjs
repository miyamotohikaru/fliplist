// 「更新履歴」で、塗られていない画素に印を付けて出す（一時）
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DPR = 4;
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: DPR });
await p.goto(process.env.FLIP_URL ?? "http://localhost:3020/", { waitUntil: "networkidle0" });
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
  await p.screenshot({ path: `shots/mk-${name}.png` });
};
const W = "#home{background:#fff !important}";
const SIL = " .wa__ink{color:#ff00ff !important;text-shadow:none !important;filter:none !important}";
await shot("both", W);
await shot("face", W + " .wa__ink{visibility:hidden !important}");
await shot("sil", W + " .wa__face{visibility:hidden !important}" + SIL);
const r = await p.evaluate(() => {
  const b = document.querySelector("#rireki h3.sec .wa").getBoundingClientRect();
  return { x: b.left, y: b.top, w: b.width, h: b.height };
});
fs.writeFileSync("shots/mk.json", JSON.stringify({ ...r, dpr: DPR }));
console.log("ok");
await b.close();
