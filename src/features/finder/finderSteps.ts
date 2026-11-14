import type { IconType } from "react-icons";
import {
  FiCoffee,
  FiHeart,
  FiMessageCircle,
  FiShield,
  FiSmile,
  FiUserPlus,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { LuFlame, LuSparkles } from "react-icons/lu";
import type { Audience, Mood } from "../../content/types";
import type { SpiceLevel } from "./rankDecks";

export interface FinderOption<Value extends string> {
  value: Value;
  icon: IconType;
}

export const audienceOptions: FinderOption<Audience>[] = [
  { value: "new-people", icon: FiUserPlus },
  { value: "friends", icon: FiSmile },
  { value: "date", icon: FiCoffee },
  { value: "partner", icon: FiHeart },
  { value: "group", icon: FiUsers },
];

export const moodOptions: FinderOption<Mood>[] = [
  { value: "light", icon: LuSparkles },
  { value: "deep", icon: FiMessageCircle },
  { value: "playful", icon: FiZap },
  { value: "spicy", icon: LuFlame },
];

export const spiceOptions: FinderOption<SpiceLevel>[] = [
  { value: "none", icon: FiShield },
  { value: "a-little", icon: FiHeart },
  { value: "all-in", icon: LuFlame },
];

export type FinderStepName = "audience" | "mood" | "spice";

export const finderStepOrder: readonly FinderStepName[] = [
  "audience",
  "mood",
  "spice",
];
