import { describe, expect, it, vi } from "vitest";

import { assignMoviesToFranchise } from "@/application/movies/assign-franchise-bulk";
import { newItem } from "@/domain/item";

describe("assignMoviesToFranchise", () => {
  const movies = [
    newItem({
      id: "00000000-0000-4000-8000-000000000021",
      type: "movie",
      title: "A",
      createdAt: "2026-01-01T00:00:00.000Z",
    }),
    newItem({
      id: "00000000-0000-4000-8000-000000000022",
      type: "movie",
      title: "B",
      createdAt: "2026-01-01T00:00:00.000Z",
    }),
  ];

  it("assigns shared franchiseId for new saga", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "franchise-uuid-1" });
    const { franchiseId, patches } = assignMoviesToFranchise({
      movies,
      ids: ["00000000-0000-4000-8000-000000000021", "00000000-0000-4000-8000-000000000022"],
      franchiseName: "MCU",
      franchiseOrder: 1,
    });
    expect(franchiseId).toBe("franchise-uuid-1");
    expect(patches).toEqual([
      {
        id: "00000000-0000-4000-8000-000000000021",
        franchiseName: "MCU",
        franchiseOrder: 1,
        franchiseId: "franchise-uuid-1",
      },
      {
        id: "00000000-0000-4000-8000-000000000022",
        franchiseName: "MCU",
        franchiseOrder: 1,
        franchiseId: "franchise-uuid-1",
      },
    ]);
    vi.unstubAllGlobals();
  });

  it("reuses provided franchiseId", () => {
    const { franchiseId, patches } = assignMoviesToFranchise({
      movies,
      ids: ["00000000-0000-4000-8000-000000000021"],
      franchiseName: "MCU",
      franchiseOrder: 2,
      franchiseId: "existing-id",
    });
    expect(franchiseId).toBe("existing-id");
    expect(patches[0]?.franchiseId).toBe("existing-id");
  });
});
