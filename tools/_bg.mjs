// 「背景をかえる」が4色ぜんぶ効くか／次に来たときも覚えているかを確かめる（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=1"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });

const st = () => p.evaluate(() => {
  const links = [...document.querySelectorAll("a")].filter((a) => /クリーム|ミント|ふじ色|もも色/.test(a.textContent));
  return {
    壁紙: getComputedStyle(document.body).backgroundImage.match(/[^/]+\.gif/)?.[0] ?? "?",
    星: links.filter((a) => a.textContent.includes("★")).map((a) => a.textContent.replace("★", "")).join(),
    見本: links.length,
    覚え: localStorage.getItem("fl-bg"),
    左端: links.map((a) => Math.round(a.getBoundingClientRect().left)).join(","),
    // ★は常に置いてあって見えなくしているだけなので、実際に見えている★を数える
    見える星: links.filter((a) => { const s = a.querySelector(".bgpick-star");
      if (!s) return false; const c = getComputedStyle(s);
      return c.visibility !== "hidden" && c.display !== "none" && Number(c.opacity) > 0.1;
    }).map((a) => a.textContent.replace("★", "").trim()).join(),
  };
});
const click = (name) => p.evaluate((n) => [...document.querySelectorAll("a")].find((a) => a.textContent.includes(n))?.click(), name);

console.log("初期      ", await st());
for (const n of ["ミント", "ふじ色", "もも色", "クリーム"]) {
  await click(n); await new Promise((r) => setTimeout(r, 150));
  console.log(n.padEnd(5, "　"), await st());
}
await click("ふじ色"); await new Promise((r) => setTimeout(r, 150));
await p.reload({ waitUntil: "networkidle0" });
console.log("読み直し後", await st());
console.log(errs.length ? errs : "ページ内のエラーなし");
await b.close();
