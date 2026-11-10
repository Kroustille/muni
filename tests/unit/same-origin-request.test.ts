import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "@/app/api/_lib/auth-cookies";

const appUrl = "https://muni.example";

const req = (headers: Record<string, string>) =>
  new Request(`${appUrl}/api/sync/cookbooks/pull`, { headers });

describe("isSameOriginRequest", () => {
  it("accepts a matching Origin header", () => {
    expect(isSameOriginRequest(req({ origin: appUrl }), appUrl)).toBe(true);
  });

  it("rejects a different Origin header", () => {
    expect(isSameOriginRequest(req({ origin: "https://evil.example" }), appUrl)).toBe(false);
  });

  it("rejects a different Origin even when Sec-Fetch-Site claims same-origin", () => {
    const request = req({ origin: "https://evil.example", "sec-fetch-site": "same-origin" });
    expect(isSameOriginRequest(request, appUrl)).toBe(false);
  });

  it("accepts a same-origin browser GET without Origin (Sec-Fetch-Site: same-origin)", () => {
    expect(isSameOriginRequest(req({ "sec-fetch-site": "same-origin" }), appUrl)).toBe(true);
  });

  it("rejects requests without Origin from other sites", () => {
    expect(isSameOriginRequest(req({ "sec-fetch-site": "cross-site" }), appUrl)).toBe(false);
    expect(isSameOriginRequest(req({ "sec-fetch-site": "same-site" }), appUrl)).toBe(false);
  });

  it("rejects requests with neither header", () => {
    expect(isSameOriginRequest(req({}), appUrl)).toBe(false);
  });
});
