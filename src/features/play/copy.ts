import { defineCopy } from "../../i18n/useCopy";

const en = {
  backToDecks: "Back to decks",
  setup: {
    intro:
      "Set up your game. Everything here is optional, so you can also jump straight in.",
    cardCount: { one: "{count} card", other: "{count} cards" },
    emptyDeck: "This deck has no cards yet. Add a few cards to play it.",
    replacesSavedGame: "Starting this deck replaces your saved game of {deck}.",
    replacesSavedGameUntitled: "Starting this deck replaces your saved game.",
    playersTitle: "Players",
    playersHint: "Add names to see whose turn it is on each card.",
    playerNameLabel: "Player {number} name",
    playerNamePlaceholder: "Name (optional)",
    addPlayer: "Add player",
    removePlayer: "Remove player {number}",
    playersFull: "Ten players is the most a game can hold.",
    playersRule:
      "With two players you both answer every card. Add a third name to take turns asking.",
    levelTitle: "Start level",
    levels: {
      warm: { title: "Warm", note: "Easy openers first" },
      deeper: { title: "Deeper", note: "Skip the warm-up" },
      allIn: { title: "All in", note: "Only the boldest cards" },
    },
    optionsTitle: "How to play",
    shuffleTitle: "Shuffle cards",
    shuffleHint:
      "Mixes the cards inside each level, so the questions still build up. Off keeps the curated order.",
    tableModeTitle: "Table mode",
    tableModeHint:
      "Shows the card twice, one copy turned to face the person across the table.",
    startDeck: "Start deck",
    quickStart: "Quick start",
  },
  checkIn: {
    title: "Before you start",
    intro:
      "Take a moment to agree on how tonight goes. Talk these through together.",
    prompts: [
      "What is off the table tonight?",
      "What are you curious to explore or talk about?",
      "How will you check in with each other while you play?",
    ],
    timerTitle: "A 30 second check-in",
    timerHint: "Use the timer if it helps, or talk for as long as you need.",
    passNote:
      "Any card can be passed with one tap, and nobody has to explain why.",
    startDeck: "Start deck",
    backToSetup: "Back to setup",
  },
  timer: {
    start: "Start timer",
    pause: "Pause timer",
    resume: "Resume timer",
    restart: "Restart timer",
    finished: "Time is up",
    remaining: "{time} left",
  },
  card: {
    position: "Card {current} of {total}",
    currentCard: "Current card",
    challenge: "Challenge",
    everyone: "Everyone answers",
    turn: "{asker} asks, {answerer} answers",
    challengeTurn: "{answerer}'s turn, {asker} reads it out",
    pairTurn: "{first} answers first, then {second}",
    pairChallengeTurn: "{first} goes first, then {second}",
    unnamedTurn: "Everyone answers. One of you starts, then pass it on",
    unnamedChallengeTurn:
      "Everyone takes a turn. One of you starts, then pass it on",
    /** Under the last card while it is dragged toward next. */
    lastCard: "Last card",
    saveFavourite: "Save card to favourites",
    shareCard: "Share card",
    shared: "Shared",
    imageSaved: "Image saved",
    shareFailed: "The card image could not be made on this device.",
  },
  controls: {
    next: "Next card",
    finish: "Finish deck",
    previous: "Previous card",
    skip: "Skip for now",
    hide: "Not tonight",
    pass: "Pass",
    gestureHint: "Swipe the card, or tap its right side, to move on.",
    smallerText: "Make text smaller",
    largerText: "Make text larger",
    textSizeLabel: "Text size",
  },
  menu: {
    open: "Open game menu",
    title: "Game menu",
    restart: "Restart deck",
    restartQuestion:
      "Start again from the first card? Your place in this deck will be cleared.",
    keepPlaying: "Keep playing",
  },
  end: {
    documentTitle: "Deck finished",
    title: "You made it through {deck}",
    subtitle: "Thanks for playing. We hope a few answers surprised you.",
    statsLabel: "Your game",
    cardsPlayed: { one: "card played", other: "cards played" },
    minutesPlayed: { one: "minute", other: "minutes" },
    underAMinute: "under a minute",
    favouritesSaved: { one: "favourite saved", other: "favourites saved" },
    playAgainShuffled: "Play again shuffled",
    tryDeck: "Try {deck}",
    seeFavourites: "See your favourites",
    suggestTitle: "Missing a question?",
    suggestBody: "Send us the question you wish {deck} had.",
    suggestQuestion: "Suggest a question",
    opensInNewTab: "(opens in a new tab)",
  },
};

export const playCopy = defineCopy<typeof en>({
  en,
  pt: {
    backToDecks: "Voltar aos baralhos",
    setup: {
      intro:
        "Prepara o teu jogo. Tudo aqui é opcional, por isso também podes começar logo.",
      cardCount: { one: "{count} carta", other: "{count} cartas" },
      emptyDeck:
        "Este baralho ainda não tem cartas. Junta algumas para o jogar.",
      replacesSavedGame:
        "Começar este baralho substitui o teu jogo guardado de {deck}.",
      replacesSavedGameUntitled:
        "Começar este baralho substitui o teu jogo guardado.",
      playersTitle: "Jogadores",
      playersHint: "Junta nomes para verem de quem é a vez em cada carta.",
      playerNameLabel: "Nome do jogador {number}",
      playerNamePlaceholder: "Nome (opcional)",
      addPlayer: "Adicionar jogador",
      removePlayer: "Remover jogador {number}",
      playersFull: "Dez jogadores é o máximo que um jogo aguenta.",
      playersRule:
        "Com duas pessoas, ambas respondem a todas as cartas. Junta um terceiro nome para perguntarem à vez.",
      levelTitle: "Nível inicial",
      levels: {
        warm: { title: "Morno", note: "Começa pelas mais leves" },
        deeper: { title: "Mais fundo", note: "Salta o aquecimento" },
        allIn: { title: "Com tudo", note: "Só as cartas mais ousadas" },
      },
      optionsTitle: "Como jogar",
      shuffleTitle: "Baralhar cartas",
      shuffleHint:
        "Mistura as cartas dentro de cada nível, para que as perguntas continuem a subir de tom. Desligado mantém a ordem pensada para o baralho.",
      tableModeTitle: "Modo mesa",
      tableModeHint:
        "Mostra a carta duas vezes, com uma cópia virada para quem está do outro lado da mesa.",
      startDeck: "Começar baralho",
      quickStart: "Começo rápido",
    },
    checkIn: {
      title: "Antes de começar",
      intro:
        "Tirem um momento para combinar como vai ser esta noite. Conversem sobre isto juntos.",
      prompts: [
        "O que fica de fora esta noite?",
        "O que têm curiosidade de explorar ou falar?",
        "Como vão confirmar um com o outro que está tudo bem enquanto jogam?",
      ],
      timerTitle: "Uma conversa de 30 segundos",
      timerHint:
        "Usem o temporizador se ajudar, ou conversem o tempo que precisarem.",
      passNote:
        "Qualquer carta pode ser passada com um toque, e ninguém tem de explicar porquê.",
      startDeck: "Começar baralho",
      backToSetup: "Voltar à preparação",
    },
    timer: {
      start: "Iniciar temporizador",
      pause: "Pausar temporizador",
      resume: "Retomar temporizador",
      restart: "Reiniciar temporizador",
      finished: "Acabou o tempo",
      remaining: "Faltam {time}",
    },
    card: {
      position: "Carta {current} de {total}",
      currentCard: "Carta atual",
      challenge: "Desafio",
      everyone: "Todos respondem",
      turn: "{asker} pergunta, {answerer} responde",
      challengeTurn: "Vez de {answerer}, {asker} lê em voz alta",
      pairTurn: "{first} responde primeiro, depois {second}",
      pairChallengeTurn: "{first} começa, depois {second}",
      unnamedTurn: "Toda a gente responde. Alguém começa e depois passa a vez",
      unnamedChallengeTurn:
        "Toda a gente faz o desafio. Alguém começa e depois passa a vez",
      lastCard: "Última carta",
      saveFavourite: "Guardar carta nas favoritas",
      shareCard: "Partilhar carta",
      shared: "Partilhada",
      imageSaved: "Imagem guardada",
      shareFailed:
        "Não foi possível criar a imagem da carta neste dispositivo.",
    },
    controls: {
      next: "Carta seguinte",
      finish: "Terminar baralho",
      previous: "Carta anterior",
      skip: "Saltar por agora",
      hide: "Hoje não",
      pass: "Passar",
      gestureHint: "Desliza a carta, ou toca no lado direito, para avançar.",
      smallerText: "Diminuir o texto",
      largerText: "Aumentar o texto",
      textSizeLabel: "Tamanho do texto",
    },
    menu: {
      open: "Abrir menu do jogo",
      title: "Menu do jogo",
      restart: "Recomeçar baralho",
      restartQuestion:
        "Voltar à primeira carta? O teu lugar neste baralho vai ser apagado.",
      keepPlaying: "Continuar a jogar",
    },
    end: {
      documentTitle: "Baralho terminado",
      title: "Chegaste ao fim de {deck}",
      subtitle:
        "Obrigado por jogares. Esperamos que algumas respostas te tenham surpreendido.",
      statsLabel: "O teu jogo",
      cardsPlayed: { one: "carta jogada", other: "cartas jogadas" },
      minutesPlayed: { one: "minuto", other: "minutos" },
      underAMinute: "menos de um minuto",
      favouritesSaved: {
        one: "favorita guardada",
        other: "favoritas guardadas",
      },
      playAgainShuffled: "Jogar outra vez baralhado",
      tryDeck: "Experimentar {deck}",
      seeFavourites: "Ver as tuas favoritas",
      suggestTitle: "Falta alguma pergunta?",
      suggestBody: "Envia-nos a pergunta que gostavas que {deck} tivesse.",
      suggestQuestion: "Sugerir uma pergunta",
      opensInNewTab: "(abre num novo separador)",
    },
  },
});
