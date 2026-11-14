import type { LocalizedText } from "../../content/types";

export interface Release {
  /** Semantic version, matching package.json at release time. */
  version: string;
  /** "YYYY-MM-DD". */
  date: string;
  items: LocalizedText[];
}

/** Newest release first. Add an entry here with every version bump that players should hear about. */
export const releases: Release[] = [
  {
    version: "2.0.0",
    date: "2026-11-14",
    items: [
      {
        en: "Decks now rise through three levels, so every night starts easy and goes deeper as you play.",
        pt: "Os baralhos sobem agora por três níveis: cada noite começa leve e vai ficando mais funda à medida que jogas.",
      },
      {
        en: "Set up a game with player names and turns, shuffle the cards, or use table mode so both sides of the table can read.",
        pt: "Prepara o jogo com os nomes de quem joga e a vez de cada um, baralha as cartas ou usa o modo mesa para que os dois lados da mesa consigam ler.",
      },
      {
        en: "Skip a card for now, set it aside with Not tonight, or Pass on any card in 18+ decks.",
        pt: "Salta uma carta por agora, põe-na de lado com Hoje não, ou passa qualquer carta nos baralhos 18+.",
      },
      {
        en: "Star the cards you love and play them back as your own favourites deck.",
        pt: "Marca com estrela as cartas de que gostas e joga-as no teu baralho de favoritas.",
      },
      {
        en: "Make your own decks and share them with a link.",
        pt: "Cria os teus próprios baralhos e partilha-os com um link.",
      },
      {
        en: "The deck finder suggests a deck for who you are with and the mood you want.",
        pt: "O assistente de baralhos sugere um baralho conforme com quem estás e o ambiente que procuras.",
      },
      {
        en: "A fresh card of the day waits on the home screen.",
        pt: "Há uma carta do dia nova à tua espera no ecrã inicial.",
      },
      {
        en: "Share any card as an image.",
        pt: "Partilha qualquer carta como imagem.",
      },
      {
        en: "Unravel now speaks European Portuguese. Pick it in Settings.",
        pt: "O Unravel agora fala português europeu. Escolhe o idioma nas Definições.",
      },
      {
        en: "Dim mode and text size settings make late nights easier on the eyes.",
        pt: "O modo noturno e o tamanho do texto tornam as noites longas mais fáceis para os olhos.",
      },
      {
        en: "Every deck has its own page with a preview of its cards.",
        pt: "Cada baralho tem a sua página, com uma amostra das cartas.",
      },
      {
        en: "Your nights in Settings counts the cards and decks you have played, kept on this device only.",
        pt: "As tuas noites, nas Definições, conta as cartas e os baralhos que jogaste e fica guardado só neste dispositivo.",
      },
    ],
  },
];

const parseVersion = (version: string): number[] =>
  version.split(".").map((part) => Number.parseInt(part, 10) || 0);

/** Negative when `left` is older, positive when newer, zero when equal. */
export const compareVersions = (left: string, right: string): number => {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  const partCount = Math.max(leftParts.length, rightParts.length);
  for (let partIndex = 0; partIndex < partCount; partIndex += 1) {
    const difference =
      (leftParts[partIndex] ?? 0) - (rightParts[partIndex] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
};

/** Releases newer than `lastSeenVersion` and no newer than `currentVersion`, newest first. */
export const getReleasesSince = (
  lastSeenVersion: string,
  currentVersion: string,
  releaseList: Release[] = releases
): Release[] =>
  releaseList.filter(
    (release) =>
      compareVersions(release.version, lastSeenVersion) > 0 &&
      compareVersions(release.version, currentVersion) <= 0
  );
