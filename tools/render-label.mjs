// ラベル絵を dev サーバなしで PNG に落とす。
// ブラウザを立てられないときの検分用。
//   node tools/render-label.mjs <slug> [zoom] [t]
import { createJiti } from "jiti";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const jiti = createJiti(import.meta.url, { interopDefault: true });
const slug = process.argv[2] ?? "hitodasuke";
const zoom = Number(process.argv[3] ?? 9);
const t = Number(process.argv[4] ?? 0);

const root = path.resolve("src/art");
const { PixelGfx } = await jiti.import(path.join(root, "gfx.ts"));
const mod = await jiti.import(path.join(root, "labels", `${slug}.ts`));
const art = mod.art ?? mod.default?.art;

const g = new PixelGfx(68, 40);
art.draw(g, t);

function crc32(buf, table = crc32.t) {
  if (!table) {
    table = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = -1;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++)
    for (let i = 0; i < w * 4; i++) raw[y * (w * 4 + 1) + 1 + i] = rgba[y * w * 4 + i];
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync("shots", { recursive: true });
fs.writeFileSync(path.join("shots", `${slug}-1x.png`), png(68, 40, g.data));
const bw = 68 * zoom;
const bh = 40 * zoom;
const big = new Uint8Array(bw * bh * 4);
for (let y = 0; y < bh; y++)
  for (let x = 0; x < bw; x++) {
    const s = (Math.floor(y / zoom) * 68 + Math.floor(x / zoom)) * 4;
    const d = (y * bw + x) * 4;
    big[d] = g.data[s];
    big[d + 1] = g.data[s + 1];
    big[d + 2] = g.data[s + 2];
    big[d + 3] = g.data[s + 3];
  }
fs.writeFileSync(path.join("shots", `${slug}-big.png`), png(bw, bh, big));
console.log(`shots/${slug}-big.png`);
