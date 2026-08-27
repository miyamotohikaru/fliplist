"use client";

// こすくまくんを実物のロゴと並べて検分するための開発用ページ。本番の導線には出さない。
// http://localhost:3020/kuma

import PixelCanvas from "@/components/PixelCanvas";
import { PixelGfx } from "@/art/gfx";
import { drawKosukuma, drawKosukumaSmall, KUMA_SIZE, KUMA_SMALL_SIZE } from "@/art/kosukuma";

export default function KumaPage() {
  return (
    <main style={{ padding: 24, background: "#efeadc", display: "flex", gap: 32 }}>
      {[12, 8, 6, 3].map((s) => (
        <div key={s}>
          <PixelCanvas
            w={KUMA_SIZE.w}
            h={KUMA_SIZE.h}
            scale={s}
            draw={(g: PixelGfx) => drawKosukuma(g, 0, 0)}
          />
          <p style={{ fontSize: 14, fontFamily: "DotGothic16" }}>{s}倍</p>
        </div>
      ))}
      {[10, 6, 3].map((s) => (
        <div key={`s${s}`}>
          <PixelCanvas
            w={KUMA_SMALL_SIZE.w}
            h={KUMA_SMALL_SIZE.h}
            scale={s}
            draw={(g: PixelGfx) => drawKosukumaSmall(g, 0, 0)}
          />
          <p style={{ fontSize: 14, fontFamily: "DotGothic16" }}>小 {s}倍</p>
        </div>
      ))}
    </main>
  );
}
