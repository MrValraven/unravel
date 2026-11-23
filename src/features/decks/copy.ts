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
    title: "Not sure which deck? Find one",
    body: "Answer three quick questions and get a suggestion.",
  },
  season: {
    inSeasonTitle: "In season now",
    comingUp: "Coming up: {deck}, from {date}",
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
  makeOwnDeck: {
    title: "Make your own deck",
    body: "Write your own cards and share them with a link, or star {count} cards while you play for a favourites deck.",
    action: "Create a deck",
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
    vote: "Vote",
    "hot-seat": "Hot seat",
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
    shareDeck: "Share deck",
    shareText: "{deck}, a conversation deck on Unravel",
    linkCopied: "Link copied",
    eyebrow: "Unravel deck",
    seasonSameMonth: "In season {startDay} to {endDay} {month}.",
    seasonCrossMonth:
      "In season {startDay} {startMonth} to {endDay} {endMonth}.",
    seasonNote:
      "Outside those dates it leaves the deck list, and you can still play it from this page.",
    breadcrumbLabel: "Breadcrumb",
    breadcrumbDecks: "Decks",
    relatedTitle: "Related decks",
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
      title: "Não sabes que baralho escolher? Encontra um",
      body: "Responde a três perguntas rápidas e recebe uma sugestão.",
    },
    season: {
      inSeasonTitle: "Em época agora",
      comingUp: "Em breve: {deck}, a partir de {date}",
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
    makeOwnDeck: {
      title: "Cria o teu baralho",
      body: "Escreve as tuas próprias cartas e partilha-as com uma ligação, ou marca {count} cartas com estrela enquanto jogas para teres um baralho de favoritas.",
      action: "Criar um baralho",
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
      vote: "Votação",
      "hot-seat": "Holofote",
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
      shareDeck: "Partilhar baralho",
      shareText: "{deck}, um baralho de conversa no Unravel",
      linkCopied: "Link copiado",
      eyebrow: "Baralho Unravel",
      seasonSameMonth: "Disponível de {startDay} a {endDay} de {month}.",
      seasonCrossMonth:
        "Disponível de {startDay} de {startMonth} a {endDay} de {endMonth}.",
      seasonNote:
        "Fora dessas datas sai da lista de baralhos, e podes jogá-lo a partir desta página.",
      breadcrumbLabel: "Caminho de navegação",
      breadcrumbDecks: "Baralhos",
      relatedTitle: "Baralhos parecidos",
    },
  },
});
