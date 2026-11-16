# Unravel

**Good questions for friends, dates and partners.**

Unravel is a card game for people. Pick a deck, gather a few people and read the cards aloud. Every deck starts with easy questions and slowly goes deeper, so a table of strangers can turn into friends and two people on a date can end up knowing each other a little better.

Live at **[unravel.tiagocostadev.com](https://unravel.tiagocostadev.com)**.

Unravel is a frontend-only app. It has no backend, no accounts and no server calls. Everything the app saves lives in the browser on your own device.

## Features

- **19 decks** in three groups: Make Friends and Socialize, Dating and Romance, and Adults (18+). Five of them are seasonal.
- **Three levels in every deck.** Cards rise from light to deep. Players can start at level 1, 2 or 3.
- **Three card types.** Questions for one player, challenges (some with a countdown timer) and cards for everyone.
- **Game setup.** Add player names and the app tracks whose turn it is, shuffle inside each level (levels stay in rising order), or turn on table mode to lay the card out for landscape.
- **Skip, Not tonight and Pass.** Skip moves a card to the end of the deck, Not tonight removes it for the session, and 18+ decks offer Pass without asking why.
- **Resume where you stopped.** Your place in a game is saved on the device.
- **Favourites.** Save the cards you love. With five or more, they become a deck of their own.
- **Custom decks.** Write your own questions and challenges, then share the deck with a link.
- **Deck finder.** A short quiz about who you are playing with and the mood you want, then a ranked list of decks.
- **End-of-deck recap.** The game in one line (deck, level, cards and minutes) ready to share, plus a suggestion for the next deck.
- **Card of the day.** One easy card, the same for everyone, that changes at midnight.
- **Daily reminder.** On an installed app in Chrome for Android, a switch in Settings sends the card of the day as a notification about once a day.
- **Share a card as an image.** A 1080 by 1920 picture of the card for stories and chats.
- **English and European Portuguese.** English is the default. Portuguese (pt-PT) is used only when a player picks it in Settings.
- **Three themes and text size.** Night (the navy default), Dim (warmer and softer for low light) and Day (a light theme for daylight and outdoor play), plus three text sizes.
- **Seasonal decks.** Pride, Santos Populares, Halloween, New Year and Valentine's Day appear in their own time of year.
- **Deck pages for search.** Every deck has its own page with a title, description and link preview image.
- **Installable and offline.** A progressive web app that works without a connection once it is installed. An install card on Home and at the end of a deck offers to add it to the home screen, and a small notice says when you are offline.
- **Your nights.** A local stats panel with decks started and finished, cards seen and time played.

## Privacy

- Everything the app saves goes to `localStorage` in this browser. That covers settings, your place in a game, favourites, custom decks and stats.
- There are no accounts, no analytics and no tracking.
- Share links for custom decks carry the deck in the URL hash (the part after `#`). Browsers keep the hash on the device and send it to no server.
- All storage access goes through `src/storage/`, and every read and write is wrapped in a try/catch, so the app keeps working when storage is blocked.
- Saved keys start with `unravel:v2:`.

## Tech stack

| Area       | Choice                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| UI         | [React](https://react.dev/) 19.3 with [React Router](https://reactrouter.com/) 7.18      |
| Language   | [TypeScript](https://www.typescriptlang.org/) 5.9 in strict mode                         |
| Build      | [Vite](https://vite.dev/) 8.1 with `@vitejs/plugin-react` 6                              |
| Styling    | [Sass](https://sass-lang.com/) per component, shared tokens in `src/styles/_tokens.scss` |
| Icons      | [react-icons](https://react-icons.github.io/react-icons/) 5.7 (Feather first)            |
| Fonts      | Young Serif and Figtree Variable, bundled with Fontsource                                |
| PWA        | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) 2, `injectManifest` with Workbox 7  |
| Unit       | [Vitest](https://vitest.dev/) 5 with Testing Library and jsdom                           |
| End to end | [Playwright](https://playwright.dev/) 1.61.1 with axe-core                               |
| Hosting    | [Vercel](https://vercel.com/)                                                            |

Node 20.11 or newer is required.

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on plain http at `http://localhost:5173` and listens on all network interfaces (`--host`). Vite prints the local and network addresses when it starts.

To test installing the app on a phone over your local network, run `npm run dev:https`. It serves a self-signed certificate through `@vitejs/plugin-basic-ssl`, and the browser warns about it once. Accept the warning to continue.

## Scripts

| Script                   | What it does                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `npm run dev`            | Starts the Vite dev server over plain http, reachable on your network     |
| `npm run dev:https`      | Starts the dev server with a self-signed HTTPS certificate                |
| `npm run build`          | Type-checks, then builds to `dist/` (the postbuild step runs right after) |
| `npm run postbuild`      | Prerenders deck and site pages, JSON-LD, `sitemap.xml` and `404.html`     |
| `npm run preview`        | Serves the production build locally                                       |
| `npm run lint`           | Lints with ESLint                                                         |
| `npm run typecheck`      | Type-checks the app and the scripts                                       |
| `npm run format`         | Formats the codebase with Prettier                                        |
| `npm run format:check`   | Checks formatting without writing                                         |
| `npm test`               | Runs Vitest in watch mode                                                 |
| `npm run test:run`       | Runs Vitest once                                                          |
| `npm run e2e`            | Runs the Playwright end-to-end specs                                      |
| `npm run content:export` | Writes every deck pack to CSV in `content-export/`                        |
| `npm run content:import` | Reads edited CSV files in `content-export/` back into deck packs          |
| `npm run og:images`      | Renders the 1200 by 630 link preview images into `public/og/`             |
| `npm run pwa:images`     | Renders install screenshots, iOS splash screens and shortcut icons        |

## Project structure

```
src/
  main.tsx, App.tsx          Bootstrap and lazy-loaded routes
  sw.ts                      Service worker (precache, app shell, daily reminder)
  content/
    types.ts                 Card, Deck and DeckMeta types
    decks.ts                 Registry of live decks, categories and season logic
    packs/<deck-id>.json     One pack of cards per deck
    resolveDeck.ts           Built-in, favourites and custom deck lookup
    dailyCard.ts             Deterministic card of the day
    content.test.ts          Content lint
  i18n/                      Locale context, useCopy and localize helpers
  storage/                   All localStorage access, one module per kind of data
  components/                Shared UI: Dialog, PageHeader, DeckIcon, UpdateBanner
  hooks/                     useHaptics, useDocumentTitle
  styles/                    Tokens and the three themes (see DESIGN.md)
  features/
    home/                    Home page: hero, card of the day, install card and the
                             landing sections (how it works, deck shelf, phone and
                             privacy, FAQ)
    intro/                   "What is Unravel?" page
    decks/                   Deck picker, deck pages, install prompt
    finder/                  Deck finder
    play/                    Game setup, play screens, deck end, engine/
    custom/                  Custom deck list, editor, import and share codec
    settings/                Settings, stats panel, What's new
    share/                   Share a card as an image
scripts/                     CSV tools, link preview and install images, prerender
content-drafts/              Unreleased draft packs, kept out of the bundle
public/                      Icons, robots.txt and link preview images (og/)
e2e/                         Playwright specs
```

A local `docs/` folder holds design notes and build plans. It is gitignored, so a fresh clone does not have it.

Each feature keeps its text in a colocated `copy.ts` with an `en` bundle and a `pt` bundle. Components read it with `useCopy`.

## How to add or edit a deck

### 1. The pack file

Each deck has a pack at `src/content/packs/<deck-id>.json`. The deck id is a kebab-case slug such as `first-date`. It becomes the URL (`/decks/first-date`, `/play/first-date`).

```json
{
  "id": "first-date",
  "cards": [
    {
      "id": "first-date-001",
      "type": "question",
      "level": 1,
      "text": {
        "en": "What was the first thing you noticed about me when we met in person?",
        "pt": "Qual foi a primeira coisa em que reparaste em mim quando nos vimos ao vivo?"
      }
    },
    {
      "id": "first-date-014",
      "type": "challenge",
      "level": 2,
      "timerSeconds": 60,
      "text": {
        "en": "Describe our date so far as a movie trailer.",
        "pt": "Descreve o nosso encontro até agora como se fosse o trailer de um filme."
      }
    }
  ]
}
```

Card rules:

- **`id`** is `<deck-id>-NNN` with three digits, for example `first-date-007`. Ids are unique and never reused, because favourites and saved games point at them.
- **`type`** is `question`, `challenge` or `everyone`.
- **`level`** is `1`, `2` or `3`. Curated order puts lower levels first.
- **`text`** needs both `en` and `pt`. Portuguese is European Portuguese (pt-PT).
- **`timerSeconds`** is optional, only for challenges, in whole seconds from 30 to 120.

### 2. The registry entry

Import the pack in `src/content/decks.ts` and add a `buildDeck` call to the `decks` array. The order in the array is the order in the picker.

| Field         | Meaning                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `id`          | Same slug as the pack file                                                           |
| `title`       | `{ en, pt }`                                                                         |
| `tagline`     | One line, about 40 characters, `{ en, pt }`, shown on deck tiles; lint caps it at 44 |
| `description` | `{ en, pt }`                                                                         |
| `category`    | `friends`, `dating` or `adults`                                                      |
| `tag`         | `""`, `new`, `beta` or `seasonal`                                                    |
| `isAdult`     | `true` asks the player to confirm they are 18 or older                               |
| `icon`        | One of the `DeckIconName` values in `types.ts`                                       |
| `accent`      | Hex colour for the deck band, icon and share image                                   |
| `audiences`   | Any of `new-people`, `friends`, `date`, `partner`, `group` (used by the finder)      |
| `moods`       | Any of `light`, `deep`, `playful`, `spicy` (used by the finder)                      |
| `season`      | Optional `{ start, end }` window, see Seasonal decks below                           |

### 3. Content lint

`src/content/content.test.ts` checks every pack against the contract: unique deck and card ids, a pack file for each registered deck, ids that match `<deck-id>-NNN`, English and Portuguese text on every card, levels from 1 to 3, known card types, timers only on challenges, no draft decks in the registry and no em dashes in any text. Run `npm run test:run` after editing a pack.

### 4. Link preview image

Run `npm run og:images` after adding a deck or changing a deck's title, description or accent. It writes `public/og/decks/<deck-id>.png`. 18+ decks share `public/og/adults.png`, which shows no explicit text. The script uses the Chromium that Playwright installed.

### Editing in a spreadsheet

The CSV round trip is handy for bulk edits and translation.

```bash
npm run content:export            # writes content-export/<deck-id>.csv for every pack
# edit the CSV files in a spreadsheet
npm run content:import            # validates every file, then rewrites the packs
```

The columns are `id,type,level,timerSeconds,en,pt`. The import checks every row first. If any row has a problem it prints the file, line, card id and reason, and writes nothing. To work on one deck, pass its file: `npx tsx scripts/csv-to-packs.ts content-export/first-date.csv`.

The `content-drafts/` folder holds eight unreleased packs. See [content-drafts/README.md](content-drafts/README.md) for how to bring one in.

## Seasonal decks

A deck with a `season` window shows up in the picker, the finder, the home page count and the end-of-deck suggestions only while today falls inside the window. Windows are inclusive, written as `MM-DD`, and may wrap the year end.

| Deck             | Window             |
| ---------------- | ------------------ |
| Pride Month      | `06-01` to `06-30` |
| Santos Populares | `06-01` to `06-30` |
| Halloween        | `10-01` to `12-01` |
| New Year         | `12-26` to `01-07` |
| Valentine's Day  | `02-01` to `02-14` |

The deck pages stay in the build and in `sitemap.xml` all year, so a direct link always works. Give a seasonal deck `tag: "seasonal"` together with its `season` window.

## Deployment

Unravel is deployed on Vercel. `vercel.json` sets:

- `cleanUrls`, so `/decks/first-date` serves `decks/first-date.html`.
- A rewrite that sends every path outside `/assets/` to `index.html`, so client routes work on reload.
- Security headers on every response: Strict-Transport-Security, a Content-Security-Policy that keeps scripts, styles, images, fonts and connections same-origin, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and X-Frame-Options. The policy has three exceptions:
  - `style-src 'unsafe-inline'` for inline `style` attributes, which set per-deck accent colours and animation values.
  - `img-src data: blob:` for the share card, which is drawn on a canvas and saved through a blob URL, and for any small image the build inlines as a data URL.
  - `font-src data:` for any font file small enough that Vite inlines it as a data URL.
- Long-lived immutable caching for `/assets/`, and `no-cache` for `/`, `/index.html` and `/sw.js`, so new versions reach players quickly.

After `vite build`, the `postbuild` step (`scripts/prerender-decks.ts`) writes a page for every deck at `dist/decks/<id>` with its own title, description, canonical URL, Open Graph and Twitter tags and link preview image. 18+ decks are marked `noindex` and show no sample cards. Each deck page also carries JSON-LD (a Game plus its BreadcrumbList). The same step prerenders `/decks` (with an ItemList), `/finder` and `/about`, adds WebSite and FAQPage JSON-LD to the home page, and writes `dist/sitemap.xml` and a `dist/404.html` copy of the app shell.

The service worker is `src/sw.ts`, built by vite-plugin-pwa's `injectManifest` strategy with `workbox-precaching` and `workbox-routing`. It precaches the app, serves the app shell for navigations and, on installed Chromium apps, wakes about once a day through Periodic Background Sync to show the card of the day as a notification. Tapping it opens `/#today`.

The service worker uses a prompt update flow. The app checks for a new version once an hour while it is open. When one is ready, a banner says "A new version of Unravel is ready", and the app updates when the player picks "Update now".

### Install images

`npm run pwa:images` renders the images the web app manifest and `index.html` point at, with the Chromium that Playwright installed:

- `public/screenshots/<page>-<form>.png`: install dialog screenshots of Home, the deck list and play, narrow (1080 by 2340) and wide (1920 by 1080).
- `public/splash/<w>x<h>.png`: iOS launch screens, navy with the logo centred. The matching `apple-touch-startup-image` tags are rewritten in `index.html`.
- `public/shortcuts/<name>.png`: 96 by 96 icons for the manifest shortcuts.

Pass `splash`, `shortcuts` or `screenshots` to render one set (`npm run pwa:images -- splash`). Screenshots need the app running: start `npx vite --port 5405` first, or pass `--base-url=<address>`. Run it again after a visible UI change and commit the PNGs.

## Testing

```bash
npm run test:run     # unit and component tests with Vitest
npm test             # the same in watch mode
npm run e2e          # end-to-end tests with Playwright 1.61.1
```

Playwright needs its browsers installed once. Run `npx playwright install` before the first `npm run e2e`.

`npm run e2e` starts its own dev server on `http://localhost:5199`, so that port must be free. The tests block the service worker and run with reduced motion, so animations and cached files do not affect the results. Specs run on a Pixel 7 profile in Chromium and an iPhone 14 profile in WebKit.

## License

Made with love by [Tiago Costa](https://tiagocostadev.com).
