"use client";

import PixelCanvas from "./PixelCanvas";
import type { PixelGfx } from "@/art/gfx";
import { FLIPS } from "@/data/flips";

const HOME = "https://kosukuma.com/home.html";

const INK = "#1b1a17";
const PAPER = "#efeadc";
const WARN = "#d8452f";
const BLUE = "#2b4ea2";

// ── 注意書きの小箱に入れるピクトグラム（16x16） ───────────────

function icoWarn(g: PixelGfx) {
  for (let y = 1; y < 14; y++) {
    const half = Math.max(1, Math.round((y - 1) * 0.55));
    g.hline(8 - half, y, half * 2, WARN);
  }
  g.hline(2, 14, 12, WARN);
  g.vline(8, 6, 4, PAPER);
  g.px(8, 11, PAPER);
  g.px(7, 11, PAPER);
  g.px(7, 6, PAPER);
  g.px(7, 7, PAPER);
  g.px(7, 8, PAPER);
  g.px(7, 9, PAPER);
}

function icoInsert(g: PixelGfx) {
  // 上に浮いたカセット
  g.rect(3, 1, 10, 5, INK);
  g.rect(5, 2, 6, 2, PAPER);
  // 下向きの矢印
  g.vline(8, 6, 3, BLUE);
  g.vline(7, 6, 3, BLUE);
  g.hline(5, 9, 6, BLUE);
  g.hline(6, 10, 4, BLUE);
  g.hline(7, 11, 2, BLUE);
  // 差込口
  g.rect(1, 13, 14, 3, INK);
  g.rect(4, 13, 8, 1, PAPER);
}

function icoWip(g: PixelGfx) {
  g.ring(8, 8, 7, INK, 2);
  g.vline(8, 4, 5, INK);
  g.hline(8, 8, 4, INK);
  g.px(8, 8, WARN);
  g.px(9, 8, WARN);
}

function icoHome(g: PixelGfx) {
  for (let i = 0; i < 8; i++) {
    g.hline(8 - i, 1 + i, i * 2 + 1, i < 6 ? INK : INK);
  }
  g.rect(3, 8, 11, 7, INK);
  g.rect(5, 10, 3, 5, PAPER);
  g.rect(10, 10, 3, 3, PAPER);
  g.hline(0, 8, 16, INK);
}

const ICONS = { warn: icoWarn, insert: icoInsert, wip: icoWip, home: icoHome };

function Notice({
  icon,
  head,
  en,
  children,
}: {
  icon: keyof typeof ICONS;
  head: string;
  en: string;
  children: React.ReactNode;
}) {
  return (
    <div className="notice">
      <div className="notice-ico">
        <PixelCanvas w={16} h={16} scale={2} draw={ICONS[icon]} />
      </div>
      <div className="notice-txt">
        <span className="notice-head">
          {head}
          <b className="en">{en}</b>
        </span>
        <span className="notice-body">{children}</span>
      </div>
    </div>
  );
}

export default function Colophon() {
  const n = FLIPS.length;
  const by = (s: string) => FLIPS.filter((f) => f.status === s).length;
  // 棚に出しているのは「いま遊べるか」の二択だけ。それ以外は COMING SOON。
  const live = FLIPS.filter((f) => f.status === "released" && f.url).length;

  return (
    <footer className="colophon" id="colophon">
      <div className="hr2" />

      <div className="colo-top">
        <div className="colo-head">
          <h2 className="colo-title en">
            THE FLIP
            <br />
            CATALOGUE.
          </h2>
          <span className="colo-mark">
            奥付
            <b className="en">COLOPHON</b>
          </span>
        </div>

        <div className="colo-note">
          <div className="colo-note-head en">ABOUT THIS CATALOGUE</div>
          <p>
            この図録は、株式会社こす.くまがつくった「ふりっぷ」を、思いついた順にならべたものです。
            いま{n}本。1本ずつにカセットの絵をつけました。同じ絵は1枚もありません。
          </p>
          <p>
            いま遊べるのは{live}本です。残りは色を落として COMING SOON にしてあります。
            出来上がったら、色がついて押せるようになります。
          </p>
          <p>
            {/* 冊数を数え上げて終わりにしない。棚はこれからも増える。 */}
            ふりっぷは随時ふえていきます。この棚も、そのたびに増やしていきます。
          </p>
          <p>
            カセットを押すと、それぞれのふりっぷが別のまどで開きます。
            つくっている途中のものは、予告なく変わったり、なくなったりします。
          </p>
        </div>

        <dl className="colo-spec">
          <div>
            <dt className="en">ISSUED</dt>
            <dd>株式会社こす.くま</dd>
          </div>
          <div>
            <dt className="en">ENTRIES</dt>
            <dd>
              全{n}本／公開中{by("released")}・完成{by("done")}・制作中{by("wip")}・構想
              {by("idea")}
            </dd>
          </div>
          <div>
            <dt className="en">PLATES</dt>
            <dd>カセット{n}本・ラベル{n}枚／すべて描画プログラム</dd>
          </div>
          <div>
            <dt className="en">TYPE</dt>
            <dd>DotGothic16（和文）／Press Start 2P（欧文）</dd>
          </div>
          <div>
            <dt className="en">EDITION</dt>
            <dd>随時更新</dd>
          </div>
        </dl>
      </div>

      <div className="notices">
        <Notice icon="warn" head="注意" en="CAUTION">
          色の落ちたカセットはまだ差し込めません。押しても何も起きません。
        </Notice>
        <Notice icon="insert" head="差込" en="INSERT">
          カセットを押すと、別のまどでふりっぷが開きます。
        </Notice>
        <Notice icon="wip" head="制作中" en="IN PROGRESS">
          COMING SOON のものは、出来上がる時期が前後することがあります。
        </Notice>
        <Notice icon="home" head="本体" en="HOME">
          ここは棚です。会社の入口はとなりにあります。
        </Notice>
      </div>

      <div className="colo-foot">
        <a className="back" href={HOME}>
          <span className="back-arrow en">&lt;&lt;</span>
          <span className="back-jp">株式会社こす.くま へもどる</span>
          <span className="back-url en">KOSUKUMA.COM</span>
        </a>
        <p className="colo-copy en">&copy; KOSU.KUMA CO.,LTD.</p>
      </div>

      <div className="endbar">
        <span className="k12">ふりっぷ図録 随時更新</span>
        <span className="endbar-fill" aria-hidden />
        <span className="k8 en">001 &mdash; 016 / KOSU.KUMA</span>
      </div>
    </footer>
  );
}
