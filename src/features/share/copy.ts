import { defineCopy } from "../../i18n/useCopy";

const en = {
  wordmark: "Unravel",
  canvasUnavailable:
    "Could not create the share image: this browser has no 2D canvas support",
  imageEncodingFailed:
    "Could not create the share image: the browser returned no image data from the canvas",
  linkDialog: {
    title: "Copy this link",
    description:
      "Your browser blocked both sharing and the clipboard. Select the link and copy it.",
    fieldLabel: "Link",
    done: "Done",
  },
};

export const shareCopy = defineCopy<typeof en>({
  en,
  pt: {
    wordmark: "Unravel",
    canvasUnavailable:
      "Não foi possível criar a imagem para partilhar: este navegador não suporta canvas 2D",
    imageEncodingFailed:
      "Não foi possível criar a imagem para partilhar: o navegador não devolveu dados de imagem do canvas",
    linkDialog: {
      title: "Copiar este link",
      description:
        "O teu navegador bloqueou a partilha e a área de transferência. Seleciona o link e copia-o.",
      fieldLabel: "Link",
      done: "Concluído",
    },
  },
});
