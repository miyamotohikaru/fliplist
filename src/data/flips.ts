// ふりっぷ一覧のデータ。
// 出典: こす.くま 進行管理スプレッドシート
// https://docs.google.com/spreadsheets/d/1RM2gRMeJ6mcxJxplYKXFKPl4AEpz3u19an96h5zyOCE/
// 行の並び・タイトル・URL・内容はシートの内容をそのまま採用している（勝手に足さない）。

export type FlipStatus = "released" | "done" | "wip" | "idea";

export type Flip = {
  /** ファイル名やDOM idに使う識別子 */
  slug: string;
  /** カセット左上の型番。ファミコンの HVC-** に倣った2文字 */
  code: string;
  /** シートのタイトルそのまま */
  title: string;
  /** ラベル上段に小さく入れるよみがな */
  kana: string;
  /** ラベル下に入れる欧文表記 */
  romaji: string;
  /** シートの「内容」列。空のものは実物を見て補う */
  desc: string;
  /** クリック先。空文字は未公開＝差し込めないカセット */
  url: string;
  /** シートの「ステータス」＋「リリース済み」から導いた状態 */
  status: FlipStatus;
  /** シートの「リリース日」 YYYY-MM-DD */
  date: string;
  /** シートの「担当」 */
  owner: string;
  /** カセット外装のプラスチック色。実機のバリエーションに倣う */
  shell: string;
};

export const FLIPS: Flip[] = [
  {
    slug: "black-hole",
    code: "HVC-BH",
    title: "ブラックホール",
    kana: "ぶらっくほーる",
    romaji: "BLACK HOLE",
    desc: "ブラウザのテキストを◇ブラックホールに引き込みます",
    url: "https://chromewebstore.google.com/detail/pcgemjhemgdmnpdhkeimaeojjmmdcdkb?utm_source=item-share-cb",
    status: "released",
    date: "2026-06-17",
    owner: "すのはら",
    shell: "black",
  },
  {
    slug: "lifespan",
    code: "HVC-JS",
    title: "寿命測定",
    kana: "じゅみょうそくてい",
    romaji: "LIFE SPAN",
    desc: "質問に答えて寿命を◆計算します",
    url: "https://nagaikisitaiyone.kosukuma.com/",
    status: "released",
    date: "2026-06-27",
    owner: "すのはら",
    shell: "white",
  },
  {
    slug: "friends",
    code: "HVC-TG",
    title: "ともだちジェネレーター",
    kana: "ともだちじぇねれーたー",
    romaji: "FRIEND GENERATOR",
    desc: "アップロードされた写真に◆友達を増やします",
    url: "https://ineedfriends.kosukuma.com/",
    status: "released",
    date: "2026-07-18",
    owner: "すのはら",
    shell: "skyblue",
  },
  {
    slug: "words",
    code: "HVC-KJ",
    title: "存在しない言葉辞典",
    kana: "そんざいしないことばじてん",
    romaji: "UNREAL WORDS",
    desc: "世の中にない言葉を◆辞書に登録できます",
    url: "https://nonexistent-words-dictionary.kosukuma.com/",
    status: "released",
    date: "2026-07-25",
    owner: "宮本",
    shell: "maroon",
  },
  {
    slug: "throw",
    code: "HVC-TW",
    title: "throw to win",
    kana: "すろーとぅーうぃん",
    romaji: "THROW TO WIN",
    desc: "スマホを高く投げた人が◆勝つゲーム",
    url: "https://throwtowin.kosukuma.com/",
    status: "released",
    date: "2026-08-02",
    owner: "すのはら",
    shell: "yellow",
  },
  {
    slug: "osyaberi",
    code: "HVC-MK",
    title: "元も子もないこすくまくん",
    kana: "もともこもないこすくまくん",
    romaji: "BLUNT BEAR",
    desc: "チャット形式で◆こすくまくんと遊べます",
    url: "https://osyaberi.kosukuma.com/",
    status: "done",
    date: "2026-08-08",
    owner: "すのはら",
    shell: "pink",
  },
  {
    slug: "moth",
    code: "HVC-HI",
    title: "飛んで火に入る虫",
    kana: "とんでひいるむし",
    romaji: "MOTH TO A FLAME",
    desc: "焚き火のまわりにきれいな円を◆描いて競うゲーム",
    url: "https://moth-flame.kosukuma.com/",
    status: "done",
    date: "2026-08-15",
    owner: "宮本",
    shell: "navy",
  },
  {
    slug: "creature",
    code: "HVC-IS",
    title: "生き物の視点",
    kana: "いきもののしてん",
    romaji: "CREATURE VISION",
    desc: "アップロードされた写真が◇様々な生物の視点で見れます",
    url: "https://creature-vision.kosukuma.com/",
    status: "done",
    date: "2026-08-22",
    owner: "宮本",
    shell: "green",
  },
  {
    slug: "hitodasuke",
    code: "HVC-IH",
    title: "インスタント人助け",
    kana: "いんすたんとひとだすけ",
    romaji: "INSTANT RESCUE",
    desc: "近くの人に助けを求めたり◆駆けつけたりできます",
    url: "https://hitodasukekimotieeeee.kosukuma.com/",
    status: "wip",
    date: "2026-08-29",
    owner: "すのはら",
    shell: "orange",
  },
  {
    slug: "yuragi",
    code: "HVC-YR",
    title: "ゆらぎの拡張機能",
    kana: "ゆらぎのかくちょうきのう",
    romaji: "YURAGI",
    desc: "ブラウザのテキストを◆1/fゆらぎで揺らします",
    url: "",
    status: "wip",
    date: "2026-09-05",
    owner: "宮本",
    shell: "gray",
  },
  {
    slug: "vanished-jobs",
    code: "HVC-KS",
    title: "消えた職業図鑑",
    kana: "きえたしょくぎょうずかん",
    romaji: "VANISHED JOBS",
    desc: "なくなった職業を◆年表や系譜からたどれます",
    url: "https://vanished-jobs-archive.vercel.app",
    status: "wip",
    date: "2026-09-26",
    owner: "宮本",
    shell: "brown",
  },
  {
    slug: "flip-archive",
    code: "HVC-FA",
    title: "世界のFLIP図鑑",
    kana: "せかいのふりっぷずかん",
    romaji: "WORLD FLIP ARCHIVE",
    desc: "常識をひっくり返した企画や◆作品を集めています",
    url: "https://flip-archive.vercel.app",
    status: "wip",
    date: "2026-10-03",
    owner: "宮本",
    shell: "cream",
  },
  {
    slug: "values",
    code: "HVC-KI",
    title: "価値観一覧図鑑",
    kana: "かちかんいちらんずかん",
    romaji: "VALUES ARCHIVE",
    desc: "",
    url: "",
    status: "idea",
    date: "2026-10-10",
    owner: "宮本",
    shell: "purple",
  },
  {
    slug: "kikiippatsu",
    code: "HVC-KK",
    // シートの記載は「超巨大こすくまくん黒髭危機一髪」だが、
    // 棚に並べる名前としてはユーザー指定でこちらを使う（2026-08-11）
    title: "こすくまくん危機一髪",
    kana: "こすくまくんききいっぱつ",
    romaji: "KIKIIPPATSU",
    desc: "世界中の人と1000個の穴に◆剣を刺していくゲーム",
    url: "https://kosukuma-kikiippatsu.vercel.app",
    status: "wip",
    date: "2026-10-17",
    owner: "宮本",
    shell: "red",
  },
  {
    slug: "ads",
    code: "HVC-AD",
    title: "世界一広告の多いゲーム",
    kana: "せかいいちこうこくのおおいげーむ",
    romaji: "TOO MANY ADS",
    desc: "",
    url: "",
    status: "wip",
    date: "2026-10-24",
    owner: "川上",
    shell: "lime",
  },
  {
    slug: "diagnosis",
    code: "HVC-SZ",
    title: "精神病図鑑",
    kana: "せいしんびょうずかん",
    romaji: "DIAGNOSIS ARCHIVE",
    desc: "診断名がいつ生まれ◆どう変わったかを記録しています",
    url: "https://diagnosis-archive-001.vercel.app/",
    status: "wip",
    date: "2026-11-14",
    owner: "宮本",
    shell: "slate",
  },
];

/** ふりっぷの定義。こす.くま本人の言葉なので一字も変えない。 */
export const FLIP_DEFINITION = {
  /** 見出し語の前に置く1行。何の仲間なのかを先に言う */
  lead: "ふりっぷとは、FLIPの一種です。",
  word: "ふりっぷ",
  pos: "【名】",
  gloss: "日常を、ほんの少しひっくり返すきっかけ。",
  body: [
    "「ふりっぷ」は、こす.くまがつくる小さなあそびや実験です。",
    "思いつきを自由なかたちにして、世の中にそっと置いていきます。",
  ],
};
