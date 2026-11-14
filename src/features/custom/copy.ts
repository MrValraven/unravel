import { defineCopy } from "../../i18n/useCopy";

const en = {
  cardTypes: {
    question: "Question",
    challenge: "Challenge",
    everyone: "Everyone answers",
  },
  cardCount: { one: "{count} card", other: "{count} cards" },
  deckLimit:
    "You have {max} decks, the most Unravel keeps on one device. Delete a deck to make room for a new one.",
  status: {
    savedDeck: "Saved {title} to your decks",
    deletedDeck: "Deleted {title}",
  },
  list: {
    title: "Your decks",
    backLabel: "Back to decks",
    intro:
      "Write your own questions and challenges, play them here and share them with a link. Your decks stay on this device.",
    createDeck: "Create a deck",
    deckListLabel: "Your custom decks",
    emptyTitle: "No decks of your own yet",
    emptyBody:
      "Start with a title and a few cards. You can add, reorder and edit cards whenever you like.",
    startDeck: "Start deck",
    startDeckNamed: "Start deck {title}",
    editDeck: "Edit deck",
    editDeckNamed: "Edit deck {title}",
    shareLink: "Share link",
    shareLinkNamed: "Share a link to {title}",
    deleteDeck: "Delete deck",
    deleteDeckNamed: "Delete deck {title}",
    deleteDialog: {
      title: "Delete {title}?",
      description:
        "This removes the deck and its {cards} from this device. Copies other people saved from your link stay with them.",
      confirm: "Delete deck",
      cancel: "Keep deck",
    },
  },
  share: {
    linkCopied: "Link copied. Paste it anywhere to share {title}",
    clipboardUnavailable:
      "This browser gives Unravel no clipboard access here, so the link could not be copied.",
    clipboardBlocked:
      "Your browser blocked copying to the clipboard, so the link was not copied.",
    longLinkTitle: "This link is long",
    longLinkDescription:
      "The link to {title} is {length} characters. Some messaging apps cut links past {limit} characters, and a cut link opens no deck. Fewer or shorter cards make the link shorter.",
    shareAnyway: "Share link anyway",
    cancel: "Cancel",
  },
  editor: {
    newTitle: "New deck",
    editTitle: "Edit deck",
    editDocumentTitle: "Edit {title}",
    backLabel: "Back to your decks",
    intro:
      "Write your own cards. They stay on this device, and you can share the deck as a link.",
    titleLabel: "Deck title",
    titlePlaceholder: "Friday night crew",
    cardsHeading: "Cards",
    cardCountOfMax: "{count} of {max} cards",
    cardLabel: "Card {number}",
    cardTypeLabel: "Card {number} type",
    cardTypeOptions: {
      question: "Question",
      challenge: "Challenge",
      everyone: "Everyone",
    },
    cardPlaceholder: "What would you ask?",
    moveUp: "Move card {number} up",
    moveDown: "Move card {number} down",
    deleteCard: "Delete card {number}",
    addCard: "Add card",
    cardLimit: "Decks hold up to {max} cards",
    characterCount: "{count}/{max}",
    save: "Save deck",
    cancel: "Cancel",
    problems: {
      titleEmpty: "Give the deck a title",
      titleTooLong: "Keep the title to {max} characters or fewer",
      cardEmpty: "Write this card or delete it",
      cardTooLong: "Keep the card to {max} characters or fewer",
      noCards: "Add at least one card",
      tooManyCards: "Delete cards until the deck has {max} or fewer",
    },
    notFoundTitle: "This deck is not on this device",
    notFoundBody:
      "It may have been deleted, or it was made on another phone or browser.",
    limitTitle: "You have reached the deck limit",
    goToDecks: "Go to your decks",
    discardDialog: {
      title: "Discard your changes?",
      description:
        "Your edits to this deck are unsaved. Leaving now drops them.",
      confirm: "Discard changes",
      cancel: "Keep editing",
    },
  },
  importer: {
    title: "Import a deck",
    backLabel: "Back to your decks",
    sharedWithYou: "Someone shared a deck with you",
    privacyNote:
      "Saving keeps a copy on this device only. Each save makes a new deck.",
    saveAndPlay: "Save and play",
    saveToDecks: "Save to my decks",
    cardListLabel: "Cards in this deck",
    errorTitle: "This link did not open a deck",
    goToDecks: "Go to your decks",
    errors: {
      missing:
        "The link has no deck in it. It may have lost its end when it was copied. Ask for the link again.",
      corrupt:
        "The deck in this link is damaged and can't be read. Part of the link probably changed or got cut while it was shared. Ask for the link again.",
      tooLargeCardCount:
        "This deck has more than {max} cards, more than Unravel can hold in one deck.",
      tooLargePayload:
        "This link is longer than any deck Unravel can open, so it was not read. Ask for a link to a smaller deck.",
      version:
        "This link comes from a newer version of Unravel. Reload the app to update it, then open the link again.",
      titleEmpty: "The deck in this link has no title.",
      titleTooLong: "The deck's title is longer than {max} characters.",
      noCards: "The deck in this link has no cards.",
      cardType:
        "Card {number} in this link has a card type Unravel does not know.",
      cardEmpty: "Card {number} in this link is empty.",
      cardTooLong:
        "Card {number} in this link is longer than {max} characters.",
    },
  },
};

export const customCopy = defineCopy<typeof en>({
  en,
  pt: {
    cardTypes: {
      question: "Pergunta",
      challenge: "Desafio",
      everyone: "Todos respondem",
    },
    cardCount: { one: "{count} carta", other: "{count} cartas" },
    deckLimit:
      "Tens {max} baralhos, o máximo que o Unravel guarda num dispositivo. Apaga um baralho para criares outro.",
    status: {
      savedDeck: "{title} guardado nos teus baralhos",
      deletedDeck: "{title} apagado",
    },
    list: {
      title: "Os teus baralhos",
      backLabel: "Voltar aos baralhos",
      intro:
        "Escreve as tuas próprias perguntas e desafios, joga-os aqui e partilha-os com um link. Os teus baralhos ficam neste dispositivo.",
      createDeck: "Criar um baralho",
      deckListLabel: "Os teus baralhos personalizados",
      emptyTitle: "Ainda não tens baralhos teus",
      emptyBody:
        "Começa com um título e algumas cartas. Podes acrescentar, reordenar e editar cartas quando quiseres.",
      startDeck: "Começar baralho",
      startDeckNamed: "Começar baralho {title}",
      editDeck: "Editar baralho",
      editDeckNamed: "Editar baralho {title}",
      shareLink: "Partilhar link",
      shareLinkNamed: "Partilhar um link para {title}",
      deleteDeck: "Apagar baralho",
      deleteDeckNamed: "Apagar baralho {title}",
      deleteDialog: {
        title: "Apagar {title}?",
        description:
          "Isto remove o baralho e as suas {cards} deste dispositivo. As cópias que outras pessoas guardaram a partir do teu link continuam com elas.",
        confirm: "Apagar baralho",
        cancel: "Manter baralho",
      },
    },
    share: {
      linkCopied: "Link copiado. Cola-o onde quiseres para partilhar {title}",
      clipboardUnavailable:
        "Este navegador não dá ao Unravel acesso à área de transferência aqui, por isso o link não foi copiado.",
      clipboardBlocked:
        "O teu navegador bloqueou a cópia para a área de transferência, por isso o link não foi copiado.",
      longLinkTitle: "Este link é longo",
      longLinkDescription:
        "O link para {title} tem {length} caracteres. Algumas apps de mensagens cortam links com mais de {limit} caracteres, e um link cortado não abre nenhum baralho. Menos cartas, ou cartas mais curtas, encurtam o link.",
      shareAnyway: "Partilhar link mesmo assim",
      cancel: "Cancelar",
    },
    editor: {
      newTitle: "Novo baralho",
      editTitle: "Editar baralho",
      editDocumentTitle: "Editar {title}",
      backLabel: "Voltar aos teus baralhos",
      intro:
        "Escreve as tuas próprias cartas. Ficam neste dispositivo, e podes partilhar o baralho com um link.",
      titleLabel: "Título do baralho",
      titlePlaceholder: "Malta de sexta à noite",
      cardsHeading: "Cartas",
      cardCountOfMax: "{count} de {max} cartas",
      cardLabel: "Carta {number}",
      cardTypeLabel: "Tipo da carta {number}",
      cardTypeOptions: {
        question: "Pergunta",
        challenge: "Desafio",
        everyone: "Todos",
      },
      cardPlaceholder: "O que perguntarias?",
      moveUp: "Subir a carta {number}",
      moveDown: "Descer a carta {number}",
      deleteCard: "Apagar a carta {number}",
      addCard: "Acrescentar carta",
      cardLimit: "Um baralho leva até {max} cartas",
      characterCount: "{count}/{max}",
      save: "Guardar baralho",
      cancel: "Cancelar",
      problems: {
        titleEmpty: "Dá um título ao baralho",
        titleTooLong: "Usa no máximo {max} caracteres no título",
        cardEmpty: "Escreve esta carta ou apaga-a",
        cardTooLong: "Usa no máximo {max} caracteres na carta",
        noCards: "Acrescenta pelo menos uma carta",
        tooManyCards: "Apaga cartas até o baralho ter {max} ou menos",
      },
      notFoundTitle: "Este baralho não está neste dispositivo",
      notFoundBody:
        "Pode ter sido apagado, ou foi criado noutro telemóvel ou navegador.",
      limitTitle: "Chegaste ao limite de baralhos",
      goToDecks: "Ir para os teus baralhos",
      discardDialog: {
        title: "Descartar as alterações?",
        description:
          "As tuas alterações a este baralho ainda não estão guardadas. Se saíres agora, perdes estas alterações.",
        confirm: "Descartar alterações",
        cancel: "Continuar a editar",
      },
    },
    importer: {
      title: "Importar um baralho",
      backLabel: "Voltar aos teus baralhos",
      sharedWithYou: "Alguém partilhou um baralho contigo",
      privacyNote:
        "Guardar cria uma cópia só neste dispositivo. Cada vez que guardas, crias um baralho novo.",
      saveAndPlay: "Guardar e jogar",
      saveToDecks: "Guardar nos meus baralhos",
      cardListLabel: "Cartas deste baralho",
      errorTitle: "Este link não abriu nenhum baralho",
      goToDecks: "Ir para os teus baralhos",
      errors: {
        missing:
          "O link não traz nenhum baralho. Pode ter perdido o final quando foi copiado. Pede o link outra vez.",
        corrupt:
          "O baralho deste link está danificado e não é possível lê-lo. Parte do link deve ter mudado ou sido cortada quando foi partilhado. Pede o link outra vez.",
        tooLargeCardCount:
          "Este baralho tem mais de {max} cartas, mais do que o Unravel consegue guardar num baralho.",
        tooLargePayload:
          "Este link é mais longo do que qualquer baralho que o Unravel consegue abrir, por isso não foi lido. Pede um link para um baralho mais pequeno.",
        version:
          "Este link vem de uma versão mais recente do Unravel. Recarrega a app para a atualizar e abre o link outra vez.",
        titleEmpty: "O baralho deste link não tem título.",
        titleTooLong: "O título do baralho tem mais de {max} caracteres.",
        noCards: "O baralho deste link não tem cartas.",
        cardType:
          "A carta {number} deste link tem um tipo de carta que o Unravel não conhece.",
        cardEmpty: "A carta {number} deste link está vazia.",
        cardTooLong:
          "A carta {number} deste link tem mais de {max} caracteres.",
      },
    },
  },
});
