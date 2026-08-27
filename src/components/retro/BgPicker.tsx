"use client";

import { useEffect, useState } from "react";
import MobileBreak from "./MobileBreak";

/**
 * 背景をかえる。
 *
 * 当時のホームページには「背景の色をかえられます」といって、小さな色見本を
 * ならべてあるページがよくあった。だいたい奥付にあって、押すと壁紙だけが変わる。
 * その意匠でやる。今どきのテーマ切替のスイッチにはしない。
 *
 * 見本は色を塗った四角ではなく、壁紙そのもの（150pxのタイル）を窓から覗かせる。
 * 何になるかがそのまま見えるほうが昔の作りに近い。
 *
 * えらんだ色は localStorage に入れておくので、次に来たときも同じ色になる。
 * 実際に壁紙をかえるのは body（＝#home）の data-fl-bg で、
 * 絵の指定は globals.css の側にある。
 */

const KEY = "fl-bg";

/**
 * ならびは色相環をひとまわりする順。クリームが会社HPと同じ地の色なので先頭。
 * 灰いろは色みが無いので最後に置く。
 * どれも tools/make-bg.py が bg.gif から起こしたもので、
 * 明るさと模様の濃さはクリームとそろえてある。
 */
const WALLS = [
  { id: "cream", label: "クリーム", file: "bg.gif" },
  { id: "wakaba", label: "わかば", file: "bg_wakaba.gif" },
  { id: "mint", label: "ミント", file: "bg_mint.gif" },
  { id: "mizu", label: "みずいろ", file: "bg_mizu.gif" },
  { id: "sky", label: "ふじ色", file: "bg_sky.gif" },
  { id: "sumire", label: "すみれ", file: "bg_sumire.gif" },
  { id: "sakura", label: "さくら", file: "bg_sakura.gif" },
  { id: "peach", label: "もも色", file: "bg_peach.gif" },
  { id: "anzu", label: "あんず", file: "bg_anzu.gif" },
  { id: "hai", label: "はいいろ", file: "bg_hai.gif" },
] as const;

type WallId = (typeof WALLS)[number]["id"];

/** 見本のならび。5つずつ2行 */
const ROWS = [WALLS.slice(0, 5), WALLS.slice(5)];

/** 既定はクリーム。会社HPと同じ地の色なので、これだけ data-fl-bg を付けない */
const DEFAULT: WallId = "cream";

function isWallId(v: string | null): v is WallId {
  return WALLS.some((w) => w.id === v);
}

function paint(id: WallId) {
  if (id === DEFAULT) delete document.body.dataset.flBg;
  else document.body.dataset.flBg = id;
}

export default function BgPicker() {
  const [now, setNow] = useState<WallId>(DEFAULT);

  /* 前に来たときにえらんだ色をおもいだす。
     ちらつかないように layout.tsx の頭でも同じことをしているので、
     ここは見本の★を合わせるのが主な仕事 */
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch {
      saved = null;
    }
    if (isWallId(saved)) {
      setNow(saved);
      paint(saved);
    }
  }, []);

  const pick = (id: WallId) => {
    setNow(id);
    paint(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* おぼえられなくても、その場ではかわる */
    }
  };

  return (
    <div className="bgpick">
      <p className="bgpick-lead">
        このページの背景は、お好きな色にかえられます。
        <br />
        えらんだ色はおぼえておきますので、
        <MobileBreak />
        再アクセスした時も同じ色で出ます。
      </p>
      {/* 10色を1行に並べると1500pxを超えるので、5つずつ2行にする。
          折り返しに任せると「｜」が行の頭に来てしまうので、行は自分で切る */}
      {ROWS.map((row, r) => (
        <p className="bgpick-row" key={r}>
          {row.map((w, i) => {
            const on = w.id === now;
            return (
              <span key={w.id}>
                {i > 0 ? <span className="bgpick-bar">｜</span> : null}
                <a
                  href="#bg"
                  className={on ? "bgpick-one is-now" : "bgpick-one"}
                  aria-current={on ? true : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    pick(w.id);
                  }}
                >
                  <i style={{ backgroundImage: `url(/hp/${w.file})` }} aria-hidden />
                  {/* ★はいつも書いておいて、いまの色でないときは見えなくするだけ。
                      出し入れすると押すたびに行がずれるので、場所は先に取っておく */}
                  <em className="bgpick-star" aria-hidden>
                    ★
                  </em>
                  <b>{w.label}</b>
                </a>
              </span>
            );
          })}
        </p>
      ))}
      <p className="bgpick-note">※いまの色は★の付いているほうです。</p>
    </div>
  );
}
