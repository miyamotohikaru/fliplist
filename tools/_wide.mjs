// 窓の幅ごとに、横スクロールと版面のはみ出しを測る（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=1", "--hide-scrollbars"] });
const p = await b.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
for (const w of [1280, 1024, 768, 480, 390]) {
  await p.setViewport({ width: w, height: 900 });
  await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 350));
  const r = await p.evaluate(() => {
    const de = document.documentElement;
    const over = [...document.querySelectorAll("#home *")].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && (b.right > de.clientWidth + 1 || b.left < -1);
    }).slice(0, 5).map((e) => e.tagName + "." + (e.className || "") + "|親=" + (e.parentElement?.className || e.parentElement?.tagName));
    const cv = document.querySelector("td.t-cart canvas");
    return {
      横スクロール: de.scrollWidth - de.clientWidth,
      版面: de.clientWidth,
      はみ出し: over.length ? over : "なし",
      絵の見た目: cv ? `${Math.round(cv.getBoundingClientRect().width)}x${Math.round(cv.getBoundingClientRect().height)}` : "?",
      絵の実画素: cv ? `${cv.width}x${cv.height}` : "?",
    };
  });
  console.log(String(w).padStart(4), JSON.stringify(r, null, 0).replace(/"/g, ""));
}
console.log(errs.length ? errs : "ページ内のエラーなし");
await b.close();
