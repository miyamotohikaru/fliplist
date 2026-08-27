import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=1", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
console.log(await p.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null;
    const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right)]; };
  return { 表: r("#home .cont02 table"), 注記: r("#home .note"), ならび: r("#home .order"), 更新履歴: r("#home .rireki") };
}));
await b.close();
