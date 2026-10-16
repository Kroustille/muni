import { describe, expect, it } from "vitest";

import {
  allowedMovieStatuses,
  isMovieStatusAllowed,
} from "@/application/movies/movie-status-rules";

describe("movie status rules", () => {
  it("allows in_progress only for series", () => {
    expect(allowedMovieStatuses("series")).toContain("in_progress");
    expect(allowedMovieStatuses("film")).not.toContain("in_progress");
  });

  it("rejects in_progress on films", () => {
    expect(isMovieStatusAllowed({ mediaKind: "film", status: "in_progress" })).toBe(false);
    expect(isMovieStatusAllowed({ mediaKind: "series", status: "in_progress" })).toBe(true);
  });
});
