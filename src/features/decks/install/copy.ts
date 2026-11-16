import { defineCopy } from "../../../i18n/useCopy";

/**
 * Steps may hold `{menu}`, which renders the browser menu icon inline after the words
 * "the browser menu".
 */
const en = {
  trigger: "Install app",
  title: "Install Unravel",
  description:
    "Add Unravel to your home screen. It opens full screen and works offline.",
  installNow: "Install Unravel",
  close: "Close",
  stepsLabel: "How to install",
  nudge: {
    title: "Keep Unravel one tap away",
    body: "Install it to open from your home screen, full screen, even without a connection.",
    install: "Install",
    showSteps: "How to install",
    hideSteps: "Hide the steps",
    dismiss: "Not now",
  },
  steps: {
    ios: [
      "Tap the Share button in the Safari toolbar.",
      "Choose Add to Home Screen.",
      "Tap Add to finish.",
    ],
    android: [
      "Open the browser menu {menu}.",
      "Choose Install app or Add to Home screen.",
      "Confirm to finish.",
    ],
    desktop: [
      "Click the install icon at the end of the address bar.",
      "Or open the browser menu {menu} and choose Install Unravel.",
      "Confirm to finish.",
    ],
  },
};

export const installCopy = defineCopy<typeof en>({
  en,
  pt: {
    trigger: "Instalar app",
    title: "Instalar o Unravel",
    description:
      "Adiciona o Unravel ao ecrã principal. Abre em ecrã inteiro e funciona sem internet.",
    installNow: "Instalar o Unravel",
    close: "Fechar",
    stepsLabel: "Como instalar",
    nudge: {
      title: "Tem o Unravel à distância de um toque",
      body: "Instala-o para abrires a partir do ecrã principal, em ecrã inteiro, mesmo sem internet.",
      install: "Instalar",
      showSteps: "Como instalar",
      hideSteps: "Esconder os passos",
      dismiss: "Agora não",
    },
    steps: {
      ios: [
        "Toca no botão Partilhar na barra do Safari.",
        "Escolhe Adicionar ao ecrã principal.",
        "Toca em Adicionar para concluir.",
      ],
      android: [
        "Abre o menu do navegador {menu}.",
        "Escolhe Instalar app ou Adicionar ao ecrã principal.",
        "Confirma para concluir.",
      ],
      desktop: [
        "Clica no ícone de instalação no fim da barra de endereço.",
        "Ou abre o menu do navegador {menu} e escolhe Instalar Unravel.",
        "Confirma para concluir.",
      ],
    },
  },
});
