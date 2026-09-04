import { FLIPS, type Flip } from "@/data/flips";

/** 「2026-08-02」→「2026年08月02日」。会社HPの最新情報と同じ書き方 */
export function jpDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}年${m}月${d}日`;
}

/**
 * 一時的な総スイッチ。true のあいだは status や url に関係なく全16本を
 * 「工事中」扱いにし、カセットの絵も名前も押せなくする（データ自体は
 * 変えない）。**2026-09-05 に false へ戻した**（それまでは全本工事中だった）。
 *
 * これ以降、公開されるかどうかは flips.ts の status と url だけで決まる。
 * status を "released" にして url を入れれば、その1本が公開中になる。
 */
const ALL_UNDER_CONSTRUCTION = false;

/** いま遊べるもの。公開済みで行き先があるものだけ */
export function isOpen(f: Flip): boolean {
  if (ALL_UNDER_CONSTRUCTION) return false;
  return f.status === "released" && Boolean(f.url);
}

/**
 * 押せるもの。以前は行き先(url)があるだけで押せてしまい、「工事中」の
 * 札が付いた実験（例: 消えた職業図鑑）が実は押せる、という食い違いが
 * あった。押せる条件は isOpen と揃える。
 */
export function canOpen(f: Flip): boolean {
  return isOpen(f);
}

/** 公開中のもの、新しい順 */
export const OPENED: Flip[] = FLIPS.filter(isOpen)
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : -1));

/** 押せないもの（＝工事中）の本数。注記の文言をここから出す */
export const CLOSED_COUNT = FLIPS.length - OPENED.length;

/** new.gif を付けるもの。更新履歴のあたらしい2行だけ */
export const NEW_SLUGS: string[] = OPENED.slice(0, 2).map((f) => f.slug);

/**
 * 更新履歴。
 * 当時のホームページの「更新履歴」は、そのページ自身に何をしたかの記録だった。
 * ここも同じで、日付は flips.ts の公開日をそのまま使い、
 * 「そのふりっぷをこの一覧にくわえた日」として書く（データは読むだけ）。
 */
export type LogLine = {
  date: string;
  text: string;
  /** その行が指すふりっぷ。ページ自身の記録には無い */
  slug?: string;
};

/** このページをつくった日 */
export const PAGE_MADE = "2026-08-12";

export const HISTORY: LogLine[] = [
  { date: PAGE_MADE, text: "このページ「ふりっぷ一覧」をつくりました。" },
  ...OPENED.map((f) => ({
    date: f.date,
    text: `「${f.title}」をくわえました。`,
    slug: f.slug,
  })),
]
  // 節の下に「※あたらしいものが上です」と書いてあるので、日付の新しい順にそろえる。
  // ページをつくった日(2026-08-12)より新しい公開が出てくると、
  // それを先頭に置いたままでは順番が狂う（2026-09-05 の公開で表に出た）。
  // 同じ日付のときは、あとから足したものが上（公開のほうがページ作成より下に来ない）。
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
