import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cache } from "./cache";
import * as schema from "./schema";
import { NewTask, NewUser, Task, User } from "./types";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

async function invalidateUserTasksCache(userId: number): Promise<void> {
  try {
    await cache.del(`tasks:userId:${userId}`);
  } catch (err) {
    console.error("Redis invalidation failed:", err);
  }
}

export async function findItemById(id: string, userId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(schema.tasksSchema).where(and(
            eq(schema.tasksSchema.id, Number(id)),
            eq(schema.tasksSchema.userId, userId)
        ));
    return task;
}

export async function listTasks(userId: number): Promise<Task[]> {
  const cacheKey = `tasks:userId:${userId}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached) as Task[];
  } catch (err) {
    console.error("Redis read failed, falling back to DB:", err);
  }

  const tasks = await db.select().from(schema.tasksSchema)
    .where(eq(schema.tasksSchema.userId, userId));

  try {
    await cache.set(cacheKey, JSON.stringify(tasks), "EX", 60);
  } catch (err) {
    console.error("Redis write failed:", err);
  }

  return tasks;
}

export async function createTask(input: NewTask): Promise<Task> {
  const [created] = await db.insert(schema.tasksSchema).values(input).returning();
  await invalidateUserTasksCache(created.userId);
  return created;
}

export async function createUser(input: NewUser): Promise<User> {
  const [created] = await db.insert(schema.usersSchema).values(input).returning();
  return created;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(schema.usersSchema)
    .where(eq(schema.usersSchema.email, email));
  return user;
}

export async function updateTask(task: Task) {
  const { id, userId, ...updates } = task;
  await db.update(schema.tasksSchema).set(updates).where(and(
    eq(schema.tasksSchema.id, id),
    eq(schema.tasksSchema.userId, userId)
  ));
  await invalidateUserTasksCache(userId);
}

export async function deleteTask(task: Task) {
  await db.delete(schema.tasksSchema).where(and(
    eq(schema.tasksSchema.id, task.id),
    eq(schema.tasksSchema.userId, task.userId)
  ));
  await invalidateUserTasksCache(task.userId);
}
