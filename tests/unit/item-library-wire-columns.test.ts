import { describe, expect, it } from "vitest";

import { BOOK_ITEM_FIELD_KEYS } from "@/domain/item-book";
import { MOVIE_ITEM_FIELD_KEYS } from "@/domain/item-movie";
import {
  BOOK_LIBRARY_WIRE_COLUMNS,
  MOVIE_LIBRARY_WIRE_COLUMNS,
  itemFieldWireName,
} from "@/domain/item";

describe("library field wire columns", () => {
  it("maps book library fields to snake_case wire columns", () => {
    expect(BOOK_LIBRARY_WIRE_COLUMNS).toEqual(
      BOOK_ITEM_FIELD_KEYS.map((field) => itemFieldWireName(field)),
    );
    expect(BOOK_LIBRARY_WIRE_COLUMNS).toContain("pages_read");
    expect(BOOK_LIBRARY_WIRE_COLUMNS).toContain("loaned_at");
  });

  it("maps movie library fields to snake_case wire columns", () => {
    expect(MOVIE_LIBRARY_WIRE_COLUMNS).toEqual(
      MOVIE_ITEM_FIELD_KEYS.map((field) => itemFieldWireName(field)),
    );
    expect(MOVIE_LIBRARY_WIRE_COLUMNS).toContain("episode_progress");
    expect(MOVIE_LIBRARY_WIRE_COLUMNS).toContain("streaming_providers");
  });
});
