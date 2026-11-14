import { defineCopy } from "../../i18n/useCopy";

const en = {
  picker: {
    documentTitle: "Choose a deck",
    title: "Decks",
    backLabel: "Home",
    settings: "Open settings",
    intro: "Pick a deck for tonight. Tap one to see a few of its cards first.",
  },
  finderEntry: {
    title: "Not sure? Find a deck",
    body: "Answer three quick questions and get a suggestion.",
  },
  yourDecks: {
    title: "Your decks",
    favouritesHint: {
      one: "Star {count} more card while you play to build your favourites deck.",
      other:
        "Star {count} more cards while you play to build your favourites deck.",
    },
    createDeck: "Create a deck",
    manageDecks: "Manage your decks",
  },
  deckCard: {
    cardCount: { one: "{count} card", other: "{count} cards" },
    adultsOnly: "18+",
    adultsOnlyLabel: "For adults only",
  },
  tags: {
    new: "New",
    beta: "Beta",
    seasonal: "Seasonal",
  },
  levels: {
    title: "Card levels",
    warm: "Warm",
    deeper: "Deeper",
    allIn: "All in",
  },
  cardTypes: {
    question: "Question",
    challenge: "Challenge",
    everyone: "Everyone answers",
  },
  samples: {
    title: "A taste of the deck",
    adultNotice:
      "Sample cards from adult decks appear after you confirm you are 18 or older.",
    revealSamples: "Confirm age to see samples",
  },
  preview: {
    startDeck: "Start deck",
    openDeckPage: "Open deck page",
  },
  landing: {
    backLabel: "All decks",
    startDeck: "Start deck",
    browseDecks: "Browse all decks",
    eyebrow: "Unravel deck",
    seasonSameMonth: "In season {startDay} to {endDay} {month}.",
    seasonCrossMonth:
      "In season {startDay} {startMonth} to {endDay} {endMonth}.",
    seasonNote:
      "Outside those dates it leaves the deck list, and you can still play it from this page.",
  },
};

export const deckCopy = defineCopy<typeof en>({
  en,
  pt: {
    picker: {
      documentTitle: "Escolhe um baralho",
      title: "Baralhos",
      backLabel: "Início",
      settings: "Abrir definições",
      intro:
        "Escolhe um baralho para esta noite. Toca num para veres algumas das cartas primeiro.",
    },
    finderEntry: {
      title: "Na dúvida? Encontra um baralho",
      body: "Responde a três perguntas rápidas e recebe uma sugestão.",
    },
    yourDecks: {
      title: "Os teus baralhos",
      favouritesHint: {
        one: "Marca com estrela mais {count} carta enquanto jogas para criares o teu baralho de favoritas.",
        other:
          "Marca com estrela mais {count} cartas enquanto jogas para criares o teu baralho de favoritas.",
      },
      createDeck: "Criar um baralho",
      manageDecks: "Gerir os teus baralhos",
    },
    deckCard: {
      cardCount: { one: "{count} carta", other: "{count} cartas" },
      adultsOnly: "18+",
      adultsOnlyLabel: "Só para adultos",
    },
    tags: {
      new: "Novo",
      beta: "Beta",
      seasonal: "Sazonal",
    },
    levels: {
      title: "Níveis das cartas",
      warm: "Morno",
      deeper: "Mais fundo",
      allIn: "Com tudo",
    },
    cardTypes: {
      question: "Pergunta",
      challenge: "Desafio",
      everyone: "Todos respondem",
    },
    samples: {
      title: "Um cheirinho do baralho",
      adultNotice:
        "As cartas de exemplo dos baralhos para adultos aparecem depois de confirmares que tens 18 anos ou mais.",
      revealSamples: "Confirmar idade para ver exemplos",
    },
    preview: {
      startDeck: "Começar baralho",
      openDeckPage: "Abrir página do baralho",
    },
    landing: {
      backLabel: "Todos os baralhos",
      startDeck: "Começar baralho",
      browseDecks: "Ver todos os baralhos",
      eyebrow: "Baralho Unravel",
      seasonSameMonth: "Disponível de {startDay} a {endDay} de {month}.",
      seasonCrossMonth:
        "Disponível de {startDay} de {startMonth} a {endDay} de {endMonth}.",
      seasonNote:
        "Fora dessas datas sai da lista de baralhos, e podes jogá-lo a partir desta página.",
    },
  },
});
