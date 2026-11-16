import { defineCopy } from "../../i18n/useCopy";

const en = {
  title: "Unravel",
  /** The whole tab title, the same as the static one in index.html. */
  documentTitle: "Unravel · Good questions for friends, dates and partners",
  tagline: "Good questions for friends, dates and partners.",
  getStarted: "Get started",
  howItWorks: "How Unravel works",
  openSettings: "Open settings",
  deckCount: {
    one: "{count} deck ready to play",
    other: "{count} decks ready to play",
  },
  fan: {
    label: "Four Unravel cards from different decks, fanned out",
  },
  dailyCard: {
    eyebrow: "Card of the day",
    fromDeck: "From {deck}",
    playDeck: "Play this deck",
    playDeckLabel: "Play this deck: {deck}",
  },
  landing: {
    steps: {
      title: "How it works",
      items: [
        {
          title: "Pick a deck",
          body: "There is one for every table: new faces, old friends, a first date or someone you have loved for years.",
        },
        {
          title: "Pass the phone",
          body: "Read the card out loud, answer it, then hand the phone on. Add names and Unravel keeps track of turns.",
        },
        {
          title: "Go deeper",
          body: "Every deck starts light and rises through three levels, so the talk gets a little closer with each card.",
        },
      ],
    },
    shelf: {
      title: "Start with a deck",
      seeAll: "See all decks",
      cardCount: {
        one: "{count} card",
        other: "{count} cards",
      },
    },
    phone: {
      title: "Play on your phone",
      body: "Unravel is made for the phone you pass around the table. Scan the code to open it, then add it to your home screen to play without a connection.",
      qrLabel: "QR code that opens unravel.tiagocostadev.com",
    },
    privacy: {
      title: "What you say stays at the table",
      body: "Unravel never hears your answers and never sends anything anywhere. Your games, favourites and custom decks are saved in this browser and nowhere else.",
      points: ["No accounts", "No tracking", "Everything stays on your device"],
    },
    faq: {
      title: "Questions before you play",
    },
  },
};

export const homeCopy = defineCopy<typeof en>({
  en,
  pt: {
    title: "Unravel",
    documentTitle: "Unravel · Boas perguntas para amigos, encontros e casais",
    tagline: "Boas perguntas para amigos, encontros e casais.",
    getStarted: "Começar",
    howItWorks: "Como funciona o Unravel",
    openSettings: "Abrir definições",
    deckCount: {
      one: "{count} baralho pronto a jogar",
      other: "{count} baralhos prontos a jogar",
    },
    fan: {
      label: "Quatro cartas do Unravel de baralhos diferentes, em leque",
    },
    dailyCard: {
      eyebrow: "Carta do dia",
      fromDeck: "Do baralho {deck}",
      playDeck: "Jogar este baralho",
      playDeckLabel: "Jogar este baralho: {deck}",
    },
    landing: {
      steps: {
        title: "Como funciona",
        items: [
          {
            title: "Escolhe um baralho",
            body: "Há um para cada mesa: caras novas, amigos de sempre, um primeiro encontro ou alguém que amas há anos.",
          },
          {
            title: "Passa o telemóvel",
            body: "Lê a carta em voz alta, responde e passa o telemóvel. Junta os nomes e o Unravel sabe de quem é a vez.",
          },
          {
            title: "Vai mais fundo",
            body: "Cada baralho começa leve e sobe por três níveis, por isso a conversa fica mais próxima a cada carta.",
          },
        ],
      },
      shelf: {
        title: "Começa por um baralho",
        seeAll: "Ver todos os baralhos",
        cardCount: {
          one: "{count} carta",
          other: "{count} cartas",
        },
      },
      phone: {
        title: "Joga no telemóvel",
        body: "O Unravel foi feito para o telemóvel que passa de mão em mão. Lê o código para o abrir e adiciona-o ao ecrã principal para jogar sem rede.",
        qrLabel: "Código QR que abre unravel.tiagocostadev.com",
      },
      privacy: {
        title: "O que se diz fica à mesa",
        body: "O Unravel nunca ouve as tuas respostas nem envia nada para lado nenhum. Os teus jogos, favoritas e baralhos personalizados ficam guardados neste navegador e em mais lado nenhum.",
        points: ["Sem contas", "Sem rastreio", "Tudo fica no teu dispositivo"],
      },
      faq: {
        title: "Perguntas antes de jogar",
      },
    },
  },
});
