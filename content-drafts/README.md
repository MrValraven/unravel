# Draft decks

These eight packs are unreleased drafts kept outside `src` so nothing can bundle them into the app. Each file is a plain list of English card texts in the old v1 format. To bring one in later, export it with `npx tsx scripts/packs-to-csv.ts --draft content-drafts/<file>.json --id <deck-id>`, edit the CSV in `content-export/` (types, levels, timers, Portuguese), convert it with `npx tsx scripts/csv-to-packs.ts content-export/<deck-id>.csv`, then register the deck in `src/content/decks.ts`.
