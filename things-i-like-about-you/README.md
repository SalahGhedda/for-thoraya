# Things I like about you

[Open the page](https://salahghedda.github.io/for-thoraya/things-i-like-about-you/).

The original bouquet remains at the main website address, unchanged.

## Write your notes

Edit [notes.js](notes.js). Replace each empty `text` value with your words; `title` is optional. For example:

```js
{ title: 'Your title', text: 'Write your personal note here.' },
```

Use double quotes around a value if your sentence contains apostrophes. Use `\n` for a new line. Add or remove entries to change the number of cards. Empty entries show a placeholder automatically. Long notes expand the cards and the branch follows their positions.

Commit and push to `main` to publish your changes. GitHub Pages serves this folder separately from the bouquet. Increment the `notes.js?v=1` version in `index.html` when changing notes so previously opened pages fetch your latest wording.

## Opening history

Follow the [one-time Supabase setup](../supabase/README.md). Only the opening time is recorded, privately in the database. Nothing about the history appears on the page.
