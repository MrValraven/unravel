import { defineCopy } from "../../i18n/useCopy";

const en = {
  wordmark: "Unravel",
  canvasUnavailable:
    "Could not create the share image: this browser has no 2D canvas support",
  imageEncodingFailed:
    "Could not create the share image: the browser returned no image data from the canvas",
};

export const shareCopy = defineCopy<typeof en>({
  en,
  pt: {
    wordmark: "Unravel",
    canvasUnavailable:
      "Não foi possível criar a imagem para partilhar: este navegador não suporta canvas 2D",
    imageEncodingFailed:
      "Não foi possível criar a imagem para partilhar: o navegador não devolveu dados de imagem do canvas",
  },
});
