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
  data: {
    title: "Your data",
    description:
      "Save your custom decks, favourites and stats as a file, or bring them back from one. The file stays on your device: Unravel never sends it anywhere.",
    export: "Export backup",
    import: "Import backup",
    importFileLabel: "Backup file",
    exported: "Started the download of {fileName}",
    exportFailed:
      "Your browser blocked the download, so no backup file was made",
    deckCount: { one: "{count} deck", other: "{count} decks" },
    favouriteCount: { one: "{count} favourite", other: "{count} favourites" },
    preview: {
      title: "Import this backup?",
      found: "This backup has {decks}, {favourites}.",
      note: "They are added to what is on this device. Nothing is deleted, and a deck you changed more recently here is kept.",
      confirm: "Import",
      cancel: "Cancel",
    },
    result: {
      imported: "Imported {parts}",
      nothingNew:
        "Nothing new: the decks and favourites in this backup are already on this device",
      decksAdded: { one: "{count} new deck", other: "{count} new decks" },
      decksUpdated: {
        one: "{count} updated deck",
        other: "{count} updated decks",
      },
      favouritesAdded: {
        one: "{count} new favourite",
        other: "{count} new favourites",
      },
      decksSkipped: {
        one: "{count} deck was not imported: you already have the {max} decks Unravel keeps on one device",
        other:
          "{count} decks were not imported: you already have the {max} decks Unravel keeps on one device",
      },
    },
    problems: {
      "too-large": "This file is too large to be an Unravel backup",
      "not-json": "This file isn't readable JSON",
      "not-backup": "This file isn't an Unravel backup",
      "newer-version":
        "This backup is from a newer version of Unravel. Update the app and try again",
      "read-failed": "Your browser couldn't open this file",
      "storage-blocked":
        "Your browser blocked saving: storage is full or turned off, so the backup was not imported",
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
    data: {
      title: "Os teus dados",
      description:
        "Guarda os teus baralhos próprios, favoritas e estatísticas num ficheiro, ou recupera-os a partir de um. O ficheiro fica no teu dispositivo: o Unravel nunca o envia para lado nenhum.",
      export: "Exportar cópia de segurança",
      import: "Importar cópia de segurança",
      importFileLabel: "Ficheiro de cópia de segurança",
      exported: "Transferência de {fileName} iniciada",
      exportFailed:
        "O teu navegador bloqueou a transferência, por isso não foi criado nenhum ficheiro de cópia de segurança",
      deckCount: { one: "{count} baralho", other: "{count} baralhos" },
      favouriteCount: {
        one: "{count} carta favorita",
        other: "{count} cartas favoritas",
      },
      preview: {
        title: "Importar esta cópia de segurança?",
        found: "Esta cópia tem {decks}, {favourites}.",
        note: "São adicionados ao que já está neste dispositivo. Nada é apagado e um baralho que alteraste aqui mais recentemente é mantido.",
        confirm: "Importar",
        cancel: "Cancelar",
      },
      result: {
        imported: "Importado: {parts}",
        nothingNew:
          "Nada de novo: os baralhos e as favoritas desta cópia já estão neste dispositivo",
        decksAdded: {
          one: "{count} baralho novo",
          other: "{count} baralhos novos",
        },
        decksUpdated: {
          one: "{count} baralho atualizado",
          other: "{count} baralhos atualizados",
        },
        favouritesAdded: {
          one: "{count} favorita nova",
          other: "{count} favoritas novas",
        },
        decksSkipped: {
          one: "{count} baralho não foi importado: já tens os {max} baralhos que o Unravel guarda num dispositivo",
          other:
            "{count} baralhos não foram importados: já tens os {max} baralhos que o Unravel guarda num dispositivo",
        },
      },
      problems: {
        "too-large":
          "Este ficheiro é demasiado grande para ser uma cópia de segurança do Unravel",
        "not-json": "Este ficheiro não é um JSON legível",
        "not-backup": "Este ficheiro não é uma cópia de segurança do Unravel",
        "newer-version":
          "Esta cópia de segurança é de uma versão mais recente do Unravel. Atualiza a aplicação e tenta de novo",
        "read-failed": "O teu navegador não conseguiu abrir este ficheiro",
        "storage-blocked":
          "O teu navegador bloqueou a gravação: o armazenamento está cheio ou desativado, por isso a cópia de segurança não foi importada",
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
