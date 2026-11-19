"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 改行の調整モード（2026-11-19 ユーザー依頼「改行とかできるページ作って。すごく気になる」）。
 *
 * 下の階のページ（遊び方・運営者情報・プライバシーポリシー）で、URL に ?edit を付けたときだけ出る。
 * 本物のページの上で、文の中をタップして Enter で改行・字の直しができる。
 * 「変更をコピー」で、変えたところだけを文字にして渡してもらい、こちらで原稿に書き写す。
 *
 * - 変えた内容はこのブラウザに覚えておく（再読み込みしても消えない）。
 * - 「最初に戻す」で全部もとに戻る。
 * - 改行は出力では「／」で表す。
 * - 編集中、リンクを含む段落はリンクの色が消えることがある（見た目だけ。原稿には影響しない）。
 */

const TARGETS = [
  "main .doc p",
  "main .doc li",
  "main .doc th",
  "main .doc td",
  "main .doc h2",
  "main .note",
].join(",");

type Block = { el: HTMLElement; original: string };

const storeKey = () => `fl-edit:${location.pathname}`;

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(storeKey()) ?? "{}");
  } catch {
    return {};
  }
}
function save(v: Record<string, string>) {
  try {
    localStorage.setItem(storeKey(), JSON.stringify(v));
  } catch {
    /* 保存できない環境でも、その場の編集はできる */
  }
}

/** 改行を「／」にして1行にする */
const flat = (s: string) => s.replace(/\n+$/, "").replace(/\n/g, "／");

export default function EditMode() {
  const [on, setOn] = useState(false);
  const [out, setOut] = useState("");
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [small, setSmall] = useState(false);
  const blocks = useRef<Block[]>([]);

  useEffect(() => {
    if (!new URLSearchParams(location.search).has("edit")) return;
    setOn(true);
    // 編集中は右クリック禁止（NoRightClick）を止める。携帯の長押しで警告が出ると編集できないため。
    // window の capture で先に受けて、document の禁止処理まで届かせない。
    const allowMenu = (e: Event) => e.stopImmediatePropagation();
    window.addEventListener("contextmenu", allowMenu, true);
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(TARGETS),
    ).filter(
      // 表の中の段落と、入れ子の重複を除く（いちばん内側だけを編集の単位にする）
      (el) => !el.querySelector(TARGETS),
    );
    const saved = load();
    blocks.current = els.map((el, i) => {
      // もとの文は最初の1回だけ取って要素に持たせる
      // （開発中は React がこの処理を2回走らせるので、2回目に直した後の文を「もと」にしないため）
      const first = el.dataset.editOriginal === undefined;
      if (first) el.dataset.editOriginal = el.innerText;
      const original = el.dataset.editOriginal ?? "";
      el.dataset.editIndex = String(i);
      el.classList.add("edit-on");
      el.contentEditable = "true";
      if (first && saved[i] !== undefined && saved[i] !== original)
        el.innerText = saved[i];
      return { el, original };
    });

    const update = () => {
      const now: Record<string, string> = {};
      const lines: string[] = [];
      blocks.current.forEach(({ el, original }, i) => {
        const text = el.innerText;
        if (text === original) {
          el.classList.remove("edit-changed");
          return;
        }
        now[i] = text;
        el.classList.add("edit-changed");
        lines.push(
          `【${i + 1}】\nもと：${flat(original)}\nあと：${flat(text)}`,
        );
      });
      save(now);
      setCount(lines.length);
      setOut(
        lines.length
          ? `ページ：${location.pathname}\n\n${lines.join("\n\n")}`
          : "",
      );
    };
    update();
    document.addEventListener("input", update);
    return () => {
      document.removeEventListener("input", update);
      window.removeEventListener("contextmenu", allowMenu, true);
    };
  }, []);

  if (!on) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* コピーできない環境では、下の欄から手で写してもらう */
    }
  };
  const reset = () => {
    try {
      localStorage.removeItem(storeKey());
    } catch {}
    location.reload();
  };

  return (
    <div className={small ? "editpanel is-small" : "editpanel"}>
      <p className="editpanel-h">
        改行の調整モード
        <button
          type="button"
          className="editpanel-fold"
          onClick={() => setSmall(!small)}
        >
          {small ? "ひらく" : "たたむ"}
        </button>
      </p>
      <p className="editpanel-help">
        点線で囲んだ文の中をタップして、
        <br />
        改行したいところで Enter（改行キー）。
        <br />
        字の直しもそのままできます。
      </p>
      <p className="editpanel-count">変えたところ：{count}か所</p>
      <p className="editpanel-btns">
        <button type="button" onClick={copy} disabled={!count}>
          {copied ? "コピーしました" : "変更をコピー"}
        </button>
        <button type="button" onClick={reset}>
          最初に戻す
        </button>
      </p>
      {count ? (
        <textarea className="editpanel-out" readOnly value={out} />
      ) : null}
    </div>
  );
}
