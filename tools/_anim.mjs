// カセットが本当に動き続けているか（GIFのように）を、時間をおいた2枚の差で確かめる（一時）
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--force-device-scale-factor=1", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 1000 });
await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
await p.evaluate(() => document.querySelector("#list")?.scrollIntoView());
await new Promise((r) => setTimeout(r, 600));

const grab = () => p.evaluate(() =>
  [...document.querySelectorAll("td.t-cart canvas")].slice(0, 6).map((c) => {
    const g = c.getContext("2d");
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let h = 2166136261, ink = 0;
    for (let i = 0; i < d.length; i += 4) { h = (h ^ d[i] ^ d[i+1] ^ d[i+2] ^ d[i+3]) * 16777619 >>> 0; if (d[i+3] > 8) ink++; }
    return { h, ink, w: c.width, hgt: c.height };
  }));

const a = await grab();
await new Promise((r) => setTimeout(r, 1700));
const c = await grab();
console.log("見えているカセット", a.length, "本");
a.forEach((x, i) => console.log(
  `  ${i + 1}本目 ${x.w}x${x.hgt} 塗ってある画素=${x.ink} 1.7秒後に絵が変わった=${x.h !== c[i].h}`));
await b.close();
