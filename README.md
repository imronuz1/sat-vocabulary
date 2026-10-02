# SAT Vocabulary

A responsive multilingual SAT vocabulary deck with independent word sets and active recall flashcards.

## Features

- Separate `KernelSAT PDF` and `Original list` decks, with a de-duplicated combined view
- Search across English definitions, synonyms, and Arabic, Russian, and Uzbek translations
- Filter by Learning or Mastered status and sort alphabetically or randomly
- Study in short active-recall sessions with spaced review intervals
- Save vocabulary status and review dates in the browser
- Responsive vocabulary cards for desktop, tablet, and mobile

## Run locally

Open `index.html` in a modern browser. The app uses plain HTML, CSS, and JavaScript; no build step is required.

## Vocabulary data

The data is kept separately from the interface in `data/original.js` and `data/kernelsat.js`. Edit either file to update its deck; the combined word count is calculated from the unique entries. The KernelSAT source file has 1500 entries that expand to 1575 study terms because some source entries include multiple related forms.
