"use client";

// ラベル絵を大きく並べて検分するための開発用ページ。本番の導線には出さない。
// http://localhost:3020/labels
//   ?only=black-hole  で1枚だけ
//   ?scale=8          で倍率
//   ?cart=1           でカセットに貼った状態

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PixelCanvas from "@/components/PixelCanvas";
import Cartridge from "@/components/Cartridge";
import { PixelGfx } from "@/art/gfx";
import { CART } from "@/art/spec";
import { LABELS } from "@/art/labels";
import { FLIPS } from "@/data/flips";

function Inner() {
  const q = useSearchParams();
  const only = q.get("only");
  const scale = Number(q.get("scale") ?? 6);
  const asCart = q.get("cart") === "1";
  const animate = q.get("anim") === "1";
  const list = only ? FLIPS.filter((f) => f.slug === only) : FLIPS;

  return (
    <main style={{ padding: 32, background: "#efeadc" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${(asCart ? 92 : CART.LABEL_W) * scale + 24}px, 1fr))`,
          gap: 32,
          alignItems: "start",
        }}
      >
        {list.map((f) => (
          <div key={f.slug} id={`label-${f.slug}`}>
            {asCart ? (
              <Cartridge flip={f} scale={scale} animate={animate} />
            ) : (
              <PixelCanvas
                w={CART.LABEL_W}
                h={CART.LABEL_H}
                scale={scale}
                animate={animate}
                period={3}
                draw={(g: PixelGfx, t: number) => LABELS[f.slug]?.draw(g, t)}
              />
            )}
            <p style={{ margin: "10px 0 0", fontSize: 13 }}>{f.title}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#5c574c" }}>
              {f.slug} / {f.shell}
            </p>
            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
              {(LABELS[f.slug]?.swatch ?? []).map((c, i) => (
                <span
                  key={i}
                  style={{ width: 10, height: 10, background: c, display: "block", outline: "1px solid #0002" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function LabelsPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
