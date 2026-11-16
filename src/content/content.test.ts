import { categoryAccents, deckCategories, decks } from "./decks";
import { locales, type Card, type DeckPackFile } from "./types";

// Test-only discovery of every pack file on disk; the app imports packs statically in decks.ts.
const packModules = import.meta.glob<DeckPackFile>("./packs/*.json", {
  eager: true,
  import: "default",
});

const packsByFileId = new Map(
  Object.entries(packModules).map(([path, pack]) => [
    path.replace("./packs/", "").replace(".json", ""),
    pack,
  ])
);

const draftDeckIds = [
  "monthlyCheckup",
  "monthly-checkup",
  "networking",
  "flinta",
  "flinta-harmony",
  "neurospicy",
  "neurospicy-delight",
  "tunas",
  "portuguese-tunas",
  "selfreflection",
  "self-reflection",
  "domsub",
  "dom-sub",
  "lovesparks",
  "love-sparks",
];

const allCards: Card[] = decks.flatMap((deck) => deck.cards);
const emDash = "\u2014";
/** Taglines sit on one line of a deck tile, so they stay short. */
const TAGLINE_MAX_LENGTH = 44;

const findRepeated = (values: string[]): string[] => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      repeated.add(value);
    }
    seen.add(value);
  }
  return [...repeated];
};

const normalizeText = (text: string): string => text.trim().toLowerCase();

describe("deck registry", () => {
  it("gives every deck a unique id", () => {
    expect(findRepeated(decks.map((deck) => deck.id))).toEqual([]);
  });

  it("has a pack file with the same id for every registered deck", () => {
    for (const deck of decks) {
      const pack = packsByFileId.get(deck.id);
      expect(pack, `missing src/content/packs/${deck.id}.json`).toBeDefined();
      expect(pack?.id).toBe(deck.id);
      expect(deck.cards).toEqual(pack?.cards);
    }
  });

  it("registers every pack file in src/content/packs", () => {
    const registeredIds = new Set(decks.map((deck) => deck.id));
    const unregistered = [...packsByFileId.keys()].filter(
      (fileId) => !registeredIds.has(fileId)
    );
    expect(unregistered).toEqual([]);
  });

  it("registers no draft deck", () => {
    const registeredDrafts = decks.filter((deck) =>
      draftDeckIds.includes(deck.id)
    );
    expect(registeredDrafts.map((deck) => deck.id)).toEqual([]);
  });

  it("fills deck titles, descriptions and category titles in every locale", () => {
    for (const locale of locales) {
      for (const deck of decks) {
        expect(
          deck.title[locale].trim(),
          `${deck.id} title (${locale})`
        ).not.toBe("");
        expect(
          deck.description[locale].trim(),
          `${deck.id} description (${locale})`
        ).not.toBe("");
      }
      for (const category of deckCategories) {
        expect(
          category.title[locale].trim(),
          `${category.key} title (${locale})`
        ).not.toBe("");
      }
    }
  });

  it.each(locales)("gives every deck a short %s tagline", (locale) => {
    for (const deck of decks) {
      const tagline = deck.tagline[locale];
      expect(tagline.trim(), `${deck.id} tagline (${locale})`).not.toBe("");
      expect(tagline, `${deck.id} tagline (${locale})`).toBe(tagline.trim());
      expect(
        tagline.length,
        `${deck.id} tagline (${locale}) is ${tagline.length} characters, the cap is ${TAGLINE_MAX_LENGTH}`
      ).toBeLessThanOrEqual(TAGLINE_MAX_LENGTH);
      expect(
        tagline.endsWith("."),
        `${deck.id} tagline (${locale}) ends with a full stop`
      ).toBe(false);
    }
  });

  it("keeps taglines different from each other", () => {
    for (const locale of locales) {
      expect(
        findRepeated(decks.map((deck) => normalizeText(deck.tagline[locale])))
      ).toEqual([]);
    }
  });

  it("keeps em dashes and double hyphens out of deck and category text", () => {
    const deckTexts = decks.flatMap((deck) =>
      locales.flatMap((locale) => [
        deck.title[locale],
        deck.description[locale],
        deck.tagline[locale],
      ])
    );
    const categoryTexts = deckCategories.flatMap((category) =>
      locales.flatMap((locale) => [
        category.title[locale],
        category.note?.[locale] ?? "",
      ])
    );
    expect(
      [...deckTexts, ...categoryTexts].filter(
        (text) => text.includes(emDash) || text.includes("--")
      )
    ).toEqual([]);
  });
});

describe("deck accents", () => {
  it("gives every deck the tone of its category", () => {
    const mismatched = decks
      .filter((deck) => deck.accent !== categoryAccents[deck.category])
      .map((deck) => deck.id);
    expect(mismatched).toEqual([]);
  });

  it("keeps the palette to one tone per category", () => {
    const tones = new Set(Object.values(categoryAccents));
    expect(tones.size).toBe(deckCategories.length);
    expect(new Set(decks.map((deck) => deck.accent)).size).toBeLessThanOrEqual(
      tones.size
    );
  });
});

describe("deck cards", () => {
  it("gives every card a unique id", () => {
    expect(findRepeated(allCards.map((card) => card.id))).toEqual([]);
  });

  it("names every card id after its deck with a three digit number", () => {
    for (const deck of decks) {
      const idPattern = new RegExp(`^${deck.id}-\\d{3}$`);
      const mismatched = deck.cards.filter((card) => !idPattern.test(card.id));
      expect(
        mismatched.map((card) => card.id),
        deck.id
      ).toEqual([]);
    }
  });

  it("has English text on every card", () => {
    expect(
      allCards
        .filter((card) => card.text.en.trim() === "")
        .map((card) => card.id)
    ).toEqual([]);
  });

  it("has Portuguese text on every card", () => {
    expect(
      allCards
        .filter((card) => card.text.pt.trim() === "")
        .map((card) => card.id)
    ).toEqual([]);
  });

  it.each(locales)(
    "keeps every %s card text unique across all decks",
    (locale) => {
      const texts = allCards
        .map((card) => normalizeText(card.text[locale]))
        .filter((text) => text !== "");
      expect(findRepeated(texts)).toEqual([]);
    }
  );

  it("keeps every level between 1 and 3", () => {
    const outOfRange = allCards.filter(
      (card) => ![1, 2, 3].includes(card.level)
    );
    expect(outOfRange.map((card) => card.id)).toEqual([]);
  });

  it("uses only known card types", () => {
    const knownTypes = ["question", "challenge", "everyone"];
    const unknown = allCards.filter((card) => !knownTypes.includes(card.type));
    expect(unknown.map((card) => card.id)).toEqual([]);
  });

  it("puts timers only on challenges, as whole seconds from 30 to 120", () => {
    const timedCards = allCards.filter(
      (card) => card.timerSeconds !== undefined
    );
    const misplaced = timedCards.filter((card) => card.type !== "challenge");
    const outOfRange = timedCards.filter(
      (card) =>
        !Number.isInteger(card.timerSeconds) ||
        (card.timerSeconds ?? 0) < 30 ||
        (card.timerSeconds ?? 0) > 120
    );
    expect(misplaced.map((card) => card.id)).toEqual([]);
    expect(outOfRange.map((card) => card.id)).toEqual([]);
  });

  it("keeps em dashes out of card text", () => {
    const withEmDash = allCards.filter((card) =>
      locales.some((locale) => card.text[locale].includes(emDash))
    );
    expect(withEmDash.map((card) => card.id)).toEqual([]);
  });
});

describe("halloween pack", () => {
  const halloweenCards =
    decks.find((deck) => deck.id === "halloween")?.cards ?? [];
  const countWhere = (matches: (card: Card) => boolean) =>
    halloweenCards.filter(matches).length;

  it("numbers 40 cards from halloween-001 to halloween-040 in level order", () => {
    expect(halloweenCards.map((card) => card.id)).toEqual(
      Array.from(
        { length: 40 },
        (_, index) => `halloween-${String(index + 1).padStart(3, "0")}`
      )
    );
    expect(halloweenCards.map((card) => card.level)).toEqual([
      ...Array<number>(16).fill(1),
      ...Array<number>(14).fill(2),
      ...Array<number>(10).fill(3),
    ]);
  });

  it("mixes 26 questions, 8 timed challenges and 6 everyone rounds", () => {
    expect(countWhere((card) => card.type === "question")).toBe(26);
    expect(
      countWhere(
        (card) => card.type === "challenge" && card.timerSeconds !== undefined
      )
    ).toBe(8);
    expect(countWhere((card) => card.type === "everyone")).toBe(6);
    expect(
      countWhere((card) => card.level === 3 && card.type !== "question")
    ).toBe(0);
  });

  it("opens with a short level 1 question for previews", () => {
    expect(halloweenCards[0]).toMatchObject({ type: "question", level: 1 });
    expect(halloweenCards[0]?.text.en.length ?? 999).toBeLessThanOrEqual(100);
  });

  it("covers the traditions and folklore the spec names at level 2", () => {
    const levelTwoText = halloweenCards
      .filter((card) => card.level === 2)
      .map((card) => card.text.en)
      .join(" ");
    for (const topic of [
      /Pão-por-Deus/,
      /magusto/i,
      /Día de (los )?Muertos|Day of the Dead/,
      /Obon/,
      /barmbrack/i,
      /lobisomem/i,
      /Santa Compaña/,
      /moura/i,
      /Sintra/,
    ]) {
      expect(levelTwoText, String(topic)).toMatch(topic);
    }
  });

  it("keeps clichés, misreported facts, harsh level 3 wording and Brazilian forms out", () => {
    const bannedEnglish = [
      /favou?rite (candy|sweets?|horror (film|movie))/i,
      /vampires? (or|vs\.?|versus) werewol/i,
      /zombie/i,
      /ouija/i,
      /candy corn/i,
      /^do you believe in ghosts\??$/i,
      /^what('s| is) your biggest fear\??$/i,
      /1755/,
      /templar/i,
    ];
    const flagged = halloweenCards.filter(
      (card) =>
        bannedEnglish.some((pattern) => pattern.test(card.text.en)) ||
        /\bvocê/i.test(card.text.pt) ||
        (card.level === 3 && /\bworst\b|trauma/i.test(card.text.en))
    );
    expect(flagged.map((card) => card.id)).toEqual([]);
  });
});

const cardsOfDeck = (deckId: string): Card[] =>
  decks.find((deck) => deck.id === deckId)?.cards ?? [];
const idsWhere = (cards: Card[], matches: (card: Card) => boolean): string[] =>
  cards.filter(matches).map((card) => card.id);
/** The research notes' "Misreported: never claim these" list, plus the Missa do Galo rooster legend told as fact. */
const misreportedChristmasFacts = [
  /coca-?cola/i,
  /pickle|pepino/i,
  /\bEU\b|\bUE\b|European Union|União Europeia/,
  /\b2000\b/,
  /pagan|pagã/i,
  /16th century|século XVI|1500s/i,
  /Norw(ay|egian)|Noruega|norueg/i,
  /rooster crow|galo cantou/i,
];

describe("christmas-table pack", () => {
  const cards = cardsOfDeck("christmas-table");
  const countWhere = (matches: (card: Card) => boolean) =>
    cards.filter(matches).length;

  it("numbers 40 cards from christmas-table-001 to christmas-table-040 in level order", () => {
    expect(cards.map((card) => card.id)).toEqual(
      Array.from(
        { length: 40 },
        (_, index) => `christmas-table-${String(index + 1).padStart(3, "0")}`
      )
    );
    expect(cards.map((card) => card.level)).toEqual([
      ...Array<number>(16).fill(1),
      ...Array<number>(14).fill(2),
      ...Array<number>(10).fill(3),
    ]);
  });

  it("mixes 22 questions, 8 timed challenges and 10 everyone rounds", () => {
    expect(countWhere((card) => card.type === "question")).toBe(22);
    expect(
      countWhere(
        (card) => card.type === "challenge" && card.timerSeconds !== undefined
      )
    ).toBe(8);
    expect(countWhere((card) => card.type === "everyone")).toBe(10);
    expect(
      countWhere((card) => card.level === 3 && card.type === "challenge")
    ).toBe(0);
  });

  it("opens with a short level 1 question for previews", () => {
    expect(cards[0]).toMatchObject({ type: "question", level: 1 });
    expect(cards[0]?.text.en.length ?? 999).toBeLessThanOrEqual(100);
  });

  it("keeps every card within 140 English and 160 Portuguese characters", () => {
    expect(
      idsWhere(
        cards,
        (card) => card.text.en.length > 140 || card.text.pt.length > 160
      )
    ).toEqual([]);
  });

  it("covers the family traditions the spec names at level 2", () => {
    const levelTwoText = cards
      .filter((card) => card.level === 2)
      .map((card) => card.text.en)
      .join(" ");
    for (const topic of [
      /Menino Jesus/,
      /Pai Natal/,
      /Bolo-Rei/,
      /\bfava\b/i,
      /presépio/i,
      /Janeiras/,
      /\bReis\b/,
      /Tió/,
      /Befana/,
      /Yule Lads/,
      /KFC/,
      /beach/i,
    ]) {
      expect(levelTwoText, String(topic)).toMatch(topic);
    }
  });

  it("keeps family no-go topics, spoilers, misreported facts and off-style Portuguese out", () => {
    const noGoEnglish = [
      /politic/i,
      /\b(money|costs?|price|expensive|salary|euros?)\b|€/i,
      /\b(weight|diet|fat|calories|skinny|ugl(y|iest)|good-looking)\b/i,
      /\b(marr(y|ied|iage)|wedding|pregnan\w*|babies|careers?|jobs?)\b/i,
      /favou?rite (relative|person|cousin|aunt|uncle|grand\w+|sibling|brother|sister|son|daughter)/i,
      /\b(dead|death|died|dying|passed away|funeral|illness|sick|hospital|divorc\w*)\b/i,
      /\b(worst|laziest|meanest|most annoying)\b/i,
      /\b(alcohol\w*|wine|beer|drunk|tipsy|champagne|cocktails?|shots?)\b/i,
      /\byour (mum and dad|mom and dad|parents|partner|husband|wife|boyfriend|girlfriend)\b/i,
      // Belief questions and Pai Natal spoilers; it also catches "a real tree", so rephrase those.
      /stop(ped)? believing|\bpray|believe in (god|jesus)|\b(is|was|isn't|wasn't|are|aren't)\b[^?.!]{0,25}\breal\b/i,
      /, not\b/i,
    ];
    // No \b before an accented first letter: JavaScript's \b only knows ASCII word characters.
    const noGoPortuguese = [
      /polític/i,
      /dinheiro|preço|custa|custou|salário|€/i,
      /\b(peso|dieta|gord[oa]s?|fei[oa]s?)\b/i,
      /\bcasa(r|mento)\b|bebés|grávida|carreira|emprego/i,
      /\b(mort[eo]s?|morreu|morrer|faleci|funeral|doen(ça|te)|hospital|divórcio|divorcia)/i,
      /\b(vinho|cerveja|bêbad|espumante|champanhe|licor|aguardente)|álcool/i,
      /\bos teus pais\b|\b(teu|tua) (namorad[oa]|marido|mulher|companheir[oa])\b/i,
      /você|Papai Noel|\bpresentes?\b|, não\b/i,
    ];
    const flagged = idsWhere(
      cards,
      (card) =>
        noGoEnglish.some((pattern) => pattern.test(card.text.en)) ||
        noGoPortuguese.some((pattern) => pattern.test(card.text.pt)) ||
        misreportedChristmasFacts.some(
          (pattern) => pattern.test(card.text.en) || pattern.test(card.text.pt)
        )
    );
    expect(flagged).toEqual([]);
  });
});

describe("friendsmas pack", () => {
  const cards = cardsOfDeck("friendsmas");
  const countWhere = (matches: (card: Card) => boolean) =>
    cards.filter(matches).length;

  it("numbers 40 cards from friendsmas-001 to friendsmas-040 in level order", () => {
    expect(cards.map((card) => card.id)).toEqual(
      Array.from(
        { length: 40 },
        (_, index) => `friendsmas-${String(index + 1).padStart(3, "0")}`
      )
    );
    expect(cards.map((card) => card.level)).toEqual([
      ...Array<number>(16).fill(1),
      ...Array<number>(14).fill(2),
      ...Array<number>(10).fill(3),
    ]);
  });

  it("mixes 26 questions, 8 timed challenges and 6 everyone rounds", () => {
    expect(countWhere((card) => card.type === "question")).toBe(26);
    expect(
      countWhere(
        (card) => card.type === "challenge" && card.timerSeconds !== undefined
      )
    ).toBe(8);
    expect(countWhere((card) => card.type === "everyone")).toBe(6);
    expect(
      countWhere((card) => card.level === 3 && card.type !== "question")
    ).toBe(0);
  });

  it("opens with a short level 1 question for previews", () => {
    expect(cards[0]).toMatchObject({ type: "question", level: 1 });
    expect(cards[0]?.text.en.length ?? 999).toBeLessThanOrEqual(100);
  });

  it("keeps every card within 140 English and 160 Portuguese characters", () => {
    expect(
      idsWhere(
        cards,
        (card) => card.text.en.length > 140 || card.text.pt.length > 160
      )
    ).toEqual([]);
  });

  it("covers the traditions the spec names at levels 1 and 2", () => {
    const earlyText = cards
      .filter((card) => card.level < 3)
      .map((card) => card.text.en)
      .join(" ");
    for (const topic of [
      /Consoada/,
      /roupa-velha/i,
      /madeiro/i,
      /brinde/i,
      /Jólabókaflóð/,
      /caganer/i,
      /Krampus/,
      /Kalle Anka|Donald Duck/,
      /ber months/i,
    ]) {
      expect(earlyText, String(topic)).toMatch(topic);
    }
  });

  it("keeps friends no-go topics, misreported facts and off-style Portuguese out", () => {
    const noGoEnglish = [
      /\byour (kids|children|son|daughter|partner|husband|wife|boyfriend|girlfriend|parents)\b/i,
      /\bgo(ing)? home to\b/i,
      /\b(pray\w*|your (church|faith|religion))\b/i,
      /\b(sex(y|ual)?|naked|nude|striptease|kiss(es|ing)?|horny|hook(ing)? up)\b/i,
      /\b(ugliest|laziest|meanest|stingiest|most annoying)\b/i,
      /, not\b/i,
    ];
    const offStylePortuguese = /você|Papai Noel|\bpresentes?\b|, não\b/i;
    const alcoholDareEnglish =
      /\b(drinks?|drinking|drunk|tipsy|shots?|chug\w*|sips?)\b/i;
    const alcoholDarePortuguese =
      /\bbeb(e|a|am|er|es|eu|ida|idas)\b|bêbad|\bshots?\b/i;
    const missingEnglish =
      /\bmiss(es|ed|ing)?\b|\b(dead|death|died|passed away|funeral)\b/i;
    const missingPortuguese =
      /saudade|sent(es|iste|ir) (a )?falta|\bmort[oa]s?\b|morreu|faleci/i;
    const flagged = idsWhere(
      cards,
      (card) =>
        noGoEnglish.some((pattern) => pattern.test(card.text.en)) ||
        offStylePortuguese.test(card.text.pt) ||
        misreportedChristmasFacts.some(
          (pattern) => pattern.test(card.text.en) || pattern.test(card.text.pt)
        ) ||
        (card.type !== "question" &&
          (alcoholDareEnglish.test(card.text.en) ||
            alcoholDarePortuguese.test(card.text.pt))) ||
        (card.level < 3 &&
          (missingEnglish.test(card.text.en) ||
            missingPortuguese.test(card.text.pt))) ||
        (card.level === 3 && /\bworst\b|trauma/i.test(card.text.en))
    );
    expect(flagged).toEqual([]);
  });
});
