import { formatHlc, parseHlc, tickHlc, type Hlc } from "../../domain/clock";
import { normalizeMusicBrainzId } from "../../domain/musicbrainz";
import { newItem, updateItem, type Item, type ItemPatch } from "../../domain/item";
import { normalizeText } from "../../domain/text";
import type { IdGenerator } from "../ports/id-generator";
import type { ItemRepository } from "../ports/item-repository";

export type UpsertMusicArtistFromCatalogInput = {
  musicBrainzArtistId?: string | null;
  title: string;
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
};

export type UpsertMusicTrackFromCatalogInput = {
  musicBrainzRecordingId?: string | null;
  title: string;
  artist: string;
  album?: string | null;
  releaseYear?: number | null;
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
};

type UpsertDeps = {
  repository: ItemRepository;
  idGenerator: IdGenerator;
  now: () => number;
};

function catalogArtistPatch(input: UpsertMusicArtistFromCatalogInput): ItemPatch {
  const patch: ItemPatch = {
    title: input.title.trim(),
    spotifyUrl: input.spotifyUrl ?? null,
    soundcloudUrl: input.soundcloudUrl ?? null,
    deletedAt: null,
  };
  if (input.musicBrainzArtistId != null && input.musicBrainzArtistId.trim() !== "") {
    patch.musicBrainzArtistId = normalizeMusicBrainzId(input.musicBrainzArtistId);
  }
  return patch;
}

function catalogTrackPatch(input: UpsertMusicTrackFromCatalogInput): ItemPatch {
  const patch: ItemPatch = {
    title: input.title.trim(),
    artist: input.artist.trim(),
    album: input.album ?? null,
    releaseYear: input.releaseYear ?? null,
    spotifyUrl: input.spotifyUrl ?? null,
    soundcloudUrl: input.soundcloudUrl ?? null,
    deletedAt: null,
  };
  if (input.musicBrainzRecordingId != null && input.musicBrainzRecordingId.trim() !== "") {
    patch.musicBrainzRecordingId = normalizeMusicBrainzId(input.musicBrainzRecordingId);
  }
  return patch;
}

function findManualArtistMerge(
  artists: Item[],
  catalogTitle: string,
): Item | undefined {
  const titleKey = normalizeText(catalogTitle);
  const candidates = artists.filter(
    (row) =>
      row.deletedAt === null &&
      (row.musicBrainzArtistId === null || row.musicBrainzArtistId === "") &&
      normalizeText(row.title) === titleKey,
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

function findManualTrackMerge(
  tracks: Item[],
  catalogTitle: string,
  catalogArtist: string,
): Item | undefined {
  const titleKey = normalizeText(catalogTitle);
  const artistKey = normalizeText(catalogArtist);
  const candidates = tracks.filter(
    (row) =>
      row.deletedAt === null &&
      (row.musicBrainzRecordingId === null || row.musicBrainzRecordingId === "") &&
      normalizeText(row.title) === titleKey &&
      normalizeText(row.artist ?? "") === artistKey,
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

function createUpsertFactory({ repository, idGenerator, now }: UpsertDeps) {
  async function deviceId(): Promise<string> {
    const existing = await repository.meta.get("deviceId");
    if (existing !== undefined) return existing;
    const created = idGenerator.newId();
    await repository.meta.set("deviceId", created);
    return created;
  }

  async function loadClock(): Promise<Hlc | null> {
    const state = await repository.meta.get("hlcState");
    return state === undefined ? null : parseHlc(state);
  }

  async function nextStamp(): Promise<string> {
    const next = tickHlc(await loadClock(), await deviceId(), now());
    const stamp = formatHlc(next);
    await repository.meta.set("hlcState", stamp);
    return stamp;
  }

  async function stampPatch(patch: ItemPatch): Promise<ItemPatch> {
    const stamp = await nextStamp();
    const keys = Object.keys(patch).filter((key) => key !== "fieldsUpdatedAt");
    return {
      ...patch,
      fieldsUpdatedAt: Object.fromEntries(keys.map((key) => [key, stamp])),
    };
  }

  async function upsertByMbid(
    type: "music_artist" | "music_track",
    rows: Item[],
    mbid: string | null,
    mbidField: "musicBrainzArtistId" | "musicBrainzRecordingId",
    patch: ItemPatch,
    createInput: UpsertMusicArtistFromCatalogInput | UpsertMusicTrackFromCatalogInput,
    manualFind: () => Item | undefined,
  ): Promise<Item> {
    let active: Item | undefined;
    let deleted: Item | undefined;
    if (mbid !== null) {
      const matches = rows.filter((row) => row[mbidField] === mbid);
      active = matches.find((row) => row.deletedAt === null);
      deleted = matches.find((row) => row.deletedAt !== null);
    }

    const stamped = await stampPatch(patch);

    if (active !== undefined) {
      const updated = updateItem(active, stamped);
      await repository.put(updated, { enqueue: true });
      return updated;
    }

    if (deleted !== undefined) {
      const updated = updateItem(deleted, stamped);
      await repository.put(updated, { enqueue: true });
      return updated;
    }

    const manual = manualFind();
    if (manual !== undefined) {
      const updated = updateItem(manual, stamped);
      await repository.put(updated, { enqueue: true });
      return updated;
    }

    const createdAt = new Date(now()).toISOString();
    const { fieldsUpdatedAt: _ignored, deletedAt: _del, ...createFields } = stamped;
    const created = newItem({
      id: idGenerator.newId(),
      type,
      title: createInput.title.trim(),
      createdAt,
      ...createFields,
    } as never);
    const stamp = await nextStamp();
    const provided = Object.entries(createFields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key]) => key);
    const stampedCreate: Item = {
      ...created,
      fieldsUpdatedAt: Object.fromEntries(["title", ...provided].map((key) => [key, stamp])),
    };
    await repository.put(stampedCreate, { enqueue: true });
    return stampedCreate;
  }

  return { upsertByMbid, stampPatch };
}

export function createUpsertMusicArtistFromCatalog(deps: UpsertDeps) {
  const { upsertByMbid } = createUpsertFactory(deps);

  return async function upsertMusicArtistFromCatalog(
    input: UpsertMusicArtistFromCatalogInput,
  ): Promise<Item> {
    const artists = await deps.repository.query({ type: "music_artist", includeDeleted: true });
    const mbid =
      input.musicBrainzArtistId != null && input.musicBrainzArtistId.trim() !== ""
        ? normalizeMusicBrainzId(input.musicBrainzArtistId)
        : null;
    const patch = catalogArtistPatch({ ...input, musicBrainzArtistId: mbid });
    return upsertByMbid(
      "music_artist",
      artists,
      mbid,
      "musicBrainzArtistId",
      patch,
      input,
      () => findManualArtistMerge(artists, input.title),
    );
  };
}

export function createUpsertMusicTrackFromCatalog(deps: UpsertDeps) {
  const { upsertByMbid } = createUpsertFactory(deps);

  return async function upsertMusicTrackFromCatalog(
    input: UpsertMusicTrackFromCatalogInput,
  ): Promise<Item> {
    const tracks = await deps.repository.query({ type: "music_track", includeDeleted: true });
    const mbid =
      input.musicBrainzRecordingId != null && input.musicBrainzRecordingId.trim() !== ""
        ? normalizeMusicBrainzId(input.musicBrainzRecordingId)
        : null;
    const patch = catalogTrackPatch({ ...input, musicBrainzRecordingId: mbid });
    return upsertByMbid(
      "music_track",
      tracks,
      mbid,
      "musicBrainzRecordingId",
      patch,
      input,
      () => findManualTrackMerge(tracks, input.title, input.artist),
    );
  };
}
