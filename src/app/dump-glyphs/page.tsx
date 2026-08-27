"use client";

import { useEffect, useState } from "react";
import { PixelGfx, jpFontReady, dumpGlyphCache } from "@/art/gfx";
import { LABELS } from "@/art/labels";

/**
 * 一度きりの道具。16枚ぜんぶを1回描かせて glyphCache を満たし、そのまま書き出す。
 * `jpGlyphs.generated.ts` を作り直すときだけ使う。本番の導線には出さない。
 */
export default function DumpGlyphsPage() {
  const [json, setJson] = useState("loading...");

  useEffect(() => {
    let alive = true;
    jpFontReady().then(() => {
      if (!alive) return;
      for (const art of Object.values(LABELS)) {
        const g = new PixelGfx(68, 40);
        art.draw(g, 0);
        art.draw(g, 0.5);
      }
      const body = JSON.stringify(dumpGlyphCache());
      fetch("/api/dump-glyphs", { method: "POST", body })
        .then((r) => r.json())
        .then((r) => setJson(`saved: ${JSON.stringify(r)}`))
        .catch((e) => setJson(`error: ${e}`));
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <pre id="dump" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 10 }}>
      {json}
    </pre>
  );
}
