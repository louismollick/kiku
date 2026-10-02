# Kiku

A Japanese note type for Anki. Cards are studied on desktop, AnkiDroid, AnkiMobile and AnkiWeb, so every feature must work offline from `collection.media`.

## Language

**Kanji Web**:
Exploring other notes in the user's collection that share a kanji, reading or expression with the current card.
_Avoid_: related notes

**Kanji Tooltip**:
The popover shown when tapping or hovering a kanji of the expression on the back of a card. Holds the kanji's info and its sections.

**Common Words**:
The most frequent words containing a kanji, according to jpdb, regardless of what the user has studied. Shown with a short gloss so the user can see what the kanji broadly means in practice.
_Avoid_: used in vocabulary, related words

**Used In**:
Kanji that contain this kanji as a visual component. A kanji-to-kanji relation, never words.

**Deck Word**:
A **Common Word** that also exists as a note in the user's collection, subject to the user's new-card exclusion setting.

## Relationships

- A **Kanji Tooltip** shows **Common Words** first, followed by the existing sections (**Used In**, Visually Similar, Composed Of, Related)
- **Common Words** are the same for every user; **Kanji Web** results depend on the user's collection
- A **Deck Word** is where **Common Words** and **Kanji Web** overlap

## Example dialogue

> **Dev:** "Should 発表 show up in **Used In** for 発?"
> **Domain expert:** "No, **Used In** is for kanji like 廃 that contain 発. 発表 is one of 発's **Common Words**, and it's a **Deck Word** if I already have a note for it."

## Flagged ambiguities

- jpdb labels its kanji page list "used in vocabulary", which clashes with Kiku's **Used In** (kanji-in-kanji). Resolved: the word list is **Common Words**.
