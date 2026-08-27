// ページの見出しを全部、拡大率も変えて、縁があるのに塗りが無い画素を数える（一時）
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.env.FLIP_URL ?? "http://localhost:3020/";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
for (const DPR of [1, 2, 3]) {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: DPR });
  await p.goto(url, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 900));
  const n = await p.evaluate(() => document.querySelectorAll(".wa").length);
  const names = await p.evaluate(() => [...document.querySelectorAll(".wa")].map((e) => e.textContent.trim().slice(0, 8)));
  for (let i = 0; i < n; i++) {
    await p.evaluate((k) => {
      document.documentElement.style.scrollBehavior = "auto";
      document.querySelectorAll(".wa")[k].scrollIntoView({ block: "center", behavior: "instant" });
    }, i);
    await new Promise((x) => setTimeout(x, 450));
    const r = await p.evaluate((k) => {
      const b = document.querySelectorAll(".wa")[k].getBoundingClientRect();
      return { x: b.left, y: b.top, w: b.width, h: b.height };
    }, i);
    const shot = async (name, css) => {
      await p.evaluate((c) => {
        let el = document.getElementById("probe");
        if (!el) { el = document.createElement("style"); el.id = "probe"; document.head.appendChild(el); }
        el.textContent = c;
      }, css);
      await new Promise((x) => setTimeout(x, 220));
      await p.screenshot({ path: `shots/dz-${name}.png` });
    };
    // 縁の層は白で描かれているので、そのままでは白い地と見分けが付かない。
    // 縁もにじみも消して、字の形だけを紫で出す＝これが「塗るべき形」
    const W = "#home{background:#fff !important}";
    const SIL = " .wa__ink{color:#ff00ff !important;text-shadow:none !important;filter:none !important;visibility:visible !important}";
    await shot("face", W + " .wa__ink{visibility:hidden !important}");
    await shot("ink", W + " .wa__face{visibility:hidden !important}" + SIL);
    fs.writeFileSync("shots/dz.json", JSON.stringify({ ...r, dpr: DPR, i, name: names[i] }));
    // Python に渡すためにここで一旦止める
    const { execSync } = await import("node:child_process");
    const outp = execSync("python3 tools/_dzcheck.py").toString().trim();
    console.log(`dpr${DPR}  ${String(names[i]).padEnd(9, "　")} ${outp}`);
  }
  await p.close();
}
await b.close();
