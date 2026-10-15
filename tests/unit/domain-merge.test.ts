import { describe, expect, it } from "vitest";

import { merge } from "@/domain/merge";
import { itemWireSchema, type ItemWire } from "@/domain/item";
import vectors from "../vectors/merge-vectors.json";

type Vector = { name: string; local: ItemWire; remote: ItemWire; expected: ItemWire };
const cases = vectors as Vector[];

describe("merge: shared vectors", () => {
  it("has well-formed vectors", () => {
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      for (const row of [c.local, c.remote, c.expected]) {
        expect(itemWireSchema.safeParse(row).success, c.name).toBe(true);
      }
    }
  });

  it.each(cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    expect(merge(c.local, c.remote)).toEqual(c.expected);
  });

  it.each(cases.map((c) => [c.name, c] as const))("%s: commutative", (_name, c) => {
    expect(merge(c.remote, c.local)).toEqual(merge(c.local, c.remote));
  });

  it.each(cases.map((c) => [c.name, c] as const))("%s: idempotent", (_name, c) => {
    const once = merge(c.local, c.remote);
    expect(merge(once, c.remote)).toEqual(once);
    expect(merge(once, c.local)).toEqual(once);
    expect(merge(once, once)).toEqual(once);
  });
});

describe("merge: convergence and purity", () => {
  it("converges in any order across three replicas", () => {
    const [a, b, c] = [cases[0]!.local, cases[0]!.remote, cases[1]!.remote];
    const orders = [
      merge(merge(a, b), c),
      merge(merge(c, b), a),
      merge(a, merge(b, c)),
      merge(merge(b, a), c),
    ];
    for (const result of orders) expect(result).toEqual(orders[0]);
  });

  it("does not mutate its inputs", () => {
    const c = cases[0]!;
    const local = structuredClone(c.local);
    const remote = structuredClone(c.remote);
    merge(local, remote);
    expect(local).toEqual(c.local);
    expect(remote).toEqual(c.remote);
  });
});
