# SAT Vocabulary

A responsive SAT vocabulary deck with independent source lists and active-recall flashcards.

## Features

- Separate `KernelSAT PDF` and `Original list` decks, with a de-duplicated combined view
- The PDF deck follows the source order; sort choices include A–Z, Z–A, and random
- Search English words, definitions, synonyms, and Russian or Uzbek translations
- Filter by Learning or Mastered status
- Choose a study list, session size, and list or random order before starting flashcards
- Active recall with review intervals, saved in the browser

## Run locally

Open `index.html` in a modern browser. The app uses plain HTML, CSS, and JavaScript; no build step is required.

## Vocabulary data

Edit `data/original.js` or `data/kernelsat.js` to update a deck. Counts are calculated from the unique vocabulary entries. The KernelSAT PDF has 1500 source entries expanded into 1575 study terms because some entries include multiple related forms.
