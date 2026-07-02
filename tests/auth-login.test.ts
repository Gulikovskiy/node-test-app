import "dotenv/config";
import { sql } from "drizzle-orm";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { setupTestApp } from "./helpers/setup";

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

describe("POST /auth/login", () => {
  const ctx = setupTestApp();

  afterEach(async () => {
    await ctx.db!.execute(sql`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`);
  });

  it("returns 200 with a token on valid credentials", async () => {
    await request(ctx.app!)
      .post("/auth/register")
      .send({ email: "test123@gmail.com", password: "TestPassword123" })
      .expect(201);

    const response = await request(ctx.app!)
      .post("/auth/login")
      .send({ email: "test123@gmail.com", password: "TestPassword123" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      token: expect.any(String),
    });
  });

  it("returns 401 on wrong password", async () => {
    await request(ctx.app!)
      .post("/auth/register")
      .send({ email: "test123@gmail.com", password: "TestPassword123" })
      .expect(201);

    const response = await request(ctx.app!)
      .post("/auth/login")
      .send({ email: "test123@gmail.com", password: "TestPassword12" });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      message: "Invalid email or password",
    });
  });

  it("returns 401 on unknown email", async () => {
    await request(ctx.app!)
      .post("/auth/register")
      .send({ email: "test123@gmail.com", password: "TestPassword123" })
      .expect(201);

    const response = await request(ctx.app!)
      .post("/auth/login")
      .send({ email: "test_wrong@gmail.com", password: "TestPassword123" });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      message: "Invalid email or password",
    });
  });
});
