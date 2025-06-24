import questionsData from "../data/questions.json";
import tunasData from "../data/tunas.json";
import firstDateData from "../data/firstDate.json";
import advancedDating from "../data/advancedDating.json";
import spicyData from "../data/spicy.json";
import extraSpicyData from "../data/extraSpicy.json";
import aftercareData from "../data/aftercare.json";
import polyamoryData from "../data/polyamory.json";
import silly from "../data/silly.json";
import neurospicy from "../data/neurospicy.json";
import queer from "../data/queer.json";
import hedonisticData from "../data/hedonist.json";
import flintaData from "../data/flinta.json";
import bairroData from "../data/bairro.json";
import safeKinkData from "../data/safeKink.json";

const availableModes = [
  {
    title: "Play Unravel",
    description:
      "Unravel. A series of questions designed to help you make new friends and develop better connections.",
    data: questionsData,
    tagType: "",
  },
  {
    title: "Play First Date pack",
    description:
      " A series of questions designed to deepen your bond and create meaningful conversations with your date.",
    data: firstDateData,
    tagType: "",
  },
  {
    title: "Play Beyond the Surface",
    description:
      "Take your romance to the next level through heartfelt inquiries that reveal genuine affection and understanding.",
    data: advancedDating,
    tagType: "",
  },
  {
    title: "Mingling at Bairro Alto",
    description:
      "Engage in fun conversations when meeting cool individuals in Bairro Alto, Lisbon.",
    data: bairroData,
    tagType: "new",
  },
  {
    title: "Play Flames of Desire",
    description:
      "Experience intense connections with daring questions, igniting desires and deepening bonds.",
    data: spicyData,
    tagType: "",
  },
  {
    title: "Play Inferno of Lust",
    description:
      "Step into the fire, where lust burns unchecked, and every desire is a spark waiting to ignite.",
    data: extraSpicyData,
    tagType: "new",
  },
  {
    title: "Play Safe Kink",
    description:
      "Approach the world of kink with care and consent, exploring desires while prioritizing safety and mutual respect.",
    data: safeKinkData,
    tagType: "beta",
  },
  {
    title: "Play Aftercare Glow",
    description:
      "A set of thoughtful questions designed to enhance connection and nurture emotional well-being after your intimate moments.",
    data: aftercareData,
    tagType: "new",
  },
  {
    title: "Play Hedonistic Societies pack",
    description:
      "Dive into the world of hedonistic pleasures, where every conversation unveils provocative insights and shared indulgences deepen connections.",
    data: hedonisticData,
    tagType: "",
  },
  {
    title: "Play Polyamorous Passions",
    description:
      " Embrace boundless love and explore the dynamics of polyamory in this captivating game mode.",
    data: polyamoryData,
    tagType: "",
  },
  {
    title: "Silly Goose Pack",
    description:
      "Unleash laughter and fun with whimsical questions that promise lighthearted moments and quirky connections.",
    data: silly,
    tagType: "beta",
  },
  {
    title: "Neurospicy Delight",
    description:
      " Explore the magic of neurodiversity with a collection of whimsical and inclusive questions designed to foster laughter, connection, and understanding among individuals with diverse minds.",
    data: neurospicy,
    tagType: "beta",
  },
  {
    title: "Play FLINTA* Harmony",
    description:
      "Engage in deep and meaningful conversations that celebrate and explore the diverse experiences of FLINTA* individuals.",
    data: flintaData,
    tagType: "new",
  },
  {
    title: "Queer Vibes",
    description:
      " A vibrant set of casual questions for lighthearted and engaging LGBTQ+ conversations.",
    data: queer,
    tagType: "beta",
  },
  {
    title: "Play Portuguese tunas pack",
    description:
      " A series of questions that highlight the academic spirit of each Tuna and the great moments and adventures that come from being part of one.",
    data: tunasData,
    tagType: "",
  },
];

export default availableModes;
