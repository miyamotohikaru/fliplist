"use client";

import { useEffect } from "react";

/**
 * 右クリック禁止。
 * 本物のHPは body にこう書いてある。
 *   oncontextmenu="alert('右クリックは禁止です！');return false"
 * 同じ会社のページなので、同じことをする。
 */
export default function NoRightClick() {
  useEffect(() => {
    const deny = (e: MouseEvent) => {
      e.preventDefault();
      window.alert("右クリックは禁止です！");
    };
    document.addEventListener("contextmenu", deny);
    return () => document.removeEventListener("contextmenu", deny);
  }, []);
  return null;
}
