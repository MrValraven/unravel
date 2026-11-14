import { defineCopy } from "../../i18n/useCopy";

const en = {
  documentTitle: "What is Unravel?",
  backToHome: "Back to home",
  title: "What is Unravel?",
  points: [
    "Unravel is a social game that helps people connect in an easy, carefree way.",
    "Each deck rises gently in intensity, so the questions and challenges build familiarity and closeness one card at a time.",
    "Every deck fits a moment, from a first date to a night out with friends. Play it in order, shuffle it or make your own, and enjoy the feeling of a new connection.",
  ],
  cardsTitle: "How the cards work",
  cardKinds: {
    questions: {
      title: "Questions",
      body: "One person asks and the next one answers. Add names before you start and Unravel keeps track of whose turn it is.",
    },
    challenges: {
      title: "Challenges",
      body: "Something to do together. Some come with a timer.",
    },
    everyone: {
      title: "Everyone cards",
      body: "The whole table answers, one person after another.",
    },
    levels: {
      title: "Levels",
      body: "Cards rise through three levels, from warm to all in. Start at the level that suits the moment.",
    },
    skip: {
      title: "Skip and Not tonight",
      body: "Skip for now sends a card to the end of the deck. Not tonight sets it aside for the rest of the game.",
    },
    pass: {
      title: "Pass",
      body: "On 18+ decks anyone can pass on any card, and nobody has to say why.",
    },
  },
  startPlaying: "Start playing",
};

export const introCopy = defineCopy<typeof en>({
  en,
  pt: {
    documentTitle: "O que é o Unravel?",
    backToHome: "Voltar ao início",
    title: "O que é o Unravel?",
    points: [
      "O Unravel é um jogo social que ajuda as pessoas a criar ligações de forma fácil e descontraída.",
      "Cada baralho sobe de intensidade aos poucos, por isso as perguntas e os desafios criam confiança e proximidade carta a carta.",
      "Cada baralho foi pensado para um momento, de um primeiro encontro a uma noite com amigos. Joga pela ordem, baralha as cartas ou cria o teu próprio baralho, e aproveita a sensação de uma ligação nova.",
    ],
    cardsTitle: "Como funcionam as cartas",
    cardKinds: {
      questions: {
        title: "Perguntas",
        body: "Uma pessoa pergunta e a seguinte responde. Junta os nomes antes de começar e o Unravel sabe sempre de quem é a vez.",
      },
      challenges: {
        title: "Desafios",
        body: "Algo para fazerem juntos. Alguns trazem um temporizador.",
      },
      everyone: {
        title: "Cartas para todos",
        body: "Toda a mesa responde, uma pessoa de cada vez.",
      },
      levels: {
        title: "Níveis",
        body: "As cartas sobem por três níveis, do Morno ao Com tudo. Começa no nível que combina com o momento.",
      },
      skip: {
        title: "Saltar e Hoje não",
        body: "Saltar por agora manda a carta para o fim do baralho. Hoje não põe-na de lado até ao fim do jogo.",
      },
      pass: {
        title: "Passar",
        body: "Nos baralhos 18+ qualquer pessoa pode passar qualquer carta, sem ter de explicar porquê.",
      },
    },
    startPlaying: "Começar a jogar",
  },
});
