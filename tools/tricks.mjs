// 仕掛け（イースターエッグ）を実際に動かして、目で確かめるための道具。
// 撮るだけでは確かめられない（押す・打つ・掴む が要る）のでここにまとめてある。
//
//   node tools/tricks.mjs base              初見の状態を撮る（＝1pxの差分をとる基準）
//   node tools/tricks.mjs run               3つの仕掛けを順に動かして撮る
//   node tools/tricks.mjs run --reduce      動きを減らす設定で同じことをする
//
//   出るもの: shots/tr-*.png（--reduce のときは shots/trr-*.png）
//
// base だけは「動いているもの」を全部止めてから撮る。
// 電光掲示板・空の帯・blink は負の delay で流しているので、
// 止めないと撮る時刻のぶれがそのまま差分に出てしまう。
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.resolve("shots");
fs.mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2);
const mode = argv[0] ?? "run";
const reduce = argv.includes("--reduce");
const W = 1280;
const H = 900;
const base = process.env.FLIP_URL ?? "http://localhost:3020";
const tag = reduce ? "trr" : "tr";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 動いているものを全部止める。撮る時刻でぶれないようにするため。
   new.gif（14コマ）と arrow_list.gif（3コマ）は動くGIFで、CSSでは止まらない。
   コマの巡りが差分に出てしまうので、比べる両方で伏せる。 */
const FREEZE =
  `*,*::before,*::after{animation:none !important;transition:none !important}` +
  `.new img{visibility:hidden !important}` +
  `#home .cont01_news ul li,#home .cont02 table td.t-ttl a,` +
  `#home .cont02 table td.t-ttl span.soon{background-image:none !important}`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: [
    "--headless=new",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--font-render-hinting=none",
  ],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
const problems = [];
page.on("console", (m) => {
  if (/error/i.test(m.type())) problems.push(`[console] ${m.text().slice(0, 300)}`);
});
page.on("pageerror", (e) => problems.push(`[pageerror] ${String(e).slice(0, 300)}`));

if (reduce) {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
}

await page.goto(base + "/", { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await sleep(900);

const shot = async (name, clip) => {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot(clip ? { path: file, clip } : { path: file });
  console.log(file);
};

/** ある要素のまわりを撮る。clip はページの座標なので scrollY を足すこと */
const around = async (sel, pad = 20, maxH = 880) => {
  const r = await page.evaluate(
    (s) => {
      const b = document.querySelector(s).getBoundingClientRect();
      return { top: b.top + window.scrollY, h: b.height };
    },
    sel,
  );
  return {
    x: 0,
    y: Math.max(0, r.top - pad),
    width: W,
    height: Math.min(maxH, r.h + pad * 2),
  };
};

/** いま何がかかっているか。body のクラスをそのまま読む */
const state = () =>
  page.evaluate(() => ({
    body: document.body.className,
    bg: getComputedStyle(document.body).backgroundImage.replace(/.*\/hp\//, "").replace(/["')].*/, ""),
    chars: [...document.querySelectorAll("[data-flip-index]")].map((el) =>
      el.classList.contains("is-upsidedown") ? "反" : "正",
    ).join(""),
    scrollY: Math.round(window.scrollY),
    /* 返ったあとも全部に手が届くか（＝スクロールできる高さが変わっていないか） */
    docH: document.documentElement.scrollHeight,
    /* 一覧表の No. 列を上から読む。ひっくり返っているかがこれで分かる */
    nos: [...document.querySelectorAll("#home .cont02 table tr")]
      .map((tr) => tr.cells[0].textContent.trim())
      .join(","),
    marquee: getComputedStyle(document.querySelector("#home .marquee")).transform,
    flow: getComputedStyle(document.querySelector("#home .marquee p")).animationDirection,
    arrow: getComputedStyle(document.querySelector("#home .yarrow")).transform,
  }));

const say = async (label) => {
  const s = await state();
  console.log(
    `  ${label}\n    body="${s.body}" 壁紙=${s.bg} 4字=${s.chars} scrollY=${s.scrollY} 頁の高さ=${s.docH}` +
      `\n    表=${s.nos}\n    掲示板=${s.marquee} 流れ=${s.flow} 矢印=${s.arrow}`,
  );
};

/* ── 本物と突き合わせる寸法を測る ─────────────────────
   node tools/tricks.mjs sizes
   ロゴの縦横比・見出しの塗りの高さ・帯の高さ・表の幅・カウンターの箱。
   見出しは箱ではなく「塗りの高さ」で比べないと本物と合わないので、
   その要素だけを撮って画素で測る（shots/ink-*.png）。 */
if (mode === "sizes") {
  const box = await page.evaluate(() => {
    const r = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
    };
    const img = document.querySelector("#home .header h1 img");
    return {
      ロゴ: { ...r("#home .header h1 img"), 素: `${img?.naturalWidth}x${img?.naturalHeight}` },
      カウンター枠: r(".count"),
      掲示板: r("#home .marquee"),
      空の帯: r("#home .goods_plane"),
      飛行機: r("#home .goods_plane_body img"),
      一覧表: r("#home .cont02 table"),
      注記: r("#home .add_page p.tablenote"),
      節見出しの箱: r("#home .common_heading"),
      ボタン: r("#home .btn_contact img"),
      頁の高さ: document.documentElement.scrollHeight,
    };
  });
  for (const [k, v] of Object.entries(box)) console.log(`  ${k}:`, JSON.stringify(v));

  const inks = {
    "ページ名(cyan)": "#home .pagettl",
    "ふりっぷとは(lime)": "#home .cont02 section:nth-of-type(1) .common_heading .wa",
    "ふりっぷ一覧表(gold)": "#home .cont02 section:nth-of-type(2) .common_heading .wa",
    "新着ふりっぷ(green)": "#home .cont01_news h2 .wa",
  };
  const out = {};
  for (const [name, sel] of Object.entries(inks)) {
    const el = await page.$(sel);
    if (!el) {
      console.log(`  ${name}: 見つからない (${sel})`);
      continue;
    }
    const f = path.join(OUT, `ink-${name.replace(/[^a-z]/gi, "")}.png`);
    await el.screenshot({ path: f });
    out[name] = f;
  }
  fs.writeFileSync(path.join(OUT, "ink-list.json"), JSON.stringify(out, null, 1));
  console.log("  塗りの高さは python で測る → shots/ink-list.json");
  await browser.close();
  process.exit(0);
}

/* ── 初見の版面を数字で書き出す ───────────────────────
   撮った絵の差分だけでは足りない。このページは new.gif（14コマのGIF）と
   グラデの題字があって、同じ状態でも撮るたびに数百画素ゆれる。
   だから「全要素の位置と大きさ」を数字で出して、そちらを厳密に比べる。 */
if (mode === "geom") {
  await page.addStyleTag({ content: FREEZE });
  await sleep(200);
  const dump = await page.evaluate(() => {
    const out = [];
    const walk = (el, path) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      out.push(
        [
          path,
          r.x.toFixed(2), r.y.toFixed(2), r.width.toFixed(2), r.height.toFixed(2),
          s.display, s.position, s.color, s.backgroundColor, s.backgroundImage,
          s.fontSize, s.fontWeight, s.transform, s.opacity, s.visibility,
          s.borderTopWidth, s.borderTopColor, s.textDecorationLine, s.zIndex,
        ].join(" | "),
      );
      [...el.children].forEach((c, i) => walk(c, `${path}>${c.tagName.toLowerCase()}.${c.className || "-"}[${i}]`));
    };
    walk(document.documentElement, "html");
    return out.join("\n") + `\n#scrollHeight ${document.documentElement.scrollHeight}`;
  });
  const f = path.join(OUT, `${tag}-geom.txt`);
  fs.writeFileSync(f, dump);
  console.log(f, dump.split("\n").length + "行");
  await browser.close();
  process.exit(0);
}

/* ── 初見の状態を撮るだけ ─────────────────────────── */
if (mode === "base") {
  await page.addStyleTag({ content: FREEZE });
  await sleep(200);
  await shot(`${tag}-base-top`);
  await page.evaluate(() => window.scrollTo(0, 1400));
  await sleep(200);
  await shot(`${tag}-base-mid`);
  await page.evaluate(() => window.scrollTo(0, 2800));
  await sleep(200);
  await shot(`${tag}-base-bottom`);
  await browser.close();
  if (problems.length) console.log("--- ページ内のエラー ---", problems.join("\n"));
  process.exit(0);
}

/* ── 補間があるか／ないか ─────────────────────────────
   1字押した2フレーム後の姿を見る。
   ふつうは 0.18s かけて返る途中（scaleY が1と-1の間）。
   「動きを減らす」設定では、その場で -1 になっていないといけない。 */
const midway = await page.evaluate(
  () =>
    new Promise((res) => {
      const el = document.querySelector('[data-flip-index="0"]');
      el.click();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => res(getComputedStyle(el).transform)),
      );
    }),
);
await page.click('[data-flip-index="0"]'); // 元に戻しておく
await sleep(300);
const sy = Number(midway.match(/matrix\(([-\d.]+), 0, 0, ([-\d.]+)/)?.[2] ?? NaN);
console.log(
  `[補間] 押した2フレーム後の scaleY = ${sy}` +
    (reduce
      ? sy === -1
        ? "  → 動きを減らす設定: その場で返っている（正しい）"
        : "  → ★おかしい: 減らす設定なのに途中がある"
      : sy > -1 && sy < 1
        ? "  → ふつう: 0.18秒かけて返っている途中（正しい）"
        : "  → ★おかしい: 途中が無い"),
);

/* ── 仕掛け1: 天のタイトルを1字ずつ押す ───────────────── */
console.log("[仕掛け1] 天のタイトル「ふりっぷ」を1字ずつ押す");
await say("押す前");
for (const i of [0, 1, 2]) {
  await page.click(`[data-flip-index="${i}"]`);
  await sleep(260);
}
await shot(`${tag}-1a-three`, { x: 0, y: 0, width: W, height: 420 });
await say("3字だけ返した");

await page.click('[data-flip-index="3"]');
await sleep(500);
await shot(`${tag}-1b-upside`);
await say("4字そろった＝天地が逆さ");

/* もどせるか。どれか1字を押す */
await page.click('[data-flip-index="3"]');
await sleep(500);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(200);
await shot(`${tag}-1c-back`);
await say("もう一度押してもどした");

/* もう一度返して、こんどは Esc でもどす（保険の口）。
   いま返っていない字だけを押す */
const flipAll = async () => {
  const todo = await page.evaluate(() =>
    [...document.querySelectorAll("[data-flip-index]")]
      .filter((el) => !el.classList.contains("is-upsidedown"))
      .map((el) => el.dataset.flipIndex),
  );
  for (const i of todo) {
    await page.click(`[data-flip-index="${i}"]`);
    await sleep(140);
  }
};
await flipAll();
await sleep(400);
await say("もう一度そろえた（壁紙が次の色に）");
await shot(`${tag}-1d-upside2`);
await page.keyboard.press("Escape");
await sleep(400);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(200);
await shot(`${tag}-1e-esc`);
await say("Escでもどした");

/* ── 仕掛け2: flip と打つ ──────────────────────────── */
console.log("[仕掛け2] キーボードで flip と打つ");
const TABLE = "#home .cont02 table";
await shot(`${tag}-2a-table-before`, await around(TABLE, 24));
await page.keyboard.type("flip", { delay: 90 });
/* 打った直後。ふつうは表が潰れている途中、減らす設定では潰さない */
const shut = await page.evaluate(() => ({
  cls: document.body.className,
  t: getComputedStyle(document.querySelector("#home .cont02 table")).transform,
}));
console.log(
  `[補間] 打った直後の表 = ${shut.t} (body="${shut.cls}")` +
    (reduce
      ? shut.t === "none"
        ? "  → 減らす設定: 潰さずに入れ替えるだけ（正しい）"
        : "  → ★おかしい"
      : shut.t.startsWith("matrix")
        ? "  → ふつう: ぺたんと閉じている（正しい）"
        : "  → ★おかしい"),
);
/* 閉じかけの一瞬（＝昔のHPの slideUp と同じ調子）も撮る */
await sleep(140);
await shot(`${tag}-2b-shutting`, await around(TABLE, 24));
await sleep(700);
await shot(`${tag}-2c-table-after`, await around(TABLE, 24));
await say("flip と打った＝表がひっくり返る");
/* 表の下の巨大な黄色い矢印。上を向いているはず */
await shot(`${tag}-2d-arrow`, await around("#home .yarrow", 40));
await page.keyboard.type("flip", { delay: 90 });
await sleep(700);
await say("もう一度打ってもどした");
await shot(`${tag}-2e-table-back`, await around(TABLE, 24));
await shot(`${tag}-2f-arrow-back`, await around("#home .yarrow", 40));

/* うっかり打っても起きないか */
await page.keyboard.type("flap", { delay: 60 });
await page.keyboard.type("fl", { delay: 60 });
await sleep(3000);
await page.keyboard.type("ip", { delay: 60 });
await sleep(400);
await say("flap と、間をあけた fl…ip では起きない");

/* ── 仕掛け3: 電光掲示板を掴む ──────────────────────── */
console.log("[仕掛け3] 電光掲示板を掴んで引っぱる");
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(300);
const BOARD = "#home .marquee";

/** 掲示板を掴んで dy だけ引っぱってはなす。途中を撮りたいときは mid を渡す */
const pull = async (dy, mid) => {
  const b = await page.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, BOARD);
  await page.mouse.move(b.x, b.y);
  await page.mouse.down();
  const step = dy / 6;
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(b.x, b.y + step * i);
    await sleep(30);
  }
  if (mid) await mid();
  await page.mouse.up();
  await sleep(400);
};

await shot(`${tag}-3a-board-before`, await around(BOARD, 40, 200));

/* 少しだけ引っぱってはなす＝何も起きない（＝偶然では起きない） */
await pull(20, async () => {
  await shot(`${tag}-3b-drag-half`, await around(BOARD, 60, 240));
});
await say("20pxだけ引っぱってはなした（起きないのが正しい）");

/* しっかり引っぱる */
await pull(60, async () => {
  await shot(`${tag}-3c-drag-full`, await around(BOARD, 60, 240));
});
await shot(`${tag}-3d-board-flipped`, await around(BOARD, 40, 200));
await say("60px引っぱった＝掲示板がひっくり返る");

/* もう一度、こんどは上へ引っぱってもどす */
await pull(-60);
await shot(`${tag}-3e-board-back`, await around(BOARD, 40, 200));
await say("上へ引っぱってもどした");

/* ── 3つ全部かけてから、Esc で全部もどす ─────────────────
   掲示板から先にやる。天地が返ると掲示板の居場所も変わるので */
console.log("[まとめ] 3つ全部かける → Esc で全部もどす");
await pull(60);
await page.keyboard.type("flip", { delay: 80 });
await sleep(600);
await flipAll();
await sleep(800);
await say("3つ全部");
await shot(`${tag}-4a-all`);
await page.keyboard.press("Escape");
await sleep(600);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(300);
await say("Escで全部もどした");
/* もどったあとの見た目を、動きを止めて撮る（基準と1pxで比べるため） */
await page.addStyleTag({ content: FREEZE });
await sleep(250);
await shot(`${tag}-4b-after-esc-top`);
await page.evaluate(() => window.scrollTo(0, 1400));
await sleep(200);
await shot(`${tag}-4b-after-esc-mid`);
await page.evaluate(() => window.scrollTo(0, 2800));
await sleep(200);
await shot(`${tag}-4b-after-esc-bottom`);

await browser.close();
if (problems.length) {
  console.log("--- ページ内のエラー ---");
  for (const p of problems) console.log(p);
} else {
  console.log("ページ内のエラーなし");
}
