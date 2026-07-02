import "dotenv/config";
import { sql } from "drizzle-orm";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { setupTestApp } from "./helpers/setup";

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

describe("POST /auth/register", () => {
  const ctx = setupTestApp();

  afterEach(async () => {
    await ctx.db!.execute(sql`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`);
  });

  it("returns 201 with id and email, without passwordHash", async () => {
    const response = await request(ctx.app!)
      .post("/auth/register")
      .send({ email: "test123@gmail.com", password: "TestPassword123" });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      id: expect.any(Number),
      email: "test123@gmail.com",
    });
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });

  it("returns 409 on duplicate email", async () => {
    const body = { email: "duplicate@gmail.com", password: "TestPassword123" };

    await request(ctx.app!).post("/auth/register").send(body).expect(201);
    const response = await request(ctx.app!).post("/auth/register").send(body);

    expect(response.status).toBe(409);
  });

  it.each([
    { email: "not-an-email", password: "TestPassword123" },
    { email: "short-password@gmail.com", password: "short" },
  ])("returns 400 on invalid input: %o", async (body) => {
    const response = await request(ctx.app!).post("/auth/register").send(body);

    expect(response.status).toBe(400);
  });
});
