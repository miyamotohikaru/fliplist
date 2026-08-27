import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto(process.env.FLIP_URL ?? "http://localhost:3020/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
console.log(JSON.stringify(await p.evaluate(() => ({
  見出し: [...document.querySelectorAll(".wa")].map((e) => {
    const b = e.getBoundingClientRect();
    return `${e.textContent.trim().slice(0,6)} ${b.left.toFixed(1)},${(b.top + window.scrollY).toFixed(1)} ${b.width.toFixed(1)}x${b.height.toFixed(1)}`;
  }),
  頁の高さ: document.documentElement.scrollHeight,
}))));
await b.close();
