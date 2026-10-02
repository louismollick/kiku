import type {
  createComputed,
  createContext,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  getOwner,
  lazy,
  Match,
  onCleanup,
  onMount,
  runWithOwner,
  Show,
  Suspense,
  Switch,
  untrack,
  useContext,
} from "solid-js";
import type h from "solid-js/h";
import type html from "solid-js/html";
import type { JSX } from "solid-js/jsx-runtime";
import type { createStore, Store } from "solid-js/store";
import type { Portal } from "solid-js/web";
import type { UseKanjiContext } from "#/src/lazy/contexts/KanjiContext";
import type { UseAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import type { UseBreakpointContext } from "#/src/contexts/BreakpointContext";
import type { UseCardContext } from "#/src/contexts/CardContext";
import type { UseConfigContext } from "#/src/contexts/ConfigContext";
import type { UseGeneralContext } from "#/src/contexts/GeneralContext";
import type { PitchInfo } from "#/src/lib/hatsuon";
import type { AnkiFields } from "#/src/lib/types";

/**
 * The Plugin Context (Ctx) provides the essential building blocks for creating
 * interactive and reactive UI elements within Kiku.
 *
 * It includes core Solid.js primitives, lifecycle hooks, and bridges to
 * Anki's internal state and APIs.
 */
export type Ctx = {
  /**
   * HyperScript method for Solid
   * https://github.com/solidjs/solid/blob/main/packages/solid/h/README.md
   */
  h: typeof h;
  /**
   * Tagged Template Literal html method for Solid
   * https://github.com/solidjs/solid/blob/main/packages/solid/html/README.md
   */
  html: typeof html;

  // --- Solid.js Reactive Primitives ---
  /** Creates a reactive signal. [$state, $setState] = createSignal(initialValue) */
  createSignal: typeof createSignal;
  /** Creates a reactive effect that re-runs when its dependencies change. */
  createEffect: typeof createEffect;
  /** Creates a read-only signal derived from other reactive signals. */
  createMemo: typeof createMemo;
  /** Handles asynchronous data fetching and state management. */
  createResource: typeof createResource;
  /** Creates a computation that immediately runs and tracks dependencies. */
  createComputed: typeof createComputed;
  /** Creates a deep-reactive proxy object. Useful for complex state. */
  createStore: typeof createStore;

  // --- Lifecycle Hooks ---
  /** Registers a function to run after the component is mounted to the DOM. */
  onMount: typeof onMount;
  /** Registers a function to run when the component is unmounted. */
  onCleanup: typeof onCleanup;

  // --- Reactive Context & Scoping ---
  /** Creates a Context object for dependency injection. */
  createContext: typeof createContext;
  /** Subscribes to a previously created Context. */
  useContext: typeof useContext;
  /** Defers loading of a component until it is needed. */
  lazy: typeof lazy;
  /** Returns the current reactive owner. */
  getOwner: typeof getOwner;
  /** Runs a function within a specific reactive owner scope. */
  runWithOwner: typeof runWithOwner;
  /** Executes a block of code without tracking any reactive dependencies. */
  untrack: typeof untrack;

  // --- Core UI Components ---
  /** Handles uncaught errors in the component tree. */
  ErrorBoundary: typeof ErrorBoundary;
  /** Optimally renders a list of items. */
  For: typeof For;
  /** Renders content into a different DOM node (e.g., for modals). */
  Portal: typeof Portal;
  /** Conditionally renders elements: <Show when={condition}>...</Show> */
  Show: typeof Show;
  /** Handles loading states for asynchronous resources. */
  Suspense: typeof Suspense;
  /** Conditional rendering with multiple branches (Switch/Match). */
  Switch: typeof Switch;
  /** A branch within a Switch component. */
  Match: typeof Match;

  // --- Anki Data & Bridge ---
  /**
   * The raw field data of the current Anki card.
   * These are strings as defined in your Anki note type.
   */
  ankiFields: AnkiFields;
  $ankiFields: Store<AnkiFields>;

  // --- Kiku Hooks ---
  /** Provides reactive access to all Anki fields. */
  useAnkiFieldContext: UseAnkiFieldContext;
  /** Provides information about the current screen size/breakpoint. */
  useBreakpointContext: UseBreakpointContext;
  /** Provides the current card state (side, ID, etc.). */
  useCardContext: UseCardContext;
  /** Provides access to Kiku's global configuration. */
  useConfigContext: UseConfigContext;
  /** Provides access to Kiku's global general state. */
  useGeneralContext: UseGeneralContext;
};

/**
 * The main interface for a Kiku Plugin module.
 *
 * To create a plugin, your `_kiku_plugin.js` file must export a
 * constant named `plugin` that satisfies this interface.
 */
export type KikuPlugin = {
  /**
   * Customizes the External Links section on the back of the card.
   * This is typically used to add links to custom dictionary sites.
   */
  ExternalLinks?: (props: {
    /** The original Kiku external links. */
    DefaultExternalLinks: () => JSX.Element;
    ctx: Ctx;
  }) => JSX.Element | JSX.Element[];

  /**
   * Replaces or extends the primary Sentence display.
   * Use this to add custom translations or text-processing logic.
   */
  Sentence?: (props: {
    /** The original Kiku sentence display. */
    DefaultSentence: () => JSX.Element;
    ctx: Ctx;
  }) => JSX.Element | JSX.Element[];

  /**
   * Replaces or extends the Footer section at the bottom of the card.
   */
  Footer?: (props: {
    /** The original Kiku footer. */
    DefaultFooter: () => JSX.Element;
    ctx: Ctx;
  }) => JSX.Element | JSX.Element[];

  /**
   * Adds custom content at the very end of the card (front and back).
   */
  CardEnd?: (props: { ctx: Ctx }) => JSX.Element | JSX.Element[];

  /**
   * Customizes the Pitch Accent visualizations.
   * This is called for every pitch info entry found for the word.
   */
  Pitch?: (props: {
    /** Data about the pitch (morae, accent index, etc.). */
    pitchInfo: PitchInfo;
    /** The index if multiple pitch entries exist. */
    index: number;
    /** The original Kiku pitch component. */
    DefaultPitch: (props: {
      pitchInfo: PitchInfo;
      index: number;
      ref?: (ref: HTMLDivElement) => void;
    }) => JSX.Element;
    ctx: Ctx;
  }) => JSX.Element | JSX.Element[];

  /**
   * Customizes the extended Kanji Information section.
   * This section appears when clicking a kanji to see its details.
   */
  KanjiInfoExtra?: (props: {
    /** True if the user is in the dedicated Kanji Page view. */
    inKanjiPage?: boolean;
    /** The original Kiku kanji info. */
    DefaultKanjiInfoExtra: () => JSX.Element;
    /**
     * Pre-rendered UI sections for the Kanji Detail view.
     * You can return these within your `KanjiInfoExtra` plugin hook.
     */
    sections: {
      CommonWords: () => JSX.Element;
      VisuallySimilar: () => JSX.Element;
      ComposedOf: () => JSX.Element;
      UsedIn: () => JSX.Element;
      Meanings: () => JSX.Element;
      Related: () => JSX.Element;
    };
    /** Refs to the checkboxes in the UI for toggling sections. */
    checkboxRef: {
      visuallySimilar: undefined | HTMLInputElement;
      composedOf: undefined | HTMLInputElement;
      usedIn: undefined | HTMLInputElement;
      meanings: undefined | HTMLInputElement;
      related: undefined | HTMLInputElement;
    };
    /** Hook to access the current Kanji's data reactively. */
    useKanjiContext: UseKanjiContext;
    ctx: Ctx;
  }) => JSX.Element | JSX.Element[];

  /**
   * Lifecycle Hook: Called once when the plugin module is loaded.
   * Ideal for global styling, event listeners, or persistent state.
   */
  onPluginLoad?: (props: { ctx: Ctx }) => void;

  /**
   * Lifecycle Hook: Called when the Kiku Settings menu is opened.
   * Use this to perform side-effects when settings open.
   */
  onSettingsMount?: (props: { ctx: Ctx }) => void;

  /**
   * Filters images extracted from the glossary.
   * Return true to keep the image, false to exclude it.
   */
  glossaryImagesFilter?: (img: HTMLImageElement) => boolean;
};
