import type { Item } from "@/domain/item";

export type AssignMoviesToFranchiseInput = {
  movies: readonly Item[];
  ids: readonly string[];
  franchiseName: string;
  franchiseOrder: number;
  franchiseId?: string;
};

export type AssignMoviesToFranchiseResult = {
  franchiseId: string;
  patches: Array<{ id: string; franchiseName: string; franchiseOrder: number; franchiseId: string }>;
};

export function assignMoviesToFranchise({
  movies,
  ids,
  franchiseName,
  franchiseOrder,
  franchiseId: existingFranchiseId,
}: AssignMoviesToFranchiseInput): AssignMoviesToFranchiseResult {
  const name = franchiseName.trim();
  if (name === "" || !Number.isFinite(franchiseOrder)) {
    return { franchiseId: existingFranchiseId ?? "", patches: [] };
  }
  const franchiseId = existingFranchiseId ?? crypto.randomUUID();
  const idSet = new Set(ids);
  const patches: AssignMoviesToFranchiseResult["patches"] = [];
  for (const item of movies) {
    if (item.type !== "movie" || !idSet.has(item.id)) continue;
    patches.push({
      id: item.id,
      franchiseName: name,
      franchiseOrder,
      franchiseId,
    });
  }
  return { franchiseId, patches };
}
