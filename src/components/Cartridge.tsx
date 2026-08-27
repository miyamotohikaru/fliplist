"use client";

import { useCallback } from "react";
import PixelCanvas from "./PixelCanvas";
import { PixelGfx } from "@/art/gfx";
import { drawCartridge } from "@/art/cartridge";
import { CART, CART_BUFFER } from "@/art/spec";
import { LABELS } from "@/art/labels";
import type { Flip } from "@/data/flips";

type Props = {
  flip: Flip;
  scale: number;
  animate?: boolean;
  /** まだ遊べない。カセットに封の札を貼る */
  soon?: boolean;
  /** 立体感を抜く。昔のホームページに置く絵はこちら */
  flat?: boolean;
};

/**
 * まだ遊べないカセットに貼る封の札。
 *
 * 版面の隅にバッジを置くのではなく、**カセットそのものに貼る**。
 * 中古屋の値札や封のシールと同じで、物の上にあるほうが「まだ開けられない」
 * が一目でわかる。地は紙色・字は墨なので、外装の彩度を落とす CSS の
 * フィルタをかけても札だけは読める。
 */
function drawSoonSeal(g: PixelGfx, flat = false) {
  const text = "COMING SOON";
  const tw = g.text3x5Width(text);
  const w = tw + 10;
  const x = Math.round((CART.W - w) / 2);
  // ラベルの外、下の帯（型番を刻んであるところ）に貼る。
  //
  // 前はラベルの真ん中あたりに置いていて、そこはどのラベルも
  // ふりっぷの名前を書いているところだった。「こすくまくん危機一髪」は題が丸ごと、
  // 「価値観一覧図鑑」「精神病図鑑」は2行目が隠れていた。
  // ラベルの下端へ寄せても「一髪」だけは3行目が下端まで届いていて隠れる。
  //
  // ラベルの中には安全な場所が無い。だから札はラベルの外へ出した。
  // 中古の店が本体に貼る値札と同じ位置で、これならどのラベルも1ドットも隠れない。
  // 型番の刻印はこの札に譲る（drawCartridge の noEmboss）。
  const h = 8;
  const y = CART.LABEL_Y + CART.LABEL_H + 1;

  // 札の落ち影。カセットの面から浮いていることを示す1px。
  // 立体感を抜く指定のときは、これも落とす（札だけが浮いて残ってしまう）
  if (!flat) g.rect(x + 1, y + 1, w, h, "#00000030");
  g.rect(x, y, w, h, "#f2eddd");
  g.frame(x, y, w, h, "#1b1a17");
  g.text3x5(x + 5, y + 2, text, "#1b1a17");
}

/** 外装にラベルを貼った状態のカセット1本。 */
export default function Cartridge({
  flip,
  scale,
  animate = false,
  soon = false,
  flat = false,
}: Props) {
  const draw = useCallback(
    (g: PixelGfx, t: number) => {
      // ラベルは16本すべてに貼る。外装だけの無地は「作り忘れ」に見えるので使わない。
      drawCartridge(g, { shellName: flip.shell, code: flip.code, flat, noEmboss: soon });
      const art = LABELS[flip.slug];
      if (art) {
        const label = new PixelGfx(CART.LABEL_W, CART.LABEL_H);
        art.draw(label, t);
        g.paste(label, CART.LABEL_X, CART.LABEL_Y);
      }
      if (soon) drawSoonSeal(g, flat);
    },
    [flip.shell, flip.code, flip.slug, soon, flat],
  );

  // 影を描かないなら、影のぶんの余白も要らない。
  // 余白を残すと右と下に4pxの透明が付き、表のマスの中で中央が寄る。
  return (
    <PixelCanvas
      w={flat ? CART.W : CART_BUFFER.W}
      h={flat ? CART.H : CART_BUFFER.H}
      scale={scale}
      draw={draw}
      animate={animate}
      period={3}
      ariaLabel={`${flip.title}のカセット${soon ? "（まだ遊べません）" : ""}`}
    />
  );
}
