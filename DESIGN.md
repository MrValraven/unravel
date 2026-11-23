# Unravel design system

How Unravel looks and moves, as it is built today. Every value here comes from the code: tokens live in `src/styles/_tokens.scss`, the theme colours in `src/styles/global.scss`, and component styles in the `.scss` file next to each component. When this file and the code disagree, the code wins and this file needs an update.

## Brand and personality

Unravel is a card game of good questions for friends, dates and partners. It should feel like a deck of real cards on a calm table: warm, a little playful, never loud. The phone is passed around, so the card is the one bright thing on screen and everything else steps back.

- Brand palette: navy `#232946`, lavender text `#b8c1ec`, pink accent `#eebbc3`, heading white `#fffffe`.
- Cards and display text are set in a friendly serif (Young Serif). Interface text is a clean sans (Figtree).
- Decks are physical objects: tiles show card edges peeking out below, the play card has a sheen and a drop shadow, the end screen stacks the cards.

## Themes

The player picks a theme in Settings (Theme: Night, Dim, Day; in Portuguese Noite, Penumbra, Dia). `main.tsx` writes it to `<html data-theme>` before React's first render, together with:

- `<meta name="theme-color">`: `#232946` (default), `#1d191d` (dim), `#f7f2ee` (light). On the play screen `useTintedThemeColor` mixes 16% of the deck accent into it.
- `<meta name="color-scheme">`: `dark` for default and dim, `light` for light. The light theme also sets `color-scheme: light` on `:root`.
- `data-theme-ready` one frame after the first paint, so only later theme switches fade (body background and colour over `$duration-slow`).

The stored setting is `theme: "default" | "dim" | "light"` in `unravel:v2:settings`. Settings saved before the light theme had `isDimMode`; `true` there reads as `"dim"`.

### Colour tokens

Use the `$color-*` Sass variables (they read the custom properties below). The brand constants (`$bg`, `$text`, `$accent`...) are for Sass maths and fixed faces only.

| Token                      | Default (Night)             | Dim                        | Light (Day)              |
| -------------------------- | --------------------------- | -------------------------- | ------------------------ |
| `--color-bg`               | `#232946`                   | `#1d191d`                  | `#f7f2ee`                |
| `--color-bg-elevated`      | `#2b3358`                   | `#29222a`                  | `#fdfaf8`                |
| `--color-heading`          | `#fffffe`                   | `#e3d5c4`                  | `#232946`                |
| `--color-text`             | `#b8c1ec`                   | `#bcab9b`                  | `#3b4168`                |
| `--color-text-dim`         | `#9aa3cf`                   | `#a09081`                  | `#575c80`                |
| `--color-accent`           | `#eebbc3`                   | `#d6a08e`                  | `#93374f`                |
| `--color-accent-fill`      | `#eebbc3`                   | `#d6a08e`                  | `#ebb0bb`                |
| `--color-on-accent`        | `#232946`                   | `#1d191d`                  | `#232946`                |
| `--color-surface`          | `rgba(184, 193, 236, .045)` | `rgba(188, 171, 155, .05)` | `rgba(35, 41, 70, .04)`  |
| `--color-surface-hover`    | `rgba(184, 193, 236, .09)`  | `rgba(188, 171, 155, .1)`  | `rgba(35, 41, 70, .075)` |
| `--color-border`           | `rgba(184, 193, 236, .16)`  | `rgba(188, 171, 155, .16)` | `rgba(35, 41, 70, .14)`  |
| `--color-border-strong`    | `rgba(184, 193, 236, .28)`  | `rgba(188, 171, 155, .28)` | `rgba(35, 41, 70, .32)`  |
| `--color-backdrop`         | `rgba(12, 14, 30, .62)`     | `rgba(8, 6, 8, .66)`       | `rgba(35, 41, 70, .42)`  |
| `--color-shadow`           | `#090b1a`                   | `#080608`                  | `rgba(35, 41, 70, .5)`   |
| `--color-category-friends` | `#b8c1ec`                   | `#a5add3`                  | `#4a5394`                |
| `--color-category-dating`  | `#eebbc3`                   | `#d5a8af`                  | `#93374f`                |
| `--color-category-adults`  | `#cf94bb`                   | `#ba85a8`                  | `#86386f`                |
| `--focus-ring`             | `var(--color-accent)`       | `var(--color-accent)`      | `var(--color-accent)`    |

What the accent tokens are for:

- `$color-accent`: accent as text, icons, outlines, small dots and the focus ring on the page.
- `$color-accent-fill`: filled controls that carry `$color-on-accent` ink (primary buttons, the segmented highlight, switches that are on, the numbered steps on Home). The same pink as the accent in the dark themes; in the light theme the accent turns deep rose for text while fills stay pink.
- `shadow($strength)`: drop shadows, as `color-mix(in srgb, var(--color-shadow) <strength>%, transparent)`. The light theme's shadow colour is navy at half strength, so the same call gives softer daylight shadows.

Fixed constants for deck faces, which are the same pastel in every theme: `$sheen` (`#fffffe`) for highlights and `$shade` (`#10132a`) for shading. Tag pills use `$new` `#ffcc1d` and `$beta` `#e555c7` with `$tag-ink` `#161a2e` (11.39:1 and 5.29:1).

### Contrast (WCAG 2 ratios, page / elevated surface)

| Pair                         | Default       | Dim           | Light         |
| ---------------------------- | ------------- | ------------- | ------------- |
| Heading                      | 14.21 / 12.22 | 12.06 / 10.75 | 12.79 / 13.68 |
| Text                         | 8.04 / 6.92   | 7.81 / 6.96   | 8.82 / 9.43   |
| Dim text                     | 5.76 / 4.96   | 5.63 / 5.01   | 5.82 / 6.22   |
| Accent                       | 8.48 / 7.30   | 7.67 / 6.84   | 6.51 / 6.97   |
| On-accent ink on accent fill | 8.48          | 7.67          | 7.76          |

In the light theme the accent keeps 4.63:1 on a 22% accent tint, the most any tinted badge or icon tile uses.

## Deck identity

Every deck takes its category's tone as `accent` (`categoryAccents` in `src/content/decks.ts`): friends lavender `#b8c1ec`, dating pink `#eebbc3`, adults mauve `#cf94bb`. Favourites wear the pink; custom decks the lavender. Navy ink reads at 8.04:1, 8.48:1 and 5.83:1 on them.

A component sets `--deck-accent` inline and includes the `deck-tone` mixin, which scopes two colours:

- `--deck-tone` fills a deck face with `$color-on-accent` ink. Dim mixes it 12% toward the page (`color-mix(in srgb, accent 88%, var(--color-bg))`); the play card (84%), the card of the day (82%) and the hero fan (84%, back cards 74%) mute a little more in dim.
- `--deck-text` is the deck colour for text, icons, outlines and progress fills on the page. It is the tone itself in the dark themes. In the light theme it is `oklch(from var(--deck-accent) 0.47 calc(c * 1.6) h)`, a deep shade of the same hue: 6.26:1, 6.45:1 and 6.66:1 on the page for lavender, pink and mauve. Browsers without relative colour syntax fall back to `--color-accent`.

Deck tiles in the light theme darken their two peeking edges toward navy (78%) and lighten the face on hover toward `$sheen`, so the navy ink only gains contrast (8.79:1, 9.18:1, 6.70:1).

## Typography

- `$font-card`: "Young Serif", Georgia, serif. Card text, page titles, dialog titles, deck names, the wordmark, numbers on Home's steps. Always weight 400.
- `$font-ui`: "Figtree Variable", system-ui, sans-serif. Everything else, weights 500, 600 (labels, buttons, headings) and 700 (eyebrows, chips, tag pills).
- Body: 1rem with line-height 1.55. Headings h1 to h4: weight 600, line-height 1.2, `text-wrap: balance`.
- Root size is `calc(100% * var(--text-scale))`; Settings offers 1, 1.15 and 1.3, so all rem sizes follow.
- Eyebrows: uppercase, 0.75 to 0.8125rem, weight 700, letter-spacing 0.06em (0.08em for Settings section titles).

Sizes in use, smallest to largest:

| Size                                                         | Used for                                |
| ------------------------------------------------------------ | --------------------------------------- |
| 0.75rem                                                      | Tag pills, small labels                 |
| 0.8125rem                                                    | Eyebrows, chips, counts, secondary meta |
| 0.875rem                                                     | Hints, descriptions, footer             |
| 0.9375rem                                                    | Toasts, notes, compact body text        |
| 1rem                                                         | Body and buttons                        |
| 1.0625rem                                                    | Lead paragraphs, FAQ questions          |
| 1.125 to 1.25rem                                             | Deck tile titles, section titles        |
| 1.375rem                                                     | Dialog titles, card of the day text     |
| `clamp(1.5rem, 1.15rem + 1.5vw, 2.125rem)`                   | The play card question                  |
| `clamp(1.625rem, 1.3rem + 1.2vw, 2.25rem)`                   | Home landing section titles             |
| `clamp(2rem, 7vw, 2.75rem)`                                  | Deck page title                         |
| `clamp(64px, 19vw, 128px)`, `clamp(88px, 9.6vw, 128px)` wide | The Home wordmark                       |

## Spacing, radii and layout

- Spacing scale: `$space-1` 4px, `$space-2` 8px, `$space-3` 12px, `$space-4` 16px, `$space-5` 24px, `$space-6` 32px, `$space-7` 48px, `$space-8` 64px. `$gutter` 16px.
- Radii: `$radius-sm` 10px (icon tiles), `$radius` 16px (panels, deck tiles), `$radius-lg` 24px (cards, dialogs, sheets), `$radius-pill` 999px (buttons, chips, pills).
- Widths: `$content-width` 640px for the `.page` column; Home grows to 1040px; the deck page to 1120px on desktop; the card of the day caps at 40rem; dialogs at 440px.
- Breakpoints: `$bp-tablet` 640px and `$bp-desktop` 960px (min-width). A few components add 480px and 560px, landscape table mode uses `orientation: landscape`, and Home's landing sections hide in `display-mode: standalone`.
- Hover styles sit behind `@media (hover: hover)` so touch screens never keep a stuck hover.
- Layers: `$z-banner` 50 (toasts, banners, offline pill), `$z-dialog` 100.

## Tap targets and safe areas

- Every control is at least `$tap-target` 44px tall (buttons, icon buttons, segmented options, footer links through block padding). Primary play controls are 56px.
- `page-gutter` pads sides with `max(16px, env(safe-area-inset-left/right))`; `.page` pads the bottom with `max(48px, env(safe-area-inset-bottom))`.
- The page header pads the top with `max(12px, env(safe-area-inset-top))`; toasts and the offline pill sit below the top inset; sheets and the editor footer add the bottom inset.

## Motion

- Durations: `$duration-fast` 160ms (hover, press, fades), `$duration` 260ms (most transitions, dialog open), `$duration-slow` 420ms (entrances, card deal, theme fade).
- Easings: `$ease-out` `cubic-bezier(0.22, 1, 0.36, 1)` for most motion, `$ease-in` `cubic-bezier(0.55, 0, 1, 0.45)` for exits, `$ease` `cubic-bezier(0.075, 0.82, 0.165, 1)`. The card stage adds a spring back `cubic-bezier(0.2, 0.9, 0.3, 1.2)` and a card exit `cubic-bezier(0.3, 0.6, 0.6, 1)`.
- Only transform and opacity animate on the play card while dragging.
- `motion-safe` wraps decorative motion in `prefers-reduced-motion: no-preference`. With reduced motion, a global rule shortens every animation and transition to 1ms (so end events still fire), the play card falls back to a 220ms cross-fade, and view transitions turn off.
- View transitions: links and `navigate()` calls pass `viewTransition`. The root cross-fades over `$duration-fast` ease-out. The current play card is named `play-card` (`CardStage.scss`), so it keeps its place across page changes and morphs over `$duration` with `$ease-out` instead of fading with the page.

## Components

- **Buttons** (`.button`): pill, min-height 44px, padding 12px 24px, weight 600, scale 0.97 on press. `--primary` is `$color-accent-fill` with on-accent ink and hovers 12% toward `--color-heading` (lighter at night, deeper by day). `--secondary` is a `border-strong` outline with heading text. `--quiet` is text only and gains `surface-hover`.
- **Icon buttons** (`.icon-button`): 44 by 44 round, `$color-text`, `surface-hover` on hover.
- **Deck tile** (`DeckCard`): the deck tone fills the face, navy ink, 16px radius, min-height 9.5rem, two card edges drawn with box shadows (4px and 8px below). The title link's `::after` covers the tile. Lifts 2px on hover, scales 0.98 on press. New and Beta pills keep their fill; other pills outline in the ink.
- **Play card**: the deck accent with a top-left `$sheen` glow and a 165 degree shade toward `$shade`, 24px radius, padding 24px, min-height `min(58vh, 480px)`, inset highlight and two drop shadows. A solid ink type chip and an outlined level chip with three dots sit above the question. Challenges get a dashed inner frame, everyone cards a striped top band. The cards still to come peek out below.
- **Sheets and dialogs** (`Dialog`): `$color-bg-elevated` panel, 1px border, 24px radius, `shadow(0.35)`, over `$color-backdrop` with a 2px blur. Below 640px a sheet docks to the bottom with a grab handle and a fixed footer bar.
- **Segmented control**: a track with a 4px inset and a `$color-accent-fill` highlight that slides under the selected option (`aria-pressed`). Used for language, theme and text size.
- **Switch row**: the whole row is a `role="switch"` button; 48 by 28 track, 22px thumb. On: `$color-accent` border, `$color-accent-fill` track, on-accent thumb.
- **Toasts and pills**: elevated panels with `border-strong` and `shadow()`. The status toast is a pill at the top, the update banner and offline-ready toast slide up from the bottom, the offline pill sits centred under the status bar. Icons sit in a round tile of 18% accent.
- **Vote and hot-seat card marks**: the type chip names the type (Vote, Hot seat). A vote card carries a row of dots along its top edge, a hot-seat card a double rule inner frame, the same marks as the custom deck editor's type picker. Challenges keep their dashed frame and everyone cards their striped band.
- **Vote countdown** (`VoteCountdown`): the footer of a vote card is a 44px outlined "Point on 3" pill built on `currentColor`. Once pressed it gives way to a large 3, 2, 1 (2rem, tabular figures) and then "Point!", read out by a polite live region, with a haptic buzz on "Point!". Hover sits behind `@media (hover: hover)`.
- **Reveal cover** (`RevealCover`): pass-the-phone replaces the card text with a phone icon, "Pass the phone to {name}" in the card face and a solid ink "Reveal card" button, so the card keeps its size. Previews and the turned table copy show it as a still picture with no button.
- **Season strip** (`SeasonStrip`): on Home and Decks, "In season now" shows the deck tiles in the same grid as the category shelves. When nothing is in season it is one quiet open pill line, "Coming up", naming the next seasonal deck and its start day.
- **Share link dialog**: when both the share sheet and the clipboard are blocked, a `Dialog` titled "Copy this link" shows the link in a selectable field so it can be copied by hand.
- **Install nudge**: a surface card with a 44px accent icon tile, title, one line and actions. It renders only where installing is possible, on Home and at the end of a deck, and each place remembers its own "Not now".
- **QR code** (Home, wide screens): navy modules on a `#fffffe` ground with a hairline border in every theme, so any camera reads it.

## Accessibility rules

- Text keeps WCAG AA in every theme: 4.5:1 for body text, 3:1 for large text and for icons and outlines that carry meaning. Check new colours against all three themes.
- The focus ring is `outline: 2px solid var(--focus-ring)` with a 3px offset, shown on `:focus-visible`. On deck faces (play card, card of the day) the ring takes the on-accent ink.
- Respect reduced motion as above, and keep content readable at text scale 1.3.
- Copy is in English and European Portuguese; English is the default.

## Do and don't

- Do use `$color-*` theme tokens for anything on the page, `--deck-text` for deck colour on the page and `--deck-tone` for deck faces.
- Do use `shadow()` for shadows and `$sheen` / `$shade` on deck faces.
- Don't use pure `#000` or `#fff`, `black` or `white`, or `rgba(0, 0, 0, …)` and `rgba(255, 255, 255, …)`. Tint neutrals toward the brand hue.
- Don't use brand constants (`$bg`, `$text`, `$accent`...) for visible colours that should follow the theme.
- Don't use side-stripe borders, gradient text or decorative glassmorphism.
- Don't use em dashes or `--` in copy; error messages name the specific cause.
