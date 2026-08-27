// 和文ラベルの字母を事前計算し、src/art/jpGlyphs.generated.ts に焼き直す。
//
//   npm run dev で開発サーバーを立ててから:
//   node tools/dump-jp-glyphs.mjs
//
// 新しいラベルで新しい和文の字を使ったら、このスクリプトをもう一度実行すること。
// 実行しないと、その新しい字だけ実行時ラスタライズ（従来どおりブラウザの
// fillText 任せ）にフォールバックし、devicePixelRatio・@font-face・
// WebKitのアンチエイリアス差など実機限定の不具合が再び起こりうる。
//
// 仕組み: /dump-glyphs ページが16枚ぜんぶを1回描かせて glyphCache を満たし、
// /api/dump-glyphs（開発時のみ有効）へPOSTしてリポジトリ直下に glyph-dump.json
// として書き出す。ここではその JSON を読んで TypeScript に変換するだけ。
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = process.env.FLIP_URL ?? "http://localhost:3020";
const dumpPath = path.resolve("glyph-dump.json");

// 前回の残りが古いまま読まれないように先に消しておく
if (fs.existsSync(dumpPath)) fs.rmSync(dumpPath);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ["--headless=new"],
});
const page = await browser.newPage();
await page.goto(base + "/dump-glyphs", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(
  () => document.getElementById("dump")?.textContent?.startsWith("saved:"),
  { timeout: 20000 },
);
await browser.close();

if (!fs.existsSync(dumpPath)) {
  throw new Error("glyph-dump.json が書き出されなかった（/api/dump-glyphs が404？ npm run dev で動かしているか確認）");
}

const data = JSON.parse(fs.readFileSync(dumpPath, "utf-8"));
const entries = Object.entries(data).sort(([a], [b]) => (a < b ? -1 : 1));

let out = "";
out += "// 自動生成ファイル。手で編集しない。\n";
out += "// tools/dump-jp-glyphs.mjs で作り直す（新しいラベルで新しい和文を使ったとき）。\n";
out += "//\n";
out += "// 和文ラベルの字母を、実行時にブラウザで fillText するのではなく、\n";
out += "// ビルド時点で確定させた1bitのビットマップとして持つ。\n";
out += "// devicePixelRatio・@font-face・WebKitのアンチエイリアス差など、\n";
out += "// 端末やブラウザによる違いを実行時から完全に切り離すための道具。\n";
out += "\n";
out += "export type JpGlyph = { w: number; h: number; adv: number; on: number[] };\n\n";
out += "export const JP_GLYPHS: Record<string, JpGlyph> = {\n";
for (const [key, g] of entries) {
  out += `  ${JSON.stringify(key)}: { w: ${g.w}, h: ${g.h}, adv: ${g.adv}, on: [${g.on.join(",")}] },\n`;
}
out += "};\n";

const outPath = path.resolve("src/art/jpGlyphs.generated.ts");
fs.writeFileSync(outPath, out, "utf-8");
fs.rmSync(dumpPath);
console.log(`${outPath} … ${entries.length} 字`);
