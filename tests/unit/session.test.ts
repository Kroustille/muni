import { describe, expect, it } from "vitest";

import { createSessionUseCases } from "@/application/session";

import { FakeAuthGateway } from "../helpers/fake-auth-gateway";
import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

function setup({ online = true }: { online?: boolean } = {}) {
  const gateway = new FakeAuthGateway();
  const repository = new InMemoryItemRepository();
  const connectivity = {
    online,
    isOnline() {
      return this.online;
    },
    onChange: () => () => {},
  };
  const useCases = createSessionUseCases({ gateway, meta: repository.meta, connectivity });
  return { gateway, meta: repository.meta, connectivity, useCases };
}

const ALICE = { userId: "user-alice", email: "alice@example.com" };

describe("client session use cases", () => {
  describe("first use (no stored user)", () => {
    it("requires sign-in when online and unauthenticated", async () => {
      const { useCases } = setup();
      expect(await useCases.open()).toEqual({ status: "sign-in-required", offline: false });
    });

    it("requires sign-in with a connection when offline", async () => {
      const { useCases, gateway } = setup({ online: false });
      expect(await useCases.open()).toEqual({ status: "sign-in-required", offline: true });
      expect(gateway.magicLinkRequests).toEqual([]);
    });

    it("requires sign-in when the server cannot be reached", async () => {
      const { useCases, gateway } = setup();
      gateway.unreachable = true;
      expect(await useCases.open()).toEqual({ status: "sign-in-required", offline: true });
    });

    it("requires sign-in when the only session is expired", async () => {
      const { useCases, gateway } = setup();
      gateway.state = { status: "expired" };
      expect(await useCases.open()).toEqual({ status: "sign-in-required", offline: false });
    });

    it("opens and stores the userId in meta after a successful sign-in", async () => {
      const { useCases, gateway, meta } = setup();
      gateway.state = { status: "authenticated", session: ALICE };
      expect(await useCases.open()).toEqual({
        status: "ready",
        userId: ALICE.userId,
        reauthRequired: false,
      });
      expect(await meta.get("userId")).toBe(ALICE.userId);
    });
  });

  describe("signed-in user", () => {
    it("opens offline from local data without asking the server", async () => {
      const { useCases, gateway, meta, connectivity } = setup();
      await meta.set("userId", ALICE.userId);
      connectivity.online = false;
      gateway.unreachable = true;
      expect(await useCases.open()).toEqual({
        status: "ready",
        userId: ALICE.userId,
        reauthRequired: false,
      });
    });

    it("opens from local data when the server is unreachable although online", async () => {
      const { useCases, gateway, meta } = setup();
      await meta.set("userId", ALICE.userId);
      gateway.unreachable = true;
      expect(await useCases.open()).toEqual({
        status: "ready",
        userId: ALICE.userId,
        reauthRequired: false,
      });
    });

    it("keeps local data accessible and flags non-blocking re-auth when the session expired", async () => {
      const { useCases, gateway, meta } = setup();
      await meta.set("userId", ALICE.userId);
      gateway.state = { status: "expired" };
      expect(await useCases.open()).toEqual({
        status: "ready",
        userId: ALICE.userId,
        reauthRequired: true,
      });
      expect(await meta.get("userId")).toBe(ALICE.userId);
    });

    it("flags re-auth when the server no longer knows the session", async () => {
      const { useCases, meta } = setup();
      await meta.set("userId", ALICE.userId);
      expect(await useCases.open()).toEqual({
        status: "ready",
        userId: ALICE.userId,
        reauthRequired: true,
      });
    });

    it("is ready without re-auth when the session is still valid", async () => {
      const { useCases, gateway, meta } = setup();
      await meta.set("userId", ALICE.userId);
      gateway.state = { status: "authenticated", session: ALICE };
      expect(await useCases.open()).toEqual({
        status: "ready",
        userId: ALICE.userId,
        reauthRequired: false,
      });
    });
  });

  describe("sign out", () => {
    it("ends the server session and forgets the user so the next open requires sign-in", async () => {
      const { useCases, gateway, meta } = setup();
      gateway.state = { status: "authenticated", session: ALICE };
      await useCases.open();

      await useCases.signOut();

      expect(gateway.signOuts).toBe(1);
      expect(await useCases.open()).toEqual({ status: "sign-in-required", offline: false });
      expect(await meta.get("userId")).toBeFalsy();
    });
  });
});
