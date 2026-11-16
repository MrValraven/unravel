import { defineCopy } from "../i18n/useCopy";

const en = {
  footer: {
    navLabel: "Unravel",
    decks: "Decks",
    finder: "Find a deck",
    createDeck: "Create a deck",
    about: "About",
    privacy: "No accounts and no tracking. Everything stays on your device.",
    madeWith: "Made with",
    love: "love",
    by: "by",
  },
};

export const siteCopy = defineCopy<typeof en>({
  en,
  pt: {
    footer: {
      navLabel: "Unravel",
      decks: "Baralhos",
      finder: "Encontrar um baralho",
      createDeck: "Criar um baralho",
      about: "Sobre",
      privacy: "Sem contas e sem rastreio. Tudo fica no teu dispositivo.",
      madeWith: "Feito com",
      love: "amor",
      by: "por",
    },
  },
});

/**
 * The language suggestion only shows while the app is in English, to players
 * whose browser asks for Portuguese, so it is always written in Portuguese
 * (pt-PT) and marked with that language for screen readers.
 */
export const languageSuggestionCopy = {
  lang: "pt-PT",
  label: "Sugestão de idioma",
  prompt: "Jogar em português?",
  accept: "Mudar para português",
  dismiss: "Continuar em inglês",
} as const;
