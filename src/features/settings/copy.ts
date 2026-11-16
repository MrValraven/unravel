import { defineCopy } from "../../i18n/useCopy";

const en = {
  documentTitle: "Settings",
  title: "Settings",
  backToHome: "Back to home",
  preferencesTitle: "Preferences",
  language: {
    label: "Language",
  },
  textSize: {
    label: "Text size",
    /** One label per step in `textScales`, smallest first. */
    options: ["Standard", "Large", "Larger"],
    previewLabel: "Preview",
    sample: "What made you smile this week?",
  },
  theme: {
    label: "Theme",
    /** One label per theme: default, dim, light. */
    options: { default: "Night", dim: "Dim", light: "Day" },
    description:
      "Night is the classic navy, Dim is warmer and softer for low light, and Day is bright for daylight and playing outdoors.",
  },
  haptics: {
    label: "Haptics",
    description: "A light buzz as you move between cards.",
  },
  stats: {
    title: "Your nights",
    cardsSeen: "Cards seen",
    decksFinished: "Decks finished",
    minutesPlayed: "Minutes played",
    mostPlayed: "Most played deck",
    emptyHint: "Play a deck and your nights add up here.",
    reset: "Reset stats",
    resetDialog: {
      title: "Reset your stats?",
      description:
        "This clears the cards seen, decks finished and minutes played on this device. It can't be undone.",
      confirm: "Reset stats",
      cancel: "Keep stats",
    },
  },
  about: {
    title: "About Unravel",
    whatsNew: "See what's new",
    suggestQuestion: "Suggest a question",
    opensInNewTab: "(opens in a new tab)",
    version: "Version {version}",
    privacy: "Everything you do here stays on this device",
  },
  whatsNew: {
    title: "What's new",
    versionHeading: "Version {version}",
    close: "Close what's new",
  },
};

export const settingsCopy = defineCopy<typeof en>({
  en,
  pt: {
    documentTitle: "Definições",
    title: "Definições",
    backToHome: "Voltar ao início",
    preferencesTitle: "Preferências",
    language: {
      label: "Idioma",
    },
    textSize: {
      label: "Tamanho do texto",
      options: ["Normal", "Grande", "Maior"],
      previewLabel: "Pré-visualização",
      sample: "O que te fez sorrir esta semana?",
    },
    theme: {
      label: "Tema",
      options: { default: "Noite", dim: "Penumbra", light: "Dia" },
      description:
        "Noite é o azul-marinho clássico, Penumbra tem cores mais quentes e suaves para pouca luz, e Dia é claro para a luz do dia e para jogar ao ar livre.",
    },
    haptics: {
      label: "Vibração",
      description: "Uma vibração leve quando passas de carta.",
    },
    stats: {
      title: "As tuas noites",
      cardsSeen: "Cartas vistas",
      decksFinished: "Baralhos terminados",
      minutesPlayed: "Minutos de jogo",
      mostPlayed: "Baralho mais jogado",
      emptyHint: "Joga um baralho e as tuas noites vão aparecendo aqui.",
      reset: "Repor estatísticas",
      resetDialog: {
        title: "Repor as tuas estatísticas?",
        description:
          "Isto apaga as cartas vistas, os baralhos terminados e os minutos de jogo guardados neste dispositivo. Esta ação é definitiva.",
        confirm: "Repor estatísticas",
        cancel: "Manter estatísticas",
      },
    },
    about: {
      title: "Sobre o Unravel",
      whatsNew: "Ver novidades",
      suggestQuestion: "Sugerir uma pergunta",
      opensInNewTab: "(abre num novo separador)",
      version: "Versão {version}",
      privacy: "Tudo o que fazes aqui fica neste dispositivo",
    },
    whatsNew: {
      title: "Novidades",
      versionHeading: "Versão {version}",
      close: "Fechar novidades",
    },
  },
});
