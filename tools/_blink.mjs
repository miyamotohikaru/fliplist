import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
console.log(await p.evaluate(() => [...document.querySelectorAll(".blink")].map((e) => ({
  字: e.textContent.trim().slice(0, 18),
  cycle: getComputedStyle(e).animationDuration,
}))));
await b.close();
