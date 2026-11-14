import { defineCopy } from "../../i18n/useCopy";

const en = {
  documentTitle: "Find a deck",
  title: "Find a deck",
  backLabel: "Back to decks",
  stepProgress: "Question {step} of {total}",
  previousStep: "Previous question",
  audience: {
    question: "Who are you with?",
    options: {
      "new-people": "People I just met",
      friends: "Friends",
      date: "A date",
      partner: "My partner",
      group: "A big group",
    },
  },
  mood: {
    question: "What is the mood?",
    options: {
      light: "Light and easy",
      deep: "Deep talk",
      playful: "Playful",
      spicy: "Flirty",
    },
  },
  spice: {
    question: "How spicy?",
    options: {
      none: "Keep it clean",
      "a-little": "A little",
      "all-in": "Adults only (18+)",
    },
  },
  results: {
    title: "Try one of these",
    intro: "Ranked by how well each deck fits your answers.",
    emptyTitle: "No deck fits all of that",
    emptyBody: "Try other answers, or browse every deck.",
    startDeck: "Start deck",
    startDeckLabel: "Start deck: {deck}",
    previewDeck: "Preview",
    previewDeckLabel: "Preview {deck}",
    startOver: "Start over",
    browseDecks: "Browse all decks",
  },
};

export const finderCopy = defineCopy<typeof en>({
  en,
  pt: {
    documentTitle: "Encontrar um baralho",
    title: "Encontrar um baralho",
    backLabel: "Voltar aos baralhos",
    stepProgress: "Pergunta {step} de {total}",
    previousStep: "Pergunta anterior",
    audience: {
      question: "Com quem estás?",
      options: {
        "new-people": "Pessoas que acabei de conhecer",
        friends: "Amigos",
        date: "Um encontro",
        partner: "O meu par",
        group: "Um grupo grande",
      },
    },
    mood: {
      question: "Qual é o ambiente?",
      options: {
        light: "Leve e descontraído",
        deep: "Conversa a fundo",
        playful: "Brincalhão",
        spicy: "Atrevido",
      },
    },
    spice: {
      question: "Quão picante?",
      options: {
        none: "Sem picante",
        "a-little": "Um pouco",
        "all-in": "Só para adultos (18+)",
      },
    },
    results: {
      title: "Experimenta um destes",
      intro:
        "Ordenados pelo quanto cada baralho combina com as tuas respostas.",
      emptyTitle: "Nenhum baralho combina com tudo isso",
      emptyBody: "Experimenta outras respostas ou vê todos os baralhos.",
      startDeck: "Começar baralho",
      startDeckLabel: "Começar baralho: {deck}",
      previewDeck: "Pré-visualizar",
      previewDeckLabel: "Pré-visualizar {deck}",
      startOver: "Recomeçar",
      browseDecks: "Ver todos os baralhos",
    },
  },
});
