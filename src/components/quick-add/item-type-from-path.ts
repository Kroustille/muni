import type { ItemType } from "@/domain/item";

/** When the user is on a typed list, quick-add can skip the type picker. */
export function itemTypeFromPath(pathname: string): ItemType | null {
  if (pathname === "/lists/shopping") return "shopping";
  if (pathname === "/lists/books") return "book";
  if (pathname === "/lists/movies") return "movie";
  if (pathname === "/lists/recipes") return "recipe";
  if (pathname === "/music/artists") return "music_artist";
  if (pathname === "/music/tracks") return "music_track";
  return null;
}
