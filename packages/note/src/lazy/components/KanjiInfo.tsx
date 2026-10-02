import {
  type Resource,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  createUniqueId,
  ErrorBoundary,
  For,
  Show,
} from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { useNavigationTransition } from "#/src/hooks/transition";
import { capitalizeSentence } from "#/src/lib/text";
import { ankiFieldsSkeleton, type AnkiNote, type CommonWord } from "#/src/lib/types";
import { useCardContext } from "#/src/contexts/CardContext";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { KanjiContextProvider, useKanjiContext } from "#/src/lazy/contexts/KanjiContext";
import { type ContextLabel, useKanjiPageContext } from "#/src/lazy/contexts/KanjiPageContext";

function describePartOfSpeech(pos: string) {
  if (pos === "n") return "noun";
  if (pos.startsWith("v5")) return "godan verb";
  if (pos === "v1") return "ichidan verb";
  if (pos === "vs" || pos === "vs-s") return "suru verb";
  if (pos === "adj-na") return "な-adjective";
  if (pos === "adj-i") return "い-adjective";
  if (pos === "vt") return "transitive";
  if (pos === "vi") return "intransitive";
  return pos;
}

export function $KanjiInfo() {
  const { $$kanjiInfo: $$info } = useKanjiContext();

  return (
    <div class="flex flex-col text-xs sm:text-sm text-base-content-calm items-start z-10 relative animate-fade-in">
      <div
        classList={{
          hidden: !$$info()?.keyword,
        }}
      >
        <span class="inline-flex flex-wrap gap-x-1 sm:gap-x-2">
          <span>Keyword: </span>
          <span>{capitalizeSentence($$info()?.keyword)}</span>
        </span>
      </div>
      <div
        classList={{
          hidden: !$$info()?.frequency,
        }}
      >
        <span class="inline-flex flex-wrap gap-x-1 sm:gap-x-2">
          <span>Frequency: </span>
          <span>{$$info()?.frequency}</span>
        </span>
      </div>
      <div
        classList={{
          hidden: !$$info()?.readings.length,
        }}
      >
        <span class="inline-flex flex-wrap gap-x-1 sm:gap-x-2 gap-y-0.5">
          <span>Reading: </span>
          <For each={$$info()?.readings}>
            {(reading) => {
              return (
                <Show when={reading.percentage}>
                  <span class="border border-base-300 inline-flex">
                    <span class="px-0.5">{reading.reading}</span>
                    <span class="border-s border-base-300 px-0.5 bg-base-300 text-base-content-soft">
                      {reading.percentage}
                    </span>
                  </span>
                </Show>
              );
            }}
          </For>
        </span>
      </div>
    </div>
  );
}

export function $KanjiInfoExtra(props: { inKanjiPage?: boolean }) {
  const {
    $kanjiState,
    $$kanjiInfo: $$info,
    $setFetchFlags,
    $$visuallySimilar,
    $$composedOf,
    $$usedIn,
    $$related,
  } = useKanjiContext();
  const { $general } = useGeneralContext();
  const ctx = useCtxContext();

  const KanjiKeywordComponent = props.inKanjiPage ? KanjiKeywordKanjiPage : KanjiKeywordTooltip;

  function $CommonWords() {
    const { workerApi } = useGeneralContext();
    const { initialAnkiFields } = useAnkiFieldContext();
    const { $config } = useConfigContext();
    const { $setCard } = useCardContext();
    const { navigate } = useNavigationTransition();
    const [open, setOpen] = createSignal(true);
    const [expanded, setExpanded] = createSignal<string>();
    const [words] = createResource(
      () => (props.inKanjiPage ? undefined : $kanjiState.kanji),
      async (kanji) => {
        const api = await workerApi.promise;
        return api.lookupCommonWords(kanji);
      },
    );
    const [query] = createResource(
      () => (props.inKanjiPage ? undefined : $kanjiState.kanji),
      async (kanji) => {
        const api = await workerApi.promise;
        return api
          .queryShared({ ankiFields: unwrap(initialAnkiFields), kanjiList: [kanji] })
          .catch(() => undefined);
      },
    );
    const deckNotes = createMemo(() => {
      const result = query();
      const notes = result?.kanjiResult[$kanjiState.kanji] ?? [];
      const newCards = new Set(result?.newNotes.flatMap((note) => note.cards) ?? []);
      return new Map(
        notes
          .filter((note) =>
            $config.relatedExpressionExcludeNewCards ? !newCards.has(note.cards[0]) : true,
          )
          .map((note) => [note.fields.Expression.value, note]),
      );
    });
    const visibleWords = createMemo(() =>
      (words() ?? []).filter(([word]) => word !== initialAnkiFields.Expression).slice(0, 5),
    );

    const openDeckWord = (note: AnkiNote) => {
      $setCard("nestedAnkiFields", {
        ...ankiFieldsSkeleton,
        ...Object.fromEntries(
          Object.entries(note.fields).map(([key, value]) => [key, value.value]),
        ),
        CardID: note.cards[0]?.toString() ?? "",
        Tags: note.tags.join(" "),
      });
      $setCard("nestedNoteId", note.noteId);
      navigate("nested", "forward", () => navigate("main", "back"));
    };

    return (
      <Show when={!props.inKanjiPage && visibleWords().length}>
        <div class="collapse collapse-arrow rounded-none animate-fade-in">
          <input
            type="checkbox"
            checked={open()}
            on:change={(e) => setOpen(e.currentTarget.checked)}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Common Words</div>
          </div>
          <div class="collapse-content p-0 flex flex-col gap-1">
            <For each={visibleWords()}>
              {(entry: CommonWord) => {
                const [word, reading, rank, senses] = entry;
                const note = createMemo(() => deckNotes().get(word));
                return (
                  <div>
                    <button
                      class="w-full text-start flex items-baseline gap-1 hover:text-base-content"
                      classList={{ "text-base-content-primary font-semibold": !!note() }}
                      on:click={() => {
                        const deckWord = note();
                        if (deckWord) openDeckWord(deckWord);
                        else setExpanded(expanded() === word ? undefined : word);
                      }}
                      on:touchend={(e) => e.stopPropagation()}
                    >
                      <span class="shrink-0">{word}</span>
                      <span class="shrink-0 text-base-content-soft">{reading}</span>
                      <span class="truncate min-w-0">{senses[0]?.[1][0]}</span>
                      <span class="ms-auto shrink-0 text-base-content-soft">
                        #{rank.toLocaleString()}
                      </span>
                    </button>
                    <Show when={expanded() === word}>
                      <ol class="list-decimal ps-5 text-base-content-calm">
                        <For each={senses}>
                          {([pos, glosses]) => (
                            <li>
                              <span class="text-base-content-soft">
                                {[...new Set(pos.map(describePartOfSpeech))].join(", ")}
                              </span>{" "}
                              {glosses.join("; ")}
                            </li>
                          )}
                        </For>
                      </ol>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    );
  }

  const [$checkboxRef, $setCheckboxRef] = createStore<{
    visuallySimilar: undefined | HTMLInputElement;
    composedOf: undefined | HTMLInputElement;
    usedIn: undefined | HTMLInputElement;
    meanings: undefined | HTMLInputElement;
    related: undefined | HTMLInputElement;
  }>({
    visuallySimilar: undefined,
    composedOf: undefined,
    usedIn: undefined,
    meanings: undefined,
    related: undefined,
  });
  const [$checkbox, $setCheckbox] = createStore({
    visuallySimilar: false,
    composedOf: false,
    usedIn: false,
    meanings: false,
    related: false,
  });

  createEffect(() => {
    if ($checkbox.visuallySimilar) $setFetchFlags("visuallySimilar", true);
    if ($checkbox.composedOf) $setFetchFlags("composedOf", true);
    if ($checkbox.usedIn) $setFetchFlags("usedIn", true);
    if ($checkbox.related) $setFetchFlags("related", true);
  });

  function $VisuallySimilar() {
    return (
      <Show when={$$info()?.visuallySimilar.length}>
        <div class="collapse collapse-arrow rounded-none animate-fade-in">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("visuallySimilar", ref)}
            checked={$checkbox.visuallySimilar}
            on:change={(e) => {
              $setCheckbox("visuallySimilar", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Visually Similar</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$$info()?.visuallySimilar}>
                {(kanji) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiKeywordComponent
                        parentKanji={$kanjiState.kanji}
                        $$noteList={$$visuallySimilar}
                        nestedFocus={{
                          kanji: kanji,
                          noteId: undefined,
                        }}
                        contextLabel={{
                          text: $kanjiState.kanji,
                          type: "similar",
                        }}
                      />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function $ComposedOf() {
    return (
      <Show when={$$info()?.composedOf.length}>
        <div class="collapse collapse-arrow rounded-none animate-fade-in">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("composedOf", ref)}
            checked={$checkbox.composedOf}
            on:change={(e) => {
              $setCheckbox("composedOf", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Composed of</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$$info()?.composedOf}>
                {(kanji) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiKeywordComponent
                        parentKanji={$kanjiState.kanji}
                        $$noteList={$$composedOf}
                        nestedFocus={{
                          kanji: kanji,
                          noteId: undefined,
                        }}
                        contextLabel={{
                          text: $kanjiState.kanji,
                          type: "composedOf",
                        }}
                      />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function $UsedIn() {
    return (
      <Show when={$$info()?.usedIn.length}>
        <div class="collapse collapse-arrow rounded-none animate-fade-in">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("usedIn", ref)}
            checked={$checkbox.usedIn}
            on:change={(e) => {
              $setCheckbox("usedIn", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Used in</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$$info()?.usedIn}>
                {(kanji) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiKeywordComponent
                        parentKanji={$kanjiState.kanji}
                        $$noteList={$$usedIn}
                        nestedFocus={{
                          kanji: kanji,
                          noteId: undefined,
                        }}
                        contextLabel={{
                          text: $kanjiState.kanji,
                          type: "usedIn",
                        }}
                      />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function $Meanings() {
    return (
      <Show when={$$info()?.meanings.length}>
        <div class="collapse collapse-arrow rounded-none animate-fade-in">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("meanings", ref)}
            checked={$checkbox.meanings}
            on:change={(e) => {
              $setCheckbox("meanings", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Meanings</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$$info()?.meanings}>
                {(meaning) => {
                  return (
                    <div class="border border-base-300 inline-flex px-1 bg-base-300">{meaning}</div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function $Related() {
    return (
      <Show when={$$info()?.related.length}>
        <div class="collapse collapse-arrow rounded-none animate-fade-in">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("related", ref)}
            checked={$checkbox.related}
            on:change={(e) => {
              $setCheckbox("related", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Related</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$$info()?.related}>
                {(kanji) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiKeywordComponent
                        parentKanji={$kanjiState.kanji}
                        $$noteList={$$related}
                        nestedFocus={{
                          kanji: kanji,
                          noteId: undefined,
                        }}
                        contextLabel={{
                          text: $kanjiState.kanji,
                          type: "related",
                        }}
                      />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function DefaultKanjiInfoExtra() {
    createEffect(() => {
      $setCheckbox("visuallySimilar", true);
      $setCheckbox("composedOf", true);
    });

    return (
      <>
        <$CommonWords />
        <$VisuallySimilar />
        <$ComposedOf />
        <$UsedIn />
        <$Meanings />
        <$Related />
      </>
    );
  }

  const sections = {
    CommonWords: $CommonWords,
    VisuallySimilar: $VisuallySimilar,
    ComposedOf: $ComposedOf,
    UsedIn: $UsedIn,
    Meanings: $Meanings,
    Related: $Related,
  };

  return (
    <ErrorBoundary fallback={<DefaultKanjiInfoExtra />}>
      <Show when={$general.plugin?.KanjiInfoExtra} fallback={<DefaultKanjiInfoExtra />}>
        {(get) => {
          const KanjiInfoExtra = get();
          return (
            <KanjiInfoExtra
              inKanjiPage={props.inKanjiPage}
              DefaultKanjiInfoExtra={DefaultKanjiInfoExtra}
              sections={sections}
              checkboxRef={$checkboxRef}
              ctx={ctx}
              useKanjiContext={useKanjiContext}
            />
          );
        }}
      </Show>
    </ErrorBoundary>
  );
}

type KanjiKeywordProps = {
  $$noteList: Resource<[string, AnkiNote[]][] | undefined>;
  nestedFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  contextLabel?: ContextLabel;
  onClick?: () => void;
  parentKanji: string;
};
function $KanjiKeyword(props: KanjiKeywordProps) {
  const { $kanjiState, $$kanjiInfo } = useKanjiContext();

  const $$keyword = createMemo(() => {
    const wkMeaning = $$kanjiInfo()?.wkMeaning;
    const keyword = $$kanjiInfo()?.keyword;
    return wkMeaning ? wkMeaning : keyword;
  });
  const $ready = createMemo(
    () => props.$$noteList.state === "ready" || props.$$noteList.state === "refreshing",
  );

  return (
    <button
      class="inline-flex border border-base-300 transition-colors hover:border-base-content-subtle-200"
      classList={{
        "cursor-pointer": $ready(),
        "cursor-not-allowed": !$ready(),
        "text-base-content-calm": $ready(),
        "text-base-content-soft": !$ready(),
      }}
      on:click={props.onClick}
      on:touchend={(e) => e.stopPropagation()}
    >
      <span class=" px-1 text-lg sm:text-xl">{$kanjiState.kanji}</span>
      <Show when={$$keyword()}>
        <span class="bg-base-300 border-s border-base-300 px-1 text-base-content-soft flex items-center">
          {capitalizeSentence($$keyword())}
        </span>
      </Show>
    </button>
  );
}

function KanjiKeywordTooltip(props: KanjiKeywordProps) {
  const { $setCard, onKanjiPageMount } = useCardContext();
  const { navigate } = useNavigationTransition();

  const onClick = () => {
    if (!props.$$noteList()) return;

    $setCard("initialTab", "kanji");
    $setCard("initialFocus", { kanji: props.parentKanji, noteId: undefined });
    $setCard("uniqueId", createUniqueId());
    onKanjiPageMount.add(({ $setKanjiPage }) => {
      applyNestedKanjiPageState($setKanjiPage, props);
      $setCard("navigateBack", (old) => [
        ...old,
        () => navigate(() => $setKanjiPage("nested", false), "back"),
      ]);
    });
    navigate("kanji", "forward", () => navigate("main", "back"));
  };

  return <$KanjiKeyword {...props} onClick={onClick} />;
}

function KanjiKeywordKanjiPage(props: KanjiKeywordProps) {
  const { $setKanjiPage } = useKanjiPageContext();
  const { navigate } = useNavigationTransition();

  const onClick = () => {
    if (!props.$$noteList()) return;
    navigate(
      () => applyNestedKanjiPageState($setKanjiPage, props),
      "forward",
      () => navigate(() => $setKanjiPage("nested", false), "back"),
    );
  };

  return <$KanjiKeyword {...props} onClick={onClick} />;
}

function applyNestedKanjiPageState(
  $setKanjiPage: ReturnType<typeof useKanjiPageContext>["$setKanjiPage"],
  props: KanjiKeywordProps,
) {
  $setKanjiPage("nestedContextLabel", props.contextLabel);
  $setKanjiPage("nestedId", createUniqueId());
  $setKanjiPage("nestedFocus", {
    kanji: props.nestedFocus.kanji,
    noteId: props.nestedFocus.noteId,
  });
  $setKanjiPage("focus", {
    kanji: props.parentKanji,
    noteId: undefined,
  });
  $setKanjiPage("nestedNoteList", props.$$noteList() ?? []);
  $setKanjiPage("nested", true);
}
