import type { LocalizedText } from "../../content/types";

/**
 * Questions people ask before they play. Home shows them as an FAQ, and the
 * prerender script turns the same list into FAQPage structured data, so keep
 * answers as plain text.
 */
export const faqItems: { question: LocalizedText; answer: LocalizedText }[] = [
  {
    question: {
      en: "Is Unravel free?",
      pt: "O Unravel é gratuito?",
    },
    answer: {
      en: "Yes. Every deck is free to play, with nothing to sign up for and nothing to buy.",
      pt: "Sim. Todos os baralhos são gratuitos, sem registo e sem nada para comprar.",
    },
  },
  {
    question: {
      en: "Do I need to install an app?",
      pt: "Tenho de instalar uma app?",
    },
    answer: {
      en: "No. Unravel runs in your phone's browser. You can add it to your home screen to open it like an app, and then it works without a connection too.",
      pt: "Não. O Unravel funciona no navegador do telemóvel. Podes adicioná-lo ao ecrã principal para o abrir como uma app, e assim também funciona sem rede.",
    },
  },
  {
    question: {
      en: "How many people can play?",
      pt: "Quantas pessoas podem jogar?",
    },
    answer: {
      en: "Two or more. The dating decks are made for two, and the friends decks work well with a group. Add everyone's names and Unravel keeps track of whose turn it is.",
      pt: "Duas ou mais. Os baralhos de encontros são para duas pessoas e os de amigos funcionam bem em grupo. Junta os nomes de todos e o Unravel sabe sempre de quem é a vez.",
    },
  },
  {
    question: {
      en: "What if a question feels too personal?",
      pt: "E se uma pergunta for demasiado pessoal?",
    },
    answer: {
      en: "Skip it for now and it moves to the end of the deck, or choose Not tonight to set it aside for the rest of the game. On 18+ decks anyone can pass on any card without saying why.",
      pt: "Salta-a por agora e ela vai para o fim do baralho, ou escolhe Hoje não para a pôr de lado até ao fim do jogo. Nos baralhos 18+ qualquer pessoa pode passar qualquer carta sem explicar porquê.",
    },
  },
  {
    question: {
      en: "Does Unravel keep my answers or data?",
      pt: "O Unravel guarda as minhas respostas ou os meus dados?",
    },
    answer: {
      en: "Your answers are only ever spoken out loud. Unravel saves your settings, your place in a game, favourites and custom decks in this browser, on this device. There are no accounts and no tracking.",
      pt: "As tuas respostas ficam só na conversa. O Unravel guarda as definições, o ponto onde ficaste no jogo, as favoritas e os baralhos personalizados neste navegador, neste dispositivo. Não há contas nem rastreio.",
    },
  },
  {
    question: {
      en: "Can I write my own questions?",
      pt: "Posso escrever as minhas próprias perguntas?",
    },
    answer: {
      en: "Yes. Create a deck with your own questions and challenges, then share it with a link.",
      pt: "Sim. Cria um baralho com as tuas perguntas e desafios e partilha-o com um link.",
    },
  },
  {
    question: {
      en: "Which languages can I play in?",
      pt: "Em que línguas posso jogar?",
    },
    answer: {
      en: "English and European Portuguese. You can change the language at any time in Settings.",
      pt: "Inglês e português europeu. Podes mudar de língua quando quiseres nas Definições.",
    },
  },
];
