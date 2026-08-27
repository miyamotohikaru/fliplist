// 壁紙10色それぞれの、ページ名と節の見出しの色を撮って並べる（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const IDS = ["cream","wakaba","mint","mizu","sky","sumire","sakura","peach","anzu","hai"];
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=1", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1000, height: 760 });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
for (const id of IDS) {
  await p.evaluateOnNewDocument((v) => { try { v === "cream" ? localStorage.removeItem("fl-bg") : localStorage.setItem("fl-bg", v); } catch (e) {} }, id);
  await p.goto(process.env.FLIP_URL ?? "http://localhost:3020/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 350));
  // 題と節の見出しが両方入るところを撮る
  await p.screenshot({ path: `shots/ttl-${id}.png`, clip: { x: 0, y: 60, width: 1000, height: 700 } });
  const s = await p.evaluate(() => {
    const g = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e) : null; };
    const t = g(".pagettl .wa .wa__face");
    const s2 = g(".sec .wa .wa__face");
    return { 題: t?.color, 節: (s2?.backgroundImage ?? "").slice(0, 76), 壁紙: getComputedStyle(document.body).backgroundImage.match(/[^/]+\.gif/)?.[0] };
  });
  console.log(id.padEnd(7), JSON.stringify(s).replace(/"/g, ""));
}
console.log(errs.length ? errs : "ページ内のエラーなし");
await b.close();
