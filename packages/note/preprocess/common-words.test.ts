import { describe, expect, it } from "vitest";
import { selectCommonWords, type JpdbFrequencyRow, type JpdbKanjiRow } from "./common-words";
import type { JmdictTerm } from "./parse-jmdict";

describe("selectCommonWords", () => {
  it("ranks 発 and 生, skips words without glosses, and chooses the best reading", () => {
    const kanjiRows: JpdbKanjiRow[] = [
      ["発", "", "", "", ["発表", "発見", "発言", "漢字分解:", "癶"], {}],
      ["生", "", "", "", ["先生", "生活", "生きる", "漢字分解:", "土"], {}],
    ];
    const frequencyRows: JpdbFrequencyRow[] = [
      ["発表", "freq", { reading: "はっぴょう", frequency: { value: 100 } }],
      ["発見", "freq", { reading: "はつけん", frequency: { value: 90 } }],
      ["発見", "freq", { reading: "はっけん", frequency: { value: 20 } }],
      ["発言", "freq", { reading: "はつげん", frequency: { value: 5 } }],
      ["先生", "freq", { reading: "せんせい", frequency: { value: 30 } }],
      ["生活", "freq", { reading: "せいかつ", frequency: { value: 50 } }],
      ["生きる", "freq", { reading: "いきる", frequency: { value: 10 } }],
    ];
    const term = (word: string, reading: string, glosses: string[]): JmdictTerm => ({
      forms: [word],
      reading: [reading],
      meanings: glosses,
      senses: glosses.length ? [{ pos: ["noun"], glosses, stagr: [], stagk: [] }] : [],
      antonym: [],
      referenced: [],
    });
    const terms = [
      term("発表", "はっぴょう", ["announcement"]),
      term("発見", "はつけん", ["wrong reading"]),
      term("発見", "はっけん", ["discovery", "finding"]),
      term("発言", "はつげん", []),
      term("先生", "せんせい", ["teacher"]),
      term("生活", "せいかつ", ["life"]),
      term("生きる", "いきる", ["to live"]),
    ];

    const result = selectCommonWords(kanjiRows, frequencyRows, terms);
    expect(result["発"].map(([word]) => word)).toEqual(["発見", "発表"]);
    expect(result["発"][0]).toEqual([
      "発見",
      "はっけん",
      20,
      [[["noun"], ["discovery", "finding"]]],
    ]);
    expect(result["生"].map(([word]) => word)).toEqual(["生きる", "先生", "生活"]);
  });

  it("ignores kana-usage ranks and limits stored senses and glosses", () => {
    const word = "事";
    const term: JmdictTerm = {
      forms: [word],
      reading: ["こと"],
      meanings: [],
      senses: Array.from({ length: 6 }, (_, index) => ({
        pos: ["n"],
        glosses: ["one", "two", "three", "four", String(index)],
        stagr: [],
        stagk: [],
      })),
      antonym: [],
      referenced: [],
    };
    const result = selectCommonWords(
      [
        [word, "", "", "", [word], {}],
        ["為", "", "", "", ["為る"], {}],
      ],
      [
        [word, "freq", { reading: "こと", frequency: { value: 15, displayValue: "15㋕" } }],
        [word, "freq", { reading: "こと", frequency: { value: 497, displayValue: "497" } }],
        ["為る", "freq", { reading: "する", frequency: { value: 11, displayValue: "11㋕" } }],
        ["為る", "freq", { reading: "する", frequency: { value: 34586, displayValue: "34586" } }],
      ],
      [{ ...term, forms: ["為る"], reading: ["する"] }, term],
    );
    expect(result[word][0][2]).toBe(497);
    expect(result["為"][0][2]).toBe(34586);
    expect(result[word][0][3]).toHaveLength(5);
    expect(result[word][0][3][0][1]).toEqual(["one", "two", "three"]);
  });

  it("uses only senses allowed for the spelling and reading", () => {
    const term: JmdictTerm = {
      forms: ["嚏", "嚔"],
      reading: ["くしゃみ", "くさめ"],
      meanings: [],
      senses: [
        { pos: ["n"], glosses: ["sneeze"], stagr: ["くしゃみ"], stagk: ["嚏"] },
        { pos: ["n"], glosses: ["old sneeze"], stagr: ["くさめ"], stagk: ["嚔"] },
      ],
      antonym: [],
      referenced: [],
    };
    const result = selectCommonWords(
      [
        ["嚏", "", "", "", ["嚏"], {}],
        ["嚔", "", "", "", ["嚔"], {}],
      ],
      [
        ["嚏", "freq", { reading: "くさめ", frequency: { value: 10 } }],
        ["嚏", "freq", { reading: "くしゃみ", frequency: { value: 100 } }],
        ["嚔", "freq", { reading: "くしゃみ", frequency: { value: 5 } }],
        ["嚔", "freq", { reading: "くさめ", frequency: { value: 200 } }],
      ],
      [term],
    );
    expect(result["嚏"][0][1]).toBe("くしゃみ");
    expect(result["嚏"][0][3]).toEqual([[["n"], ["sneeze"]]]);
    expect(result["嚔"][0][1]).toBe("くさめ");
    expect(result["嚔"][0][3]).toEqual([[["n"], ["old sneeze"]]]);
  });
});
