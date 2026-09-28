# Japan 2026 trip app

Hebrew (RTL) PWA for the trip to Japan, 21.10 to 5.11.2026. Same structure and design as the sibling
project `barcelona-madrid-2026`: sources live in `src/`, `build.mjs` inlines them into `index.html`, which
is what the site serves. `api/state.js` syncs phones through Upstash Redis (keys start with `japan2026:`);
without a database connected it answers 503 and each phone keeps its own copy ("נשמר רק בטלפון הזה").

## The plan's content
`source/JAPAN_2026.pdf` is the owners' sheet, and `itinerary.md` is the same plan as a readable list.
The sheet's content is never changed. Anything added that is not in the sheet is marked `sug: 1`
(shown as "הצעה", a dashed station), sheet text marked red is tagged `red`, orange is tagged `check`.

- `src/data_core.js`: days, regions, calendar rows, tags. A travel day has `from` and `switchAt`
  (the stop after which the day's line takes the new region's color).
- `src/data_tokyo.js`, `data_kyoto.js`, `data_alps.js`, `data_ginza.js`: the stops, day by day, in order.
  `time` is a clock time; `when` is a label such as "בוקר" (both only order the day, see `sk` in engine.js).
- `src/data_book.js` bookings and the to-book list, `data_food.js`, `data_shop.js`, `data_pack.js`,
  `data_rest.js` (spare ideas and the info sections), `data_img.js` + `data_photos.js` (photos).

## Making a change
1. Edit files in `src/` (never edit `index.html` by hand).
2. `node build.mjs`.
3. Check it: `node dev-server.mjs` serves http://localhost:4817 (`PORT` overrides). Look at phone width
   (down to 320px, no sideways scroll), light and dark.
4. Commit `src/` together with the rebuilt `index.html`.

Vercel runs no build step, so an unbuilt `index.html` ships as-is. Bump `VERSION` in `sw.js` when a photo
or icon changes; the page itself updates on its own (network-first).

## Skills
`.claude/skills/` holds two design skills (`design-taste-frontend`, `redesign-existing-projects`) from
github.com/leonxlnx/taste-skill (MIT), copied from the Spain project. The redesign one fits better: this
is a daily-use phone app, not a landing page. Keep the look shared with the Spain app and apply targeted
fixes. No em or en dashes in visible text.

## Photos
From Wikimedia Commons under free licenses. `node tools/fetch-images.mjs` downloads to `img/raw/`
(sources in `tools/sources.json`), `node tools/resize-images.mjs` makes the 720px copies in `img/`
(Chromium through Playwright; on Windows `tools/resize-images.ps1` does the same), and
`node tools/gen-photos.mjs` writes the credits. `node tools/make-icons.mjs` redraws the icons and the
iPhone launch screens.
