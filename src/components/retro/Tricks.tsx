"use client";

import { useEffect } from "react";

/**
 * 仕掛け。このページに3つ隠してある。
 *
 * 「ふりっぷ」は FLIP＝ひっくり返す のことなので、3つとも起こることは
 * 「上下をひっくり返す」だけにしてある。入口だけを別にした。
 *
 *   1 押す     ページ名「ふりっぷ」を1字ずつ押す
 *              → 4字そろうと、ページごと天地が逆さになる。壁紙も別シリーズの色になる
 *   2 打つ     キーボードで flip と打つ
 *              → 一覧表が上下ひっくり返る（見出しの行が下へ回る）。下の黄色い矢印も上を向く
 *   3 掴む     電光掲示板を掴んで上下に引っぱる
 *              → 看板が裏返って、字が逆から流れ出す
 *
 * 決めごと:
 *   ・見つけていない人には何も起きない。初見の版面は1pxも動かさない
 *   ・偶然では起きない（4字そろえる／4字打つ／36px引っぱる）
 *   ・どれも必ず戻せる。同じ操作をもう一度、あるいは Esc で全部戻る
 *   ・「動きを減らす」設定では、間を補間しない（起きること自体は同じ）
 *
 * このページの天・表・掲示板は、どれもサーバで描いて動かない部品
 * （page.tsx / FlipTable.tsx / Marquee.tsx）なので、
 * ここからは class を足し引きするだけにして、部品の側は一切触っていない。
 * 見え方の指定は全部 globals.css の「仕掛け」の節にある。
 */

/**
 * 天地が逆さになったときの壁紙。返すたびに次の色へ回る。
 * 「背景をかえる」で選べる9色（クリーム以外）と同じならび（BgPicker.tsx）。
 */
const WALLS = [
  "wakaba",
  "mint",
  "mizu",
  "sky",
  "sumire",
  "sakura",
  "peach",
  "anzu",
  "hai",
] as const;

/** 掲示板がめくれる引っぱりの量(px)。うっかり触ったぐらいでは届かない */
const PULL = 36;

/** 引っぱりに付いてくるのは帯の半分まで */
const PULL_MAX = 44;

/** 表が閉じて開くひと呼吸(ms)。globals.css の transition と同じ数字 */
const SHUT = 220;

export default function Tricks() {
  useEffect(() => {
    const body = document.body;
    /* 「ふりっぷ」の4字。「一覧」の2字には data-flip-index が無いので巻き込まれない */
    const chars = Array.from(
      document.querySelectorAll<HTMLElement>("#home [data-flip-index]"),
    );
    /* 天地を返すときの目印。ページ名の見出しそのもの（4字の親） */
    const title = chars[0]?.parentElement ?? null;
    const board = document.querySelector<HTMLElement>("#home .marquee");
    const table = document.querySelector<HTMLTableElement>("#home .cont02 table");

    const quiet = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    /* ── 仕掛け1 天のタイトルを1字ずつ ───────────────────
       4字そろった瞬間にページごと返す。1字でも戻せば、ページも戻る。 */

    let wall = -1;

    const turnPage = (on: boolean) => {
      if (on === body.classList.contains("fl-upside")) return;

      /* 見ていたところがその場で逆さになるように、スクロールも鏡にする。
         天地反転は一瞬（transition を持たせていない）ので、
         クラスを足したあとに測れば、返ったあとの位置がそのまま取れる。 */
      const before = title ? title.getBoundingClientRect().top : 0;

      if (on) {
        wall = (wall + 1) % WALLS.length;
        body.dataset.flWall = WALLS[wall];
        body.classList.add("fl-upside");
      } else {
        body.classList.remove("fl-upside");
        delete body.dataset.flWall;
      }

      if (!title) return;
      const after = title.getBoundingClientRect().top;
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      window.scrollTo(0, Math.min(max, Math.max(0, window.scrollY + after - before)));
    };

    const onChar = (e: Event) => {
      (e.currentTarget as HTMLElement).classList.toggle("is-upsidedown");
      turnPage(chars.every((c) => c.classList.contains("is-upsidedown")));
    };

    /* ── 仕掛け2 flip と打つ ──────────────────────────
       表の行をそのまま上下ひっくり返す。1行目の見出しが最後に回るので、
       表そのものが裏返ったように見える。同じことを2回やれば元の並びに戻る。 */

    const swapRows = () => {
      if (!table?.tBodies[0]) return;
      const tb = table.tBodies[0];
      for (const tr of Array.from(tb.rows).reverse()) tb.appendChild(tr);
    };

    let turning = false;

    const flipOrder = () => {
      if (!table || turning) return;
      if (quiet()) {
        /* 動きを減らす設定では、閉じずに入れ替えるだけ */
        swapRows();
        body.classList.toggle("fl-order");
        return;
      }
      turning = true;
      body.classList.add("fl-shut"); // ぺたんと閉じる
      later(() => {
        swapRows();
        body.classList.toggle("fl-order"); // 矢印がここで向きを変える
        body.classList.remove("fl-shut"); // また開く
        turning = false;
      }, SHUT);
    };

    /* ── 仕掛け3 掲示板を掴む ─────────────────────────
       上下どちらでも、36px引っぱってはなすと裏返る。
       引っぱっている間は帯が手に付いてくるので、掴めることはそこで分かる。 */

    let pointer: number | null = null;
    let from = 0;
    let moved = 0;
    let pulling = false;

    const release = () => {
      pointer = null;
      pulling = false;
      board?.classList.remove("fl-pull");
      board?.style.removeProperty("--fl-pull");
    };

    const onDown = (e: PointerEvent) => {
      /* 指では拾わない。掲示板は窓のいちばん上にある帯なので、
         携帯でここを掴むのは「下へスクロールしたい」ときだから */
      if (e.pointerType !== "mouse" || e.button !== 0 || pointer !== null) return;
      pointer = e.pointerId;
      from = e.clientY;
      moved = 0;
      board?.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (pointer !== e.pointerId || !board) return;
      moved = e.clientY - from;
      if (!pulling) {
        if (Math.abs(moved) <= 5) return; // ただ押しただけでは動かさない
        pulling = true;
        board.classList.add("fl-pull");
        window.getSelection()?.removeAllRanges(); // 掴んだ拍子に字を選ばない
      }
      /* ページごと逆さになっているときは、帯の中の上下も逆さなので、
         符号を返しておく。そうしないと手と反対へ動く */
      const way = body.classList.contains("fl-upside") ? -1 : 1;
      const d = Math.max(-PULL_MAX, Math.min(PULL_MAX, moved)) * way;
      board.style.setProperty("--fl-pull", `${d}px`);
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      const enough = Math.abs(moved) >= PULL;
      release();
      if (enough) body.classList.toggle("fl-board");
    };

    const onCancel = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      release();
    };

    /* ── キーボード ──────────────────────────────
       flip と打つと仕掛け2。Esc は3つとも元に戻す逃げ道（口では言わない）。 */

    let typed = "";
    let lastKey = 0;

    const undoAll = () => {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      turning = false;
      body.classList.remove("fl-shut");
      if (body.classList.contains("fl-order")) {
        swapRows();
        body.classList.remove("fl-order");
      }
      body.classList.remove("fl-board");
      release();
      turnPage(false);
      for (const c of chars) c.classList.remove("is-upsidedown");
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        undoAll();
        return;
      }
      /* ブラウザのショートカット（⌘F など）は邪魔しない */
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      const now = Date.now();
      if (now - lastKey > 2500) typed = ""; // 間があいたら忘れる
      lastKey = now;
      typed = (typed + e.key.toLowerCase()).slice(-4);
      if (typed !== "flip") return;
      typed = "";
      flipOrder();
    };

    for (const c of chars) c.addEventListener("click", onChar);
    board?.addEventListener("pointerdown", onDown);
    board?.addEventListener("pointermove", onMove);
    board?.addEventListener("pointerup", onUp);
    board?.addEventListener("pointercancel", onCancel);
    document.addEventListener("keydown", onKey);

    return () => {
      for (const c of chars) c.removeEventListener("click", onChar);
      board?.removeEventListener("pointerdown", onDown);
      board?.removeEventListener("pointermove", onMove);
      board?.removeEventListener("pointerup", onUp);
      board?.removeEventListener("pointercancel", onCancel);
      document.removeEventListener("keydown", onKey);

      /* 置いていかない。並びもクラスも元に戻す */
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      if (body.classList.contains("fl-order")) swapRows();
      body.classList.remove("fl-upside", "fl-order", "fl-shut", "fl-board");
      delete body.dataset.flWall;
      for (const c of chars) c.classList.remove("is-upsidedown");
      release();
    };
  }, []);

  return null;
}
