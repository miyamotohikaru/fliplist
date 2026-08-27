// 見出しの塗り（background-clip:text）が、字のどこまで届いているかを測る（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=2", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
console.log(await p.evaluate(() => {
  const out = [];
  document.querySelectorAll(".sec .wa, .pagettl .wa").forEach((wa) => {
    const face = wa.querySelector(".wa__face");
    const ink = wa.querySelector(".wa__ink");
    const cs = getComputedStyle(face);
    const w = wa.getBoundingClientRect();
    const f = face.getBoundingClientRect();
    const i = ink.getBoundingClientRect();
    out.push({
      字: wa.textContent.trim().slice(0, 8),
      種: wa.dataset.wa,
      塗り方: cs.backgroundImage === "none" ? "べた(" + cs.color + ")" : "グラデ",
      背景の大きさ: cs.backgroundSize,
      背景の位置: cs.backgroundPosition,
      要素幅: Math.round(w.width),
      字の幅: Math.round(f.width),
      // 縁の層（transformが同じなので、字がどこまで出ているかの目安になる）
      縁の右端がはみ出す量: Math.round(i.right - w.right),
      縁の左端がはみ出す量: Math.round(w.left - i.left),
    });
  });
  return out;
}));
await b.close();
