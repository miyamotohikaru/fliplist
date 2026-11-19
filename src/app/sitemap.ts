import type { MetadataRoute } from "next";
import { OPENED } from "@/components/retro/util";
import { GUIDES } from "@/data/guides";

const BASE = "https://fliplist.kosukuma.com";

/** 検索エンジン向けの地図。一覧・遊び方（1本ずつ）・運営者情報・プライバシーポリシー */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/` },
    { url: `${BASE}/games` },
    ...OPENED.filter((f) => GUIDES[f.slug]).map((f) => ({
      url: `${BASE}/games/${f.slug}`,
    })),
    { url: `${BASE}/company` },
    { url: `${BASE}/privacy` },
  ];
}
