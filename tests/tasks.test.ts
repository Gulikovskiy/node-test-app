import "dotenv/config";
import { sql } from "drizzle-orm";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupTestApp } from "./helpers/setup";

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

describe("GET /tasks", () => {
  const ctx = setupTestApp();

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  async function cleanup() {
    await ctx.db!.execute(sql`TRUNCATE TABLE "tasks", "users" RESTART IDENTITY CASCADE`);
  }

  async function registerAndLogin(email: string): Promise<string> {
    const password = "TestPassword123";

    await request(ctx.app!).post("/auth/register").send({ email, password }).expect(201);

    const response = await request(ctx.app!)
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    return response.body.data.token;
  }

  async function createTask(token: string, name: string, description = "") {
    const response = await request(ctx.app!)
      .post("/tasks")
      .auth(token, { type: "bearer" })
      .send({ name, description })
      .expect(201);

    return response.body.data;
  }

  it("returns 401 with no token", async () => {
    const response = await request(ctx.app!).get("/tasks");

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      message: "Authentication required",
    });
  });

  it("returns 200 with empty array for a new user", async () => {
    const token = await registerAndLogin("test123@gmail.com");

    const tasks = await request(ctx.app!).get("/tasks").auth(token, { type: "bearer" });

    expect(tasks.status).toBe(200);
    expect(tasks.body).toEqual({ data: [] });
  });

  it("returns only the requesting user's tasks", async () => {
    const firstUserToken = await registerAndLogin("first@gmail.com");
    const secondUserToken = await registerAndLogin("second@gmail.com");

    const firstUserTask = await createTask(firstUserToken, "First user's task", "Private");
    await createTask(secondUserToken, "Second user's task", "Also private");

    const response = await request(ctx.app!).get("/tasks").auth(firstUserToken, { type: "bearer" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([firstUserTask]);
  });

  it("returns 401 when creating a task with no token", async () => {
    const response = await request(ctx.app!)
      .post("/tasks")
      .send({ name: "New task", description: "Private" });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      message: "Authentication required",
    });
  });

  it("returns 201 with the created task", async () => {
    const token = await registerAndLogin("test123@gmail.com");

    const response = await request(ctx.app!)
      .post("/tasks")
      .auth(token, { type: "bearer" })
      .send({ name: "New task", description: "Private" });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      id: expect.any(Number),
      name: "New task",
      description: "Private",
      userId: expect.any(Number),
    });
  });

  it("returns 400 when name is missing", async () => {
    const token = await registerAndLogin("test123@gmail.com");

    const response = await request(ctx.app!)
      .post("/tasks")
      .auth(token, { type: "bearer" })
      .send({ description: "Private" });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      message: "Name must be a non-empty string",
    });
  });

  it("returns 404 when trying to update another user's task", async () => {
    const firstUserToken = await registerAndLogin("first@gmail.com");
    const secondUserToken = await registerAndLogin("second@gmail.com");
    const firstUserTask = await createTask(firstUserToken, "First user's task");

    const response = await request(ctx.app!)
      .patch(`/tasks/${firstUserTask.id}`)
      .auth(secondUserToken, { type: "bearer" })
      .send({ name: "Updated by someone else" });

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({
      message: "Task not found",
    });
  });

  it("returns 204 when deleting a task successfully", async () => {
    const token = await registerAndLogin("test123@gmail.com");
    const task = await createTask(token, "Task to delete");

    await request(ctx.app!).delete(`/tasks/${task.id}`).auth(token, { type: "bearer" }).expect(204);
  });

  it("returns 404 when trying to delete another user's task", async () => {
    const firstUserToken = await registerAndLogin("first@gmail.com");
    const secondUserToken = await registerAndLogin("second@gmail.com");
    const firstUserTask = await createTask(firstUserToken, "First user's task");

    const response = await request(ctx.app!)
      .delete(`/tasks/${firstUserTask.id}`)
      .auth(secondUserToken, { type: "bearer" });

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({
      message: "Task not found",
    });
  });
});
