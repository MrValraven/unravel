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

// tagType: "" | "new" | "beta"   ·   nsfw: true prompts an 18+ confirmation.
const availableModes = [
  {
    title: "Unravel",
    file: "questions",
    description:
      "A series of questions designed to help you make new friends and develop better connections.",
    tagType: "",
  },
  {
    title: "First Date",
    file: "firstDate",
    description:
      "A series of questions designed to deepen your bond and create meaningful conversations with your date.",
    tagType: "",
  },
  {
    title: "Date Night",
    file: "dateNight",
    description:
      "A series of playful and heartfelt questions and challenges to spark connection and keep the spark alive on your date night.",
    tagType: "new",
  },
  {
    title: "Beyond the Surface",
    file: "advancedDating",
    description:
      "Take your romance to the next level through heartfelt inquiries that reveal genuine affection and understanding.",
    tagType: "",
  },
  {
    title: "Spark Flow",
    file: "happyCouple",
    description:
      "A playful set of questions and challenges made for laughs, banter, and bonding.",
    tagType: "new",
  },
  {
    title: "Mingling at Bairro Alto",
    file: "bairro",
    description:
      "Engage in fun conversations when meeting cool individuals in Bairro Alto, Lisbon.",
    tagType: "new",
  },
  {
    title: "Flames of Desire",
    file: "spicy",
    description:
      "Experience intense connections with daring questions, igniting desires and deepening bonds.",
    tagType: "",
    nsfw: true,
  },
  {
    title: "Inferno of Lust",
    file: "extraSpicy",
    description:
      "Step into the fire, where lust burns unchecked, and every desire is a spark waiting to ignite.",
    tagType: "new",
    nsfw: true,
  },
  {
    title: "Safe Kink",
    file: "safeKink",
    description:
      "Approach the world of kink with care and consent, exploring desires while prioritizing safety and mutual respect.",
    tagType: "beta",
    nsfw: true,
  },
  {
    title: "Aftercare Glow",
    file: "aftercare",
    description:
      "A set of thoughtful questions designed to enhance connection and nurture emotional well-being after your intimate moments.",
    tagType: "new",
    nsfw: true,
  },
  {
    title: "Hedonistic Societies",
    file: "hedonist",
    description:
      "Dive into the world of hedonistic pleasures, where every conversation unveils provocative insights and shared indulgences deepen connections.",
    tagType: "",
    nsfw: true,
  },
  {
    title: "Polyamorous Passions",
    file: "polyamory",
    description:
      "Embrace boundless love and explore the dynamics of polyamory in this captivating game mode.",
    tagType: "",
  },
  {
    title: "Silly Goose",
    file: "silly",
    description:
      "Unleash laughter and fun with whimsical questions that promise lighthearted moments and quirky connections.",
    tagType: "beta",
  },
  {
    title: "Neurospicy Delight",
    file: "neurospicy",
    description:
      "Explore the magic of neurodiversity with a collection of whimsical and inclusive questions designed to foster laughter, connection, and understanding among individuals with diverse minds.",
    tagType: "beta",
  },
  {
    title: "FLINTA* Harmony",
    file: "flinta",
    description:
      "Engage in deep and meaningful conversations that celebrate and explore the diverse experiences of FLINTA* individuals.",
    tagType: "new",
  },
  {
    title: "Queer Vibes",
    file: "queer",
    description:
      "A vibrant set of casual questions for lighthearted and engaging LGBTQ+ conversations.",
    tagType: "beta",
  },
  {
    title: "Portuguese Tunas",
    file: "tunas",
    description:
      "A series of questions that highlight the academic spirit of each Tuna and the great moments and adventures that come from being part of one.",
    tagType: "",
  },
];

export default availableModes.map((mode) => ({
  ...mode,
  data: loadPack(mode.file),
}));
