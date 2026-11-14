import { defineCopy } from "../i18n/useCopy";

const en = {
  heading: "Pick up where you left off",
  progress: "Card {current} of {total}",
  continueDeck: "Continue deck",
};

export const resumeCardCopy = defineCopy<typeof en>({
  en,
  pt: {
    heading: "Continua onde ficaste",
    progress: "Carta {current} de {total}",
    continueDeck: "Continuar baralho",
  },
});
