import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value === undefined || value === "" ? undefined : value));

const httpUrl = z.string().refine((value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "must be an http(s) URL");

const postgresUrl = z.string().refine((value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}, "must be a PostgreSQL URL");

const envSchema = z
  .object({
    DATABASE_URL: postgresUrl,
    APP_URL: httpUrl,
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z
      .string()
      .regex(/^\d+$/, "must be an integer")
      .transform(Number)
      .refine((port) => port >= 1 && port <= 65535, "must be between 1 and 65535"),
    SMTP_USER: optionalString,
    SMTP_PASSWORD: optionalString,
    SMTP_FROM: z.string().min(1),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.GOOGLE_CLIENT_ID !== undefined && env.GOOGLE_CLIENT_SECRET === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["GOOGLE_CLIENT_SECRET"],
        message: "is required when GOOGLE_CLIENT_ID is set",
      });
    }
    if (env.GOOGLE_CLIENT_SECRET !== undefined && env.GOOGLE_CLIENT_ID === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["GOOGLE_CLIENT_ID"],
        message: "is required when GOOGLE_CLIENT_SECRET is set",
      });
    }
  });

export interface ServerConfig {
  readonly databaseUrl: string;
  readonly appUrl: string;
  readonly smtp: {
    readonly host: string;
    readonly port: number;
    readonly user: string | undefined;
    readonly password: string | undefined;
    readonly from: string;
  };
  readonly google: { readonly clientId: string; readonly clientSecret: string } | undefined;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server configuration: ${details}`);
  }
  const parsed = result.data;
  return {
    databaseUrl: parsed.DATABASE_URL,
    appUrl: parsed.APP_URL,
    smtp: {
      host: parsed.SMTP_HOST,
      port: parsed.SMTP_PORT,
      user: parsed.SMTP_USER,
      password: parsed.SMTP_PASSWORD,
      from: parsed.SMTP_FROM,
    },
    google:
      parsed.GOOGLE_CLIENT_ID !== undefined && parsed.GOOGLE_CLIENT_SECRET !== undefined
        ? { clientId: parsed.GOOGLE_CLIENT_ID, clientSecret: parsed.GOOGLE_CLIENT_SECRET }
        : undefined,
  };
}
