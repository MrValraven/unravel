// Every question pack in ../data is loaded automatically, so adding a new mode
// only requires a single entry in the `availableModes` list below (matching the
// JSON file name via `file`). No extra import line to remember.
const dataModules = import.meta.glob("../data/*.json", {
  eager: true,
  import: "default",
});

const loadPack = (file) => {
  const data = dataModules[`../data/${file}.json`];
  if (!Array.isArray(data)) {
    console.warn(`Unravel: question pack "${file}.json" is missing or invalid.`);
    return [];
  }
  return data;
};

// The mode-selection screen groups cards under these sections, in this order.
// A mode's `category` must match one of the keys below.
export const modeCategories = [
  { key: "friends", title: "Make Friends & Socialize" },
  { key: "dating", title: "Dating & Romance" },
  {
    key: "adults",
    title: "Adults · 18+",
    note: "Selecting one of these asks you to confirm you're 18 or older.",
  },
];

// tagType: "" | "new" | "beta"   ·   nsfw: true prompts an 18+ confirmation.
// category: "friends" | "dating" | "adults"  (see modeCategories above).
// enabled: false keeps a mode out of the public app entirely — it is not shown
//   and its question pack is not loaded. Omit it (or set true) to include a mode.
const availableModes = [
  {
    title: "Unravel",
    file: "questions",
    description:
      "A series of questions designed to help you make new friends and develop better connections.",
    tagType: "",
    category: "friends",
  },
  {
    title: "First Date",
    file: "firstDate",
    description:
      "A series of questions designed to deepen your bond and create meaningful conversations with your date.",
    tagType: "",
    category: "dating",
  },
  {
    title: "Date Night",
    file: "dateNight",
    description:
      "A series of playful and heartfelt questions and challenges to spark connection and keep the spark alive on your date night.",
    tagType: "new",
    category: "dating",
  },
  {
    title: "Beyond the Surface",
    file: "advancedDating",
    description:
      "Take your romance to the next level through heartfelt inquiries that reveal genuine affection and understanding.",
    tagType: "",
    category: "dating",
  },
  {
    title: "Spark Flow",
    file: "happyCouple",
    description:
      "A playful set of questions and challenges made for laughs, banter, and bonding.",
    tagType: "new",
    category: "dating",
  },
  {
    title: "Mingling at Bairro Alto",
    file: "bairro",
    description:
      "Engage in fun conversations when meeting cool individuals in Bairro Alto, Lisbon.",
    tagType: "new",
    category: "friends",
  },
  {
    title: "Flames of Desire",
    file: "spicy",
    description:
      "Experience intense connections with daring questions, igniting desires and deepening bonds.",
    tagType: "",
    nsfw: true,
    category: "adults",
  },
  {
    title: "Inferno of Lust",
    file: "extraSpicy",
    description:
      "Step into the fire, where lust burns unchecked, and every desire is a spark waiting to ignite.",
    tagType: "new",
    nsfw: true,
    category: "adults",
  },
  {
    title: "Safe Kink",
    file: "safeKink",
    description:
      "Approach the world of kink with care and consent, exploring desires while prioritizing safety and mutual respect.",
    tagType: "beta",
    nsfw: true,
    category: "adults",
  },
  {
    title: "Aftercare Glow",
    file: "aftercare",
    description:
      "A set of thoughtful questions designed to enhance connection and nurture emotional well-being after your intimate moments.",
    tagType: "new",
    nsfw: true,
    category: "adults",
  },
  {
    title: "Hedonistic Societies",
    file: "hedonist",
    description:
      "Dive into the world of hedonistic pleasures, where every conversation unveils provocative insights and shared indulgences deepen connections.",
    tagType: "",
    nsfw: true,
    category: "adults",
  },
  {
    title: "Polyamorous Passions",
    file: "polyamory",
    description:
      "Embrace boundless love and explore the dynamics of polyamory in this captivating game mode.",
    tagType: "",
    category: "dating",
  },
  {
    title: "Silly Goose",
    file: "silly",
    description:
      "Unleash laughter and fun with whimsical questions that promise lighthearted moments and quirky connections.",
    tagType: "beta",
    category: "friends",
  },
  {
    title: "Neurospicy Delight",
    file: "neurospicy",
    description:
      "Explore the magic of neurodiversity with a collection of whimsical and inclusive questions designed to foster laughter, connection, and understanding among individuals with diverse minds.",
    tagType: "beta",
    category: "friends",
    enabled: false,
  },
  {
    title: "FLINTA* Harmony",
    file: "flinta",
    description:
      "Engage in deep and meaningful conversations that celebrate and explore the diverse experiences of FLINTA* individuals.",
    tagType: "new",
    category: "friends",
    enabled: false,
  },
  {
    title: "Queer Vibes",
    file: "queer",
    description:
      "A vibrant set of casual questions for lighthearted and engaging LGBTQ+ conversations.",
    tagType: "beta",
    category: "friends",
  },
  {
    title: "Portuguese Tunas",
    file: "tunas",
    description:
      "A series of questions that highlight the academic spirit of each Tuna and the great moments and adventures that come from being part of one.",
    tagType: "",
    category: "friends",
    enabled: false,
  },
];

// Modes flagged `enabled: false` are dropped here, before any pack is loaded,
// so they never reach the app and their JSON is never pulled into the module.
export default availableModes
  .filter((mode) => mode.enabled !== false)
  .map((mode) => ({
    ...mode,
    data: loadPack(mode.file),
  }));
