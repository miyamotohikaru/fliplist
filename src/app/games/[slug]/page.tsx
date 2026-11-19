import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Cartridge from "@/components/Cartridge";
import SubPage from "@/components/retro/SubPage";
import { OPENED } from "@/components/retro/util";
import { GUIDES } from "@/data/guides";

/** 公開中で、説明のあるものだけページを作る。工事中のものは作らない */
const LIST = OPENED.filter((f) => GUIDES[f.slug]);

export const dynamicParams = false;

export function generateStaticParams() {
  return LIST.map((f) => ({ slug: f.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = LIST.find((x) => x.slug === slug);
  if (!f) return {};
  return {
    title: `${f.title}の遊び方 | 株式会社こす.くま`,
    description: GUIDES[slug].lead,
  };
}

/** 文の中の改行（\n）を <br> にする。改行の位置は guides.ts の文に直接書く */
function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <>
      {parts.map((t, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {t}
        </span>
      ))}
    </>
  );
}

/** 行き先の言い方。Chrome の拡張機能は配布ページへ、それ以外はゲーム本体へ */
function playLabel(url: string): string {
  if (/chromewebstore\.google\.com|h1\.nu/.test(url))
    return "▶ Chrome ウェブストアで見る";
  return `▶ あそぶ（${new URL(url).host}）`;
}

/**
 * 1本ずつの説明ページ。
 * 頭にそのふりっぷのカセット（一覧と同じ絵）、ひとこと、あそぶ道。
 * そのあと「どんなもの？」「遊び方・操作」「こだわり・ポイント」「遊べる環境」。
 * 最後に前後のふりっぷへの道（公開日のあたらしい順）。
 */
export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const i = LIST.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const f = LIST[i];
  const g = GUIDES[slug];
  const newer = LIST[i - 1];
  const older = LIST[i + 1];
  const len = [...f.title].length;

  return (
    <SubPage
      title={f.title}
      titleSize={len > 12 ? 40 : len > 8 ? 48 : 56}
      crumbs={[{ label: "ゲームの遊び方", href: "/games" }, { label: f.title }]}
    >
      <section>
        <div className="doc">
          <div className="game-head">
            <a
              className="cartlink"
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              aria-hidden
            >
              <Cartridge flip={f} scale={3} animate flat />
            </a>
            <div className="game-head__txt">
              <p className="game-lead">
                <Lines text={g.lead} />
              </p>
              <p className="game-play">
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {playLabel(f.url)}
                </a>
              </p>
            </div>
          </div>

          <h2>どんなもの？</h2>
          {g.about.map((p) => (
            <p key={p}>
              <Lines text={p} />
            </p>
          ))}

          <h2>遊び方・操作</h2>
          <ol>
            {g.howto.map((p) => (
              <li key={p}>
                <Lines text={p} />
              </li>
            ))}
          </ol>

          <h2>こだわり・ポイント</h2>
          {g.point.map((p) => (
            <p key={p}>
              <Lines text={p} />
            </p>
          ))}

          <h2>遊べる環境</h2>
          {g.env.map((p) => (
            <p key={p}>
              <Lines text={p} />
            </p>
          ))}
        </div>

        <p className="game-nav">
          {newer ? (
            <a href={`/games/${newer.slug}`}>◀ {newer.title}</a>
          ) : (
            <span />
          )}
          <a href="/games">遊び方の一覧へ</a>
          {older ? (
            <a href={`/games/${older.slug}`}>{older.title} ▶</a>
          ) : (
            <span />
          )}
        </p>
      </section>
    </SubPage>
  );
}
