import type { LucideIcon } from "lucide-react";
import { CalendarRange, Dumbbell, Home, Search, Settings } from "lucide-react";
import type { ItemType } from "@/domain/item";
import type { MessageKey } from "@/i18n";

export type PrimaryNavItem = {
  href: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

export const PRIMARY_NAV: PrimaryNavItem[] = [
  {
    href: "/",
    labelKey: "nav.home",
    icon: Home,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/search",
    labelKey: "nav.search",
    icon: Search,
    match: (pathname) => pathname === "/search" || pathname.startsWith("/search/"),
  },
  {
    href: "/recap",
    labelKey: "recap.nav",
    icon: CalendarRange,
    match: (pathname) => pathname === "/recap" || pathname.startsWith("/recap/"),
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: Settings,
    match: (pathname) => pathname === "/settings" || pathname.startsWith("/settings/"),
  },
];

export type ListNavItem = {
  href: string;
  labelKey: MessageKey;
  itemType: ItemType;
  match: (pathname: string) => boolean;
};

export type FeatureNavItem = {
  href: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

export const FEATURE_NAV: FeatureNavItem[] = [
  {
    href: "/fitness",
    labelKey: "fitness.nav",
    icon: Dumbbell,
    match: (p) => p === "/fitness" || p.startsWith("/fitness/"),
  },
];

export const LIST_NAV: ListNavItem[] = [
  {
    href: "/lists/shopping",
    labelKey: "list.shopping",
    itemType: "shopping",
    match: (p) => p === "/lists/shopping" || p.startsWith("/lists/shopping/"),
  },
  {
    href: "/lists/books",
    labelKey: "list.books",
    itemType: "book",
    match: (p) => p === "/lists/books" || p.startsWith("/lists/books/"),
  },
  {
    href: "/lists/movies",
    labelKey: "list.movies",
    itemType: "movie",
    match: (p) => p === "/lists/movies" || p.startsWith("/lists/movies/"),
  },
  {
    href: "/lists/recipes",
    labelKey: "list.recipes",
    itemType: "recipe",
    match: (p) => p === "/lists/recipes" || p.startsWith("/lists/recipes/"),
  },
  {
    href: "/music/artists",
    labelKey: "list.musicArtists",
    itemType: "music_artist",
    match: (p) => p === "/music/artists" || p.startsWith("/music/artists/"),
  },
  {
    href: "/music/tracks",
    labelKey: "list.musicTracks",
    itemType: "music_track",
    match: (p) => p === "/music/tracks" || p.startsWith("/music/tracks/"),
  },
];
