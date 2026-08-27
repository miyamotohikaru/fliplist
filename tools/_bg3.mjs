// 4色それぞれの見え方を1枚に並べて撮る（一時）
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=1", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 1150 });
for (const [k, v] of [["cream", null], ["mint", "mint"], ["sky", "sky"], ["peach", "peach"]]) {
  await p.evaluateOnNewDocument((val) => { try { val ? localStorage.setItem("fl-bg", val) : localStorage.removeItem("fl-bg"); } catch (e) {} }, v);
  await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
  await p.evaluate(() => window.scrollTo(0, 260));
  await new Promise((r) => setTimeout(r, 250));
  await p.screenshot({ path: `shots/bg-${k}.png` });
}
await b.close();
console.log("撮った");
