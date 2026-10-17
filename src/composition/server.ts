import { createGoogleOAuthProvider } from "@/adapters/google/oauth-provider";
import { createSmtpMailer } from "@/adapters/mail/smtp-mailer";
import { createTokenGenerator } from "@/adapters/node/token-generator";
import { createPostgresDatabase, type PostgresDatabase } from "@/adapters/postgres/db";
import { createPostgresMagicLinkTokenRepository } from "@/adapters/postgres/magic-link-token-repository";
import { createPostgresSessionRepository } from "@/adapters/postgres/session-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import { createUuidIdGenerator } from "@/adapters/browser/id-generator";
import { createGoogleUseCases, type GoogleUseCases } from "@/application/auth/google";
import { createMagicLinkUseCases, type MagicLinkUseCases } from "@/application/auth/magic-link";
import { createSessionUseCases, type SessionUseCases } from "@/application/auth/sessions";
import { createPostgresCatalogCacheRepository } from "@/adapters/postgres/catalog-cache-repository";
import { createPostgresItemRepository } from "@/adapters/postgres/item-repository";
import { createOpenLibraryBookCatalogLookup } from "@/adapters/open-library/book-catalog-lookup";
import { createMusicBrainzCatalogSearch } from "@/adapters/musicbrainz/music-catalog-search";
import { createWikidataMovieCatalogSearch } from "@/adapters/wikidata/movie-catalog-search";
import { createLookupBook, type LookupBook } from "@/application/books/lookup-book";
import { createSearchBooks, type SearchBooks } from "@/application/books/search-books";
import {
  createFetchMovieCatalogDetail,
  createSearchMovies,
  type FetchMovieCatalogDetail,
  type SearchMovies,
} from "@/application/movies/search-movies";
import { createNoOpStreamingAvailabilityLookup } from "@/adapters/streaming/no-op-streaming-availability-lookup";
import { lookupMovieStreaming as lookupMovieStreamingFn } from "@/application/movies/streaming-lookup";
import {
  createSearchMusicArtists,
  createSearchMusicTracks,
  type SearchMusicArtists,
  type SearchMusicTracks,
} from "@/application/music/search-music";
import { createPostgresBookQuoteRepository } from "@/adapters/postgres/book-quote-repository";
import { createPostgresMovieQuoteRepository } from "@/adapters/postgres/movie-quote-repository";
import {
  createBookQuoteSyncService,
  type BookQuoteSyncService,
} from "@/application/server/book-quote-sync-service";
import {
  createMovieQuoteSyncService,
  type MovieQuoteSyncService,
} from "@/application/server/movie-quote-sync-service";
import type { ServerItemRepository } from "@/application/ports/server-item-repository";
import { createSyncService, type SyncService } from "@/application/server/sync-service";
import { loadConfig, type ServerConfig } from "@/composition/config";

export interface ServerContainer {
  readonly appUrl: string;
  readonly magicLink: MagicLinkUseCases;
  readonly sessions: SessionUseCases;
  readonly google: GoogleUseCases | null;
  readonly sync: SyncService;
  readonly bookQuoteSync: BookQuoteSyncService;
  readonly movieQuoteSync: MovieQuoteSyncService;
  readonly lookupBook: LookupBook;
  readonly searchBooks: SearchBooks;
  readonly searchMovies: SearchMovies;
  readonly fetchMovieCatalogDetail: FetchMovieCatalogDetail;
  readonly searchMusicArtists: SearchMusicArtists;
  readonly searchMusicTracks: SearchMusicTracks;
  readonly lookupMovieStreaming: (imdbId: string) => Promise<import("@/domain/item").StreamingProvider[]>;
  readonly destroy: () => Promise<void>;
}

export function createServerContainer(
  config: ServerConfig = loadConfig(),
  database?: PostgresDatabase,
): ServerContainer {
  const pg = database ?? createPostgresDatabase(config.databaseUrl);
  const db = pg.db;
  const tokens = createTokenGenerator();
  const ids = createUuidIdGenerator();
  const now = () => new Date();

  const users = createPostgresUserRepository(db);
  const sessions = createSessionUseCases({
    users,
    sessions: createPostgresSessionRepository(db),
    tokens,
    ids,
    now,
  });

  const magicLink = createMagicLinkUseCases({
    magicLinkTokens: createPostgresMagicLinkTokenRepository(db),
    mailer: createSmtpMailer({
      host: config.smtp.host,
      port: config.smtp.port,
      from: config.smtp.from,
      user: config.smtp.user,
      password: config.smtp.password,
    }),
    tokens,
    ids,
    now,
    appUrl: config.appUrl,
  });

  const baseUrl = config.appUrl.replace(/\/+$/, "");
  const google =
    config.google === undefined
      ? null
      : createGoogleUseCases({
          oauth: createGoogleOAuthProvider({
            clientId: config.google.clientId,
            clientSecret: config.google.clientSecret,
            redirectUri: `${baseUrl}/auth/callback`,
          }),
          signInWithIdentity: sessions.signInWithIdentity,
        });

  const items = createPostgresItemRepository(db);
  const sync = createSyncService({ repository: items, now });
  const { bookQuoteSync, movieQuoteSync } = wireServerQuoteSync(db, items, now);
  const catalogCache = createPostgresCatalogCacheRepository(db);
  const bookCatalog = createOpenLibraryBookCatalogLookup({ cache: catalogCache });
  const lookupBook = createLookupBook({ catalog: bookCatalog });
  const searchBooks = createSearchBooks({ catalog: bookCatalog });
  const movieCatalog = createWikidataMovieCatalogSearch({ cache: catalogCache });
  const searchMovies = createSearchMovies({ catalog: movieCatalog });
  const fetchMovieCatalogDetail = createFetchMovieCatalogDetail({ catalog: movieCatalog });
  const musicCatalog = createMusicBrainzCatalogSearch({ cache: catalogCache });
  const searchMusicArtists = createSearchMusicArtists({ catalog: musicCatalog });
  const searchMusicTracks = createSearchMusicTracks({ catalog: musicCatalog });
  const streamingAvailability = createNoOpStreamingAvailabilityLookup();
  const lookupMovieStreaming = (imdbId: string) =>
    lookupMovieStreamingFn(imdbId, { cache: catalogCache, lookup: streamingAvailability });

  return {
    appUrl: config.appUrl,
    magicLink,
    sessions,
    google,
    sync,
    bookQuoteSync,
    movieQuoteSync,
    lookupBook,
    searchBooks,
    searchMovies,
    fetchMovieCatalogDetail,
    searchMusicArtists,
    searchMusicTracks,
    lookupMovieStreaming,
    destroy: () => pg.destroy(),
  };
}

function wireServerQuoteSync(
  db: PostgresDatabase["db"],
  items: ServerItemRepository,
  now: () => Date,
): { bookQuoteSync: BookQuoteSyncService; movieQuoteSync: MovieQuoteSyncService } {
  const bookQuotes = createPostgresBookQuoteRepository(db);
  const movieQuotes = createPostgresMovieQuoteRepository(db);
  return {
    bookQuoteSync: createBookQuoteSyncService({ quotes: bookQuotes, items, now }),
    movieQuoteSync: createMovieQuoteSyncService({ quotes: movieQuotes, items, now }),
  };
}
