import type { JmdictTerm } from "./parse-jmdict.ts";
import type { CommonWord } from "#/src/lib/types.ts";

export type JpdbKanjiRow = [string, string, string, string, string[], Record<string, string>];
export type JpdbFrequencyRow = [
  string,
  string,
  {
    reading?: string;
    frequency?: { value: number; displayValue?: string };
    value?: number;
    displayValue?: string;
  },
];

/** Select the six best JMdict-backed words for each kanji. */
export function selectCommonWords(
  kanjiRows: JpdbKanjiRow[],
  frequencyRows: JpdbFrequencyRow[],
  terms: JmdictTerm[],
): Record<string, CommonWord[]> {
  const sensesByWordAndReading = new Map<string, JmdictTerm["senses"]>();
  for (const term of terms) {
    for (const word of term.forms) {
      for (const reading of term.reading) {
        const key = `${word}\0${reading}`;
        const senses = sensesByWordAndReading.get(key) ?? [];
        senses.push(
          ...term.senses.filter(
            (sense) =>
              (!sense.stagk.length || sense.stagk.includes(word)) &&
              (!sense.stagr.length || sense.stagr.includes(reading)),
          ),
        );
        if (senses.length) sensesByWordAndReading.set(key, senses);
      }
    }
  }

  const frequencies = new Map<string, { reading: string; rank: number }>();
  for (const [word, , data] of frequencyRows) {
    if ((data.frequency?.displayValue ?? data.displayValue)?.endsWith("㋕")) continue;
    const rank = data.frequency?.value ?? data.value;
    if (!rank || rank <= 0) continue;
    const reading = data.reading ?? word;
    if (!sensesByWordAndReading.has(`${word}\0${reading}`)) continue;
    const previous = frequencies.get(word);
    if (!previous || rank < previous.rank) {
      frequencies.set(word, { reading, rank });
    }
  }

  const result: Record<string, CommonWord[]> = {};
  for (const [kanji, , , , words] of kanjiRows) {
    const candidates: CommonWord[] = [];
    const marker = words.indexOf("漢字分解:");
    for (const word of new Set(marker < 0 ? words : words.slice(0, marker))) {
      if (!word || !word.includes(kanji)) continue;
      const frequency = frequencies.get(word);
      if (!frequency) continue;
      const senses = (sensesByWordAndReading.get(`${word}\0${frequency.reading}`) ?? [])
        .filter((sense) => sense.glosses.length)
        .slice(0, 5)
        .map((sense): [string[], string[]] => [
          sense.pos.map((pos) => pos.replaceAll(/[&;]/g, "")),
          sense.glosses.slice(0, 3),
        ]);
      if (!senses.length) continue;
      candidates.push([word, frequency.reading, frequency.rank, senses]);
    }
    candidates.sort((a, b) => a[2] - b[2]);
    if (candidates.length) result[kanji] = candidates.slice(0, 6);
  }
  return result;
}
