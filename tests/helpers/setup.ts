import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, vi } from "vitest";

vi.mock("../../src/cache", () => ({
  cache: {
    del: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

export function setupTestApp() {
  const ctx = {
    app: undefined as Awaited<typeof import("../../src/server")>["app"] | undefined,
    db: undefined as Awaited<typeof import("../../src/store")>["db"] | undefined,
    dbClient: undefined as Awaited<typeof import("../../src/store")>["dbClient"] | undefined,
  };

  beforeAll(async () => {
    const store = await import("../../src/store");
    ctx.db = store.db;
    ctx.dbClient = store.dbClient;

    await ctx.db.execute(sql`SET client_min_messages TO warning`);
    await migrate(ctx.db, { migrationsFolder: "./drizzle" });

    const server = await import("../../src/server");
    ctx.app = server.app;
  });

  afterAll(async () => {
    await ctx.dbClient!.end();
  });

  return ctx;
}
