import type { IconType } from "react-icons";
import {
  FiBookmark,
  FiCalendar,
  FiCoffee,
  FiEdit3,
  FiFeather,
  FiGift,
  FiHeart,
  FiMap,
  FiMessageCircle,
  FiMoon,
  FiMusic,
  FiShield,
  FiSmile,
  FiStar,
  FiSun,
  FiSunrise,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import {
  LuFlame,
  LuGhost,
  LuSnowflake,
  LuSparkles,
  LuTreePine,
} from "react-icons/lu";
import type { DeckIconName } from "../content/types";

export interface DeckIconProps {
  name: DeckIconName;
  size?: number;
  className?: string;
}

// Feather has no flame, sparkles, ghost, tree or snowflake; Lucide (Feather's maintained fork) draws
// them with the same 2px stroke, so they sit naturally beside the Fi icons.
const deckIcons: Record<DeckIconName, IconType> = {
  message: FiMessageCircle,
  coffee: FiCoffee,
  heart: FiHeart,
  moon: FiMoon,
  star: FiStar,
  sun: FiSun,
  sunrise: FiSunrise,
  music: FiMusic,
  map: FiMap,
  flame: LuFlame,
  ghost: LuGhost,
  tree: LuTreePine,
  snowflake: LuSnowflake,
  zap: FiZap,
  shield: FiShield,
  feather: FiFeather,
  users: FiUsers,
  smile: FiSmile,
  gift: FiGift,
  sparkle: LuSparkles,
  calendar: FiCalendar,
  bookmark: FiBookmark,
  edit: FiEdit3,
};

/** Decorative deck icon: hidden from assistive tech, the deck title carries the meaning. */
export const DeckIcon = ({ name, size = 24, className }: DeckIconProps) => {
  const Icon = deckIcons[name];
  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      size={size}
      className={className}
    />
  );
};

export default DeckIcon;
