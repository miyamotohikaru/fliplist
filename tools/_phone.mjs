// 携帯で見たときに、カセットのラベルの字が実際に何ミリで出るかを測る（一時）
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.env.FLIP_URL ?? "http://localhost:3020/";
const DEVICES = [
  { name: "iPhone 15", w: 393, h: 852, dpr: 3 },
  { name: "iPhone SE", w: 375, h: 667, dpr: 2 },
  { name: "Pixel 7", w: 412, h: 915, dpr: 2.6 },
  { name: "iPad", w: 820, h: 1180, dpr: 2 },
];
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
for (const d of DEVICES) {
  const p = await b.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.setViewport({ width: d.w, height: d.h, deviceScaleFactor: d.dpr, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: "networkidle0" });
  await p.evaluate(() => document.querySelector("#list")?.scrollIntoView());
  await new Promise((r) => setTimeout(r, 800));
  const r = await p.evaluate(() => {
    const de = document.documentElement;
    const cv = document.querySelector("td.t-cart canvas");
    const bb = cv?.getBoundingClientRect();
    const over = [...document.querySelectorAll("#home *")].filter((e) => {
      const x = e.getBoundingClientRect();
      return x.width > 0 && x.right > de.clientWidth + 1 && !e.closest(".marquee");
    }).slice(0, 3).map((e) => e.tagName + "." + e.className);
    return {
      版面: de.clientWidth,
      横スクロール: de.scrollWidth - de.clientWidth,
      絵の見た目: bb ? `${Math.round(bb.width)}x${Math.round(bb.height)}` : "?",
      絵の実画素: cv ? `${cv.width}x${cv.height}` : "?",
      畳んだか: cv ? getComputedStyle(cv.closest("tr")).display : "?",
      はみ出し: over.length ? over : "なし",
    };
  });
  // ラベルの和文は 13ドット。絵は 88ドット幅なので、見た目の幅から1ドットの大きさを出す
  const dot = Number(r.絵の見た目.split("x")[0]) / 88;
  console.log(`${d.name.padEnd(10)} ${JSON.stringify(r).replace(/"/g, "")}`);
  console.log(`${"".padEnd(10)} 1ドット=${dot.toFixed(2)}CSSpx → ラベルの和文=${(dot * 13).toFixed(0)}px相当  ${dot * 13 >= 16 ? "読める" : "★小さい"}`);
  await p.screenshot({ path: `shots/ph-${d.name.replace(/ /g, "")}.png` });
  if (errs.length) console.log("  エラー:", errs);
  await p.close();
}
await b.close();
