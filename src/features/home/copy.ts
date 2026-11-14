import { defineCopy } from "../../i18n/useCopy";

const en = {
  title: "Unravel",
  tagline: "The uncomplicated way of making new friends",
  getStarted: "Get started",
  howItWorks: "How Unravel works",
  openSettings: "Open settings",
  deckCount: {
    one: "{count} deck ready to play",
    other: "{count} decks ready to play",
  },
  dailyCard: {
    eyebrow: "Card of the day",
    fromDeck: "From {deck}",
    playDeck: "Play this deck",
    playDeckLabel: "Play this deck: {deck}",
  },
  footer: {
    madeWith: "Made with",
    love: "love",
    by: "by",
  },
};

export const homeCopy = defineCopy<typeof en>({
  en,
  pt: {
    title: "Unravel",
    tagline: "A forma descomplicada de fazer novos amigos",
    getStarted: "Começar",
    howItWorks: "Como funciona o Unravel",
    openSettings: "Abrir definições",
    deckCount: {
      one: "{count} baralho pronto a jogar",
      other: "{count} baralhos prontos a jogar",
    },
    dailyCard: {
      eyebrow: "Carta do dia",
      fromDeck: "Do baralho {deck}",
      playDeck: "Jogar este baralho",
      playDeckLabel: "Jogar este baralho: {deck}",
    },
    footer: {
      madeWith: "Feito com",
      love: "amor",
      by: "por",
    },
  },
});
