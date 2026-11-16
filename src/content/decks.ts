import type {
  BuiltinDeck,
  BuiltinDeckMeta,
  DeckCategory,
  DeckMeta,
  DeckPackFile,
  LocalizedText,
} from "./types";
import unravelPack from "./packs/unravel.json";
import firstDatePack from "./packs/first-date.json";
import dateNightPack from "./packs/date-night.json";
import beyondTheSurfacePack from "./packs/beyond-the-surface.json";
import sparkFlowPack from "./packs/spark-flow.json";
import bairroAltoPack from "./packs/bairro-alto.json";
import flamesOfDesirePack from "./packs/flames-of-desire.json";
import infernoOfLustPack from "./packs/inferno-of-lust.json";
import safeKinkPack from "./packs/safe-kink.json";
import aftercareGlowPack from "./packs/aftercare-glow.json";
import hedonisticSocietiesPack from "./packs/hedonistic-societies.json";
import polyamorousPassionsPack from "./packs/polyamorous-passions.json";
import sillyGoosePack from "./packs/silly-goose.json";
import queerVibesPack from "./packs/queer-vibes.json";
import pridePack from "./packs/pride.json";
import santosPopularesPack from "./packs/santos-populares.json";
import halloweenPack from "./packs/halloween.json";
import christmasTablePack from "./packs/christmas-table.json";
import friendsmasPack from "./packs/friendsmas.json";
import newYearPack from "./packs/new-year.json";
import valentinesPack from "./packs/valentines.json";

export interface DeckCategoryInfo {
  key: DeckCategory;
  title: LocalizedText;
  note?: LocalizedText;
}

/**
 * One calm tone per category, drawn from the brand palette: lavender text,
 * pink accent and a deeper mauve between pink and the Beta magenta. Every deck
 * takes its category's tone as its accent. Navy (#232946) text on each tone
 * reads at 8.04:1, 8.48:1 and 5.83:1.
 */
export const categoryAccents: Record<DeckCategory, string> = {
  friends: "#b8c1ec",
  dating: "#eebbc3",
  adults: "#cf94bb",
};

/** The deck picker groups decks under these sections, in this order. */
export const deckCategories: DeckCategoryInfo[] = [
  {
    key: "friends",
    title: { en: "Make Friends & Socialize", pt: "Fazer Amigos e Conviver" },
  },
  {
    key: "dating",
    title: { en: "Dating & Romance", pt: "Encontros e Romance" },
  },
  {
    key: "adults",
    title: { en: "Adults · 18+", pt: "Adultos · 18+" },
    note: {
      en: "Selecting one of these asks you to confirm you're 18 or older.",
      pt: "Ao escolheres um destes, pedimos-te que confirmes que tens 18 anos ou mais.",
    },
  },
];

/**
 * JSON imports infer `string` and `number` where the pack contract uses unions,
 * so each pack is asserted to `DeckPackFile` here. `content.test.ts` checks
 * every pack against the contract.
 */
const buildDeck = (meta: BuiltinDeckMeta, pack: DeckPackFile): BuiltinDeck => ({
  ...meta,
  cards: pack.cards,
});

/** Live builtin decks in registry order. Draft decks live in /content-drafts. */
export const decks: BuiltinDeck[] = [
  buildDeck(
    {
      id: "unravel",
      title: { en: "Unravel", pt: "Unravel" },
      description: {
        en: "Easy questions that slowly go deeper, for turning new faces into friends.",
        pt: "Perguntas leves que vão ficando mais profundas, para transformar caras novas em amigos.",
      },
      tagline: {
        en: "Easy questions for new faces",
        pt: "Perguntas leves para caras novas",
      },
      category: "friends",
      tag: "",
      isAdult: false,
      icon: "message",
      accent: categoryAccents.friends,
      audiences: ["new-people", "friends", "group"],
      moods: ["light", "deep"],
    },
    unravelPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "first-date",
      title: { en: "First Date", pt: "Primeiro Encontro" },
      description: {
        en: "From easy openers to what really matters, so you leave your first date knowing each other better.",
        pt: "Das perguntas fáceis ao que importa mesmo, para saírem do primeiro encontro a conhecerem-se melhor.",
      },
      tagline: {
        en: "Openers that get past small talk",
        pt: "Para ir além da conversa de circunstância",
      },
      category: "dating",
      tag: "",
      isAdult: false,
      icon: "coffee",
      accent: categoryAccents.dating,
      audiences: ["date"],
      moods: ["light", "deep"],
    },
    firstDatePack as DeckPackFile
  ),
  buildDeck(
    {
      id: "date-night",
      title: { en: "Date Night", pt: "Noite a Dois" },
      description: {
        en: "Playful questions and little challenges that turn a night in or out into a proper date.",
        pt: "Perguntas divertidas e pequenos desafios que transformam uma noite em casa ou fora num encontro a sério.",
      },
      tagline: {
        en: "Turn any night into a proper date",
        pt: "Faz de qualquer noite um encontro a sério",
      },
      category: "dating",
      tag: "new",
      isAdult: false,
      icon: "moon",
      accent: categoryAccents.dating,
      audiences: ["date", "partner"],
      moods: ["playful", "light"],
    },
    dateNightPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "beyond-the-surface",
      title: { en: "Beyond the Surface", pt: "Além da Superfície" },
      description: {
        en: "Tender, curious questions for couples who want to know each other a little deeper.",
        pt: "Perguntas ternas e curiosas para casais que se querem conhecer um pouco mais a fundo.",
      },
      tagline: {
        en: "Tender questions for couples",
        pt: "Perguntas ternas para casais",
      },
      category: "dating",
      tag: "",
      isAdult: false,
      icon: "heart",
      accent: categoryAccents.dating,
      audiences: ["partner"],
      moods: ["deep"],
    },
    beyondTheSurfacePack as DeckPackFile
  ),
  buildDeck(
    {
      id: "spark-flow",
      title: { en: "Spark Flow", pt: "Faíscas a Dois" },
      description: {
        en: "Silly what-ifs and goofy challenges for couples who love to laugh together.",
        pt: "Hipóteses malucas e desafios tontos para casais que adoram rir juntos.",
      },
      tagline: {
        en: "Silly what-ifs for couples who laugh",
        pt: "Hipóteses tontas para casais que riem",
      },
      category: "dating",
      tag: "new",
      isAdult: false,
      icon: "smile",
      accent: categoryAccents.dating,
      audiences: ["partner", "date"],
      moods: ["playful", "light"],
    },
    sparkFlowPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "bairro-alto",
      title: { en: "Mingling at Bairro Alto", pt: "Convívio no Bairro Alto" },
      description: {
        en: "Quick, cheeky questions for meeting new people on a night out in Bairro Alto or anywhere else.",
        pt: "Perguntas rápidas e atrevidas para conhecer gente nova numa noite no Bairro Alto ou noutro sítio qualquer.",
      },
      tagline: {
        en: "Cheeky icebreakers for a night out",
        pt: "Quebra-gelos atrevidos para sair à noite",
      },
      category: "friends",
      tag: "new",
      isAdult: false,
      icon: "map",
      accent: categoryAccents.friends,
      audiences: ["new-people", "group"],
      moods: ["playful", "light"],
    },
    bairroAltoPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "flames-of-desire",
      title: { en: "Flames of Desire", pt: "Chamas do Desejo" },
      description: {
        en: "Flirty questions and touch challenges that start gentle and get bolder, for partners who want to turn up the heat.",
        pt: "Perguntas atrevidas e desafios de toque que começam suaves e vão ficando mais ousados, para casais que querem aquecer o ambiente.",
      },
      tagline: {
        en: "Flirty questions that turn up the heat",
        pt: "Perguntas atrevidas para aquecer o ambiente",
      },
      category: "adults",
      tag: "",
      isAdult: true,
      icon: "flame",
      accent: categoryAccents.adults,
      audiences: ["partner", "date"],
      moods: ["spicy", "deep"],
    },
    flamesOfDesirePack as DeckPackFile
  ),
  buildDeck(
    {
      id: "inferno-of-lust",
      title: { en: "After Dark", pt: "Pela Noite Dentro" },
      description: {
        en: "Honest questions about sex, turn-ons and fantasies, for partners who want to talk openly.",
        pt: "Perguntas sinceras sobre sexo, desejos e fantasias, para casais que querem falar abertamente.",
      },
      tagline: {
        en: "Honest talk about sex and fantasies",
        pt: "Conversa sincera sobre sexo e fantasias",
      },
      category: "adults",
      tag: "new",
      isAdult: true,
      icon: "zap",
      accent: categoryAccents.adults,
      audiences: ["partner"],
      moods: ["spicy"],
    },
    infernoOfLustPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "safe-kink",
      title: { en: "Safe Kink", pt: "Kink Seguro" },
      description: {
        en: "Talk through desires, limits, safe words and aftercare together before you play.",
        pt: "Falem juntos sobre desejos, limites, palavras de segurança e aftercare antes de começarem a sessão.",
      },
      tagline: {
        en: "Limits, safe words and aftercare",
        pt: "Limites, palavras de segurança e aftercare",
      },
      category: "adults",
      tag: "beta",
      isAdult: true,
      icon: "shield",
      accent: categoryAccents.adults,
      audiences: ["partner", "date"],
      moods: ["spicy", "deep"],
    },
    safeKinkPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "aftercare-glow",
      title: { en: "Aftercare Glow", pt: "Brilho do Aftercare" },
      description: {
        en: "A short, gentle check-in for the two of you after being intimate.",
        pt: "Uma conversa curta e carinhosa para depois de um momento íntimo a dois.",
      },
      tagline: {
        en: "A gentle check-in after intimacy",
        pt: "Uma conversa carinhosa depois da intimidade",
      },
      category: "adults",
      tag: "new",
      isAdult: true,
      icon: "sun",
      accent: categoryAccents.adults,
      audiences: ["partner"],
      moods: ["deep", "spicy"],
    },
    aftercareGlowPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "hedonistic-societies",
      title: { en: "Guilty Pleasures", pt: "Prazeres Proibidos" },
      description: {
        en: "From comfort food to daring memories, questions about everything that brings you pleasure.",
        pt: "Da comida de conforto às memórias mais ousadas, perguntas sobre tudo o que vos dá prazer.",
      },
      tagline: {
        en: "Everything that brings you pleasure",
        pt: "Tudo o que vos dá prazer",
      },
      category: "adults",
      tag: "",
      isAdult: true,
      icon: "gift",
      accent: categoryAccents.adults,
      audiences: ["friends", "group", "partner"],
      moods: ["spicy", "deep"],
    },
    hedonisticSocietiesPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "polyamorous-passions",
      title: { en: "Polyamorous Passions", pt: "Paixões Poliamorosas" },
      description: {
        en: "Questions about loving more than one person, from jealousy and time to compersion and joy.",
        pt: "Perguntas sobre amar mais do que uma pessoa, do ciúme e do tempo à compersão e à alegria.",
      },
      tagline: {
        en: "On loving more than one person",
        pt: "Sobre amar mais do que uma pessoa",
      },
      category: "dating",
      tag: "",
      isAdult: false,
      icon: "users",
      accent: categoryAccents.dating,
      audiences: ["date", "partner", "group"],
      moods: ["deep"],
    },
    polyamorousPassionsPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "silly-goose",
      title: { en: "Silly Goose", pt: "Ganso Pateta" },
      description: {
        en: "Absurd questions and daft challenges for when the group just wants to laugh.",
        pt: "Perguntas absurdas e desafios disparatados para quando o grupo só quer rir.",
      },
      tagline: {
        en: "Absurd questions for a laughing group",
        pt: "Perguntas absurdas para rir em grupo",
      },
      category: "friends",
      tag: "beta",
      isAdult: false,
      icon: "feather",
      accent: categoryAccents.friends,
      audiences: ["friends", "group", "new-people"],
      moods: ["playful", "light"],
    },
    sillyGoosePack as DeckPackFile
  ),
  buildDeck(
    {
      id: "queer-vibes",
      title: { en: "Queer Vibes", pt: "Vibes Queer" },
      description: {
        en: "Easygoing questions about queer life, identity and joy, for LGBTQ+ friends and allies.",
        pt: "Perguntas descontraídas sobre a vida, a identidade e a alegria queer, para amigos LGBTQ+ e aliados.",
      },
      tagline: {
        en: "Queer life, identity and joy",
        pt: "Vida, identidade e alegria queer",
      },
      category: "friends",
      tag: "beta",
      isAdult: false,
      icon: "sparkle",
      accent: categoryAccents.friends,
      audiences: ["friends", "new-people", "group"],
      moods: ["light", "deep"],
    },
    queerVibesPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "pride",
      title: { en: "Pride Month", pt: "Mês do Orgulho" },
      description: {
        en: "Stories, joy and a little glitter for June, made to share with your chosen family.",
        pt: "Histórias, alegria e um pouco de brilho para junho, para partilhar com a vossa família escolhida.",
      },
      tagline: {
        en: "Stories and glitter for chosen family",
        pt: "Histórias e brilho para a família escolhida",
      },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "star",
      accent: categoryAccents.friends,
      audiences: ["friends", "group", "new-people"],
      moods: ["playful", "deep"],
      season: { start: "06-01", end: "06-30" },
    },
    pridePack as DeckPackFile
  ),
  buildDeck(
    {
      id: "santos-populares",
      title: { en: "Santos Populares", pt: "Santos Populares" },
      description: {
        en: "Sardines, manjericos and marchas: questions for warm June nights at the arraial.",
        pt: "Sardinhas, manjericos e marchas: perguntas para as noites quentes de junho no arraial.",
      },
      tagline: {
        en: "Questions for June nights at the arraial",
        pt: "Para as noites de junho no arraial",
      },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "music",
      accent: categoryAccents.friends,
      audiences: ["friends", "group", "new-people"],
      moods: ["playful", "light"],
      season: { start: "06-01", end: "06-30" },
    },
    santosPopularesPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "halloween",
      title: { en: "Halloween", pt: "Halloween" },
      description: {
        en: "Costumes, local legends and things that go bump in the night: questions for the spooky season.",
        pt: "Disfarces, lendas locais e coisas que se ouvem na calada da noite: perguntas para a época do susto.",
      },
      tagline: {
        en: "Costumes, legends and spooky stories",
        pt: "Disfarces, lendas e histórias de arrepiar",
      },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "ghost",
      accent: categoryAccents.friends,
      audiences: ["friends", "group", "new-people"],
      moods: ["playful", "deep"],
      season: { start: "10-01", end: "12-01" },
    },
    halloweenPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "christmas-table",
      title: { en: "Christmas at the Table", pt: "Natal à Mesa" },
      description: {
        en: "Traditions, memories and wishes to share over the Christmas meal, with questions that work for every age at the table.",
        pt: "Tradições, memórias e desejos para partilhar na ceia de Natal, com perguntas que servem a todas as idades à mesa.",
      },
      tagline: {
        en: "Questions for every age at the table",
        pt: "Perguntas para todas as idades à mesa",
      },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "tree",
      accent: categoryAccents.friends,
      audiences: ["group", "friends"],
      moods: ["light", "playful"],
      season: { start: "12-01", end: "01-06" },
    },
    christmasTablePack as DeckPackFile
  ),
  buildDeck(
    {
      id: "friendsmas",
      title: { en: "Friendsmas", pt: "Natal entre Amigos" },
      description: {
        en: "Celebrate Christmas with the family you choose: funny stories, honest gratitude and what the year meant to each of you.",
        pt: "Celebrem o Natal com a família que escolhemos: histórias divertidas, gratidão sincera e o que o ano significou para todos.",
      },
      tagline: {
        en: "Christmas with the family you choose",
        pt: "O Natal com a família que escolhemos",
      },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "snowflake",
      accent: categoryAccents.friends,
      audiences: ["friends", "group"],
      moods: ["playful", "deep"],
      season: { start: "12-01", end: "01-06" },
    },
    friendsmasPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "new-year",
      title: { en: "New Year", pt: "Ano Novo" },
      description: {
        en: "Look back on the year you had and raise a glass to the one ahead, together.",
        pt: "Olhem para o ano que passou e brindem juntos ao que aí vem.",
      },
      tagline: {
        en: "Look back and toast the year ahead",
        pt: "Olhar para trás e brindar ao ano novo",
      },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "calendar",
      accent: categoryAccents.friends,
      audiences: ["friends", "group"],
      moods: ["light", "deep"],
      season: { start: "12-26", end: "01-07" },
    },
    newYearPack as DeckPackFile
  ),
  buildDeck(
    {
      id: "valentines",
      title: { en: "Valentine's Day", pt: "Dia dos Namorados" },
      description: {
        en: "Sweet questions and playful challenges for Valentine's season, on a first date or with someone you've loved for years.",
        pt: "Perguntas doces e desafios divertidos para a época do Dia dos Namorados, num primeiro encontro ou num amor de longa data.",
      },
      tagline: {
        en: "Sweet questions for Valentine's season",
        pt: "Perguntas doces para o Dia dos Namorados",
      },
      category: "dating",
      tag: "seasonal",
      isAdult: false,
      icon: "heart",
      accent: categoryAccents.dating,
      audiences: ["date", "partner"],
      moods: ["playful", "deep"],
      season: { start: "02-01", end: "02-14" },
    },
    valentinesPack as DeckPackFile
  ),
];

const decksById = new Map(decks.map((deck) => [deck.id, deck]));

export function getBuiltinDeck(id: string): BuiltinDeck | undefined {
  return decksById.get(id);
}

const padTwoDigits = (value: number): string => String(value).padStart(2, "0");

/** Local calendar day as "MM-DD", the format season windows use. */
const toMonthDay = (date: Date): string =>
  `${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;

/** True when the deck has no season, or today falls inside its inclusive window (wrapping the year end when start > end). */
export function isDeckInSeason(
  deck: DeckMeta,
  today: Date = new Date()
): boolean {
  if (!deck.season) {
    return true;
  }
  const monthDay = toMonthDay(today);
  const { start, end } = deck.season;
  if (start <= end) {
    return monthDay >= start && monthDay <= end;
  }
  return monthDay >= start || monthDay <= end;
}

export function getVisibleDecks(today: Date = new Date()): BuiltinDeck[] {
  return decks.filter((deck) => isDeckInSeason(deck, today));
}
