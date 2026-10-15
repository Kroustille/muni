import { describe, expect, it } from "vitest";

import { loadConfig } from "@/composition/config";

const validEnv = {
  DATABASE_URL: "postgres://muni:muni@localhost:5432/muni",
  APP_URL: "http://localhost:3000",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_USER: "",
  SMTP_PASSWORD: "",
  SMTP_FROM: "Muni <no-reply@muni.local>",
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
};

function without(name: keyof typeof validEnv): Record<string, string> {
  const env: Record<string, string> = { ...validEnv };
  delete env[name];
  return env;
}

describe("loadConfig", () => {
  it("parses a valid environment into a typed configuration", () => {
    const config = loadConfig(validEnv);

    expect(config.databaseUrl).toBe(validEnv.DATABASE_URL);
    expect(config.appUrl).toBe("http://localhost:3000");
    expect(config.smtp).toEqual({
      host: "localhost",
      port: 1025,
      user: undefined,
      password: undefined,
      from: "Muni <no-reply@muni.local>",
    });
    expect(config.google).toEqual({
      clientId: "client-id",
      clientSecret: "client-secret",
    });
  });

  it("keeps SMTP credentials when provided", () => {
    const config = loadConfig({ ...validEnv, SMTP_USER: "u", SMTP_PASSWORD: "p" });

    expect(config.smtp.user).toBe("u");
    expect(config.smtp.password).toBe("p");
  });

  it.each([
    "DATABASE_URL",
    "APP_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_FROM",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ] as const)("fails fast naming %s when it is missing", (name) => {
    expect(() => loadConfig(without(name))).toThrow(name);
  });

  it("rejects an empty Google client id", () => {
    expect(() => loadConfig({ ...validEnv, GOOGLE_CLIENT_ID: "" })).toThrow("GOOGLE_CLIENT_ID");
  });

  it("rejects a DATABASE_URL that is not a PostgreSQL URL", () => {
    expect(() => loadConfig({ ...validEnv, DATABASE_URL: "mysql://x/y" })).toThrow("DATABASE_URL");
    expect(() => loadConfig({ ...validEnv, DATABASE_URL: "not a url" })).toThrow("DATABASE_URL");
  });

  it("rejects an APP_URL that is not an http(s) URL", () => {
    expect(() => loadConfig({ ...validEnv, APP_URL: "localhost:3000" })).toThrow("APP_URL");
    expect(() => loadConfig({ ...validEnv, APP_URL: "ftp://host" })).toThrow("APP_URL");
  });

  it.each(["abc", "0", "70000", "25.5"])("rejects SMTP_PORT %s", (port) => {
    expect(() => loadConfig({ ...validEnv, SMTP_PORT: port })).toThrow("SMTP_PORT");
  });

  it("reports every invalid variable in a single error", () => {
    const attempt = () => loadConfig({});

    expect(attempt).toThrow("DATABASE_URL");
    expect(attempt).toThrow("GOOGLE_CLIENT_SECRET");
  });
});
