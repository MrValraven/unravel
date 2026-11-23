import {
  MAX_TIMER_SECONDS,
  MIN_TIMER_SECONDS,
  allowsTimer,
  cardTypes,
} from "./cardRules";
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
    const knownTypes: readonly string[] = cardTypes;
    const unknown = allCards.filter((card) => !knownTypes.includes(card.type));
    expect(unknown.map((card) => card.id)).toEqual([]);
  });

  it("puts timers only on challenge and hot-seat cards, as whole seconds from 30 to 120", () => {
    const timedCards = allCards.filter(
      (card) => card.timerSeconds !== undefined
    );
    const misplaced = timedCards.filter((card) => !allowsTimer(card.type));
    const outOfRange = timedCards.filter(
      (card) =>
        !Number.isInteger(card.timerSeconds) ||
        (card.timerSeconds ?? 0) < MIN_TIMER_SECONDS ||
        (card.timerSeconds ?? 0) > MAX_TIMER_SECONDS
    );
    expect(misplaced.map((card) => card.id)).toEqual([]);
    expect(outOfRange.map((card) => card.id)).toEqual([]);
  });

  it("keeps every pack in rising level order", () => {
    const outOfOrder = decks.flatMap((deck) =>
      deck.cards
        .filter(
          (card, index) => card.level < (deck.cards[index - 1]?.level ?? 1)
        )
        .map((card) => card.id)
    );
    expect(outOfOrder).toEqual([]);
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

describe.each([
  { deckId: "summer-nights", questions: 22, timedChallenges: 5, everyone: 5 },
  { deckId: "spring-reset", questions: 24, timedChallenges: 3, everyone: 5 },
])("$deckId pack", ({ deckId, questions, timedChallenges, everyone }) => {
  const cards = cardsOfDeck(deckId);
  const countWhere = (matches: (card: Card) => boolean) =>
    cards.filter(matches).length;

  it("numbers 32 cards in level order with 13, 11 and 8 per level", () => {
    expect(cards.map((card) => card.id)).toEqual(
      Array.from(
        { length: 32 },
        (_, index) => `${deckId}-${String(index + 1).padStart(3, "0")}`
      )
    );
    expect(cards.map((card) => card.level)).toEqual([
      ...Array<number>(13).fill(1),
      ...Array<number>(11).fill(2),
      ...Array<number>(8).fill(3),
    ]);
  });

  it("mixes the planned questions, timed challenges and everyone rounds", () => {
    expect(countWhere((card) => card.type === "question")).toBe(questions);
    expect(
      countWhere(
        (card) => card.type === "challenge" && card.timerSeconds !== undefined
      )
    ).toBe(timedChallenges);
    expect(countWhere((card) => card.type === "everyone")).toBe(everyone);
    expect(
      countWhere((card) => card.level === 3 && card.type !== "question")
    ).toBe(0);
  });

  it("opens with a short level 1 question for previews", () => {
    expect(cards[0]).toMatchObject({ type: "question", level: 1 });
    expect(cards[0]?.text.en.length ?? 999).toBeLessThanOrEqual(100);
  });

  it("keeps every card within 140 English and 160 Portuguese characters and out of Brazilian forms", () => {
    expect(
      idsWhere(
        cards,
        (card) => card.text.en.length > 140 || card.text.pt.length > 160
      )
    ).toEqual([]);
    expect(
      idsWhere(cards, (card) =>
        /você|\b(curtir|legal|ônibus|trem|celular|time|tchau|banheiro|geladeira|sorvete)\b|\bestá \w+ndo\b|\bestou \w+ndo\b/i.test(
          card.text.pt
        )
      )
    ).toEqual([]);
  });
});

describe("group-night pack", () => {
  const cards = cardsOfDeck("group-night");
  const countWhere = (matches: (card: Card) => boolean) =>
    cards.filter(matches).length;

  it("numbers 40 Group Night cards in level order with 16, 14 and 10 per level", () => {
    expect(cards.map((card) => card.id)).toEqual(
      Array.from(
        { length: 40 },
        (_, index) => `group-night-${String(index + 1).padStart(3, "0")}`
      )
    );
    expect(cards.map((card) => card.level)).toEqual([
      ...Array<number>(16).fill(1),
      ...Array<number>(14).fill(2),
      ...Array<number>(10).fill(3),
    ]);
  });

  it("makes Group Night mostly votes and hot seats", () => {
    expect(countWhere((card) => card.type === "vote")).toBe(14);
    expect(countWhere((card) => card.type === "hot-seat")).toBe(12);
    expect(
      countWhere(
        (card) => card.type === "hot-seat" && card.timerSeconds !== undefined
      )
    ).toBeGreaterThanOrEqual(4);
    expect(countWhere((card) => card.type === "everyone")).toBe(6);
    expect(
      countWhere(
        (card) => card.type === "challenge" && card.timerSeconds !== undefined
      )
    ).toBe(4);
    expect(countWhere((card) => card.type === "challenge")).toBe(4);
    expect(countWhere((card) => card.type === "question")).toBe(4);
  });

  it("keeps every card within 140 English and 160 Portuguese characters and out of Brazilian forms", () => {
    expect(
      idsWhere(
        cards,
        (card) => card.text.en.length > 140 || card.text.pt.length > 160
      )
    ).toEqual([]);
    expect(
      idsWhere(cards, (card) =>
        /você|\b(curtir|legal|ônibus|trem|celular|time|tchau|banheiro|geladeira|sorvete)\b|\bestá \w+ndo\b|\bestou \w+ndo\b/i.test(
          card.text.pt
        )
      )
    ).toEqual([]);
  });

  it("keeps votes kind: nothing about looks, weight, money or sexuality", () => {
    const unkindEnglish =
      /\b(ugl(y|iest)|fat|weight|skinny|short(est)?|tall(est)?|bald|poor(est)?|rich(est)?|broke|money|gay|straight|sex\w*|worst|dumbest|stupid\w*|annoying)\b/i;
    const unkindPortuguese =
      /\b(fei[oa]s?|gord[oa]s?|peso|magr[oa]s?|baix[oa]s?|alt[oa]s?|careca|pobre|ric[oa]s?|tes[oa]|dinheiro|gay|hétero|sexo|sexual|pior|burr[oa]|estúpid[oa]|irritante)\b/i;
    expect(
      idsWhere(
        cards,
        (card) =>
          card.type === "vote" &&
          (unkindEnglish.test(card.text.en) ||
            unkindPortuguese.test(card.text.pt))
      )
    ).toEqual([]);
  });
});

describe("group play cards", () => {
  it("keeps names and placeholders out of hot-seat and vote text", () => {
    const placeholder = /\{|\}|\[|\]|_{2,}|\b(name|nome)\b/i;
    const flagged = idsWhere(
      allCards,
      (card) =>
        (card.type === "vote" || card.type === "hot-seat") &&
        locales.some((locale) => placeholder.test(card.text[locale]))
    );
    expect(flagged).toEqual([]);
  });

  it.each([
    ["bairro-alto", 43],
    ["unravel", 30],
  ] as const)(
    "adds votes, hot seats and timed group challenges to %s from card %i",
    (deckId, fromNumber) => {
      const newCards = cardsOfDeck(deckId).filter(
        (card) => Number(card.id.slice(-3)) >= fromNumber
      );
      expect(newCards.map((card) => card.id).sort()).toEqual(
        Array.from(
          { length: 6 },
          (_, index) =>
            `${deckId}-${String(fromNumber + index).padStart(3, "0")}`
        )
      );
      const count = (type: Card["type"], isTimed?: boolean) =>
        newCards.filter(
          (card) =>
            card.type === type &&
            (isTimed === undefined ||
              (card.timerSeconds !== undefined) === isTimed)
        ).length;
      expect(count("vote")).toBe(2);
      expect(count("hot-seat")).toBe(2);
      expect(count("challenge", true)).toBe(2);
      expect(
        idsWhere(
          newCards,
          (card) => card.text.en.length > 140 || card.text.pt.length > 160
        )
      ).toEqual([]);
    }
  );
});

describe("content safety", () => {
  const retiredCardIds = ["bairro-alto-032", "bairro-alto-037"];
  const findCard = (id: string): Card | undefined =>
    allCards.find((card) => card.id === id);

  it("never reuses a retired card id", () => {
    expect(
      allCards
        .filter((card) => retiredCardIds.includes(card.id))
        .map((card) => card.id)
    ).toEqual([]);
  });

  const friendsSexPattern =
    /\b(sex|sexy|naked|nude|orgasms?|kinky?|foreplay|threesome)\b/i;
  const friendsSexPatternPt = /\b(sexo|sexy|nu[as]?|orgasmos?|preliminares)\b/i;

  it("keeps sex out of every non-adult friends deck", () => {
    const friendsDecks = decks.filter(
      (deck) => deck.category === "friends" && !deck.isAdult
    );
    expect(friendsDecks.map((deck) => deck.id)).toContain("group-night");
    const flagged = friendsDecks.flatMap((deck) =>
      idsWhere(
        deck.cards,
        (card) =>
          friendsSexPattern.test(card.text.en) ||
          friendsSexPatternPt.test(card.text.pt)
      )
    );
    expect(flagged).toEqual([]);
  });

  it("moves the two Bairro Alto cards into Guilty Pleasures at level 3", () => {
    const movedCards = [
      {
        id: "hedonistic-societies-022",
        en: "If your sex life was an ice cream flavour, which one would it be and why?",
        pt: "Se a tua vida sexual fosse um sabor de gelado, qual seria e porquê?",
      },
      {
        id: "hedonistic-societies-023",
        en: "What's the most shocking thing someone has ever said to you during sex?",
        pt: "Qual foi a coisa mais chocante que alguém já te disse durante o sexo?",
      },
    ];
    const guiltyPleasures = cardsOfDeck("hedonistic-societies");
    for (const moved of movedCards) {
      expect(
        guiltyPleasures.find((card) => card.id === moved.id),
        moved.id
      ).toEqual({
        id: moved.id,
        type: "question",
        level: 3,
        text: { en: moved.en, pt: moved.pt },
      });
    }
  });

  it("asks about rough play and consensual non-consent as level 3 talk-throughs", () => {
    for (const id of ["flames-of-desire-035", "flames-of-desire-036"]) {
      const card = findCard(id);
      expect(card, id).toMatchObject({ type: "question", level: 3 });
      expect(card?.timerSeconds, id).toBeUndefined();
      expect(card?.text.en.endsWith("?"), id).toBe(true);
      expect(card?.text.pt.endsWith("?"), id).toBe(true);
      expect(card?.text.en, id).not.toMatch(/^(show|do|try|let)\b/i);
    }
  });

  it("gives Bairro Alto four level 3 cards", () => {
    expect(
      cardsOfDeck("bairro-alto").filter((card) => card.level === 3)
    ).toHaveLength(4);
  });

  it("keeps Silly Goose free of substances", () => {
    expect(
      idsWhere(
        cardsOfDeck("silly-goose"),
        (card) =>
          /\b(addict\w*|substances?|inject\w*|inhale\w*|drugs?)\b/i.test(
            card.text.en
          ) || /vici|substância|inje(t|c)|\binal|droga/i.test(card.text.pt)
      )
    ).toEqual([]);
  });
});

describe("padded thin decks", () => {
  const newCardsOf = (deckId: string, fromNumber: number): Card[] =>
    cardsOfDeck(deckId).filter(
      (card) => Number(card.id.slice(-3)) >= fromNumber
    );
  const safeKinkText = cardsOfDeck("safe-kink")
    .map((card) => card.text.en)
    .join(" ");

  it.each([
    ["aftercare-glow", 24],
    ["safe-kink", 24],
    ["silly-goose", 30],
    ["hedonistic-societies", 30],
  ] as const)("gives %s %i cards numbered without gaps", (deckId, count) => {
    // Sorted: the pack array runs in level order, not id order.
    expect(
      cardsOfDeck(deckId)
        .map((card) => card.id)
        .sort()
    ).toEqual(
      Array.from(
        { length: count },
        (_, index) => `${deckId}-${String(index + 1).padStart(3, "0")}`
      )
    );
  });

  it("balances Aftercare Glow at eight cards per level", () => {
    const cards = cardsOfDeck("aftercare-glow");
    for (const level of [1, 2, 3]) {
      expect(
        cards.filter((card) => card.level === level),
        `level ${level}`
      ).toHaveLength(8);
    }
  });

  it("covers testing, health, substances, aftercare and check-ins in Safe Kink", () => {
    for (const topic of [
      /\b(STI|tested|testing)\b/i,
      /\bhealth\b/i,
      /\b(alcohol|substances?|drugs?)\b/i,
      /aftercare/i,
      /check(-| )?in/i,
    ]) {
      expect(safeKinkText, String(topic)).toMatch(topic);
    }
  });

  it("keeps limits and safe words at level 1 in Safe Kink", () => {
    const safeKink = cardsOfDeck("safe-kink");
    for (const id of ["safe-kink-003", "safe-kink-007"]) {
      expect(safeKink.find((card) => card.id === id)?.level, id).toBe(1);
    }
  });

  it("gives Silly Goose at least five timed challenges", () => {
    expect(
      cardsOfDeck("silly-goose").filter(
        (card) => card.type === "challenge" && card.timerSeconds !== undefined
      ).length
    ).toBeGreaterThanOrEqual(5);
  });

  it("keeps new cards short", () => {
    const newCards = [
      ...newCardsOf("aftercare-glow", 9),
      ...newCardsOf("safe-kink", 11),
      ...newCardsOf("silly-goose", 17),
      ...newCardsOf("hedonistic-societies", 24),
    ];
    expect(newCards.length).toBeGreaterThan(0);
    expect(
      idsWhere(
        newCards,
        (card) => card.text.en.length > 140 || card.text.pt.length > 160
      )
    ).toEqual([]);
  });

  it("never uses the Brazilian singular você in any pack", () => {
    expect(
      idsWhere(allCards, (card) => /\bvocê(?!s)/i.test(card.text.pt))
    ).toEqual([]);
  });
});
