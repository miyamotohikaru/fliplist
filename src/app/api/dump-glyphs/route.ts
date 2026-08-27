import { writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * jpGlyphs.generated.ts を作り直すための道具（tools/dump-jp-glyphs.mjs から呼ぶ）。
 * ファイルを書くので、開発中（npm run dev）以外では常に404にする。
 * 本番のサーバーレス環境はファイルシステムが読み取り専用なのでどのみち失敗するが、
 * それに頼らずここで明示的に閉じておく。
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("not found", { status: 404 });
  }
  const body = await req.text();
  const out = path.join(process.cwd(), "glyph-dump.json");
  await writeFile(out, body, "utf-8");
  return new Response(JSON.stringify({ ok: true, bytes: body.length, out }), {
    headers: { "content-type": "application/json" },
  });
}
