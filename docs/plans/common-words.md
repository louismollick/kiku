# Plan: Common Words in the Kanji Tooltip

Status: implemented on feat/common-words. Common Words gzip is ~930 KB (over the ~500 KB estimate; accepted). Terms are defined in `/CONTEXT.md`.

## Goal

When you tap a kanji on the back of a card, the **Kanji Tooltip** shows the 5 most frequent jpdb words that contain it. Each row has a short gloss, so you can see at a glance what the kanji broadly means in real words. **Deck Words** are highlighted. The existing Kanji Web sections and KanjiPage stay as they are.

It must work offline on AnkiMobile (iOS), AnkiDroid, desktop and AnkiWeb, and should be fit to PR upstream to youyoumu/kiku.

## Decisions

- **Static data, built once.** Common Words are the same for every user, so they ship as build-time data inside the existing `_kiku_db_main.tar`. This replaces the Lapis Lookup approach (per-note `KanjiLookupData` field, desktop addon, 10 MB of sharded Jitendex HTML) and doesn't use yomitan-core.
- **Sources**, all fetched automatically by the build:
  - Word list: `[Kanji] JPDB Kanji.zip` (MarvNC/yomichan-dictionaries, 2022, latest). Each kanji entry's definitions list up to about 15 words, in order, until the `漢字分解:` marker.
  - Rank and reading: `JPDB_v2.2_Frequency_Kana_2024-10-13.zip` (Kuuuube/yomitan-dictionaries). Use the best rank across the term's readings, and the reading that has it.
  - Glosses: JMdict through kiku's existing `preprocess/parse-jmdict.ts`, keeping glosses and part-of-speech tags (noun, godan verb, な-adjective and so on). Replace the manual `JMdict_e` download with an automatic fetch.
- **Row selection:** 5 per kanji, ordered by jpdb rank. Leave out the card's own expression and words with no JMdict match, filling the next slot from the remaining candidates. Deck Words count toward the 5.
- **Row display:** word, reading, one-line gloss (first sense), then a muted jpdb rank (`1,234`, no prefix, matching the card's FreqSort number) at the end. Deck Words are visibly highlighted.
- **Tap:**
  - Deck Word: open the user's own note as a nested card (the existing `"nested"` page).
  - Any other word: expand the row in place to show all its JMdict senses, numbered, with part-of-speech tags.
- **"In deck"** follows the existing `relatedExpressionExcludeNewCards` setting.
- **Placement:** a new section named **Common Words**, first in the tooltip and open by default. No new setting. Users can hide or reorder sections through the existing `KanjiInfoExtra` plugin slot.
- **Core change, not a plugin.** It is the better product (shared loader, sections and settings) and can be PR'd.

## Out of scope

- Adding notes from a card (AnkiMobile `anki://x-callback-url/addnote`). A bare note would be worse than one mined with Yomitan.
- Jitendex rendering, which brings example sentences and nicer formatting. If JMdict senses turn out to be too thin in practice, swapping it in only touches the generator and the expanded-row component.
- Common Words in KanjiPage.
- Retiring Lapis Lookup in `~/code/lapis`. Do it later, once kiku is the daily driver: drop the `KanjiLookupData` field and delete the `_lapis_lookup_store*` media.

## Implementation steps

All paths are relative to `packages/note/`.

1. **Fetch inputs.** Add a download step that writes the JPDB Kanji zip, the JPDB v2.2 Frequency Kana zip and `JMdict_e` into the existing preprocess cache dirs (`tools/paths.ts`). Skip files that are already cached.
2. **Keep glosses and part of speech.** Extend `preprocess/parse-jmdict.ts` to keep `pos` per sense in the intermediate term data. Glosses are already extracted there, then dropped later.
3. **Generate the data.** In `preprocess/generate-kiku-db-main.ts`, build `kiku_db_common_words.json.gz` and add it to the tar and manifest as a separate file, so it loads lazily on its own.
   - Use a compact shape like the existing `*_compact` files: `{ [kanji]: [word, reading, rank, senses: [pos[], glosses[]][]][] }`.
   - Store about 6 candidates per kanji, so the card can leave out its own expression and still show 5.
   - Put the pure selection logic in its own module with a vitest test (the 発 and 生 cases, the no-gloss skip, best-reading choice).
4. **Worker API.** Add `lookupCommonWords(kanji)` to `src/worker/WorkerThreadApi.ts`, following `lookupKanji` (:303): lazy Range fetch, `DecompressionStream`, cached in memory.
5. **Deck Word detection.** Reuse the same-kanji results `KanjiContext` already gets through `workerApi.queryShared` (`src/lazy/contexts/KanjiContext.tsx:69-90`). A word is a Deck Word when a note's Expression equals it, respecting `relatedExpressionExcludeNewCards`.
6. **UI.** Add a `CommonWords` section in `src/lazy/components/KanjiInfo.tsx`.
   - It goes first and is open by default (see the default-open list at :327-331).
   - Rows follow the existing section styling.
   - Deck Word tap: navigate to the nested card, the way `KanjiPage.tsx:508-510` and `Back.tsx:80-93` do.
   - Other rows toggle an inline sense list.
   - Add `CommonWords` to `sections` in `plugins/plugin-types.ts` (:198) and to the layout override (`KanjiInfo.tsx:354-367`).
7. **Docs.** Update `apps/docs/mds/features.md` (Kanji Tooltip / Common Words), `how-things-work.md` (new db file) and `custom-kanji-info-extra.md` (new section key). Add JMdict (CC BY-SA, EDRDG) and jpdb attribution wherever the existing data credits live.

## Done when

- `pnpm typecheck`, `pnpm test`, `pnpm lint` and `pnpm format` pass in `packages/note`.
- `kiku_db_common_words.json.gz` is under about 500 KB, and the tar grows by about that much.
- On desktop (`pnpm apply`), tapping 発 on a 発表 card shows 5 Common Words, leaves out 発表, highlights Deck Words, opens a Deck Word as a nested card, and expands a non-deck word to show its senses.
- The same works on AnkiMobile after a sync, including the X dismiss button and scrolling.
- Existing tooltip sections, KanjiPage and Kanji Web behave exactly as before.

## Execution

Delegate steps 1 to 7 to Codex with this doc as the brief. Then review the diff and run `codex-adversarial-review`. On-device checks on AnkiMobile are manual.
