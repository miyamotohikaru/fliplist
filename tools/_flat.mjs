// 立体感を抜いたカセットを、元のものと並べて見るための一時の道具。
//   node tools/_flat.mjs [zoom]
import { createJiti } from "jiti";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const jiti = createJiti(import.meta.url, { interopDefault: true });
const zoom = Number(process.argv[2] ?? 4);
const root = path.resolve("src");
const { PixelGfx } = await jiti.import(path.join(root, "art/gfx.ts"));
const { drawCartridge } = await jiti.import(path.join(root, "art/cartridge.ts"));
const { CART, CART_BUFFER } = await jiti.import(path.join(root, "art/spec.ts"));
const { LABELS } = await jiti.import(path.join(root, "art/labels/index.ts"));
const { FLIPS } = await jiti.import(path.join(root, "data/flips.ts"));

const PICK = ["flip-archive", "values", "kikiippatsu", "ads", "diagnosis", "moth", "creature", "vanished-jobs"];
const rows = [
  { name: "札なし", flat: true, seam: false, seal: 0 },
  { name: "札 いまの位置(y=33)", flat: true, seam: false, seal: 33 },
  { name: "札 下げる(y=39,h=9)", flat: true, seam: false, seal: 39 },
];

const GAP = 6;
const CW = CART_BUFFER.W + GAP;
const CH = CART_BUFFER.H + GAP;
const W = CW * PICK.length;
const H = CH * rows.length;
const page = new PixelGfx(W, H);
page.rect(0, 0, W, H, "#efeadc");

for (let r = 0; r < rows.length; r++) {
  for (let c = 0; c < PICK.length; c++) {
    const flip = FLIPS.find((f) => f.slug === PICK[c]);
    const g = new PixelGfx(CART_BUFFER.W, CART_BUFFER.H);
    drawCartridge(g, { shellName: flip.shell, code: flip.code, flat: rows[r].flat });
    // 段の線を消す版。段の付け根の1行を、面の色で塗り直す
    if (rows[r].flat && !rows[r].seam) {
      const f = g.get(Math.floor(CART.W / 2), 30);
      const face = "#" + f.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
      for (let x = 9; x < CART.W - 9; x++) g.px(x, 56, face);
    }
    const art = LABELS[flip.slug];
    if (art) {
      const label = new PixelGfx(CART.LABEL_W, CART.LABEL_H);
      art.draw(label, 0);
      g.paste(label, CART.LABEL_X, CART.LABEL_Y);
    }
    if (rows[r].seal) {
      const text = "COMING SOON";
      const tw = g.text3x5Width(text);
      const w = tw + 10;
      const x = Math.round((CART.W - w) / 2);
      const y = rows[r].seal;
      const h = y === 39 ? 9 : 11;
      g.rect(x, y, w, h, "#f2eddd");
      g.frame(x, y, w, h, "#1b1a17");
      g.text3x5(x + 5, y + (h - 5) / 2, text, "#1b1a17");
    }
    page.paste(g, c * CW + GAP / 2, r * CH + GAP / 2);
  }
}

function crc32(buf, table = crc32.t) {
  if (!table) { table = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let x = n; for (let k = 0; k < 8; k++) x = x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1; table[n] = x; } }
  let x = -1; for (const b of buf) x = table[(x ^ b) & 0xff] ^ (x >>> 8); return x ^ -1;
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let i = 0; i < w * 4; i++) raw[y * (w * 4 + 1) + 1 + i] = rgba[y * w * 4 + i];
  const chunk = (t, b) => { const l = Buffer.alloc(4); l.writeUInt32BE(b.length);
    const td = Buffer.concat([Buffer.from(t, "ascii"), b]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const bw = W * zoom, bh = H * zoom;
const big = new Uint8Array(bw * bh * 4);
for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
  const s = (Math.floor(y / zoom) * W + Math.floor(x / zoom)) * 4, d = (y * bw + x) * 4;
  big[d] = page.data[s]; big[d+1] = page.data[s+1]; big[d+2] = page.data[s+2]; big[d+3] = page.data[s+3];
}
fs.mkdirSync("shots", { recursive: true });
fs.writeFileSync("shots/_flat.png", png(bw, bh, big));
console.log("shots/_flat.png", bw, "x", bh, "  上段=立体 / 中段=平ら＋段の線 / 下段=平ら（線なし）");
