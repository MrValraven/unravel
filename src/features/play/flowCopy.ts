import { defineCopy } from "../../i18n/useCopy";

/**
 * Text for the start flow (Game options, the preview sheet's options link)
 * and the end-of-deck recap. Kept apart from copy.ts while the play screen is
 * reworked; the two can merge later.
 */
const en = {
  setup: {
    eyebrow: "Game options",
    intro:
      "Choose who is playing and how. Unravel remembers these options for your next game.",
    restartsSavedGame:
      "Starting with these options begins this deck again from the first card.",
  },
  checkIn: {
    gameOptions: "Game options",
  },
  preview: {
    gameOptions: "Game options",
  },
  end: {
    recapTitle: "Your game in one line",
    recap: {
      warm: "We unravelled {deck}: {cards}, {time}.",
      deeper: "We went Deeper on {deck}: {cards}, {time}.",
      allIn: "We went All in on {deck}: {cards}, {time}.",
    },
    recapCards: { one: "{count} card", other: "{count} cards" },
    recapMinutes: "{count} min",
    recapUnderAMinute: "under a minute",
    shareRecap: "Share recap",
    recapCopied: "Recap copied",
    upNextTitle: "Up next",
    replayBody: "Same players and level, cards shuffled.",
  },
};

export const flowCopy = defineCopy<typeof en>({
  en,
  pt: {
    setup: {
      eyebrow: "Opções de jogo",
      intro:
        "Escolhe quem joga e como. O Unravel guarda estas opções para o próximo jogo.",
      restartsSavedGame:
        "Começar com estas opções recomeça este baralho a partir da primeira carta.",
    },
    checkIn: {
      gameOptions: "Opções de jogo",
    },
    preview: {
      gameOptions: "Opções de jogo",
    },
    end: {
      recapTitle: "O vosso jogo numa frase",
      recap: {
        warm: "Jogámos {deck}: {cards}, {time}.",
        deeper: "Fomos mais fundo em {deck}: {cards}, {time}.",
        allIn: "Fomos com tudo em {deck}: {cards}, {time}.",
      },
      recapCards: { one: "{count} carta", other: "{count} cartas" },
      recapMinutes: "{count} min",
      recapUnderAMinute: "menos de um minuto",
      shareRecap: "Partilhar resumo",
      recapCopied: "Resumo copiado",
      upNextTitle: "A seguir",
      replayBody: "Os mesmos jogadores e nível, com as cartas baralhadas.",
    },
  },
});
