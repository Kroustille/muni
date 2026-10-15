import { describe, expect, it } from "vitest";

import { compareHlc, formatHlc, parseHlc, receiveHlc, tickHlc, type Hlc } from "@/domain/clock";

const DEVICE_A = "device-a";
const DEVICE_B = "device-b";

describe("formatHlc / parseHlc", () => {
  it("formats as <wallMs>-<counter>-<deviceId>", () => {
    expect(formatHlc({ wallMs: 1700000000000, counter: 3, deviceId: DEVICE_A })).toBe(
      "1700000000000-3-device-a",
    );
  });

  it("round-trips, including device ids that contain dashes", () => {
    const hlc: Hlc = {
      wallMs: 1700000000000,
      counter: 12,
      deviceId: "123e4567-e89b-12d3-a456-426614174000",
    };
    expect(parseHlc(formatHlc(hlc))).toEqual(hlc);
  });

  it("rejects malformed strings", () => {
    expect(() => parseHlc("")).toThrow();
    expect(() => parseHlc("abc-1-dev")).toThrow();
    expect(() => parseHlc("1-x-dev")).toThrow();
    expect(() => parseHlc("1-2")).toThrow();
    expect(() => parseHlc("1-2-")).toThrow();
  });
});

describe("tickHlc", () => {
  it("starts from no state using the wall clock with counter 0", () => {
    expect(tickHlc(null, DEVICE_A, 1000)).toEqual({
      wallMs: 1000,
      counter: 0,
      deviceId: DEVICE_A,
    });
  });

  it("resets the counter when wall time advances", () => {
    const prev: Hlc = { wallMs: 1000, counter: 5, deviceId: DEVICE_A };
    expect(tickHlc(prev, DEVICE_A, 2000)).toEqual({
      wallMs: 2000,
      counter: 0,
      deviceId: DEVICE_A,
    });
  });

  it("increments the counter when wall time is unchanged", () => {
    const prev: Hlc = { wallMs: 1000, counter: 0, deviceId: DEVICE_A };
    expect(tickHlc(prev, DEVICE_A, 1000)).toEqual({
      wallMs: 1000,
      counter: 1,
      deviceId: DEVICE_A,
    });
  });

  it("stays monotonic when the wall clock goes backwards", () => {
    const prev: Hlc = { wallMs: 5000, counter: 2, deviceId: DEVICE_A };
    const next = tickHlc(prev, DEVICE_A, 1000);
    expect(next.wallMs).toBe(5000);
    expect(next.counter).toBe(3);
    expect(compareHlc(formatHlc(next), formatHlc(prev))).toBeGreaterThan(0);
  });

  it("produces strictly increasing timestamps over many ticks", () => {
    let state: Hlc | null = null;
    let last = "";
    const times = [1000, 1000, 1000, 900, 1001, 1001, 500];
    for (const now of times) {
      state = tickHlc(state, DEVICE_A, now);
      const s = formatHlc(state);
      if (last) expect(compareHlc(s, last)).toBeGreaterThan(0);
      last = s;
    }
  });
});

describe("receiveHlc", () => {
  it("adopts a remote timestamp ahead of local (clock skew) and stays above it", () => {
    const local: Hlc = { wallMs: 1000, counter: 0, deviceId: DEVICE_A };
    const remote = formatHlc({ wallMs: 9000, counter: 4, deviceId: DEVICE_B });
    const next = receiveHlc(local, remote, DEVICE_A, 1000);
    expect(next.wallMs).toBe(9000);
    expect(next.counter).toBe(5);
    expect(next.deviceId).toBe(DEVICE_A);
    expect(compareHlc(formatHlc(next), remote)).toBeGreaterThan(0);
  });

  it("ignores a remote timestamp behind local and still advances", () => {
    const local: Hlc = { wallMs: 5000, counter: 1, deviceId: DEVICE_A };
    const remote = formatHlc({ wallMs: 100, counter: 9, deviceId: DEVICE_B });
    const next = receiveHlc(local, remote, DEVICE_A, 200);
    expect(next).toEqual({ wallMs: 5000, counter: 2, deviceId: DEVICE_A });
  });

  it("uses the physical clock when it is ahead of both", () => {
    const local: Hlc = { wallMs: 1000, counter: 3, deviceId: DEVICE_A };
    const remote = formatHlc({ wallMs: 2000, counter: 3, deviceId: DEVICE_B });
    expect(receiveHlc(local, remote, DEVICE_A, 8000)).toEqual({
      wallMs: 8000,
      counter: 0,
      deviceId: DEVICE_A,
    });
  });

  it("takes the max counter plus one when wall times are equal", () => {
    const local: Hlc = { wallMs: 3000, counter: 2, deviceId: DEVICE_A };
    const remote = formatHlc({ wallMs: 3000, counter: 7, deviceId: DEVICE_B });
    expect(receiveHlc(local, remote, DEVICE_A, 3000)).toEqual({
      wallMs: 3000,
      counter: 8,
      deviceId: DEVICE_A,
    });
  });

  it("works from no local state", () => {
    const remote = formatHlc({ wallMs: 4000, counter: 1, deviceId: DEVICE_B });
    const next = receiveHlc(null, remote, DEVICE_A, 10);
    expect(compareHlc(formatHlc(next), remote)).toBeGreaterThan(0);
  });
});

describe("compareHlc", () => {
  const h = (wallMs: number, counter: number, deviceId: string) =>
    formatHlc({ wallMs, counter, deviceId });

  it("orders by wall time first", () => {
    expect(compareHlc(h(1, 9, "z"), h(2, 0, "a"))).toBeLessThan(0);
    expect(compareHlc(h(2, 0, "a"), h(1, 9, "z"))).toBeGreaterThan(0);
  });

  it("orders by counter numerically, not lexicographically", () => {
    expect(compareHlc(h(1, 2, "a"), h(1, 10, "a"))).toBeLessThan(0);
  });

  it("orders wall time numerically across digit lengths", () => {
    expect(compareHlc(h(999, 0, "a"), h(1000, 0, "a"))).toBeLessThan(0);
  });

  it("breaks ties with the device id", () => {
    expect(compareHlc(h(1, 1, DEVICE_A), h(1, 1, DEVICE_B))).toBeLessThan(0);
    expect(compareHlc(h(1, 1, DEVICE_B), h(1, 1, DEVICE_A))).toBeGreaterThan(0);
  });

  it("returns 0 for identical timestamps", () => {
    expect(compareHlc(h(1, 1, DEVICE_A), h(1, 1, DEVICE_A))).toBe(0);
  });

  it("is antisymmetric", () => {
    const a = h(5, 1, DEVICE_A);
    const b = h(5, 2, DEVICE_B);
    expect(Math.sign(compareHlc(a, b))).toBe(-Math.sign(compareHlc(b, a)));
  });
});
