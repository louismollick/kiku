const VERSION: string =
  // @ts-expect-error: injected by vite
  typeof __VERSION__ !== "undefined" ? __VERSION__ : "unknown";

const COMMIT_SHA: string =
  // @ts-expect-error: injected by vite
  typeof __COMMIT_SHA__ !== "undefined" ? __COMMIT_SHA__ : "unknown";

const assets = {
  "_kiku_config.json": "_kiku_config.json",
  "_kiku_front.html": "_kiku_front.html",
  "_kiku_back.html": "_kiku_back.html",
  "_kiku_style.css": "_kiku_style.css",
  "_kiku_notes_manifest.json": "_kiku_notes_manifest.json",
  "_kiku_db_main.tar": "_kiku_db_main.tar",
  "_kiku_db_main_manifest.json": "_kiku_db_main_manifest.json",
  "_kiku_plugin.js": "_kiku_plugin.js",

  "_kiku.js": "_kiku.js",
  "_kiku_libs.js": "_kiku_libs.js",
  "_kiku_shared.js": "_kiku_shared.js",
  "_kiku_lazy.js": "_kiku_lazy.js",
  "_kiku_worker.js": "_kiku_worker.js",
  "_kiku_plugin.css": "_kiku_plugin.css",
  "_kiku.css": "_kiku.css",
};

export const constants = {
  VERSION: VERSION,
  COMMIT_SHA: COMMIT_SHA,
  NOTE_TYPE: "Kiku",
  CARD_TYPE: "Mining",
  key: {
    "kiku-config": "kiku-config",
    "kiku-latest-version": "kiku-latest-version",
    "kiku-latest-version-checked": "kiku-latest-version-checked",
  },
  assets,
  tar: {
    "kiku_db_kanji_compact.json.gz": "kiku_db_kanji_compact.json.gz",
    "kiku_db_terms_compact.json.gz": "kiku_db_terms_compact.json.gz",
    "kiku_db_common_words.json.gz": "kiku_db_common_words.json.gz",
  },
  IMPORTANT_FILES: [
    assets["_kiku.js"],
    assets["_kiku_libs.js"],
    assets["_kiku_shared.js"],
    assets["_kiku_lazy.js"],
    assets["_kiku_worker.js"],
    assets["_kiku_plugin.js"],
    assets["_kiku_plugin.css"],

    assets["_kiku_front.html"],
    assets["_kiku_back.html"],
    assets["_kiku_style.css"],
    assets["_kiku.css"],

    assets["_kiku_db_main.tar"],
    assets["_kiku_db_main_manifest.json"],
    assets["_kiku_notes_manifest.json"],
  ],
};

export type Constants = typeof constants;
