import type { LabelArt } from "./types";
import { art as art_black_hole } from "./black-hole";
import { art as art_lifespan } from "./lifespan";
import { art as art_friends } from "./friends";
import { art as art_words } from "./words";
import { art as art_throw } from "./throw";
import { art as art_osyaberi } from "./osyaberi";
import { art as art_moth } from "./moth";
import { art as art_creature } from "./creature";
import { art as art_hitodasuke } from "./hitodasuke";
import { art as art_yuragi } from "./yuragi";
import { art as art_vanished_jobs } from "./vanished-jobs";
import { art as art_flip_archive } from "./flip-archive";
import { art as art_values } from "./values";
import { art as art_kikiippatsu } from "./kikiippatsu";
import { art as art_ads } from "./ads";
import { art as art_diagnosis } from "./diagnosis";

// 並び順は flips.ts と揃えてある。
const ALL: LabelArt[] = [
  art_black_hole,
  art_lifespan,
  art_friends,
  art_words,
  art_throw,
  art_osyaberi,
  art_moth,
  art_creature,
  art_hitodasuke,
  art_yuragi,
  art_vanished_jobs,
  art_flip_archive,
  art_values,
  art_kikiippatsu,
  art_ads,
  art_diagnosis,
];

export const LABELS: Record<string, LabelArt> = Object.fromEntries(
  ALL.map((a) => [a.slug, a]),
);

export type { LabelArt } from "./types";
