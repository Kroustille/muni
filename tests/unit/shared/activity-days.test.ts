import { describe, expect, it } from "vitest";

import {
  addFieldStampActivityDay,
  fieldStampToLocalDateKey,
  fieldStampToSortInstant,
  toLocalDateKey,
} from "@/application/shared/activity-days";

describe("fieldStampToLocalDateKey", () => {
  it("maps HLC sync stamps to calendar days", () => {
    const wallMs = Date.UTC(2026, 2, 10, 10, 0, 0);
    const hlc = `${wallMs}-0-test-device`;
    expect(fieldStampToLocalDateKey(hlc, "Europe/Paris")).toBe("2026-03-10");
    expect(fieldStampToSortInstant(hlc)).toBe(new Date(wallMs).toISOString());
  });

  it("accepts ISO instants and YYYY-MM-DD", () => {
    expect(fieldStampToLocalDateKey("2026-03-10T10:00:00.000Z", "Europe/Paris")).toBe(
      "2026-03-10",
    );
    expect(fieldStampToLocalDateKey("2026-03-10", "Europe/Paris")).toBe("2026-03-10");
  });

  it("returns null for garbage", () => {
    expect(fieldStampToLocalDateKey("not-a-date", "Europe/Paris")).toBeNull();
  });
});

describe("toLocalDateKey", () => {
  it("formats ISO instants", () => {
    expect(toLocalDateKey("2026-03-10T10:00:00.000Z", "Europe/Paris")).toBe("2026-03-10");
  });
});

describe("addFieldStampActivityDay", () => {
  it("adds days from HLC stamps", () => {
    const days = new Set<string>();
    addFieldStampActivityDay(days, `${Date.UTC(2026, 0, 2)}-0-dev`, "Europe/Paris");
    expect(days.has("2026-01-02")).toBe(true);
  });
});
