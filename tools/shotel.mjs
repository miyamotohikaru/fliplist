// 要素ひとつだけを撮る道具。動いているものを止めてから撮るので、
// 点滅で消えている瞬間に当たってしまうことがない（天のカウンターなど）。
//
//   node tools/shotel.mjs "<セレクタ>" <出力パス> [まわりの余白px]
//
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sel = process.argv[2], out = process.argv[3], pad = Number(process.argv[4] ?? 0);
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new","--hide-scrollbars","--force-device-scale-factor=1","--font-render-hinting=none"], defaultViewport:{width:1280,height:900,deviceScaleFactor:1}});
const p = await b.newPage();
await p.goto("http://localhost:3020/", { waitUntil: "networkidle0" });
await p.addStyleTag({ content: "*{animation:none !important}" });
await new Promise(r=>setTimeout(r,600));
const el = await p.$(sel);
if (!el) { console.log("見つからない", sel); await b.close(); process.exit(1); }
const r = await el.boundingBox();
await p.screenshot({ path: out, clip: { x: Math.max(0,r.x-pad), y: Math.max(0,r.y-pad), width: r.width+pad*2, height: r.height+pad*2 } });
console.log(out, JSON.stringify(r));
await b.close();
