// ページのいちばん下を撮る道具。本物のHPと奥付・ボタンを見比べるために使う。
//
//   node tools/bottom.mjs <URL> <出力パス>
//   例: node tools/bottom.mjs https://kosukuma.com/home.html shots/real-bottom.png
//
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2], out = process.argv[3];
const b = await puppeteer.launch({ executablePath: CHROME, args:["--headless=new","--hide-scrollbars","--force-device-scale-factor=1","--font-render-hinting=none"], defaultViewport:{width:1280,height:700,deviceScaleFactor:1}});
const p = await b.newPage();
await p.goto(url, { waitUntil: "networkidle0", timeout:60000 });
await new Promise(r=>setTimeout(r,1200));
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await new Promise(r=>setTimeout(r,800));
await p.screenshot({ path: out });
console.log(out, await p.evaluate(()=>document.documentElement.scrollHeight));
await b.close();
