// 16本ぜんぶが本当に動いているか。1周(3秒)を6回に分けて見て、絵が何通りあるか数える（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.env.FLIP_URL ?? "http://localhost:3020/";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=1", "--hide-scrollbars"] });
const p = await b.newPage();
// 16本ぜんぶが同時に「画面の中」に入るように、背の高い窓で見る
await p.setViewport({ width: 1280, height: 4800 });
await p.goto(url, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 900));

const grab = () => p.evaluate(() =>
  [...document.querySelectorAll("td.t-cart canvas")].map((c) => {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let h = 2166136261;
    for (let i = 0; i < d.length; i += 4) h = ((h ^ d[i] ^ d[i+1] ^ d[i+2] ^ d[i+3]) * 16777619) >>> 0;
    return h;
  }));

const names = await p.evaluate(() => [...document.querySelectorAll("td.t-ttl")].map((t) => t.textContent.trim()));
const seen = [];
for (let k = 0; k < 7; k++) {
  const g = await grab();
  g.forEach((h, i) => ((seen[i] ??= new Set()).add(h)));
  await new Promise((r) => setTimeout(r, 520));
}
let still = 0;
seen.forEach((s, i) => {
  const ok = s.size > 1;
  if (!ok) still++;
  console.log(`${String(i + 1).padStart(2)} ${(names[i] ?? "?").padEnd(14, "　")} 絵の通り数=${s.size} ${ok ? "動いている" : "★止まっている"}`);
});
console.log(still ? `止まっているもの ${still}本` : "16本ぜんぶ動いている");
await b.close();
