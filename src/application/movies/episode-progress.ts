import type { EpisodeProgressMap, Item } from "@/domain/item";
import { updateItem } from "@/domain/item";

const EPISODE_KEY_PATTERN = /^S(\d+)E(\d+)$/;

function parseEpisodeKey(key: string): { season: number; episode: number } | null {
  const match = EPISODE_KEY_PATTERN.exec(key);
  if (!match) return null;
  return { season: Number(match[1]), episode: Number(match[2]) };
}

function compareEpisodeKeys(a: string, b: string): number {
  const pa = parseEpisodeKey(a);
  const pb = parseEpisodeKey(b);
  if (!pa || !pb) return a.localeCompare(b);
  if (pa.season !== pb.season) return pa.season - pb.season;
  return pa.episode - pb.episode;
}

export function computeNextEpisode(progress: EpisodeProgressMap | null): string | null {
  if (!progress) return "S1E1";
  const keys = Object.keys(progress).sort(compareEpisodeKeys);
  for (const key of keys) {
    if (progress[key]?.watchedAt === undefined) return key;
  }
  const last = keys[keys.length - 1];
  if (!last) return "S1E1";
  const parsed = parseEpisodeKey(last);
  if (!parsed) return null;
  return `S${parsed.season}E${parsed.episode + 1}`;
}

export function markEpisodeWatched(
  item: Item,
  episodeKey: string,
  watchedAt: string,
): Item {
  if (item.type !== "movie" || item.mediaKind !== "series") {
    throw new Error("episode progress only for series");
  }
  const progress: EpisodeProgressMap = { ...(item.episodeProgress ?? {}) };
  progress[episodeKey] = { watchedAt };
  const nextEpisodeKey = computeNextEpisode(progress);
  return updateItem(item, { episodeProgress: progress, nextEpisodeKey });
}
