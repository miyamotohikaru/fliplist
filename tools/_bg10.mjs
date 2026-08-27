// 10色ぜんぶ切り替わるか、★が付いてくるか、押しても行がずれないかを見る（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const NAMES = ["クリーム","わかば","ミント","みずいろ","ふじ色","すみれ","さくら","もも色","あんず","はいいろ"];
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=1", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(process.env.FLIP_URL ?? "http://localhost:3020/", { waitUntil: "networkidle0" });

const st = () => p.evaluate(() => {
  const links = [...document.querySelectorAll(".bgpick-one")];
  const vis = links.filter((a) => {
    const s = a.querySelector(".bgpick-star");
    if (!s) return false;
    const c = getComputedStyle(s);
    return c.visibility !== "hidden" && c.display !== "none" && Number(c.opacity) > 0.1;
  });
  return {
    見本: links.length,
    壁紙: getComputedStyle(document.body).backgroundImage.match(/[^/]+\.gif/)?.[0] ?? "?",
    見える星: vis.map((a) => a.textContent.replace("★", "").trim()).join(),
    覚え: localStorage.getItem("fl-bg"),
    位置: links.map((a) => Math.round(a.getBoundingClientRect().left)).join(","),
  };
});
const click = (n) => p.evaluate((x) => [...document.querySelectorAll(".bgpick-one")].find((a) => a.textContent.includes(x))?.click(), n);

let base = null, shifted = 0;
for (const n of NAMES) {
  await click(n); await new Promise((r) => setTimeout(r, 130));
  const s = await st();
  base ??= s.位置;
  if (s.位置 !== base) shifted++;
  const ok = s.見える星 === n;
  console.log(`${n.padEnd(5, "　")} 壁紙=${s.壁紙.padEnd(15)} 星=${s.見える星.padEnd(5, "　")} 覚え=${(s.覚え ?? "").padEnd(7)} ${ok ? "○" : "★ずれ"}`);
}
const s = await st();
console.log(`\n見本 ${s.見本}個 / 押しても位置が動いた回数 ${shifted}`);
await p.reload({ waitUntil: "networkidle0" });
console.log("読み直し後:", await st());
console.log(errs.length ? errs : "ページ内のエラーなし");
await b.close();
