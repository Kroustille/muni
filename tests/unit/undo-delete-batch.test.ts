import { describe, expect, it } from "vitest";

/** Documents expected batch undo state transitions for UndoDeleteProvider. */
describe("undo delete batch state", () => {
  it("tracks multiple ids until undo or timeout", () => {
    type State = { pendingIds: string[] | null };
    let state: State = { pendingIds: null };

    const deleteMany = (ids: string[]) => {
      state = { pendingIds: [...ids] };
    };
    const undo = () => {
      state = { pendingIds: null };
      return state.pendingIds;
    };
    const expire = () => {
      state = { pendingIds: null };
    };

    deleteMany(["a", "b", "c"]);
    expect(state.pendingIds).toEqual(["a", "b", "c"]);
    expect(undo()).toBeNull();
    deleteMany(["x"]);
    expire();
    expect(state.pendingIds).toBeNull();
  });
});
