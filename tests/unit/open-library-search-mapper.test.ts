import { describe, expect, it } from "vitest";

import { mapSearchResponseToHits } from "@/adapters/open-library/open-library-search-mapper";

describe("mapSearchResponseToHits", () => {
  it("maps docs with valid ISBN and metadata", () => {
    const hits = mapSearchResponseToHits(
      {
        docs: [
          {
            title: "Le Petit Prince",
            author_name: ["Antoine de Saint-Exupéry"],
            isbn: ["9782070368228", "invalid"],
            first_publish_year: 1943,
            publisher: ["Gallimard"],
          },
        ],
      },
      10,
    );
    expect(hits).toEqual([
      {
        isbn: "9782070368228",
        title: "Le Petit Prince",
        author: "Antoine de Saint-Exupéry",
        publicationYear: 1943,
        publisher: "Gallimard",
      },
    ]);
  });

  it("skips docs without title or valid ISBN", () => {
    expect(
      mapSearchResponseToHits(
        {
          docs: [{ title: "No ISBN" }, { isbn: ["9782070368228"] }],
        },
        10,
      ),
    ).toEqual([]);
  });
});
