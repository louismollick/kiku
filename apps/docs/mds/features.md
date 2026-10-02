---
outline: deep
---

# Features

## Some highlighted features

### Kanji Web

Explore your other notes that use the same kanji, same reading, same expression, or related to the expression itself.
This feature requires [AnkiConnect](https://ankiweb.net/shared/info/2055492159) or a notes cache generated from the [Kiku Note Manager](https://ankiweb.net/shared/info/408592650?cb=1763445474367) addon.

<video controls>
  <source src="/media/feature-kanji-web.webm" type="video/mp4" />
</video>

### Kanji Tooltip

Tap a kanji on the back of a card to see its readings and sections. **Common Words** shows five frequent jpdb words containing that kanji, with readings, JMdict glosses, and ranks. Words already in your collection are highlighted as **Deck Words**; tap one to open its card. Tap another word to see its numbered JMdict senses. The card's own expression is left out.

Common Words works offline on desktop, AnkiMobile, AnkiDroid, and AnkiWeb. The existing new-card exclusion setting controls which words count as Deck Words. Refresh and sync the notes cache after updating the Kiku Note Manager to apply that setting offline.

### Group Multiple Picture/Sentence/SentenceAudio Together

You can add multiple pictures, sentences, and sentence audios to a single note, and Kiku will group them together.
Learn about how to use this feature [here](./field-grouping).

<video controls>
  <source src="/media/feature-group-field.2.webm" type="video/mp4" />
</video>

### Themes

35 built-in themes, powered by [daisyUI](https://daisyui.com/).

<video controls>
  <source src="/media/feature-theme.2.webm" type="video/mp4" />
</video>

### Settings

Configure your preferences within the settings page.

<video controls>
  <source src="/media/feature-settings.2.webm" type="video/mp4" />
</video>

### AnkiDroid support

Fully tested on AnkiDroid.

<video controls style="height: 720px;">
  <source src="/media/feature-ankidroid.2.webm" type="video/mp4"  />
</video>

:::info AnkiDroid
I recommend to enable the [new study screen](https://forums.ankiweb.net/t/new-study-screen-official-thread/67394).
The notes query is much faster here since the WebWorker and other cache is persistent between cards.
To enable the new study screen, go to AnkiDroid settings > New study screen > Enable.
:::

:::info AnkiMobile
AnkiMobile is supported with some known issues.
See the [tracked issue](https://github.com/youyoumu/kiku/issues/12) for more details.
:::

## Other features

### NSFW Blur

Add `NSFW` tag to the note and Picture will be blurred automatically. If you have multiple `<img>` you can opt-out by adding `data-nsfw="false"` to the `<img>` tag.

### AnkiDroid Integration

:::info
This feature is currently only available on AnkiDroid old study screen. [Tracked issue](https://github.com/youyoumu/kiku/issues/30)
:::

Swipe to the right to answer with `Good`, swipe to the left to answer with `Again`.
