import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Film,
  Mic2,
  Music2,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import type { ItemType } from "@/domain/item";

export type ListTypeVisual = {
  /** List-type accent for stripes and icon tint (design spec §4.2). */
  accentColor: string;
  icon: LucideIcon;
};

export const LIST_TYPE_VISUAL: Record<ItemType, ListTypeVisual> = {
  shopping: { accentColor: "#65a30d", icon: ShoppingCart },
  book: { accentColor: "#9f1239", icon: BookOpen },
  movie: { accentColor: "#4338ca", icon: Film },
  recipe: { accentColor: "#c2410c", icon: UtensilsCrossed },
  music_artist: { accentColor: "#7c3aed", icon: Mic2 },
  music_track: { accentColor: "#0284c7", icon: Music2 },
};
